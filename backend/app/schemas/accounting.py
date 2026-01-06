from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class PeriodoInfo(BaseModel):
    mes: int
    anio: int

class TotalesSummary(BaseModel):
    total_recaudado: int
    total_costo_diesel: int
    total_gastos_mantenimiento: int
    total_pago_choferes: int
    ganancia_liquida: int

class AccountingSummaryResponse(BaseModel):
    periodo: PeriodoInfo
    totales: TotalesSummary
    es_mes_actual: bool

class WeekSummary(BaseModel):
    numero_semana: int
    rango_fechas_texto: str
    total_recaudado: int
    total_diesel: int
    total_mantenimiento: int
    total_pago_choferes: int
    ganancia_liquida: int

class DriverWeekDetail(BaseModel):
    chofer_id: int
    nombre_chofer: str
    dias_trabajados: int
    total_recaudado: int
    costo_diesel: int
    gastos_mantenimiento: int
    total_ganado_chofer: int

class DailyProfitabilityData(BaseModel):
    fecha: str  # YYYY-MM-DD
    ingresos: int
    egresos: int
    ganancia: int

class MovementCreate(BaseModel):
    chofer_id: int
    tipo: str  # "CARGO" o "ABONO"
    monto: int
    descripcion: str
    fecha_movimiento: Optional[date] = None

class MovementResponse(BaseModel):
    id: int
    tipo: str
    monto: int
    descripcion: str
    fecha_movimiento: date
    created_at: str

class LedgerSummary(BaseModel):
    chofer_id: int
    nombre_completo: str
    saldo_actual: int
    estado_cuenta: str  # "DEUDOR", "AL_DIA", "A_FAVOR"
    ultimo_movimiento: Optional[str] = None # Fecha en string