import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AccountingSummary, DailyProfitabilityData, WeeklySummary, LiquidationPeriod, ClosedLiquidation } from '../models/accounting.models';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;
  
  // Caché simple en memoria
  private summaryCache: Map<string, { data: AccountingSummary; timestamp: number }> = new Map();
  private dailyProfitabilityCache: Map<string, { data: DailyProfitabilityData[]; timestamp: number }> = new Map();
  private weeklySummaryCache: Map<string, { data: WeeklySummary[]; timestamp: number }> = new Map();
  private liquidationCache: Map<string, { data: LiquidationPeriod; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // GET /api/accounting/summary - Resumen general (RF-019)
  getSummary(mes: number, anio: number): Observable<AccountingSummary> {
    const cacheKey = `${mes}-${anio}`;
    
    // Verificar caché
    const cached = this.summaryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }
    
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    
    return this.http.get<AccountingSummary>(`${this.apiUrl}/accounting/summary`, { params }).pipe(
      map(summary => {
        this.summaryCache.set(cacheKey, { data: summary, timestamp: Date.now() });
        return summary;
      }),
      catchError(() => {
        // Mock data
        const today = new Date();
        const isCurrentMonth = mes === today.getMonth() + 1 && anio === today.getFullYear();
        const mock = {
          periodo: { mes, anio },
          totales: {
            total_recaudado: 15123456,
            total_costo_diesel: 4158024,
            total_pago_choferes: 2200000,
            total_gastos_mantenimiento: 655000,
            ganancia_liquida: 8110432
          },
          es_mes_actual: isCurrentMonth
        };
        this.summaryCache.set(cacheKey, { data: mock, timestamp: Date.now() });
        return of(mock);
      })
    );
  }

  // GET /api/accounting/daily-profitability - Evolución diaria
  getDailyProfitability(mes: number, anio: number): Observable<DailyProfitabilityData[]> {
    const cacheKey = `${mes}-${anio}`;
    
    // Verificar caché
    const cached = this.dailyProfitabilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }
    
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    
    return this.http.get<DailyProfitabilityData[]>(`${this.apiUrl}/accounting/daily-profitability`, { params }).pipe(
      map(data => {
        this.dailyProfitabilityCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }),
      catchError(() => {
        // Mock data - 30 días
        const mockData: DailyProfitabilityData[] = [];
        for (let i = 1; i <= 30; i++) {
          mockData.push({
            fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
            ingresos: 510000 + Math.random() * 50000,
            egresos: 210000 + Math.random() * 30000,
            ganancia: 300000 + Math.random() * 20000
          });
        }
        this.dailyProfitabilityCache.set(cacheKey, { data: mockData, timestamp: Date.now() });
        return of(mockData);
      })
    );
  }

  // GET /api/accounting/weekly-summary - Resumen semanal
  getWeeklySummary(mes: number, anio: number): Observable<WeeklySummary[]> {
    const cacheKey = `${mes}-${anio}`;
    
    // Verificar caché
    const cached = this.weeklySummaryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }
    
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    
    return this.http.get<WeeklySummary[]>(`${this.apiUrl}/accounting/weekly-summary`, { params }).pipe(
      map(data => {
        this.weeklySummaryCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }),
      catchError(() => {
        const mock = this.getMockWeeklySummary(mes, anio);
        this.weeklySummaryCache.set(cacheKey, { data: mock, timestamp: Date.now() });
        return of(mock);
      })
    );
  }

  // GET /api/accounting/weekly-liquidation - Liquidación semanal de choferes
  getWeeklyLiquidation(semana: number, mes: number, anio: number, choferId?: number): Observable<LiquidationPeriod> {
    const cacheKey = choferId ? `${semana}-${mes}-${anio}-${choferId}` : `${semana}-${mes}-${anio}`;
    
    // Verificar caché
    const cached = this.liquidationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }
    
    const params = new HttpParams()
      .set('semana', semana.toString())
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    if (choferId) {
      params.set('chofer_id', choferId.toString());
    }
    
    return this.http.get<LiquidationPeriod>(`${this.apiUrl}/accounting/weekly-liquidation`, { params }).pipe(
      map(data => {
        this.liquidationCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }),
      catchError(() => {
        // Mock data - calcular si es última semana
        const daysInMonth = new Date(anio, mes, 0).getDate();
        const firstDay = new Date(anio, mes - 1, 1).getDay();
        const weeksInMonth = Math.ceil((daysInMonth + firstDay) / 7);
        // Si la semana es 4, siempre es última (mes anterior tiene 4 semanas)
        // O si la semana coincide con el total de semanas del mes (mes actual)
        const esUltimaSemana = semana === 4 || semana === weeksInMonth;
        
        // Calcular fechas de la semana
        const fechaInicio = new Date(anio, mes - 1, 1 + (semana - 1) * 7);
        const fechaFin = new Date(anio, mes - 1, Math.min(1 + (semana - 1) * 7 + 6, daysInMonth));
        
        const mock: LiquidationPeriod = {
          semana,
          mes,
          anio,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          es_ultima_semana: esUltimaSemana,
          estado: 'abierto' as const,
          choferes: [
            {
              chofer_id: 1,
              chofer_nombre: 'Juan Pérez',
              total_ganado: esUltimaSemana ? 50000 : 120000, // Menos en última semana para ejemplo
              acumulado_mensual: esUltimaSemana ? 380000 : undefined, // Solo en última semana
              minimo_garantizado: 400000,
              monto_a_completar: esUltimaSemana ? 20000 : 0,
              pago_final: esUltimaSemana ? 70000 : 120000,
              aplicar_garantizado: esUltimaSemana,
              estado_pago: 'pendiente' as const
            },
            {
              chofer_id: 2,
              chofer_nombre: 'Pedro López',
              total_ganado: esUltimaSemana ? 45000 : 100000,
              acumulado_mensual: esUltimaSemana ? 350000 : undefined,
              minimo_garantizado: 400000,
              monto_a_completar: esUltimaSemana ? 50000 : 0,
              pago_final: esUltimaSemana ? 95000 : 100000,
              aplicar_garantizado: esUltimaSemana,
              estado_pago: 'pendiente' as const
            },
            {
              chofer_id: 3,
              chofer_nombre: 'María Gómez',
              total_ganado: esUltimaSemana ? 60000 : 110000,
              acumulado_mensual: esUltimaSemana ? 420000 : undefined, // Ya alcanzó el mínimo
              minimo_garantizado: 400000,
              monto_a_completar: 0,
              pago_final: esUltimaSemana ? 60000 : 110000,
              aplicar_garantizado: false,
              estado_pago: 'pendiente' as const
            }
          ]
        };
        this.liquidationCache.set(cacheKey, { data: mock, timestamp: Date.now() });
        return of(mock);
      })
    );
  }

  // GET /api/accounting/liquidation - Liquidación de choferes (RF-022) - DEPRECATED: usar getWeeklyLiquidation
  getLiquidation(mes: number, anio: number, choferId?: number): Observable<LiquidationPeriod> {
    const cacheKey = choferId ? `${mes}-${anio}-${choferId}` : `${mes}-${anio}`;
    
    // Verificar caché
    const cached = this.liquidationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);
    }
    
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());
    if (choferId) {
      params.set('chofer_id', choferId.toString());
    }
    
    return this.http.get<LiquidationPeriod>(`${this.apiUrl}/accounting/liquidation`, { params }).pipe(
      map(data => {
        this.liquidationCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }),
      catchError(() => {
        // Mock data - método deprecated, usar getWeeklyLiquidation
        const daysInMonth = new Date(anio, mes, 0).getDate();
        const firstDay = new Date(anio, mes - 1, 1).getDay();
        const weeksInMonth = Math.ceil((daysInMonth + firstDay) / 7);
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes - 1, daysInMonth);
        
        const mock: LiquidationPeriod = {
          semana: weeksInMonth, // Por defecto última semana
          mes,
          anio,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          es_ultima_semana: true,
          estado: 'abierto' as const,
          choferes: [
            {
              chofer_id: 1,
              chofer_nombre: 'Juan Pérez',
              total_ganado: 450000,
              acumulado_mensual: 450000,
              minimo_garantizado: 400000,
              monto_a_completar: 0,
              pago_final: 450000,
              aplicar_garantizado: true,
              estado_pago: 'pendiente' as const
            },
            {
              chofer_id: 2,
              chofer_nombre: 'Pedro López',
              total_ganado: 380000,
              acumulado_mensual: 380000,
              minimo_garantizado: 400000,
              monto_a_completar: 20000,
              pago_final: 400000,
              aplicar_garantizado: true,
              estado_pago: 'pendiente' as const
            },
            {
              chofer_id: 3,
              chofer_nombre: 'María Gómez',
              total_ganado: 350000,
              acumulado_mensual: 350000,
              minimo_garantizado: 400000,
              monto_a_completar: 50000,
              pago_final: 400000,
              aplicar_garantizado: true,
              estado_pago: 'pendiente' as const
            }
          ]
        };
        this.liquidationCache.set(cacheKey, { data: mock, timestamp: Date.now() });
        return of(mock);
      })
    );
  }

  // PUT /api/accounting/liquidation/{chofer_id}/payment - Confirmar pago
  confirmPayment(choferId: number, mes: number, anio: number, data: {
    metodo_pago: 'transferencia' | 'efectivo';
    codigo_transferencia?: string;
  }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/accounting/liquidation/${choferId}/payment`, {
      mes,
      anio,
      ...data
    });
  }

  // POST /api/accounting/liquidation/close - Cerrar período
  closePeriod(mes: number, anio: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/accounting/liquidation/close`, { mes, anio });
  }

  // GET /api/accounting/liquidation/history - Historial de liquidaciones
  getLiquidationHistory(): Observable<ClosedLiquidation[]> {
    return this.http.get<ClosedLiquidation[]>(`${this.apiUrl}/accounting/liquidation/history`).pipe(
      map(data => data || []),
      catchError(() => {
        // Mock data con semanas
        const mockData: ClosedLiquidation[] = [
          {
            id: 1,
            periodo: 'Octubre 2025',
            mes: 10,
            anio: 2025,
            fecha_cierre: '2025-11-01',
            total_pagado: 1250000,
            cerrado_por: 'admin@demo.com',
            semanas: [
              {
                semana: 1,
                fecha_inicio: '2025-10-01',
                fecha_fin: '2025-10-07',
                es_ultima_semana: false,
                total_pagado: 370000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 120000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 120000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10001'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 100000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 100000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 150000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 150000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10002'
                  }
                ]
              },
              {
                semana: 2,
                fecha_inicio: '2025-10-08',
                fecha_fin: '2025-10-14',
                es_ultima_semana: false,
                total_pagado: 320000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 110000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 110000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10003'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 95000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 95000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 115000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 115000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10004'
                  }
                ]
              },
              {
                semana: 3,
                fecha_inicio: '2025-10-15',
                fecha_fin: '2025-10-21',
                es_ultima_semana: false,
                total_pagado: 330000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 115000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 115000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10005'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 100000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 100000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 115000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 115000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10006'
                  }
                ]
              },
              {
                semana: 4,
                fecha_inicio: '2025-10-22',
                fecha_fin: '2025-10-31',
                es_ultima_semana: true,
                total_pagado: 230000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 50000,
                    acumulado_mensual: 395000, // 120+110+115+50
                    minimo_garantizado: 400000,
                    monto_a_completar: 5000,
                    pago_final: 55000, // 50k + 5k ajuste
                    aplicar_garantizado: true,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10007'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 45000,
                    acumulado_mensual: 340000, // 100+95+100+45
                    minimo_garantizado: 400000,
                    monto_a_completar: 60000,
                    pago_final: 105000, // 45k + 60k ajuste
                    aplicar_garantizado: true,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 60000,
                    acumulado_mensual: 440000, // 150+115+115+60 (ya alcanzó el mínimo)
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 60000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-10008'
                  }
                ]
              }
            ],
            // Mantener choferes para compatibilidad (suma de todas las semanas)
            choferes: [
              {
                chofer_id: 1,
                chofer_nombre: 'Juan Pérez',
                total_ganado: 395000,
                minimo_garantizado: 400000,
                monto_a_completar: 5000,
                pago_final: 400000,
                aplicar_garantizado: true,
                estado_pago: 'pagado' as const,
                metodo_pago: 'transferencia' as const,
                codigo_transferencia: 'TRF-2025-10001'
              },
              {
                chofer_id: 2,
                chofer_nombre: 'Pedro López',
                total_ganado: 340000,
                minimo_garantizado: 400000,
                monto_a_completar: 60000,
                pago_final: 400000,
                aplicar_garantizado: true,
                estado_pago: 'pagado' as const,
                metodo_pago: 'efectivo' as const
              },
              {
                chofer_id: 3,
                chofer_nombre: 'María Gómez',
                total_ganado: 440000,
                minimo_garantizado: 400000,
                monto_a_completar: 0,
                pago_final: 440000,
                aplicar_garantizado: false,
                estado_pago: 'pagado' as const,
                metodo_pago: 'transferencia' as const,
                codigo_transferencia: 'TRF-2025-10002'
              }
            ]
          },
          {
            id: 2,
            periodo: 'Septiembre 2025',
            mes: 9,
            anio: 2025,
            fecha_cierre: '2025-10-01',
            total_pagado: 1230000,
            cerrado_por: 'admin@demo.com',
            semanas: [
              {
                semana: 1,
                fecha_inicio: '2025-09-01',
                fecha_fin: '2025-09-07',
                es_ultima_semana: false,
                total_pagado: 360000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 115000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 115000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09001'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 95000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 95000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 150000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 150000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09002'
                  }
                ]
              },
              {
                semana: 2,
                fecha_inicio: '2025-09-08',
                fecha_fin: '2025-09-14',
                es_ultima_semana: false,
                total_pagado: 310000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 105000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 105000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09003'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 90000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 90000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 115000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 115000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09004'
                  }
                ]
              },
              {
                semana: 3,
                fecha_inicio: '2025-09-15',
                fecha_fin: '2025-09-21',
                es_ultima_semana: false,
                total_pagado: 320000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 110000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 110000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09005'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 100000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 100000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 110000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 110000,
                    aplicar_garantizado: false,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09006'
                  }
                ]
              },
              {
                semana: 4,
                fecha_inicio: '2025-09-22',
                fecha_fin: '2025-09-30',
                es_ultima_semana: true,
                total_pagado: 240000,
                choferes: [
                  {
                    chofer_id: 1,
                    chofer_nombre: 'Juan Pérez',
                    total_ganado: 430000, // Acumulado: 115+105+110+100
                    acumulado_mensual: 430000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 0,
                    pago_final: 100000, // Solo lo de esta semana
                    aplicar_garantizado: false, // Ya alcanzó el mínimo
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09007'
                  },
                  {
                    chofer_id: 2,
                    chofer_nombre: 'Pedro López',
                    total_ganado: 385000, // Acumulado: 95+90+100+100
                    acumulado_mensual: 385000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 15000,
                    pago_final: 115000, // 100k + 15k ajuste
                    aplicar_garantizado: true,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'efectivo' as const
                  },
                  {
                    chofer_id: 3,
                    chofer_nombre: 'María Gómez',
                    total_ganado: 375000, // Acumulado: 150+115+110+0 (solo 3 semanas)
                    acumulado_mensual: 375000,
                    minimo_garantizado: 400000,
                    monto_a_completar: 25000,
                    pago_final: 25000, // Solo el ajuste (no trabajó esta semana)
                    aplicar_garantizado: true,
                    estado_pago: 'pagado' as const,
                    metodo_pago: 'transferencia' as const,
                    codigo_transferencia: 'TRF-2025-09008'
                  }
                ]
              }
            ],
            // Mantener choferes para compatibilidad
            choferes: [
              {
                chofer_id: 1,
                chofer_nombre: 'Juan Pérez',
                total_ganado: 430000,
                minimo_garantizado: 400000,
                monto_a_completar: 0,
                pago_final: 430000,
                aplicar_garantizado: false,
                estado_pago: 'pagado' as const,
                metodo_pago: 'transferencia' as const,
                codigo_transferencia: 'TRF-2025-09001'
              },
              {
                chofer_id: 2,
                chofer_nombre: 'Pedro López',
                total_ganado: 385000,
                minimo_garantizado: 400000,
                monto_a_completar: 15000,
                pago_final: 400000,
                aplicar_garantizado: true,
                estado_pago: 'pagado' as const,
                metodo_pago: 'efectivo' as const
              },
              {
                chofer_id: 3,
                chofer_nombre: 'María Gómez',
                total_ganado: 375000,
                minimo_garantizado: 400000,
                monto_a_completar: 25000,
                pago_final: 400000,
                aplicar_garantizado: true,
                estado_pago: 'pagado' as const,
                metodo_pago: 'transferencia' as const,
                codigo_transferencia: 'TRF-2025-09002'
              }
            ]
          }
        ];
        return of(mockData);
      })
    );
  }

  private getMockWeeklySummary(mes: number, anio: number): WeeklySummary[] {
    return [
      {
        semana: 1,
        fecha_inicio: `${anio}-${String(mes).padStart(2, '0')}-01`,
        fecha_fin: `${anio}-${String(mes).padStart(2, '0')}-07`,
        total_recaudado: 10270000,
        gasto_diesel: 1550000,
        gasto_mantenimiento: 0,
        total_egresos: 4166000,
        ganancia_neta: 6104000,
        choferes: [
          {
            chofer_id: 1,
            chofer_nombre: 'Juan Pérez',
            maquina: 'Máquina 05',
            dias_trabajados: 7,
            recaudado: 3650000,
            diesel: 550000,
            mantenimiento: 0,
            pago_chofer: 930000,
            ganancia_neta: 2170000
          },
          {
            chofer_id: 2,
            chofer_nombre: 'María Gómez',
            maquina: 'Máquina 02',
            dias_trabajados: 6,
            recaudado: 3120000,
            diesel: 480000,
            mantenimiento: 0,
            pago_chofer: 792000,
            ganancia_neta: 1848000
          },
          {
            chofer_id: 3,
            chofer_nombre: 'Pedro López',
            maquina: 'Máquina 07',
            dias_trabajados: 7,
            recaudado: 3500000,
            diesel: 520000,
            mantenimiento: 0,
            pago_chofer: 894000,
            ganancia_neta: 2086000
          }
        ]
      },
      {
        semana: 2,
        fecha_inicio: `${anio}-${String(mes).padStart(2, '0')}-08`,
        fecha_fin: `${anio}-${String(mes).padStart(2, '0')}-14`,
        total_recaudado: 9840000,
        gasto_diesel: 1470000,
        gasto_mantenimiento: 450000,
        total_egresos: 3981000,
        ganancia_neta: 5859000,
        choferes: [
          {
            chofer_id: 1,
            chofer_nombre: 'Juan Pérez',
            maquina: 'Máquina 05',
            dias_trabajados: 7,
            recaudado: 3700000,
            diesel: 560000,
            mantenimiento: 450000,
            pago_chofer: 942000,
            ganancia_neta: 1748000
          },
          {
            chofer_id: 2,
            chofer_nombre: 'María Gómez',
            maquina: 'Máquina 02',
            dias_trabajados: 7,
            recaudado: 3640000,
            diesel: 510000,
            mantenimiento: 0,
            pago_chofer: 939000,
            ganancia_neta: 2191000
          },
          {
            chofer_id: 3,
            chofer_nombre: 'Pedro López',
            maquina: 'Máquina 07',
            dias_trabajados: 5,
            recaudado: 2500000,
            diesel: 400000,
            mantenimiento: 0,
            pago_chofer: 630000,
            ganancia_neta: 1470000
          }
        ]
      },
      {
        semana: 3,
        fecha_inicio: `${anio}-${String(mes).padStart(2, '0')}-15`,
        fecha_fin: `${anio}-${String(mes).padStart(2, '0')}-21`,
        total_recaudado: 10710000,
        gasto_diesel: 1545000,
        gasto_mantenimiento: 205000,
        total_egresos: 4294500,
        ganancia_neta: 6415500,
        choferes: [
          {
            chofer_id: 1,
            chofer_nombre: 'Juan Pérez',
            maquina: 'Máquina 05',
            dias_trabajados: 7,
            recaudado: 3680000,
            diesel: 545000,
            mantenimiento: 85000,
            pago_chofer: 940500,
            ganancia_neta: 2109500
          },
          {
            chofer_id: 2,
            chofer_nombre: 'María Gómez',
            maquina: 'Máquina 02',
            dias_trabajados: 7,
            recaudado: 3580000,
            diesel: 495000,
            mantenimiento: 0,
            pago_chofer: 925500,
            ganancia_neta: 2160500
          },
          {
            chofer_id: 3,
            chofer_nombre: 'Pedro López',
            maquina: 'Máquina 07',
            dias_trabajados: 7,
            recaudado: 3450000,
            diesel: 505000,
            mantenimiento: 120000,
            pago_chofer: 883500,
            ganancia_neta: 1941500
          }
        ]
      },
      {
        semana: 4,
        fecha_inicio: `${anio}-${String(mes).padStart(2, '0')}-22`,
        fecha_fin: `${anio}-${String(mes).padStart(2, '0')}-28`,
        total_recaudado: 10500000,
        gasto_diesel: 1575000,
        gasto_mantenimiento: 0,
        total_egresos: 4252500,
        ganancia_neta: 6247500,
        choferes: [
          {
            chofer_id: 1,
            chofer_nombre: 'Juan Pérez',
            maquina: 'Máquina 05',
            dias_trabajados: 7,
            recaudado: 3720000,
            diesel: 570000,
            mantenimiento: 0,
            pago_chofer: 945000,
            ganancia_neta: 2205000
          },
          {
            chofer_id: 2,
            chofer_nombre: 'María Gómez',
            maquina: 'Máquina 02',
            dias_trabajados: 6,
            recaudado: 3180000,
            diesel: 475000,
            mantenimiento: 0,
            pago_chofer: 811500,
            ganancia_neta: 1894500
          },
          {
            chofer_id: 3,
            chofer_nombre: 'Pedro López',
            maquina: 'Máquina 07',
            dias_trabajados: 7,
            recaudado: 3600000,
            diesel: 530000,
            mantenimiento: 0,
            pago_chofer: 921000,
            ganancia_neta: 2149000
          }
        ]
      }
    ];
  }
  
  /**
   * Invalidar caché (útil cuando se actualizan datos)
   */
  clearCache(): void {
    this.summaryCache.clear();
    this.dailyProfitabilityCache.clear();
    this.weeklySummaryCache.clear();
    this.liquidationCache.clear();
  }
}

