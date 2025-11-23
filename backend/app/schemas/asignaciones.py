from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class AsignacionBase(BaseModel):
    maquina_id: int
    chofer_id: int
    fecha_inicio: date
    fecha_termino: Optional[date] = None


class AsignacionCreate(AsignacionBase):
    pass


class AsignacionUpdate(BaseModel):
    maquina_id: Optional[int] = None
    chofer_id: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_termino: Optional[date] = None


class AsignacionInDB(AsignacionBase):
    id: int
    created_at: datetime
    updated_at: datetime
