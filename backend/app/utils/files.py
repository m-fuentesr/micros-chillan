"""
Utilidades para manejo de archivos e imágenes
Funciones helper para validación y procesamiento de archivos
"""
from typing import Optional, Tuple
import re
import unicodedata


def create_safe_folder_name(primer_nombre: str, apellido_paterno: str, apellido_materno: Optional[str] = None) -> str:
    """
    Crea un nombre de carpeta seguro a partir del nombre y apellidos del chofer.
    Convierte a minúsculas, elimina acentos, reemplaza espacios por guiones.
    
    Ejemplo: "Juan Pérez González" -> "juan-perez-gonzalez"
    
    Args:
        primer_nombre: Primer nombre del chofer
        apellido_paterno: Apellido paterno del chofer
        apellido_materno: Apellido materno del chofer (opcional)
    
    Returns:
        Nombre de carpeta seguro y normalizado
    """
    # Combinar nombre y apellidos
    parts = [primer_nombre, apellido_paterno]
    if apellido_materno:
        parts.append(apellido_materno)
    
    # Unir y normalizar
    full_name = " ".join(parts)
    
    # Normalizar caracteres Unicode (quitar acentos)
    normalized = unicodedata.normalize('NFD', full_name)
    # Eliminar marcas diacríticas (acentos)
    without_accents = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    
    # Convertir a minúsculas y reemplazar espacios y caracteres especiales
    safe_name = re.sub(r'[^a-z0-9]+', '-', without_accents.lower())
    # Eliminar guiones al inicio y final
    safe_name = safe_name.strip('-')
    
    # Limitar longitud (para evitar problemas con nombres muy largos)
    if len(safe_name) > 50:
        safe_name = safe_name[:50]
    
    return safe_name


def validate_magic_bytes(file_content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Valida el tipo real del archivo usando Magic Bytes (Capa 2 de validación).
    No confía en la extensión o Content-Type del cliente.
    
    Args:
        file_content: Contenido del archivo en bytes
    
    Returns:
        Tupla (is_valid, mime_type) donde:
        - is_valid: True si el archivo es una imagen válida
        - mime_type: Tipo MIME detectado ('image/jpeg', 'image/png', 'image/webp', 'image/jfif', 'image/heic', 'image/bmp') o None
    """
    try:
        # Verificar magic bytes manualmente (más portable que python-magic)
        if len(file_content) < 12:
            return False, None
        
        # JPEG/JFIF: FF D8 FF
        # JFIF es una variante de JPEG, tiene los mismos magic bytes pero puede contener "JFIF" en los primeros bytes
        if file_content.startswith(b'\xff\xd8\xff'):
            # Verificar si es JFIF específicamente (contiene "JFIF" en los primeros 20 bytes)
            if b'JFIF' in file_content[:20]:
                return True, 'image/jfif'
            return True, 'image/jpeg'
        
        # PNG: 89 50 4E 47 0D 0A 1A 0A
        if file_content.startswith(b'\x89PNG\r\n\x1a\n'):
            return True, 'image/png'
        
        # WebP: RIFF....WEBP
        if file_content.startswith(b'RIFF') and b'WEBP' in file_content[8:12]:
            return True, 'image/webp'
        
        # HEIC/HEIF: ftyp en offset 4, luego heic/heix/heim/mif1 en offset 8
        # Ejemplo: 00 00 00 18 66 74 79 70 68 65 69 63
        if len(file_content) >= 12 and file_content[4:8] == b'ftyp':
            brand = file_content[8:12]
            # Variantes de HEIC/HEIF
            if brand in [b'heic', b'heix', b'heim', b'heis', b'mif1', b'msf1', b'hevc', b'hevx']:
                return True, 'image/heic'
        
        # BMP: 42 4D (BM en ASCII)
        if file_content.startswith(b'BM'):
            return True, 'image/bmp'
        
        # GIF: 47 49 46 38 (opcional, pero no está en ALLOWED_MIME_TYPES)
        # if file_content.startswith(b'GIF87a') or file_content.startswith(b'GIF89a'):
        #     return True, 'image/gif'
        
        return False, None
    except Exception as e:
        print(f"Error validando magic bytes: {e}")
        return False, None
