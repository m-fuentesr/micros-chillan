import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { AccountingService } from '../../shared/services/accounting.service';
import { AccountingKPIs } from '../../shared/accounting/accounting-kpis/accounting-kpis';
import { AccountingChart } from '../../shared/accounting/accounting-chart/accounting-chart';
import { WeeklySummaryTable } from '../../shared/accounting/weekly-summary-table/weekly-summary-table';
import { LiquidationTable } from '../../shared/accounting/liquidation-table/liquidation-table';
import { LiquidationTableSkeleton } from '../../shared/accounting/liquidation-table-skeleton/liquidation-table-skeleton';
import { LiquidationHistory } from '../../shared/accounting/liquidation-history/liquidation-history';
import { AccountingTab, AccountingSummary, DailyProfitabilityData, WeeklySummary, LiquidationPeriod, ClosedLiquidation, LiquidationDriver } from '../../shared/models/accounting.models';
import { PaymentConfirmFormData } from '../../shared/services/payment-confirm-modal.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { PaymentConfirmModalService } from '../../shared/services/payment-confirm-modal.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-contabilidad',
  imports: [AccountingKPIs, AccountingChart, WeeklySummaryTable, LiquidationTable, LiquidationTableSkeleton, LiquidationHistory, LoadingSkeleton, UiIconComponent],
  template: `
    <div class="space-y-6">
      <!-- Hero Section Premium -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
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
              <ui-icon name="ChartNoAxesCombined" size="xs" class="shrink-0" />
              <span class="text-xs sm:text-sm">Resumen</span>
            </button>

            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'weekly'"
              [class.bg-primary]="activeTab() === 'weekly'"
              [class.text-primary-content]="activeTab() === 'weekly'"
              (click)="setActiveTab('weekly')">
              <ui-icon name="Calendar" size="xs" class="shrink-0" />
              <span class="text-xs sm:text-sm">Semanal</span>
            </button>

            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'payroll'"
              [class.bg-primary]="activeTab() === 'payroll'"
              [class.text-primary-content]="activeTab() === 'payroll'"
              (click)="setActiveTab('payroll')">
              <ui-icon name="HandCoins" size="xs" class="shrink-0" />
              <span class="text-xs sm:text-sm">Liquidación</span>
            </button>

            <button
              type="button"
              class="tab h-11 px-4 sm:px-5 font-semibold transition-all rounded-lg flex items-center gap-2 whitespace-nowrap"
              [class.tab-active]="activeTab() === 'history'"
              [class.bg-primary]="activeTab() === 'history'"
              [class.text-primary-content]="activeTab() === 'history'"
              (click)="setActiveTab('history')">
              <ui-icon name="Clock" size="xs" class="shrink-0" />
              <span class="text-xs sm:text-sm">Historial Liquidaciones</span>
            </button>
          </div>
        </div>

        <!-- Filtros Globales (solo para Resumen General y Resumen Semanal) -->
        @if (activeTab() === 'summary' || activeTab() === 'weekly') {
          <div class="flex flex-row items-center gap-2 w-full lg:w-auto">
            <div class="grid grid-cols-[2fr_1fr] lg:flex lg:items-center gap-2 flex-1 min-w-0 bg-white p-1.5 rounded-xl border border-base-200 shadow-sm">
              <div class="relative w-full min-w-0">
                <select 
                  class="appearance-none w-full bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none truncate" 
                  [value]="selectedMonth()" 
                  (change)="onMonthChange($event)">
                  @for (month of months(); track month.value) {
                    <option [value]="month.value" [selected]="month.value === selectedMonth()" [disabled]="month.disabled">{{ month.label }}</option>
                  }
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                  <ui-icon name="ChevronDown" size="xs" />
                </div>
              </div>

              <div class="w-px h-4 bg-base-200 hidden lg:block"></div>

              <div class="relative w-full min-w-0">
                <select 
                  class="appearance-none w-full bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none truncate" 
                  [value]="selectedYear()" 
                  (change)="onYearChange($event)">
                  @for (year of years(); track year.value) {
                    <option [value]="year.value" [selected]="year.value === selectedYear()" [disabled]="year.disabled">{{ year.value }}</option>
                  }
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                  <ui-icon name="ChevronDown" size="xs" />
                </div>
              </div>
            </div>
            <button class="btn btn-square btn-sm btn-ghost text-primary shrink-0 flex-shrink-0" (click)="applyFilters()" title="Actualizar">
              <ui-icon name="RefreshCw" size="xs" />
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
              <!-- KPIs: Skeleton o datos reales -->
              @if (summaryLoadingState.showSkeleton() && summaryLoadingState.isLoading()) {
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 skeleton-container">
                  @for (i of [1,2,3,4]; track i) {
                    <app-loading-skeleton 
                      type="kpi" 
                      [isExiting]="summaryLoadingState.isSkeletonExiting()" />
                  }
                </div>
              } @else {
                @if (summary()) {
                  <app-accounting-kpis [summary]="summary()!" />
                }
              }

              <!-- Separador Visual y Gráfico: Siempre visible (con skeleton si está cargando) -->
              <div class="divider text-base-content/30 text-xs uppercase tracking-widest my-8">Análisis de Tendencia</div>
              <app-accounting-chart 
                [dailyData]="dailyData()" 
                [isLoading]="summaryLoadingState.isLoading()" />
            </div>
          }

          <!-- Tab: Resumen Semanal -->
          @if (activeTab() === 'weekly') {
            @if (weeklyLoadingState.showSkeleton() && weeklyLoadingState.isLoading()) {
              <div class="skeleton-container">
                <app-loading-skeleton 
                  type="table" 
                  [count]="5"
                  [isExiting]="weeklyLoadingState.isSkeletonExiting()" />
              </div>
            } @else if (weeklySummaries().length > 0) {
              <div class="animate-tab-panel tab-panel-scroll">
                <app-weekly-summary-table 
                  [summaries]="weeklySummaries()" 
                  [mes]="selectedMonth()" 
                  [anio]="selectedYear()" />
              </div>
            }
          }

          <!-- Tab: Liquidación de Choferes -->
          @if (activeTab() === 'payroll') {
            @if (payrollLoadingState.isLoading() && !liquidation()) {
              <!-- Skeleton personalizado que coincide con la estructura de la tabla de liquidación -->
              <app-liquidation-table-skeleton />
            } @else if (payrollLoadingState.showSkeleton() && payrollLoadingState.isLoading() && liquidation()) {
              <!-- Skeleton personalizado cuando hay datos antiguos pero se están recargando -->
              <app-liquidation-table-skeleton [isExiting]="payrollLoadingState.isSkeletonExiting()" />
            } @else if (payrollError()) {
              <div class="card bg-error/10 border border-error/20 rounded-3xl p-6">
                <div class="flex flex-col items-center gap-4 text-center">
                  <ui-icon name="AlertCircle" size="lg" class="text-error" />
                  <div>
                    <h3 class="text-lg font-semibold text-error mb-2">Error al cargar liquidación</h3>
                    <p class="text-sm text-error/70 mb-4">{{ payrollError() }}</p>
                    <button class="btn btn-sm btn-error" (click)="loadLiquidation()">Reintentar</button>
                  </div>
                </div>
              </div>
            } @else if (liquidation()) {
              <div class="animate-tab-panel tab-panel-scroll data-transition entered">
                <app-liquidation-table
                  [liquidation]="liquidation()!"
                  [availableWeeks]="availableWeeks()"
                  [selectedWeek]="selectedWeek()"
                  [payrollPeriod]="payrollPeriod()"
                  [isLoading]="payrollLoadingState.isLoading()"
                  (weekChange)="onWeekChange($event)"
                  (payrollPeriodChange)="onPayrollPeriodChange($event)"
                  (missingAmountChange)="onMissingAmountChange($event)"
                  (aplicarGarantizadoChange)="onAplicarGarantizadoChange($event)"
                  (confirmPayment)="onConfirmPayment($event)"
                  (closePeriod)="onClosePeriod()" />
              </div>
            } @else {
              <!-- Solo mostrar "No hay datos" si NO está cargando -->
              <div class="card bg-base-100 border border-base-200 rounded-3xl p-6">
                <div class="flex flex-col items-center gap-4 text-center">
                  <ui-icon name="FileText" size="lg" class="text-base-content/40" />
                  <div>
                    <h3 class="text-lg font-semibold text-base-content mb-2">No hay datos de liquidación</h3>
                    <p class="text-sm text-base-content/70 mb-4">No se encontraron datos para la semana seleccionada.</p>
                    <button class="btn btn-sm btn-primary" (click)="loadLiquidation()">Recargar</button>
                  </div>
                </div>
              </div>
            }
          }

          <!-- Tab: Historial de Liquidaciones -->
          @if (activeTab() === 'history') {
            <div class="animate-tab-panel">
              @if (historyLoadingState.showSkeleton() && historyLoadingState.isLoading()) {
                <div class="skeleton-container">
                  <app-loading-skeleton 
                    type="table" 
                    [count]="5"
                    [isExiting]="historyLoadingState.isSkeletonExiting()" />
                </div>
              } @else {
                <app-liquidation-history 
                  [liquidations]="liquidationHistory()"
                  [totalGlobal]="historyTotalGlobal()"
                  [isLoading]="historyLoadingState.isLoading()"
                  [filters]="{
                    fecha_desde: historyFilters().fecha_desde || null,
                    fecha_hasta: historyFilters().fecha_hasta || null
                  }"
                  (filterChange)="onHistoryFilterChange($event)"
                />
                
                <!-- Paginación -->
                @if (historyTotalPages() > 1 && !historyLoadingState.isLoading()) {
                  <div class="flex justify-center mt-6">
                    <div class="join">
                      <button
                        type="button"
                        class="btn btn-sm join-item"
                        [disabled]="historyCurrentPage() === 1"
                        (click)="onHistoryPageChange(historyCurrentPage() - 1)">
                        «
                      </button>
                      @for (page of getHistoryPages(); track page) {
                        <button
                          type="button"
                          class="btn btn-sm join-item"
                          [class.btn-active]="page === historyCurrentPage()"
                          (click)="onHistoryPageChange(page)">
                          {{ page }}
                        </button>
                      }
                      <button
                        type="button"
                        class="btn btn-sm join-item"
                        [disabled]="historyCurrentPage() === historyTotalPages()"
                        (click)="onHistoryPageChange(historyCurrentPage() + 1)">
                        »
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
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

    /* Animaciones de transición para paneles de tabs */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    .animate-tab-panel {
      animation: fadeInUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    /* Animación de transición suave para cambios de datos */
    .data-transition {
      transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
    }

    .data-transition.entering {
      opacity: 0;
      transform: translateY(4px);
    }

    .data-transition.entered {
      opacity: 1;
      transform: translateY(0);
    }

    /* Skeleton con animación de entrada */
    .skeleton-container {
      animation: fadeInUp 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    /* Animación de pulso para indicar carga */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .loading-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* Reducir animaciones para usuarios que prefieren movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .animate-tab-panel,
      .data-transition,
      .skeleton-container,
      .loading-pulse {
        animation: none;
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contabilidad implements OnInit {
  private accountingService = inject(AccountingService);
  private loadingStateService = inject(LoadingStateService);
  private paymentModalService = inject(PaymentConfirmModalService);
  private alertModalService = inject(AlertModalService);


  activeTab = signal<AccountingTab>('summary');
  
  // Inicializar con valores del mes y año actual
  private static getInitialMonth(): number {
    return new Date().getMonth() + 1;
  }
  
  private static getInitialYear(): number {
    return new Date().getFullYear();
  }
  
  selectedMonth = signal<number>(Contabilidad.getInitialMonth());
  selectedYear = signal<number>(Contabilidad.getInitialYear());
  
  // Estados de carga con umbral de 200ms
  summaryLoadingState = this.loadingStateService.createLoadingState();
  weeklyLoadingState = this.loadingStateService.createLoadingState();
  payrollLoadingState = this.loadingStateService.createLoadingState();
  historyLoadingState = this.loadingStateService.createLoadingState();
  
  // Signals para manejar errores de liquidación
  payrollError = signal<string | null>(null);

  // Datos
  summaryData = signal<AccountingSummary | null>(null);
  dailyData = signal<DailyProfitabilityData[]>([]);
  weeklySummaries = signal<WeeklySummary[]>([]);
  liquidationData = signal<LiquidationPeriod | null>(null);
  liquidationHistoryData = signal<ClosedLiquidation[]>([]);
  
  // Signals para historial con paginación y filtros
  historyFilters = signal<{ 
    fecha_desde?: string | null; 
    fecha_hasta?: string | null; 
  }>({});
  historyTotal = signal<number>(0);
  historyTotalGlobal = signal<number>(0);
  historyCurrentPage = signal<number>(1);
  historyTotalPages = signal<number>(0);
  historyPerPage = 10;


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

  // Computed signals para meses y años con validación de fechas futuras
  months = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const selectedYearValue = this.selectedYear();
    
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
    
    // Si el año seleccionado es el actual, solo mostrar meses hasta el mes actual
    if (selectedYearValue === currentYear) {
      return monthNames.map(month => ({
        ...month,
        disabled: month.value > currentMonth
      }));
    }
    
    // Si el año seleccionado es futuro, deshabilitar todos los meses
    if (selectedYearValue > currentYear) {
      return monthNames.map(month => ({
        ...month,
        disabled: true
      }));
    }
    
    // Si el año es pasado, todos los meses están disponibles
    return monthNames.map(month => ({
      ...month,
      disabled: false
    }));
  });

  years = computed(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: currentYear - 1, disabled: false },
      { value: currentYear, disabled: false },
      { value: currentYear + 1, disabled: true } // Año futuro bloqueado
    ];
  });

  summary = computed(() => this.summaryData());
  // Computed que valida que los datos correspondan a la semana/período actual
  liquidation = computed(() => {
    const data = this.liquidationData();
    const { mes, anio } = this.payrollDate();
    const semana = this.selectedWeek();
    
    if (!data) {
      return null;
    }
    
    // Validar que los datos correspondan a la semana y período actual
    const matches = data.semana === semana && data.mes === mes && data.anio === anio;
    
    if (!matches) {
      return null;
    }
    
    return data;
  });
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

  // Métodos para manejar cambios con validación
  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newMonth = Number(target.value);
    
    // Validar que no sea un mes futuro
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (this.selectedYear() === currentYear && newMonth > currentMonth) {
      // Si intenta seleccionar un mes futuro, mantener el mes actual
      this.selectedMonth.set(currentMonth);
      // Forzar actualización del selector
      setTimeout(() => {
        target.value = currentMonth.toString();
      }, 0);
      return;
    }
    
    this.selectedMonth.set(newMonth);
    // Cargar datos automáticamente al cambiar el mes
    this.applyFilters();
  }

  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newYear = Number(target.value);
    
    // Validar que no sea un año futuro
    const currentYear = new Date().getFullYear();
    
    if (newYear > currentYear) {
      // Si intenta seleccionar un año futuro, mantener el año actual
      this.selectedYear.set(currentYear);
      // Forzar actualización del selector
      setTimeout(() => {
        target.value = currentYear.toString();
      }, 0);
      return;
    }
    
    this.selectedYear.set(newYear);
    
    // Si el año cambió y ahora es el año actual, ajustar el mes si es necesario
    if (newYear === currentYear) {
      const currentMonth = new Date().getMonth() + 1;
      if (this.selectedMonth() > currentMonth) {
        this.selectedMonth.set(currentMonth);
      }
    }
    
    // Cargar datos automáticamente al cambiar el año
    this.applyFilters();
  }

  applyFilters(): void {
    this.loadSummary();
    this.loadDailyData();
    this.loadWeeklySummaries();
  }

  loadSummary(): void {
    this.summaryLoadingState.setLoading(true);
    this.accountingService.getSummary(this.selectedMonth(), this.selectedYear())
      .pipe(
        catchError((error) => {
          console.error('Error en loadSummary:', error);
          // Mostrar mensaje de error al usuario
          if (error?.status === 401) {
            this.alertModalService.show({
              type: 'error',
              title: 'Error de Autenticación',
              message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
              buttonText: 'Entendido'
            });
          } else if (error?.status === 403) {
            this.alertModalService.show({
              type: 'error',
              title: 'Acceso Denegado',
              message: 'No tienes permisos para acceder a esta información.',
              buttonText: 'Entendido'
            });
          } else {
            this.alertModalService.show({
              type: 'error',
              title: 'Error al Cargar Datos',
              message: error?.error?.detail || error?.message || 'No se pudieron cargar los datos del resumen. Verifica tu conexión e intenta nuevamente.',
              buttonText: 'Entendido'
            });
          }
          return of(null);
        })
      )
      .subscribe((summary: AccountingSummary | null) => {
        if (summary) {
          this.summaryData.set(summary);
        }
        this.summaryLoadingState.setDataLoaded();
      });
  }

  loadDailyData(): void {
    this.accountingService.getDailyProfitability(this.selectedMonth(), this.selectedYear())
      .pipe(
        catchError((error) => {
          console.error('Error en loadDailyData:', error);
          // No mostrar error si es 401/403 (ya se mostró en loadSummary)
          if (error?.status !== 401 && error?.status !== 403) {
            console.warn('No se pudieron cargar los datos diarios:', error);
          }
          return of([]);
        })
      )
      .subscribe((data: DailyProfitabilityData[]) => {
        this.dailyData.set(data);
      });
  }

  loadWeeklySummaries(): void {
    this.weeklyLoadingState.setLoading(true);
    this.accountingService.getWeeklySummary(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of([])))
      .subscribe((summaries: WeeklySummary[]) => {
        this.weeklySummaries.set(summaries);
        this.weeklyLoadingState.setDataLoaded();
      });
  }

  loadLiquidation(): void {
    const { mes, anio } = this.payrollDate();
    const semana = this.selectedWeek();
    
    // No activar loading aquí si ya se activó en onWeekChange/onPayrollPeriodChange
    // Solo activar si no está ya activo (para casos donde se llama directamente, como en ngOnInit o retry)
    if (!this.payrollLoadingState.isLoading()) {
      this.payrollLoadingState.setLoading(true);
    }
    
    this.payrollError.set(null); // Limpiar error previo
    
    this.accountingService.getWeeklyLiquidation(semana, mes, anio)
      .subscribe({
        next: (liquidation: LiquidationPeriod | null) => {
          if (liquidation) {
            // Inicializar aplicar_garantizado solo si es última semana
            liquidation.choferes.forEach((chofer: LiquidationDriver) => {
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
            
            // Usar doble requestAnimationFrame para asegurar que el template se actualice con los datos antes de desactivar loading
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const liquidationComputed = this.liquidation();
                if (liquidationComputed) {
                  this.payrollLoadingState.setDataLoaded();
                } else {
                  this.payrollLoadingState.setDataLoaded();
                }
              });
            });
          } else {
            this.liquidationData.set(null);
            this.payrollLoadingState.setDataLoaded();
          }
        },
        error: (error: any) => {
          this.liquidationData.set(null);
          const errorMessage = error?.error?.detail || error?.message || 'No se pudieron cargar los datos de liquidación.';
          this.payrollError.set(errorMessage);
          this.payrollLoadingState.setDataLoaded();
        }
      });
  }

  loadLiquidationHistory(): void {
    this.historyLoadingState.setLoading(true);
    const filters = this.historyFilters();
    const currentPage = this.historyCurrentPage();
    
    // Convertir fechas a mes (las fechas vienen como YYYY-MM-DD)
    let mes_desde: number | undefined;
    let mes_hasta: number | undefined;
    
    if (filters.fecha_desde) {
      const parts = filters.fecha_desde.split('-');
      if (parts.length === 3) {
        mes_desde = parseInt(parts[1], 10);
      }
    }
    
    if (filters.fecha_hasta) {
      const parts = filters.fecha_hasta.split('-');
      if (parts.length === 3) {
        mes_hasta = parseInt(parts[1], 10);
      }
    }
    
    this.accountingService.getLiquidationHistory({
      mes_desde: mes_desde,
      mes_hasta: mes_hasta,
      page: currentPage,
      per_page: this.historyPerPage
    }).subscribe({
      next: (response) => {
        this.liquidationHistoryData.set(response.items);
        this.historyTotal.set(response.total);
        this.historyTotalGlobal.set(response.total_global);
        this.historyTotalPages.set(response.total_pages);
        this.historyLoadingState.setDataLoaded();
      },
      error: (error) => {
        console.error('Error cargando historial:', error);
        this.liquidationHistoryData.set([]);
        this.historyTotal.set(0);
        this.historyTotalGlobal.set(0);
        this.historyTotalPages.set(0);
        this.historyLoadingState.setDataLoaded();
      }
    });
  }

  onHistoryFilterChange(filters: Record<string, any>): void {
    // Si el objeto está vacío, limpiar todos los filtros
    if (Object.keys(filters).length === 0) {
      this.historyFilters.set({});
      this.historyCurrentPage.set(1);
      this.loadLiquidationHistory();
      return;
    }
    
    const processedFilters: { 
      fecha_desde?: string | null; 
      fecha_hasta?: string | null; 
    } = {
      fecha_desde: filters['fecha_desde'] || null,
      fecha_hasta: filters['fecha_hasta'] || null
    };
    
    this.historyFilters.set(processedFilters);
    this.historyCurrentPage.set(1);
    this.loadLiquidationHistory();
  }

  onHistoryPageChange(page: number): void {
    this.historyCurrentPage.set(page);
    this.loadLiquidationHistory();
  }

  getHistoryPages(): number[] {
    const totalPages = this.historyTotalPages();
    if (totalPages <= 1) return [];
    const pages: number[] = [];
    const current = this.historyCurrentPage();
    const total = totalPages;
    
    // Mostrar máximo 7 páginas
    let start = Math.max(1, current - 3);
    let end = Math.min(total, start + 6);
    
    if (end - start < 6) {
      start = Math.max(1, end - 6);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
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
    // Limpiar datos antiguos ANTES de activar loading para que el template muestre skeleton inmediatamente
    this.liquidationData.set(null);
    // Activar loading ANTES de la petición para que el skeleton aparezca de inmediato
    this.payrollLoadingState.setLoading(true);
    this.loadLiquidation(); // Recargar liquidación con la nueva semana
  }

  onPayrollPeriodChange(period: 'current' | 'previous'): void {
    this.payrollPeriod.set(period);
    this.selectedWeek.set(1); // Resetear a semana 1 al cambiar de mes
    // Limpiar datos antiguos ANTES de activar loading para que el template muestre skeleton inmediatamente
    this.liquidationData.set(null);
    // Activar loading ANTES de la petición para que el skeleton aparezca de inmediato
    this.payrollLoadingState.setLoading(true);
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

  onConfirmPayment(event: { choferId: number; data: { metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string } }): void {
    const liquidation = this.liquidation();
    if (!liquidation) return;

    const chofer = liquidation.choferes.find(c => c.chofer_id === event.choferId);
    if (!chofer) return;

    const { mes, anio } = this.payrollDate();
    const semana = this.selectedWeek();

    // Abrir el modal de confirmación
    this.paymentModalService.open(chofer, mes, anio, semana).then((formData: PaymentConfirmFormData | null) => {
      if (formData) {
        // Llamar al servicio para confirmar el pago
        this.accountingService.confirmWeeklyPayment(
          event.choferId,
          mes,
          anio,
          semana,
          {
            metodo_pago: formData.metodo_pago as 'transferencia' | 'efectivo',
            fecha_pago: formData.fecha_pago,
            codigo_transferencia: formData.codigo_transferencia || undefined,
            observaciones: formData.observaciones || undefined,
            monto_base_semana: chofer.total_ganado,
            monto_bono_final: chofer.monto_a_completar,
            total_a_pagar: chofer.pago_final
          }
        ).pipe(
          catchError((error) => {
            console.error('Error al confirmar pago:', error);
            
            // Cerrar el modal de confirmación
            this.paymentModalService.finishSubmission();
            
            // Mostrar modal de error
            const errorMessage = error?.error?.detail || error?.message || 'No se pudo confirmar el pago. Por favor, verifica los datos e intenta nuevamente.';
            this.alertModalService.show({
              type: 'error',
              title: 'Error al Confirmar Pago',
              message: errorMessage,
              buttonText: 'Entendido'
            });
            
            return of(null);
          })
        ).subscribe((response: any) => {
          if (response) {
            // Cerrar el modal de confirmación
            this.paymentModalService.finishSubmission();
            
            // Invalidar el caché de la liquidación para forzar la recarga
            this.accountingService.invalidateLiquidationCache(semana, mes, anio);
            
            // Mostrar modal de éxito
            this.alertModalService.show({
              type: 'success',
              title: 'Pago Confirmado',
              message: `El pago de ${chofer.chofer_nombre} por ${chofer.pago_final.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 })} ha sido confirmado exitosamente.`,
              buttonText: 'Entendido'
            });
            
            // Recargar la liquidación para actualizar el estado
            this.loadLiquidation();
          }
        });
      }
    });
  }

  onClosePeriod(): void {
    const { mes, anio } = this.payrollDate();
    this.accountingService.closePeriod(mes, anio)
      .pipe(
        catchError((error) => {
          console.error('Error al cerrar período:', error);
          
          // Mostrar modal de error
          const errorMessage = error?.error?.detail || error?.message || 'No se pudo cerrar el período. Por favor, intenta nuevamente.';
          this.alertModalService.show({
            type: 'error',
            title: 'Error al Cerrar Período',
            message: errorMessage,
            buttonText: 'Entendido'
          });
          
          return of(null);
        })
      )
      .subscribe((response: void | null) => {
        if (response !== null) {
          // Mostrar modal de éxito
          this.alertModalService.show({
            type: 'success',
            title: 'Período Cerrado',
            message: `El período de ${this.getMonthName(mes)} ${anio} ha sido cerrado y finalizado exitosamente.`,
            buttonText: 'Entendido'
          });
          
          // Recargar liquidación
          this.loadLiquidation();
        }
      });
  }

  private getMonthName(mes: number): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1] || '';
  }
}
