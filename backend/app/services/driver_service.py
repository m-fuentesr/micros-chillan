from datetime import date, timedelta, datetime, timezone
from typing import Optional
from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.core.config import settings
from app.schemas.driver import DriverCreate, DriverReintegrate
from app.services import alert_service
from app.utils.helpers import normalize_rut, validate_rut
import logging

logger = logging.getLogger(__name__)


def build_nombre_completo(primer_nombre: str | None, segundo_nombre: str | None, 
                         apellido_paterno: str | None, apellido_materno: str | None) -> str:
    """
    Construye el nombre completo de un chofer manejando correctamente valores None.
    Evita que aparezca "None" como texto en el nombre.
    """
    parts = []
    
    # Agregar primer nombre (requerido)
    if primer_nombre:
        parts.append(primer_nombre.strip())
    
    # Agregar segundo nombre si existe
    if segundo_nombre:
        parts.append(segundo_nombre.strip())
    
    # Agregar apellido paterno (requerido)
    if apellido_paterno:
        parts.append(apellido_paterno.strip())
    
    # Agregar apellido materno si existe
    if apellido_materno:
        parts.append(apellido_materno.strip())
    
    # Si no hay partes, retornar un valor por defecto
    if not parts:
        return "Sin nombre"
    
    return " ".join(parts)


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
    cfg_res = (
        supabase.table("configuracion_general")
        .select("dias_alerta_licencia_por_vencer")
        .single()
        .execute()
    )
    if getattr(cfg_res, "error", None):
        raise HTTPException(400, f"Error obteniendo configuración: {cfg_res.error}")
    dias_alerta = cfg_res.data.get("dias_alerta_licencia_por_vencer") if cfg_res.data else None
    if dias_alerta is None:
        raise HTTPException(400, "Configuración general no tiene dias_alerta_licencia_por_vencer definido.")
    limite_warning = hoy + timedelta(days=dias_alerta)

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


async def list_drivers(filters):
    """
    Lista principal de choferes para ADMIN con paginación.
    Genera alertas automáticas si la licencia está por vencer.
    """
    hoy = date.today()
    cfg_res = (
        supabase.table("configuracion_general")
        .select("dias_alerta_licencia_por_vencer")
        .single()
        .execute()
    )
    if getattr(cfg_res, "error", None):
        raise HTTPException(400, f"Error obteniendo configuración: {cfg_res.error}")
    dias_alerta = cfg_res.data.get("dias_alerta_licencia_por_vencer") if cfg_res.data else None
    if dias_alerta is None:
        raise HTTPException(400, "Configuración general no tiene dias_alerta_licencia_por_vencer definido.")
    limite_warning = hoy + timedelta(days=dias_alerta)

    # ---------------------------------------------------------
    # 1) Construir query base con filtros
    # ---------------------------------------------------------
    base_query = (
        supabase.table("choferes")
        .select("*, usuarios:usuarios!inner(correo)", count="exact")
    )

    # Aplicar filtro de estado
    if filters.estado == "activos":
        base_query = base_query.eq("estado", "activo")
    elif filters.estado == "inactivos":
        base_query = base_query.eq("estado", "inactivo")
    elif filters.estado == "eliminados":
        base_query = base_query.eq("estado", "eliminado")

    # Aplicar búsqueda si existe
    if filters.search:
        search_term = f"%{filters.search}%"
        base_query = base_query.or_(f"primer_nombre.ilike.{search_term},apellido_paterno.ilike.{search_term},rut.ilike.{search_term}")

    # Si hay filtro de licencia, necesitamos obtener TODOS los choferes primero
    if filters.licencia_estado:
        # Obtener todas las choferes sin paginar
        choferes_raw = base_query.execute()
        
        if getattr(choferes_raw, "error", None):
            raise HTTPException(400, f"Error obteniendo choferes: {choferes_raw.error}")
        
        choferes = choferes_raw.data
    else:
        # Sin filtro de licencia, podemos paginar directamente
        # Obtener total primero
        count_res = base_query.execute()
        if getattr(count_res, "error", None):
            raise HTTPException(400, f"Error obteniendo choferes: {count_res.error}")
        
        total = count_res.count or 0
        
        # Aplicar paginación
        start = (filters.page - 1) * filters.per_page
        end = start + filters.per_page - 1
        
        # Obtener choferes paginados
        choferes_raw = (
            base_query
            .order("apellido_paterno")
            .range(start, end)
            .execute()
        )

        if getattr(choferes_raw, "error", None):
            raise HTTPException(400, f"Error obteniendo choferes: {choferes_raw.error}")

        choferes = choferes_raw.data

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
        nombre = build_nombre_completo(
            c.get('primer_nombre'),
            c.get('segundo_nombre'),
            c.get('apellido_paterno'),
            c.get('apellido_materno')
        )
        cid = c["id"]

        if c["fecha_venc_licencia"]:
            fv = date.fromisoformat(c["fecha_venc_licencia"])
            dias = (fv - hoy).days

            if dias < 0:
                estado_lic = "danger"
            elif dias <= dias_alerta:
                estado_lic = "warning"
            else:
                estado_lic = "ok"
            
            # --- BLOQUE DE CREACIÓN DE ALERTA ---
            if estado_lic != "ok" and cid not in alertas_map:
                
                severidad = "critica" if estado_lic == "danger" else "advertencia"
                msg_inicio = "Licencia VENCIDA" if estado_lic == "danger" else "Licencia por vencer"
                
                # Construir nombre del chofer para el mensaje
                nombre_chofer = build_nombre_completo(
                    c.get('primer_nombre'),
                    None,  # No incluir segundo nombre en alertas
                    c.get('apellido_paterno'),
                    None   # No incluir apellido materno en alertas
                )
                
                # Diccionario EXACTO con los 5 argumentos que pide tu función
                nueva_alerta = {
                    "mensaje": f"{msg_inicio}: Chofer {nombre_chofer}",
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

        # Verificar si pasa el filtro de licencia
        if filters.licencia_estado:
            if filters.licencia_estado == "vencidas":
                if estado_lic != "danger":
                    continue
            elif filters.licencia_estado == "por_vencer":
                if estado_lic != "warning":
                    continue
            elif filters.licencia_estado == "vigentes":
                if estado_lic != "ok":
                    continue

        items.append({
            "id": cid,
            "nombre_completo": nombre,
            "rut": c["rut"],
            "telefono": c["telefono"],
            "correo_electronico": c["usuarios"]["correo"],
            "estado": c["estado"],
            "porcentaje_pago": c["porcentaje_pago"],
            "maquina_actual": asign_map.get(cid),
            "licencia_estado": {
                "fecha_vencimiento": fv,
                "estado": estado_lic,
                "dias_restantes": dias,
            },
        })

    # Si hay filtro de licencia, calcular total después del filtro y aplicar paginación
    if filters.licencia_estado:
        total = len(items)
        # Aplicar paginación
        start = (filters.page - 1) * filters.per_page
        end = start + filters.per_page
        items = items[start:end]
    else:
        # Sin filtro de licencia, el total ya se calculó antes
        pass

    from app.core.pagination import PaginatedResponse
    return PaginatedResponse(
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        items=items
    )


async def get_license_alerts(estado: Optional[str] = None):
    """
    Obtiene conteos de conductores por estado de licencia.
    Opcionalmente filtra por estado del conductor.
    Por defecto excluye conductores eliminados (solo activos e inactivos).
    """
    hoy = date.today()
    cfg_res = (
        supabase.table("configuracion_general")
        .select("dias_alerta_licencia_por_vencer")
        .single()
        .execute()
    )
    if getattr(cfg_res, "error", None):
        raise HTTPException(400, f"Error obteniendo configuración: {cfg_res.error}")
    dias_alerta = cfg_res.data.get("dias_alerta_licencia_por_vencer") if cfg_res.data else None
    if dias_alerta is None:
        raise HTTPException(400, "Configuración general no tiene dias_alerta_licencia_por_vencer definido.")
    limite_warning = hoy + timedelta(days=dias_alerta)

    # 1) Obtener choferes (con filtro de estado si aplica)
    base_query = supabase.table("choferes").select("id, fecha_venc_licencia")
    
    if estado == "activos":
        base_query = base_query.eq("estado", "activo")
    elif estado == "inactivos":
        base_query = base_query.eq("estado", "inactivo")
    else:
        # Por defecto (todos o None), excluir eliminados (solo activos e inactivos)
        # Esto coincide con el comportamiento de list_drivers cuando estado es "todos"
        base_query = base_query.in_("estado", ["activo", "inactivo"])
    
    choferes_raw = base_query.execute()
    if getattr(choferes_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo choferes: {choferes_raw.error}")
    
    choferes = choferes_raw.data

    # 2) Calcular estados de licencia
    vencidas = 0
    por_vencer = 0
    vigentes = 0
    
    for c in choferes:
        if not c.get("fecha_venc_licencia"):
            continue
            
        fv = date.fromisoformat(c["fecha_venc_licencia"])
        dias = (fv - hoy).days

        if dias < 0:
            vencidas += 1
        elif dias <= dias_alerta:
            por_vencer += 1
        else:
            vigentes += 1

    return {
        "vencidas": vencidas,
        "por_vencer": por_vencer,
        "vigentes": vigentes
    }


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
        nombre = build_nombre_completo(
            c.get('primer_nombre'),
            c.get('segundo_nombre'),
            c.get('apellido_paterno'),
            c.get('apellido_materno')
        )

        items.append({
            "id": c["id"],
            "nombre_completo": nombre
        })

    return items


async def list_active_drivers_without_machine():
    """
    Retorna todos los choferes activos que NO tienen una máquina asignada.
    Útil para mostrar en el selector de creación de máquinas.
    """
    # 1. Obtener todos los choferes activos
    choferes_res = (
        supabase.table("choferes")
        .select("id, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, estado")
        .eq("estado", "activo")
        .order("primer_nombre", desc=False)
        .execute()
    )

    if getattr(choferes_res, "error", None):
        raise HTTPException(400, f"Error obteniendo choferes activos: {choferes_res.error}")

    # 2. Obtener todos los choferes que tienen máquina asignada (asignaciones activas)
    asignaciones_res = (
        supabase.table("asignaciones_chofer_maquina")
        .select("chofer_id")
        .is_("fecha_termino", None)
        .execute()
    )

    if getattr(asignaciones_res, "error", None):
        raise HTTPException(400, f"Error obteniendo asignaciones activas: {asignaciones_res.error}")

    # 3. Crear un set con los IDs de choferes que tienen máquina asignada
    choferes_con_maquina = {asignacion["chofer_id"] for asignacion in asignaciones_res.data}

    # 4. Filtrar choferes activos que NO están en el set de choferes con máquina
    items = []

    for c in choferes_res.data:
        chofer_id = c["id"]
        
        # Solo incluir si NO tiene máquina asignada
        if chofer_id not in choferes_con_maquina:
            nombre = build_nombre_completo(
                c.get('primer_nombre'),
                c.get('segundo_nombre'),
                c.get('apellido_paterno'),
                c.get('apellido_materno')
            )

            items.append({
                "id": chofer_id,
                "nombre_completo": nombre
            })

    return items


async def list_deleted_drivers():
    """
    Retorna choferes eliminados con los datos mínimos para reintegración.
    """
    res = (
        supabase.table("choferes")
        .select(
            "id, rut, telefono, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno"
        )
        .eq("estado", "eliminado")
        .order("primer_nombre", desc=False)
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo choferes eliminados: {res.error}")

    items = []

    for c in res.data:
        nombre = build_nombre_completo(
            c.get("primer_nombre"),
            c.get("segundo_nombre"),
            c.get("apellido_paterno"),
            c.get("apellido_materno"),
        )

        items.append(
            {
                "id": c["id"],
                "nombre_completo": nombre,
                "rut": c.get("rut"),
                "telefono": c.get("telefono"),
            }
        )

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
    cfg_res = (
        supabase.table("configuracion_general")
        .select("dias_alerta_licencia_por_vencer")
        .single()
        .execute()
    )
    if getattr(cfg_res, "error", None):
        raise HTTPException(400, f"Error obteniendo configuración: {cfg_res.error}")
    dias_alerta = cfg_res.data.get("dias_alerta_licencia_por_vencer") if cfg_res.data else None
    if dias_alerta is None:
        raise HTTPException(400, "Configuración general no tiene dias_alerta_licencia_por_vencer definido.")
    
    hoy = date.today()
    fv = date.fromisoformat(c["fecha_venc_licencia"])
    dias = (fv - hoy).days

    if dias < 0:
        estado_lic = "danger"
    elif dias <= dias_alerta:
        estado_lic = "warning"
    else:
        estado_lic = "ok"

    # ---------------------------------------------------------
    # 4) Construcción de respuesta final
    # ---------------------------------------------------------
    primer_nombre = c.get("primer_nombre") or None
    segundo_nombre = c.get("segundo_nombre") or None
    apellido_paterno = c.get("apellido_paterno") or None
    apellido_materno = c.get("apellido_materno") or None

    nombre_completo = build_nombre_completo(
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno
    )

    fecha_contrato = None
    if c.get("fecha_contrato"):
        fecha_contrato = date.fromisoformat(c["fecha_contrato"])

    return {
        "id": c["id"],
        "nombre_completo": nombre_completo,
        "primer_nombre": primer_nombre,
        "segundo_nombre": segundo_nombre,
        "apellido_paterno": apellido_paterno,
        "apellido_materno": apellido_materno,
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
        },
        "fecha_contrato": fecha_contrato
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

    # Normalizar correo para evitar duplicados por mayúsculas/espacios
    nuevo_correo = data.correo_electronico.strip().lower()

    # ---------------------------------------------------------
    # 2. Obtener usuario asociado (para Auth + usuarios)
    # ---------------------------------------------------------
    usr = (
        supabase.table("usuarios")
        .select("id, supabase_uid, correo")
        .eq("chofer_id", driver_id)
        .single()
        .execute()
    )
    if getattr(usr, "error", None):
        raise HTTPException(400, "No se pudo obtener el usuario asociado al chofer")

    usuario_id = usr.data["id"]
    supabase_uid = usr.data["supabase_uid"]
    correo_actual_db = (usr.data.get("correo") or "").lower()

    if not supabase_uid:
        raise HTTPException(
            400,
            "El usuario asociado no tiene un UID de autenticación válido."
        )

    # ---------------------------------------------------------
    # 3. Validar duplicado SOLO en tabla usuarios
    # ---------------------------------------------------------
    correo_existente = (
        supabase.table("usuarios")
        .select("id")
        .eq("correo", nuevo_correo)
        .neq("id", usuario_id)
        .limit(1)
        .execute()
    )
    if getattr(correo_existente, "error", None):
        raise HTTPException(
            500,
            f"Error verificando duplicado de correo: {correo_existente.error}"
        )

    if correo_existente.data:
        raise HTTPException(
            400,
            "Ya existe un usuario registrado con ese correo electrónico."
        )

    # ---------------------------------------------------------
    # 4. Actualizar correo en Supabase Auth (SOLO si cambió)
    # ---------------------------------------------------------
    try:
        auth_user = supabase.auth.admin.get_user_by_id(supabase_uid)
        correo_actual_auth = (auth_user.user.email or "").lower()
    except Exception as e:
        raise HTTPException(
            500,
            f"No se pudo obtener el usuario de autenticación: {e}"
        )

    if correo_actual_auth != nuevo_correo:
        try:
            supabase.auth.admin.update_user_by_id(
                supabase_uid,
                {"email": nuevo_correo}
            )
        except Exception:
            raise HTTPException(
                400,
                "El correo ya está en uso en el sistema de autenticación."
            )

        # Mantener sincronizada la tabla usuarios
        upd_user = (
            supabase.table("usuarios")
            .update({"correo": nuevo_correo})
            .eq("id", usuario_id)
            .execute()
        )
        if getattr(upd_user, "error", None):
            raise HTTPException(
                400,
                "Error actualizando correo del usuario."
            )

    # ---------------------------------------------------------
    # 5. Actualizar datos del chofer
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
        "fecha_venc_licencia": data.fecha_venc_licencia.isoformat(),
        "fecha_contrato": (
            data.fecha_contrato.isoformat()
            if data.fecha_contrato
            else None
        ),
    }

    upd = (
        supabase.table("choferes")
        .update(update_payload)
        .eq("id", driver_id)
        .execute()
    )
    if getattr(upd, "error", None):
        raise HTTPException(
            400,
            f"Error actualizando chofer: {upd.error}"
        )

    # ---------------------------------------------------------
    # 6. Manejo de transición de estado (ACTIVO ↔ INACTIVO)
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

        if asign_raw and asign_raw.data:
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
    # 7. Manejo de asignación de máquina (si sigue activo)
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
    """

    # Normalizar correo
    email = data.correo_electronico.strip().lower()

    # --------------------------
    # 0) Verificar duplicado en tabla usuarios
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
            400,
            "Ya existe un usuario registrado con ese correo electrónico.",
        )

    # --------------------------
    # 1) Validar y normalizar RUT
    # --------------------------
    try:
        normalized_rut = normalize_rut(data.rut)
    except ValueError:
        raise HTTPException(400, "RUT inválido")

    if not validate_rut(normalized_rut):
        raise HTTPException(400, "RUT inválido")

    # Validar RUT duplicado ANTES de crear Auth
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
            400,
            "Ya existe un chofer registrado con este RUT.",
        )

    # --------------------------
    # 2) Crear usuario en Supabase Auth
    # Password inicial = RUT sin DV
    # --------------------------
    rut_password = normalized_rut.replace(".", "").replace("-", "")[:-1]

    try:
        auth_res = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": rut_password,
                "user_metadata": {
                    "rol": "chofer",
                    "rut": normalized_rut,
                    "primer_nombre": data.primer_nombre,
                    "apellido_paterno": data.apellido_paterno,
                },
            }
        )
    except Exception as e:
        detalle = str(e)
        if "already been registered" in detalle.lower():
            detalle = "Ya existe un usuario registrado en el sistema con este correo."
        raise HTTPException(400, detalle)

    auth_user = getattr(auth_res, "user", None)
    if not auth_user or not getattr(auth_user, "id", None):
        raise HTTPException(
            500,
            "Supabase no devolvió el UID del usuario Auth creado.",
        )

    supabase_uid = auth_user.id

    # --------------------------
    # 3) Enviar Magic Link (bienvenida + forzar cambio de clave)
    # --------------------------
    try:
        redirect_url = f"{settings.FRONTEND_URL}/restablecer-clave"

        supabase.auth.sign_in_with_otp({
            "email": email,
            "options": {
                "email_redirect_to": redirect_url
            }
        })
    except Exception as e:
        logger.warning(f"Error enviando Magic Link: {e}")

    # --------------------------
    # 4) Obtener porcentaje default
    # --------------------------
    cfg = (
        supabase.table("configuracion_general")
        .select("porcentaje_default")
        .single()
        .execute()
    )

    if getattr(cfg, "error", None):
        supabase.auth.admin.delete_user(supabase_uid)
        raise HTTPException(
            500, f"Error obteniendo configuración general: {cfg.error}"
        )

    porcentaje_default = cfg.data["porcentaje_default"]

    usuario_id = None
    chofer_id = None

    # --------------------------
    # Rollback
    # --------------------------
    def rollback_creacion():
        if usuario_id:
            try:
                supabase.table("usuarios").delete().eq("id", usuario_id).execute()
            except Exception:
                pass

        if chofer_id:
            try:
                supabase.table("choferes").delete().eq("id", chofer_id).execute()
            except Exception:
                pass

        if supabase_uid:
            try:
                supabase.auth.admin.delete_user(supabase_uid)
            except Exception:
                pass

    try:
        # --------------------------
        # 5) Crear usuario en tabla usuarios
        # --------------------------
        usuario_res = (
            supabase.table("usuarios")
            .insert({
                "correo": email,
                "supabase_uid": supabase_uid,
                "rol_id": 2,
                "estado": "activo",
                "chofer_id": None,
            })
            .execute()
        )

        if getattr(usuario_res, "error", None):
            raise HTTPException(
                400, f"Error creando usuario asociado: {usuario_res.error}"
            )

        usuario_id = usuario_res.data[0]["id"]

        # --------------------------
        # 6) Crear chofer
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

        if data.fecha_contrato:
            chofer_payload["fecha_contrato"] = data.fecha_contrato.isoformat()

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
        # 7) Enlazar usuario ↔ chofer
        # --------------------------
        supabase.table("usuarios").update(
            {"chofer_id": chofer_id}
        ).eq("id", usuario_id).execute()

        return chofer_res.data[0]

    except HTTPException:
        rollback_creacion()
        raise
    except Exception as ex:
        rollback_creacion()
        logger.exception("Error inesperado creando chofer")
        raise HTTPException(500, f"Error creando chofer: {ex}")


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

    asign_error = getattr(asign_raw, "error", None) if asign_raw is not None else None
    asign_data = getattr(asign_raw, "data", None) if asign_raw is not None else None

    if asign_error:
        raise HTTPException(400, f"Error buscando asignación activa: {asign_error}")

    if asign_data:
        # Cerrar asignación
        supabase.table("asignaciones_chofer_maquina").update(
            {"fecha_termino": hoy}
        ).eq("id", asign_data["id"]).execute()
        
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


async def reintegrate_driver(driver_id: int, data: DriverReintegrate):
    """
    Reintegra un chofer previamente eliminado.
    """

    # 1) Obtener chofer y validar estado
    chofer_res = (
        supabase.table("choferes")
        .select(
            "id, estado, rut, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno"
        )
        .eq("id", driver_id)
        .single()
        .execute()
    )

    if getattr(chofer_res, "error", None) or not chofer_res.data:
        raise HTTPException(404, "Chofer no encontrado")

    chofer_data = chofer_res.data

    if chofer_data.get("estado") != "eliminado":
        raise HTTPException(400, "Solo se pueden reintegrar choferes eliminados.")

    # Validar RUT almacenado
    normalized_rut = chofer_data.get("rut")

    if not normalized_rut:
        raise HTTPException(
            400,
            "El chofer no tiene un RUT válido almacenado."
        )

    email = data.correo_electronico.strip().lower()

    # 2) Verificar duplicado en usuarios
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
        raise HTTPException(400, "Ya existe un usuario registrado con ese correo.")

    # Verificar que el chofer no tenga usuario asociado
    linked_user = (
        supabase.table("usuarios")
        .select("id")
        .eq("chofer_id", driver_id)
        .limit(1)
        .execute()
    )

    if getattr(linked_user, "error", None):
        raise HTTPException(500, f"Error verificando usuario asociado: {linked_user.error}")

    if linked_user.data:
        raise HTTPException(400, "El chofer ya tiene un usuario asociado.")

    rut_password = normalized_rut.replace(".", "").replace("-", "")[:-1]

    supabase_uid = None
    usuario_id = None
    chofer_reactivado = False

    try:
        # 3) Crear usuario en Supabase Auth
        try:
            auth_res = supabase.auth.admin.create_user(
                {
                    "email": email,
                    "password": rut_password,
                    "user_metadata": {
                        "rol": "chofer",
                        "rut": normalized_rut,
                        "primer_nombre": chofer_data.get("primer_nombre"),
                        "apellido_paterno": chofer_data.get("apellido_paterno"),
                    },
                }
            )
        except Exception as e:
            detalle = str(e)
            if "already been registered" in detalle.lower():
                detalle = "Ya existe un usuario registrado en el sistema con este correo."
            raise HTTPException(400, detalle)

        auth_user = getattr(auth_res, "user", None)
        if not auth_user or not getattr(auth_user, "id", None):
            raise HTTPException(500, "Supabase no devolvió el UID del usuario Auth creado.")

        supabase_uid = auth_user.id

        # 4) Enviar Magic Link
        try:
            redirect_url = f"{settings.FRONTEND_URL}/restablecer-clave"
            supabase.auth.sign_in_with_otp(
                {
                    "email": email,
                    "options": {
                        "email_redirect_to": redirect_url
                    }
                }
            )
        except Exception as e:
            logger.warning(f"Error enviando Magic Link: {e}")

        # 5) Crear usuario en tabla usuarios
        usuario_res = (
            supabase.table("usuarios")
            .insert({
                "correo": email,
                "supabase_uid": supabase_uid,
                "rol_id": 2,
                "estado": "activo",
                "chofer_id": driver_id,
            })
            .execute()
        )

        if getattr(usuario_res, "error", None):
            raise HTTPException(400, f"Error creando usuario asociado: {usuario_res.error}")

        usuario_id = usuario_res.data[0]["id"]

        # 6) Asignación de máquina (opcional)
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
                raise HTTPException(400, "La máquina seleccionada no existe.")

            if maquina_res.data["estado_operativo"] != "operativa":
                raise HTTPException(400, "La máquina seleccionada no está operativa.")

            asign_activa = (
                supabase.table("asignaciones_chofer_maquina")
                .select("id")
                .eq("maquina_id", maquina_id)
                .is_("fecha_termino", None)
                .limit(1)
                .execute()
            )

            if asign_activa.data:
                raise HTTPException(400, "La máquina ya está asignada a otro chofer.")

            asign_res = (
                supabase.table("asignaciones_chofer_maquina")
                .insert({
                    "maquina_id": maquina_id,
                    "chofer_id": driver_id,
                    "fecha_inicio": date.today().isoformat(),
                    "fecha_termino": None,
                })
                .execute()
            )

            if getattr(asign_res, "error", None):
                raise HTTPException(
                    400,
                    f"Chofer reintegrado, pero error asignando máquina: {asign_res.error}",
                )

        # 7) Reactivar chofer
        upd_res = (
            supabase.table("choferes")
            .update({"estado": "activo"})
            .eq("id", driver_id)
            .execute()
        )

        if getattr(upd_res, "error", None):
            raise HTTPException(400, f"Error reactivando chofer: {upd_res.error}")

        chofer_reactivado = True

        return {"message": "Chofer reintegrado correctamente"}

    except HTTPException:
        if usuario_id:
            supabase.table("usuarios").delete().eq("id", usuario_id).execute()

        if chofer_reactivado:
            supabase.table("choferes").update({"estado": "eliminado"}).eq("id", driver_id).execute()

        if supabase_uid:
            try:
                supabase.auth.admin.delete_user(supabase_uid)
            except Exception as e:
                logger.warning(f"Error eliminando usuario en Auth durante rollback: {e}")

        raise

    except Exception as e:
        if usuario_id:
            supabase.table("usuarios").delete().eq("id", usuario_id).execute()

        if chofer_reactivado:
            supabase.table("choferes").update({"estado": "eliminado"}).eq("id", driver_id).execute()

        if supabase_uid:
            try:
                supabase.auth.admin.delete_user(supabase_uid)
            except Exception as ex:
                logger.warning(f"Error eliminando usuario en Auth durante rollback: {ex}")

        logger.error(f"Error inesperado reintegrando chofer: {e}")
        raise HTTPException(500, "Error inesperado al reintegrar chofer")


async def get_driver_liquidations(driver_id: int, filters):
    """
    Obtiene las liquidaciones mensuales de un chofer con paginación y filtros.
    Consulta directamente la tabla liquidaciones (cierres mensuales).
    """
    from app.core.pagination import PaginatedResponse
    
    # Construir query base para obtener liquidaciones del chofer
    base_query = (
        supabase.table("liquidaciones")
        .select("*")
        .eq("chofer_id", driver_id)
    )
    
    # Obtener todas las liquidaciones (aplicaremos filtros después)
    res = base_query.order("anio", desc=True).order("mes", desc=True).execute()
    
    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo liquidaciones: {res.error}")
    
    # Obtener total global (sin filtros) para el badge
    total_global_query = (
        supabase.table("liquidaciones")
        .select("id", count="exact")
        .eq("chofer_id", driver_id)
    )
    total_global_res = total_global_query.execute()
    total_global = total_global_res.count if hasattr(total_global_res, 'count') and total_global_res.count is not None else 0
    
    # Mapear liquidaciones y aplicar filtros
    items = []
    for liq in res.data or []:
        mes = liq.get("mes")
        anio = liq.get("anio")
        
        # Aplicar filtros de período
        # Si hay filtro "desde" Y "hasta", mostrar rango
        if filters.mes_desde and filters.anio_desde and filters.mes_hasta and filters.anio_hasta:
            # Excluir si está antes del rango
            if anio < filters.anio_desde or (anio == filters.anio_desde and mes < filters.mes_desde):
                continue
            # Excluir si está después del rango
            if anio > filters.anio_hasta or (anio == filters.anio_hasta and mes > filters.mes_hasta):
                continue
        # Si solo hay "desde" sin "hasta", mostrar solo ese mes específico
        elif filters.mes_desde and filters.anio_desde:
            # Mostrar solo el mes/año exacto seleccionado
            if anio != filters.anio_desde or mes != filters.mes_desde:
                continue
        # Si solo hay "hasta" sin "desde", mostrar todos hasta ese mes
        elif filters.mes_hasta and filters.anio_hasta:
            # Excluir si está después del mes "hasta"
            if anio > filters.anio_hasta or (anio == filters.anio_hasta and mes > filters.mes_hasta):
                continue
        # Si no hay filtros de período, mostrar todos (no hacer nada)
        
        sueldo_minimo = int(liq.get("sueldo_minimo") or 0)
        total_final = int(liq.get("total_final") or 0)
        porcentaje_ganado = liq.get("porcentaje_ganado")
        monto_faltante = liq.get("monto_faltante")
        
        # Calcular total_ganado: si hay porcentaje_ganado, usarlo; sino calcular desde total_final
        # El total_ganado sería el monto antes de aplicar el mínimo garantizado
        if porcentaje_ganado is not None:
            # Si hay porcentaje_ganado, el total ganado es porcentaje_ganado + monto_faltante (si existe)
            total_ganado = int(porcentaje_ganado) + (int(monto_faltante) if monto_faltante else 0)
        else:
            # Si no hay porcentaje_ganado, usar total_final como aproximación
            total_ganado = total_final
        
        # Determinar estado: si total_final > 0, está pagado; sino pendiente
        estado_pago = "pagado" if total_final > 0 else "pendiente"
        
        # Aplicar filtro de estado si existe
        if filters.estado_pago and estado_pago != filters.estado_pago:
            continue
        
        # Intentar obtener método de pago y código de transferencia desde pagos_semanales
        # Buscar el último pago del mes para obtener estos datos
        metodo_pago = None
        codigo_transferencia = None
        
        if mes and anio:
            pago_res = (
                supabase.table("pagos_semanales")
                .select("metodo_pago, codigo_transferencia")
                .eq("chofer_id", driver_id)
                .eq("mes", mes)
                .eq("anio", anio)
                .order("semana", desc=True)
                .limit(1)
                .execute()
            )
            
            if pago_res.data and len(pago_res.data) > 0:
                metodo_pago = pago_res.data[0].get("metodo_pago")
                codigo_transferencia = pago_res.data[0].get("codigo_transferencia")
        
        items.append({
            "id": liq.get("id"),
            "fecha": f"{mes:02d}/{anio}",
            "mes": mes,
            "anio": anio,
            "total_ganado": total_ganado,
            "minimo_garantizado": sueldo_minimo,
            "pago_final": total_final,
            "metodo_pago": metodo_pago or "transferencia",
            "codigo_transferencia": codigo_transferencia,
            "estado_pago": estado_pago
        })
    
    # Aplicar paginación
    total = len(items)
    start = filters.offset
    end = start + filters.per_page
    items_paginados = items[start:end]
    
    return {
        "total": total,
        "total_global": total_global,
        "page": filters.page,
        "per_page": filters.per_page,
        "items": items
    }
