from datetime import date, datetime
from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.driver import DriverCreate
from app.utils.auth import require_admin


async def create_driver(data: DriverCreate, current_user: dict):
    """
    Crear un chofer nuevo + invitarlo vía correo usando Supabase Auth.

    Flujo:
    1) Solo admin puede hacerlo.
    2) Invita al usuario en Supabase Auth (auth.admin.invite_user_by_email).
    3) Obtiene porcentaje_default desde configuracion_general.
    4) Crea el registro en usuarios (vinculado al uid de Auth).
    5) Crea el registro en choferes.
    6) Enlaza usuarios.chofer_id.
    7) (Opcional) Crea asignación inicial de máquina.
    """
    require_admin(current_user)

    # Normalizar correo
    email = data.correo_electronico.strip().lower()

    # --------------------------
    # 0) Verificar si ya existe un usuario con ese correo
    #     en la tabla usuarios para evitar duplicados
    # --------------------------
    existing = (
        supabase.table("usuarios")
        .select("id")
        .eq("correo", email)
        .limit(1)
        .execute()
    )
    if getattr(existing, "error", None):
        raise HTTPException(500, f"Error verificando correo: {existing.error}")

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario registrado con ese correo.",
        )

    # --------------------------
    # 1) Invitar al usuario en Supabase Auth
    #     Esto crea el usuario en auth.users y envía el email de invitación.
    # --------------------------
    try:
        # Puedes aprovechar user_metadata para guardar info útil
        invite_res = supabase.auth.admin.invite_user_by_email(
            email,
            {
                "data": {
                    "rol": "chofer",
                    "rut": data.rut,
                    "primer_nombre": data.primer_nombre,
                    "segundo_nombre": data.segundo_nombre,
                    "apellido_paterno": data.apellido_paterno,
                    "apellido_materno": data.apellido_materno,
                    "telefono": data.telefono,
                }
            },
        )
    except Exception as e:
        # Supabase Auth suele lanzar excepciones si hay problema
        raise HTTPException(
            status_code=400,
            detail=f"Error invitando usuario en Supabase Auth: {e}",
        )

    # Supabase-py para Auth devuelve un objeto con .user (no un dict de postgrest)
    auth_user = getattr(invite_res, "user", None) if invite_res is not None else None
    if auth_user is None:
        # fallback defensivo por si la librería cambia la forma de respuesta
        try:
            auth_user = invite_res.get("user") if isinstance(invite_res, dict) else None
        except Exception:
            auth_user = None

    if auth_user is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase no devolvió el usuario creado al invitar por correo.",
        )

    supabase_uid = getattr(auth_user, "id", None) or (
        auth_user.get("id") if isinstance(auth_user, dict) else None
    )

    if not supabase_uid:
        raise HTTPException(
            status_code=500,
            detail="No se pudo obtener el UID de Supabase Auth para el nuevo usuario.",
        )

    # --------------------------
    # 2) Obtener porcentaje default
    # --------------------------
    cfg = (
        supabase.table("configuracion_general")
        .select("porcentaje_default")
        .single()
        .execute()
    )
    if getattr(cfg, "error", None):
        raise HTTPException(
            500, f"Error obteniendo configuración general: {cfg.error}"
        )

    porcentaje_default = cfg.data["porcentaje_default"]

    # Para tener algo de "rollback" manual si fallan pasos posteriores
    usuario_id = None
    chofer_id = None

    try:
        # --------------------------
        # 3) Crear usuario en tabla usuarios
        # --------------------------
        usuario_payload = {
            "correo": email,
            "supabase_uid": supabase_uid,  # <- clave del Auth
            "rol_id": 2,      # rol chofer
            "estado": "activo",
            "chofer_id": None,             # lo enlazamos luego
        }

        usuario_res = (
            supabase.table("usuarios")
            .insert(usuario_payload)
            .execute()
        )

        if getattr(usuario_res, "error", None):
            raise HTTPException(
                400, f"Error creando usuario asociado: {usuario_res.error}"
            )

        usuario_id = usuario_res.data[0]["id"]

        # --------------------------
        # 4) Crear chofer
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
            "fecha_venc_licencia": data.fecha_venc_licencia.isoformat(),
            "created_at": date.today().isoformat(),
        }

        chofer_res = (
            supabase.table("choferes")
            .insert(chofer_payload)
            .execute()
        )

        if getattr(chofer_res, "error", None):
            raise HTTPException(400, f"Error creando chofer: {chofer_res.error}")

        chofer_id = chofer_res.data[0]["id"]

        # --------------------------
        # 5) Enlazar usuarios.chofer_id
        # --------------------------
        link_res = (
            supabase.table("usuarios")
            .update({"chofer_id": chofer_id})
            .eq("id", usuario_id)
            .execute()
        )

        if getattr(link_res, "error", None):
            # No reviento el flujo completo, pero lo informo
            raise HTTPException(
                400,
                f"Chofer creado, pero error enlazando usuario con chofer: {link_res.error}",
            )

        # --------------------------
        # 6) Si se selecciona una, validar y asignar máquina inicial
        # --------------------------
        if data.maquina_asignada:
            maquina_id = data.maquina_asignada

            # Validar que la máquina exista y esté operativa
            maquina_res = (
                supabase.table("maquinas")
                .select("id, estado_operativo")
                .eq("id", maquina_id)
                .single()
                .execute()
            )

            if getattr(maquina_res, "error", None):
                raise HTTPException(
                    400,
                    f"Error obteniendo máquina: {maquina_res.error}",
                )

            maquina = maquina_res.data
            if not maquina:
                raise HTTPException(
                    400,
                    "La máquina seleccionada no existe."
                )

            if maquina["estado_operativo"] != "operativa":
                raise HTTPException(
                    400,
                    "La máquina seleccionada no está operativa y no puede ser asignada."
                )

            # Validar que la máquina no tenga un chofer asignado activo
            asign_activa = (
                supabase.table("asignaciones_chofer_maquina")
                .select("id")
                .eq("maquina_id", maquina_id)
                .is_("fecha_termino", None)
                .limit(1)
                .execute()
            )

            if getattr(asign_activa, "error", None):
                raise HTTPException(
                    400,
                    f"Error validando asignación activa: {asign_activa.error}",
                )

            if asign_activa.data:
                raise HTTPException(
                    400,
                    "La máquina ya está asignada actualmente a otro chofer."
                )

            # Crear asignación inicial
            asign_res = (
                supabase.table("asignaciones_chofer_maquina")
                .insert(
                    {
                        "maquina_id": maquina_id,
                        "chofer_id": chofer_id,
                        "fecha_inicio": date.today().isoformat(),
                        "fecha_termino": None,
                    }
                )
                .execute()
            )

            if getattr(asign_res, "error", None):
                raise HTTPException(
                    400,
                    f"Chofer creado, pero error asignando máquina: {asign_res.error}",
                )

        # Devuelvo el chofer creado (puedes adaptar a DriverRead si quieres)
        return chofer_res.data[0]

    except HTTPException:
        # rollback manual muy básico
        if chofer_id is not None:
            supabase.table("choferes").delete().eq("id", chofer_id).execute()
        if usuario_id is not None:
            supabase.table("usuarios").delete().eq("id", usuario_id).execute()
        # OJO: no borro el usuario en Auth; puedes considerar:
        # supabase.auth.admin.delete_user(supabase_uid)
        # si quieres mantener consistencia total entre Auth y DB.
        raise


async def list_drivers(current_user: dict):
    """
    Lista de choferes.
    Admin only.
    Estructura básica (completar)
    """
    require_admin(current_user)

    res = (
        supabase.table("choferes")
        .select("*, usuarios:usuarios!inner(id, correo)")
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error listando choferes: {res.error}")

    items = []

    for c in res.data:
        usuario = c.get("usuarios")

        if usuario and isinstance(usuario, dict):
            c["correo_electronico"] = usuario["correo"]
        else:
            # Caso raro, debería NO ocurrir ahora
            c["correo_electronico"] = None

        # eliminar el campo para que coincida con tu schema
        del c["usuarios"]

        items.append(c)

    return items

async def get_profile(current_user: dict):
    # 1. Obtener chofer_id
    chofer_id = current_user.get("chofer_id")
    if not chofer_id:
        raise HTTPException(status_code=400, detail="Usuario sin chofer asignado")

    # --- PASO 1: Consultar Datos del Chofer ---
    response_chofer = (
        supabase.table("choferes")
        .select("*")
        .eq("id", chofer_id)
        .single()
        .execute()
    )
    
    chofer = response_chofer.data
    if not chofer:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    # --- PASO 2: Consultar ID de la Máquina Asignada ---
    response_asignacion = (
        supabase.table("asignaciones_chofer_maquina")
        .select("maquina_id")
        .eq("chofer_id", chofer_id)
        .is_("fecha_termino", "null") # Vigente
        .limit(1)
        .execute()
    )
    
    # --- PASO 3: Consultar Detalles de la Máquina ---
    maquina_str = "Sin Asignar"
    
    if response_asignacion.data and len(response_asignacion.data) > 0:
        maquina_id = response_asignacion.data[0].get("maquina_id")
        
        if maquina_id:
            response_maquina = (
                supabase.table("maquinas")
                .select("numero_interno, marca") 
                .eq("id", maquina_id)
                .single()
                .execute()
            )
            
            if response_maquina.data:
                maq = response_maquina.data
                numero = maq.get('numero_interno', 'N/A')
                marca = maq.get('marca', 'N/A')
                maquina_str = f"{numero} - {marca}"

    # --- PASO 4: Formatear Respuesta ---
    segundo = f" {chofer.get('segundo_nombre')}" if chofer.get('segundo_nombre') else ""
    nombre_completo = f"{chofer['primer_nombre']}{segundo} {chofer['apellido_paterno']} {chofer['apellido_materno']}"

    # Fecha
    fecha_ingreso_raw = chofer.get("created_at")
    fecha_fmt = "--/--/----"
    if fecha_ingreso_raw:
        try:
            dt = datetime.fromisoformat(str(fecha_ingreso_raw).replace('Z', '+00:00'))
            fecha_fmt = dt.strftime("%d-%m-%Y")
        except:
            fecha_fmt = str(fecha_ingreso_raw).split("T")[0]

    return {
        "nombre_completo": nombre_completo,
        "rut": chofer["rut"],
        "telefono": chofer["telefono"],
        
        # --- CORRECCIÓN AQUÍ ---
        # Sacamos el email directamente de la tabla usuarios (current_user)
        # Si por alguna razón no está, usamos "Sin Email" para no romper el Schema.
        "email": current_user.get("correo") or "Sin Email", 
        
        "maquina_detalle": maquina_str,
        "fecha_ingreso": fecha_fmt,
        "estadisticas": {
            "dias_trabajados": 0,
            "total_recaudado": 0
        }
    }