import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, EMPTY, throwError, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Alert, DailyRecord, FinancialSummary, DashboardResponse } from '../models/dashboard.models';
import { DailyRecordService } from './daily-record.service';
import type { DailyRecord as UnifiedDailyRecord } from '../models/daily-record.models';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth.service';

/**
 * Servicio para el Dashboard
 * Endpoints según PDF "Endpoint Dashboard v1.1"
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private dailyRecordService = inject(DailyRecordService);
  private authService = inject(AuthService);
  private apiUrl = environment.apiBaseUrl;

  // ========== Signals para estado reactivo (nuevo endpoint /api/dashboard/overview) ==========
  private _dashboardData = signal<DashboardResponse | null>(null);
  public readonly dashboardData = this._dashboardData.asReadonly();

  // Signal para registros diarios con timestamps
  private _dailyRecords = signal<DailyRecord[]>([]);
  public readonly dailyRecords = this._dailyRecords.asReadonly();

  // Track de IDs con valores actualizados (para value flash animation)
  private _updatedValueIds = signal<Set<number>>(new Set());
  public readonly updatedValueIds = this._updatedValueIds.asReadonly();

  // Signal para estado de conexión Realtime
  private _isConnected = signal<boolean>(false);
  public readonly isConnected = this._isConnected.asReadonly();

  // Signal para errores de conexión
  private _connectionError = signal<string | null>(null);
  public readonly connectionError = this._connectionError.asReadonly();

  // Supabase Realtime channel
  private realtimeChannel: RealtimeChannel | null = null;

  // Caché simple en memoria (para métodos legacy)
  private alertsCache: { data: Alert[]; timestamp: number } | null = null;
  private financialSummaryCache: Map<string, { data: FinancialSummary; timestamp: number }> = new Map();
  private dailyRecordsCache: Map<string, { data: DailyRecord[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtener alertas del dashboard
   * Endpoint: GET /api/dashboard/alerts (según PDF)
   */
  getAlerts(): Observable<Alert[]> {
    // Verificar caché
    if (this.alertsCache && Date.now() - this.alertsCache.timestamp < this.CACHE_TTL) {
      return of(this.alertsCache.data);
    }

    return this.http.get<Alert[]>(`${this.apiUrl}/dashboard/alerts`)
      .pipe(
        map(alerts => {
          // Guardar en caché
          this.alertsCache = { data: alerts, timestamp: Date.now() };
          return alerts;
        }),
        catchError(() => {
          // Mock temporal - en producción vendría del endpoint
          const alerts: Alert[] = [];
          this.alertsCache = { data: alerts, timestamp: Date.now() };
          return of(alerts);
        })
      );
  }

  /**
   * Obtener resumen financiero
   * Endpoint: GET /api/dashboard/financial-summary (según PDF "Endpoint Dashboard v1.1")
   */
  getFinancialSummary(mes: number, anio: number): Observable<FinancialSummary> {
    const cacheKey = `${mes}-${anio}`;

    // Verificar caché
    const cached = this.financialSummaryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }

    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.get<FinancialSummary>(`${this.apiUrl}/dashboard/financial-summary`, { params })
      .pipe(
        map(summary => {
          // Guardar en caché
          this.financialSummaryCache.set(cacheKey, { data: summary, timestamp: Date.now() });
          return summary;
        }),
        catchError(() => {
          // Fallback al endpoint de accounting si el de dashboard no existe
          return this.http.get<FinancialSummary>(`${this.apiUrl}/accounting/summary`, { params })
            .pipe(
              map(summary => {
                this.financialSummaryCache.set(cacheKey, { data: summary, timestamp: Date.now() });
                return summary;
              }),
              catchError((error) => {
                console.error('Error obteniendo resumen financiero:', error);
                return throwError(() => error);
              })
            );
        })
      );
  }

  /**
   * Obtener datos financieros por máquina (para el gráfico)
   * Endpoint: GET /api/dashboard/financial-by-machine (según PDF)
   */
  getFinancialDataByMachine(mes: number, anio: number, metric: 'Ganancia Neta' | 'Ingreso Total'): Observable<any[]> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString())
      .set('metrica', metric === 'Ganancia Neta' ? 'ganancia_neta' : 'ingreso_total');

    return this.http.get<any[]>(`${this.apiUrl}/dashboard/financial-by-machine`, { params })
      .pipe(
        catchError(() => {
          // Fallback al endpoint de accounting si el de dashboard no existe
          return this.http.get<any[]>(`${this.apiUrl}/accounting/machines`, { params })
            .pipe(
              catchError((error) => {
                console.error('Error obteniendo datos financieros por máquina:', error);
                return throwError(() => error);
              })
            );
        })
      );
  }

  /**
   * Obtener registros diarios (resumen para dashboard)
   * Usa DailyRecordService internamente y mapea a formato simplificado
   */
  getDailyRecords(fecha?: string): Observable<DailyRecord[]> {
    const cacheKey = fecha || 'all';

    // Verificar caché
    const cached = this.dailyRecordsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }

    return this.dailyRecordService.getDailyRecords({ fecha }).pipe(
      map(response => {
        // Mapear desde el modelo unificado al formato simplificado del dashboard
        if (!response || !response.datos || !Array.isArray(response.datos)) {
          // Si la respuesta no tiene datos válidos, retornar array vacío
          const empty: DailyRecord[] = [];
          this.dailyRecordsCache.set(cacheKey, { data: empty, timestamp: Date.now() });
          return empty;
        }
        const records = response.datos.map(record => this.mapToDashboardDailyRecord(record));
        // Guardar en caché
        this.dailyRecordsCache.set(cacheKey, { data: records, timestamp: Date.now() });
        return records;
      }),
      catchError((error) => {
        console.error('Error al cargar registros diarios:', error);
        const empty: DailyRecord[] = [];
        this.dailyRecordsCache.set(cacheKey, { data: empty, timestamp: Date.now() });
        return of(empty);
      })
    );
  }

  /**
   * Invalidar caché (útil cuando se actualizan datos)
   */
  clearCache(): void {
    this.alertsCache = null;
    this.financialSummaryCache.clear();
    this.dailyRecordsCache.clear();
  }

  // ========== Nuevos métodos para Realtime y endpoint /api/dashboard/overview ==========

  /**
   * Obtiene los datos del dashboard del día actual desde el endpoint /api/dashboard/overview
   * Este método actualiza el Signal dashboardData que los componentes pueden consumir
   */
  fetchOverview(): void {
    this.http.get<DashboardResponse>(`${this.apiUrl}/api/dashboard/overview`)
      .pipe(
        catchError((error) => {
          console.error('Error al obtener datos del dashboard:', error);
          // No actualizar el signal si hay error, mantener datos anteriores
          return EMPTY;
        })
      )
      .subscribe({
        next: (data) => {
          this._dashboardData.set(data);
          this._connectionError.set(null);
        },
        error: (error) => {
          console.error('Error en fetchOverview:', error);
          this._connectionError.set('Error al cargar datos del dashboard');
        }
      });
  }

  /**
   * Obtiene los registros diarios del día actual desde el endpoint /api/dashboard/daily-records
   * Este método actualiza el Signal dailyRecords y detecta nuevos registros para animaciones
   */
  private async fetchDailyRecords(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ total: number; items: any[] }>(
          `${this.apiUrl}/api/dashboard/daily-records`
        )
      );

      const records: DailyRecord[] = response.items.map(item => ({
        id: item.registro_id?.toString() || item.chofer?.id?.toString() || '',
        machineId: item.maquina?.numero_interno?.toString() || item.maquina?.id?.toString() || 'N/A',
        driver: item.chofer?.nombre?.trim() || 'Sin asignar',
        date: item.fecha,
        status: item.estado?.toUpperCase() || 'EN_ESPERA',
        recaudacion: item.monto_recaudado,
        puedeVerDetalle: item.puede_ver_detalle ?? false
      }));

      // Detectar valores actualizados (recaudación cambió)
      const updatedValueIds = new Set<number>();
      const previousRecords = this._dailyRecords();

      if (previousRecords.length > 0) {
        records.forEach(record => {
          const prevRecord = previousRecords.find(r => r.id === record.id);
          if (prevRecord && prevRecord.recaudacion !== record.recaudacion) {
            const id = parseInt(record.id);
            if (!isNaN(id)) updatedValueIds.add(id);
          }
        });
      }

      this._dailyRecords.set(records);
      this._updatedValueIds.set(updatedValueIds);

      // Limpiar IDs actualizados después de 3 segundos (para la animación)
      if (updatedValueIds.size > 0) {
        setTimeout(() => {
          this._updatedValueIds.set(new Set());
        }, 3000);
      }
    } catch (error) {
      console.error('Error cargando registros diarios:', error);
    }
  }

  /**
   * Conecta a Supabase Realtime para recibir notificaciones de actualización
   * Implementa el patrón "Signal-Triggered Refetch" usando postgres_changes."
   */
  connectToUpdates(): void {
    const user = this.authService.currentUser();

    // Solo administradores pueden iniciar la suscripción Realtime
    if (!user || user.role !== 'admin') {
      this._isConnected.set(false);
      this._connectionError.set('Solo administradores pueden recibir actualizaciones en tiempo real');
      return;
    }
    
    // Evitar suscripciones duplicadas
    if (this.realtimeChannel) {
      console.log('Suscripción Realtime ya está activa');
      return;
    }

    const supabase = this.authService.supabase;

    const channel = supabase
      .channel('dashboard-registros')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registros_diarios' },
        (payload) => {
          console.log('📦 Payload Realtime completo:', payload);

          this.fetchOverview();
          this.fetchDailyRecords();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this._isConnected.set(true);
          this._connectionError.set(null);
          console.log('Suscripción a Realtime establecida');
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this._isConnected.set(false);
          this._connectionError.set('Error en la suscripción Realtime');
        }

        if (status === 'CLOSED') {
          this._isConnected.set(false);
        }
      });

    this.realtimeChannel = channel;

    // Cargar datos iniciales
    this.fetchOverview();
    this.fetchDailyRecords();
  }

  /**
   * Desconecta el canal Realtime y limpia recursos
   */
  disconnect(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe().catch((error) => {
        console.warn('Error al cerrar Realtime:', error);
      });
      this.realtimeChannel = null;
    }

    this._isConnected.set(false);
    console.log('Suscripción Realtime desconectada');
  }

  /**
   * Mapear DailyRecord unificado a formato simplificado del dashboard
   */
  private mapToDashboardDailyRecord(record: UnifiedDailyRecord): DailyRecord {
    return {
      id: record.id,
      machineId: record.maquina_identificador || `Máquina ${record.maquina_id}`,
      driver: record.chofer_nombre || '',
      date: record.fecha,
      status: record.estado,
      recaudacion: record.recaudado,
      motivo: record.motivo_inactividad || undefined
    };
  }

}

