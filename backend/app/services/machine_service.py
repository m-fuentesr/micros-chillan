from fastapi import HTTPException
from calendar import monthrange
from typing import Optional
from datetime import date, timedelta, datetime, timezone
from app.db.supabase_client import supabase
from app.schemas.user import UserInDB
from app.services import alert_service

NOMBRES_DOCS = {
    "revision_tecnica": "Revisión Técnica",
    "permiso_circulacion": "Permiso de Circulación",
    "seguro_obligatorio": "Seguro Obligatorio"
}
# --- FUNCIÓN AUXILIAR (Movida al inicio para que Python la lea primero) ---
async def verificar_crear_alerta_documento(
    maquina_id: int, 
    numero_interno: str, 
    tipo_doc_key: str, 
    estado: str, 
    alertas_activas_map: dict
):
    """
    Verifica si existe una alerta activa para este documento.
    Si NO existe, la crea usando alert_service.
    """
    # 1. Definir tipo de alerta
    if estado == "vencido":
        tipo_alerta = "doc_vencida"
        severidad = "critica" 
        sufijo_msg = "se encuentra VENCIDA"
    elif estado == "por_vencer":
        tipo_alerta = "doc_por_vencer"
        severidad = "advertencia"
        sufijo_msg = "está por vencer"
    else:
        return 

    # 2. Verificar duplicados en memoria
    nombre_doc = NOMBRES_DOCS.get(tipo_doc_key, tipo_doc_key)
    clave_duplicidad = f"{maquina_id}_{tipo_alerta}_{tipo_doc_key}"

    if clave_duplicidad in alertas_activas_map:
        return # Ya existe, no hacemos nada

    # 3. Crear alerta si es nueva
    mensaje = f"Máquina {numero_interno}: {nombre_doc} {sufijo_msg}."
    
    await alert_service.crear_alerta(
        mensaje=mensaje,
        severidad=severidad,
        tipo=tipo_alerta,
        origen_tipo="maquina",
        origen_id=maquina_id
    )
    
    # Actualizar mapa
    alertas_activas_map[clave_duplicidad] = True

async def get_active_machines():
    """
    Lista todas las máquinas operativas con detalles completos
    (Patente, Año, Modelo, etc.)
    """
    # 1. Consultar tabla maquinas
    res = (
        supabase.table("maquinas")
        .select("*")
        .eq("estado_operativo", "operativa") 
        .order("numero_interno", desc=False)
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error obteniendo máquinas: {res.error}")

    items = []

    # 2. Procesar datos
    for m in res.data:
        # Convertimos a string por seguridad (como hicimos con numero_interno)
        numero = str(m.get("numero_interno", "S/N"))
        marca = m.get("marca", "") or "Sin Marca"
        modelo = m.get("modelo") or ""
        patente = m.get("patente") or "S/P" # S/P = Sin Patente
        
        # El año suele ser numérico, si viene nulo ponemos 0
        anio = m.get("anio") or 0 

        # Creamos el nombre para mostrar en el selector
        display_name = f"{numero} - {marca} {modelo} ({patente})"

        items.append({
            "id": m["id"],
            "numero_interno": numero,
            "marca": marca,
            "modelo": modelo,   # <--- Agregado
            "anio": anio,       # <--- Agregado
            "patente": patente, # <--- Agregado
            "display_name": display_name
        })

    return items


async def get_summary():
    """
    Devuelve:
    {
        "estados": {
            "operativas": X,
            "en_taller": Y,
            "inactivas": Z
        },
        "documentos": {
            "total_con_alertas": N
        }
    }
    """
    # ---------------------------------------------------------
    # 1) Contar máquinas por estado
    # ---------------------------------------------------------
    estados_raw = (
        supabase.table("maquinas")
        .select("estado_operativo")
        .execute()
    )

    if getattr(estados_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo estados: {estados_raw.error}")

    operativas = 0
    en_taller = 0
    inactivas = 0

    for m in estados_raw.data:
        est = m["estado_operativo"]
        if est == "operativa":
            operativas += 1
        elif est == "en_taller":
            en_taller += 1
        elif est == "inactiva":
            inactivas += 1

    # ---------------------------------------------------------
    # 2) Contar máquinas con documentos en alerta
    # ---------------------------------------------------------
    hoy = date.today()
    limite_warning = hoy + timedelta(days=30)

    docs_raw = (
        supabase.table("documentos_maquina")
        .select("maquina_id, tipo_documento, fecha_vencimiento")
        .execute()
    )

    if getattr(docs_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo documentos: {docs_raw.error}")

    maquinas_con_alerta = set()

    for d in docs_raw.data:
        fecha_str = d["fecha_vencimiento"]
        if not fecha_str:
            continue

        fecha = date.fromisoformat(fecha_str)

        # Vencido
        if fecha < hoy:
            maquinas_con_alerta.add(d["maquina_id"])
            continue

        # Por vencer
        if hoy <= fecha <= limite_warning:
            maquinas_con_alerta.add(d["maquina_id"])

    total_alertas = len(maquinas_con_alerta)

    # ---------------------------------------------------------
    # 3) Respuesta final
    # ---------------------------------------------------------
    return {
        "estados": {
            "operativas": operativas,
            "en_taller": en_taller,
            "inactivas": inactivas
        },
        "documentos": {
            "total_con_alertas": total_alertas
        }
    }


async def get_document_alerts(estado: Optional[str] = None):
    """
    Obtiene conteos de máquinas por estado de documentos.
    Opcionalmente filtra por estado operativo.
    """
    hoy = date.today()
    alerta_dias = 30
    limite_warning = hoy + timedelta(days=alerta_dias)

    # 1) Obtener máquinas (con filtro de estado si aplica)
    base_query = supabase.table("maquinas").select("id")
    
    if estado:
        base_query = base_query.eq("estado_operativo", estado)
    
    maquinas_raw = base_query.execute()
    if getattr(maquinas_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo máquinas: {maquinas_raw.error}")
    
    maquina_ids = {m["id"] for m in maquinas_raw.data}

    # 2) Obtener documentos
    docs_raw = (
        supabase.table("documentos_maquina")
        .select("maquina_id, tipo_documento, fecha_vencimiento")
        .execute()
    )

    if getattr(docs_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo documentos: {docs_raw.error}")

    # 3) Calcular estados de documentos por máquina
    maquinas_docs = {}  # {maquina_id: [estados de documentos]}
    
    for d in docs_raw.data:
        mid = d["maquina_id"]
        if mid not in maquina_ids:
            continue
            
        fecha_str = d["fecha_vencimiento"]
        if not fecha_str:
            continue

        fecha = date.fromisoformat(fecha_str)
        
        if mid not in maquinas_docs:
            maquinas_docs[mid] = []
        
        if fecha < hoy:
            maquinas_docs[mid].append("vencido")
        elif fecha <= limite_warning:
            maquinas_docs[mid].append("por_vencer")
        else:
            maquinas_docs[mid].append("ok")

    # 4) Contar máquinas por estado documental
    vencidos = 0
    por_vencer = 0
    al_dia = 0
    
    for mid in maquina_ids:
        docs_estados = maquinas_docs.get(mid, [])
        
        # Si no tiene documentos, no cuenta en ninguna categoría
        if not docs_estados:
            continue
        
        # Si tiene al menos un documento vencido, cuenta como vencida
        if "vencido" in docs_estados:
            vencidos += 1
        # Si tiene al menos un documento por vencer (y ninguno vencido), cuenta como por vencer
        elif "por_vencer" in docs_estados:
            por_vencer += 1
        # Si todos los documentos están ok, cuenta como al día
        elif all(estado == "ok" for estado in docs_estados):
            al_dia += 1

    return {
        "vencidos": vencidos,
        "por_vencer": por_vencer,
        "al_dia": al_dia
    }


async def list_machines(filters):
    hoy = date.today()
    alerta_dias = 30
    limite_warning = hoy + timedelta(days=alerta_dias)

    # 1) Construir query base con filtros
    base_query = (
        supabase.table("maquinas")
        .select("*", count="exact")
    )
    
    # Aplicar filtros
    if filters.estado:
        base_query = base_query.eq("estado_operativo", filters.estado)
    
    if filters.search:
        # Búsqueda por número interno, patente o marca
        # Nota: Supabase requiere formato específico para OR
        search_term = f"%{filters.search}%"
        base_query = base_query.or_(f"numero_interno.ilike.{search_term},patente.ilike.{search_term},marca.ilike.{search_term}")
    
    # Si hay filtro de documentos, necesitamos obtener TODAS las máquinas primero
    # para poder filtrar por estado de documentos antes de paginar
    if filters.documento_estado:
        # Obtener todas las máquinas sin paginar
        maquinas_raw = (
            base_query
            .order("numero_interno")
            .execute()
        )
        
        if getattr(maquinas_raw, "error", None):
            raise HTTPException(400, f"Error obteniendo máquinas: {maquinas_raw.error}")
        
        maquinas = maquinas_raw.data
    else:
        # Sin filtro de documentos, podemos paginar directamente
        # Obtener total primero
        count_res = base_query.execute()
        if getattr(count_res, "error", None):
            raise HTTPException(400, f"Error obteniendo máquinas: {count_res.error}")
        
        total = count_res.count or 0
        
        # Aplicar paginación
        start = (filters.page - 1) * filters.per_page
        end = start + filters.per_page - 1
        
        # Obtener máquinas paginadas
        maquinas_raw = (
            base_query
            .order("numero_interno")
            .range(start, end)
            .execute()
        )

        if getattr(maquinas_raw, "error", None):
            raise HTTPException(400, f"Error obteniendo máquinas: {maquinas_raw.error}")

        maquinas = maquinas_raw.data

    # 2) Obtener las asignaciones actuales
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id, maquina_id, chofer_id, fecha_inicio, fecha_termino")
        .is_("fecha_termino", None)
        .execute()
    )
    asignaciones = {a["maquina_id"]: a["chofer_id"] for a in asign_raw.data}

    # --- 2.5) CORRECCIÓN: FILTRO ANTI-SPAM INTELIGENTE ---
    
    # Calculamos fecha de hace 24 horas (o el tiempo que quieras de "silencio")
    tiempo_spam = datetime.now(timezone.utc) - timedelta(hours=24)
    tiempo_iso = tiempo_spam.isoformat()

    # Pedimos: (Estado es Activa) O (Creada hace menos de 24h)
    alertas_raw = (
        supabase.table("alertas")
        .select("origen_id, tipo, mensaje, estado, created_at")
        .eq("origen_tipo", "maquina")
        .or_(f"estado.eq.activa,created_at.gte.{tiempo_iso}") # <--- AQUÍ ESTÁ LA MAGIA
        .execute()
    )
    
    alertas_existentes_map = {}
    for a in alertas_raw.data:
        mid = a["origen_id"]
        t_alerta = a["tipo"]
        msg = a["mensaje"]
        
        # Inferencia simple del documento
        doc_key_detectado = "desconocido"
        if "Revisión Técnica" in msg: doc_key_detectado = "revision_tecnica"
        elif "Permiso" in msg: doc_key_detectado = "permiso_circulacion"
        elif "Seguro" in msg: doc_key_detectado = "seguro_obligatorio"
        
        clave = f"{mid}_{t_alerta}_{doc_key_detectado}"
        
        # Si está en este mapa, NO se volverá a crear
        alertas_existentes_map[clave] = True
    # -----------------------------------------------------------

    # 3) Obtener datos de choferes
    chofer_ids = list(asignaciones.values())
    choferes_map = {}

    if chofer_ids:
        choferes_raw = (
            supabase.table("choferes")
            .select("id, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno")
            .in_("id", chofer_ids)
            .execute()
        )

        for c in choferes_raw.data:
            nombre = f"{c['primer_nombre']} {c['apellido_paterno']}"
            choferes_map[c["id"]] = {
                "id": c["id"],
                "nombre_completo": nombre
            }

    # 4) Obtener documentos
    docs_raw = (
        supabase.table("documentos_maquina")
        .select("maquina_id, tipo_documento, fecha_vencimiento")
        .execute()
    )

    docs_map = {}
    for d in docs_raw.data:
        mid = d["maquina_id"]
        docs_map.setdefault(mid, {})
        docs_map[mid][d["tipo_documento"]] = d["fecha_vencimiento"]

    # 5) Construcción final
    items = []

    for m in maquinas:
        mid = m["id"]
        num_interno = m["numero_interno"]

        # Chofer
        chofer_info = None
        if mid in asignaciones:
            cid = asignaciones[mid]
            chofer_info = choferes_map.get(cid)

        # Documentos y Alertas
        documentos = {}
        for tipo in ["revision_tecnica", "permiso_circulacion", "seguro_obligatorio"]:
            if mid in docs_map and tipo in docs_map[mid]:
                fv = date.fromisoformat(docs_map[mid][tipo])
                estado = "ok"

                if fv < hoy:
                    estado = "vencido"
                elif fv <= limite_warning:
                    estado = "por_vencer"
                
                # --- VERIFICAR Y CREAR ALERTA ---
                if estado != "ok":
                    # Ahora "alertas_existentes_map" ya incluye las resueltas recientemente.
                    # Por tanto, esta función simplemente retornará sin hacer nada si ya existe.
                    await verificar_crear_alerta_documento(
                        maquina_id=mid,
                        numero_interno=num_interno,
                        tipo_doc_key=tipo,
                        estado=estado,
                        alertas_activas_map=alertas_existentes_map
                    )
                # --------------------------------

                documentos[tipo] = {
                    "fecha_vencimiento": fv,
                    "estado": estado
                }

        # Verificar si pasa el filtro de documentos
        if filters.documento_estado:
            # Obtener estados de documentos
            doc_estados = [doc.get("estado") for doc in documentos.values() if doc.get("estado")]
            
            if not doc_estados:
                # Si no tiene documentos, no pasa ningún filtro de documentos
                continue
            
            # Aplicar filtro según documento_estado
            if filters.documento_estado == "vencidos":
                # Al menos un documento vencido
                if "vencido" not in doc_estados:
                    continue
            elif filters.documento_estado == "por_vencer":
                # Al menos un documento por vencer (y ninguno vencido)
                if "por_vencer" not in doc_estados or "vencido" in doc_estados:
                    continue
            elif filters.documento_estado == "al_dia":
                # Todos los documentos al día
                if not all(estado == "ok" for estado in doc_estados):
                    continue
        
        items.append({
            "id": mid,
            "numero_interno": num_interno,
            "marca": m["marca"],
            "patente": m.get("patente"),
            "estado_operativo": m["estado_operativo"],
            "chofer_asignado": chofer_info,
            "documentos": documentos
        })

    # Si hay filtro de documentos, calcular total después del filtro y aplicar paginación
    if filters.documento_estado:
        total = len(items)
        # Aplicar paginación
        start = (filters.page - 1) * filters.per_page
        end = start + filters.per_page
        items = items[start:end]
    else:
        # Sin filtro de documentos, el total ya se calculó antes
        pass

    from app.core.pagination import PaginatedResponse
    return PaginatedResponse(
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        items=items
    )


async def create_machine(data):
    # ----------------------------------------
    # 0. Verificar que no exista el número interno
    # ----------------------------------------
    existe = (
        supabase.table("maquinas")
        .select("id")
        .eq("numero_interno", data.numero_interno)
        .execute()
    )

    if existe.data:
        raise HTTPException(400, "El número de máquina ya está registrado.")

    # ----------------------------------------
    # 1. Insertar máquina
    # ----------------------------------------
    maquina_payload = {
        "numero_interno": data.numero_interno,
        "marca": data.marca,
        "anio_fabricacion": data.anio_fabricacion,
        "patente": data.patente,
        "estado_operativo": data.estado_operativo,
        "descripcion": None,
    }

    res = supabase.table("maquinas").insert(maquina_payload).execute()

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error creando máquina: {res.error}")

    maquina_id = res.data[0]["id"]

    # ----------------------------------------
    # 2. Crear documentos iniciales
    # ----------------------------------------
    docs = data.documentos

    docs_payload = [
        {
            "maquina_id": maquina_id,
            "tipo_documento": "revision_tecnica",
            "fecha_vencimiento": docs.fecha_venc_revision_tecnica.isoformat(),
        },
        {
            "maquina_id": maquina_id,
            "tipo_documento": "permiso_circulacion",
            "fecha_vencimiento": docs.fecha_venc_permiso_circulacion.isoformat(),
        },
        {
            "maquina_id": maquina_id,
            "tipo_documento": "seguro_obligatorio",
            "fecha_vencimiento": docs.fecha_venc_seguro_obligatorio.isoformat(),
        },
    ]

    docs_res = supabase.table("documentos_maquina").insert(docs_payload).execute()

    if getattr(docs_res, "error", None):
        raise HTTPException(400, f"Error creando documentos: {docs_res.error}")

    # ----------------------------------------
    # 3. Asignación inicial del chofer (opcional)
    # ----------------------------------------
    if data.chofer_id:
        chofer_id = data.chofer_id

        # Verificar si el chofer ya tiene una asignación activa
        asign_raw = (
            supabase.table("asignaciones_chofer_maquina")
            .select("id, maquina_id")
            .eq("chofer_id", chofer_id)
            .is_("fecha_termino", None)
            .maybe_single()
            .execute()
        )

        hoy = date.today().isoformat()

        # Si tiene asignación activa → cerrar la asignación anterior
        if asign_raw and asign_raw.data:
            supabase.table("asignaciones_chofer_maquina").update(
                {"fecha_termino": hoy}
            ).eq("id", asign_raw.data["id"]).execute()

        # Crear nueva asignación para esta máquina
        asign_res = (
            supabase.table("asignaciones_chofer_maquina")
            .insert(
                {
                    "maquina_id": maquina_id,
                    "chofer_id": chofer_id,
                    "fecha_inicio": hoy,
                    "fecha_termino": None,
                }
            )
            .execute()
        )

        if getattr(asign_res, "error", None):
            raise HTTPException(
                400,
                f"Máquina creada pero ocurrió un error asignando el chofer: {asign_res.error}",
            )

    return {"id": maquina_id, "message": "Máquina creada correctamente"}


async def get_machine_detail(machine_id: int):
    # ----------------------------------------
    # 1. Obtener datos de máquina
    # ----------------------------------------
    m_raw = (
        supabase.table("maquinas")
        .select("*")
        .eq("id", machine_id)
        .single()
        .execute()
    )

    if getattr(m_raw, "error", None):
        raise HTTPException(404, f"Máquina no encontrada: {m_raw.error}")

    m = m_raw.data

    # ----------------------------------------
    # 2. Obtener asignación actual (fecha_termino = NULL)
    # ----------------------------------------
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("chofer_id")
        .eq("maquina_id", machine_id)
        .is_("fecha_termino", None)
        .limit(1)
        .execute()
    )

    chofer_actual_id = None
    if asign_raw.data and len(asign_raw.data) > 0:
        chofer_actual_id = asign_raw.data[0]["chofer_id"]

    # ----------------------------------------
    # 3. Obtener documentos
    # ----------------------------------------
    docs_raw = (
        supabase.table("documentos_maquina")
        .select("tipo_documento, fecha_vencimiento")
        .eq("maquina_id", machine_id)
        .execute()
    )

    if getattr(docs_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo documentos: {docs_raw.error}")

    # Convertir a mapa
    docs_map = {d["tipo_documento"]: d["fecha_vencimiento"] for d in docs_raw.data}

    documentos = {
        "fecha_venc_revision_tecnica": docs_map.get("revision_tecnica"),
        "fecha_venc_permiso_circulacion": docs_map.get("permiso_circulacion"),
        "fecha_venc_seguro_obligatorio": docs_map.get("seguro_obligatorio"),
    }

    # ----------------------------------------
    # 4. Respuesta final
    # ----------------------------------------
    return {
        "id": m["id"],
        "numero_interno": m["numero_interno"],
        "patente": m["patente"],
        "marca": m["marca"],
        "anio_fabricacion": m["anio_fabricacion"],
        "estado_operativo": m["estado_operativo"],
        "chofer_actual_id": chofer_actual_id,
        "documentos": documentos,
    }


async def update_machine(machine_id: int, data):
    # 0. Verificar existencia (Sin cambios)
    m_raw = (
        supabase.table("maquinas")
        .select("id, numero_interno")
        .eq("id", machine_id)
        .single()
        .execute()
    )

    if getattr(m_raw, "error", None):
        raise HTTPException(404, "Máquina no encontrada")

    # 1. Actualizar datos máquina (Sin cambios)
    update_payload = {
        "numero_interno": data.numero_interno,
        "patente": data.patente,
        "marca": data.marca,
        "anio_fabricacion": data.anio_fabricacion,
        "estado_operativo": data.estado_operativo,
    }

    upd_res = (
        supabase.table("maquinas")
        .update(update_payload)
        .eq("id", machine_id)
        .execute()
    )

    if getattr(upd_res, "error", None):
        raise HTTPException(400, f"Error actualizando máquina: {upd_res.error}")

    # 2. Actualizar documentos
    # Nota: Si el rendimiento es crítico en el futuro, esto se puede hacer en un solo query,
    # pero para 3 documentos está bien así por ahora.
    docs = data.documentos
    docs_updates = [
        {"tipo": "revision_tecnica", "fecha": docs.fecha_venc_revision_tecnica},
        {"tipo": "permiso_circulacion", "fecha": docs.fecha_venc_permiso_circulacion},
        {"tipo": "seguro_obligatorio", "fecha": docs.fecha_venc_seguro_obligatorio},
    ]

    for d in docs_updates:
        # Sugerencia: validar que d["fecha"] no sea None antes de actualizar
        if d["fecha"]: 
            supabase.table("documentos_maquina").update(
                {"fecha_vencimiento": d["fecha"].isoformat()}
            ).eq("maquina_id", machine_id).eq("tipo_documento", d["tipo"]).execute()

    # 3. Manejo de Chofer (CORREGIDO)
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id, chofer_id")
        .eq("maquina_id", machine_id)
        .is_("fecha_termino", None)
        .maybe_single() # Correcto uso de maybe_single
        .execute()
    )

    asign_actual = asign_raw.data if asign_raw and asign_raw.data else None
    chofer_actual_id = asign_actual["chofer_id"] if asign_actual else None
    nuevo_chofer_id = data.chofer_id

    hoy_iso = date.today().isoformat()
    nombre_maquina = f"Máquina {data.numero_interno}"

    # --- CORRECCIÓN LÓGICA AQUÍ ---
    # Solo entramos a la lógica de asignación si EL CHOFER HA CAMBIADO.
    # Si chofer_actual_id == nuevo_chofer_id, no hacemos nada (evita duplicados).
    if chofer_actual_id != nuevo_chofer_id:
        
        # A) Cerrar asignación del chofer ANTIGUO (si existía)
        if chofer_actual_id is not None:
            supabase.table("asignaciones_chofer_maquina").update(
                {"fecha_termino": hoy_iso}
            ).eq("id", asign_actual["id"]).execute()
            
            # Alerta Desvinculación
            await alert_service.crear_alerta(
                mensaje=f"Ya no tienes asignada la {nombre_maquina}.",
                severidad="informativa",
                tipo="asignacion_maquina",
                origen_tipo="chofer",
                origen_id=chofer_actual_id
            )

        # B) Crear asignación para el chofer NUEVO (si se seleccionó uno)
        if nuevo_chofer_id is not None:
            
            # 1. Verificar si el nuevo chofer tiene asignación activa en OTRA máquina
            asign_chofer_previo = (
                supabase.table("asignaciones_chofer_maquina")
                .select("id, maquina_id")
                .eq("chofer_id", nuevo_chofer_id)
                .is_("fecha_termino", None)
                .maybe_single()
                .execute()
            )

            # 2. Cerrar la otra asignación si existe
            if asign_chofer_previo and asign_chofer_previo.data:
                # Nota de seguridad: Ya sabemos que 'maquina_id' != machine_id 
                # porque estamos dentro del if (chofer_actual != nuevo), 
                # pero la validación extra no hace daño.
                supabase.table("asignaciones_chofer_maquina").update(
                    {"fecha_termino": hoy_iso}
                ).eq("id", asign_chofer_previo.data["id"]).execute()

            # 3. Insertar nueva asignación
            supabase.table("asignaciones_chofer_maquina").insert(
                {
                    "maquina_id": machine_id,
                    "chofer_id": nuevo_chofer_id,
                    "fecha_inicio": hoy_iso,
                    "fecha_termino": None,
                }
            ).execute()

            # 4. Alerta Nueva Asignación
            await alert_service.crear_alerta(
                mensaje=nombre_maquina,
                severidad="informativa",
                tipo="asignacion_maquina",
                origen_tipo="chofer",
                origen_id=nuevo_chofer_id
            )

    # --- 4. LIMPIEZA INTELIGENTE DE ALERTAS DE DOCUMENTOS ---
    # Solo cerramos la alerta si la fecha NUEVA es válida (futuro)
    
    hoy = date.today()
    
    # Lista de documentos y sus fechas nuevas que vienen en 'data'
    docs_verificar = [
        {"tipo": "revision_tecnica", "fecha": docs.fecha_venc_revision_tecnica},
        {"tipo": "permiso_circulacion", "fecha": docs.fecha_venc_permiso_circulacion},
        {"tipo": "seguro_obligatorio", "fecha": docs.fecha_venc_seguro_obligatorio},
    ]

    for doc in docs_verificar:
        fecha_nueva = doc["fecha"]
        
        # Solo intentamos resolver alertas si la fecha nueva existe Y es futura (mayor a hoy)
        if fecha_nueva and fecha_nueva > hoy:
            try:
                # Intentamos buscar alertas de documentos de esta máquina
                # NOTA: Esto asume que tus alertas son genéricas. 
                # Si quieres ser específico, tu tabla 'alertas' debería tener una columna 'sub_tipo' 
                # o buscar en el mensaje, pero por ahora esto es mucho mejor que lo que tenías.
                
                (
                    supabase.table("alertas")
                    .update({
                        "estado": "resuelta",
                        "fecha_resuelta": datetime.now(timezone.utc).isoformat(),
                        "resuelta_por": None # O el ID del usuario que edita si lo tienes
                    })
                    .match({
                        "origen_id": machine_id,
                        "origen_tipo": "maquina",
                        "estado": "activa"
                    })
                    .in_("tipo", ["doc_por_vencer", "doc_vencida"])
                    # Opcional: Si en 'mensaje' guardas el tipo de doc, podrías usar .ilike("mensaje", f"%{doc['tipo']}%")
                    .execute()
                )
            except Exception as e:
                print(f"Advertencia limpiando alertas: {e}")
        
        # Si la fecha sigue siendo hoy o pasado (vencido), NO HACEMOS NADA. 
        # La alerta se mantiene activa, que es lo que quieres.

    # 5. RETORNO FINAL
    return {"message": "Máquina actualizada correctamente"}

async def delete_machine(machine_id: int):
    hoy = date.today().isoformat()

    # ----------------------------------------
    # 1. Verificar que la máquina exista
    # ----------------------------------------
    m_raw = (
        supabase.table("maquinas")
        .select("*")
        .eq("id", machine_id)
        .single()
        .execute()
    )

    if getattr(m_raw, "error", None):
        raise HTTPException(404, "Máquina no encontrada.")

    # ----------------------------------------
    # 2. Revisar si tiene chofer asignado
    # ----------------------------------------
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id")
        .eq("maquina_id", machine_id)
        .is_("fecha_termino", None)
        .maybe_single()
        .execute()
    )

    # Cerrar asignación si existe
    if asign_raw.data:
        cierre = (
            supabase.table("asignaciones_chofer_maquina")
            .update({"fecha_termino": hoy})
            .eq("id", asign_raw.data["id"])
            .execute()
        )

        if getattr(cierre, "error", None):
            raise HTTPException(400, f"Error liberando chofer: {cierre.error}")

    # ----------------------------------------
    # 3. Cambiar estado de la máquina a 'inactiva'
    # ----------------------------------------
    update_res = (
        supabase.table("maquinas")
        .update({"estado_operativo": "inactiva"})
        .eq("id", machine_id)
        .execute()
    )

    if getattr(update_res, "error", None):
        raise HTTPException(400, f"Error desactivando máquina: {update_res.error}")

    # ----------------------------------------
    # 4. Respuesta final
    # ----------------------------------------
    return {
        "message": "Máquina desactivada correctamente.",
        "nuevo_estado": "inactiva"
    }


async def get_machine_assignments(machine_id: int, filters):
    """
    Retorna el historial de asignaciones de una máquina con paginación.
    Filtros:
      - todas (default)
      - actual
      - cerradas
    """
    from app.schemas.machine import MachineAssignmentFilters
    from app.core.pagination import PaginatedResponse
    
    # 1. Obtener todas las asignaciones
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id, chofer_id, fecha_inicio, fecha_termino")
        .eq("maquina_id", machine_id)
        .order("fecha_inicio", desc=True)
        .execute()
    )

    if getattr(asign_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo historial: {asign_raw.error}")

    asignaciones = asign_raw.data

    if not asignaciones:
        return PaginatedResponse(
            total=0,
            page=filters.page,
            per_page=filters.per_page,
            items=[]
        )

    # 2. Obtener todos los choferes involucrados
    chofer_ids = [a["chofer_id"] for a in asignaciones]

    choferes_raw = (
        supabase.table("choferes")
        .select("id, primer_nombre, apellido_paterno")
        .in_("id", chofer_ids)
        .execute()
    )

    chofer_map = {c["id"]: f"{c['primer_nombre']} {c['apellido_paterno']}" for c in choferes_raw.data}

    hoy = date.today()

    resultado = []

    for a in asignaciones:
        fecha_inicio = date.fromisoformat(a["fecha_inicio"])
        fecha_fin = date.fromisoformat(a["fecha_termino"]) if a["fecha_termino"] else None

        estado = "Activa" if fecha_fin is None else "Cerrada"

        # Cálculo de días
        fin = fecha_fin or hoy
        dias = (fin - fecha_inicio).days

        item = {
            "id": a["id"],
            "chofer_id": a["chofer_id"],
            "chofer_nombre": chofer_map.get(a["chofer_id"], "Desconocido"),
            "fecha_inicio": fecha_inicio.isoformat(),
            "fecha_fin": fecha_fin.isoformat() if fecha_fin else None,
            "estado": estado,
            "dias_asignado": dias
        }

        resultado.append(item)

    # 3. Aplicar filtros por estado
    filtro = filters.filtro or "todas"
    if filtro == "actual":
        resultado = [r for r in resultado if r["estado"] == "Activa"]
    elif filtro == "cerradas":
        resultado = [r for r in resultado if r["estado"] == "Cerrada"]

    # 4. Aplicar paginación
    total = len(resultado)
    start = filters.offset
    end = start + filters.per_page
    items_paginados = resultado[start:end]

    return PaginatedResponse(
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        items=items_paginados
    )


async def get_machine_maintenances(
    machine_id: int,
    categoria: Optional[str] = None,
    item: Optional[str] = None,
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    page: int = 1,
    per_page: int = 12,
):
    """
    Devuelve:
    - total_registros: cantidad de resultados filtrados
    - gasto_mes_actual: suma de costos del mes en curso
    - items: lista de mantenimientos paginados
    - pagina: página actual
    - por_pagina: registros por página
    - total_paginas: total de páginas
    """

    # ---------------------------------------------------------
    # 1) Calcular gasto del mes actual
    # ---------------------------------------------------------
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    fin_mes = hoy.replace(day=monthrange(hoy.year, hoy.month)[1])

    gasto_raw = (
        supabase.table("compras_repuestos")
        .select("costo")
        .eq("maquina_id", machine_id)
        .gte("fecha_compra", inicio_mes.isoformat())
        .lte("fecha_compra", fin_mes.isoformat())
        .execute()
    )

    if getattr(gasto_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo gasto mensual: {gasto_raw.error}")

    gasto_mes_actual = sum(r["costo"] for r in gasto_raw.data) if gasto_raw.data else 0

    # ---------------------------------------------------------
    # 2) Construir el query principal con count
    # ---------------------------------------------------------
    query = (
        supabase.table("v_compras_repuestos")
        .select("*", count="exact")
        .eq("maquina_id", machine_id)
    )

    # Categoria
    if categoria:
        categoria_norm = categoria.lower().strip()
        categoria_norm = (
            categoria_norm
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
        )
        if categoria_norm not in ("preventivo", "correctivo"):
            raise HTTPException(400, "Categoría no válida. Use preventivo o correctivo.")
        query = query.eq("categoria", categoria_norm)

    # Item
    if item:
        f = item.lower()
        f_norm = (
            f.replace("á", "a")
             .replace("é", "e")
             .replace("í", "i")
             .replace("ó", "o")
             .replace("ú", "u")
        )
        query = query.ilike("item_final_normalizado", f"%{f_norm}%")

    # Fechas
    if desde:
        query = query.gte("fecha_compra", desde.isoformat())
    if hasta:
        query = query.lte("fecha_compra", hasta.isoformat())

    # Aplicar paginación
    start = (page - 1) * per_page
    end = start + per_page - 1
    
    # Ejecutar query con paginación
    res = query.order("fecha_compra", desc=True).range(start, end).execute()
    
    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo historial: {res.error}")
    
    # Obtener el total del conteo
    total_registros = res.count if hasattr(res, 'count') and res.count is not None else (len(res.data) if res.data else 0)

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error obteniendo historial: {res.error}")

    # ---------------------------------------------------------
    # 3) Ensamblar items
    # ---------------------------------------------------------
    items = []
    for r in res.data:
        nombre_item = r.get("item_final") or "Sin nombre"
        items.append({
            "id": r["id"],
            "fecha": r["fecha_compra"],
            "item": nombre_item,
            "categoria": r.get("categoria"),
            "costo": r.get("costo"),
            "numero_documento": r.get("numero_documento")
        })

    # Calcular total de páginas
    total_paginas = (total_registros + per_page - 1) // per_page if total_registros > 0 else 0

    # Obtener total global de registros (sin filtros) para el badge
    total_global_query = (
        supabase.table("v_compras_repuestos")
        .select("id", count="exact")
        .eq("maquina_id", machine_id)
    )
    total_global_res = total_global_query.execute()
    total_registros_global = total_global_res.count if hasattr(total_global_res, 'count') and total_global_res.count is not None else 0

    # ---------------------------------------------------------
    # 4) Respuesta final
    # ---------------------------------------------------------
    return {
        "total_registros": total_registros,  # Total filtrado (para paginación)
        "total_registros_global": total_registros_global,  # Total sin filtros (para badge)
        "gasto_mes_actual": gasto_mes_actual,
        "items": items,
        "pagina": page,
        "por_pagina": per_page,
        "total_paginas": total_paginas
    }


async def create_machine_maintenance(machine_id: int, data):
    # 1) Validar que la máquina exista
    m_raw = (
        supabase.table("maquinas")
        .select("id")
        .eq("id", machine_id)
        .single()
        .execute()
    )

    if getattr(m_raw, "error", None):
        raise HTTPException(404, "Máquina no encontrada")

    # 2) Construir payload de inserción
    payload = {
        "maquina_id": machine_id,
        "item_repuesto_id": data.item_repuesto_id,
        "item_personalizado": data.item_personalizado,
        "costo": data.costo,
        "numero_documento": data.numero_documento,
        "categoria": data.categoria,
        "fecha_compra": data.fecha_compra.isoformat()
    }

    # 3) Insertar en compras_repuestos
    res = supabase.table("compras_repuestos").insert(payload).execute()

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error creando mantenimiento: {res.error}")

    nuevo = res.data[0]

    return {
        "message": "Registro creado correctamente",
        "id": nuevo["id"],
        "maquina_id": nuevo["maquina_id"]
    }


async def delete_maintenance(maintenance_id: int):
    """
    Elimina una compra de repuesto.
    """

    # Verificar existencia
    exists = (
        supabase.table("compras_repuestos")
        .select("id")
        .eq("id", maintenance_id)
        .single()
        .execute()
    )

    if getattr(exists, "error", None):
        raise HTTPException(404, "Registro de mantenimiento no encontrado.")

    # Eliminar
    res = (
        supabase.table("compras_repuestos")
        .delete()
        .eq("id", maintenance_id)
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(400, f"Error eliminando registro: {res.error}")

    return None   # Provoca el 204 No Content
