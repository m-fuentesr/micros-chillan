from pydantic import BaseModel, Field


class UpdateSettingsRequest(BaseModel):
    """
    Permite actualizar uno o más campos de configuración general.
    Por ahora porcentaje_default y sueldo_minimo; se extenderá con alertas.
    """

    porcentaje_default: float | None = Field(
        None, ge=0, le=1, description="Valor porcentual en formato decimal (0 a 1)"
    )
    sueldo_minimo: int | None = Field(
        None, ge=0, description="Sueldo mínimo mensual garantizado"
    )
    dias_alerta_licencia_por_vencer: int | None = Field(
        None, ge=0, description="Días previos al vencimiento para alertar licencias de chofer"
    )
    dias_alerta_documento_por_vencer: int | None = Field(
        None, ge=0, description="Días previos al vencimiento para alertar documentos de máquinas"
    )


class UpdateSettingsResponse(BaseModel):
    """
    Devuelve el estado previo y nuevo de los campos actualizados,
    y métricas adicionales cuando corresponda.
    """

    porcentaje_anterior: float | None = None
    porcentaje_nuevo: float | None = None
    choferes_actualizados: int | None = None
    sueldo_minimo_anterior: int | None = None
    sueldo_minimo_nuevo: int | None = None
    dias_alerta_licencia_anterior: int | None = None
    dias_alerta_licencia_nuevo: int | None = None
    dias_alerta_documento_anterior: int | None = None
    dias_alerta_documento_nuevo: int | None = None