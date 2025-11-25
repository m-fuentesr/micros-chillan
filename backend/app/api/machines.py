from fastapi import APIRouter, Depends, status
from app.schemas.machine import MachineCreate
from app.utils.auth import get_current_user
from app.services import machine_service

router = APIRouter(prefix="/api/machines", tags=["Machines"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_machine(payload: MachineCreate, current_user=Depends(get_current_user)):
    """
    Crear una máquina.
    """
    return await machine_service.create_machine(payload, current_user)
