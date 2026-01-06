from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.settings import GeneralSettingsResponse, UpdateSettingsRequest, UpdateSettingsResponse


async def get_settings() -> GeneralSettingsResponse:
    """Obtiene la configuración general actual."""
    cfg_res = (
        supabase.table("configuracion_general")
        .select(
            "id, porcentaje_default, sueldo_minimo, "
            "dias_alerta_licencia_por_vencer, dias_alerta_documento_por_vencer"
        )
        .single()
        .execute()
    )

    if getattr(cfg_res, "error", None):
        raise HTTPException(
            status_code=400,
            detail=f"Error obteniendo configuración: {cfg_res.error}",
        )

    data = cfg_res.data or {}
    return GeneralSettingsResponse(
        porcentaje_default=data.get("porcentaje_default"),
        sueldo_minimo=data.get("sueldo_minimo"),
        dias_alerta_licencia_por_vencer=data.get("dias_alerta_licencia_por_vencer"),
        dias_alerta_documento_por_vencer=data.get("dias_alerta_documento_por_vencer"),
    )


async def update_settings(payload: UpdateSettingsRequest) -> UpdateSettingsResponse:
    """
    Actualiza configuracion_general con los campos provistos y
    ejecuta lógicas asociadas (ej: propagar porcentaje_default a choferes).
    No toca registros diarios ni pagos históricos.
    """
    updates: dict[str, float | int] = {}
    propagate_percentage = False

    # 1) Leer configuración actual
    cfg_res = (
        supabase.table("configuracion_general")
        .select(
            "id, porcentaje_default, sueldo_minimo, "
            "dias_alerta_licencia_por_vencer, dias_alerta_documento_por_vencer"
        )
        .single()
        .execute()
    )

    if getattr(cfg_res, "error", None):
        raise HTTPException(
            status_code=400,
            detail=f"Error obteniendo configuración: {cfg_res.error}",
        )

    cfg = cfg_res.data or {}
    cfg_id = cfg.get("id")
    if cfg_id is None:
        raise HTTPException(
            status_code=400,
            detail="Configuración general no encontrada (sin ID).",
        )

    porcentaje_anterior = cfg.get("porcentaje_default")
    porcentaje_nuevo = porcentaje_anterior
    sueldo_minimo_anterior = cfg.get("sueldo_minimo")
    sueldo_minimo_nuevo = sueldo_minimo_anterior
    dias_alerta_licencia_anterior = cfg.get("dias_alerta_licencia_por_vencer")
    dias_alerta_licencia_nuevo = dias_alerta_licencia_anterior
    dias_alerta_documento_anterior = cfg.get("dias_alerta_documento_por_vencer")
    dias_alerta_documento_nuevo = dias_alerta_documento_anterior

    # 2) Preparar actualizaciones permitidas
    if payload.porcentaje_default is not None:
        porcentaje_nuevo = payload.porcentaje_default
        updates["porcentaje_default"] = porcentaje_nuevo
        propagate_percentage = True

    if payload.sueldo_minimo is not None:
        sueldo_minimo_nuevo = payload.sueldo_minimo
        updates["sueldo_minimo"] = sueldo_minimo_nuevo

    if payload.dias_alerta_licencia_por_vencer is not None:
        dias_alerta_licencia_nuevo = payload.dias_alerta_licencia_por_vencer
        updates["dias_alerta_licencia_por_vencer"] = dias_alerta_licencia_nuevo

    if payload.dias_alerta_documento_por_vencer is not None:
        dias_alerta_documento_nuevo = payload.dias_alerta_documento_por_vencer
        updates["dias_alerta_documento_por_vencer"] = dias_alerta_documento_nuevo

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No hay campos válidos para actualizar.",
        )

    # 3) Actualizar configuracion_general
    upd_cfg = (
        supabase.table("configuracion_general")
        .update(updates)
        .eq("id", cfg_id)
        .execute()
    )
    if getattr(upd_cfg, "error", None):
        raise HTTPException(
            status_code=400,
            detail=f"Error actualizando configuración: {upd_cfg.error}",
        )

    choferes_actualizados = None

    # 4) Propagar porcentaje_default si corresponde
    if propagate_percentage:
        # Contar choferes (activos, inactivos y eliminados)
        count_res = supabase.table("choferes").select("id", count="exact").execute()
        if getattr(count_res, "error", None):
            raise HTTPException(
                status_code=400, detail=f"Error contando choferes: {count_res.error}"
            )
        choferes_actualizados = count_res.count or 0

        # "Smart Update": Solo actualizar choferes que tengan el porcentaje anterior (estaban "sincronizados")
        # Esto preserva a los choferes con porcentajes personalizados.
        upd_drivers = (
            supabase.table("choferes")
            .update({"porcentaje_pago": porcentaje_nuevo})
            .eq("porcentaje_pago", porcentaje_anterior)  # Solo los que coinciden con el viejo default
            .neq("id", 0)
            .execute()
        )

        if getattr(upd_drivers, "error", None):
            # Intentar revertir la configuración para mantener consistencia
            supabase.table("configuracion_general").update(
                {"porcentaje_default": porcentaje_anterior}
            ).eq("id", cfg_id).execute()

            raise HTTPException(
                status_code=400,
                detail=f"Error actualizando porcentajes de choferes: {upd_drivers.error}",
            )
        
        # Actualizar el contador con los realmente modificados (smart update)
        # Nota: count=exact en update no siempre funciona igual en todas las versiones, 
        # pero la respuesta suele incluir 'data' con las filas afectadas si se solicita.
        # Para ser precisos, podríamos confiar en que el usuario vea el número en la UI antes de confirmar.
        # Pero si upd_drivers.data existe, es la lista de actualizados.
        if upd_drivers.data:
            choferes_actualizados = len(upd_drivers.data)
        else:
             # Fallback si no devuelve data
            choferes_actualizados = 0

    return UpdateSettingsResponse(
        porcentaje_anterior=porcentaje_anterior if propagate_percentage else None,
        porcentaje_nuevo=porcentaje_nuevo if propagate_percentage else None,
        choferes_actualizados=choferes_actualizados,
        sueldo_minimo_anterior=(
            sueldo_minimo_anterior if payload.sueldo_minimo is not None else None
        ),
        sueldo_minimo_nuevo=(
            sueldo_minimo_nuevo if payload.sueldo_minimo is not None else None
        ),
        dias_alerta_licencia_anterior=(
            dias_alerta_licencia_anterior
            if payload.dias_alerta_licencia_por_vencer is not None
            else None
        ),
        dias_alerta_licencia_nuevo=(
            dias_alerta_licencia_nuevo
            if payload.dias_alerta_licencia_por_vencer is not None
            else None
        ),
        dias_alerta_documento_anterior=(
            dias_alerta_documento_anterior
            if payload.dias_alerta_documento_por_vencer is not None
            else None
        ),
        dias_alerta_documento_nuevo=(
            dias_alerta_documento_nuevo
            if payload.dias_alerta_documento_por_vencer is not None
            else None
        ),
    )