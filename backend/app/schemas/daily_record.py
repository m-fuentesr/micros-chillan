from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

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


class DailyRecordCreateAdmin(BaseModel):
    chofer_id: int
    maquina_id: int
    fecha: date

    # Estado operativo
    es_dia_no_trabajado: bool
    motivo_no_trabajado: Optional[str] = None
    motivo_no_trabajado_otro: Optional[str] = None

    # Financieros (solo si trabajado)
    monto_recaudado: Optional[int] = None
    litros_diesel: Optional[float] = None
    costo_total_diesel: Optional[int] = None

    # Evidencia
    imagen_url: Optional[str] = None
    imagen_comprobante_diesel_url: Optional[str] = None

    observaciones: Optional[str] = None
    incidente_critico: bool = False


class MaquinaInfo(BaseModel):
    numero_interno: int
    marca: str


class DailyRecordResponse(BaseModel):
    id: int
    fecha: date
    monto_recaudado: int
    litros_diesel: Optional[float]
    costo_total_diesel: Optional[float]
    imagen_url: Optional[str] = None # Comprobante del registro diario
    imagen_comprobante_diesel_url: Optional[str] = None  # Comprobante de carga de diesel
    observaciones: Optional[str]
    estado: str
    #Campo calculado
    monto_porcentaje_chofer: int
    #Maquina para la respuesta
    maquinas: Optional[MaquinaInfo] = None

    class Config:
        from_attributes = True

    
class DailyRecordSummary(BaseModel):
    recaudacion_periodo: int
    registros_faltantes: int
    registros_incidentes: int


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
    pago_chofer: int
    neto: int                      # monto_recaudado - costo_total_diesel - pago_chofer
    estado: str
    tiene_observaciones: bool = False


class DailyRecordListFilters(BaseModel):
    maquina_id: Optional[int] = None
    chofer_id: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None
    sort_by: str = "fecha"
    order: str = "desc"
    page: int = 1
    per_page: int = 10


class DailyRecordDetailResponse(BaseModel):
    id: int
    fecha: date
    estado: str

    maquina: dict
    chofer: dict
    datos_financieros: dict
    estado_operativo: dict

    observaciones: Optional[str]
    incidente_critico: bool
    imagenes: dict


class DailyRecordPreviewPaymentRequest(BaseModel):
    chofer_id: int
    monto_recaudado_propuesto: int


class DailyRecordPreviewPaymentResponse(BaseModel):
    porcentaje_aplicado: float
    pago_calculado: int


class DailyRecordUpdate(BaseModel):
    monto_recaudado: Optional[int] = None
    litros_diesel: Optional[float] = None
    costo_total_diesel: Optional[int] = None
    observaciones: Optional[str] = None

    # Lógica de excepción
    es_dia_no_trabajado: bool
    motivo_no_trabajado: Optional[str] = None
    motivo_no_trabajado_otro: Optional[str] = None

    incidente_critico: bool = False
    
    # Campos de imágenes para actualización
    imagen_url: Optional[str] = None  # Comprobante del registro diario
    imagen_comprobante_diesel_url: Optional[str] = None  # Comprobante de carga de diesel


class DailyRecordAuditDetail(BaseModel):
    campo: str
    valor_anterior: str
    valor_nuevo: str


class DailyRecordAuditItem(BaseModel):
    id: int
    fecha_cambio: datetime
    usuario_responsable: str
    tipo_cambio: str
    detalles: List[DailyRecordAuditDetail]

    