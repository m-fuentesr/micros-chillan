from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/alerts")
async def list_alerts(current_user=Depends(get_current_user)):
    """
    Obtiene todas las alertas combinadas del dashboard admin.
    """
    return await dashboard_service.list_alerts(current_user)
