from fastapi import APIRouter, Depends, status
from typing import List

from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB
from app.services import machine_service
from app.schemas.machine import (
    MachineSelect, 
    MachineListItem, 
    MachineCreate, 
    MachineDetail,
    MachineUpdate)

router = APIRouter(prefix="/api/machines", tags=["Machines"])

# ---------------------------------------------------------
# 1. LISTAR MÁQUINAS DISPONIBLES (Para el Chofer)
# ---------------------------------------------------------
@router.get("/active", response_model=List[MachineSelect])
async def list_active_machines(current_user: UserInDB = Depends(get_current_user)):
    """
    Retorna la lista de máquinas con estado 'operativa'.
    Útil para el selector del chofer.
    """
    return await machine_service.get_active_machines()


# ---------------------------------------------------------
# 2. TARJETAS RESUMEN (Admin)
# ---------------------------------------------------------
@router.get("/summary")
async def get_machines_summary(current_user: UserInDB = Depends(get_current_user)):
    """
    Resumen para las tarjetas superiores:
    - Cantidad por estado (operativas, en taller, inactivas)
    - Máquinas con alertas documentales
    """
    require_admin(current_user)
    return await machine_service.get_summary(current_user)


# ---------------------------------------------------------
# 3. LISTAR TODAS LAS MÁQUINAS, CON FILTROS (Admin)
# ---------------------------------------------------------
@router.get("", response_model=List[MachineListItem])
async def list_machines(current_user: UserInDB = Depends(get_current_user)):
    """
    Lista principal de máquinas para vista ADMIN.
    Incluye chofer asignado y estado de documentos.
    """
    require_admin(current_user)
    return await machine_service.list_machines()


# ---------------------------------------------------------
# 4. CREAR MÁQUINA (Admin)
# ---------------------------------------------------------
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_machine(payload: MachineCreate, current_user: UserInDB = Depends(get_current_user)):
    """
    Crear una nueva máquina (ADMIN).
    """
    require_admin(current_user)
    return await machine_service.create_machine(payload)


# ---------------------------------------------------------
# 5. OBTENER DETALLE DE UNA MÁQUINA (Admin)
# ---------------------------------------------------------
@router.get("/{machine_id}", response_model=MachineDetail)
async def get_machine_detail(
    machine_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await machine_service.get_machine_detail(machine_id)


# ---------------------------------------------------------
# 6. ACTUALIZAR DETALLES DE UNA MÁQUINA (Admin)
# ---------------------------------------------------------
@router.put("/{machine_id}")
async def update_machine(
    machine_id: int,
    payload: MachineUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await machine_service.update_machine(machine_id, payload)

# ---------------------------------------------------------
# 7. DESACTIVAR MÁQUINA (Admin)
# ---------------------------------------------------------
@router.delete("/{machine_id}")
async def delete_machine(machine_id: int, current_user: UserInDB = Depends(get_current_user)):
    """
    Desactivar una máquina (soft delete).
    Libera chofer asignado y cambia estado a 'inactiva'.
    """
    require_admin(current_user)
    return await machine_service.delete_machine(machine_id)


