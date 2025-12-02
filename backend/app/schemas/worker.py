from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import date


class WorkerProfileResponse(BaseModel):
    # Cabecera
    nombre_completo: str
    
    # Información Personal
    rut: str
    telefono: str
    email: str
    
    # Información Laboral
    maquina_detalle: Optional[str] # Ej: "MÁQUINA 01 - Mercedes Benz"
    fecha_ingreso: str             # Ej: "20-11-2024"