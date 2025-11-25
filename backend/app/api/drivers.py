from fastapi import APIRouter, Depends, status
from app.schemas.driver import DriverCreate, DriverRead, DriverListResponse
from app.utils.auth import get_current_user
from app.services import driver_service

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_driver(data: DriverCreate, current_user=Depends(get_current_user)):
    """
    Crear un chofer.
    """
    return await driver_service.create_driver(data, current_user)

@router.get("", response_model=DriverListResponse)
async def list_drivers(current_user=Depends(get_current_user)):
    """
    Lista todos los choferes.
    """
    return await driver_service.list_drivers(current_user)