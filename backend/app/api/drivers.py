from fastapi import APIRouter, Depends, status
from app.schemas.driver import DriverCreate, DriverRead, DriverListResponse
from app.utils.auth import get_current_user, require_admin
from app.services import driver_service

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_driver(data: DriverCreate, current_user=Depends(get_current_user)):
    """
    Crear un chofer.
    """
    require_admin(current_user)

    return await driver_service.create_driver(data)

@router.get("", response_model=DriverListResponse)
async def list_drivers(current_user=Depends(get_current_user)):
    """
    Lista todos los choferes.
    """
    require_admin(current_user)

    items = await driver_service.list_drivers()
    return {"items": items}