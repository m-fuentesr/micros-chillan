
from app.db.supabase_client import supabase
from datetime import datetime, timezone

# Definimos los enums aquí para usarlos en código
SEVERIDAD_CRITICA = "CRITICA"
SEVERIDAD_ADVERTENCIA = "ADVERTENCIA"
SEVERIDAD_INFO = "INFORMATIVA"

async def crear_alerta(
    mensaje: str, 
    severidad: str, 
    origen_tipo: str, 
    origen_id: int,
    tipo: str  
):
    try:
        data = {
            "mensaje": mensaje,
            "severidad": severidad,
            "origen_tipo": origen_tipo,
            "origen_id": origen_id,
            "tipo": tipo,  
            "estado": "activa" 
            
        }
        
        response = supabase.table("alertas").insert(data).execute()
        return response
        
    except Exception as e:
        print(f"Error creando alerta: {e}")
        # Dependiendo de tu lógica, podrías querer hacer raise e o solo loguear

async def marcar_como_leida(alerta_id: int):
    """
    Cambia el estado de una alerta de 'activa' a 'resuelta'
    y registra la fecha exacta en que se cerró.
    """
    try:
        # Preparamos los datos: Estado Y Fecha
        datos_actualizar = {
            "estado": "resuelta",
            "fecha_resuelta": datetime.now(timezone.utc).isoformat()
        }

        # Ejecutamos el update
        res = (
            supabase.table("alertas")
            .update(datos_actualizar)
            .eq("id", alerta_id)
            .execute()
        )
        
        # Verificamos si la lista de datos devuelta no está vacía
        if res.data and len(res.data) > 0:
            return True
        return False
        
    except Exception as e:
        print(f"Error marcando alerta como leída: {e}")
        return False
    
async def marcar_todas_admin_como_resueltas():
    """
    Marca como 'resuelta' TODAS las alertas activas que corresponden al Administrador.
    EXCLUYE las alertas personales de los choferes (como asignacion_maquina).
    """
    try:
        from datetime import datetime, timezone
        
        datos_actualizar = {
            "estado": "resuelta",
            "fecha_resuelta": datetime.now(timezone.utc).isoformat()
        }

        # Ejecutamos el update masivo
        res = (
            supabase.table("alertas")
            .update(datos_actualizar)
            .eq("estado", "activa")             # Solo las activas
            .neq("tipo", "asignacion_maquina")  # <--- EL FILTRO DE SEGURIDAD
            # Si en el futuro tienes más alertas solo de chofer, agrégalas al filtro
            .execute()
        )
        
        # Verificamos si hubo cambios (res.data devuelve la lista de filas afectadas)
        if res.data:
            print(f"Se resolvieron {len(res.data)} alertas de administrador.")
            return len(res.data) # Retornamos cantidad de alertas borradas
        
        return 0
        
    except Exception as e:
        print(f"Error en resolución masiva: {e}")
        return -1
    
async def get_alerts_by_worker(chofer_id: int):
    """
    Obtiene las alertas activas específicas para un chofer.
    Ej: 'Se te asignó la máquina X', 'Tu licencia vence pronto'.
    """
    try:
        res = (
            supabase.table("alertas")
            .select("*")
            .eq("estado", "activa")
            .eq("origen_tipo", "chofer")
            .eq("origen_id", chofer_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data if res.data else []
    except Exception as e:
        print(f"Error obteniendo alertas del trabajador {chofer_id}: {e}")
        return []

async def get_admin_alerts():
    """
    Obtiene todas las alertas activas para el panel de administración.
    Incluye: Documentos vencidos, Incidentes, Registros faltantes, Licencias vencidas.
    EXCLUYE: Notificaciones personales de 'asignacion_maquina'.
    """
    try:
        res = (
            supabase.table("alertas")
            .select("*")
            .eq("estado", "activa")
            .neq("tipo", "asignacion_maquina") # Filtramos lo que no le interesa al admin
            .order("severidad", desc=False)    # Primero criticas, luego advertencias (según tu enum)
            .order("created_at", desc=True)    # Luego las más nuevas
            .execute()
        )
        return res.data if res.data else []
    except Exception as e:
        print(f"Error obteniendo alertas de admin: {e}")
        return []

async def resolver_todas_alertas_chofer(chofer_id: int):
    """
    Marca como 'resuelta' TODAS las alertas activas que pertenecen 
    específicamente a un chofer (ID).
    Equivale al botón 'Marcar todo como leído' del trabajador.
    """
    try:
        from datetime import datetime, timezone
        
        datos_actualizar = {
            "estado": "resuelta",
            "fecha_resuelta": datetime.now(timezone.utc).isoformat()
        }

        # Ejecutamos el update masivo filtrado por el ID del chofer
        res = (
            supabase.table("alertas")
            .update(datos_actualizar)
            .eq("origen_id", chofer_id)    # <--- SOLO LAS DE ESTE CHOFER
            .eq("origen_tipo", "chofer")   # Seguridad extra: asegurar que son alertas de tipo 'persona/chofer'
            .eq("estado", "activa")        # Solo las que están pendientes
            .execute()
        )
        
        # Devolvemos cuántas se borraron para mostrar un mensaje tipo "5 alertas limpiadas"
        if res.data:
            cantidad = len(res.data)
            return {"message": f"Se limpiaron {cantidad} alertas.", "count": cantidad}
        
        return {"message": "No tenías alertas pendientes.", "count": 0}
        
    except Exception as e:
        print(f"Error limpiando alertas del chofer {chofer_id}: {e}")
        return {"error": str(e)}
    
async def verificar_propiedad_chofer(user_id: int, chofer_id_url: int) -> bool:
    """
    Verifica si el chofer de la URL corresponde al asignado en la cuenta del usuario.
    Busca en la tabla 'usuarios' el campo 'chofer_id'.
    """
    try:
        # 1. Buscamos al USUARIO (dueño del token)
        res = (
            supabase.table("usuarios") 
            .select("chofer_id")  # <--- Aquí está la clave
            .eq("id", user_id)
            .single()
            .execute()
        )
        
        # 2. Si existe el usuario y tiene un chofer asignado...
        if res.data and res.data.get('chofer_id'):
            chofer_asociado_db = res.data['chofer_id']
            
            # 3. Comparamos si el chofer de su base de datos es igual al de la URL
            print(f"🔍 Verificando: Usuario {user_id} tiene Chofer {chofer_asociado_db}. URL pide {chofer_id_url}")
            return int(chofer_asociado_db) == int(chofer_id_url)
            
        return False
        
    except Exception as e:
        print(f"Error verificando propiedad: {e}")
        return False