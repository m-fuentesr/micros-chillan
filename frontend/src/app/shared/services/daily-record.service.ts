import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, shareReplay, delay } from 'rxjs/operators';
import {
  DailyRecord,
  DailyRecordFilters,
  DailyRecordsResponse,
  CreateDailyRecordDto,
  CreateDailyRecordAdminDto,
  UpdateDailyRecordDto,
  DailyRecordsKPIs,
  DailyRecordHistoryResponse,
  DailyRecordStatus,
  InactivityReason,
  DailyRecordHistoryItem
} from '../models/daily-record.models';
import { environment } from '../../../environments/environment.development';

/**
 * Interfaz para la respuesta del backend del detalle de registro diario
 */
interface DailyRecordDetailResponse {
  id: number;
  fecha: string;
  estado: string;
  maquina: {
    id: number;
    numero_interno: number;
  };
  chofer: {
    id: number;
    nombre: string;
    porcentaje_actual: number;
  };
  datos_financieros: {
    monto_recaudado: number | null;
    litros_diesel: number | null;
    costo_total_diesel: number | null;
    pago_calculado_actual: number | null;
  };
  estado_operativo: {
    es_dia_no_trabajado: boolean;
    motivo_no_trabajado: string | null;
    motivo_no_trabajado_otro: string | null;
  };
  observaciones: string | null;
  incidente_critico: boolean;
  imagenes: {
    registro: string | null;
    diesel: string | null;
  };
}

/**
 * Respuesta del endpoint de historial/auditoría por registro
 * GET /api/daily-records/{id}/history
 */
interface DailyRecordAuditItem {
  id: number;
  fecha_cambio: string;
  usuario_responsable: string | null;
  tipo_cambio: string | null;
  detalles?: Array<{
    campo: string;
    valor_anterior: string | null;
    valor_nuevo: string | null;
  }>;
}

/**
 * Servicio para gestión de registros diarios
 * Endpoints según PDF "Edición y Auditoría de Registros Diarios"
 */
@Injectable({
  providedIn: 'root'
})
export class DailyRecordService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Sistema de caché para historial
  private historyCache: Map<string, DailyRecordHistoryResponse[]> = new Map();
  private historyCacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtener lista de registros diarios con filtros
   * Endpoint: GET /api/daily-records
   */
  getDailyRecords(filters?: DailyRecordFilters): Observable<DailyRecordsResponse> {
    let params = new HttpParams();
    
    // Paginación por defecto: 20 registros por página
    const pagina = filters?.pagina || 1;
    const porPagina = filters?.por_pagina || 20;
    
    if (filters) {
      if (filters.maquina_id) params = params.set('maquina_id', filters.maquina_id.toString());
      if (filters.chofer_id) params = params.set('chofer_id', filters.chofer_id.toString());
      // Mapear estados del frontend (mayúsculas) al backend (minúsculas)
      if (filters.estado && filters.estado !== 'all') {
        const estadoMap: Record<string, string> = {
          'COMPLETO': 'completo',
          'INCIDENTE_REPORTADO': 'incidente_reportado',
          'PENDIENTE_TRABAJADOR': 'pendiente_trabajador',
          'NO_TRABAJADO': 'no_trabajado',
          'DIA_NO_TRABAJADO': 'no_trabajado'
        };
        const estadoBackend = estadoMap[filters.estado] || filters.estado.toLowerCase();
        params = params.set('estado', estadoBackend);
      }
      if (filters.desde) params = params.set('fecha_inicio', filters.desde);
      if (filters.hasta) params = params.set('fecha_fin', filters.hasta);
      if (filters.busqueda) params = params.set('search', filters.busqueda);
      if (filters.orden) {
        params = params.set('sort_by', 'fecha');
        params = params.set('order', filters.orden === 'mas_reciente' || filters.orden === 'fecha_desc' ? 'desc' : 'asc');
      }
    }
    
    // Siempre incluir paginación
    params = params.set('page', pagina.toString());
    params = params.set('per_page', porPagina.toString());

    interface BackendPaginatedResponse {
      total: number;
      page: number;
      per_page: number;
      items: Array<{
        id: number;
        fecha: string;
        chofer: { id: number; nombre: string };
        maquina: { id: number; numero_interno: number };
        monto_recaudado: number;
        diesel: number | null;
        estado: string;
        tiene_observaciones: boolean;
      }>;
    }

    return this.http.get<BackendPaginatedResponse>(`${this.apiUrl}/api/daily-records`, { params })
      .pipe(
        map(response => ({
          datos: response.items.map(item => {
            // Mapear estados del backend (minúsculas) al frontend (mayúsculas)
            let estado: DailyRecordStatus = 'COMPLETO';
            if (item.estado === 'completo') {
              estado = 'COMPLETO';
            } else if (item.estado === 'incidente_reportado') {
              estado = 'INCIDENTE_REPORTADO';
            } else if (item.estado === 'pendiente_trabajador') {
              estado = 'PENDIENTE_TRABAJADOR';
            } else if (item.estado === 'no_trabajado') {
              estado = 'DIA_NO_TRABAJADO';
            }

            // Determinar si es emergencia basado en el estado
            const es_emergencia = item.estado === 'incidente_reportado';
            
            // Determinar si es día no trabajado
            const dia_no_trabajado = item.estado === 'no_trabajado';

            return {
              id: item.id.toString(),
              fecha: item.fecha,
              maquina_id: item.maquina.id,
              maquina_identificador: `Máquina ${item.maquina.numero_interno}`,
              chofer_id: item.chofer.id,
              chofer_nombre: item.chofer.nombre,
              recaudado: item.monto_recaudado,
              costo_diesel: item.diesel || 0,
              litros_diesel: undefined,
              dia_no_trabajado,
              es_emergencia,
              estado,
              tiene_observaciones: item.tiene_observaciones
            };
          }),
          total: response.total,
          pagina: response.page,
          por_pagina: response.per_page,
          total_paginas: Math.ceil(response.total / response.per_page)
        })),
        catchError((error) => {
          console.error('Error obteniendo registros diarios:', error);
          return of(this.getMockDailyRecordsResponse(filters));
        })
      );
  }

  /**
   * Obtener un registro diario por ID
   * Endpoint: GET /api/daily-records/:id
   */
  getDailyRecordById(id: string): Observable<DailyRecord> {
    return this.http.get<DailyRecordDetailResponse>(`${this.apiUrl}/api/daily-records/${id}`)
      .pipe(
        map((backendResponse) => this.mapDetailResponseToDailyRecord(backendResponse)),
        catchError((error) => {
          console.error('Error obteniendo registro diario:', error);
          return of(this.getMockDailyRecord(id));
        })
      );
  }

  /**
   * Obtener historial/auditoría de un registro diario (requiere admin)
   * Endpoint: GET /api/daily-records/{id}/history
   */
  getDailyRecordHistory(id: string): Observable<DailyRecordHistoryItem[]> {
    return this.http.get<DailyRecordAuditItem[]>(`${this.apiUrl}/api/daily-records/${id}/history`)
      .pipe(
        map((items) => (items || []).map((item) => this.mapAuditItemToHistory(item))),
        catchError((error) => {
          console.error('Error obteniendo historial del registro:', error);
          return of([]);
        })
      );
  }

  private mapAuditItemToHistory(item: DailyRecordAuditItem): DailyRecordHistoryItem {
    const cambios = item.detalles?.map((detalle) => {
      const anterior = detalle.valor_anterior ?? '-';
      const nuevo = detalle.valor_nuevo ?? '-';
      return `${detalle.campo}: ${anterior} → ${nuevo}`;
    }).join('; ');

    return {
      id: String(item.id),
      usuario: item.usuario_responsable || 'Sistema',
      accion: item.tipo_cambio || 'Edición',
      timestamp: item.fecha_cambio,
      cambios
    };
  }

  /**
   * Mapear la respuesta del backend (DailyRecordDetailResponse) al modelo del frontend (DailyRecord)
   */
  private mapDetailResponseToDailyRecord(response: DailyRecordDetailResponse): DailyRecord {
    const datosFinancieros = response.datos_financieros || {};
    const estadoOperativo = response.estado_operativo || {};
    const imagenes = response.imagenes || {};
    
    // Calcular desglose de pago
    const base = datosFinancieros.monto_recaudado || 0;
    // El backend devuelve el porcentaje como decimal (0.3), convertimos a porcentaje (30) para mostrar
    const porcentajeDecimal = response.chofer?.porcentaje_actual || 0.3;
    const porcentaje = porcentajeDecimal * 100; // Convertir de decimal a porcentaje para mostrar
    // El backend ya calcula el monto, pero si no viene, lo calculamos multiplicando directamente (porque porcentajeDecimal es decimal)
    const montoPago = datosFinancieros.pago_calculado_actual || (base * porcentajeDecimal);
    
    // Mapear estado del backend al frontend
    const estadoMap: Record<string, DailyRecordStatus> = {
      'pendiente_trabajador': 'PENDIENTE_TRABAJADOR',
      'incidente_reportado': 'INCIDENTE_REPORTADO',
      'completo': 'COMPLETO',
      'no_trabajado': 'NO_TRABAJADO',
      'dia_no_trabajado': 'DIA_NO_TRABAJADO'
    };
    const estado = estadoMap[response.estado?.toLowerCase() || ''] || 'PENDIENTE_TRABAJADOR';
    
    return {
      id: String(response.id),
      fecha: response.fecha,
      maquina_id: response.maquina?.id || 0,
      maquina_identificador: response.maquina?.numero_interno 
        ? `Máquina ${String(response.maquina.numero_interno).padStart(2, '0')}` 
        : undefined,
      chofer_id: response.chofer?.id || 0,
      chofer_nombre: response.chofer?.nombre || '',
      
      // Información financiera
      recaudado: datosFinancieros.monto_recaudado || 0,
      costo_diesel: datosFinancieros.costo_total_diesel || 0,
      litros_diesel: datosFinancieros.litros_diesel || undefined,
      
      // Estado de operación
      dia_no_trabajado: estadoOperativo.es_dia_no_trabajado || false,
      motivo_inactividad: this.mapEnumToMotivoInactividad(estadoOperativo.motivo_no_trabajado) || null,
      es_emergencia: response.incidente_critico || false,
      
      // Estado y observaciones
      estado,
      observaciones: response.observaciones || null,
      
      // Comprobantes
      comprobante_registro: imagenes.registro ? {
        imagen_url: imagenes.registro,
        subido_en: undefined // El backend no devuelve esta fecha en el detalle
      } : null,
      comprobante_diesel: imagenes.diesel ? {
        monto: datosFinancieros.costo_total_diesel || 0,
        imagen_url: imagenes.diesel,
        subido_en: undefined // El backend no devuelve esta fecha en el detalle
      } : null,
      
      // Desglose de pago
      desglose_pago: {
        base: base,
        porcentaje: porcentaje,
        monto: montoPago
      },
      
      // Auditoría (no viene en el detalle, se puede obtener del endpoint de historial)
      historial: []
    };
  }

  /**
   * Mapear el valor del enum de la base de datos al valor legible del frontend
   */
  private mapEnumToMotivoInactividad(motivoEnum: string | null): InactivityReason | null {
    if (!motivoEnum) return null;
    
    const enumToFrontendMap: Record<string, InactivityReason> = {
      'descanso_semanal': 'Descanso Semanal',
      'vacaciones': 'Vacaciones',
      'licencia_medica': 'Licencia Médica',
      'permiso_personal': 'Permiso Personal',
      'maquina_en_mantenimiento': 'En Taller / Mantenimiento',
      'sin_asignacion_ruta': 'Sin Chofer Asignado',
      'otro': 'Otro'
    };
    
    // Si el valor ya está en formato legible, retornarlo
    const valoresValidos: InactivityReason[] = [
      'Descanso Semanal',
      'Vacaciones',
      'Licencia Médica',
      'Permiso Personal',
      'En Taller / Mantenimiento',
      'Sin Chofer Asignado',
      'Otro'
    ];
    
    if (valoresValidos.includes(motivoEnum as InactivityReason)) {
      return motivoEnum as InactivityReason;
    }
    
    // Mapear desde el enum
    return enumToFrontendMap[motivoEnum] || null;
  }

  /**
   * Obtener historial del trabajador con filtros de tiempo
   * Endpoint: GET /api/daily-records/my-history?rango={rango}
   * @param rango Valores permitidos: 'esta_semana', 'este_mes', 'mes_anterior', 'todo'
   * @param forceRefresh Si es true, fuerza la recarga desde el backend
   */
  getMyHistory(rango: string = 'este_mes', forceRefresh = false): Observable<DailyRecordHistoryResponse[]> {
    const cacheKey = `history-${rango}`;
    const now = Date.now();
    const cachedTimestamp = this.historyCacheTimestamps.get(cacheKey) || 0;

    // Verificar caché válido
    if (!forceRefresh && this.historyCache.has(cacheKey) && (now - cachedTimestamp) < this.CACHE_TTL) {
      return of(this.historyCache.get(cacheKey)!);
    }

    const params = new HttpParams().set('rango', rango);
    
    return this.http.get<DailyRecordHistoryResponse[]>(`${this.apiUrl}/api/daily-records/my-history`, { params })
      .pipe(
        tap((history) => {
          // Guardar en caché después de respuesta exitosa
          this.historyCache.set(cacheKey, history);
          this.historyCacheTimestamps.set(cacheKey, now);
        }),
        shareReplay(1), // Compartir el observable entre múltiples suscriptores
        catchError((error) => {
          console.error('Error obteniendo historial del trabajador:', error);
          // Si hay caché, retornarlo aunque esté expirado
          if (this.historyCache.has(cacheKey)) {
            return of(this.historyCache.get(cacheKey)!);
          }
          return of([]);
        })
      );
  }

  /**
   * Verificar estado del reporte de hoy
   * Endpoint: GET /api/daily-records/today-status
   * Retorna información sobre si el usuario ya tiene un reporte para hoy
   */
  getTodayStatus(): Observable<{exists: boolean, record: any, can_create_new: boolean, message: string}> {
    return this.http.get<{exists: boolean, record: any, can_create_new: boolean, message: string}>(
      `${this.apiUrl}/api/daily-records/today-status`
    ).pipe(
      catchError(() => of({
        exists: false, 
        record: null, 
        can_create_new: true, 
        message: 'Puede crear un nuevo reporte'
      }))
    );
  }

  /**
   * Invalidar caché del historial
   * Útil después de crear, actualizar o eliminar un reporte
   */
  invalidateHistoryCache(): void {
    this.historyCache.clear();
    this.historyCacheTimestamps.clear();
  }

  /**
   * Crear un nuevo registro diario
   * Endpoint: POST /api/daily-records
   * Nota: El backend espera JSON con imagen_url como string.
   * Si se proporciona un File, debe subirse primero a Supabase Storage.
   */
  createDailyRecord(record: CreateDailyRecordDto): Observable<DailyRecord> {
    // El backend espera JSON con estos campos según el schema:
    // maquina_id, fecha, monto_recaudado, litros_diesel, costo_total_diesel, 
    // imagen_url (comprobante registro diario), imagen_comprobante_diesel_url (opcional),
    // observaciones, incidente_critico
    
    // Extraer imagen_url del comprobante_registro (obligatorio)
    let imagen_url = '';
    if (record.comprobante_registro?.imagen) {
      if (typeof record.comprobante_registro.imagen === 'string') {
        imagen_url = record.comprobante_registro.imagen;
      }
    }
    
    // Extraer imagen_comprobante_diesel_url del comprobante_diesel (opcional)
    let imagen_comprobante_diesel_url = '';
    if (record.comprobante_diesel?.imagen) {
      if (typeof record.comprobante_diesel.imagen === 'string') {
        imagen_comprobante_diesel_url = record.comprobante_diesel.imagen;
      }
    }
    
    const payload: any = {
      maquina_id: record.maquina_id,
      fecha: record.fecha,
      monto_recaudado: record.recaudado || 0,
      litros_diesel: record.litros_diesel || null,
      costo_total_diesel: record.costo_diesel || null,
      imagen_url: imagen_url, // Comprobante del registro diario (obligatorio)
      imagen_comprobante_diesel_url: imagen_comprobante_diesel_url || null, // Comprobante de diesel (opcional)
      observaciones: record.observaciones || null,
      incidente_critico: record.incidente_critico || false
    };
    
    // Debug: Verificar que las URLs se estén pasando
    if (imagen_url) {
      console.log('📸 Enviando imagen_url (comprobante registro) al backend:', imagen_url);
    } else {
      console.log('⚠️ No hay imagen_url (comprobante registro) en el payload');
    }
    
    if (imagen_comprobante_diesel_url) {
      console.log('⛽ Enviando imagen_comprobante_diesel_url al backend:', imagen_comprobante_diesel_url);
    }

    return this.http.post<DailyRecord>(`${this.apiUrl}/api/daily-records`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error creando registro diario:', error);
          // Mock response para desarrollo
          const mockRecord = this.getMockDailyRecord('new-' + Date.now());
          return of(mockRecord);
        })
      );
  }

  /**
   * Crear un nuevo registro diario como administrador
   * Endpoint: POST /api/daily-records/admin
   * El backend espera JSON con imagen_url como string (ya subidas previamente)
   */
  createDailyRecordAdmin(record: CreateDailyRecordAdminDto): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/daily-records/admin`,
      record
    ).pipe(
      catchError((error) => {
        console.error('Error creando registro diario como admin:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar un registro diario existente
   * Endpoint: PUT /api/daily-records/:id
   * Nota: El backend espera JSON con URLs de imágenes (ya subidas previamente).
   * Si se proporcionan archivos File, deben subirse primero usando StorageService.
   */
  updateDailyRecord(id: string, record: UpdateDailyRecordDto): Observable<DailyRecord> {
    // Preparar payload JSON según el schema DailyRecordUpdate del backend
    const payload: any = {
      monto_recaudado: record.recaudado,
      litros_diesel: record.litros_diesel,
      costo_total_diesel: record.costo_diesel,
      observaciones: record.observaciones || null,
      es_dia_no_trabajado: record.dia_no_trabajado || false,
      motivo_no_trabajado: record.motivo_inactividad || null,
      motivo_no_trabajado_otro: null, // Si es "Otro", debería venir en motivo_inactividad
      incidente_critico: record.es_emergencia || false
    };
    
    // Si hay URLs de imágenes (strings), agregarlas al payload
    // Nota: Si hay archivos File, deben subirse primero antes de llamar a este método
    if (record.comprobante_registro?.imagen && typeof record.comprobante_registro.imagen === 'string') {
      payload.imagen_url = record.comprobante_registro.imagen;
    }
    if (record.comprobante_diesel?.imagen && typeof record.comprobante_diesel.imagen === 'string') {
      payload.imagen_comprobante_diesel_url = record.comprobante_diesel.imagen;
    }
    
    return this.http.put<DailyRecordDetailResponse>(`${this.apiUrl}/api/daily-records/${id}`, payload)
      .pipe(
        map((response) => this.mapDetailResponseToDailyRecord(response)),
        catchError((error) => {
          console.error('Error actualizando registro diario:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Resolver un incidente (marcar como resuelto)
   * Endpoint: PATCH /api/daily-records/:id/resolve
   */
  resolveIncident(id: string): Observable<DailyRecord> {
    return this.http.patch<DailyRecordDetailResponse>(`${this.apiUrl}/api/daily-records/${id}/resolve`, {})
      .pipe(
        map((response) => this.mapDetailResponseToDailyRecord(response)),
        catchError((error) => {
          console.error('Error resolviendo incidente:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener KPIs de registros diarios
   * Endpoint: GET /api/daily-records/summary
   */
  getDailyRecordsKPIs(period?: { desde: string; hasta: string }): Observable<DailyRecordsKPIs> {
    // El backend devuelve DailyRecordSummary que tiene:
    // - recaudacion_periodo
    // - registros_faltantes
    // - registros_incidentes
    
    interface BackendSummary {
      recaudacion_periodo: number;
      registros_faltantes: number;
      registros_incidentes: number;
    }

    interface BackendSummary {
      recaudacion_periodo: number;
      registros_faltantes: number;
      registros_incidentes: number; // El backend devuelve 'registros_incidentes'
    }

    return this.http.get<BackendSummary>(`${this.apiUrl}/api/daily-records/summary`)
      .pipe(
        map((response) => ({
          recaudacion_periodo: response.recaudacion_periodo,
          registros_faltantes: response.registros_faltantes,
          registros_con_incidentes: response.registros_incidentes, // Mapear de registros_incidentes a registros_con_incidentes
          total_registros: 0, // No viene del backend, se puede calcular si es necesario
          registros_completos: 0, // No viene del backend
          registros_pendientes: response.registros_faltantes, // Aproximación
          periodo: period || {
            desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            hasta: new Date().toISOString().split('T')[0]
          }
        })),
        catchError((error) => {
          console.error('Error obteniendo KPIs de registros diarios:', error);
          return of(this.getMockKPIs());
        })
      );
  }

  // ========== Mocks temporales (para desarrollo) ==========

  private getMockDailyRecordsResponse(filters?: DailyRecordFilters): DailyRecordsResponse {
    const today = new Date();
    const mockRecords: DailyRecord[] = [
      {
        id: '1',
        fecha: today.toISOString().split('T')[0],
        maquina_id: 5,
        maquina_identificador: 'Máquina 05',
        chofer_id: 1,
        chofer_nombre: 'Juan Pérez',
        recaudado: 120000,
        costo_diesel: 45000,
        litros_diesel: 120,
        dia_no_trabajado: false,
        es_emergencia: false,
        estado: 'COMPLETO',
        observaciones: 'Registro completo del día.'
      },
      {
        id: '2',
        fecha: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maquina_id: 4,
        maquina_identificador: 'Máquina 04',
        chofer_id: 2,
        chofer_nombre: 'Luis Martínez',
        recaudado: 85000,
        costo_diesel: 38000,
        litros_diesel: 100,
        dia_no_trabajado: false,
        es_emergencia: true,
        estado: 'INCIDENTE_REPORTADO',
        observaciones: 'Choque leve en parachoques trasero.'
      },
      {
        id: '3',
        fecha: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maquina_id: 2,
        maquina_identificador: 'Máquina 02',
        chofer_id: 3,
        chofer_nombre: 'Ana Gómez',
        recaudado: 95000,
        costo_diesel: 0,
        dia_no_trabajado: false,
        es_emergencia: false,
        estado: 'PENDIENTE_TRABAJADOR',
        observaciones: null
      },
      {
        id: '4',
        fecha: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maquina_id: 1,
        maquina_identificador: 'Máquina 01',
        chofer_id: 4,
        chofer_nombre: 'Carlos Ramírez',
        recaudado: 150000,
        costo_diesel: 52000,
        litros_diesel: 130,
        dia_no_trabajado: false,
        es_emergencia: false,
        estado: 'COMPLETO',
        observaciones: 'Excelente jornada de trabajo.'
      },
      {
        id: '5',
        fecha: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maquina_id: 3,
        maquina_identificador: 'Máquina 03',
        chofer_id: 5,
        chofer_nombre: 'María Silva',
        recaudado: 110000,
        costo_diesel: 40000,
        litros_diesel: 110,
        dia_no_trabajado: false,
        es_emergencia: false,
        estado: 'COMPLETO',
        observaciones: 'Todo normal.'
      },
      {
        id: '6',
        fecha: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maquina_id: 5,
        maquina_identificador: 'Máquina 05',
        chofer_id: 1,
        chofer_nombre: 'Juan Pérez',
        recaudado: 0,
        costo_diesel: 0,
        dia_no_trabajado: true,
        es_emergencia: false,
        estado: 'DIA_NO_TRABAJADO',
        observaciones: 'Descanso semanal.'
      }
    ];

    // Aplicar filtros básicos
    let filtered = [...mockRecords];
    if (filters) {
      // Filtrar por estado solo si está definido y no es 'all'
      if (filters.estado) {
        filtered = filtered.filter(r => r.estado === filters.estado);
      }
      if (filters.es_emergencia !== undefined) {
        filtered = filtered.filter(r => r.es_emergencia === filters.es_emergencia);
      }
      if (filters.busqueda) {
        const query = filters.busqueda.toLowerCase();
        filtered = filtered.filter(r =>
          r.maquina_identificador?.toLowerCase().includes(query) ||
          r.chofer_nombre?.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query)
        );
      }
      // Filtrar por fecha si está definida
      if (filters.fecha) {
        filtered = filtered.filter(r => r.fecha === filters.fecha);
      }
    }

    const pagina = filters?.pagina || 1;
    const porPagina = filters?.por_pagina || 20;
    const start = (pagina - 1) * porPagina;
    const end = start + porPagina;

    const response = {
      datos: filtered.slice(start, end),
      total: filtered.length,
      pagina,
      por_pagina: porPagina,
      total_paginas: Math.ceil(filtered.length / porPagina)
    };

    // Debug: Log para verificar que se están devolviendo datos
    console.log('📊 Mock Daily Records Response:', {
      total: response.total,
      datos: response.datos.length,
      pagina: response.pagina,
      filtros: filters
    });

    return response;
  }

  private getMockDailyRecord(id: string): DailyRecord {
    return {
      id,
      fecha: '2025-11-28',
      maquina_id: 5,
      maquina_identificador: 'Máquina 05',
      chofer_id: 1,
      chofer_nombre: 'Juan Pérez',
      recaudado: 450000,
      costo_diesel: 80000,
      litros_diesel: 120,
      dia_no_trabajado: false,
      es_emergencia: false,
      estado: 'COMPLETO',
      observaciones: 'Registro completo del día. Todo en orden.',
      desglose_pago: {
        base: 450000,
        porcentaje: 30,
        monto: 135000
      },
      comprobante_diesel: {
        monto: 80000,
        imagen_url: 'https://via.placeholder.com/400x300?text=Comprobante',
        subido_en: new Date().toISOString(),
        validado: true
      },
      historial: [
        {
          id: '1',
          usuario: 'Admin',
          accion: 'Modificado por Admin',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          cambios: 'Ajuste Monto'
        },
        {
          id: '2',
          usuario: 'Juan Pérez',
          accion: 'Creado por Juan Pérez',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ],
      creado_por: 'Juan Pérez',
      creado_en: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      actualizado_por: 'Admin',
      actualizado_en: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    };
  }

  private getMockKPIs(): DailyRecordsKPIs {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return {
      recaudacion_periodo: 665000, // Suma de los registros mock
      registros_faltantes: 1,
      registros_con_incidentes: 1,
      total_registros: 6,
      registros_completos: 3,
      registros_pendientes: 1,
      periodo: {
        desde: firstDayOfMonth.toISOString().split('T')[0],
        hasta: today.toISOString().split('T')[0]
      }
    };
  }
}

