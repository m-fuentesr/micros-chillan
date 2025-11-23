from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CierreMensualBase(BaseModel):
    mes: int
    anio: int
    fecha_cierre: datetime
    total_pagado: float
    cerrado_por: int  # FK → usuarios.id


class CierreMensualCreate(CierreMensualBase):
    pass


class CierreMensualUpdate(BaseModel):
    fecha_cierre: Optional[datetime] = None
    total_pagado: Optional[float] = None
    cerrado_por: Optional[int] = None


class CierreMensualInDB(CierreMensualBase):
    id: int
    created_at: datetime
    updated_at: datetime
