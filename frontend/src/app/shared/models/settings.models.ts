// Modelos para Configuración General

export interface GeneralSettings {
  porcentaje_default: number;              // Valor entre 0 y 1
  sueldo_minimo: number;                   // Sueldo mínimo garantizado
  dias_alerta_licencia_por_vencer: number; // Días previos para alertar licencias
  dias_alerta_documento_por_vencer: number; // Días previos para alertar documentos
}

export interface UpdateSettingsRequest {
  porcentaje_default?: number;
  sueldo_minimo?: number;
  dias_alerta_licencia_por_vencer?: number;
  dias_alerta_documento_por_vencer?: number;
}

export interface UpdateSettingsResponse {
  porcentaje_anterior?: number;
  porcentaje_nuevo?: number;
  choferes_actualizados?: number;
  sueldo_minimo_anterior?: number;
  sueldo_minimo_nuevo?: number;
  dias_alerta_licencia_anterior?: number;
  dias_alerta_licencia_nuevo?: number;
  dias_alerta_documento_anterior?: number;
  dias_alerta_documento_nuevo?: number;
}

