// Modelos para Máquinas

export interface Machine {
  id: number;
  numero: string;
  marca: string;
  modelo?: string;
  patente: string;
  año?: number;
  kilometraje_inicial?: number;
  estado_operativo: 'Operativa' | 'En Taller' | 'Inactiva';
  chofer_id?: number | null; // ID del chofer asignado (para formularios)
  chofer_actual?: {
    id: number;
    nombre_completo: string;
  } | null;
  documentos: {
    revision_tecnica?: string; // fecha_venc_rt
    permiso_circulacion?: string; // fecha_venc_permiso
    seguro_obligatorio?: string; // fecha_venc_seguro
  };
  created_at?: string;
  updated_at?: string;
}

export interface MachineDocumentStatus {
  revision_tecnica: DocumentStatus;
  permiso_circulacion: DocumentStatus;
  seguro_obligatorio: DocumentStatus;
}

export interface DocumentStatus {
  fecha: string | null;
  estado: 'ok' | 'warning' | 'error';
  dias_restantes?: number;
  texto: string;
}

export interface MachineKPIs {
  operativas: number;
  en_taller: number;
  inactivas: number;
  documentos_por_vencer: number;
}

export interface MachineDocumentAlerts {
  vencidos: number;
  por_vencer: number;
  al_dia: number;
}

export type MachineStatus = 'Operativa' | 'En Taller' | 'Inactiva';
export type ViewMode = 'cards' | 'table';
export type StatusFilter = 'all' | 'Operativa' | 'En Taller' | 'Inactiva';
export type DocumentFilter = 'all' | 'vencidos' | 'por_vencer' | 'al_dia';

/**
 * Máquina para selector (vista de choferes)
 * Endpoint: GET /api/machines/active
 */
export interface MachineSelect {
  id: number;
  numero_interno: string;
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  display_name: string; // Ej: "105 - Volvo (ABCD-12)"
}

