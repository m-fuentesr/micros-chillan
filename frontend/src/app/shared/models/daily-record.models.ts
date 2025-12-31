// Modelos unificados para Registros Diarios
// Basado en especificaciones del PDF "Edición y Auditoría de Registros Diarios"

/**
 * Estados posibles de un registro diario
 * Incluye EN_ESPERA para registros que aún no han sido creados
 */
export type DailyRecordStatus = 
  | 'PENDIENTE_TRABAJADOR' 
  | 'INCIDENTE_REPORTADO' 
  | 'COMPLETO' 
  | 'NO_TRABAJADO' 
  | 'DIA_NO_TRABAJADO'
  | 'EN_ESPERA';

/**
 * Motivos de inactividad cuando el día no fue trabajado
 */
export type InactivityReason = 
  | 'Descanso Semanal'
  | 'Vacaciones'
  | 'Licencia Médica'
  | 'Permiso Personal'
  | 'En Taller / Mantenimiento'
  | 'Sin Chofer Asignado'
  | 'Otro';

/**
 * Item del historial de cambios de un registro diario
 */
export interface DailyRecordHistoryItem {
  id: string;
  usuario: string;
  accion: string;
  timestamp: string; // ISO date string
  cambios?: string;
  rol?: string; // Rol del usuario responsable
  tipoActor?: string; // Tipo de actor: 'admin' | 'chofer'
  detalles?: Record<string, { anterior?: any; nuevo?: any }>;
}

/**
 * Comprobante de diésel asociado al registro
 */
export interface DieselReceipt {
  id?: string;
  tipo?: string; // 'Boleta' | 'Factura' | 'Otro'
  numero?: string;
  monto: number;
  imagen_url?: string;
  subido_en?: string; // ISO date string
  validado?: boolean;
}

/**
 * Desglose de pago al chofer
 */
export interface PaymentBreakdown {
  base: number; // Monto base para el cálculo
  porcentaje: number; // Porcentaje del chofer (ej: 30)
  monto: number; // Monto a pagar (base * porcentaje / 100)
}

/**
 * Registro diario completo
 * Endpoint: GET /api/daily-records/:id
 * Endpoint: POST /api/daily-records
 * Endpoint: PUT /api/daily-records/:id
 */
export interface DailyRecord {
  id: string;
  fecha: string; // YYYY-MM-DD
  maquina_id: number;
  maquina_identificador?: string; // Para display (ej: "Máquina 05")
  chofer_id: number;
  chofer_nombre?: string; // Para display (ej: "Juan Pérez")
  
  // Información financiera
  recaudado: number;
  costo_diesel: number;
  pago_chofer?: number;
  neto?: number;
  litros_diesel?: number;
  
  // Estado de operación
  dia_no_trabajado: boolean;
  motivo_inactividad?: InactivityReason | null;
  es_emergencia?: boolean;
  
  // Estado y observaciones
  estado: DailyRecordStatus;
  observaciones?: string | null;
  tiene_observaciones?: boolean; // Booleano que indica si tiene observaciones (usado en listados)
  
  // Comprobantes y desglose
  comprobante_registro?: {  // Comprobante del registro diario (obligatorio)
    imagen_url?: string;
    subido_en?: string; // ISO date string
  } | null;
  comprobante_diesel?: DieselReceipt | null;  // Comprobante de carga de diesel (opcional)
  desglose_pago?: PaymentBreakdown;
  
  // Auditoría
  historial?: DailyRecordHistoryItem[];
  creado_por?: string;
  creado_en?: string; // ISO date string
  actualizado_por?: string;
  actualizado_en?: string; // ISO date string
}

/**
 * Filtros para búsqueda de registros diarios
 * Endpoint: GET /api/daily-records
 */
export interface DailyRecordFilters {
  fecha?: string; // YYYY-MM-DD
  maquina_id?: number;
  chofer_id?: number;
  estado?: DailyRecordStatus | 'all';
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  es_emergencia?: boolean;
  dia_no_trabajado?: boolean;
  busqueda?: string; // Búsqueda por texto (máquina, chofer, folio)
  orden?: 'mas_reciente' | 'mas_antiguo' | 'fecha_asc' | 'fecha_desc';
  pagina?: number;
  por_pagina?: number;
}

/**
 * DTO para crear un nuevo registro diario
 * Endpoint: POST /api/daily-records
 */
export interface CreateDailyRecordDto {
  fecha: string; // YYYY-MM-DD
  maquina_id: number;
  chofer_id: number;
  recaudado?: number;
  costo_diesel?: number;
  litros_diesel?: number;
  dia_no_trabajado: boolean;
  motivo_inactividad?: InactivityReason | null;
  es_emergencia?: boolean;
  observaciones?: string | null;
  incidente_critico?: boolean; // Nuevo campo para indicar incidente crítico
  comprobante_registro?: {  // Comprobante del registro diario (obligatorio)
    imagen?: File | string; // File para upload, string para URL
  };
  comprobante_diesel?: {  // Comprobante de carga de diesel (opcional)
    tipo?: string;
    numero?: string;
    monto: number;
    imagen?: File | string; // File para upload, string para URL
  };
}

/**
 * DTO para crear un nuevo registro diario como administrador
 * Endpoint: POST /api/daily-records/admin
 */
export interface CreateDailyRecordAdminDto {
  chofer_id: number;
  maquina_id: number;
  fecha: string; // YYYY-MM-DD
  es_dia_no_trabajado: boolean;
  motivo_no_trabajado?: string | null;
  motivo_no_trabajado_otro?: string | null;
  monto_recaudado?: number | null;
  litros_diesel?: number | null;
  costo_total_diesel?: number | null;
  imagen_url?: string | null;
  imagen_comprobante_diesel_url?: string | null;
  observaciones?: string | null;
  incidente_critico: boolean;
}

/**
 * DTO para actualizar un registro diario
 * Endpoint: PUT /api/daily-records/:id
 */
export interface UpdateDailyRecordDto {
  recaudado?: number;
  costo_diesel?: number;
  litros_diesel?: number;
  dia_no_trabajado?: boolean;
  motivo_inactividad?: InactivityReason | null;
  es_emergencia?: boolean;
  observaciones?: string | null;
  estado?: DailyRecordStatus;
  comprobante_registro?: {  // Comprobante del registro diario
    imagen?: File | string;
  };
  comprobante_diesel?: {  // Comprobante de carga de diesel
    tipo?: string;
    numero?: string;
    monto: number;
    imagen?: File | string;
  };
}

/**
 * KPIs de registros diarios
 * Endpoint: GET /api/daily-records/kpis
 */
export interface DailyRecordsKPIs {
  recaudacion_periodo: number;
  registros_faltantes: number;
  registros_con_incidentes: number;
  total_registros: number;
  registros_completos: number;
  registros_pendientes: number;
  periodo?: {
    desde: string; // YYYY-MM-DD
    hasta: string; // YYYY-MM-DD
  };
}

/**
 * Respuesta paginada de registros diarios
 * Endpoint: GET /api/daily-records
 */
export interface DailyRecordsResponse {
  datos: DailyRecord[];
  total: number;
  total_registros_global?: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

/**
 * Alias para compatibilidad con modelos existentes
 * MachineDailyRecord puede ser un subset de DailyRecord
 */
export type MachineDailyRecord = Pick<
  DailyRecord,
  'id' | 'fecha' | 'chofer_id' | 'chofer_nombre' | 'recaudado' | 'costo_diesel' | 'observaciones' | 'estado'
> & {
  chofer: string; // Alias de chofer_nombre para compatibilidad
  diesel: number; // Alias de costo_diesel para compatibilidad
};

/**
 * Alias para compatibilidad con modelos existentes
 * DriverDailyRecord puede ser un subset de DailyRecord
 */
export type DriverDailyRecord = Pick<
  DailyRecord,
  'id' | 'fecha' | 'estado' | 'recaudado' | 'costo_diesel' | 'observaciones'
> & {
  diesel: number; // Alias de costo_diesel para compatibilidad
  estado: 'completo' | 'pendiente_trabajador' | 'incidente_reportado' | 'no_trabajado'; // Mapeo de estados
};

/**
 * Información de máquina en el historial
 * Endpoint: GET /api/daily-records/my-history
 */
export interface MaquinaInfo {
  numero_interno: number;
  marca: string;
}

/**
 * Item del historial del trabajador
 * Endpoint: GET /api/daily-records/my-history
 */
export interface DailyRecordHistoryResponse {
  id: number;
  fecha: string; // YYYY-MM-DD
  maquinas?: MaquinaInfo | null; // Objeto anidado con numero_interno y marca (backend devuelve 'maquinas' plural)
  maquina?: MaquinaInfo | null; // Alias para compatibilidad
  monto_recaudado: number;
  estado: string; // Ej: "Completo", "Incidente Reportado"
  incidente_critico: boolean;
  litros_diesel?: number | null;
  costo_total_diesel?: number | null;
  observaciones?: string | null;
  imagen_url?: string | null;
}

