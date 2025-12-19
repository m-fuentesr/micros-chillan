from collections import defaultdict
from datetime import date
from typing import Dict, List, Optional

from fastapi import HTTPException

from app.db.supabase_client import supabase
from app.schemas.dashboard import (
    DashboardAlertItem,
    DashboardAlertSummary,
    DashboardAlerts,
    DashboardFleetKpi,
    DashboardKpis,
    DashboardDailyRecordDriver,
    DashboardDailyRecordMachine,
    DashboardDailyRecordItem,
    DashboardDailyRecords,
    DashboardMachinePerformance,
    DashboardResponse,
)
from app.services import alert_service


async def get_today_overview() -> DashboardResponse:
    """Obtiene datos agregados del dashboard para la fecha actual."""

    hoy = date.today()
    fecha_iso = hoy.isoformat()

    registros_res = (
        supabase.table("registros_diarios")
        .select(
            """
            id, fecha, estado, monto_recaudado, costo_total_diesel,
            monto_porcentaje_chofer, maquina_id, chofer_id, es_dia_no_trabajado,
            maquinas(numero_interno, patente),
            choferes(primer_nombre, apellido_paterno)
            """
        )
        .eq("fecha", fecha_iso)
        .order("maquina_id")
        .execute()
    )

    if getattr(registros_res, "error", None):
        raise HTTPException(500, f"Error obteniendo registros diarios: {registros_res.error}")

    registros = registros_res.data or []

    maquinas_res = (
        supabase.table("maquinas")
        .select("id", count="exact")
        .eq("estado_operativo", "operativa")
        .execute()
    )

    if getattr(maquinas_res, "error", None):
        raise HTTPException(500, f"Error obteniendo máquinas activas: {maquinas_res.error}")

    maquinas_activas_ids = {m.get("id") for m in (maquinas_res.data or []) if m.get("id")}
    total_maquinas_activas = maquinas_res.count or len(maquinas_activas_ids)

    total_recaudado = sum((row.get("monto_recaudado") or 0) for row in registros)
    gasto_diesel = sum((row.get("costo_total_diesel") or 0) for row in registros)
    pago_choferes = sum((row.get("monto_porcentaje_chofer") or 0) for row in registros)
    ganancia_neta = total_recaudado - gasto_diesel - pago_choferes

    maquinas_reportadas = {
        row.get("maquina_id")
        for row in registros
        if row.get("maquina_id") and row.get("maquina_id") in maquinas_activas_ids
    }

    reportes_recibidos = len(maquinas_reportadas)
    reportes_pendientes = max(total_maquinas_activas - reportes_recibidos, 0)

    rendimiento: Dict[int, Dict] = defaultdict(
        lambda: {
            "monto_recaudado": 0,
            "costo_total_diesel": 0,
            "monto_porcentaje_chofer": 0,
            "estado": None,
            "maquina": {},
            "chofer": {},
        }
    )

    for row in registros:
        maquina_id = row.get("maquina_id")
        data = rendimiento[maquina_id]

        data["monto_recaudado"] += row.get("monto_recaudado") or 0
        data["costo_total_diesel"] += row.get("costo_total_diesel") or 0
        data["monto_porcentaje_chofer"] += row.get("monto_porcentaje_chofer") or 0
        data["estado"] = row.get("estado")
        data["maquina"] = row.get("maquinas") or {}
        data["chofer"] = row.get("choferes") or {}

    rendimiento_list: List[DashboardMachinePerformance] = []
    for maquina_id, info in rendimiento.items():
        chofer_nombre = (
            f"{info['chofer'].get('primer_nombre', '')} {info['chofer'].get('apellido_paterno', '')}"
        ).strip() or None

        rendimiento_list.append(
            DashboardMachinePerformance(
                maquina_id=maquina_id,
                numero_interno=info["maquina"].get("numero_interno"),
                patente=info["maquina"].get("patente"),
                chofer=chofer_nombre,
                monto_recaudado=info["monto_recaudado"],
                monto_porcentaje_chofer=info["monto_porcentaje_chofer"],
                costo_total_diesel=info["costo_total_diesel"],
                ganancia_neta=(
                    info["monto_recaudado"] 
                    - info["costo_total_diesel"] 
                    - info["monto_porcentaje_chofer"]
                    ),
                estado=info.get("estado"),
            )
        )

    alertas_raw = await alert_service.get_admin_alerts()

    resumen_alertas = defaultdict(int)
    alert_items: List[DashboardAlertItem] = []

    for alerta in alertas_raw:
        severidad = (alerta.get("severidad") or "").lower()
        if severidad == "critica":
            resumen_alertas["criticas"] += 1
        elif severidad == "advertencia":
            resumen_alertas["advertencias"] += 1
        else:
            resumen_alertas["informativas"] += 1

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

    alertas = DashboardAlerts(
        resumen=DashboardAlertSummary(
            criticas=resumen_alertas.get("criticas", 0),
            advertencias=resumen_alertas.get("advertencias", 0),
            informativas=resumen_alertas.get("informativas", 0),
        ),
        items=alert_items,
    )

    # 1) Agrupar por severidad
    alert_items.sort(
        key=lambda a: SEVERITY_PRIORITY.get(a.severidad, 99)
    )

    # 2) Ordenar por fecha DESC dentro de cada grupo
    alert_items.sort(
        key=lambda a: a.created_at,
        reverse=True
    )

    return DashboardResponse(
        fecha=hoy,
        kpis=DashboardKpis(
            recaudacion_total=total_recaudado,
            ganancia_neta=ganancia_neta,
            flota_en_ruta=DashboardFleetKpi(
                activas=total_maquinas_activas,
                reportes_recibidos=reportes_recibidos,
                reportes_totales=total_maquinas_activas,
                reportes_pendientes=reportes_pendientes,
            )
        ),
        rendimiento=rendimiento_list,
        alertas=alertas,
    )

async def get_today_daily_records() -> DashboardDailyRecords:
    """Lista registros diarios (o faltantes) para todos los choferes activos del día."""

    hoy = date.today()
    fecha_iso = hoy.isoformat()

    # Choferes activos
    choferes_res = (
        supabase.table("choferes")
        .select("id, primer_nombre, apellido_paterno, apellido_materno, estado")
        .eq("estado", "activo")
        .execute()
    )

    if getattr(choferes_res, "error", None):
        raise HTTPException(500, f"Error obteniendo choferes activos: {choferes_res.error}")

    choferes = choferes_res.data or []

    # Asignaciones vigentes
    asignaciones_res = (
        supabase.table("asignaciones_chofer_maquina")
        .select("chofer_id, maquinas(id, numero_interno, patente)")
        .is_("fecha_termino", "null")
        .execute()
    )

    if getattr(asignaciones_res, "error", None):
        raise HTTPException(500, f"Error obteniendo asignaciones activas: {asignaciones_res.error}")

    asignaciones = {
        row["chofer_id"]: row.get("maquinas") or {}
        for row in (asignaciones_res.data or [])
        if row.get("chofer_id")
    }

    # Registros diarios de hoy
    registros_res = (
        supabase.table("registros_diarios")
        .select(
            "id, chofer_id, fecha, estado, monto_recaudado, "
            "maquinas(id, numero_interno, patente)"
        )
        .eq("fecha", fecha_iso)
        .execute()
    )

    if getattr(registros_res, "error", None):
        raise HTTPException(500, f"Error obteniendo registros diarios de hoy: {registros_res.error}")

    registros_por_chofer = {
        row["chofer_id"]: row
        for row in (registros_res.data or [])
        if row.get("chofer_id")
    }

    items: List[DashboardDailyRecordItem] = []

    for chofer in choferes:
        chofer_id = chofer.get("id")
        registro = registros_por_chofer.get(chofer_id)
        asignacion_maquina: Optional[dict] = asignaciones.get(chofer_id)
        maquina_registro: Optional[dict] = (registro or {}).get("maquinas")

        maquina_info = maquina_registro or asignacion_maquina
        maquina = (
            DashboardDailyRecordMachine(
                id=maquina_info.get("id"),
                numero_interno=maquina_info.get("numero_interno"),
                patente=maquina_info.get("patente"),
            )
            if maquina_info
            else None
        )

        nombre = " ".join(
            filter(
                None,
                [
                    chofer.get("primer_nombre"),
                    chofer.get("apellido_paterno"),
                    chofer.get("apellido_materno"),
                ],
            )
        )

        tiene_registro = registro is not None
        fecha_registro = (registro or {}).get("fecha") or fecha_iso
        estado = (registro or {}).get("estado") or "en_espera"
        monto_recaudado = (registro or {}).get("monto_recaudado")

        items.append(
            DashboardDailyRecordItem(
                chofer=DashboardDailyRecordDriver(
                    id=chofer_id,
                    nombre=nombre,
                ),
                maquina=maquina,
                fecha=fecha_registro,
                estado=estado,
                monto_recaudado=monto_recaudado,
                puede_ver_detalle=tiene_registro,
                registro_id=(registro or {}).get("id"),
            )
        )

    return DashboardDailyRecords(total=len(items), items=items)
