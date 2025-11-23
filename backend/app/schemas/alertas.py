from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TipoAlerta(str):
    INCIDENTE_CRITICO = "incidente_critico"
    REGISTRO_FALTANTE = "registro_faltante"
    DOC_VENCIDA = "doc_vencida"
    DOC_POR_VENCER = "doc_por_vencer"
    LICENCIA_VENCIDA = "licencia_vencida"
    LICENCIA_POR_VENCER = "licencia_por_vencer"


class SeveridadAlerta(str):
    CRITICA = "critica"
    ADVERTENCIA = "advertencia"
    INFORMATIVA = "informativa"


class OrigenTipo(str):
    MAQUINA = "maquina"
    CHOFER = "chofer"
    REGISTRO_DIARIO = "registro_diario"


class EstadoAlerta(str):
    ACTIVA = "activa"
    RESUELTA = "resuelta"


class AlertaBase(BaseModel):
    tipo: str  # TipoAlerta
    severidad: str  # SeveridadAlerta
    mensaje: str
    origen_tipo: str  # OrigenTipo
    origen_id: int
    fecha_generada: datetime
    estado: str = EstadoAlerta.ACTIVA
    fecha_resuelta: Optional[datetime] = None
    resuelta_por: Optional[int] = None


class AlertaCreate(AlertaBase):
    pass


class AlertaUpdate(BaseModel):
    tipo: Optional[str] = None
    severidad: Optional[str] = None
    mensaje: Optional[str] = None
    origen_tipo: Optional[str] = None
    origen_id: Optional[int] = None
    fecha_generada: Optional[datetime] = None
    estado: Optional[str] = None
    fecha_resuelta: Optional[datetime] = None
    resuelta_por: Optional[int] = None


class AlertaInDB(AlertaBase):
    id: int
    created_at: datetime
    updated_at: datetime
