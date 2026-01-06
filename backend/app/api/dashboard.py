from fastapi import APIRouter, Depends

from app.schemas.dashboard import DashboardDailyRecords, DashboardResponse
from app.services import dashboard_service
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardResponse)
async def get_dashboard_overview(current_user=Depends(get_current_user)):
    """Devuelve los KPIs y tablas del día actual."""

    require_admin(current_user)
    return await dashboard_service.get_today_overview()


@router.get("/daily-records", response_model=DashboardDailyRecords)
async def get_dashboard_daily_records(current_user=Depends(get_current_user)):
    """Devuelve la tabla de registros diarios para el día actual (choferes activos)."""

    require_admin(current_user)
    return await dashboard_service.get_today_daily_records()

