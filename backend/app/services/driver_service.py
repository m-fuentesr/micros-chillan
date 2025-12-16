from datetime import date, timedelta, datetime, timezone
from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.driver import DriverCreate
from app.services import alert_service
from app.utils.helpers import normalize_rut, validate_rut
import logging

logger = logging.getLogger(__name__)

async def get_summary():
    """
    Resumen superior de choferes:
    - Choferes activos
    - Choferes inactivos
    - Con máquina asignada
    - Sin asignar
    - Licencias en alerta (vencidas o por vencer en <=30 días)
    """

    hoy = date.today()
    limite_warning = hoy + timedelta(days=30)

    # ---------------------------------------------------------
    # 1) Obtener estados (activo / inactivo)
    # ---------------------------------------------------------
    estados_raw = (
        supabase.table("choferes")
        .select("id, estado, fecha_venc_licencia")
        .execute()
    )

    if getattr(estados_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo choferes: {estados_raw.error}")

    activos = 0
    inactivos = 0

    choferes_ids = []
    licencias_alerta = 0

    for ch in estados_raw.data:
        choferes_ids.append(ch["id"])

        # Estado activo/inactivo
        if ch["estado"] == "activo":
            activos += 1
        else:
            inactivos += 1

        # Evaluación de licencia
        fecha_str = ch.get("fecha_venc_licencia")
        if fecha_str:
            fv = date.fromisoformat(fecha_str)

            if fv < hoy:
                licencias_alerta += 1
            elif hoy <= fv <= limite_warning:
                licencias_alerta += 1

    # ---------------------------------------------------------
    # 2) Determinar máquinas asignadas
    #    (asignaciones activas: fecha_termino = NULL)
    # ---------------------------------------------------------
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("chofer_id")
        .is_("fecha_termino", None)
        .execute()
    )

    if getattr(asign_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo asignaciones: {asign_raw.error}")

    asignados_set = {a["chofer_id"] for a in asign_raw.data}
    con_maquina = len(asignados_set)
    sin_maquina = len(choferes_ids) - con_maquina

    # ---------------------------------------------------------
    # 3) Respuesta final
    # ---------------------------------------------------------
    return {
        "estados": {
            "activos": activos,
            "inactivos": inactivos,
        },
        "operatividad": {
            "con_maquina_asignada": con_maquina,
            "sin_asignar": sin_maquina,
        },
        "documentos": {
            "licencias_con_alerta": licencias_alerta
        }
    }


async def list_drivers(estado: str | None):
    """
    Lista principal de choferes para ADMIN.
    Genera alertas automáticas si la licencia está por vencer.
    """

    # ---------------------------------------------------------
    # 1) Obtener choferes + correo
    # ---------------------------------------------------------
    query = (
        supabase.table("choferes")
        .select("*, usuarios:usuarios!inner(correo)")
    )

    if estado == "activos":
        query = query.eq("estado", "activo")
    elif estado == "inactivos":
        query = query.eq("estado", "inactivo")
    elif estado == "eliminados":
        query = query.eq("estado", "eliminado")

    res = query.execute()
    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo choferes: {res.error}")

    choferes = res.data

    # ---------------------------------------------------------
    # 2) Obtener asignaciones activas
    # ---------------------------------------------------------
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("chofer_id, maquina_id, maquinas(numero_interno)")
        .is_("fecha_termino", None)
        .execute()
    )
    
    asign_map = {}
    for a in asign_raw.data:
        asign_map[a["chofer_id"]] = {
            "id": a["maquina_id"],
            "identificador": f"MÁQUINA {a['maquinas']['numero_interno']}",
        }

    # ---------------------------------------------------------
    # 2.5) ANTI-SPAM: Obtener alertas existentes (Activas o Recientes)
    # ---------------------------------------------------------
    tiempo_spam = datetime.now(timezone.utc) - timedelta(hours=24)
    tiempo_iso = tiempo_spam.isoformat()

    alertas_raw = (
        supabase.table("alertas")
        .select("origen_id, estado, created_at")
        .eq("origen_tipo", "chofer")
        .eq("tipo", "licencia_por_vencer") 
        .or_(f"estado.eq.activa,created_at.gte.{tiempo_iso}")
        .execute()
    )

    alertas_map = {}
    if alertas_raw.data:
        for a in alertas_raw.data:
            alertas_map[a["origen_id"]] = True

    # ---------------------------------------------------------
    # 3) Construir salida y Generar Alertas
    # ---------------------------------------------------------
    hoy = date.today()
    items = []

    for c in choferes:
        nombre = f"{c['primer_nombre']} {c['apellido_paterno']} {c['apellido_materno']}"
        cid = c["id"]

        if c["fecha_venc_licencia"]:
            fv = date.fromisoformat(c["fecha_venc_licencia"])
            dias = (fv - hoy).days

            if dias < 0:
                estado_lic = "danger"
            elif dias <= 30:
                estado_lic = "warning"
            else:
                estado_lic = "ok"
            
            # --- BLOQUE DE CREACIÓN DE ALERTA ---
            if estado_lic != "ok" and cid not in alertas_map:
                
                severidad = "critica" if estado_lic == "danger" else "advertencia"
                msg_inicio = "Licencia VENCIDA" if estado_lic == "danger" else "Licencia por vencer"
                
                # Diccionario EXACTO con los 5 argumentos que pide tu función
                nueva_alerta = {
                    "mensaje": f"{msg_inicio}: Chofer {c['primer_nombre']} {c['apellido_paterno']}",
                    "severidad": severidad,
                    "origen_tipo": "chofer",
                    "origen_id": cid,
                    "tipo": "licencia_por_vencer"
                }

                print(f"⚠️ Generando alerta de licencia para chofer {cid}")
                # Usamos ** para pasar los 5 argumentos por separado
                await alert_service.crear_alerta(**nueva_alerta)
                
                alertas_map[cid] = True
            # ------------------------------------

        else:
            fv = None
            dias = 0
            estado_lic = "unknown"

        items.append({
            "id": cid,
            "nombre_completo": nombre,
            "rut": c["rut"],
            "telefono": c["telefono"],
            "correo_electronico": c["usuarios"]["correo"],
            "estado": c["estado"],
            "maquina_actual": asign_map.get(cid),
            "licencia_estado": {
                "fecha_vencimiento": fv,
                "estado": estado_lic,
                "dias_restantes": dias,
            },
        })

    return items


async def list_active_drivers():
    """
    Retorna todos los choferes activos.
    Útil para mostrar en los selectores de creación/edición de máquinas.
    """
    res = (
        supabase.table("choferes")
        .select("id, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, estado")
        .eq("estado", "activo")
        .order("primer_nombre", desc=False)
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo choferes activos: {res.error}")

    items = []

    for c in res.data:
        nombre = f"{c['primer_nombre']} {c['apellido_paterno']} {c['apellido_materno']}"

        items.append({
            "id": c["id"],
            "nombre_completo": nombre
        })

    return items


async def get_driver_detail(driver_id: int):
    """
    Obtiene todos los datos necesarios para la vista completa
    de detalle del chofer (perfil).
    """

    # ---------------------------------------------------------
    # 1) Obtener chofer + correo
    # ---------------------------------------------------------
    res = (
        supabase.table("choferes")
        .select("*, usuarios:usuarios!inner(correo)")
        .eq("id", driver_id)
        .single()
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(404, "Chofer no encontrado")

    c = res.data

    # ---------------------------------------------------------
    # 2) Determinar máquina asignada actual
    # ---------------------------------------------------------
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("maquina_id, maquinas(numero_interno)")
        .eq("chofer_id", driver_id)
        .is_("fecha_termino", None)
        .maybe_single()
        .execute()
    )

    # Si hubo error distinto de "no rows", lo propagamos
    if asign_raw is not None and getattr(asign_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo asignación: {asign_raw.error}")

    maquina_actual = None
    if asign_raw is not None and asign_raw.data:
        data = asign_raw.data
        maquina_actual = {
            "id": data["maquina_id"],
            "identificador": f"MÁQUINA {data['maquinas']['numero_interno']}",
        }

    # ---------------------------------------------------------
    # 3) Calcular estado de licencia
    # ---------------------------------------------------------
    hoy = date.today()
    fv = date.fromisoformat(c["fecha_venc_licencia"])
    dias = (fv - hoy).days

    if dias < 0:
        estado_lic = "danger"
    elif dias <= 30:
        estado_lic = "warning"
    else:
        estado_lic = "ok"

    # ---------------------------------------------------------
    # 4) Construcción de respuesta final
    # ---------------------------------------------------------
    nombre_completo = f"{c['primer_nombre']} {c['apellido_paterno']} {c['apellido_materno']}"
    if c.get('segundo_nombre'):
        nombre_completo = f"{c['primer_nombre']} {c['segundo_nombre']} {c['apellido_paterno']} {c['apellido_materno']}"

    return {
        "id": c["id"],
        "nombre_completo": nombre_completo,
        "primer_nombre": c["primer_nombre"],
        "segundo_nombre": c.get("segundo_nombre"),
        "apellido_paterno": c["apellido_paterno"],
        "apellido_materno": c["apellido_materno"],
        "rut": c["rut"],
        "estado": c["estado"],
        "telefono": c["telefono"],
        "correo_electronico": c["usuarios"]["correo"],
        "porcentaje_pago": c["porcentaje_pago"],

        "maquina_actual": maquina_actual,

        "licencia": {
            "fecha_vencimiento": fv,
            "dias_restantes": dias,
            "estado": estado_lic
        }
    }


async def update_driver(driver_id: int, data):
    """
    Actualiza:
    - Información personal
    - Contacto
    - Estado
    - Porcentaje de pago
    - Correo del usuario
    - Máquina asignada
    - Fecha de vencimiento de licencia
    """
    hoy = date.today().isoformat()

    # ---------------------------------------------------------
    # 1. Verificar existencia del chofer y obtener 'estado' previo
    # ---------------------------------------------------------
    chofer_raw = (
        supabase.table("choferes")
        .select("id, estado")
        .eq("id", driver_id)
        .single()
        .execute()
    )
    if getattr(chofer_raw, "error", None):
        raise HTTPException(404, "Chofer no encontrado")

    estado_anterior = chofer_raw.data["estado"]

    # ---------------------------------------------------------
    # 2. Actualizar datos del chofer
    # ---------------------------------------------------------
    update_payload = {
        "primer_nombre": data.primer_nombre,
        "segundo_nombre": data.segundo_nombre,
        "apellido_paterno": data.apellido_paterno,
        "apellido_materno": data.apellido_materno,
        "rut": data.rut,
        "telefono": data.telefono,
        "estado": data.estado,
        "porcentaje_pago": data.porcentaje_pago,
        "fecha_venc_licencia": data.fecha_venc_licencia.isoformat()
    }

    upd = (
        supabase.table("choferes")
        .update(update_payload)
        .eq("id", driver_id)
        .execute()
    )
    if getattr(upd, "error", None):
        raise HTTPException(400, f"Error actualizando chofer: {upd.error}")

    # ---------------------------------------------------------
    # 3. Obtener usuario asociado (para correo + auth)
    # ---------------------------------------------------------
    usr = (
        supabase.table("usuarios")
        .select("id, supabase_uid")
        .eq("chofer_id", driver_id)
        .single()
        .execute()
    )
    if getattr(usr, "error", None):
        raise HTTPException(400, "No se pudo obtener el usuario asociado al chofer")

    usuario_id = usr.data["id"]
    supabase_uid = usr.data["supabase_uid"]

    # ---------------------------------------------------------
    # 3.1 Actualizar correo en Supabase Auth
    # ---------------------------------------------------------
    try:
        supabase.auth.admin.update_user_by_id(
            supabase_uid,
            {
                "email": data.correo_electronico,
                "email_confirm": True
            }
        )
    except Exception as e:
        raise HTTPException(400, f"Error actualizando correo en Supabase Auth: {e}")

    # ---------------------------------------------------------
    # 3.2 Actualizar correo en tabla 'usuarios'
    # ---------------------------------------------------------
    upd_user = (
        supabase.table("usuarios")
        .update({"correo": data.correo_electronico})
        .eq("id", usuario_id)
        .execute()
    )
    if getattr(upd_user, "error", None):
        raise HTTPException(400, "Error actualizando correo del usuario")

    # ---------------------------------------------------------
    # 4. Manejo de transición de estado (ACTIVO ↔ INACTIVO)
    # ---------------------------------------------------------
    estado_nuevo = data.estado

    # ===== Caso A → ACTIVO → INACTIVO =====
    if estado_anterior == "activo" and estado_nuevo == "inactivo":

        # 1) Desasignar máquina si la tiene
        asign_raw = (
            supabase.table("asignaciones_chofer_maquina")
            .select("id")
            .eq("chofer_id", driver_id)
            .is_("fecha_termino", None)
            .maybe_single()
            .execute()
        )

        if asign_raw.data:
            supabase.table("asignaciones_chofer_maquina").update(
                {"fecha_termino": hoy}
            ).eq("id", asign_raw.data["id"]).execute()

        # 2) Banear usuario
        try:
            supabase.auth.admin.update_user_by_id(
                supabase_uid,
                {"ban_duration": "876600h"}
            )
        except Exception as e:
            raise HTTPException(400, f"Error bloqueando usuario en Auth: {e}")

    # ===== Caso B → INACTIVO → ACTIVO =====
    if estado_anterior == "inactivo" and estado_nuevo == "activo":

        # Quitar el ban
        try:
            supabase.auth.admin.update_user_by_id(
                supabase_uid,
                {"ban_duration": "none"}
            )
        except Exception as e:
            raise HTTPException(400, f"Error reactivando usuario en Auth: {e}")

        # Nota: no se reasigna máquina automáticamente.
        # El admin debe elegir una máquina en el formulario.

    # ---------------------------------------------------------
    # 5. Manejo de asignación de máquina (si sigue activo)
    # ---------------------------------------------------------
    # Nota: si quedó inactivo, igual permitimos definir maquina_id=None
    # pero no permitimos asignarlo a una máquina mientras está inactivo.

    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id, maquina_id")
        .eq("chofer_id", driver_id)
        .is_("fecha_termino", None)
        .maybe_single()
        .execute()
    )

    asign_actual = asign_raw.data if asign_raw and asign_raw.data else None
    maquina_actual_id = asign_actual["maquina_id"] if asign_actual else None
    nueva_maquina = data.maquina_id

    # Si chofer está Inactivo, no puede tener máquina asignada
    if estado_nuevo == "inactivo":
        nueva_maquina = None

    # --- Caso 1: no cambia la máquina ---
    if nueva_maquina == maquina_actual_id:
        return {"message": "Chofer actualizado correctamente"}

    # --- Caso 2: tenía máquina y ahora es None ---
    if maquina_actual_id is not None and nueva_maquina is None:
        supabase.table("asignaciones_chofer_maquina").update(
            {"fecha_termino": hoy}
        ).eq("id", asign_actual["id"]).execute()
        return {"message": "Chofer actualizado correctamente"}

    # --- Caso 3: cambia a otra máquina ---
    if maquina_actual_id is not None and nueva_maquina is not None:
        supabase.table("asignaciones_chofer_maquina").update(
            {"fecha_termino": hoy}
        ).eq("id", asign_actual["id"]).execute()

    # --- Caso 4: asignación nueva ---
    if nueva_maquina is not None:
        supabase.table("asignaciones_chofer_maquina").insert({
            "chofer_id": driver_id,
            "maquina_id": nueva_maquina,
            "fecha_inicio": hoy,
            "fecha_termino": None
        }).execute()

    return {"message": "Chofer actualizado correctamente"}


async def create_driver(data: DriverCreate):
    """
    Crear un chofer nuevo + invitarlo vía correo usando Supabase Auth.

    Flujo:
    1) Solo admin puede hacerlo (validado en router).
    2) Crear usuario en Supabase Auth con password inicial = RUT sin DV.
    3) Usuario queda activo inmediatamente.
    4) Enviar correo para forzar cambio de contraseña.
    5) Obtener porcentaje_default desde configuracion_general.
    6) Crear registro en usuarios (vinculado al uid de Auth).
    7) Crear registro en choferes.
    8) Enlazar usuarios.chofer_id.
    9) (Opcional) Crear asignación inicial de máquina.
    """

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
    # 1) Crear usuario en Supabase Auth
    # Password inicial = RUT sin dígito verificador
    # --------------------------

    # Validar y normalizar RUT
    try:
        normalized_rut = normalize_rut(data.rut)
    except ValueError:
        raise HTTPException(400, "RUT inválido")

    if not validate_rut(normalized_rut):
        raise HTTPException(400, "RUT inválido")


    # Validar RUT duplicado (tabla choferes)
    existing_rut = (
        supabase.table("choferes")
        .select("id")
        .eq("rut", normalized_rut)
        .limit(1)
        .execute()
    )

    if getattr(existing_rut, "error", None):
        raise HTTPException(
            500, f"Error verificando RUT existente: {existing_rut.error}"
        )

    if existing_rut.data:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un chofer registrado con este RUT.",
        )

    
    rut_password = normalized_rut.replace(".", "").replace("-", "")[:-1]

    supabase_uid = None

    try:
        auth_res = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": rut_password,
                "email_confirm": True,  # activo desde su creación
                "user_metadata": {
                    "rol": "chofer",
                    "rut": normalized_rut,
                    "primer_nombre": data.primer_nombre,
                    "apellido_paterno": data.apellido_paterno,
                },
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error creando usuario en Supabase Auth: {e}",
        )

    auth_user = getattr(auth_res, "user", None)
    if not auth_user or not getattr(auth_user, "id", None):
        raise HTTPException(
            status_code=500,
            detail="Supabase no devolvió el UID del usuario Auth creado.",
        )

    supabase_uid = auth_user.id

    # --------------------------
    # 2) Enviar correo para forzar cambio de contraseña
    # --------------------------
    try:
        supabase.auth.reset_password_for_email(email)
    except Exception as e:
        # No rompemos el flujo completo si falla el correo
        logger.error(f"Error enviando correo de cambio de contraseña: {e}")

    # --------------------------
    # 3) Obtener porcentaje default
    # --------------------------
    cfg = (
        supabase.table("configuracion_general")
        .select("porcentaje_default")
        .single()
        .execute()
    )

    if getattr(cfg, "error", None):
        # rollback Auth
        supabase.auth.admin.delete_user(supabase_uid)
        raise HTTPException(
            500, f"Error obteniendo configuración general: {cfg.error}"
        )

    porcentaje_default = cfg.data["porcentaje_default"]

    usuario_id = None
    chofer_id = None

    try:
        # --------------------------
        # 4) Crear usuario en tabla usuarios
        # --------------------------
        usuario_payload = {
            "correo": email,
            "supabase_uid": supabase_uid,
            "rol_id": 2,  # chofer
            "estado": "activo",
            "chofer_id": None,
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
        # 5) Crear chofer
        # --------------------------
        chofer_payload = {
            "primer_nombre": data.primer_nombre,
            "segundo_nombre": data.segundo_nombre,
            "apellido_paterno": data.apellido_paterno,
            "apellido_materno": data.apellido_materno,
            "rut": normalized_rut,
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
            raise HTTPException(
                400, f"Error creando chofer: {chofer_res.error}"
            )

        chofer_id = chofer_res.data[0]["id"]

        # --------------------------
        # 6) Enlazar usuarios.chofer_id
        # --------------------------
        link_res = (
            supabase.table("usuarios")
            .update({"chofer_id": chofer_id})
            .eq("id", usuario_id)
            .execute()
        )

        if getattr(link_res, "error", None):
            raise HTTPException(
                400,
                f"Chofer creado, pero error enlazando usuario con chofer: {link_res.error}",
            )

        # --------------------------
        # 7) Asignación inicial de máquina (opcional)
        # --------------------------
        maquina_id = data.maquina_asignada

        if maquina_id is not None:
            maquina_id = int(maquina_id)

            maquina_res = (
                supabase.table("maquinas")
                .select("id, estado_operativo")
                .eq("id", maquina_id)
                .single()
                .execute()
            )

            if getattr(maquina_res, "error", None) or not maquina_res.data:
                raise HTTPException(
                    400,
                    "La máquina seleccionada no existe.",
                )

            if maquina_res.data["estado_operativo"] != "operativa":
                raise HTTPException(
                    400,
                    "La máquina seleccionada no está operativa.",
                )

            asign_activa = (
                supabase.table("asignaciones_chofer_maquina")
                .select("id")
                .eq("maquina_id", maquina_id)
                .is_("fecha_termino", None)
                .limit(1)
                .execute()
            )

            if asign_activa.data:
                raise HTTPException(
                    400,
                    "La máquina ya está asignada a otro chofer.",
                )

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

        # --------------------------
        # OK
        # --------------------------
        return chofer_res.data[0]

    except HTTPException:
        # --------------------------
        # Rollback manual consistente
        # --------------------------
        if chofer_id:
            supabase.table("choferes").delete().eq("id", chofer_id).execute()

        if usuario_id:
            supabase.table("usuarios").delete().eq("id", usuario_id).execute()

        if supabase_uid:
            supabase.auth.admin.delete_user(supabase_uid)

        raise


async def delete_driver(driver_id: int):
    """
    Elimina la cuenta del chofer:
    - Desasigna la máquina si la tiene
    - Elimina su usuario interno (tabla usuarios)
    - Elimina su cuenta en Supabase Auth
    - Marca el chofer como 'eliminado'

    Nota: No se eliminan registros diarios, liquidaciones ni historial.
    """

    # ---------------------------------------------------------
    # 1) Verificar existencia del chofer
    # ---------------------------------------------------------
    chofer_res = (
        supabase.table("choferes")
        .select("id, estado")
        .eq("id", driver_id)
        .single()
        .execute()
    )

    if getattr(chofer_res, "error", None):
        raise HTTPException(404, "Chofer no encontrado")

    # ---------------------------------------------------------
    # 2) Obtener usuario asociado (si existe)
    # ---------------------------------------------------------
    usr_res = (
        supabase.table("usuarios")
        .select("id, supabase_uid")
        .eq("chofer_id", driver_id)
        .maybe_single()
        .execute()
    )

    if getattr(usr_res, "error", None):
        raise HTTPException(400, f"Error obteniendo usuario asociado: {usr_res.error}")

    usuario_id = None
    supabase_uid = None

    if usr_res.data:
        usuario_id = usr_res.data["id"]
        supabase_uid = usr_res.data["supabase_uid"]

    # ---------------------------------------------------------
    # 3) Desasignar máquina actual (fecha_termino = hoy)
    # ---------------------------------------------------------
    hoy = date.today().isoformat()

    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id")
        .eq("chofer_id", driver_id)
        .is_("fecha_termino", None)
        .maybe_single()
        .execute()
    )

    if getattr(asign_raw, "error", None):
        raise HTTPException(400, f"Error buscando asignación activa: {asign_raw.error}")

    if asign_raw.data:
        # Cerrar asignación
        supabase.table("asignaciones_chofer_maquina").update(
            {"fecha_termino": hoy}
        ).eq("id", asign_raw.data["id"]).execute()

    # ---------------------------------------------------------
    # 4) Eliminar usuario interno (tabla usuarios)
    # ---------------------------------------------------------
    if usuario_id:
        del_usr = (
            supabase.table("usuarios")
            .delete()
            .eq("id", usuario_id)
            .execute()
        )

        if getattr(del_usr, "error", None):
            raise HTTPException(400, f"Error eliminando usuario interno: {del_usr.error}")

    # ---------------------------------------------------------
    # 5) Eliminar cuenta en Supabase Auth
    # ---------------------------------------------------------
    if supabase_uid:
        try:
            supabase.auth.admin.delete_user(supabase_uid)
        except Exception as e:
            # Mantener sistema consistente: el usuario interno ya fue eliminado,
            # pero Auth falló. El chofer seguirá sin acceso igualmente.
            raise HTTPException(400, f"Error eliminando usuario en Auth: {e}")

    # ---------------------------------------------------------
    # 6) Marcar chofer como 'eliminado'
    # ---------------------------------------------------------
    upd_ch = (
        supabase.table("choferes")
        .update({"estado": "eliminado"})
        .eq("id", driver_id)
        .execute()
    )

    if getattr(upd_ch, "error", None):
        raise HTTPException(400, f"Error marcando chofer como eliminado: {upd_ch.error}")

    return {"message": "Chofer eliminado correctamente"}
