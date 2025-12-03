import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { WorkerProfile, WorkerStatsResponse } from '../models/worker.models';
import { environment } from '../../../environments/environment.development';

/**
 * Servicio para gestión del módulo del trabajador
 * Endpoints según PDF "Módulo del Trabajador"
 */
@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Sistema de caché
  private profileCache: WorkerProfile | null = null;
  private statsCache: Map<string, WorkerStatsResponse> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtener perfil del trabajador logueado
   * Endpoint: GET /api/worker/profile
   * @param forceRefresh Si es true, fuerza la recarga desde el backend
   */
  getProfile(forceRefresh = false): Observable<WorkerProfile> {
    const cacheKey = 'profile';
    const now = Date.now();
    const cachedTimestamp = this.cacheTimestamps.get(cacheKey) || 0;

    // Verificar caché válido
    if (!forceRefresh && this.profileCache && (now - cachedTimestamp) < this.CACHE_TTL) {
      return of(this.profileCache);
    }

    return this.http.get<WorkerProfile>(`${this.apiUrl}/api/worker/profile`)
      .pipe(
        tap((profile) => {
          // Guardar en caché después de respuesta exitosa
          this.profileCache = profile;
          this.cacheTimestamps.set(cacheKey, now);
        }),
        shareReplay(1), // Compartir el observable entre múltiples suscriptores
        catchError((error) => {
          console.error('Error obteniendo perfil del trabajador:', error);
          // Si hay caché, retornarlo aunque esté expirado
          if (this.profileCache) {
            return of(this.profileCache);
          }
          // Retornar perfil vacío en caso de error
          return of({
            nombre_completo: 'Trabajador',
            rut: '',
            telefono: '',
            email: '',
            maquina_detalle: null,
            fecha_ingreso: '--/--/----'
          });
        })
      );
  }

  /**
   * Obtener estadísticas mensuales del trabajador
   * Endpoint: GET /api/worker/monthly-stats
   * @param mes Mes opcional (1-12). Si no se proporciona, usa el mes actual
   * @param anio Año opcional. Si no se proporciona, usa el año actual
   * @param forceRefresh Si es true, fuerza la recarga desde el backend
   */
  getMonthlyStats(mes?: number, anio?: number, forceRefresh = false): Observable<WorkerStatsResponse> {
    const hoy = new Date();
    const mesFinal = mes || hoy.getMonth() + 1;
    const anioFinal = anio || hoy.getFullYear();
    const cacheKey = `stats-${mesFinal}-${anioFinal}`;
    const now = Date.now();
    const cachedTimestamp = this.cacheTimestamps.get(cacheKey) || 0;

    // Verificar caché válido
    if (!forceRefresh && this.statsCache.has(cacheKey) && (now - cachedTimestamp) < this.CACHE_TTL) {
      return of(this.statsCache.get(cacheKey)!);
    }

    let params = new HttpParams();
    
    if (mes !== undefined && mes !== null) {
      params = params.set('mes', mes.toString());
    }
    
    if (anio !== undefined && anio !== null) {
      params = params.set('anio', anio.toString());
    }

    return this.http.get<WorkerStatsResponse>(`${this.apiUrl}/api/worker/monthly-stats`, { params })
      .pipe(
        tap((stats) => {
          // Guardar en caché después de respuesta exitosa
          this.statsCache.set(cacheKey, stats);
          this.cacheTimestamps.set(cacheKey, now);
        }),
        shareReplay(1), // Compartir el observable entre múltiples suscriptores
        catchError((error) => {
          console.error('Error obteniendo estadísticas mensuales:', error);
          // Si hay caché, retornarlo aunque esté expirado
          if (this.statsCache.has(cacheKey)) {
            return of(this.statsCache.get(cacheKey)!);
          }
          // Retornar estadísticas vacías en caso de error
          return of({
            periodo: {
              mes: mesFinal,
              anio: anioFinal
            },
            estadisticas: {
              dias_trabajados: 0,
              total_recaudado: 0
            }
          });
        })
      );
  }

  /**
   * Invalidar caché del servicio
   * @param type Tipo de caché a invalidar: 'profile', 'stats', o 'all'
   */
  invalidateCache(type: 'profile' | 'stats' | 'all' = 'all'): void {
    if (type === 'profile' || type === 'all') {
      this.profileCache = null;
      this.cacheTimestamps.delete('profile');
    }
    if (type === 'stats' || type === 'all') {
      this.statsCache.clear();
      // Limpiar timestamps de stats
      const statsKeys = Array.from(this.cacheTimestamps.keys()).filter(key => key.startsWith('stats-'));
      statsKeys.forEach(key => this.cacheTimestamps.delete(key));
    }
  }
}

