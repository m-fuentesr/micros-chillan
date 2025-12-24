from fastapi import APIRouter, Depends, Query, status
from typing import Literal
from app.schemas.driver import (
    DriverCreate,
    DriverDeletedListItem, 
    DriverListItem,
    DriverDetail,
    DriverReintegrate, 
    DriverSelect, 
    DriverUpdate, 
    DriverListFilters, 
    DriverLicenseAlerts, 
    DriverLiquidationFilters, 
    DriverLiquidationItem,
    )
from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB
from app.services import driver_service
from app.core.pagination import PaginatedResponse

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


@router.get("", response_model=PaginatedResponse[DriverListItem])
async def list_drivers(
    filters: DriverListFilters = Depends(),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Lista principal de choferes (vista 'Choferes Registrados') con paginación.
    """
    require_admin(current_user)
    return await driver_service.list_drivers(filters)


@router.get("/license-alerts", response_model=DriverLicenseAlerts)
async def get_license_alerts(
    estado: Literal["todos", "activos", "inactivos"] | None = Query(None),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Obtiene conteos de conductores por estado de licencia:
    - vencidas: conductores con licencia vencida
    - por_vencer: conductores con licencia por vencer
    - vigentes: conductores con licencia vigente
    
    Opcionalmente filtra por estado del conductor.
    """
    require_admin(current_user)
    return await driver_service.get_license_alerts(estado)


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


@router.get("/deleted", response_model=list[DriverDeletedListItem])
async def list_deleted_drivers(current_user: UserInDB = Depends(get_current_user)):
    """
    Lista solo choferes eliminados para reintegración administrativa.
    """
    require_admin(current_user)
    return await driver_service.list_deleted_drivers()


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


@router.post("/{driver_id}/reintegrate")
async def reintegrate_driver(
    driver_id: int,
    payload: DriverReintegrate,
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await driver_service.reintegrate_driver(driver_id, payload)


@router.get("/{driver_id}/liquidations")
async def get_driver_liquidations(
    driver_id: int,
    filters: DriverLiquidationFilters = Depends(),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Obtiene las liquidaciones mensuales de un chofer con paginación y filtros.
    """
    require_admin(current_user)
    return await driver_service.get_driver_liquidations(driver_id, filters)

