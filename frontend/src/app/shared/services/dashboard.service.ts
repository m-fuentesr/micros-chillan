import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, Subject, EMPTY, throwError } from 'rxjs';
import { catchError, map, filter, tap, debounceTime, shareReplay } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Alert, DailyRecord, FinancialSummary, DashboardResponse } from '../models/dashboard.models';
import { DailyRecordService } from './daily-record.service';
import type { DailyRecord as UnifiedDailyRecord } from '../models/daily-record.models';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

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
  private router = inject(Router);
  private apiUrl = environment.apiBaseUrl;
  
  // ========== Signals para estado reactivo (nuevo endpoint /api/dashboard/overview) ==========
  private _dashboardData = signal<DashboardResponse | null>(null);
  public readonly dashboardData = this._dashboardData.asReadonly();
  
  // Signal para estado de conexión WebSocket
  private _isConnected = signal<boolean>(false);
  public readonly isConnected = this._isConnected.asReadonly();
  
  // Signal para errores de conexión
  private _connectionError = signal<string | null>(null);
  public readonly connectionError = this._connectionError.asReadonly();
  
  // WebSocket connection
  private socket$: WebSocketSubject<any> | null = null;
  private socketSubscription: any = null;
  
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

  // ========== Nuevos métodos para WebSocket y endpoint /api/dashboard/overview ==========

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
   * Conecta al WebSocket para recibir notificaciones de actualización
   * Implementa el patrón "Signal-Triggered Refetch"
   */
  connectToUpdates(): void {
    // Si ya hay una conexión activa, no crear otra
    if (this.socket$ && this._isConnected()) {
      console.log('WebSocket ya está conectado');
      return;
    }

    const token = this.authService.token;
    if (!token) {
      console.error('No hay token disponible para conectar WebSocket');
      this._connectionError.set('No hay sesión activa');
      return;
    }

    // Construir URL WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = this.apiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}//${wsHost}/api/dashboard/ws?token=${encodeURIComponent(token)}`;

    try {
      // Crear conexión WebSocket
      this.socket$ = webSocket({
        url: wsUrl,
        openObserver: {
          next: () => {
            console.log('WebSocket conectado');
            this._isConnected.set(true);
            this._connectionError.set(null);
          }
        },
        closeObserver: {
          next: (event: CloseEvent) => {
            console.log('WebSocket cerrado', event.code, event.reason);
            this._isConnected.set(false);
            
            // Si el cierre es por error de autenticación (código 1008), redirigir al login
            if (event.code === 1008) {
              this._connectionError.set('Sesión expirada. Redirigiendo al login...');
              setTimeout(() => {
                this.authService.logout().catch(() => {
                  this.router.navigateByUrl('/login');
                });
              }, 1000);
            } else if (event.code !== 1000) {
              // Cierre inesperado (no es normal), intentar reconectar después de un delay
              this._connectionError.set('Conexión perdida. Reintentando...');
              setTimeout(() => {
                if (!this._isConnected()) {
                  this.connectToUpdates();
                }
              }, 3000);
            }
          }
        }
      });

      // Suscribirse a mensajes del WebSocket
      this.socketSubscription = this.socket$.pipe(
        // Filtrar solo mensajes de tipo dashboard_refresh
        filter((msg: any) => msg && msg.type === 'dashboard_refresh'),
        // Debounce para evitar múltiples peticiones HTTP simultáneas
        debounceTime(500),
        // Disparar refetch cuando se recibe el mensaje
        tap(() => {
          console.log('⚡ Actualización recibida, recargando datos del dashboard...');
          this.fetchOverview();
        }),
        shareReplay(1)
      ).subscribe({
        next: () => {
          // El tap ya maneja la lógica
        },
        error: (error) => {
          console.error('Error en WebSocket:', error);
          this._isConnected.set(false);
          // El closeObserver ya maneja la reconexión, aquí solo registramos el error
        }
      });

      // Cargar datos iniciales
      this.fetchOverview();
    } catch (error) {
      console.error('Error al crear conexión WebSocket:', error);
      this._connectionError.set('Error al conectar con el servidor');
      this._isConnected.set(false);
    }
  }

  /**
   * Desconecta el WebSocket y limpia recursos
   */
  disconnect(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
      this.socketSubscription = null;
    }
    
    if (this.socket$) {
      try {
        this.socket$.complete();
      } catch (error) {
        console.warn('Error al cerrar WebSocket:', error);
      }
      this.socket$ = null;
    }
    
    this._isConnected.set(false);
    console.log('WebSocket desconectado');
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

