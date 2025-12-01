from pydantic import BaseModel
from typing import Optional
from datetime import date

class DailyRecordCreate(BaseModel):
    maquina_id: int
    fecha: date
    monto_recaudado: int
    litros_diesel: Optional[float] = None
    costo_total_diesel: Optional[int] = None
    imagen_url: str
    observaciones: Optional[str] = None
    incidente_critico: bool = False  # El checkbox (True/False)
