import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Filtros para reporte de rentabilidad
 */
export interface ProfitabilityFilters {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  maquina_id?: number;
  chofer_id?: number;
  agrupado_por?: 'dia' | 'semana' | 'mes';
}

/**
 * Datos de rentabilidad por período
 */
export interface ProfitabilityData {
  fecha: string; // YYYY-MM-DD o período
  ingresos: number;
  egresos: number;
  ganancia: number;
  margen_ganancia: number; // Porcentaje
}

/**
 * Reporte de rentabilidad completo
 */
export interface ProfitabilityReport {
  periodo: {
    desde: string;
    hasta: string;
  };
  totales: {
    total_ingresos: number;
    total_egresos: number;
    ganancia_neta: number;
    margen_ganancia: number;
  };
  datos: ProfitabilityData[];
  por_maquina?: {
    maquina_id: number;
    maquina_identificador: string;
    ingresos: number;
    egresos: number;
    ganancia: number;
  }[];
  por_chofer?: {
    chofer_id: number;
    chofer_nombre: string;
    ingresos: number;
    egresos: number;
    ganancia: number;
  }[];
}

/**
 * Filtros para ranking
 */
export interface RankingFilters {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  orden_por?: 'recaudado' | 'ganancia' | 'dias_trabajados';
  orden?: 'asc' | 'desc';
  limite?: number;
}

/**
 * Ranking de choferes
 */
export interface DriverRanking {
  posicion: number;
  chofer_id: number;
  chofer_nombre: string;
  maquina_identificador?: string;
  total_recaudado: number;
  total_ganancia: number;
  dias_trabajados: number;
  promedio_diario: number;
}

/**
 * Ranking de máquinas
 */
export interface MachineRanking {
  posicion: number;
  maquina_id: number;
  maquina_identificador: string;
  total_recaudado: number;
  total_ganancia: number;
  dias_operativos: number;
  promedio_diario: number;
  choferes_asignados: number;
}

/**
 * Servicio para reportes
 * Endpoints según PDF "Módulo Reportes v1.1"
 */
@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = '/api'; // Ajustar según configuración

  /**
   * Obtener reporte de rentabilidad
   * Endpoint: GET /api/reports/profitability
   */
  getProfitabilityReport(filters: ProfitabilityFilters): Observable<ProfitabilityReport> {
    let params = new HttpParams();
    
    if (filters.desde) params = params.set('desde', filters.desde);
    if (filters.hasta) params = params.set('hasta', filters.hasta);
    if (filters.maquina_id) params = params.set('maquina_id', filters.maquina_id.toString());
    if (filters.chofer_id) params = params.set('chofer_id', filters.chofer_id.toString());
    if (filters.agrupado_por) params = params.set('agrupado_por', filters.agrupado_por);

    return this.http.get<ProfitabilityReport>(`${this.apiUrl}/reports/profitability`, { params })
      .pipe(
        catchError(() => of(this.getMockProfitabilityReport(filters)))
      );
  }

  /**
   * Obtener ranking de choferes
   * Endpoint: GET /api/reports/driver-ranking
   */
  getDriverRanking(filters: RankingFilters): Observable<DriverRanking[]> {
    let params = new HttpParams();
    
    if (filters.desde) params = params.set('desde', filters.desde);
    if (filters.hasta) params = params.set('hasta', filters.hasta);
    if (filters.orden_por) params = params.set('orden_por', filters.orden_por);
    if (filters.orden) params = params.set('orden', filters.orden);
    if (filters.limite) params = params.set('limite', filters.limite.toString());

    return this.http.get<DriverRanking[]>(`${this.apiUrl}/reports/driver-ranking`, { params })
      .pipe(
        catchError(() => of(this.getMockDriverRanking(filters)))
      );
  }

  /**
   * Obtener ranking de máquinas
   * Endpoint: GET /api/reports/machine-ranking
   */
  getMachineRanking(filters: RankingFilters): Observable<MachineRanking[]> {
    let params = new HttpParams();
    
    if (filters.desde) params = params.set('desde', filters.desde);
    if (filters.hasta) params = params.set('hasta', filters.hasta);
    if (filters.orden_por) params = params.set('orden_por', filters.orden_por);
    if (filters.orden) params = params.set('orden', filters.orden);
    if (filters.limite) params = params.set('limite', filters.limite.toString());

    return this.http.get<MachineRanking[]>(`${this.apiUrl}/reports/machine-ranking`, { params })
      .pipe(
        catchError(() => of(this.getMockMachineRanking(filters)))
      );
  }

  /**
   * Exportar reporte
   * Endpoint: GET /api/reports/export
   */
  exportReport(type: string, filters: any): Observable<Blob> {
    let params = new HttpParams().set('tipo', type);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get(`${this.apiUrl}/reports/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(() => {
        // Retornar un blob vacío en caso de error
        return of(new Blob());
      })
    );
  }

  // ========== Mocks temporales (para desarrollo) ==========

  private getMockProfitabilityReport(filters: ProfitabilityFilters): ProfitabilityReport {
    const desde = filters.desde || '2025-11-01';
    const hasta = filters.hasta || '2025-11-28';

    return {
      periodo: { desde, hasta },
      totales: {
        total_ingresos: 15123456,
        total_egresos: 7012912,
        ganancia_neta: 8110544,
        margen_ganancia: 53.6
      },
      datos: [
        { fecha: '2025-11-01', ingresos: 450000, egresos: 180000, ganancia: 270000, margen_ganancia: 60 },
        { fecha: '2025-11-02', ingresos: 520000, egresos: 200000, ganancia: 320000, margen_ganancia: 61.5 },
        { fecha: '2025-11-03', ingresos: 480000, egresos: 190000, ganancia: 290000, margen_ganancia: 60.4 }
      ],
      por_maquina: [
        { maquina_id: 1, maquina_identificador: 'Máquina 01', ingresos: 5000000, egresos: 2300000, ganancia: 2700000 },
        { maquina_id: 2, maquina_identificador: 'Máquina 02', ingresos: 4800000, egresos: 2200000, ganancia: 2600000 },
        { maquina_id: 3, maquina_identificador: 'Máquina 03', ingresos: 5323456, egresos: 2512912, ganancia: 2810544 }
      ],
      por_chofer: [
        { chofer_id: 1, chofer_nombre: 'Juan Pérez', ingresos: 3500000, egresos: 1600000, ganancia: 1900000 },
        { chofer_id: 2, chofer_nombre: 'Luis Martínez', ingresos: 3200000, egresos: 1500000, ganancia: 1700000 },
        { chofer_id: 3, chofer_nombre: 'Ana Gómez', ingresos: 3000000, egresos: 1400000, ganancia: 1600000 }
      ]
    };
  }

  private getMockDriverRanking(filters: RankingFilters): DriverRanking[] {
    return [
      {
        posicion: 1,
        chofer_id: 1,
        chofer_nombre: 'Juan Pérez',
        maquina_identificador: 'Máquina 05',
        total_recaudado: 3500000,
        total_ganancia: 1900000,
        dias_trabajados: 25,
        promedio_diario: 140000
      },
      {
        posicion: 2,
        chofer_id: 2,
        chofer_nombre: 'Luis Martínez',
        maquina_identificador: 'Máquina 04',
        total_recaudado: 3200000,
        total_ganancia: 1700000,
        dias_trabajados: 24,
        promedio_diario: 133333
      },
      {
        posicion: 3,
        chofer_id: 3,
        chofer_nombre: 'Ana Gómez',
        maquina_identificador: 'Máquina 02',
        total_recaudado: 3000000,
        total_ganancia: 1600000,
        dias_trabajados: 23,
        promedio_diario: 130435
      }
    ];
  }

  private getMockMachineRanking(filters: RankingFilters): MachineRanking[] {
    return [
      {
        posicion: 1,
        maquina_id: 3,
        maquina_identificador: 'Máquina 03',
        total_recaudado: 5323456,
        total_ganancia: 2810544,
        dias_operativos: 26,
        promedio_diario: 204748,
        choferes_asignados: 2
      },
      {
        posicion: 2,
        maquina_id: 1,
        maquina_identificador: 'Máquina 01',
        total_recaudado: 5000000,
        total_ganancia: 2700000,
        dias_operativos: 25,
        promedio_diario: 200000,
        choferes_asignados: 1
      },
      {
        posicion: 3,
        maquina_id: 2,
        maquina_identificador: 'Máquina 02',
        total_recaudado: 4800000,
        total_ganancia: 2600000,
        dias_operativos: 24,
        promedio_diario: 200000,
        choferes_asignados: 1
      }
    ];
  }
}

