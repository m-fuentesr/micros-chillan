from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from app.core.pagination import PaginationParams

# ==========================================
# 1. GESTIÓN DE PAGOS SEMANALES (Confirmación y Listado)
# ==========================================

# Input: Lo que envía el Admin al confirmar un pago (POST)
class WeeklyPaymentConfirmRequest(BaseModel):
    # Datos de la transacción
    metodo_pago: str
    fecha_pago: date
    codigo_transferencia: Optional[str] = None
    observaciones: Optional[str] = None
    
    # Lógica de Garantía (Relevante en última semana)
    es_ultima_semana: bool = False
    aplicar_garantia: bool = False  # El Toggle del Frontend
    
    # Montos confirmados
    monto_base_semana: int      # Lo que produjo esta semana
    monto_bono_final: int       # El bono de ajuste (0 si toggle apagado o semana normal)
    total_a_pagar: int          # El monto final que sale de caja

# Output: Lo que recibe el Frontend para la tabla de pagos (GET)
class WeeklyPaymentResponse(BaseModel):
    chofer_id: int
    nombre_chofer: str
    
    # Contexto
    mes: int
    anio: int
    semana: int
    es_ultima_semana: bool
    
    # Finanzas
    base_ganado: int            # Producción de ESTA semana
    acumulado_mes_anterior: int # Suma de semanas anteriores (solo informativo)
    
    # Garantía
    sueldo_minimo_mensual: int
    ajuste_garantizado_calculado: int # La sugerencia del sistema
    
    total_a_pagar: int          # Lo que recibirá el chofer
    
    # Estado
    estado_pago: str            # 'pendiente' / 'pagado'
    id_pago: Optional[int] = None
    
    # Información del pago (solo si está pagado)
    metodo_pago: Optional[str] = None
    codigo_transferencia: Optional[str] = None
    fecha_pago: Optional[date] = None

# Output: Respuesta simple al confirmar (Response)
class PaymentConfirmResponse(BaseModel):
    message: str
    pago_id: int
    estado: str

# ==========================================
# 2. HISTORIAL DE CIERRES (Jerárquico: Mes -> Semanas)
# ==========================================

# Filtros para historial de períodos
class HistoryPeriodFilters(PaginationParams):
    mes_desde: Optional[int] = Field(None, ge=1, le=12, description="Mes inicial del filtro")
    mes_hasta: Optional[int] = Field(None, ge=1, le=12, description="Mes final del filtro")

# A. Resumen del Mes (La fila principal del historial)
class HistoryPeriodSummary(BaseModel):
    periodo_texto: str  # Ej: "Octubre 2025"
    mes: int
    anio: int
    total_pagado_mes: int
    fecha_cierre: date
    estado: str         # "Finalizado"

# --- Estructuras internas para el detalle ---

# Detalle de un pago individual
class PaymentRefDetail(BaseModel):
    chofer_id: int
    nombre_chofer: str
    base: int
    ajuste: int
    total: int
    metodo: str
    ref: Optional[str] = None

# Grupo Semanal (Contenedor)
class WeekGroup(BaseModel):
    numero_semana: int
    rango_fechas_texto: str # Ej: "Semana 1"
    total_semana: int
    pagos: List[PaymentRefDetail]

# B. Respuesta Completa del Detalle Mensual (El reporte final)
class HistoryMonthDetailResponse(BaseModel):
    total_liquidado: int
    cantidad_choferes: int
    promedio: int
    estado: str
    desglose_semanas: List[WeekGroup]