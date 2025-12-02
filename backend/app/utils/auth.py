from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.supabase_client import supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    - Lee el JWT del header Authorization: Bearer <token>
    - Lo valida contra Supabase Auth (auth.get_user(jwt))
    - Busca el usuario en tu tabla 'usuarios' por supabase_uid
    - Devuelve el registro de la tabla 'usuarios' como dict
    """
    token = credentials.credentials

    if not token:
        raise HTTPException(status_code=401, detail="Token no proporcionado")

    try:
        # Valida el token y obtiene el usuario desde Supabase Auth
        response = supabase.auth.get_user(token)
        user = response.user
    except Exception as e:
        # Log del error para debugging (sin exponer detalles sensibles)
        error_msg = str(e)
        if "expired" in error_msg.lower() or "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Token expirado o inválido")
        raise HTTPException(status_code=401, detail="Error al validar token")

    if user is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    supabase_uid = user.id

    # Buscar en tabla 'usuarios' por supabase_uid
    try:
        db_res = (
            supabase.table("usuarios")
            .select("*")
            .eq("supabase_uid", supabase_uid)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Error al consultar la base de datos"
        )

    if getattr(db_res, "error", None):
        raise HTTPException(
            status_code=403,
            detail="Usuario no registrado en tabla 'usuarios'",
        )

    if not db_res.data:
        raise HTTPException(
            status_code=403,
            detail="Usuario no encontrado en tabla 'usuarios'",
        )

    return db_res.data


def require_admin(current_user: dict):
    """
    Lanza 403 si el usuario no es administrador.
    rol_id = 1 → administrador
    """
    if current_user.get("rol_id") != 1:
        raise HTTPException(
            status_code=403,
            detail="No autorizado: se requiere rol administrador",
        )
