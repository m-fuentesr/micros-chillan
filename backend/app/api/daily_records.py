from fastapi import APIRouter, Depends, status, Query
from typing import List
from app.utils.auth import get_current_user, require_admin
from app.core.pagination import PaginatedResponse
from app.schemas.user import UserInDB
from app.services import daily_record_service
from app.schemas.daily_record import (
    DailyRecordAuditItem,
    DailyRecordCreateAdmin,
    DailyRecordSummary,
    DailyRecordListItem,
    DailyRecordListFilters,
    DailyRecordCreate, 
    DailyRecordResponse,
    DailyRecordDetailResponse,
    DailyRecordPreviewPaymentRequest,
    DailyRecordPreviewPaymentResponse,
    DailyRecordUpdate
)

router = APIRouter(prefix="/api/daily-records", tags=["Daily Records"])

# --------------------------------------------------
# Rutas estáticas (Trabajador)
# --------------------------------------------------
@router.get("/summary", response_model=DailyRecordSummary)
async def get_summary(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Resumen de registros diarios para el administrador (KPIs).
    """
    require_admin(current_user)
    return await daily_record_service.get_daily_records_summary()


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


# --------------------------------------------------
# Rutas estáticas (Admin)
# --------------------------------------------------
@router.post("/preview-payment",response_model=DailyRecordPreviewPaymentResponse)
async def preview_payment(
    payload: DailyRecordPreviewPaymentRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Previsualiza el cálculo de pago del chofer sin guardar cambios.
    """
    require_admin(current_user)

    return await daily_record_service.preview_payment(
        chofer_id=payload.chofer_id,
        monto_recaudado_propuesto=payload.monto_recaudado_propuesto,
    )


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


@router.post("/admin", status_code=status.HTTP_201_CREATED)
async def create_daily_record_admin(
    payload: DailyRecordCreateAdmin,
    current_user: UserInDB = Depends(get_current_user),
):
    require_admin(current_user)

    return await daily_record_service.create_daily_record_admin(
        payload=payload,
        current_user=current_user,
    )


# --------------------------------------------------
# Rutas dinámicas (Admin)
# --------------------------------------------------
@router.get("/{record_id}", response_model=DailyRecordDetailResponse)
async def get_daily_record_detail(
    record_id: int,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Obtener detalle completo de un registro diario para edición (Admin).
    """
    require_admin(current_user)
    return await daily_record_service.get_daily_record_detail(record_id)


@router.get("/{record_id}/history", response_model=list[DailyRecordAuditItem])
async def get_daily_record_history(
    record_id: int,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Historial de cambios de un registro diario (Admin).
    """
    require_admin(current_user)
    return await daily_record_service.get_daily_record_history(record_id)


@router.put("/{record_id}", status_code=status.HTTP_200_OK)
async def update_daily_record(
    record_id: int,
    payload: DailyRecordUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Guarda correcciones del administrador sobre un registro diario.
    """
    require_admin(current_user)

    return await daily_record_service.update_daily_record(
        record_id=record_id,
        payload=payload,
        current_user=current_user,
    )

# --------------------------------------------------
# Crear registro diario (Trabajador) 
# Debe ser la última ruta debido a conflictos de path
# --------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_daily_record(
    payload: DailyRecordCreate, 
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Endpoint usado por la App del Trabajador para enviar su cierre de día.
    """
    return await daily_record_service.create_daily_record(payload, current_user)


