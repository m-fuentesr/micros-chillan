from collections import defaultdict
from datetime import date
from typing import Dict, List, Optional

from fastapi import HTTPException

from app.db.supabase_client import supabase
from app.utils.dates import get_today_in_chile
from app.schemas.dashboard import (
    DashboardFleetKpi,
    DashboardKpis,
    DashboardDailyRecordDriver,
    DashboardDailyRecordMachine,
    DashboardDailyRecordItem,
    DashboardDailyRecords,
    DashboardMachinePerformance,
    DashboardResponse,
)


async def get_today_overview() -> DashboardResponse:
    """Obtiene datos agregados del dashboard para la fecha actual."""

    hoy = get_today_in_chile()  # Usar fecha de Chile para comparación correcta
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

    # Obtener máquinas operativas
    maquinas_res = (
        supabase.table("maquinas")
        .select("id", count="exact")
        .eq("estado_operativo", "operativa")
        .execute()
    )

    if getattr(maquinas_res, "error", None):
        raise HTTPException(500, f"Error obteniendo máquinas activas: {maquinas_res.error}")

    maquinas_operativas_ids = {m.get("id") for m in (maquinas_res.data or []) if m.get("id")}

    # Obtener asignaciones vigentes (choferes asignados hoy)
    # Solo las máquinas operativas CON chofer asignado se consideran "En Ruta"
    asignaciones_res = (
        supabase.table("asignaciones_chofer_maquina")
        .select("maquina_id")
        .lte("fecha_inicio", fecha_iso)
        .or_(f"fecha_termino.is.null,fecha_termino.gte.{fecha_iso}")
        .execute()
    )

    if getattr(asignaciones_res, "error", None):
        raise HTTPException(500, f"Error obteniendo asignaciones activas: {asignaciones_res.error}")

    # Filtrar solo máquinas operativas que tienen chofer asignado
    maquinas_con_chofer_ids = {
        row.get("maquina_id") 
        for row in (asignaciones_res.data or []) 
        if row.get("maquina_id") and row.get("maquina_id") in maquinas_operativas_ids
    }

    # Solo contar máquinas operativas CON chofer asignado como "En Ruta"
    total_maquinas_activas = len(maquinas_con_chofer_ids)

    total_recaudado = sum((row.get("monto_recaudado") or 0) for row in registros)
    gasto_diesel = sum((row.get("costo_total_diesel") or 0) for row in registros)
    pago_choferes = sum((row.get("monto_porcentaje_chofer") or 0) for row in registros)
    ganancia_neta = total_recaudado - gasto_diesel - pago_choferes

    maquinas_reportadas = {
        row.get("maquina_id")
        for row in registros
        if row.get("maquina_id") and row.get("maquina_id") in maquinas_con_chofer_ids
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
    )

async def get_today_daily_records() -> DashboardDailyRecords:
    """Lista registros diarios (o faltantes) para todas las máquinas activas del día."""

    hoy = get_today_in_chile()  # Usar fecha de Chile para comparación correcta
    fecha_iso = hoy.isoformat()

    # Máquinas activas
    maquinas_res = (
        supabase.table("maquinas")
        .select("id, numero_interno, patente")
        .eq("estado_operativo", "operativa")
        .execute()
    )

    if getattr(maquinas_res, "error", None):
        raise HTTPException(500, f"Error obteniendo máquinas activas: {maquinas_res.error}")

    maquinas = maquinas_res.data or []

    # Asignaciones vigentes (por máquina)
    asignaciones_res = (
        supabase.table("asignaciones_chofer_maquina")
        .select(
            "maquina_id, chofer_id, fecha_inicio, fecha_termino, "
            "choferes(id, primer_nombre, apellido_paterno, apellido_materno)"
        )
        .lte("fecha_inicio", fecha_iso)
        .or_(f"fecha_termino.is.null,fecha_termino.gte.{fecha_iso}")
        .execute()
    )

    if getattr(asignaciones_res, "error", None):
        raise HTTPException(500, f"Error obteniendo asignaciones activas: {asignaciones_res.error}")

    asignaciones: Dict[int, Dict[str, dict]] = {}
    asignaciones_data = asignaciones_res.data or []
    for row in asignaciones_data:
        maquina_id = row.get("maquina_id")
        if not maquina_id:
            continue

        # Si hay múltiples asignaciones vigentes, usamos la de inicio más reciente
        fecha_inicio_row = row.get("fecha_inicio") or ""
        fecha_inicio_guardada = asignaciones.get(maquina_id, {}).get("fecha_inicio") or ""
        if not fecha_inicio_guardada or fecha_inicio_row >= fecha_inicio_guardada:
            asignaciones[maquina_id] = {
                "fecha_inicio": fecha_inicio_row,
                "chofer": row.get("choferes") or {},
            }

    # Registros diarios de hoy
    registros_res = (
        supabase.table("registros_diarios")
        .select(
            "id, chofer_id, fecha, estado, monto_recaudado, maquina_id,"
            "maquinas(id, numero_interno, patente), "
            "choferes(id, primer_nombre, apellido_paterno, apellido_materno)"
        )
        .eq("fecha", fecha_iso)
        .execute()
    )

    if getattr(registros_res, "error", None):
        raise HTTPException(500, f"Error obteniendo registros diarios de hoy: {registros_res.error}")

    registros_por_maquina = {
        row["maquina_id"]: row
        for row in (registros_res.data or [])
        if row.get("maquina_id")
    }

    items: List[DashboardDailyRecordItem] = []

    for maquina_activa in maquinas:
        maquina_id = maquina_activa.get("id")
        registro = registros_por_maquina.get(maquina_id)
        chofer_registro: Optional[dict] = (registro or {}).get("choferes")
        chofer_asignado_entry: Optional[dict] = asignaciones.get(maquina_id)
        chofer_asignado: Optional[dict] = (chofer_asignado_entry or {}).get("chofer")
        maquina_registro: Optional[dict] = (registro or {}).get("maquinas")

        maquina_info = maquina_registro or maquina_activa
        maquina = (
            DashboardDailyRecordMachine(
                id=maquina_info.get("id"),
                numero_interno=maquina_info.get("numero_interno"),
                patente=maquina_info.get("patente"),
            )
            if maquina_info
            else None
        )
        tiene_registro = registro is not None
        fecha_registro = (registro or {}).get("fecha") or fecha_iso
        estado = (registro or {}).get("estado") or "en_espera"
        monto_recaudado = (registro or {}).get("monto_recaudado")

        chofer_usado = chofer_registro or chofer_asignado
        nombre = (
            " ".join(
                filter(
                    None,
                    [
                        chofer_usado.get("primer_nombre"),
                        chofer_usado.get("apellido_paterno"),
                        chofer_usado.get("apellido_materno"),
                    ],
                )
            )
            if chofer_usado
            else None
        )

        items.append(
            DashboardDailyRecordItem(
                chofer=DashboardDailyRecordDriver(
                    id=(chofer_usado or {}).get("id"),
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
