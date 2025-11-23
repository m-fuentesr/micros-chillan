from fastapi import APIRouter, Depends

from app.utils.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """
    Devuelve la información del usuario autenticado desde la tabla 'usuarios'.
    Se puede hacer más detallado según lo que se quiera exponer.
    """
    return {
        "id": current_user["id"],
        "supabase_uid": current_user["supabase_uid"],
        "rol_id": current_user["rol_id"],
        "correo": current_user["correo"],
        "estado": current_user["estado"],
        "chofer_id": current_user["chofer_id"],
    }
