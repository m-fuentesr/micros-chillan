from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class DashboardFleetKpi(BaseModel):
    activas: int = Field(..., description="Máquinas operativas en el día")
    reportes_recibidos: int = Field(..., description="Cantidad de reportes diarios recibidos hoy")
    reportes_totales: int = Field(..., description="Cantidad de reportes esperados (máquinas activas)")
    reportes_pendientes: int = Field(..., description="Cantidad de reportes diarios pendientes del día")


class DashboardKpis(BaseModel):
    recaudacion_total: float = Field(..., description="Total recaudado del día")
    ganancia_neta: float = Field(..., description="Recaudación menos gasto de combustible")
    flota_en_ruta: DashboardFleetKpi


class DashboardMachinePerformance(BaseModel):
    maquina_id: int
    numero_interno: Optional[int]
    patente: Optional[str]
    chofer: Optional[str]
    monto_recaudado: float
    costo_total_diesel: float
    ganancia_neta: float
    estado: Optional[str]


class DashboardAlertSummary(BaseModel):
    criticas: int
    advertencias: int
    informativas: int


class DashboardAlertItem(BaseModel):
    id: int
    mensaje: str
    severidad: str
    tipo: str
    origen_tipo: str
    origen_id: int
    estado: str
    created_at: datetime


class DashboardAlerts(BaseModel):
    resumen: DashboardAlertSummary
    items: List[DashboardAlertItem]


class DashboardResponse(BaseModel):
    fecha: date
    kpis: DashboardKpis
    rendimiento: List[DashboardMachinePerformance]
    alertas: DashboardAlerts
