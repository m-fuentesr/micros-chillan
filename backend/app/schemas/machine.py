from typing import Literal, Optional
from pydantic import BaseModel, Field
from datetime import date


class MachineSelect(BaseModel):
    id: int
    numero_interno: str
    marca: str
    modelo: str         
    anio: int           
    patente: str
    display_name: str  # Campo extra útil para mostrar "105 - Volvo" en el dropdown