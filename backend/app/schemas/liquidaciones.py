from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MetodoPago(str):
    TRANSFERENCIA = "transferencia"
    EFECTIVO = "efectivo"


class EstadoPago(str):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"


class LiquidacionBase(BaseModel):
    chofer_id: int
    mes: int
    anio: int
    sueldo_minimo: float
    porcentaje_ganado: float
    monto_faltante: float
    total_final: float
    metodo_pago: Optional[str] = None  # MetodoPago
    codigo_transferencia: Optional[str] = None
    fecha_pago: Optional[datetime] = None
    estado_pago: str = EstadoPago.PENDIENTE


class LiquidacionCreate(LiquidacionBase):
    pass


class LiquidacionUpdate(BaseModel):
    sueldo_minimo: Optional[float] = None
    porcentaje_ganado: Optional[float] = None
    monto_faltante: Optional[float] = None
    total_final: Optional[float] = None
    metodo_pago: Optional[str] = None
    codigo_transferencia: Optional[str] = None
    fecha_pago: Optional[datetime] = None
    estado_pago: Optional[str] = None


class LiquidacionInDB(LiquidacionBase):
    id: int
    created_at: datetime
    updated_at: datetime
