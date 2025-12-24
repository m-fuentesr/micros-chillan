from fastapi import APIRouter, Body, Depends, status, Query
from datetime import date
from typing import List, Literal, Optional

from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB
from app.services import machine_service
from app.core.pagination import PaginatedResponse
from app.schemas.machine import (
    MachineSelect, 
    MachineListItem, 
    MachineCreate, 
    MachineDetail,
    MachineUpdate,
    MachineAssignmentItem,
    MachineListFilters,
    MachineDocumentAlerts,
    MachineAssignmentFilters
)
from app.schemas.maintenance import (
    MaintenanceRecord,
    MaintenanceCreate,
    MaintenanceListResponse
)

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
    return await machine_service.get_summary()


# ---------------------------------------------------------
# 2.5. ALERTAS DE DOCUMENTACIÓN (Admin)
# ---------------------------------------------------------
@router.get("/document-alerts", response_model=MachineDocumentAlerts)
async def get_document_alerts(
    estado: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Obtiene conteos de máquinas por estado de documentos:
    - vencidos: máquinas con al menos un documento vencido
    - por_vencer: máquinas con al menos un documento por vencer (y ninguno vencido)
    - al_dia: máquinas con todos los documentos al día
    
    Opcionalmente filtra por estado operativo.
    """
    require_admin(current_user)
    return await machine_service.get_document_alerts(estado)


# ---------------------------------------------------------
# 3. LISTAR TODAS LAS MÁQUINAS, CON FILTROS (Admin)
# ---------------------------------------------------------
@router.get("", response_model=PaginatedResponse[MachineListItem])
async def list_machines(
    filters: MachineListFilters = Depends(),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Lista principal de máquinas para vista ADMIN con paginación.
    Incluye chofer asignado y estado de documentos.
    """
    require_admin(current_user)
    return await machine_service.list_machines(filters)


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

# ---------------------------------------------------------
# 8. HISTORIAL DE ASIGNACIONES DE UNA MÁQUINA (Admin)
# ---------------------------------------------------------
@router.get("/{machine_id}/assignments", response_model=PaginatedResponse[MachineAssignmentItem])
async def get_machine_assignments(
    machine_id: int,
    filters: MachineAssignmentFilters = Depends(),
    current_user: UserInDB = Depends(get_current_user),
):
    require_admin(current_user)
    return await machine_service.get_machine_assignments(machine_id, filters)

# ---------------------------------------------------------
# 9. LISTAR MANTENIMIENTOS/REPUESTOS DE UNA MÁQUINA + RESUMEN (Admin)
# ---------------------------------------------------------
@router.get("/{machine_id}/maintenances", response_model=MaintenanceListResponse)
async def get_machine_maintenances(
    machine_id: int,
    categoria: Optional[str] = None,
    item: Optional[str] = None,
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await machine_service.get_machine_maintenances(
        machine_id, categoria, item, desde, hasta, page, per_page
    )

# ---------------------------------------------------------
# 10. REGISTRAR NUEVA COMPRA DE REPUESTO PARA UNA MÁQUINA (Admin)
# ---------------------------------------------------------
@router.post("/{machine_id}/maintenances", status_code=201)
async def create_machine_maintenance(
    machine_id: int,
    payload: MaintenanceCreate = Body(...),
    current_user: UserInDB = Depends(get_current_user)
):
    require_admin(current_user)
    return await machine_service.create_machine_maintenance(machine_id, payload)