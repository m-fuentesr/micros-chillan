from datetime import date, datetime
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