import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert, DailyRecord, FinancialSummary } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api'; // Ajustar según tu configuración

  // Obtener alertas del dashboard
  getAlerts(): Observable<Alert[]> {
    // En producción, esto vendría de un endpoint real
    // Por ahora retornamos un observable con datos de ejemplo
    return new Observable(observer => {
      // Simular datos basados en registros diarios y documentación
      const alerts: Alert[] = [];
      observer.next(alerts);
      observer.complete();
    });
  }

  // Obtener resumen financiero
  getFinancialSummary(mes: number, anio: number): Observable<FinancialSummary> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    
    return this.http.get<FinancialSummary>(`${this.apiUrl}/accounting/summary`, { params });
  }

  // Obtener datos financieros por máquina (para el gráfico)
  getFinancialDataByMachine(mes: number, anio: number, metric: 'Ganancia Neta' | 'Ingreso Total'): Observable<any[]> {
    // Este endpoint no está documentado, pero podemos calcularlo desde el summary
    // o crear un endpoint específico
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    
    return this.http.get<any[]>(`${this.apiUrl}/accounting/machines`, { params });
  }

  // Obtener registros diarios
  getDailyRecords(fecha?: string): Observable<DailyRecord[]> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<DailyRecord[]>(`${this.apiUrl}/daily-records`, { params });
  }
}

