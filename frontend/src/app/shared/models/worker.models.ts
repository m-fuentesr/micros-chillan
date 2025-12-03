// Modelos para el módulo del trabajador
// Basado en endpoints del backend: /api/worker/*

/**
 * Información del período para estadísticas
 */
export interface PeriodoInfo {
  mes: number;
  anio: number;
}

/**
 * Datos estadísticos del trabajador
 */
export interface StatsData {
  dias_trabajados: number;
  total_recaudado: number;
}

/**
 * Perfil completo del trabajador
 * Endpoint: GET /api/worker/profile
 */
export interface WorkerProfile {
  nombre_completo: string;
  rut: string;
  telefono: string;
  email: string;
  maquina_detalle: string | null; // Ej: "MÁQUINA 01 - Mercedes Benz" o null si no tiene asignación
  fecha_ingreso: string; // Ej: "20-11-2024"
}

/**
 * Respuesta de estadísticas mensuales
 * Endpoint: GET /api/worker/monthly-stats
 */
export interface WorkerStatsResponse {
  periodo: PeriodoInfo;
  estadisticas: StatsData;
}

