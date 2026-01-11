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
      - 'admin': Revisa AYER. Alerta al admin. Crea registro automático de 'No Trabajado'.
    """
    
    now_chile = datetime.now(CHILE_TZ)
    
    # 1. Definir FECHA a auditar
    if target_audience == 'chofer':
        audit_date = now_chile.date() # Hoy
    else:
        audit_date = now_chile.date() - timedelta(days=1) # Ayer
        
    # --- FILTRO DE SEGURIDAD: SOLO LUNES A VIERNES ---
    # Python cuenta los días: 0=Lunes ... 4=Viernes, 5=Sábado, 6=Domingo.
    # Si la fecha que estamos revisando es >= 5 (Sábado o Domingo), no hacemos nada.
    if audit_date.weekday() >= 5:
        print(f"📅 La fecha {audit_date} es fin de semana. No se requieren acciones.")
        return
    # -------------------------------------------------

    fecha_str = audit_date.isoformat()
    print(f"🕵️ [{target_audience}] Revisando registros faltantes del {fecha_str}...")

    try:
        # 2. Obtener Choferes Activos + ID de MÁQUINA
        active_assignments = (
            supabase.table("asignaciones_chofer_maquina")
            .select("chofer_id, choferes(primer_nombre, apellido_paterno), maquinas(id, numero_interno)")
            .is_("fecha_termino", "null")
            .execute()
        )
        
        if not active_assignments.data:
            print("No hay choferes activos asignados.")
            return

        choferes_activos = {
            item['chofer_id']: {
                'nombre': f"{item['choferes']['primer_nombre']} {item['choferes']['apellido_paterno']}",
                'maquina_num': item['maquinas']['numero_interno'],
                'maquina_id': item['maquinas']['id']
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

        # Lista para guardar los registros que vamos a crear en lote
        nuevos_registros_automaticos = [] 

        # 5. Generar Alertas y Preparar Datos
        for chofer_id in ids_faltantes:
            datos = choferes_activos[chofer_id]
            nombre = datos['nombre']
            maquina_num = datos['maquina_num']
            maquina_id = datos['maquina_id']

            if target_audience == 'chofer':
                # --- ALERTA PARA EL CHOFER ---
                await alert_service.crear_alerta(
                    mensaje="Debes enviar tu registro diario ahora con límite hasta las 23:59.",
                    severidad="advertencia",
                    tipo="registro_faltante",
                    origen_tipo="chofer",
                    origen_id=chofer_id
                )
            
            elif target_audience == 'admin':
                # --- ALERTA PARA EL ADMIN ---
                await alert_service.crear_alerta(
                    mensaje=f"Falta registro del {fecha_str}: {nombre} (Máquina {maquina_num}). Se generó registro automático.",
                    severidad="advertencia",
                    tipo="registro_faltante",
                    origen_tipo="maquina",
                    origen_id=maquina_id
                )

                # --- PREPARAR REGISTRO AUTOMÁTICO ---
                registro_auto = {
                    "maquina_id": maquina_id,
                    "chofer_id": chofer_id,
                    "fecha": fecha_str,
                    "monto_recaudado": 0,
                    "litros_diesel": 0,
                    "costo_total_diesel": 0,
                    "porcentaje_aplicado": 0,
                    "monto_porcentaje_chofer": 0,
                    "estado": "no_trabajado",
                    "es_dia_no_trabajado": True,
                    "motivo_no_trabajado": "registro_faltante",
                    "observaciones": "Generado automáticamente por Cron Job (Chofer no reportó)."
                }
                nuevos_registros_automaticos.append(registro_auto)

        # 6. Inserción Masiva (Solo Admin)
        if target_audience == 'admin' and nuevos_registros_automaticos:
            try:
                print(f"💾 Creando {len(nuevos_registros_automaticos)} registros automáticos...")
                supabase.table("registros_diarios").insert(nuevos_registros_automaticos).execute()
                print("✅ Registros automáticos creados con éxito.")
            except Exception as insert_error:
                print(f"❌ Error creando registros automáticos: {insert_error}")

    except Exception as e:
        print(f"❌ Error en Cron Job ({target_audience}): {e}")