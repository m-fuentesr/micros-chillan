"""
Servicio para gestión de almacenamiento de archivos e imágenes
Maneja la subida de imágenes a Supabase Storage con validaciones de seguridad
y optimización automática de imágenes
"""
from fastapi import HTTPException, UploadFile, status
from typing import Optional, Tuple
from datetime import datetime
import uuid
import io
from PIL import Image, ImageOps  # Pillow para optimización
from app.db.supabase_client import supabase
from app.utils.files import create_safe_folder_name, validate_magic_bytes
from app.core.config import settings
from app.schemas.user import UserInDB

# Configuración
ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB Entrada (antes de comprimir)
STORAGE_BUCKET = 'daily-records'  # Nombre del bucket en Supabase

# Configuración de optimización
MAX_DIMENSION = 1280  # HD (720p/landscape) - suficiente para comprobantes
QUALITY = 80  # Sweet spot calidad/tamaño


def process_and_optimize_image(
    file_content: bytes, 
    max_dimension: int = MAX_DIMENSION, 
    quality: int = QUALITY
) -> Tuple[bytes, str, str]:
    """
    Procesa la imagen en memoria: Redimensiona, convierte a WebP y comprime.
    
    Args:
        file_content: Contenido de la imagen en bytes
        max_dimension: Dimensión máxima (lado más largo) en píxeles
        quality: Calidad de compresión (0-100)
    
    Returns:
        Tuple: (contenido_optimizado_bytes, mime_type, extension)
    
    Raises:
        HTTPException: Si hay error al procesar la imagen
    """
    try:
        # 1. Cargar imagen desde bytes
        with Image.open(io.BytesIO(file_content)) as img:
            
            # 2. Corregir orientación basada en EXIF (común en fotos de celular)
            img = ImageOps.exif_transpose(img)
            
            # 3. Convertir a RGB (necesario si viene PNG con transparencia o CMYK)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Crear fondo blanco para transparencias
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])  # Usar canal alpha como máscara
                else:
                    background.paste(img)
                img = background
            elif img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            
            # 4. Calcular nuevas dimensiones manteniendo Aspect Ratio
            if max(img.size) > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            
            # 5. Guardar en buffer de memoria como WebP
            output_buffer = io.BytesIO()
            img.save(
                output_buffer, 
                format='WEBP', 
                quality=quality, 
                optimize=True,
                method=6  # Método de compresión (0-6, 6 es más lento pero mejor compresión)
            )
            
            # Obtener bytes finales
            optimized_content = output_buffer.getvalue()
            
            return optimized_content, 'image/webp', 'webp'
            
    except Exception as e:
        print(f"Error optimizando imagen: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error al procesar/optimizar la imagen: {str(e)}"
        )


async def upload_daily_record_image(
    file: UploadFile,
    chofer_id: int,
    fecha: str,
    current_user: UserInDB
) -> dict:
    """
    Sube una imagen de comprobante de daily record a Supabase Storage.
    Optimiza automáticamente la imagen antes de subirla.
    
    Validaciones:
    1. Verificar que el usuario autenticado sea el chofer indicado
    2. Validar tamaño del archivo
    3. Validar Magic Bytes (tipo real del archivo)
    4. Optimizar imagen (redimensionar, convertir a WebP, comprimir)
    5. Subir a Supabase Storage con estructura organizada
    6. Retornar URL pública
    
    Args:
        file: Archivo de imagen a subir
        chofer_id: ID del chofer que sube la imagen
        fecha: Fecha del reporte (formato YYYY-MM-DD)
        current_user: Usuario autenticado actual
    
    Returns:
        Dict con url, path, size, original_size, mime_type del archivo subido
    
    Raises:
        HTTPException: Si hay errores de validación o al subir el archivo
    """
    # Verificar que el usuario autenticado sea el chofer indicado
    user_chofer_id = current_user.chofer_id
    if not user_chofer_id or user_chofer_id != chofer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para subir imágenes para este chofer"
        )
    
    # Obtener datos del chofer para crear nombre de carpeta
    folder_name = await _get_chofer_folder_name(chofer_id)
    
    # Leer contenido del archivo
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validaciones iniciales (Tamaño y Magic Bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Archivo muy grande. Máximo: {MAX_FILE_SIZE/1024/1024:.0f}MB"
        )
    
    if file_size < 1024:  # Mínimo 1KB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo parece estar corrupto o vacío"
        )
    
    is_valid, detected_mime = validate_magic_bytes(file_content)
    if not is_valid or detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo no válido."
        )

    # --- OPTIMIZACIÓN DE IMAGEN ---
    # Procesamos la imagen. Esto es CPU-bound.
    # En tráfico muy alto, considerar run_in_threadpool, pero para daily records está ok.
    optimized_content, final_mime_type, final_extension = process_and_optimize_image(
        file_content,
        max_dimension=MAX_DIMENSION,
        quality=QUALITY
    )
    
    final_size = len(optimized_content)
    # -----------------------------------------------

    # Generar nombre (Ahora forzamos la extensión .webp)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    file_name = f"{folder_name}/{fecha}/{timestamp}_{unique_id}.{final_extension}"
    
    try:
        storage_bucket = supabase.storage.from_(STORAGE_BUCKET)
        
        # Subimos el contenido OPTIMIZADO
        upload_response = storage_bucket.upload(
            file_name,
            optimized_content,  # Usamos el buffer optimizado
            file_options={
                "content-type": final_mime_type,  # "image/webp"
                "upsert": False
            }
        )
        
        if hasattr(upload_response, 'error') and upload_response.error:
            raise Exception(upload_response.error.message)
        
        # Obtener URL pública
        public_url = _get_public_url(storage_bucket, file_name)
        
        if not public_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener la URL pública del archivo"
            )
        
        return {
            "url": public_url,
            "path": file_name,
            "size": final_size,         # Tamaño final optimizado
            "original_size": file_size, # Para que veas cuánto ahorraste
            "mime_type": final_mime_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error upload pipeline: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando la subida de la imagen: {str(e)}"
        )


async def _get_chofer_folder_name(chofer_id: int) -> str:
    """
    Obtiene el nombre de carpeta seguro para un chofer.
    
    Args:
        chofer_id: ID del chofer
    
    Returns:
        Nombre de carpeta seguro basado en el nombre del chofer
    """
    try:
        chofer_response = (
            supabase.table("choferes")
            .select("primer_nombre, apellido_paterno, apellido_materno")
            .eq("id", chofer_id)
            .single()
            .execute()
        )
        
        if not chofer_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chofer no encontrado"
            )
        
        chofer_data = chofer_response.data
        folder_name = create_safe_folder_name(
            chofer_data.get("primer_nombre", ""),
            chofer_data.get("apellido_paterno", ""),
            chofer_data.get("apellido_materno")
        )
        
        # Si no se pudo crear un nombre válido, usar el ID como fallback
        if not folder_name:
            folder_name = f"chofer_{chofer_id}"
        
        return folder_name
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error obteniendo datos del chofer: {e}")
        # Fallback: usar ID si hay error
        return f"chofer_{chofer_id}"


def _get_public_url(storage_bucket, file_name: str) -> Optional[str]:
    """
    Obtiene la URL pública de un archivo en Supabase Storage.
    
    Args:
        storage_bucket: Bucket de Supabase Storage
        file_name: Nombre del archivo en el storage
    
    Returns:
        URL pública del archivo o None si no se pudo obtener
    """
    try:
        public_url_data = storage_bucket.get_public_url(file_name)
        
        # La respuesta puede ser un dict o un objeto con atributo publicUrl
        if isinstance(public_url_data, dict):
            return public_url_data.get('publicUrl', '')
        elif hasattr(public_url_data, 'publicUrl'):
            return public_url_data.publicUrl
        elif isinstance(public_url_data, str):
            return public_url_data
        else:
            # Construir URL manualmente si es necesario
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{file_name}"
    except Exception as e:
        print(f"Error obteniendo URL pública: {e}")
        # Fallback: construir URL manualmente
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{file_name}"
