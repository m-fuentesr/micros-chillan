from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.db.supabase_client import supabase
from app.services import alert_service

# Definimos la zona horaria de Chile
CHILE_TZ = ZoneInfo("America/Santiago")

async def check_missing_daily_records(target_audience: str):
    """
    target_audience: 
      - 'chofer': Revisa HOY. Alerta al chofer.
      - 'admin': Revisa AYER. Alerta al admin.
    """
    
    now_chile = datetime.now(CHILE_TZ)
    
    # 1. Definir FECHA y MENSAJE BASE
    if target_audience == 'chofer':
        audit_date = now_chile.date() # Hoy (ej. 18/12)
        print(f"🕵️ [Chofer] Revisando registros faltantes de HOY ({audit_date})...")
    else:
        audit_date = now_chile.date() - timedelta(days=1) # Ayer (ej. 17/12)
        print(f"🕵️ [Admin] Revisando registros faltantes de AYER ({audit_date})...")
        
    fecha_str = audit_date.isoformat()

    try:
        # 2. Obtener Choferes Activos + ID de MÁQUINA
        # Agregamos 'id' de la máquina para poder linkear la alerta
        active_assignments = (
            supabase.table("asignaciones_chofer_maquina")
            .select("chofer_id, choferes(primer_nombre, apellido_paterno), maquinas(id, numero_interno)")
            .is_("fecha_termino", "null")
            .execute()
        )
        
        if not active_assignments.data:
            print("No hay choferes activos asignados.")
            return

        # Diccionario para acceso rápido
        choferes_activos = {
            item['chofer_id']: {
                'nombre': f"{item['choferes']['primer_nombre']} {item['choferes']['apellido_paterno']}",
                'maquina_num': item['maquinas']['numero_interno'],
                'maquina_id': item['maquinas']['id'] # Guardamos el ID real de la máquina
            } 
            for item in active_assignments.data
        }
        
        ids_activos = set(choferes_activos.keys())

        # 3. Obtener quiénes SÍ hicieron registro esa fecha
        records_done = (
            supabase.table("registros_diarios")
            .select("chofer_id")
            .eq("fecha", fecha_str)
            .execute()
        )
        
        ids_cumplidores = {item['chofer_id'] for item in records_done.data}

        # 4. Calcular Faltantes
        ids_faltantes = ids_activos - ids_cumplidores
        
        if not ids_faltantes:
            print(f"✅ Todos cumplieron en la fecha {fecha_str}.")
            return

        print(f"⚠️ Detectados {len(ids_faltantes)} faltantes para {target_audience}.")

        # 5. Generar Alertas Diferenciadas
        for chofer_id in ids_faltantes:
            datos = choferes_activos[chofer_id]
            nombre = datos['nombre']
            maquina_num = datos['maquina_num']
            maquina_id = datos['maquina_id']

            if target_audience == 'chofer':
                # --- ALERTA PARA EL CHOFER ---
                # "¡Hazlo ahora!"
                await alert_service.crear_alerta(
                    mensaje="Debes enviar tu registro diario. Tiempo límite 23:59.",
                    severidad="advertencia",
                    tipo="registro_faltante",
                    origen_tipo="chofer",   # <-- Esto hace que SOLO el chofer la vea (según tu filtro)
                    origen_id=chofer_id
                )
            
            elif target_audience == 'admin':
                # --- ALERTA PARA EL ADMIN ---
                # "Informe de incumplimiento"
                await alert_service.crear_alerta(
                    mensaje=f"Falta registro del {fecha_str}: {nombre} (Máquina {maquina_num})",
                    severidad="advertencia", # Amarilla
                    tipo="registro_faltante",
                    origen_tipo="maquina", # <-- Esto hace que el ADMIN la vea (y pueda ir al detalle de la máquina)
                    origen_id=maquina_id
                )

    except Exception as e:
        print(f"❌ Error en Cron Job ({target_audience}): {e}")