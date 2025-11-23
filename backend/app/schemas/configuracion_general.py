from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConfiguracionGeneralBase(BaseModel):
    sueldo_minimo: float = 750000
    porcentaje_default: float = 0.3
    alerta_vencimiento_dias: int = 30


class ConfiguracionGeneralCreate(ConfiguracionGeneralBase):
    pass


class ConfiguracionGeneralUpdate(BaseModel):
    sueldo_minimo: Optional[float] = None
    porcentaje_default: Optional[float] = None
    alerta_vencimiento_dias: Optional[int] = None


class ConfiguracionGeneralInDB(ConfiguracionGeneralBase):
    id: int
    created_at: datetime
    updated_at: datetime
