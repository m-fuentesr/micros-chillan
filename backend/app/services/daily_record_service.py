from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.daily_record import DailyRecordCreate

async def create_daily_record(payload: DailyRecordCreate, current_user: dict):
    """
    Crea el registro diario.
    1. Obtiene el porcentaje del chofer desde la tabla 'choferes'.
    2. Calcula el monto del chofer.
    3. Guarda todo cumpliendo con los campos obligatorios de la BD.
    """
    
    # 1. Obtener ID del chofer
    chofer_id = current_user.get("chofer_id")
    if not chofer_id:
        raise HTTPException(status_code=400, detail="El usuario no es un chofer válido.")

    # ---------------------------------------------------------------
    # PASO CLAVE: BUSCAR EL PORCENTAJE (Para solucionar el error null)
    # ---------------------------------------------------------------
    resp_chofer = (
        supabase.table("choferes")
        .select("porcentaje_pago")
        .eq("id", chofer_id)
        .single()
        .execute()
    )
    
    if not resp_chofer.data:
        raise HTTPException(status_code=404, detail="Datos del chofer no encontrados.")

    # Obtenemos el valor. Si es None, usamos 0.0 para evitar errores matemáticos
    porcentaje_del_chofer = resp_chofer.data.get("porcentaje_pago") or 0.0

    # ---------------------------------------------------------------
    # CÁLCULOS OBLIGATORIOS (Según tu BD)
    # ---------------------------------------------------------------
    # Calculamos cuánto dinero representa ese porcentaje
    # Ejemplo: Recaudó 100.000 * 16.5% = 16.500
    monto_pago_chofer = int(payload.monto_recaudado * (porcentaje_del_chofer / 100))

    # Definir estado según el checkbox
    estado_calculado = "incidente_reportado" if payload.incidente_critico else "completo"

    # ---------------------------------------------------------------
    # ARMAR EL OBJETO FINAL
    # ---------------------------------------------------------------
    nuevo_registro = {
        "chofer_id": chofer_id,
        "maquina_id": payload.maquina_id,
        "fecha": payload.fecha.isoformat(),
        "monto_recaudado": payload.monto_recaudado,
        "litros_diesel": payload.litros_diesel,
        "costo_total_diesel": payload.costo_total_diesel,
        "imagen_url": payload.imagen_url,
        "observaciones": payload.observaciones,
        "estado": estado_calculado,

        # AQUÍ SOLUCIONAMOS EL ERROR:
        # La BD pedía 'porcentaje_aplicado', aquí se lo damos:
        "porcentaje_aplicado": porcentaje_del_chofer,
        
        # También enviamos el monto calculado, que suele ser obligatorio junto al %
        "monto_porcentaje_chofer": monto_pago_chofer, 
 
    }

    # Insertar
    res = supabase.table("registros_diarios").insert(nuevo_registro).execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error de BD: {res.error.message}")

    return res.data[0]