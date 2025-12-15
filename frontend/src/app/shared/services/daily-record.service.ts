import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, shareReplay, delay } from 'rxjs/operators';
import {
  DailyRecord,
  DailyRecordFilters,
  DailyRecordsResponse,
  CreateDailyRecordDto,
  UpdateDailyRecordDto,
  DailyRecordsKPIs,
  DailyRecordHistoryResponse,
  DailyRecordStatus
} from '../models/daily-record.models';
import { environment } from '../../../environments/environment.development';

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
      if (filters.estado && filters.estado !== 'all') params = params.set('estado', filters.estado);
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
          datos: response.items.map(item => ({
            id: item.id.toString(),
            fecha: item.fecha,
            maquina_id: item.maquina.id,
            maquina_identificador: `Máquina ${item.maquina.numero_interno}`,
            chofer_id: item.chofer.id,
            chofer_nombre: item.chofer.nombre,
            recaudado: item.monto_recaudado,
            costo_diesel: item.diesel || 0,
            litros_diesel: undefined,
            dia_no_trabajado: false,
            es_emergencia: false,
            estado: item.estado as DailyRecordStatus,
            tiene_observaciones: item.tiene_observaciones // Usar el booleano del backend
          })),
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
    return this.http.get<DailyRecord>(`${this.apiUrl}/api/daily-records/${id}`)
      .pipe(
        catchError(() => of(this.getMockDailyRecord(id)))
      );
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
   * Actualizar un registro diario existente
   * Endpoint: PUT /api/daily-records/:id
   */
  updateDailyRecord(id: string, record: UpdateDailyRecordDto): Observable<DailyRecord> {
    // Si hay archivos de imagen, usar FormData
    const hasFileRegistro = record.comprobante_registro?.imagen instanceof File;
    const hasFileDiesel = record.comprobante_diesel?.imagen instanceof File;
    
    if (hasFileRegistro || hasFileDiesel) {
      const formData = new FormData();
      Object.keys(record).forEach(key => {
        const value = (record as any)[key];
        if (value !== undefined && key !== 'comprobante_registro' && key !== 'comprobante_diesel') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      if (record.comprobante_registro?.imagen instanceof File) {
        formData.append('comprobante_registro_imagen', record.comprobante_registro.imagen);
      }
      if (record.comprobante_diesel?.imagen instanceof File) {
        formData.append('comprobante_diesel_imagen', record.comprobante_diesel.imagen);
      }
      
      return this.http.put<DailyRecord>(`${this.apiUrl}/api/daily-records/${id}`, formData)
        .pipe(
          catchError(() => of(this.getMockDailyRecord(id)))
        );
    } else {
      // Preparar payload JSON con URLs de imágenes si son strings
      const payload: any = { ...record };
      
      if (record.comprobante_registro?.imagen && typeof record.comprobante_registro.imagen === 'string') {
        payload.imagen_url = record.comprobante_registro.imagen;
      }
      if (record.comprobante_diesel?.imagen && typeof record.comprobante_diesel.imagen === 'string') {
        payload.imagen_comprobante_diesel_url = record.comprobante_diesel.imagen;
      }
      
      // Remover comprobantes del payload ya que se procesaron
      delete payload.comprobante_registro;
      delete payload.comprobante_diesel;
      
      return this.http.put<DailyRecord>(`${this.apiUrl}/api/daily-records/${id}`, payload)
        .pipe(
          catchError(() => of(this.getMockDailyRecord(id)))
        );
    }
  }

  /**
   * Resolver un incidente (marcar como resuelto)
   * Endpoint: PATCH /api/daily-records/:id/resolve
   */
  resolveIncident(id: string): Observable<DailyRecord> {
    return this.http.patch<DailyRecord>(`${this.apiUrl}/api/daily-records/${id}/resolve`, {})
      .pipe(
        catchError(() => {
          const mockRecord = this.getMockDailyRecord(id);
          return of({
            ...mockRecord,
            estado: 'COMPLETO' as const
          });
        })
      );
  }

  /**
   * Obtener KPIs de registros diarios
   * Endpoint: GET /api/daily-records/kpis
   * TEMPORAL: Usando mocks hasta que el endpoint esté disponible en el backend
   */
  getDailyRecordsKPIs(period?: { desde: string; hasta: string }): Observable<DailyRecordsKPIs> {
    // TODO: Descomentar cuando el endpoint esté disponible en el backend
    // let params = new HttpParams();
    // if (period) {
    //   params = params.set('desde', period.desde);
    //   params = params.set('hasta', period.hasta);
    // }

    // return this.http.get<DailyRecordsKPIs>(`${this.apiUrl}/api/daily-records/kpis`, { params })
    //   .pipe(
    //     catchError(() => of(this.getMockKPIs()))
    //   );

    // Usar mocks directamente por ahora
    return of(this.getMockKPIs());
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

