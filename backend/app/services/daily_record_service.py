from fastapi import HTTPException
from datetime import date, timedelta, datetime, timezone
from typing import Optional
import logging
from app.core.pagination import PaginatedResponse
from app.db.supabase_client import supabase
from app.schemas.daily_record import (
    DailyRecordCreate,
    DailyRecordCreateAdmin,
    DailyRecordListFilters,
    DailyRecordUpdate
)
from app.services import alert_service
from app.services.alert_service import SEVERIDAD_CRITICA, SEVERIDAD_ADVERTENCIA, SEVERIDAD_INFO
from app.schemas.user import UserInDB
from app.utils.helpers import normalize_value

# Logger para el servicio de registros diarios
logger = logging.getLogger(__name__)

def _resolve_auditoria_actor_id(current_user: UserInDB) -> int:
    """
    Obtiene el ID del actor_auditoria asociado al usuario autenticado.

    - Choferes: prioriza coincidencia por usuario_id y chofer_id, luego cae a chofer_id.
    - Administradores: coincide por usuario_id.
    """
    if current_user.chofer_id:
        primary = (
            supabase.table("actor_auditoria")
            .select("id")
            .eq("tipo_actor", "chofer")
            .eq("chofer_id", current_user.chofer_id)
            .eq("usuario_id", current_user.id)
            .limit(1)
            .execute()
        )

        if getattr(primary, "error", None):
            raise HTTPException(400, f"Error resolviendo actor de auditoría: {primary.error}")

        if primary.data:
            return primary.data[0]["id"]

        fallback = (
            supabase.table("actor_auditoria")
            .select("id")
            .eq("tipo_actor", "chofer")
            .eq("chofer_id", current_user.chofer_id)
            .limit(1)
            .execute()
        )

        if getattr(fallback, "error", None):
            raise HTTPException(400, f"Error resolviendo actor de auditoría: {fallback.error}")

        data = fallback.data
    else:
        admin_res = (
            supabase.table("actor_auditoria")
            .select("id")
            .eq("tipo_actor", "admin")
            .eq("usuario_id", current_user.id)
            .limit(1)
            .execute()
        )

        if getattr(admin_res, "error", None):
            raise HTTPException(400, f"Error resolviendo actor de auditoría: {admin_res.error}")

        data = admin_res.data

    if data:
        return data[0]["id"]

    raise HTTPException(
        status_code=500,
        detail="No se encontró actor de auditoría para el usuario actual",
    )

def _format_timestamp(timestamp) -> Optional[str]:
    """
    Formatea un timestamp a string ISO para serialización JSON.
    Maneja datetime objects, strings y None.
    """
    if timestamp is None:
        return None
    if isinstance(timestamp, str):
        return timestamp
    if isinstance(timestamp, datetime):
        # Asegurar que el datetime tenga timezone info
        if timestamp.tzinfo is None:
            # Si no tiene timezone, asumir UTC
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        return timestamp.isoformat()
    # Intentar convertir a string
    return str(timestamp)


def _map_motivo_inactividad_to_enum(motivo: str) -> str:
    """
    Mapea el motivo de inactividad del frontend al valor del enum de la base de datos.
    
    Valores del enum en PostgreSQL:
    - descanso_semanal
    - vacaciones
    - licencia_medica
    - permiso_personal
    - maquina_en_mantenimiento
    - sin_asignacion_ruta
    - otro
    """
    motivo_map = {
        # Valores del frontend -> valores del enum
        'Descanso Semanal': 'descanso_semanal',
        'Vacaciones': 'vacaciones',
        'Licencia Médica': 'licencia_medica',
        'Permiso Personal': 'permiso_personal',
        'En Taller / Mantenimiento': 'maquina_en_mantenimiento',
        'Sin Chofer Asignado': 'sin_asignacion_ruta',
        'Otro': 'otro',
        # También aceptar valores que ya están en formato enum
        'descanso_semanal': 'descanso_semanal',
        'vacaciones': 'vacaciones',
        'licencia_medica': 'licencia_medica',
        'permiso_personal': 'permiso_personal',
        'maquina_en_mantenimiento': 'maquina_en_mantenimiento',
        'sin_asignacion_ruta': 'sin_asignacion_ruta',
        'otro': 'otro',
    }
    
    # Si el motivo está en el mapa, retornar el valor mapeado
    if motivo in motivo_map:
        return motivo_map[motivo]
    
    # Si no está en el mapa, intentar normalizarlo
    # (por si acaso viene en otro formato)
    motivo_normalized = motivo.lower().replace(' ', '_').replace('/', '').replace('-', '_').strip()
    
    # Validar que el valor normalizado sea uno de los valores válidos del enum
    valores_validos = {
        'descanso_semanal', 'vacaciones', 'licencia_medica', 
        'permiso_personal', 'maquina_en_mantenimiento', 
        'sin_asignacion_ruta', 'otro'
    }
    
    if motivo_normalized in valores_validos:
        return motivo_normalized
    
    # Si no se puede mapear, retornar el valor original (lanzará error en la BD)
    return motivo


def _sanitize_observations(observaciones: Optional[str]) -> Optional[str]:
    """
    Sanitiza las observaciones para prevenir ataques XSS.
    Escapa caracteres HTML especiales convirtiéndolos a entidades HTML.
    """
    if observaciones is None:
        return None
    
    import html
    # Escapar caracteres HTML especiales (<, >, &, ", ')
    sanitized = html.escape(observaciones, quote=True)
    return sanitized


async def _create_daily_record_core(
    *,
    chofer_id: int,
    maquina_id: int,
    fecha: date,
    es_dia_no_trabajado: bool,
    motivo_no_trabajado: Optional[str],
    motivo_no_trabajado_otro: Optional[str],
    monto_recaudado: Optional[int],
    litros_diesel: Optional[float],
    costo_total_diesel: Optional[int],
    imagen_url: Optional[str],
    imagen_comprobante_diesel_url: Optional[str],
    observaciones: Optional[str],
    incidente_critico: bool,
    actor_id: int,
    tipo_creador: str,  # "worker" | "admin"
):
    # --------------------------------------------------
    # 0. Observaciones ya vienen sanitizadas del schema de Pydantic
    # No es necesario sanitizar nuevamente aquí para evitar doble escape
    # --------------------------------------------------
    # Las observaciones ya fueron sanitizadas en el schema de Pydantic
    # (DailyRecordCreate, DailyRecordCreateAdmin, DailyRecordUpdate)
    observaciones_sanitizadas = observaciones
    motivo_no_trabajado_otro_sanitizado = motivo_no_trabajado_otro

    # --------------------------------------------------
    # 1. Validar duplicado por chofer + fecha
    # --------------------------------------------------
    existing = (
        supabase.table("registros_diarios")
        .select("id")
        .eq("chofer_id", chofer_id)
        .eq("fecha", fecha.isoformat())
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un registro diario para este chofer y fecha"
        )

    # --------------------------------------------------
    # 2. Obtener porcentaje del chofer Y NOMBRE (Para la alerta)
    # --------------------------------------------------
    # ✅ CAMBIO: Traemos nombre y apellido para usarlo en el mensaje de la alerta
    chofer_res = (
        supabase.table("choferes")
        .select("porcentaje_pago, primer_nombre, apellido_paterno")
        .eq("id", chofer_id)
        .single()
        .execute()
    )

    if not chofer_res.data:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    porcentaje = chofer_res.data.get("porcentaje_pago") or 0
    
    # Construimos el nombre completo (ej: "Juan Perez")
    p_nombre = chofer_res.data.get("primer_nombre", "")
    a_paterno = chofer_res.data.get("apellido_paterno", "")
    nombre_chofer = f"{p_nombre} {a_paterno}".strip()

    # --------------------------------------------------
    # 3. Construir payload según estado operativo
    # --------------------------------------------------
    if es_dia_no_trabajado:
        if not motivo_no_trabajado:
            raise HTTPException(
                status_code=400,
                detail="Debe indicar motivo de no trabajado"
            )

        # Mapear el motivo al formato del enum (asumiendo que tienes esta función helper)
        motivo_enum = _map_motivo_inactividad_to_enum(motivo_no_trabajado)

        if motivo_enum == "otro" and not motivo_no_trabajado_otro:
            raise HTTPException(
                status_code=400,
                detail="Debe especificar motivo cuando selecciona 'Otro'"
            )

        nuevo_registro = {
            "chofer_id": chofer_id,
            "maquina_id": maquina_id,
            "fecha": fecha.isoformat(),
            "estado": "no_trabajado",
            "es_dia_no_trabajado": True,
            "motivo_no_trabajado": motivo_enum,
            "motivo_no_trabajado_otro": motivo_no_trabajado_otro_sanitizado,
            "monto_recaudado": 0,
            "litros_diesel": 0,
            "costo_total_diesel": 0,
            "porcentaje_aplicado": porcentaje,
            "monto_porcentaje_chofer": 0,
            "observaciones": observaciones_sanitizadas,
            "imagen_url": imagen_url,
            "imagen_comprobante_diesel_url": imagen_comprobante_diesel_url,
        }

    else:
        # Lógica para día trabajado
        if monto_recaudado is None:
            raise HTTPException(
                status_code=400,
                detail="Monto recaudado es obligatorio en día trabajado"
            )

        monto_pago = int(monto_recaudado * porcentaje)
        
        # ✅ Lógica de estado en BD: Si hay incidente, el estado cambia
        estado_bd = "incidente_reportado" if incidente_critico else "completo"

        nuevo_registro = {
            "chofer_id": chofer_id,
            "maquina_id": maquina_id,
            "fecha": fecha.isoformat(),
            "estado": estado_bd, # Guardamos el estado correcto
            "es_dia_no_trabajado": False,
            "motivo_no_trabajado": None,
            "motivo_no_trabajado_otro": None,
            "monto_recaudado": monto_recaudado,
            "litros_diesel": litros_diesel,
            "costo_total_diesel": costo_total_diesel,
            "porcentaje_aplicado": porcentaje,
            "monto_porcentaje_chofer": monto_pago,
            "observaciones": observaciones_sanitizadas,
            "imagen_url": imagen_url,
            "imagen_comprobante_diesel_url": imagen_comprobante_diesel_url,
        }

    # --------------------------------------------------
    # 4. Insertar registro
    # --------------------------------------------------
    res = supabase.table("registros_diarios").insert(nuevo_registro).execute()

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error creando registro: {res.error}")

    registro = res.data[0]

    # --------------------------------------------------
    # 5. Auditoría inicial
    # --------------------------------------------------
    supabase.table("registros_diarios_auditoria").insert({
        "registro_diario_id": registro["id"],
        "version": 1,
        "campo": "registro",
        "valor_anterior": "-",
        "valor_nuevo": (
            "Creado por el trabajador"
            if tipo_creador == "worker"
            else "Creado por administrador"
        ),
        "actor_id": actor_id,
        "comentario": observaciones_sanitizadas,
    }).execute()

    # ✅ 6. LÓGICA DE ALERTAS: REGISTRO NORMAL vs INCIDENTE (TC-29, TC-30)
    # -------------------------------------------------------
    # TC-30: Fallo silencioso - El registro ya está guardado (línea 242),
    # por lo que si falla la alerta, el error se captura silenciosamente
    # y el registro se retorna exitosamente. El fallo del sistema de
    # notificaciones no debe impedir que el chofer registre su trabajo.
    # Solo generamos alerta si fue creado por el chofer (worker)
    if tipo_creador == "worker":
        try:
            if incidente_critico:
                # --- CASO 1: INCIDENTE CRÍTICO (ROJO) - TC-29 ---
                # Preparamos el detalle de la observación (ya sanitizado)
                detalle = f": {observaciones_sanitizadas}" if observaciones_sanitizadas else ""
                
                # Cortamos si es muy largo para no romper la UI de la alerta
                if len(detalle) > 60:
                    detalle = detalle[:57] + "..."

                alert_payload = {
                    "mensaje": f"⚠️ Incidente reportado por {nombre_chofer}{detalle}",
                    "severidad": SEVERIDAD_CRITICA,  # ROJO en el panel (TC-29)
                    "tipo": "incidente_critico",     # Usamos el ENUM existente
                    "origen_tipo": "registro_diario",
                    "origen_id": registro["id"]
                }
            
            else:
                # --- CASO 2: REGISTRO NORMAL (INFORMATIVO) ---
                alert_payload = {
                    "mensaje": f"Nuevo registro diario de {nombre_chofer}",
                    "severidad": SEVERIDAD_INFO,     # AZUL/GRIS en el panel
                    "tipo": "registro_diario",       # Tipo estándar
                    "origen_tipo": "registro_diario",
                    "origen_id": registro["id"]
                }

            # Llamada al servicio de alertas (TC-30: fallo silencioso)
            await alert_service.crear_alerta(**alert_payload)
            logger.info(
                f"Alerta creada exitosamente para registro diario ID {registro['id']} "
                f"(tipo: {alert_payload['tipo']}, severidad: {alert_payload['severidad']})"
            )
            
        except Exception as e:
            # TC-30: No detenemos el proceso si falla la alerta
            # El registro ya está guardado (línea 242), solo logueamos el error
            # El registro se retorna exitosamente a pesar del fallo de la alerta
            logger.warning(
                f"Error enviando alerta de registro (TC-30 - Fallo silencioso): "
                f"Registro ID {registro.get('id', 'N/A')} guardado exitosamente, "
                f"pero falló la creación de alerta. Error: {str(e)}",
                exc_info=True
            )

    return registro


async def create_daily_record(
    payload: DailyRecordCreate,
    current_user: UserInDB,
):
    if not current_user.chofer_id:
        raise HTTPException(status_code=400, detail="Usuario no es chofer")

    return await _create_daily_record_core(
        chofer_id=current_user.chofer_id,
        maquina_id=payload.maquina_id,
        fecha=payload.fecha,
        es_dia_no_trabajado=False,
        motivo_no_trabajado=None,
        motivo_no_trabajado_otro=None,
        monto_recaudado=payload.monto_recaudado,
        litros_diesel=payload.litros_diesel,
        costo_total_diesel=payload.costo_total_diesel,
        imagen_url=payload.imagen_url,
        imagen_comprobante_diesel_url=payload.imagen_comprobante_diesel_url,
        observaciones=payload.observaciones,
        incidente_critico=payload.incidente_critico,
        actor_id=_resolve_auditoria_actor_id(current_user),
        tipo_creador="worker",
    )


async def create_daily_record_admin(
    payload: DailyRecordCreateAdmin,
    current_user: UserInDB,
):
    return await _create_daily_record_core(
        chofer_id=payload.chofer_id,
        maquina_id=payload.maquina_id,
        fecha=payload.fecha,
        es_dia_no_trabajado=payload.es_dia_no_trabajado,
        motivo_no_trabajado=payload.motivo_no_trabajado,
        motivo_no_trabajado_otro=payload.motivo_no_trabajado_otro,
        monto_recaudado=payload.monto_recaudado,
        litros_diesel=payload.litros_diesel,
        costo_total_diesel=payload.costo_total_diesel,
        imagen_url=payload.imagen_url,
        imagen_comprobante_diesel_url=payload.imagen_comprobante_diesel_url,
        observaciones=payload.observaciones,
        incidente_critico=payload.incidente_critico,
        actor_id=_resolve_auditoria_actor_id(current_user),
        tipo_creador="admin",
    )


async def get_driver_history(current_user: UserInDB, rango: str):

    chofer_id = current_user.chofer_id
    if not chofer_id:
        raise HTTPException(status_code=400, detail="Usuario sin la asignacion de chofer")
    
    hoy = date.today()
    fecha_inicio = None
    fecha_fin = hoy

    #Logica para los filtros
    if rango == "esta_semana":
        fecha_inicio = hoy - timedelta(days=hoy.weekday())
    elif rango == "este_mes":
        fecha_inicio = date(hoy.year, hoy.month, 1)
    elif rango == "mes_anterior":
        primero_este_mes = date(hoy.year, hoy.month, 1)
        ultimo_mes_anterior = primero_este_mes - timedelta(days=1)
        fecha_fin = ultimo_mes_anterior
        fecha_inicio = date(ultimo_mes_anterior.year, ultimo_mes_anterior.month, 1)
    elif rango == "todo":
        fecha_inicio = None
    else:
        fecha_inicio = date(hoy.year, hoy.month, 1)

    #Consulta a Supabase con JOIN
    query = (
        supabase.table("registros_diarios")
        .select("*, maquinas(numero_interno, marca)")
        .eq("chofer_id", chofer_id)
    )

    if fecha_inicio:
        query = query.gte("fecha", fecha_inicio.isoformat())
    
    query = query.lte("fecha", fecha_fin.isoformat())

    res = query.order("fecha", desc=True).execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error historial: {res.error}")
    
    return res.data


async def get_today_record_status(current_user: UserInDB):
    """
    Obtiene el estado del reporte diario de hoy para el chofer actual.
    Retorna el registro si existe, None si no existe.
    """
    chofer_id = current_user.chofer_id
    if not chofer_id:
        raise HTTPException(status_code=400, detail="El usuario no es un chofer válido.")
    
    hoy = date.today()
    fecha_busqueda = hoy.isoformat()
    
    try:
        res = (
            supabase.table("registros_diarios")
            .select("id, fecha, estado, monto_recaudado, created_at")
            .eq("chofer_id", chofer_id)
            .eq("fecha", fecha_busqueda)
            .limit(1)
            .execute()
        )
        
        if res.data and len(res.data) > 0:
            return {
                "exists": True,
                "record": res.data[0],
                "can_create_new": False,
                "message": "Ya existe un reporte para hoy"
            }
        else:
            return {
                "exists": False,
                "record": None,
                "can_create_new": True,
                "message": "Puede crear un nuevo reporte"
            }
    except Exception as e:
        # Si hay un error, asumir que no existe el reporte
        return {
            "exists": False,
            "record": None,
            "can_create_new": True,
            "message": "Puede crear un nuevo reporte"
        }


async def get_daily_records_summary():

    hoy = date.today()
    fecha_inicio = date(hoy.year, hoy.month, 1)
    fecha_inicio_iso = fecha_inicio.isoformat()
    fecha_fin_iso = hoy.isoformat()

    # ----------------------------------------
    # 1) RECAUDACIÓN DEL PERIODO
    # ----------------------------------------
    recaudacion_res = (
        supabase.table("registros_diarios")
        .select("monto_recaudado", count="exact")
        .gte("fecha", fecha_inicio_iso)
        .lte("fecha", fecha_fin_iso)
        .execute()
    )

    if getattr(recaudacion_res, "error", None):
        raise HTTPException(400, f"Error obteniendo recaudación: {recaudacion_res.error}")

    recaudacion_periodo = sum(r["monto_recaudado"] for r in recaudacion_res.data)

    # ----------------------------------------
    # 2) REGISTROS FALTANTES (estado = pendiente)
    # ----------------------------------------
    faltantes_res = (
        supabase.table("registros_diarios")
        .select("id", count="exact")
        .eq("estado", "pendiente_trabajador")
        .gte("fecha", fecha_inicio_iso)
        .lte("fecha", fecha_fin_iso)
        .execute()
    )

    registros_faltantes = faltantes_res.count or 0

    # ----------------------------------------
    # 3) REGISTROS CON INCIDENTE
    # ----------------------------------------
    incidentes_res = (
        supabase.table("registros_diarios")
        .select("id", count="exact")
        .eq("estado", "incidente_reportado")
        .gte("fecha", fecha_inicio_iso)
        .lte("fecha", fecha_fin_iso)
        .execute()
    )

    registros_incidentes = incidentes_res.count or 0

    return {
        "recaudacion_periodo": recaudacion_periodo,
        "registros_faltantes": registros_faltantes,
        "registros_incidentes": registros_incidentes,
    }


async def list_daily_records_for_admin(
    filters: DailyRecordListFilters,
    current_user: UserInDB,
):
    """
    Lista registros diarios filtrando opcionalmente por máquina, chofer, fecha,
    estado y búsqueda de texto (máquina/chofer).
    """

    allowed_sort_fields = {"fecha", "monto_recaudado"}
    sort_field = filters.sort_by if filters.sort_by in allowed_sort_fields else "fecha"
    sort_desc = filters.order == "desc"

    base_query = (
        supabase.table("registros_diarios")
        .select(
            "id, fecha, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer,estado, observaciones, "
            "choferes(id, primer_nombre, apellido_paterno), "
            "maquinas(id, numero_interno)",
            count="exact"
        )
    )

    # Filtros
    if filters.maquina_id is not None:
        base_query = base_query.eq("maquina_id", filters.maquina_id)

    if filters.chofer_id:
        base_query = base_query.eq("chofer_id", filters.chofer_id)

    if filters.estado:
        base_query = base_query.eq("estado", filters.estado)

    if filters.fecha_inicio:
        base_query = base_query.gte("fecha", filters.fecha_inicio.isoformat())

    if filters.fecha_fin:
        base_query = base_query.lte("fecha", filters.fecha_fin.isoformat())

    # Primero obtenemos TOTAL filtrado
    count_res = base_query.execute()
    if getattr(count_res, "error", None):
        raise HTTPException(400, f"Error listando registros diarios: {count_res.error}")

    total = count_res.count or 0

    # Obtener total global (sin filtros) para el badge
    total_global_query = (
        supabase.table("registros_diarios")
        .select("id", count="exact")
    )
    if filters.chofer_id:
        total_global_query = total_global_query.eq("chofer_id", filters.chofer_id)
    if filters.maquina_id is not None:
        total_global_query = total_global_query.eq("maquina_id", filters.maquina_id)
    
    total_global_res = total_global_query.execute()
    total_global = total_global_res.count if hasattr(total_global_res, 'count') and total_global_res.count is not None else 0

    # Ahora hacemos la query paginada
    start = (filters.page - 1) * filters.per_page
    end = start + filters.per_page - 1

    paginated_query = (
        base_query.order(sort_field, desc=sort_desc)
        .order("created_at", desc=sort_desc)
        .range(start, end)
    )
    res = paginated_query.execute()

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error listando registros diarios: {res.error}")

    items = []

    for row in res.data or []:
        chofer_raw = row.get("choferes") or {}
        maquina_raw = row.get("maquinas") or {}
        nombre_chofer = f"{chofer_raw.get('primer_nombre', '')} {chofer_raw.get('apellido_paterno', '')}".strip()
        monto = row.get("monto_recaudado", 0)
        diesel = row.get("costo_total_diesel") or 0
        pago_chofer = row.get("monto_porcentaje_chofer") or 0
        neto = monto - diesel - pago_chofer

        items.append(
            {
                "id": row["id"],
                "fecha": row["fecha"],
                "chofer": {
                    "id": chofer_raw.get("id"),
                    "nombre": nombre_chofer,
                },
                "maquina": {
                    "id": maquina_raw.get("id"),
                    "numero_interno": maquina_raw.get("numero_interno")
                },
                "monto_recaudado": monto,
                "diesel": diesel,
                "pago_chofer": pago_chofer,
                "neto": neto,
                "estado": row.get("estado", ""),
                "tiene_observaciones": bool(row.get("observaciones"))
            }
        )

    # Retornar diccionario con total_registros_global además de PaginatedResponse
    response = PaginatedResponse(
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        items=items
    )
    
    # Convertir a dict y agregar total_registros_global
    response_dict = response.model_dump()
    response_dict["total_registros_global"] = total_global
    
    return response_dict


async def get_daily_record_detail(record_id: int):
    
    # Intentar obtener los campos de timestamp de imágenes si existen
    # Si no existen, usar created_at/updated_at como fallback
    from postgrest.exceptions import APIError
    
    try:
        registro = (
            supabase.table("registros_diarios")
            .select("""
                id, fecha, estado,
                monto_recaudado, litros_diesel, costo_total_diesel,
                porcentaje_aplicado, monto_porcentaje_chofer,
                observaciones,
                es_dia_no_trabajado, motivo_no_trabajado, motivo_no_trabajado_otro,
                imagen_url, imagen_comprobante_diesel_url,
                imagen_url_updated_at, imagen_comprobante_diesel_url_updated_at,
                created_at, updated_at,
                choferes(id, primer_nombre, apellido_paterno),
                maquinas(id, numero_interno)
            """)
            .eq("id", record_id)
            .single()
            .execute()
        )
    except APIError as e:
        # Si el registro no existe (error PGRST116: 0 rows)
        if 'PGRST116' in str(e) or '0 rows' in str(e).lower() or 'result contains 0 rows' in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Registro diario con ID {record_id} no encontrado")
        
        # Si los campos de timestamp no existen (error 42703), hacer SELECT sin ellos
        # Esto puede pasar si la migración aún no se ha ejecutado
        if '42703' in str(e) or 'does not exist' in str(e).lower():
            try:
                registro = (
                    supabase.table("registros_diarios")
                    .select("""
                        id, fecha, estado,
                        monto_recaudado, litros_diesel, costo_total_diesel,
                        porcentaje_aplicado, monto_porcentaje_chofer,
                        observaciones,
                        es_dia_no_trabajado, motivo_no_trabajado, motivo_no_trabajado_otro,
                        imagen_url, imagen_comprobante_diesel_url,
                        created_at, updated_at,
                        choferes(id, primer_nombre, apellido_paterno),
                        maquinas(id, numero_interno)
                    """)
                    .eq("id", record_id)
                    .single()
                    .execute()
                )
            except APIError as e2:
                # Si aún así no existe el registro
                if 'PGRST116' in str(e2) or '0 rows' in str(e2).lower() or 'result contains 0 rows' in str(e2).lower():
                    raise HTTPException(status_code=404, detail=f"Registro diario con ID {record_id} no encontrado")
                # Si es otro error, relanzarlo
                raise
        else:
            # Si es otro error, relanzarlo
            raise

    if not registro.data:
        raise HTTPException(status_code=404, detail="Registro diario no encontrado")

    row = registro.data

    nombre_chofer = f"{row['choferes']['primer_nombre']} {row['choferes']['apellido_paterno']}"

    return {
        "id": row["id"],
        "fecha": row["fecha"],
        "estado": row["estado"],

        "maquina": {
            "id": row["maquinas"]["id"],
            "numero_interno": row["maquinas"]["numero_interno"],
        },

        "chofer": {
            "id": row["choferes"]["id"],
            "nombre": nombre_chofer,
            "porcentaje_actual": row["porcentaje_aplicado"],
        },

        "datos_financieros": {
            "monto_recaudado": row["monto_recaudado"],
            "litros_diesel": row["litros_diesel"],
            "costo_total_diesel": row["costo_total_diesel"],
            "pago_calculado_actual": row["monto_porcentaje_chofer"],
        },

        "estado_operativo": {
            "es_dia_no_trabajado": row["es_dia_no_trabajado"],
            "motivo_no_trabajado": row["motivo_no_trabajado"],
            "motivo_no_trabajado_otro": row["motivo_no_trabajado_otro"],
        },

        "observaciones": row["observaciones"],

        "incidente_critico": row["estado"] == "incidente_reportado",

        "imagenes": {
            "registro": row.get("imagen_url"),
            "diesel": row.get("imagen_comprobante_diesel_url"),
            "registro_updated_at": _format_timestamp(row.get("imagen_url_updated_at") or row.get("updated_at") or row.get("created_at")),
            "diesel_updated_at": _format_timestamp(row.get("imagen_comprobante_diesel_url_updated_at") or row.get("updated_at") or row.get("created_at")),
        },
    }


async def get_daily_record_history(record_id: int):
    """
    Retorna historial de cambios agrupado por versión.
    """

    res = (
        supabase.table("registros_diarios_auditoria")
        .select(
            "id, version, campo, valor_anterior, valor_nuevo, fecha_modificacion, "
            "actor_auditoria(nombre_completo, rol_nombre, tipo_actor)"
        )
        .eq("registro_diario_id", record_id)
        .order("version", desc=True)
        .order("fecha_modificacion", desc=False)
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo auditoría: {res.error}")

    rows = res.data or []

    history = {}
    for row in rows:
        version = row["version"]

        if version not in history:
            actor = row.get("actor_auditoria") or {}
            nombre_actor = actor.get("nombre_completo") or "Sistema"

            history[version] = {
                "id": row["id"],
                "fecha_cambio": row["fecha_modificacion"],
                "usuario_responsable": nombre_actor,
                "actor": {
                    "nombre_completo": actor.get("nombre_completo"),
                    "rol": actor.get("rol_nombre"),
                    "tipo_actor": actor.get("tipo_actor"),
                },
                "tipo_cambio": "Creación" if version == 1 else "Edición",
                "detalles": [],
            }

        history[version]["detalles"].append({
            "campo": row["campo"],
            "valor_anterior": row["valor_anterior"] or "-",
            "valor_nuevo": row["valor_nuevo"] or "-",
        })

    return list(history.values())


async def preview_payment(chofer_id: int, monto_recaudado_propuesto: int):
    """
    Calcula el pago del chofer en base a un monto propuesto.
    NO guarda datos, NO crea auditoría.
    """

    # 1. Obtener porcentaje actual del chofer
    chofer_res = (
        supabase.table("choferes")
        .select("porcentaje_pago")
        .eq("id", chofer_id)
        .single()
        .execute()
    )

    if not chofer_res.data:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    porcentaje = chofer_res.data["porcentaje_pago"] or 0

    # 2. Calcular pago
    pago_calculado = int(monto_recaudado_propuesto * porcentaje)

    return {
        "porcentaje_aplicado": porcentaje,
        "pago_calculado": pago_calculado,
    }


async def update_daily_record(
    record_id: int,
    payload: DailyRecordUpdate,
    current_user: UserInDB,
):
    """
    Guarda correcciones del admin y genera auditoría.
    """

    # ----------------------------------------
    # 1. Obtener registro actual
    # ----------------------------------------
    record_res = (
        supabase.table("registros_diarios")
        .select("*")
        .eq("id", record_id)
        .single()
        .execute()
    )

    if not record_res.data:
        raise HTTPException(status_code=404, detail="Registro diario no encontrado")

    original = record_res.data
    actor_id = _resolve_auditoria_actor_id(current_user)

    updates = {}
    auditoria = []

    version_res = (
        supabase.table("registros_diarios_auditoria")
        .select("version")
        .eq("registro_diario_id", record_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    last_version = version_res.data[0]["version"] if version_res.data else 0
    next_version = last_version + 1

    # ----------------------------------------
    # 2. Día NO trabajado
    # ----------------------------------------
    if payload.es_dia_no_trabajado:
        updates.update({
            "estado": "no_trabajado",
            "es_dia_no_trabajado": True,
            "monto_recaudado": 0,
            "litros_diesel": 0,
            "costo_total_diesel": 0,
            "monto_porcentaje_chofer": 0,
        })

        # motivo_no_trabajado (ENUM, lo que debe estar en el selector)
        if payload.motivo_no_trabajado is None:
            raise HTTPException(
                status_code=400,
                detail="Debe indicar un motivo de no trabajado"
            )

        # Mapear el motivo al formato del enum
        motivo_enum = _map_motivo_inactividad_to_enum(payload.motivo_no_trabajado)
        updates["motivo_no_trabajado"] = motivo_enum

        # motivo_no_trabajado_otro (Texto libre si se elige "Otro" en el selector)
        if motivo_enum == "otro":
            if not payload.motivo_no_trabajado_otro:
                raise HTTPException(
                    status_code=400,
                    detail="Debe especificar el motivo cuando selecciona 'Otro'"
                )
            updates["motivo_no_trabajado_otro"] = payload.motivo_no_trabajado_otro
        else:
            updates["motivo_no_trabajado_otro"] = None

    # ----------------------------------------
    # 3. Día trabajado → recalcular
    # ----------------------------------------
    else:
        monto = (
            payload.monto_recaudado
            if payload.monto_recaudado is not None
            else original["monto_recaudado"]
        )

        porcentaje = original["porcentaje_aplicado"]
        monto_pago = int(monto * porcentaje)

        updates.update({
            "monto_recaudado": monto,
            "monto_porcentaje_chofer": monto_pago,
            "es_dia_no_trabajado": False,
            "estado": "incidente_reportado" if payload.incidente_critico else "completo",
            "motivo_no_trabajado": None,
            "motivo_no_trabajado_otro": None
        })

        if payload.litros_diesel is not None:
            updates["litros_diesel"] = payload.litros_diesel

        if payload.costo_total_diesel is not None:
            updates["costo_total_diesel"] = payload.costo_total_diesel

        if payload.motivo_no_trabajado is not None:
            updates["motivo_no_trabajado"] = payload.motivo_no_trabajado

    # Campo común (ambos casos)
    if payload.observaciones is not None:
        # Las observaciones ya vienen sanitizadas del schema DailyRecordUpdate
        updates["observaciones"] = payload.observaciones

    # Actualizar URLs de imágenes si se proporcionan
    # También actualizar los timestamps de cuando se subieron las imágenes
    # Nota: Los campos imagen_url_updated_at e imagen_comprobante_diesel_url_updated_at
    # deben existir en la tabla registros_diarios. Si no existen, se debe crear una migración.
    if payload.imagen_url is not None:
        updates["imagen_url"] = payload.imagen_url
        # Actualizar timestamp solo si la URL realmente cambió
        # Guardar en UTC para mantener consistencia
        if original.get("imagen_url") != payload.imagen_url:
            updates["imagen_url_updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if payload.imagen_comprobante_diesel_url is not None:
        updates["imagen_comprobante_diesel_url"] = payload.imagen_comprobante_diesel_url
        # Actualizar timestamp solo si la URL realmente cambió
        # Guardar en UTC para mantener consistencia
        if original.get("imagen_comprobante_diesel_url") != payload.imagen_comprobante_diesel_url:
            updates["imagen_comprobante_diesel_url_updated_at"] = datetime.now(timezone.utc).isoformat()

    # ----------------------------------------
    # 4. Auditoría campo a campo
    # ----------------------------------------
    # Campos que no deben aparecer en la auditoría (son técnicos o redundantes)
    campos_excluidos_auditoria = {
        'imagen_url_updated_at',
        'imagen_comprobante_diesel_url_updated_at',
        'updated_at'  # Ya se maneja automáticamente
    }
    
    # Mapeo de nombres de campos técnicos a nombres amigables
    nombres_amigables = {
        'imagen_url': 'Comprobante del Registro Diario',
        'imagen_comprobante_diesel_url': 'Comprobante Diésel',
        'monto_recaudado': 'Monto Recaudado',
        'litros_diesel': 'Litros de Diésel',
        'costo_total_diesel': 'Costo de Diésel',
        'observaciones': 'Observaciones',
        'es_dia_no_trabajado': 'Día No Trabajado',
        'motivo_no_trabajado': 'Motivo de Inactividad',
        'motivo_no_trabajado_otro': 'Motivo de Inactividad (Otro)',
        'incidente_critico': 'Incidente Crítico',
        'estado': 'Estado'
    }
    
    def formatear_valor_imagen(valor):
        """Formatea URLs de imágenes para mostrar solo que cambió, no la URL completa"""
        if valor and isinstance(valor, str) and ('http' in valor or 'supabase' in valor.lower()):
            return 'Imagen actualizada'
        return valor
    
    for campo, nuevo_valor in updates.items():
        # Saltar campos excluidos
        if campo in campos_excluidos_auditoria:
            continue
            
        valor_anterior = original.get(campo)
        if normalize_value(valor_anterior) != normalize_value(nuevo_valor):
            # Obtener nombre amigable del campo
            nombre_campo = nombres_amigables.get(campo, campo.replace('_', ' ').title())
            
            # Formatear valores para imágenes
            if campo in ('imagen_url', 'imagen_comprobante_diesel_url'):
                valor_anterior_str = 'Sin imagen' if not valor_anterior else formatear_valor_imagen(valor_anterior)
                valor_nuevo_str = 'Sin imagen' if not nuevo_valor else formatear_valor_imagen(nuevo_valor)
            else:
                valor_anterior_str = str(valor_anterior) if valor_anterior is not None else '-'
                valor_nuevo_str = str(nuevo_valor) if nuevo_valor is not None else '-'
            
            auditoria.append({
                "registro_diario_id": record_id,
                "version": next_version,
                "campo": nombre_campo,  # Usar nombre amigable
                "valor_anterior": valor_anterior_str,
                "valor_nuevo": valor_nuevo_str,
                "actor_id": actor_id,
                "comentario": payload.observaciones,
            })

    # ----------------------------------------
    # 5. Guardar cambios
    # ----------------------------------------
    upd_res = (
        supabase.table("registros_diarios")
        .update(updates)
        .eq("id", record_id)
        .execute()
    )

    if getattr(upd_res, "error", None):
        raise HTTPException(400, f"Error actualizando registro: {upd_res.error}")

    # ----------------------------------------
    # 6. Insertar auditoría
    # ----------------------------------------
    if auditoria:
        supabase.table("registros_diarios_auditoria").insert(auditoria).execute()

    updated = {**original, **updates}
    campos_modificados = [a["campo"] for a in auditoria]

    return {
        "message": "Registro diario actualizado correctamente",
        "registro": {
            "id": record_id,
            "fecha": updated["fecha"],
            "estado": updated["estado"],
            "monto_recaudado": updated["monto_recaudado"],
            "costo_total_diesel": updated["costo_total_diesel"],
            "neto": updated["monto_recaudado"] - (updated["costo_total_diesel"] or 0),
            "incidente_critico": updated["estado"] == "incidente_reportado",
            "es_dia_no_trabajado": updated["es_dia_no_trabajado"],
        },
        "auditoria": {
            "version": next_version,
            "campos_modificados": campos_modificados
        }
    }


async def resolve_incident(
    record_id: int,
    current_user: UserInDB,
):
    """
    Marca un incidente como resuelto cambiando el estado de 'incidente_reportado' a 'completo'.
    TODO: Aquí se agregará lógica para alertas/notificaciones cuando se resuelva un incidente.
    """
    # ----------------------------------------
    # 1. Obtener registro actual
    # ----------------------------------------
    record_res = (
        supabase.table("registros_diarios")
        .select("*")
        .eq("id", record_id)
        .single()
        .execute()
    )

    if not record_res.data:
        raise HTTPException(status_code=404, detail="Registro diario no encontrado")

    original = record_res.data

    # ----------------------------------------
    # 2. Validar que el registro esté en estado de incidente
    # ----------------------------------------
    if original["estado"] != "incidente_reportado":
        raise HTTPException(
            status_code=400,
            detail=f"El registro no está en estado de incidente. Estado actual: {original['estado']}"
        )

    actor_id = _resolve_auditoria_actor_id(current_user)

    # ----------------------------------------
    # 3. Obtener versión para auditoría
    # ----------------------------------------
    version_res = (
        supabase.table("registros_diarios_auditoria")
        .select("version")
        .eq("registro_diario_id", record_id)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )

    last_version = version_res.data[0]["version"] if version_res.data else 0
    next_version = last_version + 1

    # ----------------------------------------
    # 4. Actualizar estado a 'completo'
    # ----------------------------------------
    updates = {
        "estado": "completo"
    }

    upd_res = (
        supabase.table("registros_diarios")
        .update(updates)
        .eq("id", record_id)
        .execute()
    )

    if getattr(upd_res, "error", None):
        raise HTTPException(400, f"Error actualizando registro: {upd_res.error}")

    # ----------------------------------------
    # 5. Registrar en auditoría
    # ----------------------------------------
    auditoria = {
        "registro_diario_id": record_id,
        "version": next_version,
        "campo": "estado",
        "valor_anterior": "incidente_reportado",
        "valor_nuevo": "completo",
        "actor_id": actor_id,
        "comentario": "Incidente marcado como resuelto",
    }

    supabase.table("registros_diarios_auditoria").insert(auditoria).execute()

    # ----------------------------------------
    # 6.RESOLVER ALERTA ASOCIADA
    # ----------------------------------------
    # Buscamos alertas activas vinculadas a este registro y las cerramos.
    try:
        # IMPORTANTE: Asumo que el 'origen_tipo' cuando se crea la alerta es "registro_diario".
        # Si usaste otro nombre al crear la alerta, cámbialo aquí.
        supabase.table("alertas")\
            .update({"estado": "resuelta",
                     "fecha_resuelta": datetime.now().isoformat()})\
            .eq("origen_id", record_id)\
            .eq("origen_tipo", "registro_diario")\
            .execute()
            
        print(f"✅ Alerta asociada al registro {record_id} marcada como resuelta.")
        
    except Exception as e:
        # Solo imprimimos el error para no fallar toda la operación si algo pasa con las alertas
        print(f"⚠️ Advertencia: No se pudo cerrar la alerta asociada: {e}")
    # TODO: Aquí se agregará lógica para alertas/notificaciones cuando se resuelva un incidente
    # Ejemplo: enviar notificación al chofer, registrar en sistema de alertas, etc.

    # ----------------------------------------
    # 7. Retornar registro actualizado usando get_daily_record_detail
    # ----------------------------------------

    return await get_daily_record_detail(record_id)
