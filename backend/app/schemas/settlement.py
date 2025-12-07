from pydantic import BaseModel
from typing import Optional
from datetime import date

#Confirmar pago
class PaymentConfirmRequest(BaseModel):
    metodo_pago: str
    fecha_pago: date
    monto_final_pagado: int
    codigo_transferencia: Optional[str] = None
#Tabla/lista
class SettlementResponse(BaseModel):
    chofer_id: int
    nombre_chofer: str
    mes: int
    anio: int
    porcentaje_ganado: int
    sueldo_minimo: int
    monto_faltante: int
    total_final: int

    estado_pago: str
    id_liquidacion: Optional[int] = None
#Confirmacion Simple
class PaymentConfirmResponse(BaseModel):
    message: str
    liquidacion_id: int
    estado_pago: str