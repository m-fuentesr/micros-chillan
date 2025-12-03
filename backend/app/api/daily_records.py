from typing import List
from fastapi import APIRouter, Depends, status, Query
from app.utils.auth import get_current_user
from app.services import daily_record_service
from app.schemas.daily_record import DailyRecordCreate, DailyRecordResponse


router = APIRouter(prefix="/api/daily-records", tags=["Daily Records"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_daily_record(
    payload: DailyRecordCreate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint usado por la App del Trabajador para enviar su cierre de día.
    """
    return await daily_record_service.create_daily_record(payload, current_user)

@router.get("/my-history", response_model=List[DailyRecordResponse])
async def get_my_history(
    rango: str = Query("este_mes"),
    current_user: dict = Depends(get_current_user)
):
    return await daily_record_service.get_driver_history(current_user, rango)

@router.get("/today-status")
async def get_today_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Verifica si el usuario ya tiene un reporte diario para hoy.
    Retorna el estado del reporte o null si no existe.
    """
    return await daily_record_service.get_today_record_status(current_user)