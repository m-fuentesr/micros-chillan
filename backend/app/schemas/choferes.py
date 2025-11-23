from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class ChoferEstado(str):
    ACTIVO = "activo"
    INACTIVO = "inactivo"


class ChoferBase(BaseModel):
    nombre: str
    segundo_nombre: Optional[str] = None
    apellido: str
    segundo_apellido: str
    rut: str
    telefono: str
    porcentaje_pago: float = 0.3
    estado: str = ChoferEstado.ACTIVO  # "activo" | "inactivo"
    fecha_venc_licencia: date


class ChoferCreate(ChoferBase):
    pass


class ChoferUpdate(BaseModel):
    nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    rut: Optional[str] = None
    telefono: Optional[str] = None
    porcentaje_pago: Optional[float] = None
    estado: Optional[str] = None
    fecha_venc_licencia: Optional[date] = None


class ChoferInDB(ChoferBase):
    id: int
    created_at: datetime
    updated_at: datetime
