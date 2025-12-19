from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.core.realtime import dashboard_realtime
from app.db.supabase_client import supabase
from app.schemas.dashboard import DashboardResponse
from app.services import dashboard_service
from app.utils.auth import decode_jwt_token, get_current_user, require_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardResponse)
async def get_dashboard_overview(current_user=Depends(get_current_user)):
    """Devuelve los KPIs y tablas del día actual."""

    require_admin(current_user)
    return await dashboard_service.get_today_overview()


@router.websocket("/ws")
async def dashboard_updates(websocket: WebSocket, token: str = Query(None)):
    """Canal WebSocket para notificar cambios del dashboard.

    Se valida el token JWT recibido como query param `token` y se verifica que
    el usuario sea administrador antes de permitir la conexión. Cuando se crea
    o actualiza un registro diario el servidor envía un mensaje
    `{ "type": "dashboard_refresh" }` para que el frontend vuelva a consultar
    los datos agregados del día.
    """

    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = decode_jwt_token(token)
        supabase_uid = payload.get("sub")
    except Exception:
        await websocket.close(code=1008)
        return

    user_res = (
        supabase.table("usuarios")
        .select("id, rol_id, estado")
        .eq("supabase_uid", supabase_uid)
        .single()
        .execute()
    )

    user_data = getattr(user_res, "data", None)
    if not user_data or user_data.get("estado") != "activo" or user_data.get("rol_id") != 1:
        await websocket.close(code=1008)
        return

    await dashboard_realtime.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await dashboard_realtime.disconnect(websocket)
