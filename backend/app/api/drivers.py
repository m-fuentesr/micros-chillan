from fastapi import APIRouter, Depends, Query, status
from typing import Literal
from app.schemas.driver import DriverCreate, DriverListItem, DriverDetail, DriverSelect, DriverUpdate
from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB
from app.services import driver_service

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

@router.get("/summary")
async def get_drivers_summary(current_user: UserInDB = Depends(get_current_user)):
    """
    Resumen para las tarjetas superiores:
    - Activos / Inactivos
    - Con máquina / Sin asignar
    - Licencias con alerta
    """
    require_admin(current_user)
    return await driver_service.get_summary()


@router.get("", response_model=list[DriverListItem])
async def list_drivers(
    estado: Literal["todos", "activos", "inactivos"] | None = Query("todos"),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Lista principal de choferes (vista 'Choferes Registrados').

    - estado: pestañas de filtro rápido (todos | activos | inactivos).
    """
    require_admin(current_user)
    return await driver_service.list_drivers(estado)


@router.get("/active", response_model=list[DriverSelect])
async def list_active_drivers(current_user: UserInDB = Depends(get_current_user)):
    """
    Retorna todos los choferes activos.
    Se usa en:
      - Crear Máquina
      - Editar Máquina
    """
    require_admin(current_user)
    return await driver_service.list_active_drivers()


@router.get("/{driver_id}", response_model=DriverDetail)
async def get_driver_detail(
    driver_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await driver_service.get_driver_detail(driver_id)


@router.put("/{driver_id}")
async def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await driver_service.update_driver(driver_id, payload)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_driver(data: DriverCreate, current_user: UserInDB = Depends(get_current_user)):
    """
    Crear un chofer.
    """
    require_admin(current_user)
    
    return await driver_service.create_driver(data)


@router.delete("/{driver_id}")
async def delete_driver(
    driver_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await driver_service.delete_driver(driver_id)

