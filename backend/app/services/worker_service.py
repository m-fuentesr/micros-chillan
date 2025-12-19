from datetime import date, datetime
from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.user import UserInDB
import calendar


async def get_profile(current_user: UserInDB):
    # 1. Obtener chofer_id
    chofer_id = current_user.chofer_id
    if not chofer_id:
        raise HTTPException(status_code=400, detail="Usuario sin chofer asignado")

    # --- PASO 1: Consultar Datos del Chofer ---
    response_chofer = (
        supabase.table("choferes")
        .select("*")
        .eq("id", chofer_id)
        .single()
        .execute()
    )
    
    chofer = response_chofer.data
    if not chofer:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    # --- PASO 2: Consultar ID de la Máquina Asignada ---
    response_asignacion = (
        supabase.table("asignaciones_chofer_maquina")
        .select("maquina_id")
        .eq("chofer_id", chofer_id)
        .is_("fecha_termino", "null") # Vigente
        .limit(1)
        .execute()
    )
    
    # --- PASO 3: Consultar Detalles de la Máquina ---
    maquina_str = "Sin Asignar"
    
    if response_asignacion.data and len(response_asignacion.data) > 0:
        maquina_id = response_asignacion.data[0].get("maquina_id")
        
        if maquina_id:
            response_maquina = (
                supabase.table("maquinas")
                .select("numero_interno, marca") 
                .eq("id", maquina_id)
                .single()
                .execute()
            )
            
            if response_maquina.data:
                maq = response_maquina.data
                numero = maq.get('numero_interno', 'N/A')
                marca = maq.get('marca', 'N/A')
                maquina_str = f"{numero} - {marca}"

    # --- PASO 4: Formatear Respuesta ---
    # Construir nombre completo manejando valores None
    parts = []
    if chofer.get('primer_nombre'):
        parts.append(chofer['primer_nombre'].strip())
    if chofer.get('segundo_nombre'):
        parts.append(chofer['segundo_nombre'].strip())
    if chofer.get('apellido_paterno'):
        parts.append(chofer['apellido_paterno'].strip())
    if chofer.get('apellido_materno'):
        parts.append(chofer['apellido_materno'].strip())
    
    nombre_completo = " ".join(parts) if parts else "Sin nombre"

    # Fecha
    fecha_ingreso_raw = chofer.get("created_at")
    fecha_fmt = "--/--/----"
    if fecha_ingreso_raw:
        try:
            dt = datetime.fromisoformat(str(fecha_ingreso_raw).replace('Z', '+00:00'))
            fecha_fmt = dt.strftime("%d-%m-%Y")
        except:
            fecha_fmt = str(fecha_ingreso_raw).split("T")[0]

    return {
        "nombre_completo": nombre_completo,
        "rut": chofer["rut"],
        "telefono": chofer["telefono"],
        
        # --- CORRECCIÓN AQUÍ ---
        # Sacamos el email directamente de la tabla usuarios (current_user)
        # Si por alguna razón no está, usamos "Sin Email" para no romper el Schema.
        "email": current_user.correo or "Sin Email", 
        
        "maquina_detalle": maquina_str,
        "fecha_ingreso": fecha_fmt,
        "estadisticas": {
            "dias_trabajados": 0,
            "total_recaudado": 0
        }
    }

async def get_monthly_stats(current_user: UserInDB, mes: int = None, anio: int = None):
    """
    Calcula días trabajados y total recaudado para un mes específico.
    Si no se envía mes/año, usa los actuales.
    """
    # 1. Validar Chofer
    chofer_id = current_user.chofer_id
    if not chofer_id:
        raise HTTPException(status_code=400, detail="Usuario sin chofer asignado")

    # 2. Definir Fechas (Inicio y Fin de Mes)
    hoy = date.today()
    mes_target = mes if mes else hoy.month
    anio_target = anio if anio else hoy.year

    # Fecha Inicio: Día 1
    fecha_inicio = date(anio_target, mes_target, 1).isoformat()
    
    # Fecha Fin: Último día del mes (ej: 28, 30, 31)
    ultimo_dia = calendar.monthrange(anio_target, mes_target)[1]
    fecha_fin = date(anio_target, mes_target, ultimo_dia).isoformat()

    # 3. Consulta a Supabase
    # Traemos solo la columna 'monto_recaudado' para sumar en Python
    # Filtramos por chofer y rango de fechas
    res = (
        supabase.table("registros_diarios")
        .select("monto_recaudado")
        .eq("chofer_id", chofer_id)
        .gte("fecha", fecha_inicio) # Mayor o igual al día 1
        .lte("fecha", fecha_fin)    # Menor o igual al último día
        .execute()
    )

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error calculando estadísticas: {res.error}")

    data = res.data # Lista de diccionarios: [{'monto_recaudado': 150000}, ...]

    # 4. Cálculos Matemáticos
    dias_trabajados = len(data) # Cantidad de filas
    
    # Sumar montos (manejando posibles nulls con 0)
    total_recaudado = sum((item.get("monto_recaudado") or 0) for item in data)

    # 5. Retornar Respuesta
    return {
        "periodo": {
            "mes": mes_target,
            "anio": anio_target
        },
        "estadisticas": {
            "dias_trabajados": dias_trabajados,
            "total_recaudado": total_recaudado
        }
    }