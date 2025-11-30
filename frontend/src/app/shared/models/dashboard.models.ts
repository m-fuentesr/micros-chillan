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

// Re-exportar DailyRecord del modelo unificado
// Para compatibilidad con código existente, mantenemos un tipo simplificado
import type { DailyRecord as UnifiedDailyRecord, DailyRecordStatus } from './daily-record.models';

/**
 * Tipo simplificado de DailyRecord para uso en Dashboard
 * Compatible con el modelo unificado
 */
export interface DailyRecord {
  id: string; // ID del registro para navegación
  machineId: string; // Alias de maquina_identificador o derivado de maquina_id
  driver: string; // Alias de chofer_nombre
  date: string; // Alias de fecha
  status: DailyRecordStatus;
  recaudacion?: number; // Alias de recaudado
  motivo?: string; // Alias de motivo_inactividad
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

