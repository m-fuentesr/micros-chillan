from fastapi import HTTPException
from app.db.supabase_client import supabase

  # Usamos tu importación correcta

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