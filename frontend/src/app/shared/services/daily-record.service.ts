import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DailyRecord,
  DailyRecordFilters,
  DailyRecordsResponse,
  CreateDailyRecordDto,
  UpdateDailyRecordDto,
  DailyRecordsKPIs
} from '../models/daily-record.models';

/**
 * Servicio para gestión de registros diarios
 * Endpoints según PDF "Edición y Auditoría de Registros Diarios"
 */
@Injectable({
  providedIn: 'root'
})
export class DailyRecordService {
  private http = inject(HttpClient);
  private apiUrl = '/api'; // Ajustar según configuración

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
      if (filters.fecha) params = params.set('fecha', filters.fecha);
      if (filters.maquina_id) params = params.set('maquina_id', filters.maquina_id.toString());
      if (filters.chofer_id) params = params.set('chofer_id', filters.chofer_id.toString());
      if (filters.estado && filters.estado !== 'all') params = params.set('estado', filters.estado);
      if (filters.desde) params = params.set('desde', filters.desde);
      if (filters.hasta) params = params.set('hasta', filters.hasta);
      if (filters.es_emergencia !== undefined) params = params.set('es_emergencia', filters.es_emergencia.toString());
      if (filters.dia_no_trabajado !== undefined) params = params.set('dia_no_trabajado', filters.dia_no_trabajado.toString());
      if (filters.busqueda) params = params.set('busqueda', filters.busqueda);
      if (filters.orden) params = params.set('orden', filters.orden);
    }
    
    // Siempre incluir paginación
    params = params.set('pagina', pagina.toString());
    params = params.set('por_pagina', porPagina.toString());

    return this.http.get<DailyRecordsResponse>(`${this.apiUrl}/daily-records`, { params })
      .pipe(
        catchError(() => of(this.getMockDailyRecordsResponse(filters)))
      );
  }

  /**
   * Obtener un registro diario por ID
   * Endpoint: GET /api/daily-records/:id
   */
  getDailyRecordById(id: string): Observable<DailyRecord> {
    return this.http.get<DailyRecord>(`${this.apiUrl}/daily-records/${id}`)
      .pipe(
        catchError(() => of(this.getMockDailyRecord(id)))
      );
  }

  /**
   * Crear un nuevo registro diario
   * Endpoint: POST /api/daily-records
   */
  createDailyRecord(record: CreateDailyRecordDto): Observable<DailyRecord> {
    // Si hay un archivo de imagen, usar FormData
    const formData = new FormData();
    formData.append('fecha', record.fecha);
    formData.append('maquina_id', record.maquina_id.toString());
    formData.append('chofer_id', record.chofer_id.toString());
    formData.append('dia_no_trabajado', record.dia_no_trabajado.toString());
    
    if (record.recaudado !== undefined) formData.append('recaudado', record.recaudado.toString());
    if (record.costo_diesel !== undefined) formData.append('costo_diesel', record.costo_diesel.toString());
    if (record.litros_diesel !== undefined) formData.append('litros_diesel', record.litros_diesel.toString());
    if (record.motivo_inactividad) formData.append('motivo_inactividad', record.motivo_inactividad);
    if (record.es_emergencia !== undefined) formData.append('es_emergencia', record.es_emergencia.toString());
    if (record.observaciones) formData.append('observaciones', record.observaciones);
    
    if (record.comprobante_diesel?.imagen instanceof File) {
      formData.append('comprobante_imagen', record.comprobante_diesel.imagen);
    }

    return this.http.post<DailyRecord>(`${this.apiUrl}/daily-records`, formData)
      .pipe(
        catchError(() => {
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
    // Si hay un archivo de imagen, usar FormData
    const hasFile = record.comprobante_diesel?.imagen instanceof File;
    
    if (hasFile) {
      const formData = new FormData();
      Object.keys(record).forEach(key => {
        const value = (record as any)[key];
        if (value !== undefined && key !== 'comprobante_diesel') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      if (record.comprobante_diesel?.imagen instanceof File) {
        formData.append('comprobante_imagen', record.comprobante_diesel.imagen);
      }
      
      return this.http.put<DailyRecord>(`${this.apiUrl}/daily-records/${id}`, formData)
        .pipe(
          catchError(() => of(this.getMockDailyRecord(id)))
        );
    } else {
      return this.http.put<DailyRecord>(`${this.apiUrl}/daily-records/${id}`, record)
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
    return this.http.patch<DailyRecord>(`${this.apiUrl}/daily-records/${id}/resolve`, {})
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
   */
  getDailyRecordsKPIs(period?: { desde: string; hasta: string }): Observable<DailyRecordsKPIs> {
    let params = new HttpParams();
    if (period) {
      params = params.set('desde', period.desde);
      params = params.set('hasta', period.hasta);
    }

    return this.http.get<DailyRecordsKPIs>(`${this.apiUrl}/daily-records/kpis`, { params })
      .pipe(
        catchError(() => of(this.getMockKPIs()))
      );
  }

  // ========== Mocks temporales (para desarrollo) ==========

  private getMockDailyRecordsResponse(filters?: DailyRecordFilters): DailyRecordsResponse {
    const mockRecords: DailyRecord[] = [
      {
        id: '1',
        fecha: '2025-11-28',
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
        fecha: '2025-11-28',
        maquina_id: 4,
        maquina_identificador: 'Máquina 04',
        chofer_id: 2,
        chofer_nombre: 'Luis Martínez',
        recaudado: 85000,
        costo_diesel: 0,
        dia_no_trabajado: false,
        es_emergencia: true,
        estado: 'INCIDENTE_REPORTADO',
        observaciones: 'Choque leve en parachoques trasero.'
      },
      {
        id: '3',
        fecha: '2025-11-28',
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
      }
    ];

    // Aplicar filtros básicos
    let filtered = [...mockRecords];
    if (filters) {
      if (filters.estado && filters.estado !== 'all') {
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
    }

    const pagina = filters?.pagina || 1;
    const porPagina = filters?.por_pagina || 20;
    const start = (pagina - 1) * porPagina;
    const end = start + porPagina;

    return {
      datos: filtered.slice(start, end),
      total: filtered.length,
      pagina,
      por_pagina: porPagina,
      total_paginas: Math.ceil(filtered.length / porPagina)
    };
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
    return {
      recaudacion_periodo: 300000,
      registros_faltantes: 1,
      registros_con_incidentes: 1,
      total_registros: 3,
      registros_completos: 1,
      registros_pendientes: 1,
      periodo: {
        desde: '2025-11-01',
        hasta: '2025-11-28'
      }
    };
  }
}

