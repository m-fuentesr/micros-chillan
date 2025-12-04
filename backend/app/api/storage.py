"""
Endpoints para gestión de almacenamiento de archivos e imágenes
Sigue el patrón del proyecto: endpoints delgados que delegan a servicios
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.utils.auth import get_current_user
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
