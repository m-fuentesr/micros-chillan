// Modelos para Choferes

export interface Driver {
  id: number;
  nombre_completo: string;
  rut: string;
  telefono: string;
  correo: string;
  porcentaje_pago: number;
  fecha_venc_licencia: string;
  alerta_licencia: boolean;
  estado: 'activo' | 'inactivo';
  maquina_actual?: {
    id: number;
    identificador: string;
  } | null;
  // Campos adicionales para detalle
  nombre?: string;
  segundo_nombre?: string;
  apellido?: string;
  segundo_apellido?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverKPIs {
  activos: number;
  inactivos: number;
  con_maquina: number;
  licencias_por_vencer: number;
}

export interface DriverLicenseStatus {
  fecha: string | null;
  estado: 'ok' | 'warning' | 'error';
  dias_restantes?: number;
  texto: string;
}

export interface DriverDailyRecord {
  id: number;
  fecha: string;
  estado: 'completo' | 'pendiente_trabajador' | 'incidente_reportado' | 'no_trabajado';
  recaudado: number;
  diesel: number;
  observaciones?: string | null;
}

export interface DriverLiquidation {
  id: number;
  fecha: string; // mes/anio
  total_ganado: number;
  minimo_garantizado: number;
  pago_final: number;
  metodo_pago?: 'transferencia' | 'efectivo' | null;
  codigo_transferencia?: string | null;
  estado_pago: 'pendiente' | 'pagado';
}

export type DriverViewMode = 'cards' | 'table';
export type DriverStatusFilter = 'all' | 'activo' | 'inactivo';

