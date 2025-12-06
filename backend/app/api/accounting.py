from fastapi import APIRouter, Query, Depends
from typing import List
from app.services import accounting_service
from app.schemas.accounting import AccountingSummaryResponse, WeekSummary
from app.utils.auth import get_current_user, require_admin 

router = APIRouter(prefix="/api/accounting", tags=["Accounting"])

@router.get("/summary", response_model=AccountingSummaryResponse)
async def get_accounting_summary(
    mes: int = Query(..., ge=1, le=12, description="Mes del 1 al 12"),
    anio: int = Query(..., ge=2020, description="Año completo (ej. 2025)"),
    # 1. Obtenemos el usuario que hace la petición (Token)
    current_user: dict = Depends(get_current_user) 
):
    """
    Obtiene el resumen financiero general del mes (KPIs).
    REQUIERE ROL DE ADMINISTRADOR.
    """
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