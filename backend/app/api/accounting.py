from fastapi import APIRouter, Query, Depends
from typing import List
from app.utils.auth import get_current_user, require_admin
from app.services import accounting_service
from app.schemas.accounting import (
    AccountingSummaryResponse, 
    WeekSummary, 
    DriverWeekDetail,
    DailyProfitabilityData,
    MovementCreate,
    MovementResponse,
    LedgerSummary
)
from app.schemas.settlement import (
    WeeklyPaymentResponse, 
    WeeklyPaymentConfirmRequest, 
    HistoryPeriodSummary, 
    HistoryMonthDetailResponse,
    HistoryPeriodFilters
)

router = APIRouter(prefix="/api/accounting", tags=["Accounting"])

# =================================================================
# 1. REPORTES Y ESTADÍSTICAS (KPIs) - Se mantienen igual
# =================================================================

@router.get("/summary", response_model=AccountingSummaryResponse)
async def get_accounting_summary(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Resumen financiero del mes (Ingresos vs Gastos).
    """
    require_admin(current_user)
    return await accounting_service.get_monthly_summary(mes, anio)

@router.get("/daily-profitability", response_model=List[DailyProfitabilityData])
async def get_daily_profitability(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Evolución diaria de rentabilidad del mes (Ingresos vs Egresos vs Ganancia).
    """
    require_admin(current_user)
    return await accounting_service.get_daily_profitability(mes, anio)

@router.get("/weeks", response_model=List[WeekSummary])
async def get_accounting_weeks(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Desglose del mes por semanas operativas.
    """
    require_admin(current_user)
    return await accounting_service.get_weekly_summary(mes, anio)

@router.get("/weeks/detail", response_model=List[DriverWeekDetail])
async def get_week_detail(
    mes: int = Query(...),
    anio: int = Query(...),
    semana: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Detalle de registros y gastos por chofer para una semana específica.
    """
    require_admin(current_user)
    # Llamamos a la nueva función que acepta número de semana
    return await accounting_service.get_week_detail_by_week_number(mes, anio, semana)


# =================================================================
# 2. GESTIÓN DE PAGOS SEMANALES (NUEVO FLUJO)
# =================================================================

@router.get("/weekly-payments", response_model=List[WeeklyPaymentResponse])
async def list_weekly_payments(
    mes: int = Query(...),
    anio: int = Query(...),
    semana: int = Query(...),
    # ELIMINADOS: fecha_inicio y fecha_fin ya no se piden
    current_user: dict = Depends(get_current_user)
):
    """
    Lista la tabla de pagos. 
    Calcula AUTOMÁTICAMENTE las fechas y si es cierre de mes.
    """
    require_admin(current_user)
    # Solo pasamos mes, anio y semana
    return await accounting_service.get_weekly_payments_list(mes, anio, semana)

@router.post("/weekly-payments/{chofer_id}/confirm", response_model=dict)
async def confirm_weekly_payment_endpoint(
    chofer_id: int,
    payload: WeeklyPaymentConfirmRequest,
    mes: int = Query(...),
    anio: int = Query(...),
    semana: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Confirma un pago semanal y lo guarda en 'pagos_semanales'.
    """
    require_admin(current_user)
    return await accounting_service.confirm_weekly_payment(chofer_id, mes, anio, semana, payload)


# =================================================================
# 3. HISTORIAL DE CIERRES (JERÁRQUICO)
# =================================================================

@router.get("/history/periods")
async def get_settlement_history_periods(
    filters: HistoryPeriodFilters = Depends(),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene la lista de meses cerrados con paginación y filtros (Agrupados por mes/año).
    """
    require_admin(current_user)
    return await accounting_service.get_history_periods(filters)

@router.get("/history/month-detail", response_model=HistoryMonthDetailResponse)
async def get_settlement_history_month_detail(
    mes: int = Query(...),
    anio: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el detalle completo del mes (Comprobante de Nómina).
    Retorna estructura jerárquica: Mes -> Semanas -> Choferes.
    """
    require_admin(current_user)
    return await accounting_service.get_history_month_detail(mes, anio)
@router.delete("/undo")
async def undo_payment_endpoint(
    chofer_id: int = Query(..., description="ID del chofer"),
    mes: int = Query(..., description="Mes del pago"),
    anio: int = Query(..., description="Año del pago"),
    semana: int = Query(..., description="Número de semana")
):
    """
    Deshace (elimina) un pago realizado. 
    Vuelve el estado de la semana a 'pendiente'.
    """
    return await accounting_service.undo_weekly_payment(chofer_id, mes, anio, semana)
@router.post("/close-month")
async def close_month_endpoint(
    mes: int = Query(..., description="Número del mes a cerrar (1-12)"),
    anio: int = Query(..., description="Año del mes a cerrar"),
    current_user: dict = Depends(get_current_user)
):
    """
    Cierra el mes contable.
    - Valida que todos los choferes activos tengan su pago de la última semana.
    - Guarda el registro en la tabla 'cierres_mensuales'.
    """
    require_admin(current_user)
    return await accounting_service.process_month_closure(mes, anio)

# =================================================================
# 4. BITÁCORA Y CUENTAS CORRIENTES (NUEVO MÓDULO)
# =================================================================

@router.get("/ledger", response_model=List[LedgerSummary])
async def read_ledger_summary(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el tablero resumen de deudas/saldos de todos los choferes.
    """
    require_admin(current_user)
    # Nota: Si el servicio es síncrono (def), no uses 'await'. 
    # Si lo cambiaste a async, usa 'await'. Asumo síncrono por tu código anterior:
    return accounting_service.get_ledger_summary()

@router.post("/ledger/movement")
async def add_ledger_movement(
    movement: MovementCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra un movimiento manual (Préstamo o Abono) en la cuenta del chofer.
    """
    require_admin(current_user)
    return accounting_service.create_ledger_movement(movement)

@router.get("/ledger/{chofer_id}")
async def read_driver_ledger(
    chofer_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el historial detallado de movimientos de un chofer específico.
    """
    require_admin(current_user)
    return accounting_service.get_driver_ledger_history(chofer_id)