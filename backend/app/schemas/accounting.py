from pydantic import BaseModel

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