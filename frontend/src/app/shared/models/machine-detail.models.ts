// Modelos para el detalle de máquina
// MachineDailyRecord es compatible con DailyRecord del modelo unificado
// Ver: src/app/shared/models/daily-record.models.ts

import type { DailyRecord, DailyRecordStatus } from './daily-record.models';

/**
 * Registro diario visto desde el contexto de una máquina
 * Compatible con DailyRecord unificado
 */
export interface MachineDailyRecord {
  id: number;
  fecha: string;
  chofer: string; // Alias de chofer_nombre para compatibilidad
  chofer_id: number;
  recaudado: number;
  diesel: number; // Alias de costo_diesel para compatibilidad
  observaciones?: string | null;
  estado: DailyRecordStatus;
}

export interface MachineAssignment {
  id: number;
  chofer: {
    id: number;
    nombre_completo: string;
  };
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_dias: number;
  estado: 'activa' | 'cerrada';
}

export interface MachineDailyRecordFilters {
  chofer_id?: number | null;
  desde?: string | null;
  hasta?: string | null;
  orden?: 'mas_reciente' | 'mas_antiguo';
}

export interface MaintenanceRecord {
  id: number;
  maquina_id: number;
  item: string;
  costo: number;
  numero_factura: string;
  categoria: 'preventivo' | 'correctivo' | null;
  fecha: string; // YYYY-MM-DD
}

export interface MaintenanceFilters {
  item?: string;
  categoria?: 'all' | 'preventivo' | 'correctivo';
  desde?: string;
  hasta?: string;
}

