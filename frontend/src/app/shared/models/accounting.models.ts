// Modelos para Contabilidad

export interface AccountingSummary {
  periodo: {
    mes: number;
    anio: number;
  };
  totales: {
    total_recaudado: number;
    total_costo_diesel: number;
    total_pago_choferes: number;
    total_gastos_mantenimiento: number; // Cambiado de gastos_repuestos según especificaciones
    ganancia_liquida: number;
  };
  es_mes_actual: boolean;
}

export interface DailyProfitabilityData {
  fecha: string; // YYYY-MM-DD
  ingresos: number;
  egresos: number;
  ganancia: number;
}

export interface WeeklySummary {
  semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  total_recaudado: number;
  gasto_diesel: number;
  gasto_mantenimiento: number;
  total_egresos: number;
  ganancia_neta: number;
  choferes: WeeklyDriverBreakdown[];
}

export interface WeeklyDriverBreakdown {
  chofer_id: number;
  chofer_nombre: string;
  maquina: string;
  dias_trabajados: number;
  recaudado: number;
  diesel: number;
  mantenimiento: number;
  pago_chofer: number;
  ganancia_neta: number;
}

export interface LiquidationDriver {
  chofer_id: number;
  chofer_nombre: string;
  total_ganado: number; // Suma de reportes diarios del mes (RF-022)
  minimo_garantizado: number; // RF-023
  monto_a_completar: number; // RF-024
  pago_final: number; // RF-025
  aplicar_garantizado: boolean; // Indica si se aplica el mínimo garantizado
  estado_pago: 'pendiente' | 'confirmado' | 'pagado';
  metodo_pago?: 'transferencia' | 'efectivo' | null;
  codigo_transferencia?: string | null;
  fecha_pago?: string | null;
}

export interface LiquidationPeriod {
  mes: number;
  anio: number;
  estado: 'abierto' | 'cerrado';
  choferes: LiquidationDriver[];
}

export interface ClosedLiquidation {
  id: number;
  periodo: string; // "Octubre 2025"
  mes: number;
  anio: number;
  fecha_cierre: string;
  total_pagado: number;
  cerrado_por: string;
  choferes: LiquidationDriver[];
}

export type AccountingTab = 'summary' | 'weekly' | 'payroll' | 'history';

