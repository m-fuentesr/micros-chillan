from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.utils.auth import get_current_user
from app.schemas.user import UserInDB
from app.services import worker_service
from app.schemas.worker import WorkerProfileResponse, WorkerStatsResponse  # <--- Importante: El schema que creamos


router = APIRouter(prefix="/api/worker", tags=["Worker"])

@router.get("/profile", response_model=WorkerProfileResponse)
async def worker_profile(current_user: UserInDB = Depends(get_current_user)):
    """
    Obtiene el perfil del trabajador logueado.
    """
    return await worker_service.get_profile(current_user)

@router.get("/monthly-stats", response_model=WorkerStatsResponse)
async def get_worker_stats(
    mes: Optional[int] = Query(None, ge=1, le=12), #Valida el mes
    anio: Optional[int] = Query(None, ge=2020), #Valida año
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Obtiene estadísticas del mes (días trabajados y dinero recaudado).
    Parametros opcionales: ?mes=11&anio=2025
    """
    return await worker_service.get_monthly_stats(current_user, mes, anio)