from fastapi import HTTPException
from app.db.supabase_client import supabase

async def create_daily_record(payload, current_user: dict):
    """
    Crea el reporte diario, calcula pagos y define el estado (Incidente vs Completo).
    """
    # 1. Obtener ID del chofer
    chofer_id = current_user.get("chofer_id")
    if not chofer_id:
        raise HTTPException(status_code=400, detail="Usuario no es un chofer válido.")

    # 2. Obtener el Porcentaje de Pago actual del Chofer
    # Necesitamos esto para calcular cuánto gana él.
    resp_chofer = (
        supabase.table("choferes")
        .select("porcentaje_pago")
        .eq("id", chofer_id)
        .single()
        .execute()
    )
    
    if not resp_chofer.data:
        raise HTTPException(status_code=404, detail="Chofer no encontrado.")
        
    porcentaje = resp_chofer.data.get("porcentaje_pago", 0)

    # 3. Lógica de Negocio: Cálculos Financieros
    # Pago Chofer = Recaudado * %
    monto_chofer = int(payload.monto_recaudado * (porcentaje / 100))
    
    # Ganancia Neta Empresa = Recaudado - Diesel - Pago Chofer
    ganancia_neta = payload.monto_recaudado - payload.costo_total_diesel - monto_chofer

    # 4. Lógica de Negocio: Estado según Incidente
    estado_final = "incidente_reportado" if payload.incidente_critico else "completo"

    # 5. Preparar objeto para insertar en BD
    nuevo_registro = {
        "chofer_id": chofer_id,
        "maquina_id": payload.maquina_id,
        "fecha": payload.fecha.isoformat(),
        
        # Datos ingresados
        "monto_recaudado": payload.monto_recaudado,
        "litros_diesel": payload.litros_diesel,
        "costo_total_diesel": payload.costo_total_diesel,
        "imagen_url": payload.imagen_url,
        "observaciones": payload.observaciones,
        "incidente_critico": payload.incidente_critico,
        
        # Datos calculados (Automáticos)
        "monto_porcentaje_chofer": monto_chofer,
        "ganancia_neta": ganancia_neta,
        "porcentaje_aplicado": porcentaje, # Guardamos qué % se usó ese día (histórico)
        
        "estado": estado_final,
        "created_at": "now()"
    }

    # 6. Insertar en Supabase
    res = supabase.table("registros_diarios").insert(nuevo_registro).execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error creando registro: {res.error}")

    return res.data[0]
