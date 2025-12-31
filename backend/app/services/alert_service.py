from fastapi import HTTPException, status
from typing import List, Optional
from app.db.supabase_client import supabase
from datetime import datetime, timezone, timedelta
from app.schemas.dashboard import (
    DashboardAlertItem,
    DashboardAlerts,
    DashboardAlertSummary,
)
from app.schemas.user import UserInDB

# Definimos los enums aquí para usarlos en código
# Nota: Los valores deben coincidir con el enum de la base de datos (en minúsculas)
SEVERIDAD_CRITICA = "critica"
SEVERIDAD_ADVERTENCIA = "advertencia"
SEVERIDAD_INFO = "informativa"

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
        # Convertimos el error a string para buscar el código
        error_str = str(e)
        
        # El código 23505 es "Unique Violation" en Postgres
        if "23505" in error_str or "unique_alerta_activa" in error_str:
            # Es un duplicado, esto es normal y esperado. No imprimimos error.
            # Opcional: print(f"ℹ️ Alerta duplicada omitida: {origen_tipo} {origen_id}")
            return None
        else:
            # Si es CUALQUIER otro error, ahí sí lo queremos ver
            print(f"❌ Error CRÍTICO creando alerta: {e}")
            # Aquí podrías hacer raise e si quieres que el endpoint falle

async def marcar_como_leida(alerta_id: int, current_user: Optional[UserInDB] = None):
    """
    Cambia el estado de una alerta de 'activa' a 'resuelta'.
    🛡️ GUARDIÁN: Bloquea la acción si es un Incidente Crítico.
    🔒 SEGURIDAD: Si es trabajador, solo puede resolver sus propias alertas.
    """
    try:
        # 1. LEER PRIMERO: Necesitamos saber qué tipo de alerta es y su origen
        alerta_res = (
            supabase.table("alertas")
            .select("tipo, origen_tipo, origen_id")
            .eq("id", alerta_id)
            .single()
            .execute()
        )
        
        if not alerta_res.data:
            # Si no existe, retornamos False o error 404
            return False 

        alerta = alerta_res.data

        # 2. VALIDACIÓN DE SEGURIDAD: Si es trabajador, solo puede resolver sus propias alertas
        if current_user and current_user.chofer_id:
            # Verificar que la alerta pertenece a este chofer
            if (alerta.get("origen_tipo") == "chofer" and 
                alerta.get("origen_id") != current_user.chofer_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para resolver esta alerta. Solo puedes resolver tus propias notificaciones."
                )
            # Si la alerta no es del chofer pero el usuario es trabajador, también bloquear
            # (excepto si es admin, pero los admins no tienen chofer_id)
            elif alerta.get("origen_tipo") != "chofer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para resolver esta alerta."
                )

        # 3. VALIDAR REGLA DE NEGOCIO (El Guardián)
        # Si es crítica Y viene de un registro diario, PROHIBIDO cerrar aquí.
        if (alerta.get("tipo") == "incidente_critico" and 
            alerta.get("origen_tipo") == "registro_diario"):
            
            # Lanzamos una excepción que tu Frontend pueda capturar para mostrar un Toast/Alerta
            raise HTTPException(
                status_code=409, 
                detail="⚠️ Los incidentes críticos no se pueden cerrar desde aquí. Debes ir al Registro Diario y resolver el incidente."
            )

        # 3. SI PASA LA VALIDACIÓN, ACTUALIZAMOS
        datos_actualizar = {
            "estado": "resuelta",
            "fecha_resuelta": datetime.now(timezone.utc).isoformat()
        }

        res = (
            supabase.table("alertas")
            .update(datos_actualizar)
            .eq("id", alerta_id)
            .execute()
        )
        
        if res.data and len(res.data) > 0:
            return True
        return False
        
    except HTTPException as he:
        # Re-lanzamos la excepción HTTP para que llegue al endpoint
        raise he
    except Exception as e:
        print(f"Error marcando alerta como leída: {e}")
        return False
    

async def marcar_todas_admin_como_resueltas():
    """
    Marca como 'resuelta' TODAS las alertas activas del Admin.
    🛡️ EXCEPCIONES DE SEGURIDAD: 
       - No borra alertas personales de choferes.
       - No borra ALERTAS CRÍTICAS (severidad="critica") - deben resolverse manualmente (TC025).
    """
    try:
        from datetime import datetime, timezone
        
        datos_actualizar = {
            "estado": "resuelta",
            "fecha_resuelta": datetime.now(timezone.utc).isoformat()
        }

        # Ejecutamos el update masivo con FILTROS DE SEGURIDAD
        alertas_admin = await get_admin_alerts()

        # Filtrar por severidad: solo eliminar alertas NO críticas (TC025)
        # Las alertas críticas deben permanecer y resolverse manualmente
        ids_a_resolver = [
            alerta.get("id")
            for alerta in alertas_admin
            if (alerta.get("severidad") or "").lower() != "critica"
        ]

        if not ids_a_resolver:
            return 0
        
        res = (
            supabase.table("alertas")
            .update(datos_actualizar)
            .in_("id", ids_a_resolver)
            .eq("estado", "activa")              
            .execute()
        )
        
        if res.data:
            print(f"Se resolvieron {len(res.data)} alertas de administrador (respetando alertas críticas).")
            return len(res.data) 
        
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
            .neq("tipo", "licencia_por_vencer")
            .neq("tipo", "licencia_vencida")
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
            .neq("tipo", "confirmacion_pago")
            .order("severidad", desc=False)    # Primero criticas, luego advertencias (según tu enum)
            .order("created_at", desc=True)    # Luego las más nuevas
            .execute()
        )
        alertas = res.data if res.data else []

        # Excluir solo las alertas personales del chofer que no son relevantes al admin
        alertas_filtradas = [
            alerta for alerta in alertas
            if not (
                alerta.get("origen_tipo") == "chofer"
                and alerta.get("tipo") in {"registro_faltante"}
            )
        ]

        return alertas_filtradas
    except Exception as e:
        print(f"Error obteniendo alertas de admin: {e}")
        return []
    

def _build_alerts_summary(alertas_raw: List[dict]) -> DashboardAlerts:
    resumen = {"criticas": 0, "advertencias": 0, "informativas": 0}
    alert_items: List[DashboardAlertItem] = []

    for alerta in alertas_raw:
        severidad = (alerta.get("severidad") or "").lower()

        if severidad == "critica":
            resumen["criticas"] += 1
        elif severidad == "advertencia":
            resumen["advertencias"] += 1
        else:
            resumen["informativas"] += 1

        alert_items.append(
            DashboardAlertItem(
                id=alerta.get("id"),
                mensaje=alerta.get("mensaje", ""),
                severidad=alerta.get("severidad", ""),
                tipo=alerta.get("tipo", ""),
                origen_tipo=alerta.get("origen_tipo", ""),
                origen_id=alerta.get("origen_id", 0),
                estado=alerta.get("estado", ""),
                created_at=alerta.get("created_at"),
            )
        )

    SEVERITY_PRIORITY = {
        "critica": 0,
        "informativa": 1,
        "advertencia": 2,
    }

    # 1) Agrupar por severidad
    alert_items.sort(key=lambda a: SEVERITY_PRIORITY.get(a.severidad, 99))

    # 2) Ordenar por fecha DESC dentro de cada grupo
    alert_items.sort(key=lambda a: a.created_at, reverse=True)

    return DashboardAlerts(
        resumen=DashboardAlertSummary(
            criticas=resumen.get("criticas", 0),
            advertencias=resumen.get("advertencias", 0),
            informativas=resumen.get("informativas", 0),
        ),
        items=alert_items,
    )


async def get_admin_alerts_overview() -> DashboardAlerts:
    """
    Devuelve la lista de alertas de administrador junto con el resumen (KPIs).
    """

    await limpiar_alertas_antiguas()
    alertas_raw = await get_admin_alerts()
    return _build_alerts_summary(alertas_raw)


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
    
async def existe_alerta_reciente(origen_id: int, tipo: str, horas: int = 24) -> bool:
    """
    Evita duplicados. Retorna True si ya se creó una alerta (activa o resuelta)
    para este ID y TIPO en las últimas X horas.
    """
    try:
        # Calculamos la fecha límite (hace 24 horas)
        # Usamos UTC porque Supabase guarda en UTC
        limite = datetime.now(timezone.utc) - timedelta(hours=horas)
        
        res = (
            supabase.table("alertas")
            .select("id")
            .eq("origen_id", origen_id)   # Ej: ID de la máquina (85)
            .eq("tipo", tipo)             # Ej: 'doc_por_vencer'
            .gte("created_at", limite.isoformat()) # Created_at >= hace 24hrs
            .execute()
        )
        
        # Si devuelve alguna fila (sea activa o resuelta), es que ya existe una reciente.
        if res.data and len(res.data) > 0:
            return True
            
        return False

    except Exception as e:
        print(f"Error verificando duplicados: {e}")
        return False # Ante la duda, dejamos pasar (fail-safe)
    
async def limpiar_alertas_antiguas():
    """
    Busca alertas informativas con más de 24 horas de antigüedad
    y cambia su estado a 'resuelta' para que no ensucien la vista.
    """
    try:
        # 1. Definir el límite de tiempo (Hace 24 horas exactas)
        limite_tiempo = (datetime.now() - timedelta(hours=24)).isoformat()

        # 2. Ejecutar actualización masiva
        # "Pon en estado 'archivada' todas las alertas informativas, activas y viejas"
        response = (
            supabase.table("alertas")
            .update({"estado": "resuelta",
                     "fecha_resuelta": datetime.now().isoformat()}) 
            .eq("estado", "activa")              # Solo las que siguen activas
            .eq("severidad", "informativa")      # Solo las informativas (no borrar críticas!)
            .lt("fecha_generada", limite_tiempo) # lt = less than (menor que / más vieja que)
            .execute()
        )
        
        # Opcional: ver cuántas se limpiaron
        # if response.data:
        #     print(f"🧹 Se archivaron {len(response.data)} alertas antiguas.")
            
    except Exception as e:
        print(f"⚠️ Error intentando limpiar alertas antiguas: {e}")