// Modelos para Choferes

export interface Driver {
  id: number;
  nombre_completo: string;
  rut: string;
  telefono: string;
  correo: string;
  porcentaje_pago: number;
  fecha_venc_licencia: string;
  fecha_contrato?: string;
  alerta_licencia: boolean;
  licencia_estado?: {
    estado: 'ok' | 'warning' | 'danger';
    dias_restantes: number;
    fecha_vencimiento: string;
  };
  estado: 'activo' | 'inactivo' | 'eliminado';
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

// DriverDailyRecord es compatible con DailyRecord del modelo unificado
// Ver: src/app/shared/models/daily-record.models.ts

import type { DailyRecordStatus } from './daily-record.models';

/**
 * Registro diario visto desde el contexto de un chofer
 * Compatible con DailyRecord unificado
 */
export interface DriverDailyRecord {
  id: number;
  fecha: string;
  estado: 'completo' | 'pendiente_trabajador' | 'incidente_reportado' | 'no_trabajado'; // Mapeo de DailyRecordStatus
  recaudado: number;
  diesel: number; // Alias de costo_diesel para compatibilidad
  pago_chofer: number;
  neto?: number;
  observaciones?: string | null; // Texto opcional mostrado en historial
  tiene_observaciones: boolean; // Booleano que indica si tiene observaciones
  maquina_id?: number; // ID de la máquina
  maquina_identificador?: string; // Identificador de la máquina (ej: "Máquina 05")
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
export type LicenseFilter = 'all' | 'vencidas' | 'por_vencer' | 'al_dia';

