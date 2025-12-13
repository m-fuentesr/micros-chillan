
from app.db.supabase_client import supabase
from datetime import datetime

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