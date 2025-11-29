from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user
from app.services import driver_service
from app.schemas.driver import WorkerProfileResponse  # <--- Importante: El schema que creamos

router = APIRouter(prefix="/api/worker", tags=["Worker"])

@router.get("/profile", response_model=WorkerProfileResponse)
async def worker_profile(current_user: dict = Depends(get_current_user)):
    """
    Obtiene el perfil del trabajador logueado.
    """
    return await driver_service.get_profile(current_user)