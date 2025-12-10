from fastapi import APIRouter, Query, Depends
from typing import List
from app.utils.auth import get_current_user, require_admin
from app.services import report_service
from app.db.supabase_client import supabase
from app.schemas.report import MachineProfitabilityResponse, MachineGrossRankingResponse, DriverProfitabilityResponse

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/profitability", response_model=List[MachineProfitabilityResponse])
async def get_machine_profitability_report(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Reporte 1: Rentabilidad por Máquina (Mes/Año).
    """
    require_admin(current_user)
    return await report_service.get_machine_profitability(mes, anio)

@router.get("/gross-income-ranking", response_model=List[MachineGrossRankingResponse])
async def get_gross_income_ranking_report(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Reporte 2: Ranking de Ingreso Bruto.
    Ordenado por Ventas (Ingresos Totales) de Mayor a Menor.
    """
    require_admin(current_user)
    return await report_service.get_gross_income_ranking(mes, anio)

@router.get("/driver-profitability", response_model=List[DriverProfitabilityResponse])
async def get_driver_profitability_report(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Reporte 3: Rentabilidad por Chofer.
    Muestra quién genera más ganancia neta a la empresa.
    """
    require_admin(current_user)
    return await report_service.get_driver_profitability(mes, anio)