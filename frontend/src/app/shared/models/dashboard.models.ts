// Modelos para el Dashboard

export interface Alert {
  id: string;
  type: 'operational' | 'incident' | 'document';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  machineId?: string;
  driverName?: string;
  date?: string;
  actionLabel: string;
  actionHref: string;
  resolved?: boolean;
  resolvedAt?: string; // ISO date string
}

export interface AlertCounts {
  critical: number;
  warning: number;
  info: number;
}

export interface FinancialData {
  machineId: string;
  driver: string;
  value: number;
}

export interface DailyRecord {
  machineId: string;
  driver: string;
  date: string;
  status: 'PENDIENTE_TRABAJADOR' | 'INCIDENTE_REPORTADO' | 'COMPLETO' | 'NO_TRABAJADO' | 'DIA_NO_TRABAJADO';
  recaudacion?: number;
  motivo?: string;
}

export interface FinancialSummary {
  periodo: {
    mes: number;
    anio: number;
  };
  totales: {
    total_recaudado: number;
    total_costo_diesel: number;
    total_pago_choferes: number;
    ganancia_liquida: number;
  };
}

export type FinancialMetric = 'Ganancia Neta' | 'Ingreso Total';

