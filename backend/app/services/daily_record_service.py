from fastapi import HTTPException
from datetime import date, timedelta
from typing import Optional
from app.core.pagination import PaginatedResponse
from app.db.supabase_client import supabase
from app.schemas.daily_record import (
    DailyRecordCreate,
    DailyRecordCreateAdmin,
    DailyRecordListFilters,
    DailyRecordUpdate
)
from app.services import alert_service
from app.schemas.user import UserInDB
from app.utils.helpers import normalize_value


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
    creado_por_usuario_id: int,
    tipo_creador: str,  # "worker" | "admin"
):
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
            "motivo_no_trabajado_otro": motivo_no_trabajado_otro,
            "monto_recaudado": 0,
            "litros_diesel": 0,
            "costo_total_diesel": 0,
            "porcentaje_aplicado": porcentaje,
            "monto_porcentaje_chofer": 0,
            "observaciones": observaciones,
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
            "observaciones": observaciones,
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
            "Creado por trabajador"
            if tipo_creador == "worker"
            else "Creado por administrador"
        ),
        "modificado_por": creado_por_usuario_id,
        "comentario": observaciones,
    }).execute()

    # ✅ 6. LÓGICA DE ALERTAS: REGISTRO NORMAL vs INCIDENTE
    # -------------------------------------------------------
    # Solo generamos alerta si fue creado por el chofer (worker)
    if tipo_creador == "worker":
        try:
            if incidente_critico:
                # --- CASO 1: INCIDENTE CRÍTICO (ROJO) ---
                # Preparamos el detalle de la observación
                detalle = f": {observaciones}" if observaciones else ""
                
                # Cortamos si es muy largo para no romper la UI de la alerta
                if len(detalle) > 60:
                    detalle = detalle[:57] + "..."

                alert_payload = {
                    "mensaje": f"⚠️ Incidente reportado por {nombre_chofer}{detalle}",
                    "severidad": "critica",          # ROJO en el panel
                    "tipo": "incidente_critico",     # Usamos el ENUM existente
                    "origen_tipo": "registro_diario",
                    "origen_id": registro["id"]
                }
            
            else:
                # --- CASO 2: REGISTRO NORMAL (INFORMATIVO) ---
                alert_payload = {
                    "mensaje": f"Nuevo registro diario de {nombre_chofer}",
                    "severidad": "informativa",      # AZUL/GRIS en el panel
                    "tipo": "registro_diario",       # Tipo estándar
                    "origen_tipo": "registro_diario",
                    "origen_id": registro["id"]
                }

            # Llamada al servicio de alertas
            await alert_service.crear_alerta(**alert_payload)
            
        except Exception as e:
            # No detenemos el proceso si falla la alerta, solo lo logueamos
            print(f"⚠️ Error enviando alerta de registro: {e}")
    # -------------------------------------------------------

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
        creado_por_usuario_id=current_user.id,
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
        creado_por_usuario_id=current_user.id,
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
            "id, fecha, monto_recaudado, costo_total_diesel, estado, observaciones, "
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

    # Primero obtenemos TOTAL
    count_res = base_query.execute()
    if getattr(count_res, "error", None):
        raise HTTPException(400, f"Error listando registros diarios: {count_res.error}")

    total = count_res.count or 0

    # Ahora hacemos la query paginada
    start = (filters.page - 1) * filters.per_page
    end = start + filters.per_page - 1

    paginated_query = base_query.order(sort_field, desc=sort_desc).range(start, end)
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
        neto = monto - diesel

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
                "neto": neto,
                "estado": row.get("estado", ""),
                "tiene_observaciones": bool(row.get("observaciones"))
            }
        )

    return PaginatedResponse(
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        items=items
    )


async def get_daily_record_detail(record_id: int):
    
    registro = (
        supabase.table("registros_diarios")
        .select("""
            id, fecha, estado,
            monto_recaudado, litros_diesel, costo_total_diesel,
            porcentaje_aplicado, monto_porcentaje_chofer,
            observaciones,
            es_dia_no_trabajado, motivo_no_trabajado, motivo_no_trabajado_otro,
            imagen_url, imagen_comprobante_diesel_url,
            choferes(id, primer_nombre, apellido_paterno),
            maquinas(id, numero_interno)
        """)
        .eq("id", record_id)
        .single()
        .execute()
    )

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
            "registro": row["imagen_url"],
            "diesel": row["imagen_comprobante_diesel_url"],
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
            "usuarios(nombre, apellido)"
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
            usuario = row.get("usuarios") or {}
            nombre_usuario = (
                f"{usuario.get('nombre', '')} {usuario.get('apellido', '')}".strip()
            )

            history[version] = {
                "id": row["id"],
                "fecha_cambio": row["fecha_modificacion"],
                "usuario_responsable": nombre_usuario or "Sistema",
                "tipo_cambio": "Edición",
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
        updates["observaciones"] = payload.observaciones

    # ----------------------------------------
    # 4. Auditoría campo a campo
    # ----------------------------------------
    for campo, nuevo_valor in updates.items():
        valor_anterior = original.get(campo)
        if normalize_value(valor_anterior) != normalize_value(nuevo_valor):
            auditoria.append({
                "registro_diario_id": record_id,
                "version": next_version,
                "campo": campo,
                "valor_anterior": str(valor_anterior),
                "valor_nuevo": str(nuevo_valor),
                "modificado_por": current_user.id,
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
        "modificado_por": current_user.id,
        "comentario": "Incidente marcado como resuelto",
    }

    supabase.table("registros_diarios_auditoria").insert(auditoria).execute()

    # TODO: Aquí se agregará lógica para alertas/notificaciones cuando se resuelva un incidente
    # Ejemplo: enviar notificación al chofer, registrar en sistema de alertas, etc.

    # ----------------------------------------
    # 6. Retornar registro actualizado usando get_daily_record_detail
    # ----------------------------------------
    return await get_daily_record_detail(record_id)
