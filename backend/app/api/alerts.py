from fastapi import APIRouter, HTTPException, status
from app.services import alert_service

router = APIRouter(
    prefix="/alertas",
    tags=["Alertas"]
)

# ... tus otros endpoints (GET, POST) ...

@router.put("/{alerta_id}/leida")
async def marcar_alerta_leida(alerta_id: int):
    """
    Endpoint para el botón 'X' o 'Entendido'.
    Pasa la alerta a estado 'resuelta'.
    """
    exito = await alert_service.marcar_como_leida(alerta_id)
    
    if not exito:
        # Si falla (ej. la alerta no existía o error de conexión)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No se pudo marcar la alerta como leída."
        )
    
    return {"message": "Alerta marcada como leída correctamente"}

@router.put("/alertas/resolver-todas")
async def resolver_todas_alertas_admin():
    """
    Botón 'Eliminar Todas' del Dashboard de Administrador.
    Limpia alertas de documentos, registros, incidentes, etc.
    NO toca las notificaciones de los choferes.
    """
    cantidad = await alert_service.marcar_todas_admin_como_resueltas()
    
    if cantidad == -1:
        raise HTTPException(status_code=500, detail="Error interno al resolver alertas.")
        
    return {"message": f"Se resolvieron {cantidad} alertas correctamente."}

@router.get("/alertas/mis-alertas/{chofer_id}")
async def listar_alertas_trabajador(chofer_id: int):
    # FastAPI convertirá la lista de diccionarios a JSON automáticamente
    alertas = await alert_service.get_alerts_by_worker(chofer_id)
    return alertas

# --- Endpoint: Traer alertas para el ADMIN ---
@router.get("/alertas/admin")
async def listar_alertas_admin():
    # FastAPI convertirá la lista de diccionarios a JSON automáticamente
    alertas = await alert_service.get_admin_alerts()
    return alertas