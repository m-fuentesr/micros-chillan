from pydantic import BaseModel
from typing import  Optional


class WorkerProfileResponse(BaseModel):
    # Cabecera
    nombre_completo: str
    
    # Información Personal
    rut: str
    telefono: str
    email: str
    
    # Información Laboral
    maquina_detalle: Optional[str] # Ej: "MÁQUINA 01 - Mercedes Benz"
    maquina_id: Optional[int] = None      # ID de la máquina asignada vigente
    maquina_numero: Optional[int] = None  # numero_interno de la máquina asignada vigente
    fecha_ingreso: str             # Ej: "20-11-2024"
class PeriodoInfo(BaseModel):
    mes: int
    anio: int

class StatsData(BaseModel):
    dias_trabajados: int
    total_recaudado: int

class WorkerStatsResponse(BaseModel):
    periodo: PeriodoInfo
    estadisticas: StatsData