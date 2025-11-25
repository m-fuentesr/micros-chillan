from fastapi import APIRouter, Depends, HTTPException

from app.db.supabase_client import supabase
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/")
async def listar_usuarios(
    current_user=Depends(get_current_user),
):
    """
    Solo administradores pueden listar usuarios.
    """
    require_admin(current_user)

    res = supabase.table("usuarios").select("*").execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=str(res.error))

    return res.data


@router.get("/{usuario_id}")
async def obtener_usuario(
    usuario_id: int,
    current_user=Depends(get_current_user),
):
    """
    Solo administradores pueden ver la ficha de cualquier usuario.
    (Cuando se haga la vista para los choferes, permitir que cada usuario vea solo su propia info).
    """
    require_admin(current_user)

    res = (
        supabase.table("usuarios")
        .select("*")
        .eq("id", usuario_id)
        .single()
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return res.data
