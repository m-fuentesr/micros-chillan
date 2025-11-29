from pydantic import BaseModel
from typing import Optional
from datetime import date

class DailyRecordCreate(BaseModel):
    maquina_id: int
    fecha: date
    monto_recaudado: int
    litros_diesel: float
    costo_total_diesel: int
    imagen_url: Optional[str] = None
    observaciones: Optional[str] = None
    incidente_critico: bool = False  # El checkbox (True/False)
