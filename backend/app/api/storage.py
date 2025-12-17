"""
Endpoints para gestión de almacenamiento de archivos e imágenes
Sigue el patrón del proyecto: endpoints delgados que delegan a servicios
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB
from app.services import storage_service

router = APIRouter(prefix="/api/storage", tags=["Storage"])


@router.post("/upload-daily-record-image")
async def upload_daily_record_image(
    file: UploadFile = File(...),
    chofer_id: int = Form(...),
    fecha: str = Form(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Endpoint para subir imágenes de comprobantes de daily records.
    
    Validaciones realizadas en el servicio:
    - Verificar que el usuario autenticado sea el chofer indicado
    - Validar tamaño del archivo (máx 10MB)
    - Validar Magic Bytes (tipo real del archivo)
    - Subir a Supabase Storage con estructura organizada
    - Retornar URL pública
    
    Args:
        file: Archivo de imagen a subir
        chofer_id: ID del chofer que sube la imagen
        fecha: Fecha del reporte (formato YYYY-MM-DD)
        current_user: Usuario autenticado (inyectado automáticamente)
    
    Returns:
        JSONResponse con url, path, size y mime_type del archivo subido
    """
    result = await storage_service.upload_daily_record_image(
        file=file,
        chofer_id=chofer_id,
        fecha=fecha,
        current_user=current_user
    )
    
    return JSONResponse(
        status_code=200,
        content=result
    )


@router.post("/upload-daily-record-image-admin")
async def upload_daily_record_image_admin(
    file: UploadFile = File(...),
    chofer_id: int = Form(...),
    fecha: str = Form(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Endpoint para que administradores suban imágenes de comprobantes de daily records.
    Permite subir imágenes para cualquier chofer (no valida que el usuario sea el chofer).
    
    Validaciones realizadas en el servicio:
    - Verificar que el usuario sea administrador
    - Validar tamaño del archivo (máx 10MB)
    - Validar Magic Bytes (tipo real del archivo)
    - Optimizar imagen (redimensionar, convertir a WebP, comprimir)
    - Subir a Supabase Storage en la carpeta del chofer indicado
    - Retornar URL pública
    
    Args:
        file: Archivo de imagen a subir
        chofer_id: ID del chofer para el cual se sube la imagen
        fecha: Fecha del reporte (formato YYYY-MM-DD)
        current_user: Usuario autenticado (debe ser admin)
    
    Returns:
        JSONResponse con url, path, size y mime_type del archivo subido
    """
    require_admin(current_user)  # Validar que sea admin
    
    result = await storage_service.upload_daily_record_image_admin(
        file=file,
        chofer_id=chofer_id,
        fecha=fecha,
        current_user=current_user
    )
    
    return JSONResponse(
        status_code=200,
        content=result
    )
