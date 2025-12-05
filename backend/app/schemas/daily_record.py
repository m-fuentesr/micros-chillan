from pydantic import BaseModel
from typing import Optional
from datetime import date

class DailyRecordCreate(BaseModel):
    maquina_id: int
    fecha: date
    monto_recaudado: int
    litros_diesel: Optional[float] = None
    costo_total_diesel: Optional[int] = None
    imagen_url: str  # Comprobante del registro diario (obligatorio)
    imagen_comprobante_diesel_url: Optional[str] = None  # Comprobante de carga de diesel (opcional)
    observaciones: Optional[str] = None
    incidente_critico: bool = False  # El checkbox (True/False)


class MaquinaInfo(BaseModel):
    numero_interno: int
    marca: str


class DailyRecordResponse(BaseModel):
    id: int
    fecha: date
    monto_recaudado: int
    litros_diesel: Optional[float]
    costo_total_diesel: Optional[float]
    imagen_url: str  # Comprobante del registro diario
    imagen_comprobante_diesel_url: Optional[str] = None  # Comprobante de carga de diesel
    observaciones: Optional[str]
    estado: str
    #Campo calculado
    monto_porcentaje_chofer: int
    #Maquina para la respuesta
    maquinas: Optional[MaquinaInfo] = None

    class Config:
        from_attributes = True


class DailyRecordListDriver(BaseModel):
    id: int
    nombre: str
    

class DailyRecordListMachine(BaseModel):
    id: int
    numero_interno: int


class DailyRecordListItem(BaseModel):
    id: int
    fecha: date
    chofer: DailyRecordListDriver
    maquina: DailyRecordListMachine
    monto_recaudado: int
    diesel: Optional[float] = None # Corresponde al costo_total_diesel
    estado: str


class DailyRecordListFilters(BaseModel):
    maquina_id: Optional[int] = None
    chofer_id: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None
    search: Optional[str] = None
    sort_by: str = "fecha"
    order: str = "desc"