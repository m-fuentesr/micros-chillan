from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class RegistroEstado(str):
    COMPLETO = "completo"
    FALTANTE = "faltante"
    INCIDENTE_REPORTADO = "incidente_reportado"
    NO_TRABAJADO = "no_trabajado"


class MotivoNoTrabajado(str):
    DESCANSO_SEMANAL = "descanso_semanal"
    VACACIONES = "vacaciones"
    LICENCIA_MEDICA = "licencia_medica"
    PERMISO_PERSONAL = "permiso_personal"
    MAQUINA_EN_MANTENIMIENTO = "maquina_en_mantenimiento"
    SIN_ASIGNACION_RUTA = "sin_asignacion_ruta"
    OTRO = "otro"


class RegistroDiarioBase(BaseModel):
    maquina_id: int
    chofer_id: int
    fecha: date
    monto_recaudado: Optional[float] = None
    litros_diesel: Optional[float] = None
    costo_total_diesel: Optional[float] = None
    porcentaje_aplicado: float
    monto_porcentaje_chofer: float
    imagen_url: Optional[str] = None
    imagen_updated_at: Optional[datetime] = None
    estado: str  # valores de RegistroEstado
    es_dia_no_trabajado: bool = False
    motivo_no_trabajado: Optional[str] = None  # valores de MotivoNoTrabajado
    motivo_no_trabajado_otro: Optional[str] = None
    observaciones: Optional[str] = None


class RegistroDiarioCreate(RegistroDiarioBase):
    pass


class RegistroDiarioUpdate(BaseModel):
    maquina_id: Optional[int] = None
    chofer_id: Optional[int] = None
    fecha: Optional[date] = None
    monto_recaudado: Optional[float] = None
    litros_diesel: Optional[float] = None
    costo_total_diesel: Optional[float] = None
    porcentaje_aplicado: Optional[float] = None
    monto_porcentaje_chofer: Optional[float] = None
    imagen_url: Optional[str] = None
    imagen_updated_at: Optional[datetime] = None
    estado: Optional[str] = None
    es_dia_no_trabajado: Optional[bool] = None
    motivo_no_trabajado: Optional[str] = None
    motivo_no_trabajado_otro: Optional[str] = None
    observaciones: Optional[str] = None


class RegistroDiarioInDB(RegistroDiarioBase):
    id: int
    created_at: datetime
    updated_at: datetime
