from datetime import date
from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.driver import DriverCreate
from app.utils.auth import require_admin


async def create_driver(data: DriverCreate, current_user: dict):
    """
    Crear un chofer nuevo.
    1. Solo admin puede hacerlo.
    2. Crea un usuario asociado.
    3. Obtiene porcentaje_default desde configuracion_general.
    4. Crea el registro en choferes.
    5. (Opcional) Crea asignación inicial de máquina.
    """
    require_admin(current_user)

    # --------------------------
    # 1) Obtener porcentaje default
    # --------------------------
    cfg = supabase.table("configuracion_general").select("porcentaje_default").single().execute()

    if getattr(cfg, "error", None):
        raise HTTPException(500, f"Error obteniendo configuración general: {cfg.error}")

    porcentaje_default = cfg.data["porcentaje_default"]

    # --------------------------
    # 2) Crear usuario vinculado
    # --------------------------
    usuario_payload = {
        "correo": data.correo_electronico,
        "rol_id": 2,   # rol chofer (ajústalo según tu tabla roles)
        "estado": "activo",
        "chofer_id": None  # lo actualizamos luego
    }

    usuario_res = (
        supabase.table("usuarios")
        .insert(usuario_payload)
        .single()
        .execute()
    )

    if getattr(usuario_res, "error", None):
        raise HTTPException(400, f"Error creando usuario asociado: {usuario_res.error}")

    usuario_id = usuario_res.data["id"]

    # --------------------------
    # 3) Crear chofer
    #    Los nombres a la izquierda deben ser idénticos a los de la tabla (choferes) en la BD
    # --------------------------
    chofer_payload = {
        "primer_nombre": data.primer_nombre,
        "segundo_nombre": data.segundo_nombre,
        "apellido_paterno": data.apellido_paterno,
        "apellido_materno": data.apellido_materno,
        "rut": data.rut,
        "telefono": data.telefono,
        "porcentaje_pago": porcentaje_default,
        "estado": data.estado,
        "fecha_venc_licencia": data.fecha_venc_licencia,
        "created_at": date.today(),
    }

    chofer_res = (
        supabase.table("choferes")
        .insert(chofer_payload)
        .single()
        .execute()
    )

    if getattr(chofer_res, "error", None):
        raise HTTPException(400, f"Error creando chofer: {chofer_res.error}")

    chofer_id = chofer_res.data["id"]

    # --------------------------
    # 4) Actualizar usuario para enlazar chofer_id
    # --------------------------
    supabase.table("usuarios").update({"chofer_id": chofer_id}).eq("id", usuario_id).execute()

    # --------------------------
    # 5) (Opcional) Asignación inicial de máquina
    # --------------------------
    if data.maquina_asignada:
        asign_res = (
            supabase.table("asignaciones_chofer_maquina")
            .insert({
                "maquina_id": data.maquina_asignada,
                "chofer_id": chofer_id,
                "fecha_inicio": date.today()
            })
            .execute()
        )

        if getattr(asign_res, "error", None):
            raise HTTPException(
                400,
                f"Chofer creado, pero error asignando máquina: {asign_res.error}",
            )

    return chofer_res.data


async def list_drivers(current_user: dict):
    """
    Lista de choferes.
    Admin only.
    Estructura básica (completar)
    """
    require_admin(current_user)

    res = supabase.table("choferes").select("*").execute()

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error listando choferes: {res.error}")

    return res.data

