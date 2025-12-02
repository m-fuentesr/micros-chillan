from typing import List
from fastapi import APIRouter, Depends, status
from app.utils.auth import get_current_user
from app.services import machine_service
from app.schemas.machine import MachineSelect
# from app.schemas.machine import MachineCreate # (Descomentar cuando implementes crear)

router = APIRouter(prefix="/api/machines", tags=["Machines"])

# ---------------------------------------------------------
# 1. LISTAR MÁQUINAS DISPONIBLES (Para el Chofer)
# ---------------------------------------------------------
@router.get("/active", response_model=List[MachineSelect])
async def list_active_machines(current_user: dict = Depends(get_current_user)):
    """
    Retorna la lista de máquinas con estado 'operativa'.
    Útil para el selector del chofer.
    """
    return await machine_service.get_active_machines()

@router.get("/summary")
async def get_machines_summary(current_user=Depends(get_current_user)):
    """
    Resumen para las tarjetas superiores:
    - Cantidad por estado (operativas, en taller, inactivas)
    - Máquinas con alertas documentales
    """
    return await machine_service.get_summary(current_user)

