import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import {
  Alert,
  AlertCounts,
  DashboardAlerts,
  DashboardAlertSummary,
  DashboardAlertItem
} from '../models/dashboard.models';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  /**
   * Obtener resumen y lista de alertas para el dashboard
   * Endpoint: GET /api/alerts/summary
   */
  getAdminAlertsSummary(): Observable<DashboardAlerts> {
    return this.http.get<DashboardAlerts>(`${this.apiUrl}/api/alerts/summary`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo alertas:', error);
        // Retornar estructura vacía en caso de error
        return of({
          resumen: { criticas: 0, advertencias: 0, informativas: 0 },
          items: []
        });
      })
    );
  }

  /**
   * Obtener alertas personales de un trabajador
   * Endpoint: GET /api/alerts/my-alerts/{worker_id}
   */
  getWorkerAlerts(workerId: number): Observable<Alert[]> {
    return this.http.get<DashboardAlertItem[]>(`${this.apiUrl}/api/alerts/my-alerts/${workerId}`).pipe(
      map((items) => {
        // Convertir cada DashboardAlertItem a Alert
        return items.map(item => this.convertBackendAlertToFrontend(item));
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo alertas del trabajador:', error);
        // Retornar array vacío en caso de error
        return of([]);
      })
    );
  }

  /**
   * Obtener alertas convertidas al formato del frontend
   * Usa getAdminAlertsSummary() y filtra solo alertas activas
   */
  getAlerts(): Observable<Alert[]> {
    return new Observable(observer => {
      this.getAdminAlertsSummary().subscribe({
        next: (data) => {
          const alerts = data.items
            .filter(item => item.estado === 'activa') // Solo alertas activas
            .map(item => this.convertBackendAlertToFrontend(item));
          observer.next(alerts);
          observer.complete();
        },
        error: (error) => {
          console.error('Error obteniendo alertas:', error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }

  /**
   * Contar alertas por severidad
   * Usa los datos del summary para consistencia
   */
  getAlertCounts(): Observable<AlertCounts> {
    return new Observable(observer => {
      this.getAdminAlertsSummary().subscribe({
        next: (data) => {
          observer.next({
            critical: data.resumen.criticas,
            warning: data.resumen.advertencias,
            info: data.resumen.informativas
          });
          observer.complete();
        },
        error: () => {
          observer.next({ critical: 0, warning: 0, info: 0 });
          observer.complete();
        }
      });
    });
  }

  /**
   * Resolver una alerta individual
   * Endpoint: PATCH /api/alerts/{alert_id}/resolve
   */
  resolveAlert(alertId: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/api/alerts/${alertId}/resolve`,
      {}
    ).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 0) {
            return new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          throw error;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error resolviendo alerta:', error);
        // Re-lanzar el error para que el componente pueda manejarlo
        return throwError(() => error);
      })
    );
  }

  /**
   * Resolver todas las alertas de admin (bulk)
   * Endpoint: PATCH /api/alerts/admin/resolve-all
   */
  resolveAllAdminAlerts(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/api/alerts/admin/resolve-all`,
      {}
    ).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 0) {
            return new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          throw error;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error resolviendo todas las alertas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Convertir DashboardAlertItem del backend a Alert del frontend
   */
  private convertBackendAlertToFrontend(item: DashboardAlertItem): Alert {
    // Mapear severidad del backend al frontend (case-insensitive)
    // El backend puede enviar en mayúsculas o minúsculas
    const severityNormalized = (item.severidad || '').toUpperCase();
    const severityMap: Record<string, 'critical' | 'warning' | 'info' | 'success'> = {
      'CRITICA': 'critical',
      'ADVERTENCIA': 'warning',
      'INFORMATIVA': 'info'
    };

    // Determinar tipo basado en el tipo y origen
    let type: 'operational' | 'incident' | 'document' = 'operational';
    if (item.tipo === 'incidente_critico') {
      type = 'incident';
    } else if (item.origen_tipo === 'documento' || item.tipo.includes('documento')) {
      type = 'document';
    } else if (item.origen_tipo === 'registro_diario') {
      type = 'operational';
    }

    // Extraer información de máquina y chofer del mensaje
    const parsed = this.parseAlertMessage(item.mensaje, item.tipo);

    // Construir actionHref basado en el origen
    const actionHref = this.getActionHref(item);

    return {
      id: item.id.toString(),
      type: type,
      severity: severityMap[severityNormalized] || 'info',
      title: parsed.title,
      description: item.mensaje,
      machineId: parsed.machineId,
      driverName: parsed.driverName,
      date: item.created_at,
      actionLabel: this.getActionLabel(item.tipo, item.severidad),
      actionHref: actionHref,
      resolved: item.estado === 'resuelta',
      resolvedAt: item.estado === 'resuelta' ? item.created_at : undefined
    };
  }

  /**
   * Parsear el mensaje de la alerta para extraer información
   */
  private parseAlertMessage(mensaje: string, tipo: string): {
    title: string;
    machineId?: string;
    driverName?: string
  } {
    // Extraer número de máquina
    const machineMatch = mensaje.match(/Máquina\s+(\d+)/i) ||
      mensaje.match(/maquina\s+(\d+)/i) ||
      mensaje.match(/M(\d+)/i);

    // Extraer nombre del chofer (formato: "Nombre Apellido")
    const driverMatch = mensaje.match(/-?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/) ||
      mensaje.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/);

    // Extraer título
    let title = mensaje;
    if (tipo === 'incidente_critico') {
      title = '⚠️ Incidente Crítico';
    } else {
      // Caso especial: Falta registro con fecha (YYYY-MM-DD)
      // Ejemplo: "Falta registro del 2026-01-07"
      const missingRecordMatch = mensaje.match(/Falta registro del (\d{4}-\d{2}-\d{2})/);

      if (missingRecordMatch) {
        const [year, month, day] = missingRecordMatch[1].split('-');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthName = months[parseInt(month) - 1];
        title = `Falta registro del ${day} de ${monthName}`;
      } else {
        // Intentar extraer el título (primera parte antes de " - " o "Máquina")
        const titleMatch = mensaje.match(/^([^-]+?)(?:\s*-\s*|$)/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      }
    }

    return {
      title: title,
      machineId: machineMatch ? machineMatch[1] : undefined,
      driverName: driverMatch ? driverMatch[1].trim() : undefined
    };
  }

  /**
   * Obtener el label de la acción según el tipo y severidad
   */
  private getActionLabel(tipo: string, severidad: string): string {
    if (tipo === 'incidente_critico') {
      return 'Revisar Incidente';
    }
    const severityNormalized = (severidad || '').toUpperCase();
    if (severityNormalized === 'CRITICA') {
      return 'Resolver';
    }
    if (severityNormalized === 'ADVERTENCIA') {
      return 'Ver Detalle';
    }
    return 'Ver';
  }

  /**
   * Construir la URL de acción según el origen de la alerta
   */
  private getActionHref(item: DashboardAlertItem): string {
    // 1. Registros diarios (incidentes críticos o registros normales)
    if (item.origen_tipo === 'registro_diario') {
      return `/registro-diario/${item.origen_id}`;
    }

    // 2. Alertas de máquinas (documentos vencidos o por vencer)
    if (item.origen_tipo === 'maquina') {
      return `/maquinas/${item.origen_id}`;
    }

    // 3. Alertas de choferes (licencias, registros faltantes)
    if (item.origen_tipo === 'chofer') {
      return `/choferes/${item.origen_id}`;
    }

    // 4. Fallback para documentos (si existe este origen_tipo)
    if (item.origen_tipo === 'documento') {
      // Intentar extraer máquina del mensaje como fallback
      const machineMatch = item.mensaje.match(/Máquina\s+(\d+)/i);
      if (machineMatch) {
        return `/maquinas/${machineMatch[1]}`;
      }
      return '/maquinas';
    }

    // 5. Por defecto, ir al dashboard
    return '/dashboard';
  }

  // ========== Métodos legacy para compatibilidad ==========

  /**
   * DELETE /api/alerts/{id} - Eliminar una alerta (LEGACY)
   * Ahora usa resolveAlert internamente
   */
  deleteAlert(alertId: string): Observable<void> {
    return this.resolveAlert(parseInt(alertId)).pipe(
      map(() => undefined),
      catchError(() => {
        // En caso de error, retornar undefined para mantener compatibilidad
        return of(undefined);
      })
    );
  }

  /**
   * DELETE /api/alerts - Eliminar todas las alertas (LEGACY)
   * Ahora usa resolveAllAdminAlerts internamente
   */
  deleteAllAlerts(): Observable<void> {
    return this.resolveAllAdminAlerts().pipe(
      map(() => undefined),
      catchError(() => {
        // En caso de error, retornar undefined para mantener compatibilidad
        return of(undefined);
      })
    );
  }
}
