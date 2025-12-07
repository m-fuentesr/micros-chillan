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
#Schemas para ver el total pendientes y nomina
class PeriodoInfo(BaseModel):
    mes: int
    anio: int

class SettlementsSummaryResponse(BaseModel):
    periodo: PeriodoInfo
    count_pendientes: int      
    total_nomina_pendiente: int 
#Resumen del Periodo
class HistoryPeriodSummary(BaseModel):
    periodo_texto: str
    mes: int
    anio: int
    total_pagado_mes: int
    fecha_cierre: date
    estado: str
#Detalle de choferes ese mes
class HistoryMonthDetail(BaseModel):
    chofer_id: int
    nombre_completo: str
    rut: Optional[str] = None
    fecha_pago: date
    total_pagado: int
    metodo_pago: Optional[str] = None
    codigo_transferencia: Optional[str] = None
