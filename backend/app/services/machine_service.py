from fastapi import HTTPException
from datetime import date, timedelta
from app.db.supabase_client import supabase
from app.schemas.user import UserInDB

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


async def list_machines():
    hoy = date.today()
    alerta_dias = 30
    limite_warning = hoy + timedelta(days=alerta_dias)

    # 1) Obtener máquinas
    maquinas_raw = (
        supabase.table("maquinas")
        .select("*")
        .order("numero_interno")
        .execute()
    )

    if getattr(maquinas_raw, "error", None):
        raise HTTPException(400, f"Error obteniendo máquinas: {maquinas_raw.error}")

    maquinas = maquinas_raw.data

    # 2) Obtener las asignaciones actuales (fecha_termino = NULL)
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id, maquina_id, chofer_id, fecha_inicio, fecha_termino")
        .is_("fecha_termino", None)
        .execute()
    )

    asignaciones = {a["maquina_id"]: a["chofer_id"] for a in asign_raw.data}

    # 3) Obtener datos de choferes asignados
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

    # 4) Obtener documentos de todas las máquinas
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

    # 5) Construcción de respuesta final
    items = []

    for m in maquinas:
        mid = m["id"]

        # Chofer asignado
        chofer_info = None
        if mid in asignaciones:
            cid = asignaciones[mid]
            chofer_info = choferes_map.get(cid)

        # Documentos
        documentos = {}
        for tipo in ["revision_tecnica", "permiso_circulacion", "seguro_obligatorio"]:
            if mid in docs_map and tipo in docs_map[mid]:
                fv = date.fromisoformat(docs_map[mid][tipo])

                if fv < hoy:
                    estado = "vencido"
                elif fv <= limite_warning:
                    estado = "por_vencer"
                else:
                    estado = "ok"

                documentos[tipo] = {
                    "fecha_vencimiento": fv,
                    "estado": estado
                }

        # Ensamblar item final
        items.append({
            "id": mid,
            "numero_interno": m["numero_interno"],
            "marca": m["marca"],
            "patente": m.get("patente"),
            "estado_operativo": m["estado_operativo"],
            "chofer_asignado": chofer_info,
            "documentos": documentos
        })

    return items


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
        asign_res = (
            supabase.table("asignaciones_chofer_maquina")
            .insert(
                {
                    "maquina_id": maquina_id,
                    "chofer_id": data.chofer_id,
                    "fecha_inicio": date.today().isoformat(),
                    "fecha_termino": None,
                }
            )
            .execute()
        )

        if getattr(asign_res, "error", None):
            raise HTTPException(
                400,
                f"Máquina creada, pero error asignando chofer: {asign_res.error}",
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
    # ----------------------------------------
    # 0. Verificar existencia
    # ----------------------------------------
    m_raw = (
        supabase.table("maquinas")
        .select("id")
        .eq("id", machine_id)
        .single()
        .execute()
    )

    if getattr(m_raw, "error", None):
        raise HTTPException(404, "Máquina no encontrada")

    # ----------------------------------------
    # 1. Actualizar datos principales
    # ----------------------------------------
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

    # ----------------------------------------
    # 2. Actualizar documentos
    # ----------------------------------------
    docs = data.documentos

    docs_updates = [
        {
            "tipo_documento": "revision_tecnica",
            "fecha_vencimiento": docs.fecha_venc_revision_tecnica.isoformat(),
        },
        {
            "tipo_documento": "permiso_circulacion",
            "fecha_vencimiento": docs.fecha_venc_permiso_circulacion.isoformat(),
        },
        {
            "tipo_documento": "seguro_obligatorio",
            "fecha_vencimiento": docs.fecha_venc_seguro_obligatorio.isoformat(),
        },
    ]

    # Actualizar cada documento
    for d in docs_updates:
        supabase.table("documentos_maquina").update(
            {"fecha_vencimiento": d["fecha_vencimiento"]}
        ).eq("maquina_id", machine_id).eq("tipo_documento", d["tipo_documento"]).execute()

    # ----------------------------------------
    # 3. Manejo de reasignación de chofer
    # ----------------------------------------

    # Obtener asignación actual
    asign_raw = (
        supabase.table("asignaciones_chofer_maquina")
        .select("id, chofer_id")
        .eq("maquina_id", machine_id)
        .is_("fecha_termino", None)
        .single()
        .execute()
    )

    asign_actual = asign_raw.data if asign_raw and asign_raw.data else None
    chofer_actual = asign_actual["chofer_id"] if asign_actual else None
    nuevo_chofer = data.chofer_id

    hoy = date.today().isoformat()

    # CASO 1: mismo chofer → no hacer nada
    if chofer_actual == nuevo_chofer:
        return {"message": "Máquina actualizada"}

    # CASO 2: había chofer y ahora es null → cerrar asignación
    if chofer_actual is not None and nuevo_chofer is None:
        supabase.table("asignaciones_chofer_maquina").update(
            {"fecha_termino": hoy}
        ).eq("id", asign_actual["id"]).execute()

        return {"message": "Máquina actualizada"}

    # CASO 3: cambiar chofer → cerrar anterior + crear nueva
    if chofer_actual is not None and nuevo_chofer is not None:
        supabase.table("asignaciones_chofer_maquina").update(
            {"fecha_termino": hoy}
        ).eq("id", asign_actual["id"]).execute()

    # Crear asignación nueva si hay nuevo chofer
    if nuevo_chofer is not None:
        supabase.table("asignaciones_chofer_maquina").insert(
            {
                "maquina_id": machine_id,
                "chofer_id": nuevo_chofer,
                "fecha_inicio": hoy,
                "fecha_termino": None,
            }
        ).execute()

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
