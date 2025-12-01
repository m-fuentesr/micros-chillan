import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Alert, AlertCounts } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  // Obtener todas las alertas (registros diarios + documentación)
  getAlerts(): Observable<Alert[]> {
    // En producción, esto combinaría alertas de registros diarios y documentación
    // Por ahora retornamos datos de ejemplo
    return of(this.generateMockAlerts());
  }

  // Contar alertas por severidad
  getAlertCounts(): Observable<AlertCounts> {
    return new Observable(observer => {
      this.getAlerts().subscribe(alerts => {
        const counts: AlertCounts = {
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length,
          info: alerts.filter(a => a.severity === 'info').length
        };
        observer.next(counts);
        observer.complete();
      });
    });
  }

  // DELETE /api/alerts/{id} - Eliminar una alerta
  deleteAlert(alertId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/alerts/${alertId}`).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          // Solo retry para errores de red (5xx, timeout)
          if (error.status >= 500 || error.status === 0) {
            return new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          throw error;
        }
      }),
      catchError(() => {
        // En desarrollo, simular éxito
        return of(undefined);
      })
    );
  }

  // DELETE /api/alerts - Eliminar todas las alertas
  deleteAllAlerts(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/alerts`).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 0) {
            return new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          throw error;
        }
      }),
      catchError(() => {
        // En desarrollo, simular éxito
        return of(undefined);
      })
    );
  }

  private generateMockAlerts(): Alert[] {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 10800000).toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const thirtyMinutesAgo = new Date(Date.now() - 1800000).toISOString();

    const todayDate = today.split('T')[0];
    const yesterdayDate = yesterday.split('T')[0];
    const twoDaysAgoDate = twoDaysAgo.split('T')[0];

    return [
      {
        id: 'record-worker-02-' + yesterdayDate,
        type: 'operational',
        severity: 'critical',
        title: 'Registro Incompleto - Máquina 02',
        description: `Falta completar información del trabajador para el registro del ${yesterdayDate}.`,
        machineId: '02',
        driverName: 'Ana Gómez',
        date: yesterday,
        actionLabel: 'Resolver',
        actionHref: `/registro-diario?maquina=02&fecha=${yesterdayDate}&estado=pending-trabajador&mode=edit`
      },
      {
        id: 'record-incidente-04-' + todayDate,
        type: 'incident',
        severity: 'critical',
        title: '⚠️ Incidente Crítico - Máquina 04',
        description: `El chofer reportó un incidente crítico. Revisar detalles del choque leve en parachoques trasero.`,
        machineId: '04',
        driverName: 'Luis Martínez',
        date: thirtyMinutesAgo,
        actionLabel: 'Revisar Incidente',
        actionHref: `/registro-diario?maquina=04&fecha=${todayDate}&estado=incidente&mode=edit`
      },
      {
        id: 'record-worker-05-' + twoDaysAgoDate,
        type: 'operational',
        severity: 'warning',
        title: 'Registro Pendiente - Máquina 05',
        description: `Registro del ${twoDaysAgoDate} pendiente de revisión. Falta firma del chofer.`,
        machineId: '05',
        driverName: 'Juan Pérez',
        date: twoDaysAgo,
        actionLabel: 'Completar Datos',
        actionHref: `/registro-diario?maquina=05&fecha=${twoDaysAgoDate}&estado=pending-trabajador&mode=edit`
      },
      {
        id: 'document-expiry-01',
        type: 'document',
        severity: 'warning',
        title: 'Documentación Próxima a Vencer',
        description: `Licencia de conducir de Carlos Rodríguez vence en 15 días. Renovar antes del vencimiento.`,
        machineId: '01',
        driverName: 'Carlos Rodríguez',
        date: oneHourAgo,
        actionLabel: 'Ver Documentos',
        actionHref: `/choferes/carlos-rodriguez/documentos`
      },
      {
        id: 'record-complete-03-' + todayDate,
        type: 'operational',
        severity: 'info',
        title: 'Registro Diario Completado',
        description: `El conductor completó el registro diario del ${todayDate}. Revisar y verificar.`,
        machineId: '03',
        driverName: 'María López',
        date: threeHoursAgo,
        actionLabel: 'Ver Registro',
        actionHref: `/registro-diario?maquina=03&fecha=${todayDate}&estado=completo&mode=view`
      },
      {
        id: 'record-worker-07-' + todayDate,
        type: 'operational',
        severity: 'warning',
        title: 'Registro Incompleto - Máquina 07',
        description: `Falta información de recaudación del día ${todayDate}.`,
        machineId: '07',
        driverName: 'Pedro Gómez',
        date: oneHourAgo,
        actionLabel: 'Completar',
        actionHref: `/registro-diario?maquina=07&fecha=${todayDate}&estado=pending-trabajador&mode=edit`
      },
      {
        id: 'record-complete-06-' + todayDate,
        type: 'operational',
        severity: 'info',
        title: 'Registro Diario Completado',
        description: `El conductor registró el registro diario del ${todayDate}. Listo para revisión.`,
        machineId: '06',
        driverName: 'María López',
        date: oneHourAgo,
        actionLabel: 'Ver Registro',
        actionHref: `/registro-diario?maquina=06&fecha=${todayDate}&estado=completo&mode=view`
      },
      {
        id: 'record-complete-01-' + todayDate,
        type: 'operational',
        severity: 'success',
        title: 'Registro Completado Exitosamente',
        description: `Registro del ${todayDate} completado y verificado correctamente.`,
        machineId: '01',
        driverName: 'Carlos Rodríguez',
        date: yesterday,
        actionLabel: 'Ver Detalle',
        actionHref: `/registro-diario?maquina=01&fecha=${todayDate}&estado=completo&mode=view`,
        resolved: true,
        resolvedAt: yesterday
      },
      {
        id: 'record-complete-03-' + yesterdayDate,
        type: 'operational',
        severity: 'success',
        title: 'Registro Verificado',
        description: `Registro del ${yesterdayDate} verificado y cerrado.`,
        machineId: '03',
        driverName: 'María López',
        date: twoDaysAgo,
        actionLabel: 'Ver Historial',
        actionHref: `/registro-diario?maquina=03&fecha=${yesterdayDate}&estado=completo&mode=view`,
        resolved: true,
        resolvedAt: yesterday
      }
    ];
  }
}

