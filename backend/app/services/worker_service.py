from datetime import date, datetime
from fastapi import HTTPException
from app.db.supabase_client import supabase


async def get_profile(current_user: dict):
    # 1. Obtener chofer_id
    chofer_id = current_user.get("chofer_id")
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
    segundo = f" {chofer.get('segundo_nombre')}" if chofer.get('segundo_nombre') else ""
    nombre_completo = f"{chofer['primer_nombre']}{segundo} {chofer['apellido_paterno']} {chofer['apellido_materno']}"

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
        "email": current_user.get("correo") or "Sin Email", 
        
        "maquina_detalle": maquina_str,
        "fecha_ingreso": fecha_fmt,
        "estadisticas": {
            "dias_trabajados": 0,
            "total_recaudado": 0
        }
    }