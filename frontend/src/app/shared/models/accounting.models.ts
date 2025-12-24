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
  total_pago_choferes: number;
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
  total_ganado: number; // Suma de reportes diarios de la semana (RF-022)
  acumulado_mensual?: number; // Acumulado mensual (solo en última semana)
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
  semana: number; // Número de semana (1-5)
  mes: number;
  anio: number;
  fecha_inicio: string; // Fecha inicio de semana
  fecha_fin: string; // Fecha fin de semana
  es_ultima_semana: boolean; // Indica si es la última semana del mes
  estado: 'abierto' | 'cerrado';
  choferes: LiquidationDriver[];
}

export interface ClosedLiquidationWeek {
  semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  es_ultima_semana: boolean;
  total_pagado: number; // Total de esa semana
  choferes: LiquidationDriver[]; // Choferes de esa semana específica
}

export interface ClosedLiquidation {
  id: number;
  periodo: string; // "Octubre 2025"
  mes: number;
  anio: number;
  fecha_cierre: string;
  total_pagado: number; // Suma de todas las semanas
  cerrado_por: string;
  semanas: ClosedLiquidationWeek[]; // Array de semanas del mes
  choferes?: LiquidationDriver[]; // DEPRECATED: mantener para compatibilidad, usar semanas[].choferes
}

export type AccountingTab = 'summary' | 'weekly' | 'payroll' | 'history';

