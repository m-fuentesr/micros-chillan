from fastapi import HTTPException
from datetime import date, timedelta
from app.db.supabase_client import supabase
from app.utils.auth import require_admin


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


async def get_summary(current_user: dict):
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

    require_admin(current_user)

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