from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.dashboard import DashboardAlerts
from app.services import alert_service
from app.utils.auth import get_current_user, require_admin
from app.schemas.user import UserInDB

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)

# ---------------------------------------------------------
# 1. RESOLVER UNA ALERTA INDIVIDUAL (General)
# ---------------------------------------------------------
@router.patch("/{alert_id}/resolve")
async def resolve_single_alert(
    alert_id: int, 
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Endpoint para el botón 'X' o 'Entendido'.
    Marca una alerta específica como 'resuelta'.
    """
    exito = await alert_service.marcar_como_leida(alert_id, current_user)
    
    if not exito:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No se pudo resolver la alerta. Puede que no exista o ya esté resuelta."
        )
    
    return {"message": "Alerta resuelta correctamente"}


# ---------------------------------------------------------
# 2. LISTAR ALERTAS (Admin vs Worker)
# ---------------------------------------------------------

# Para el ADMIN: Ver todas
@router.get("/admin")
async def list_admin_alerts(current_user: UserInDB = Depends(get_current_user)):
    """
    Trae las alertas globales para el panel de administración.
    Realiza una limpieza automática de notificaciones viejas antes de responder.
    """
    require_admin(current_user) 
    
    # 1. Limpieza silenciosa (Lazy Cleanup) 🧹
    # Esto archiva las informativas de >24hrs antes de pedir la lista
    await alert_service.limpiar_alertas_antiguas()

    # 2. Retornar la lista limpia
    return await alert_service.get_admin_alerts()

# Para el ADMIN: Ver resumen (KPIs) y detalle
@router.get("/summary", response_model=DashboardAlerts)
async def get_admin_alerts_summary(current_user: UserInDB = Depends(get_current_user)):
    """
    Devuelve el resumen (KPIs) y detalle de alertas para el dashboard.
    Ejecuta la limpieza de alertas informativas antiguas antes de construir la respuesta
    """

    require_admin(current_user)
    return await alert_service.get_admin_alerts_overview()

# Para el TRABAJADOR: Ver las suyas
@router.get("/my-alerts/{worker_id}")
async def list_worker_alerts(
    worker_id: int, 
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Trae las alertas personales de un chofer específico.
    """
    # Nota: El frontend usa esto para llenar la campanita
    return await alert_service.get_alerts_by_worker(worker_id)


# ---------------------------------------------------------
# 3. RESOLUCIÓN MASIVA (Limpiar todo)
# ---------------------------------------------------------

# ADMIN: Limpiar todo lo global
@router.patch("/admin/resolve-all")
async def resolve_all_admin_alerts(current_user: UserInDB = Depends(get_current_user)):
    """
    Botón 'Dismiss All' del Admin.
    NO toca las notificaciones personales de los choferes.
    """
    require_admin(current_user)
    
    cantidad = await alert_service.marcar_todas_admin_como_resueltas()
    
    if cantidad == -1:
        raise HTTPException(
            status_code=500, 
            detail="Error interno al resolver las alertas."
        )
        
    return {"message": f"Se resolvieron {cantidad} alertas correctamente."}

# TRABAJADOR: Limpiar lo suyo
@router.patch("/my-alerts/{worker_id}/resolve-all")
async def resolve_all_worker_alerts(
    worker_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Botón 'Marcar todo como leído' del Trabajador.
    """
    
    # 1. VERIFICACIÓN CORREGIDA (Tabla Usuarios -> Chofer)
    es_propietario = await alert_service.verificar_propiedad_chofer(
        user_id=current_user.id,    # ID 17 (Usuario)
        chofer_id_url=worker_id     # ID 10 (Chofer)
    )

    if not es_propietario:
        print(f"⛔ Bloqueo: El usuario {current_user.id} NO tiene asignado el chofer {worker_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permiso. Tu usuario no tiene asignado este perfil de chofer."
        )

    # 2. Ejecutar limpieza
    resultado = await alert_service.resolver_todas_alertas_chofer(worker_id)
    
    # 3. Verificar errores
    if "error" in resultado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=resultado["error"]
        )
        
    return resultado
