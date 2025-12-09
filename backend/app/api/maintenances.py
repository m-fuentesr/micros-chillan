from fastapi import APIRouter, Body, Depends

from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB
from app.services import machine_service

router = APIRouter(prefix="/api/maintenances", tags=["Maintenances"])

@router.delete("/{maintenance_id}", status_code=204)
async def delete_maintenance(
    maintenance_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Elimina un registro de mantenimiento/compra de repuesto.
    """
    require_admin(current_user)
    return await machine_service.delete_maintenance(maintenance_id)