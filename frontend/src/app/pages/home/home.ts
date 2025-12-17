import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, WritableSignal, effect } from '@angular/core';
import { AlertList } from '../../shared/dashboard/alert-list/alert-list';
import { FinancialSummary } from '../../shared/dashboard/financial-summary/financial-summary';
import { DailyRecordsTable } from '../../shared/dashboard/daily-records-table/daily-records-table';
import { AlertService } from '../../shared/services/alert.service';
import { DashboardService } from '../../shared/services/dashboard.service';
import { Alert, DailyRecord, FinancialData, FinancialMetric } from '../../shared/models/dashboard.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, EMPTY } from 'rxjs';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { TransitionService } from '../../shared/services/transition.service';
import { BusIcon } from '../../shared/components/bus-icon/bus-icon';

@Component({
  selector: 'app-home',
  imports: [AlertList, FinancialSummary, DailyRecordsTable, LoadingSkeleton, BusIcon],
  template: `
    <div class="space-y-6">
      <!-- Header - coherente con el resto de la app -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-2xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
              Panel Principal
            </h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
              Vista rápida del estado operativo, alertas críticas y rendimiento financiero de la flota.
            </p>
          </div>
          
        </div>
      </div>

      <!-- Zona VIP: KPIs Superiores (4 Cards) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 page-entry-content">
        @if (isLoading()) {
          @for (i of [1,2,3,4]; track i) {
            <app-loading-skeleton type="dashboard-kpi" />
          }
        } @else {
          <!-- Card 1: Ganancia Neta (El Bolsillo) -->
          <div class="group relative flex flex-col gap-3 md:gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] min-h-[150px] md:min-h-[170px] animate-card-enter-in-context">
            <div class="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-50 opacity-50 blur-xl"></div>
            
            <div class="relative flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Ganancia Neta</h3>
                <p class="text-[10px] font-medium text-zinc-400">Después de operación</p>
              </div>
            </div>

            <div class="relative flex flex-col">
              <div class="text-xl sm:text-3xl font-black tracking-tight text-zinc-900">{{ gananciaNetaTotal() }}</div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  Rentabilidad hoy
                </span>
              </div>
            </div>
          </div>

          <!-- Card 2: Ingreso Total (El Bruto) -->
          <div class="group relative flex flex-col gap-3 md:gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] min-h-[150px] md:min-h-[170px] animate-card-enter-in-context-delay-1">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Recaudación Total</h3>
                <p class="text-[10px] font-medium text-zinc-400">Bruto sin descuentos</p>
              </div>
            </div>

            <div class="flex flex-col w-full">
              <div class="text-xl sm:text-3xl font-black tracking-tight text-zinc-900">{{ ingresoTotal() }}</div>
              <div class="mt-2">
                <span class="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary ring-1 ring-inset ring-primary/15">
                  Total hoy
                </span>
              </div>
            </div>
          </div>

          <!-- Card 3: Operación (El Monitor) -->
          <div class="group relative flex flex-col gap-3 md:gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] min-h-[150px] md:min-h-[170px] animate-card-enter-in-context-delay-2">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <app-bus-icon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Flota en Ruta</h3>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span class="text-sm font-bold text-zinc-700">{{ maquinasActivas() }} Activas</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-end">
                <span class="text-xs font-semibold text-zinc-500">Reportes diarios</span>
                <span class="text-base sm:text-lg font-black tabular-nums text-zinc-900">{{ reportesHoyCompletos() }}<span class="text-zinc-300 mx-1">/</span>{{ reportesHoyTotales() }}</span>
              </div>
              
              <div class="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div class="absolute left-0 top-0 h-full bg-violet-500 rounded-full" [style.width.%]="reportesHoyPorcentaje()"></div>
              </div>
              <p class="text-[10px] text-zinc-400 text-right">
                @if (reportesHoyPendientes() > 0) {
                  Falta {{ reportesHoyPendientes() }} registro(s) por cerrar
                } @else {
                  Todo cerrado hoy
                }
              </p>
            </div>
          </div>

          <!-- Card 4: Alertas (El Semáforo) -->
          <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] min-h-[150px] md:min-h-[170px] animate-card-enter-in-context-delay-3">
            <div class="px-5 pt-5 pb-2">
              <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Resumen de Salud</h3>
            </div>

            <div class="flex flex-col flex-1 px-2 pb-2 gap-1">
              <div class="flex-1 flex items-center justify-between px-4 rounded-2xl bg-red-50/60 border border-red-100/50">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span class="text-xs font-bold text-red-700">Críticas</span>
                </div>
                <span class="text-xl font-black text-red-600">{{ alertCounts().critical }}</span>
              </div>

              <div class="flex gap-1 h-16">
                <div class="flex-1 flex flex-col items-center justify-center rounded-2xl bg-amber-50/60 border border-amber-100/50">
                  <span class="text-lg font-black text-amber-600 leading-none">{{ alertCounts().warning }}</span>
                  <span class="text-[10px] font-bold text-amber-700/70 uppercase">Advertencias</span>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center rounded-2xl bg-blue-50/60 border border-blue-100/50">
                  <span class="text-lg font-black text-blue-600 leading-none">{{ alertCounts().info }}</span>
                  <span class="text-[10px] font-bold text-blue-700/70 uppercase">Info</span>
                </div>
              </div>

            </div>
          </div>
        }
      </div>

      <!-- Zona de Análisis: Gráfico (66%) + Alertas (33%) -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 border-t-2 border-t-base-300 pt-6 page-entry-content-delay-1">
        @if (isLoading()) {
          <div class="xl:col-span-2">
            <app-loading-skeleton type="dashboard-chart" />
          </div>
          <div class="xl:col-span-1">
            <app-loading-skeleton type="dashboard-alerts" />
          </div>
        } @else {
          <!-- Gráfico Financiero (2/3 del ancho) -->
          <div class="xl:col-span-2">
            <app-financial-summary [showChartOnly]="true" (metricChange)="onMetricChange($event)" />
          </div>

          <!-- Alertas Compactas (1/3 del ancho) -->
          <div class="xl:col-span-1">
            <app-alert-list
              [alerts]="alerts()"
              [isExpanded]="true"
              (deleteAlert)="onDeleteAlert($event)"
              (deleteAllAlerts)="onDeleteAllAlerts()" />
          </div>
        }
      </div>

      <!-- Zona de Detalle: Tabla Full Width -->
      <div class="border-t-2 border-t-base-300 pt-6 page-entry-content-delay-2">
        @if (isLoading()) {
          <app-loading-skeleton type="dashboard-table" [count]="5" />
        } @else {
          <app-daily-records-table
            [records]="dailyRecords()"
            [showOnlyPending]="showOnlyPending()"
            (toggleFilter)="togglePendingFilter()" />
        }
      </div>
    </div>
  `,
  styles: [
    `
    /* Las animaciones de entrada ahora se manejan globalmente en styles.css */
    /* (page-entry-header, page-entry-content, page-entry-content-delay-1, page-entry-content-delay-2) */
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private alertService = inject(AlertService);
  private dashboardService = inject(DashboardService);
  private transitionService = inject(TransitionService);

  constructor() {
    // Monitorear cuando el componente se monta
    effect(() => {
      const isTransitioning = this.transitionService.isTransitioning();
    });
  }

  showOnlyPending = signal(false);
  currentFinancialMetric = signal<FinancialMetric>('Ganancia Neta');
  isLoading = signal(true);
  isDeletingAlert = signal(false);
  isDeletingAllAlerts = signal(false);
  
  // Cargar alertas - usar signal mutable para Optimistic UI
  alertsData = toSignal(
    this.alertService.getAlerts().pipe(
      catchError(() => of<Alert[]>([]))
    ),
    { initialValue: [] }
  );

  // Signal mutable para permitir actualizaciones optimistas
  private _alerts = signal<Alert[]>([]);
  private alertsInitialized = false;
  
  // Effect para inicializar _alerts cuando se carguen los datos
  private alertsInitEffect = effect(() => {
    const loaded = this.alertsData();
    if (!this.alertsInitialized && loaded && loaded.length > 0) {
      this._alerts.set([...loaded]);
      this.alertsInitialized = true;
    }
  });
  
  alerts = computed(() => {
    const loaded = this.alertsData();
    const optimistic = this._alerts();
    
    // Si ya inicializamos y hay datos optimistas, usarlos
    if (this.alertsInitialized && optimistic.length >= 0) {
      return optimistic;
    }
    
    // Si no, usar los cargados
    return loaded ?? [];
  });

  alertCounts = computed(() => {
    const alerts = this.alerts();
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  });

  // Cargar registros diarios
  dailyRecordsData = toSignal(
    this.dashboardService.getDailyRecords().pipe(
      catchError((error) => {
        console.warn('Error al cargar registros diarios en home, usando mocks:', error);
        return of<DailyRecord[]>(this.getMockDailyRecords());
      })
    ),
    { initialValue: [] }
  );

  dailyRecords = computed(() => {
    const records = this.dailyRecordsData() ?? [];
    // Si tenemos datos del servicio, usarlos
    if (records.length > 0) {
      if (this.isLoading()) {
        setTimeout(() => this.isLoading.set(false), 100);
      }
      return records;
    }
    // Si no hay datos, usar mocks como fallback para desarrollo
    // Esto asegura que siempre haya datos para mostrar
    return this.getMockDailyRecords();
  });

  // Datos financieros (mismos que usa financial-summary)
  financialData = signal<Record<FinancialMetric, FinancialData[]>>({
    'Ganancia Neta': [
      { machineId: '01', driver: 'Carlos Rodríguez', value: 2450000 },
      { machineId: '02', driver: 'Ana Gómez', value: 3200000 },
      { machineId: '03', driver: 'María López', value: 1800000 },
      { machineId: '05', driver: 'Juan Pérez', value: 4100000 },
      { machineId: '07', driver: 'Pedro Gómez', value: 2800000 }
    ],
    'Ingreso Total': [
      { machineId: '01', driver: 'Carlos Rodríguez', value: 8500000 },
      { machineId: '02', driver: 'Ana Gómez', value: 9200000 },
      { machineId: '03', driver: 'María López', value: 7200000 },
      { machineId: '05', driver: 'Juan Pérez', value: 10500000 },
      { machineId: '07', driver: 'Pedro Gómez', value: 8800000 }
    ]
  });

  // KPIs calculados
  gananciaNetaTotal = computed(() => {
    const data = this.financialData()['Ganancia Neta'];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return this.formatCurrency(total);
  });

  ingresoTotal = computed(() => {
    const data = this.financialData()['Ingreso Total'];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return this.formatCurrency(total);
  });

  reportesHoyTotales = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyRecords().filter(r => r.date === today).length;
  });

  reportesHoyCompletos = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyRecords().filter(r => r.date === today && r.status === 'COMPLETO').length;
  });

  reportesHoyPendientes = computed(() => {
    const total = this.reportesHoyTotales();
    const completos = this.reportesHoyCompletos();
    return Math.max(total - completos, 0);
  });

  reportesHoyPorcentaje = computed(() => {
    const total = this.reportesHoyTotales();
    if (total === 0) return 0;
    const completos = this.reportesHoyCompletos();
    return Math.round((completos / total) * 100);
  });

  maquinasActivas = computed(() => {
    const records = this.dailyRecords();
    const today = new Date().toISOString().split('T')[0];
    const activeMachines = new Set(
      records
        .filter(r => r.date === today && (r.status === 'COMPLETO' || r.status === 'PENDIENTE_TRABAJADOR'))
        .map(r => r.machineId)
    );
    return activeMachines.size;
  });

  ngOnInit(): void {
    // Los datos se cargan automáticamente con toSignal
    // La inicialización de alerts se maneja en el effect
    
    // Desactivar loading después de un tiempo razonable
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  onMetricChange(metric: FinancialMetric): void {
    this.currentFinancialMetric.set(metric);
  }

  togglePendingFilter(): void {
    this.showOnlyPending.update(v => !v);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  private getMockDailyRecords(): DailyRecord[] {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return [
      {
        id: 'mock-1',
        machineId: '02',
        driver: 'Ana Gómez',
        date: yesterday,
        status: 'PENDIENTE_TRABAJADOR',
        recaudacion: 100000
      },
      {
        id: 'mock-2',
        machineId: '04',
        driver: 'Luis Martínez',
        date: today,
        status: 'INCIDENTE_REPORTADO',
        recaudacion: 85000
      },
      {
        id: 'mock-3',
        machineId: '01',
        driver: 'Carlos Rodríguez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        id: 'mock-4',
        machineId: '05',
        driver: 'Juan Pérez',
        date: yesterday,
        status: 'NO_TRABAJADO',
        motivo: 'Descanso Semanal'
      },
      {
        id: 'mock-5',
        machineId: '03',
        driver: 'María López',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        id: 'mock-6',
        machineId: '07',
        driver: 'Pedro Gómez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        id: 'mock-7',
        machineId: '08',
        driver: 'Juan Pérez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        id: 'mock-8',
        machineId: '09',
        driver: 'Juan Pérez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      }
    ];
  }

  onDeleteAlert(alertId: string): void {
    // Prevenir múltiples eliminaciones simultáneas
    if (this.isDeletingAlert()) {
      return;
    }

    // 1. Snapshot del estado actual (para rollback)
    const previousAlerts = [...this._alerts()];
    
    // 2. Optimistic update: Remover inmediatamente de la UI
    this._alerts.set(previousAlerts.filter(a => a.id !== alertId));
    this.isDeletingAlert.set(true);
    
    // 3. Llamar al servidor en segundo plano
    this.alertService.deleteAlert(alertId).pipe(
      catchError((error) => {
        // 4. Rollback en caso de error
        this._alerts.set(previousAlerts);
        
        // 5. Notificar al usuario
        this.showErrorToast('No se pudo eliminar la alerta. Intenta nuevamente.');
        
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.isDeletingAlert.set(false);
      },
      error: () => {
        this.isDeletingAlert.set(false);
      }
    });
  }

  onDeleteAllAlerts(): void {
    // Prevenir múltiples eliminaciones simultáneas
    if (this.isDeletingAllAlerts() || this.isDeletingAlert()) {
      return;
    }

    // 1. Snapshot del estado actual (para rollback)
    const previousAlerts = [...this._alerts()];
    
    // 2. Optimistic update: Remover todas las alertas inmediatamente
    this._alerts.set([]);
    this.isDeletingAllAlerts.set(true);
    
    // 3. Llamar al servidor en segundo plano
    this.alertService.deleteAllAlerts().pipe(
      catchError((error) => {
        // 4. Rollback en caso de error
        this._alerts.set(previousAlerts);
        
        // 5. Notificar al usuario
        this.showErrorToast('No se pudieron eliminar las alertas. Intenta nuevamente.');
        
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.isDeletingAllAlerts.set(false);
      },
      error: () => {
        this.isDeletingAllAlerts.set(false);
      }
    });
  }

  private showErrorToast(message: string): void {
    // Crear toast usando DaisyUI
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end';
    toast.innerHTML = `
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
