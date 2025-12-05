from fastapi import HTTPException
from typing import List
from datetime import date, timedelta
from app.db.supabase_client import supabase
from app.schemas.daily_record import DailyRecordCreate, DailyRecordListFilters
from app.schemas.user import UserInDB

async def create_daily_record(payload: DailyRecordCreate, current_user: UserInDB):
    """
    Crea el registro diario.
    1. Obtiene el porcentaje del chofer desde la tabla 'choferes'.
    2. Calcula el monto del chofer.
    3. Guarda todo cumpliendo con los campos obligatorios de la BD.
    """
    
    # 1. Obtener ID del chofer
    chofer_id = current_user.chofer_id
    if not chofer_id:
        raise HTTPException(status_code=400, detail="El usuario no es un chofer válido.")

    # ---------------------------------------------------------------
    # VALIDACIÓN: Verificar que no exista un reporte para la misma fecha
    # ---------------------------------------------------------------
    fecha_reporte = payload.fecha if payload.fecha else date.today()
    
    existing_record = (
        supabase.table("registros_diarios")
        .select("id, fecha, estado")
        .eq("chofer_id", chofer_id)
        .eq("fecha", fecha_reporte.isoformat())
        .execute()
    )

    if existing_record.data and len(existing_record.data) > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Ya existe un reporte diario para la fecha {fecha_reporte.isoformat()}. Solo se permite un reporte por día."
        )

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
    monto_pago_chofer = int(payload.monto_recaudado * porcentaje_del_chofer)

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
        "imagen_url": payload.imagen_url,  # Comprobante del registro diario (obligatorio)
        "imagen_comprobante_diesel_url": payload.imagen_comprobante_diesel_url,  # Comprobante de diesel (opcional)
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

    query = (
        supabase.table("registros_diarios")
        .select(
            "id, fecha, monto_recaudado, costo_total_diesel, estado, "
            "choferes(id, primer_nombre, apellido_paterno), "
            "maquinas(id, numero_interno)"
        )
    )

    # Filtro por máquina
    if filters.maquina_id is not None:
        query = query.eq("maquina_id", filters.maquina_id)

    # Filtro por chofer
    if filters.chofer_id:
        query = query.eq("chofer_id", filters.chofer_id)

    # Filtro por estado
    if filters.estado:
        query = query.eq("estado", filters.estado)

    # Filtro por fechas
    if filters.fecha_inicio:
        query = query.gte("fecha", filters.fecha_inicio.isoformat())

    if filters.fecha_fin:
        query = query.lte("fecha", filters.fecha_fin.isoformat())

    # Filtro por búsqueda libre (máquina / chofer)
    # BÚSQUEDA CLIENT-SIDE: Supabase no soporta LIKE con joins de forma directa
    # Así que filtraremos después del fetch (post-query)
    search_text = filters.search.lower() if filters.search else None

    query = query.order(sort_field, desc=sort_desc)

    res = query.execute()

    if getattr(res, "error", None):
        raise HTTPException(
            status_code=400,
            detail=f"Error listando registros diarios: {res.error}",
        )
    
    data = res.data or []
    result: List[dict] = []

    for row in data:
        chofer_raw = row.get("choferes") or {}
        maquina_raw = row.get("maquinas") or {}

        nombre_chofer = f"{chofer_raw.get('primer_nombre', '')} {chofer_raw.get('apellido_paterno', '')}".strip()
        numero_maquina = str(maquina_raw.get("numero_interno", ""))

        # FILTRO DE SEARCH (aplicado después del fetch)
        if search_text:
            if search_text not in nombre_chofer.lower() and search_text not in numero_maquina.lower():
                continue

        result.append(
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
                "monto_recaudado": row.get("monto_recaudado", 0),
                "diesel": row.get("costo_total_diesel"),
                "estado": row.get("estado", "")
            }
        )

    return result