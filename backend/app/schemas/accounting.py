from pydantic import BaseModel
from typing import List

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