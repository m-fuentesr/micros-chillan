import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { AccountingService } from '../../shared/services/accounting.service';
import { AccountingKPIs } from '../../shared/accounting/accounting-kpis/accounting-kpis';
import { AccountingChart } from '../../shared/accounting/accounting-chart/accounting-chart';
import { WeeklySummaryTable } from '../../shared/accounting/weekly-summary-table/weekly-summary-table';
import { LiquidationTable } from '../../shared/accounting/liquidation-table/liquidation-table';
import { LiquidationHistory } from '../../shared/accounting/liquidation-history/liquidation-history';
import { AccountingTab, AccountingSummary, DailyProfitabilityData, WeeklySummary, LiquidationPeriod, ClosedLiquidation, LiquidationDriver } from '../../shared/models/accounting.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingStateService } from '../../shared/services/loading-state.service';

@Component({
  selector: 'app-contabilidad',
  imports: [AccountingKPIs, AccountingChart, WeeklySummaryTable, LiquidationTable, LiquidationHistory, LoadingSkeleton],
  template: `
    <div class="space-y-6">
      <!-- Hero Section Premium -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-2xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4">
          <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
            Finanzas y Nómina
          </h1>
          <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
            Control financiero completo: resúmenes, liquidaciones y gestión de pagos a conductores.
          </p>
        </div>
      </div>

      <!-- Barra de Comandos: Tabs + Filtros Globales -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-base-200 pb-6 mb-6 animate-card-enter">
        <!-- Segmented Control (Tabs) - Edge-to-edge en móvil -->
        <div class="overflow-x-auto scrollbar-hide -mx-4 lg:mx-0 px-4 lg:px-0">
          <div class="tabs tabs-boxed bg-base-100/50 p-1 gap-1 inline-flex min-w-full lg:min-w-0">
            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'summary'"
              [class.bg-primary]="activeTab() === 'summary'"
              [class.text-primary-content]="activeTab() === 'summary'"
              (click)="setActiveTab('summary')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              <span class="text-xs sm:text-sm">Resumen</span>
            </button>

            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'weekly'"
              [class.bg-primary]="activeTab() === 'weekly'"
              [class.text-primary-content]="activeTab() === 'weekly'"
              (click)="setActiveTab('weekly')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span class="text-xs sm:text-sm">Semanal</span>
            </button>

            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'payroll'"
              [class.bg-primary]="activeTab() === 'payroll'"
              [class.text-primary-content]="activeTab() === 'payroll'"
              (click)="setActiveTab('payroll')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
              <span class="text-xs sm:text-sm">Liquidación</span>
            </button>

            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'history'"
              [class.bg-primary]="activeTab() === 'history'"
              [class.text-primary-content]="activeTab() === 'history'"
              (click)="setActiveTab('history')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span class="text-xs sm:text-sm">Historial Liquidaciones</span>
            </button>
          </div>
        </div>

        <!-- Filtros Globales (solo para Resumen General y Resumen Semanal) -->
        @if (activeTab() === 'summary' || activeTab() === 'weekly') {
          <div class="grid grid-cols-[2fr_1fr_auto] lg:flex lg:items-center gap-2 w-full lg:w-auto bg-white p-1.5 rounded-xl border border-base-200 shadow-sm">
            <div class="relative w-full">
              <select 
                class="appearance-none w-full bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none truncate" 
                [value]="selectedMonth()" 
                (change)="onMonthChange($event)">
                @for (month of months(); track month.value) {
                  <option [value]="month.value">{{ month.label }}</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>

            <div class="w-px h-4 bg-base-200 hidden lg:block"></div>

            <div class="relative w-full">
              <select 
                class="appearance-none w-full bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none" 
                [value]="selectedYear()" 
                (change)="onYearChange($event)">
                @for (year of years(); track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>

            <button class="btn btn-square btn-sm btn-ghost text-primary shrink-0" (click)="applyFilters()" title="Actualizar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        }
      </div>

      <!-- Contenido de Tabs -->
      <div class="card bg-base-100 shadow-xl animate-card-enter-delay-1 min-h-[520px] lg:min-h-[560px] flex flex-col">
        <div class="card-body flex-1 overflow-hidden">
          <!-- Tab: Resumen General -->
          @if (activeTab() === 'summary') {
            <div class="space-y-8 animate-tab-panel">
              @if (summaryLoadingState.showSkeleton() && summaryLoadingState.isLoading()) {
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  @for (i of [1,2,3,4]; track i) {
                    <app-loading-skeleton 
                      type="kpi" 
                      [isExiting]="summaryLoadingState.isSkeletonExiting()" />
                  }
                </div>
              } @else {
                <!-- KPIs: Contenedor independiente -->
                @if (summary()) {
                  <app-accounting-kpis [summary]="summary()!" />
                }

                <!-- Separador Visual y Gráfico: Contexto independiente -->
                @if (dailyData().length > 0) {
                  <div class="divider text-base-content/30 text-xs uppercase tracking-widest my-8">Análisis de Tendencia</div>
                  <app-accounting-chart [dailyData]="dailyData()" />
                }
              }
            </div>
          }

          <!-- Tab: Resumen Semanal -->
          @if (activeTab() === 'weekly') {
            @if (weeklyLoadingState.showSkeleton() && weeklyLoadingState.isLoading()) {
              <app-loading-skeleton 
                type="table" 
                [count]="5"
                [isExiting]="weeklyLoadingState.isSkeletonExiting()" />
            } @else if (weeklySummaries().length > 0) {
              <div class="animate-tab-panel tab-panel-scroll">
                <app-weekly-summary-table [summaries]="weeklySummaries()" />
              </div>
            }
          }

          <!-- Tab: Liquidación de Choferes -->
          @if (activeTab() === 'payroll') {
            @if (payrollLoadingState.showSkeleton() && payrollLoadingState.isLoading()) {
              <app-loading-skeleton 
                type="table" 
                [count]="8"
                [isExiting]="payrollLoadingState.isSkeletonExiting()" />
            } @else if (liquidation()) {
              <div class="animate-tab-panel tab-panel-scroll">
                <app-liquidation-table
                  [liquidation]="liquidation()!"
                  [availableWeeks]="availableWeeks()"
                  [selectedWeek]="selectedWeek()"
                  [payrollPeriod]="payrollPeriod()"
                  (weekChange)="onWeekChange($event)"
                  (payrollPeriodChange)="onPayrollPeriodChange($event)"
                  (missingAmountChange)="onMissingAmountChange($event)"
                  (aplicarGarantizadoChange)="onAplicarGarantizadoChange($event)"
                  (closePeriod)="onClosePeriod()" />
              </div>
            }
          }

          <!-- Tab: Historial de Liquidaciones -->
          @if (activeTab() === 'history') {
            @if (historyLoadingState.showSkeleton() && historyLoadingState.isLoading()) {
              <app-loading-skeleton 
                type="table" 
                [count]="5"
                [isExiting]="historyLoadingState.isSkeletonExiting()" />
            } @else if (liquidationHistory().length > 0) {
              <div class="animate-tab-panel tab-panel-scroll">
                <app-liquidation-history [liquidations]="liquidationHistory()" />
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Ocultar scrollbar pero mantener funcionalidad de scroll */
    .scrollbar-hide {
      -ms-overflow-style: none;  /* IE y Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;  /* Chrome, Safari y Opera */
    }

    /* Paneles de tabs con scroll interno para evitar saltos bruscos en el layout general */
    .tab-panel-scroll {
      max-height: 100%;
      overflow-y: auto;
      padding-right: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contabilidad implements OnInit {
  private accountingService = inject(AccountingService);
  private loadingStateService = inject(LoadingStateService);

  activeTab = signal<AccountingTab>('summary');
  
  selectedMonth = signal(11); // Noviembre por defecto
  selectedYear = signal(2025);
  
  // Estados de carga con umbral de 200ms
  summaryLoadingState = this.loadingStateService.createLoadingState();
  weeklyLoadingState = this.loadingStateService.createLoadingState();
  payrollLoadingState = this.loadingStateService.createLoadingState();
  historyLoadingState = this.loadingStateService.createLoadingState();

  // Datos
  summaryData = signal<AccountingSummary | null>(null);
  dailyData = signal<DailyProfitabilityData[]>([]);
  weeklySummaries = signal<WeeklySummary[]>([]);
  liquidationData = signal<LiquidationPeriod | null>(null);
  liquidationHistoryData = signal<ClosedLiquidation[]>([]);


  // Selector de semana para liquidación
  selectedWeek = signal<number>(1);
  
  // Selector de período para liquidación (mes actual / mes anterior)
  payrollPeriod = signal<'current' | 'previous'>('current');

  // Calcular semanas disponibles del mes
  availableWeeks = computed(() => {
    const { mes, anio } = this.payrollDate();
    
    // Si es mes anterior, siempre mostrar 4 semanas
    if (this.payrollPeriod() === 'previous') {
      return [1, 2, 3, 4];
    }
    
    // Para mes actual, calcular según el mes
    const daysInMonth = new Date(anio, mes, 0).getDate();
    const firstDay = new Date(anio, mes - 1, 1).getDay(); // 0 = domingo, 1 = lunes, etc.
    
    // Calcular cuántas semanas tiene el mes
    const weeks = Math.ceil((daysInMonth + firstDay) / 7);
    return Array.from({ length: weeks }, (_, i) => i + 1);
  });

  payrollDate = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (this.payrollPeriod() === 'current') {
      return { mes: currentMonth, anio: currentYear };
    }

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return { mes: prevMonth, anio: prevYear };
  });

  months = computed(() => {
    const monthNames = [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
    return monthNames;
  });

  years = computed(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  });

  summary = computed(() => this.summaryData());
  liquidation = computed(() => this.liquidationData());
  liquidationHistory = computed(() => this.liquidationHistoryData());

  ngOnInit(): void {
    this.loadSummary();
    this.loadDailyData();
    this.loadWeeklySummaries();
    this.loadLiquidation();
    this.loadLiquidationHistory();
  }

  setActiveTab(tab: AccountingTab): void {
    this.activeTab.set(tab);
  }

  onMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedMonth.set(Number(select.value));
  }

  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedYear.set(Number(select.value));
  }

  applyFilters(): void {
    this.loadSummary();
    this.loadDailyData();
    this.loadWeeklySummaries();
  }

  loadSummary(): void {
    this.summaryLoadingState.setLoading(true);
    this.accountingService.getSummary(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of(null)))
      .subscribe(summary => {
        if (summary) {
          this.summaryData.set(summary);
        }
        this.summaryLoadingState.setDataLoaded();
      });
  }

  loadDailyData(): void {
    this.accountingService.getDailyProfitability(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dailyData.set(data);
      });
  }

  loadWeeklySummaries(): void {
    this.weeklyLoadingState.setLoading(true);
    this.accountingService.getWeeklySummary(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of([])))
      .subscribe(summaries => {
        this.weeklySummaries.set(summaries);
        this.weeklyLoadingState.setDataLoaded();
      });
  }

  loadLiquidation(): void {
    this.payrollLoadingState.setLoading(true);
    const { mes, anio } = this.payrollDate();
    const semana = this.selectedWeek();
    this.accountingService.getWeeklyLiquidation(semana, mes, anio)
      .pipe(catchError(() => of(null)))
      .subscribe(liquidation => {
        if (liquidation) {
          // Inicializar aplicar_garantizado solo si es última semana
          liquidation.choferes.forEach(chofer => {
            if (liquidation.es_ultima_semana) {
              if (chofer.aplicar_garantizado === undefined) {
                const acumulado = chofer.acumulado_mensual || chofer.total_ganado;
                chofer.aplicar_garantizado = acumulado < chofer.minimo_garantizado;
              }
            } else {
              chofer.aplicar_garantizado = false;
            }
            // Recalcular pago_final con la lógica actualizada
            this.recalculatePagoFinal(chofer, liquidation.es_ultima_semana);
          });
          this.liquidationData.set(liquidation);
        }
        this.payrollLoadingState.setDataLoaded();
      });
  }

  loadLiquidationHistory(): void {
    this.historyLoadingState.setLoading(true);
    this.accountingService.getLiquidationHistory()
      .pipe(catchError(() => of([])))
      .subscribe(history => {
        this.liquidationHistoryData.set(history);
        this.historyLoadingState.setDataLoaded();
      });
  }


  onMissingAmountChange(event: { choferId: number; monto: number }): void {
    const liquidation = this.liquidation();
    if (!liquidation) return;

    const chofer = liquidation.choferes.find(c => c.chofer_id === event.choferId);
    if (chofer) {
      chofer.monto_a_completar = event.monto;
      this.recalculatePagoFinal(chofer, liquidation.es_ultima_semana);
      this.liquidationData.set({ ...liquidation });
    }
  }

  onAplicarGarantizadoChange(event: { choferId: number; aplicar: boolean }): void {
    const liquidation = this.liquidation();
    if (!liquidation) return;

    const chofer = liquidation.choferes.find(c => c.chofer_id === event.choferId);
    if (chofer) {
      chofer.aplicar_garantizado = event.aplicar;
      this.recalculatePagoFinal(chofer, liquidation.es_ultima_semana);
      this.liquidationData.set({ ...liquidation });
    }
  }

  onWeekChange(week: number): void {
    this.selectedWeek.set(week);
    this.loadLiquidation(); // Recargar liquidación con la nueva semana
  }

  onPayrollPeriodChange(period: 'current' | 'previous'): void {
    this.payrollPeriod.set(period);
    this.selectedWeek.set(1); // Resetear a semana 1 al cambiar de mes
    this.loadLiquidation(); // Recargar liquidación con el nuevo período
  }

  private recalculatePagoFinal(chofer: LiquidationDriver, esUltimaSemana: boolean): void {
    if (esUltimaSemana && chofer.aplicar_garantizado) {
      const acumulado = chofer.acumulado_mensual || chofer.total_ganado;
      if (acumulado < chofer.minimo_garantizado) {
        chofer.pago_final = chofer.total_ganado + chofer.monto_a_completar;
      } else {
        chofer.pago_final = chofer.total_ganado;
      }
    } else {
      chofer.pago_final = chofer.total_ganado;
    }
  }

  onClosePeriod(): void {
    const { mes, anio } = this.payrollDate();
    this.accountingService.closePeriod(mes, anio)
      .pipe(catchError(() => of(void 0)))
      .subscribe(() => {
        // Recargar liquidación
        this.loadLiquidation();
        alert('Período cerrado y finalizado exitosamente.');
      });
  }
}
