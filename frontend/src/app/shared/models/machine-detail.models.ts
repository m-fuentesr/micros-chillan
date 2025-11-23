// Modelos para el detalle de máquina

export interface MachineDailyRecord {
  id: number;
  fecha: string;
  chofer: string;
  chofer_id: number;
  recaudado: number;
  diesel: number;
  observaciones?: string | null;
  estado: 'PENDIENTE_TRABAJADOR' | 'INCIDENTE_REPORTADO' | 'COMPLETO' | 'NO_TRABAJADO' | 'DIA_NO_TRABAJADO';
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

