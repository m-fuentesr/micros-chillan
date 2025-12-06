from fastapi import APIRouter, Depends, status, Query
from typing import List
from app.utils.auth import get_current_user, require_admin
from app.core.pagination import PaginatedResponse
from app.schemas.user import UserInDB
from app.services import daily_record_service
from app.schemas.daily_record import (
    DailyRecordCreate, 
    DailyRecordResponse, 
    DailyRecordListItem,
    DailyRecordListFilters
)

router = APIRouter(prefix="/api/daily-records", tags=["Daily Records"])

@router.get("", response_model=PaginatedResponse[DailyRecordListItem])
async def list_daily_records(
    filters: DailyRecordListFilters = Depends(),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Lista de registros diarios para admin, filtrados por máquina y otros parámetros.
    """
    require_admin(current_user)
    return await daily_record_service.list_daily_records_for_admin(
        filters=filters,
        current_user=current_user,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_daily_record(
    payload: DailyRecordCreate, 
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Endpoint usado por la App del Trabajador para enviar su cierre de día.
    """
    return await daily_record_service.create_daily_record(payload, current_user)


@router.get("/my-history", response_model=List[DailyRecordResponse])
async def get_my_history(
    rango: str = Query("este_mes"),
    current_user: UserInDB = Depends(get_current_user)
):
    return await daily_record_service.get_driver_history(current_user, rango)


@router.get("/today-status")
async def get_today_status(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Verifica si el usuario ya tiene un reporte diario para hoy.
    Retorna el estado del reporte o null si no existe.
    """
    return await daily_record_service.get_today_record_status(current_user)