import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AccountingSummary, DailyProfitabilityData, WeeklySummary, WeeklyDriverBreakdown, LiquidationPeriod, LiquidationDriver, ClosedLiquidation, ClosedLiquidationWeek, LedgerSummary, MovementCreate, DriverLedgerHistory } from '../models/accounting.models';
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
    
    return this.http.get<AccountingSummary>(`${this.apiUrl}/api/accounting/summary`, { params }).pipe(
      map(summary => {
        console.log('✅ Resumen contable recibido:', summary);
        this.summaryCache.set(cacheKey, { data: summary, timestamp: Date.now() });
        return summary;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener resumen contable:', {
          url: `${this.apiUrl}/api/accounting/summary`,
          params: { mes, anio },
          error: error,
          status: error?.status,
          message: error?.message,
          errorDetail: error?.error
        });
        // NO usar datos mock - lanzar el error para que el componente lo maneje
        // Esto permite que el usuario vea que hay un problema
        throw error;
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
    
    return this.http.get<DailyProfitabilityData[]>(`${this.apiUrl}/api/accounting/daily-profitability`, { params }).pipe(
      map(data => {
        console.log('✅ Rentabilidad diaria recibida:', data?.length, 'días');
        this.dailyProfitabilityCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener rentabilidad diaria:', {
          url: `${this.apiUrl}/api/accounting/daily-profitability`,
          params: { mes, anio },
          error: error,
          status: error?.status,
          message: error?.message,
          errorDetail: error?.error
        });
        // NO usar datos mock - lanzar el error para que el componente lo maneje
        throw error;
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
    
    // Interfaz para la respuesta del backend
    interface BackendWeekSummary {
      numero_semana: number;
      rango_fechas_texto: string;
      total_recaudado: number;
      total_diesel: number;
      total_mantenimiento: number;
      total_pago_choferes: number;
      ganancia_liquida: number;
    }
    
    return this.http.get<BackendWeekSummary[]>(`${this.apiUrl}/api/accounting/weeks`, { params }).pipe(
      map((backendData: BackendWeekSummary[]) => {
        // Mapear la respuesta del backend al formato del frontend
        const mappedData: WeeklySummary[] = backendData.map(week => {
          // Parsear rango_fechas_texto (formato: "01/11 - 07/11")
          const [fechaInicioStr, fechaFinStr] = this.parseDateRange(week.rango_fechas_texto, mes, anio);
          
          // Calcular total_egresos
          const totalEgresos = week.total_diesel + week.total_mantenimiento + week.total_pago_choferes;
          
          return {
            semana: week.numero_semana,
            fecha_inicio: fechaInicioStr,
            fecha_fin: fechaFinStr,
            total_recaudado: week.total_recaudado,
            gasto_diesel: week.total_diesel,
            gasto_mantenimiento: week.total_mantenimiento,
            total_egresos: totalEgresos,
            ganancia_neta: week.ganancia_liquida,
            total_pago_choferes: week.total_pago_choferes,
            choferes: [] // Se cargará cuando se expanda la semana
          };
        });
        
        this.weeklySummaryCache.set(cacheKey, { data: mappedData, timestamp: Date.now() });
        return mappedData;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener resumen semanal:', {
          url: `${this.apiUrl}/api/accounting/weeks`,
          params: { mes, anio },
          error: error,
          status: error?.status,
          message: error?.message,
          errorDetail: error?.error
        });
        // NO usar datos mock - lanzar el error para que el componente lo maneje
        throw error;
      })
    );
  }

  // GET /api/accounting/weeks/detail - Detalle de choferes por semana
  getWeekDetail(mes: number, anio: number, semana: number): Observable<WeeklyDriverBreakdown[]> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString())
      .set('semana', semana.toString());
    
    // Interfaz para la respuesta del backend
    interface BackendDriverWeekDetail {
      chofer_id: number;
      nombre_chofer: string;
      dias_trabajados: number;
      total_recaudado: number;
      costo_diesel: number;
      gastos_mantenimiento: number;
      total_ganado_chofer: number;
    }
    
    return this.http.get<BackendDriverWeekDetail[]>(`${this.apiUrl}/api/accounting/weeks/detail`, { params }).pipe(
      map((backendData: BackendDriverWeekDetail[]) => {
        // Mapear la respuesta del backend al formato del frontend
        return backendData.map(driver => ({
          chofer_id: driver.chofer_id,
          chofer_nombre: driver.nombre_chofer,
          maquina: '', // El backend no devuelve esta info, se puede obtener de otra forma si es necesario
          dias_trabajados: driver.dias_trabajados,
          recaudado: driver.total_recaudado,
          diesel: driver.costo_diesel,
          mantenimiento: driver.gastos_mantenimiento,
          pago_chofer: driver.total_ganado_chofer,
          ganancia_neta: driver.total_recaudado - driver.costo_diesel - driver.gastos_mantenimiento - driver.total_ganado_chofer
        }));
      }),
      catchError((error) => {
        console.error('❌ Error al obtener detalle semanal:', {
          url: `${this.apiUrl}/api/accounting/weeks/detail`,
          params: { mes, anio, semana },
          error: error
        });
        throw error;
      })
    );
  }

  // Método auxiliar para parsear el rango de fechas del backend
  private parseDateRange(rangoTexto: string, mes: number, anio: number): [string, string] {
    try {
      // Formato esperado: "01/11 - 07/11" o "01/11 - 30/11"
      const parts = rangoTexto.split(' - ');
      if (parts.length === 2) {
        const [diaInicio, mesInicio] = parts[0].split('/').map(Number);
        const [diaFin, mesFin] = parts[1].split('/').map(Number);
        
        // Crear fechas en formato ISO (YYYY-MM-DD)
        const fechaInicio = new Date(anio, mes - 1, diaInicio);
        const fechaFin = new Date(anio, mes - 1, diaFin);
        
        return [
          fechaInicio.toISOString().split('T')[0],
          fechaFin.toISOString().split('T')[0]
        ];
      }
    } catch (error) {
      console.warn('Error al parsear rango de fechas:', rangoTexto);
    }
    
    // Fallback: calcular fechas basándose en el número de semana
    const fechaInicio = new Date(anio, mes - 1, 1);
    const primerDiaSemana = fechaInicio.getDay(); // 0 = domingo, 1 = lunes, etc.
    const diasHastaLunes = primerDiaSemana === 0 ? 1 : (8 - primerDiaSemana) % 7;
    const inicioSemana = new Date(anio, mes - 1, 1 + diasHastaLunes);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);
    
    return [
      inicioSemana.toISOString().split('T')[0],
      finSemana.toISOString().split('T')[0]
    ];
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
    
    // Interfaz para la respuesta del backend
    interface BackendWeeklyPaymentResponse {
      chofer_id: number;
      nombre_chofer: string;
      mes: number;
      anio: number;
      semana: number;
      es_ultima_semana: boolean;
      mes_cerrado_administrativamente: boolean;
      base_ganado: number;
      acumulado_mes_anterior: number;
      sueldo_minimo_mensual: number;
      ajuste_garantizado_calculado: number;
      total_a_pagar: number;
      estado_pago: string;
      id_pago?: number | null;
      metodo_pago?: string | null;
      codigo_transferencia?: string | null;
      fecha_pago?: string | null;
    }
    
    return this.http.get<BackendWeeklyPaymentResponse[]>(`${this.apiUrl}/api/accounting/weekly-payments`, { params }).pipe(
      map((backendData: BackendWeeklyPaymentResponse[]) => {
        // Calcular fechas de la semana
        const { fechaInicio, fechaFin } = this.calculateWeekDates(mes, anio, semana);
        
        // Si no hay datos, retornar un período vacío en lugar de lanzar error
        if (!backendData || backendData.length === 0) {
          // Calcular si es última semana
          const totalSemanas = this.countWeeksInMonth(mes, anio);
          const esUltimaSemana = (semana === totalSemanas);
          
          // Retornar período vacío (sin choferes)
          const liquidation: LiquidationPeriod = {
            semana,
            mes,
            anio,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            es_ultima_semana: esUltimaSemana,
            estado: 'abierto',
            mes_cerrado_administrativamente: false,
            choferes: []
          };
          
          this.liquidationCache.set(cacheKey, { data: liquidation, timestamp: Date.now() });
          return liquidation;
        }
        
        // Obtener es_ultima_semana y mes_cerrado_administrativamente del primer elemento (todos tienen el mismo valor)
        const esUltimaSemana = backendData[0]?.es_ultima_semana || false;
        const mesCerradoAdministrativamente = backendData[0]?.mes_cerrado_administrativamente || false;
        
        // Mapear choferes
        const choferes: LiquidationDriver[] = backendData.map(payment => {
          // Validar y convertir metodo_pago al tipo esperado
          let metodoPago: 'transferencia' | 'efectivo' | null = null;
          if (payment.metodo_pago === 'transferencia' || payment.metodo_pago === 'efectivo') {
            metodoPago = payment.metodo_pago;
          }
          
          return {
            chofer_id: payment.chofer_id,
            chofer_nombre: payment.nombre_chofer,
            total_ganado: payment.base_ganado,
            // El acumulado_mensual debe ser solo el acumulado de semanas anteriores (sin incluir la semana actual)
            // Se mostrará en la UI como "Acumulado mes" pero representa solo las semanas anteriores
            acumulado_mensual: esUltimaSemana ? payment.acumulado_mes_anterior : undefined,
            minimo_garantizado: payment.sueldo_minimo_mensual,
            monto_a_completar: payment.ajuste_garantizado_calculado,
            pago_final: payment.total_a_pagar,
            aplicar_garantizado: payment.ajuste_garantizado_calculado > 0,
            estado_pago: payment.estado_pago === 'pagado' ? 'pagado' : payment.estado_pago === 'confirmado' ? 'confirmado' : 'pendiente',
            metodo_pago: metodoPago,
            codigo_transferencia: payment.codigo_transferencia || null,
            fecha_pago: payment.fecha_pago || null
          };
        });
        
        // El estado es 'cerrado' solo si TODOS los choferes están pagados
        // Si hay al menos un chofer pendiente o confirmado, el período sigue abierto
        const todosPagados = choferes.length > 0 && choferes.every(c => c.estado_pago === 'pagado');
        
        const liquidation: LiquidationPeriod = {
          semana,
          mes,
          anio,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          es_ultima_semana: esUltimaSemana,
          estado: todosPagados ? 'cerrado' : 'abierto',
          mes_cerrado_administrativamente: mesCerradoAdministrativamente,
          choferes
        };
        
        this.liquidationCache.set(cacheKey, { data: liquidation, timestamp: Date.now() });
        return liquidation;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener liquidación semanal:', {
          url: `${this.apiUrl}/api/accounting/weekly-payments`,
          params: { semana, mes, anio },
          error: error
        });
        // NO usar datos mock - lanzar el error para que el componente lo maneje
        throw error;
      })
    );
  }

  // Método auxiliar para calcular fechas de la semana
  // IMPORTANTE: Debe coincidir con la lógica del backend (get_date_range_for_week)
  // Las semanas empiezan desde el día 1 del mes y terminan en domingo (o fin de mes)
  private calculateWeekDates(mes: number, anio: number, semana: number): { fechaInicio: string; fechaFin: string } {
    const fechaInicioMes = new Date(anio, mes - 1, 1);
    const ultimoDiaMes = new Date(anio, mes, 0).getDate();
    const fechaFinMes = new Date(anio, mes - 1, ultimoDiaMes);
    
    let fechaActual = new Date(fechaInicioMes);
    let contadorSemana = 1;
    
    // Recorrer el mes semana por semana (igual que el backend)
    while (fechaActual <= fechaFinMes) {
      // Calcular días hasta el próximo domingo
      // En JavaScript: 0 = domingo, 1 = lunes, ..., 6 = sábado
      // En Python weekday(): 0 = lunes, 6 = domingo
      // Necesitamos convertir: domingo en JS = 0, pero en Python es 6
      const diaSemanaJS = fechaActual.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
      // Convertir a formato Python: lunes=0, domingo=6
      const diaSemanaPython = diaSemanaJS === 0 ? 6 : diaSemanaJS - 1;
      
      // Calcular días hasta el próximo domingo (igual que backend: 6 - weekday())
      const diasHastaDomingo = 6 - diaSemanaPython;
      const proximoDomingo = new Date(fechaActual);
      proximoDomingo.setDate(fechaActual.getDate() + diasHastaDomingo);
      
      // El fin de semana es el mínimo entre el próximo domingo y el fin del mes
      const finSemana = proximoDomingo > fechaFinMes ? fechaFinMes : proximoDomingo;
      
      // ¿Es esta la semana que buscamos?
      if (contadorSemana === semana) {
        return {
          fechaInicio: fechaActual.toISOString().split('T')[0],
          fechaFin: finSemana.toISOString().split('T')[0]
        };
      }
      
      // Avanzar a la siguiente semana (día siguiente al fin de semana)
      fechaActual = new Date(finSemana);
      fechaActual.setDate(finSemana.getDate() + 1);
      contadorSemana++;
    }
    
    // Si llegamos aquí, la semana no existe
    // Fallback: retornar la última semana del mes
    const ultimaSemanaInicio = new Date(anio, mes - 1, ultimoDiaMes);
    return {
      fechaInicio: ultimaSemanaInicio.toISOString().split('T')[0],
      fechaFin: fechaFinMes.toISOString().split('T')[0]
    };
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
    
    return this.http.get<LiquidationPeriod>(`${this.apiUrl}/api/accounting/weekly-payments`, { params }).pipe(
      map(data => {
        this.liquidationCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }),
      catchError((error) => {
        console.error('Error obteniendo período de liquidación:', error);
        return throwError(() => error);
      })
    );
  }

  // POST /api/accounting/weekly-payments/{chofer_id}/confirm - Confirmar pago semanal
  confirmWeeklyPayment(
    choferId: number,
    mes: number,
    anio: number,
    semana: number,
    data: {
      metodo_pago: 'transferencia' | 'efectivo';
      fecha_pago: string;
      codigo_transferencia?: string;
      observaciones?: string;
      monto_base_semana: number;
      monto_bono_final: number;
      total_a_pagar: number;
    }
  ): Observable<any> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString())
      .set('semana', semana.toString());

    return this.http.post<any>(`${this.apiUrl}/api/accounting/weekly-payments/${choferId}/confirm`, data, { params });
  }

  // DELETE /api/accounting/undo - Deshacer pago semanal
  undoPayment(
    choferId: number,
    mes: number,
    anio: number,
    semana: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('chofer_id', choferId.toString())
      .set('mes', mes.toString())
      .set('anio', anio.toString())
      .set('semana', semana.toString());

    return this.http.delete<any>(`${this.apiUrl}/api/accounting/undo`, { params });
  }

  /**
   * Verifica si un chofer tiene semanas anteriores sin pagar en el mes actual
   * Solo considera semanas que tienen registros diarios (si no hay registros, no hay nada que pagar)
   * @param choferId ID del chofer
   * @param mes Mes actual
   * @param anio Año actual
   * @param semana Semana actual que se intenta pagar
   * @returns Observable con array de números de semanas sin pagar, o array vacío si todas están pagadas o no tienen registros
   */
  checkUnpaidPreviousWeeks(choferId: number, mes: number, anio: number, semana: number): Observable<number[]> {
    // Solo validar para mes actual
    const today = new Date();
    const esMesActual = mes === today.getMonth() + 1 && anio === today.getFullYear();
    
    if (!esMesActual || semana <= 1) {
      return of([]); // No validar para meses anteriores o primera semana
    }

    // Consultar todas las semanas anteriores para este chofer
    const checks: Observable<{ semana: number; tienePago: boolean; tieneRegistros: boolean }>[] = [];

    for (let semanaAnterior = 1; semanaAnterior < semana; semanaAnterior++) {
      const check$ = this.getWeeklyLiquidation(semanaAnterior, mes, anio).pipe(
        map((liquidation) => {
          const chofer = liquidation.choferes.find(c => c.chofer_id === choferId);
          // Si el chofer no aparece en la liquidación, puede ser porque:
          // 1. No tiene registros diarios (no hay nada que pagar) -> tieneRegistros = false
          // 2. Tiene registros pero no está en la lista (error) -> tieneRegistros = true, tienePago = false
          
          // Si el chofer aparece en la liquidación, tiene registros diarios
          const tieneRegistros = chofer !== undefined;
          // Solo considerar "sin pagar" si tiene registros Y no está pagado
          const tienePago = chofer?.estado_pago === 'pagado';
          
          return { semana: semanaAnterior, tienePago, tieneRegistros };
        }),
        catchError(() => {
          // Si hay error, asumir que no tiene registros (no hay nada que pagar)
          return of({ semana: semanaAnterior, tienePago: false, tieneRegistros: false });
        })
      );
      checks.push(check$);
    }

    if (checks.length === 0) {
      return of([]);
    }

    // Combinar todos los checks
    return forkJoin(checks).pipe(
      map((results) => {
        // Solo considerar "sin pagar" si tiene registros diarios Y no está pagado
        return results
          .filter(r => r.tieneRegistros && !r.tienePago)
          .map(r => r.semana);
      })
    );
  }

  // POST /api/accounting/close-month - Cerrar mes contable
  closePeriod(mes: number, anio: number): Observable<any> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.post<any>(`${this.apiUrl}/api/accounting/close-month`, null, { params });
  }

  // GET /api/accounting/history/periods - Lista de períodos cerrados con paginación y filtros
  getLiquidationHistory(filters?: {
    mes_desde?: number;
    mes_hasta?: number;
    page?: number;
    per_page?: number;
  }): Observable<{
    items: ClosedLiquidation[];
    total: number;
    total_global: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    // Interfaces para mapear desde el backend
    interface BackendHistoryPeriodSummary {
      periodo_texto: string;
      mes: number;
      anio: number;
      total_pagado_mes: number;
      fecha_cierre: string;
      estado: string;
    }

    interface BackendResponse {
      items: BackendHistoryPeriodSummary[];
      total: number;
      total_global: number;
      page: number;
      per_page: number;
    }

    let params = new HttpParams();
    if (filters?.mes_desde) {
      params = params.set('mes_desde', filters.mes_desde.toString());
    }
    if (filters?.mes_hasta) {
      params = params.set('mes_hasta', filters.mes_hasta.toString());
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params = params.set('per_page', filters.per_page.toString());
    }

    return this.http.get<BackendResponse>(`${this.apiUrl}/api/accounting/history/periods`, { params }).pipe(
      map((response: BackendResponse) => {
        const items = (response.items || []).map((period, index) => ({
          id: index + 1, // ID temporal basado en índice
          periodo: period.periodo_texto,
          mes: period.mes,
          anio: period.anio,
          fecha_cierre: period.fecha_cierre,
          total_pagado: period.total_pagado_mes,
          cerrado_por: 'admin@demo.com', // TODO: Obtener del backend cuando esté disponible
          semanas: [], // Se cargarán cuando se expanda
          choferes: [] // DEPRECATED, se mantiene para compatibilidad
        }));

        const total_pages = Math.ceil(response.total / response.per_page);

        return {
          items,
          total: response.total,
          total_global: response.total_global,
          page: response.page,
          per_page: response.per_page,
          total_pages
        };
      }),
      catchError((error) => {
        console.error('Error obteniendo historial de liquidaciones:', error);
        return of({
          items: [],
          total: 0,
          total_global: 0,
          page: 1,
          per_page: 10,
          total_pages: 0
        });
      })
    );
  }

  // GET /api/accounting/history/month-detail - Detalle completo de un mes
  getLiquidationMonthDetail(mes: number, anio: number): Observable<ClosedLiquidation> {
    // Interfaces para mapear desde el backend
    interface BackendPaymentRefDetail {
      chofer_id: number;
      nombre_chofer: string;
      base: number;
      ajuste: number;
      total: number;
      metodo: string;
      ref: string | null;
    }

    interface BackendWeekGroup {
      numero_semana: number;
      rango_fechas_texto: string;
      total_semana: number;
      pagos: BackendPaymentRefDetail[];
    }

    interface BackendHistoryMonthDetailResponse {
      total_liquidado: number;
      cantidad_choferes: number;
      promedio: number;
      estado: string;
      desglose_semanas: BackendWeekGroup[];
    }

    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.get<BackendHistoryMonthDetailResponse>(`${this.apiUrl}/api/accounting/history/month-detail`, { params }).pipe(
      map<BackendHistoryMonthDetailResponse, ClosedLiquidation>((data: BackendHistoryMonthDetailResponse) => {
        // Calcular total de semanas del mes para determinar cuál es la última
        const totalSemanas = this.countWeeksInMonth(mes, anio);
        
        // Mapear semanas del backend a ClosedLiquidationWeek
        const semanas: ClosedLiquidationWeek[] = data.desglose_semanas.map((weekGroup) => {
          // Calcular fechas de la semana
          const weekDates = this.calculateWeekDates(mes, anio, weekGroup.numero_semana);
          
          // Mapear pagos a LiquidationDriver
          const choferes: LiquidationDriver[] = weekGroup.pagos.map((pago) => ({
            chofer_id: pago.chofer_id,
            chofer_nombre: pago.nombre_chofer,
            total_ganado: pago.base,
            minimo_garantizado: 0, // No disponible en el historial
            monto_a_completar: pago.ajuste,
            pago_final: pago.total,
            aplicar_garantizado: pago.ajuste > 0,
            estado_pago: 'pagado' as const,
            metodo_pago: (pago.metodo?.toLowerCase() === 'transferencia' || pago.metodo?.toLowerCase() === 'efectivo') 
              ? pago.metodo.toLowerCase() as 'transferencia' | 'efectivo' 
              : null,
            codigo_transferencia: pago.ref && pago.ref !== '-' ? pago.ref : null,
            fecha_pago: null // No disponible en el historial detallado
          }));

          return {
            semana: weekGroup.numero_semana,
            fecha_inicio: weekDates.fechaInicio,
            fecha_fin: weekDates.fechaFin,
            es_ultima_semana: weekGroup.numero_semana === totalSemanas,
            total_pagado: weekGroup.total_semana,
            choferes: choferes
          };
        });

        // Obtener nombre del mes
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const nombreMes = meses[mes - 1] || `Mes ${mes}`;

        const estadoMapeado: 'Finalizado' | 'En Proceso' = data.estado === 'Finalizado' ? 'Finalizado' : 'En Proceso';
        
        const result: ClosedLiquidation = {
          id: mes * 100 + anio, // ID único basado en mes y año
          periodo: `${nombreMes} ${anio}`,
          mes: mes,
          anio: anio,
          fecha_cierre: new Date().toISOString().split('T')[0], // Fecha actual como fallback
          total_pagado: data.total_liquidado,
          cerrado_por: 'admin@demo.com', // TODO: Obtener del backend cuando esté disponible
          estado: estadoMapeado,
          semanas: semanas,
          choferes: [] // DEPRECATED, usar semanas[].choferes
        };
        
        return result;
      }),
      catchError((error) => {
        console.error('Error obteniendo detalle del mes:', error);
        throw error;
      })
    );
  }

  // Método auxiliar para contar semanas en un mes (igual que el backend)
  countWeeksInMonth(mes: number, anio: number): number {
    const fechaInicioMes = new Date(anio, mes - 1, 1);
    const ultimoDiaMes = new Date(anio, mes, 0).getDate();
    const fechaFinMes = new Date(anio, mes - 1, ultimoDiaMes);
    
    let fechaActual = new Date(fechaInicioMes);
    let semanas = 0;
    
    while (fechaActual <= fechaFinMes) {
      semanas++;
      const diaSemanaJS = fechaActual.getDay();
      const diaSemanaPython = diaSemanaJS === 0 ? 6 : diaSemanaJS - 1;
      const diasHastaDomingo = 6 - diaSemanaPython;
      const proximoDomingo = new Date(fechaActual);
      proximoDomingo.setDate(fechaActual.getDate() + diasHastaDomingo);
      const finSemana = proximoDomingo > fechaFinMes ? fechaFinMes : proximoDomingo;
      fechaActual = new Date(finSemana);
      fechaActual.setDate(finSemana.getDate() + 1);
    }
    
    return semanas;
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

  /**
   * Invalidar caché de una liquidación específica
   * Útil después de confirmar un pago para forzar la recarga de datos
   */
  invalidateLiquidationCache(semana: number, mes: number, anio: number, choferId?: number): void {
    const cacheKey = choferId ? `${semana}-${mes}-${anio}-${choferId}` : `${semana}-${mes}-${anio}`;
    this.liquidationCache.delete(cacheKey);
  }

  /**
   * Invalidar caché de TODAS las semanas de un mes
   * Necesario porque el acumulado de la última semana depende de todas las semanas anteriores
   */
  invalidateAllWeeksInMonth(mes: number, anio: number, choferId?: number): void {
    // Calcular el número total de semanas del mes
    const totalSemanas = this.countWeeksInMonth(mes, anio);
    
    // Invalidar el caché de todas las semanas del mes
    for (let semana = 1; semana <= totalSemanas; semana++) {
      const cacheKey = choferId ? `${semana}-${mes}-${anio}-${choferId}` : `${semana}-${mes}-${anio}`;
      this.liquidationCache.delete(cacheKey);
    }
  }

  /**
   * Limpiar todo el caché de liquidaciones
   * Útil cuando cambia la configuración (ej: sueldo mínimo) que afecta a todas las liquidaciones
   */
  clearAllLiquidationCache(): void {
    this.liquidationCache.clear();
  }

  // =================================================================
  // CUENTAS CORRIENTES CHOFERES (LEDGER)
  // =================================================================

  /**
   * GET /api/accounting/ledger - Obtiene el resumen de cuentas corrientes de todos los choferes
   */
  getLedgerSummary(): Observable<LedgerSummary[]> {
    return this.http.get<LedgerSummary[]>(`${this.apiUrl}/api/accounting/ledger`).pipe(
      map(data => {
        console.log('✅ Resumen de cuentas corrientes recibido:', data?.length, 'choferes');
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error al obtener resumen de cuentas corrientes:', {
          url: `${this.apiUrl}/api/accounting/ledger`,
          error: error,
          status: error?.status,
          message: error?.message
        });
        throw error;
      })
    );
  }

  /**
   * POST /api/accounting/ledger/movement - Registra un movimiento (CARGO o ABONO) en la cuenta de un chofer
   */
  createLedgerMovement(movement: MovementCreate): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/accounting/ledger/movement`, movement).pipe(
      map(response => {
        console.log('✅ Movimiento registrado correctamente:', response);
        return response;
      }),
      catchError((error) => {
        console.error('❌ Error al registrar movimiento:', {
          url: `${this.apiUrl}/api/accounting/ledger/movement`,
          movement,
          error: error,
          status: error?.status,
          message: error?.message
        });
        throw error;
      })
    );
  }

  /**
   * GET /api/accounting/ledger/{chofer_id} - Obtiene el historial detallado de movimientos de un chofer
   */
  getDriverLedgerHistory(choferId: number, page: number = 1, perPage: number = 5): Observable<DriverLedgerHistory> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<DriverLedgerHistory>(`${this.apiUrl}/api/accounting/ledger/${choferId}`, { params }).pipe(
      map(data => {
        console.log('✅ Historial de chofer recibido:', data);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener historial del chofer:', {
          url: `${this.apiUrl}/api/accounting/ledger/${choferId}`,
          choferId,
          page,
          perPage,
          error: error,
          status: error?.status,
          message: error?.message
        });
        throw error;
      })
    );
  }
}

