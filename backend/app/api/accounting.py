from fastapi import APIRouter, Query, Depends
from typing import List
from app.services import accounting_service
from app.schemas.accounting import AccountingSummaryResponse, WeekSummary, DriverWeekDetail
from app.schemas.settlement import SettlementResponse, PaymentConfirmRequest, PaymentConfirmResponse, SettlementsSummaryResponse, HistoryPeriodSummary, HistoryMonthDetail
from app.utils.auth import get_current_user, require_admin 

router = APIRouter(prefix="/api/accounting", tags=["Accounting"])

@router.get("/summary", response_model=AccountingSummaryResponse)
async def get_accounting_summary(
    mes: int = Query(..., ge=1, le=12, description="Mes del 1 al 12"),
    anio: int = Query(..., ge=2020, description="Año completo (ej. 2025)"),
    # 1. Obtenemos el usuario que hace la petición (Token)
    current_user: dict = Depends(get_current_user) 
):
    # 2. Validamos que sea Admin. Si es chofer, esto lanzará un error 403 Forbidden.
    require_admin(current_user)

    return await accounting_service.get_monthly_summary(mes, anio)

@router.get("/weeks", response_model=List[WeekSummary])
async def get_accounting_weeks(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    return await accounting_service.get_weekly_summary(mes, anio)

@router.get("/weeks/detail", response_model=List[DriverWeekDetail])
async def get_week_detail(
    fecha_inicio: str = Query(..., description="Formato YYYY-MM-DD"),
    fecha_fin: str = Query(..., description="Formato YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    return await accounting_service.get_week_detail_by_date(fecha_inicio, fecha_fin)

# 1. Listado de Liquidaciones
@router.get("/settlements", response_model=List[SettlementResponse])
async def list_settlements(
    mes: int = Query(...),
    anio: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Lista estado de pagos de los choferes (Pendiente/Pagado) con cálculo de garantía.
    """
    require_admin(current_user)
    # Llamamos a la función que agregamos en accounting_service
    return await accounting_service.get_settlements_list(mes, anio)
# 2. Confirmar Pago
@router.post("/settlements/{chofer_id}/confirm-payment", response_model=PaymentConfirmResponse)
async def confirm_driver_payment(
    chofer_id: int,
    payload: PaymentConfirmRequest,
    mes: int = Query(...),
    anio: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Registra el pago final y cierra la liquidación del mes para el chofer.
    """
    require_admin(current_user)
    return await accounting_service.confirm_payment(chofer_id, mes, anio, payload)

@router.get("/settlements/summary", response_model=SettlementsSummaryResponse)
async def get_settlements_banner_data(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene los totales (cantidad y monto) de pagos PENDIENTES para el banner.
    REQUIERE ADMIN.
    """
    require_admin(current_user)
    return await accounting_service.get_settlements_summary_banner(mes, anio)
# 4. HISTORIAL DE LIQUIDACIONES

@router.get("/history/periods", response_model=List[HistoryPeriodSummary])
async def get_settlement_history_periods(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene la lista de meses cerrados (Agrupados por mes/año).
    """
    require_admin(current_user)
    return await accounting_service.get_history_periods()
@router.get("/history/detail", response_model=List[HistoryMonthDetail])
async def get_settlement_history_detail(
    mes: int = Query(...),
    anio: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el detalle de pagos de un mes específico seleccionado en el historial.
    """
    require_admin(current_user)
    return await accounting_service.get_history_detail(mes, anio)