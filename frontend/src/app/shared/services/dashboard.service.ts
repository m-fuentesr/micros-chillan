import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Alert, DailyRecord, FinancialSummary } from '../models/dashboard.models';
import { DailyRecordService } from './daily-record.service';
import type { DailyRecord as UnifiedDailyRecord } from '../models/daily-record.models';

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
  private apiUrl = '/api'; // Ajustar según tu configuración

  /**
   * Obtener alertas del dashboard
   * Endpoint: GET /api/dashboard/alerts (según PDF)
   */
  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/dashboard/alerts`)
      .pipe(
        catchError(() => {
          // Mock temporal - en producción vendría del endpoint
          const alerts: Alert[] = [];
          return of(alerts);
        })
      );
  }

  /**
   * Obtener resumen financiero
   * Endpoint: GET /api/dashboard/financial-summary (según PDF "Endpoint Dashboard v1.1")
   */
  getFinancialSummary(mes: number, anio: number): Observable<FinancialSummary> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    
    return this.http.get<FinancialSummary>(`${this.apiUrl}/dashboard/financial-summary`, { params })
      .pipe(
        catchError(() => {
          // Fallback al endpoint de accounting si el de dashboard no existe
          return this.http.get<FinancialSummary>(`${this.apiUrl}/accounting/summary`, { params })
            .pipe(
              catchError(() => of(this.getMockFinancialSummary(mes, anio)))
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
              catchError(() => of(this.getMockFinancialDataByMachine()))
            );
        })
      );
  }

  /**
   * Obtener registros diarios (resumen para dashboard)
   * Usa DailyRecordService internamente y mapea a formato simplificado
   */
  getDailyRecords(fecha?: string): Observable<DailyRecord[]> {
    return this.dailyRecordService.getDailyRecords({ fecha }).pipe(
      map(response => {
        // Mapear desde el modelo unificado al formato simplificado del dashboard
        return response.datos.map(record => this.mapToDashboardDailyRecord(record));
      }),
      catchError(() => of(this.getMockDailyRecords()))
    );
  }

  /**
   * Mapear DailyRecord unificado a formato simplificado del dashboard
   */
  private mapToDashboardDailyRecord(record: UnifiedDailyRecord): DailyRecord {
    return {
      machineId: record.maquina_identificador || `Máquina ${record.maquina_id}`,
      driver: record.chofer_nombre || '',
      date: record.fecha,
      status: record.estado,
      recaudacion: record.recaudado,
      motivo: record.motivo_inactividad || undefined
    };
  }

  // ========== Mocks temporales ==========

  private getMockFinancialSummary(mes: number, anio: number): FinancialSummary {
    return {
      periodo: { mes, anio },
      totales: {
        total_recaudado: 15123456,
        total_costo_diesel: 4158024,
        total_pago_choferes: 2200000,
        ganancia_liquida: 8110432
      }
    };
  }

  private getMockFinancialDataByMachine(): any[] {
    return [
      { machineId: 'Máquina 01', driver: 'Juan Pérez', value: 2700000 },
      { machineId: 'Máquina 02', driver: 'Ana Gómez', value: 2600000 },
      { machineId: 'Máquina 03', driver: 'Luis Martínez', value: 2810544 }
    ];
  }

  private getMockDailyRecords(): DailyRecord[] {
    return [
      {
        machineId: 'Máquina 05',
        driver: 'Juan Pérez',
        date: '2025-11-28',
        status: 'COMPLETO',
        recaudacion: 120000
      },
      {
        machineId: 'Máquina 04',
        driver: 'Luis Martínez',
        date: '2025-11-28',
        status: 'INCIDENTE_REPORTADO',
        recaudacion: 85000
      },
      {
        machineId: 'Máquina 02',
        driver: 'Ana Gómez',
        date: '2025-11-28',
        status: 'PENDIENTE_TRABAJADOR',
        recaudacion: 95000
      }
    ];
  }
}

