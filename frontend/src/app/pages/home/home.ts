import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { AlertList } from '../../shared/dashboard/alert-list/alert-list';
import { FinancialSummary } from '../../shared/dashboard/financial-summary/financial-summary';
import { DailyRecordsTable } from '../../shared/dashboard/daily-records-table/daily-records-table';
import { AlertService } from '../../shared/services/alert.service';
import { DashboardService } from '../../shared/services/dashboard.service';
import { Alert, DailyRecord, FinancialData, FinancialMetric } from '../../shared/models/dashboard.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-home',
  imports: [AlertList, FinancialSummary, DailyRecordsTable, LoadingSkeleton],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header -->
      <div class="animate-header-enter">
        <h1 class="text-4xl font-bold mb-2">Dashboard del Administrador</h1>
        <p class="text-base-content/70">
          Vista rápida del estado operativo, alertas críticas y rendimiento financiero de la flota.
        </p>
      </div>

      <!-- Zona VIP: KPIs Superiores (4 Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @if (isLoading()) {
          @for (i of [1,2,3,4]; track i) {
            <app-loading-skeleton type="kpi" />
          }
        } @else {
          <!-- Card 1: Ganancia Neta Total -->
          <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter group overflow-hidden relative">
          <div class="absolute -right-4 -bottom-4 text-success/10 group-hover:text-success/20 transition-colors duration-300 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="card-body p-5 relative z-10 min-w-0">
            <div class="text-sm text-base-content/70 mb-1">Ganancia Neta Total</div>
            <div class="text-[clamp(1.25rem,2.5vw,2rem)] sm:text-[clamp(1.5rem,3vw,2rem)] font-bold tabular-nums break-words leading-tight">{{ gananciaNetaTotal() }}</div>
            <div class="text-xs text-base-content/60 mt-2">Período actual</div>
          </div>
        </div>

        <!-- Card 2: Ingreso Total -->
        <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter-delay-1 group overflow-hidden relative">
          <div class="absolute -right-4 -bottom-4 text-primary/10 group-hover:text-primary/20 transition-colors duration-300 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="card-body p-5 relative z-10 min-w-0">
            <div class="text-sm text-base-content/70 mb-1">Ingreso Total</div>
            <div class="text-[clamp(1.25rem,2.5vw,2rem)] sm:text-[clamp(1.5rem,3vw,2rem)] font-bold tabular-nums break-words leading-tight">{{ ingresoTotal() }}</div>
            <div class="text-xs text-base-content/60 mt-2">Período actual</div>
          </div>
        </div>

        <!-- Card 3: Estado de Flota -->
        <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter-delay-2 group overflow-hidden relative">
          <div class="absolute -right-4 -bottom-4 text-info/10 group-hover:text-info/20 transition-colors duration-300 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div class="card-body p-5 relative z-10 min-w-0">
            <div class="text-sm text-base-content/70 mb-1">Máquinas Activas</div>
            <div class="text-[clamp(1.25rem,2.5vw,2rem)] sm:text-[clamp(1.5rem,3vw,2rem)] font-bold break-words leading-tight">{{ maquinasActivas() }}</div>
            <div class="text-xs text-base-content/60 mt-2">En operación hoy</div>
          </div>
        </div>

        <!-- Card 4: Resumen de Alertas -->
        <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter-delay-3 group overflow-hidden relative">
          <div class="absolute -right-4 -bottom-4 text-warning/10 group-hover:text-warning/20 transition-colors duration-300 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div class="card-body p-5 relative z-10 min-w-0">
            <div class="text-sm text-base-content/70 mb-2">Resumen de Alertas</div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span class="text-xl font-bold">{{ alertCounts().critical }}</span>
                <span class="text-xs text-base-content/70">críticas</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span class="text-xl font-bold">{{ alertCounts().warning }}</span>
                <span class="text-xs text-base-content/70">advertencias</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <span class="text-xl font-bold">{{ alertCounts().info }}</span>
                <span class="text-xs text-base-content/70">informativas</span>
              </div>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Zona de Análisis: Gráfico (66%) + Alertas (33%) -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Gráfico Financiero (2/3 del ancho) -->
        <div class="xl:col-span-2 animate-page-enter" style="animation-delay: 200ms; animation-fill-mode: both;">
          <app-financial-summary [showChartOnly]="true" (metricChange)="onMetricChange($event)" />
        </div>

        <!-- Alertas Compactas (1/3 del ancho) -->
        <div class="xl:col-span-1 animate-page-enter" style="animation-delay: 250ms; animation-fill-mode: both;">
          <app-alert-list
            [alerts]="alerts()"
            [isExpanded]="true"
            (deleteAlert)="onDeleteAlert($event)"
            (deleteAllAlerts)="onDeleteAllAlerts()" />
        </div>
      </div>

      <!-- Zona de Detalle: Tabla Full Width -->
      <div class="animate-page-enter" style="animation-delay: 300ms; animation-fill-mode: both;">
        @if (isLoading()) {
          <app-loading-skeleton type="table" [count]="5" />
        } @else {
          <app-daily-records-table
            [records]="dailyRecords()"
            [showOnlyPending]="showOnlyPending()"
            (toggleFilter)="togglePendingFilter()" />
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private alertService = inject(AlertService);
  private dashboardService = inject(DashboardService);

  showOnlyPending = signal(false);
  currentFinancialMetric = signal<FinancialMetric>('Ganancia Neta');
  isLoading = signal(true);
  
  // Cargar alertas
  alertsData = toSignal(
    this.alertService.getAlerts().pipe(
      catchError(() => of<Alert[]>([]))
    ),
    { initialValue: [] }
  );

  alerts = computed(() => this.alertsData() ?? []);

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
      catchError(() => of<DailyRecord[]>(this.getMockDailyRecords()))
    ),
    { initialValue: [] }
  );

  dailyRecords = computed(() => {
    const records = this.dailyRecordsData() ?? [];
    // Si tenemos datos, desactivar loading
    if (records.length > 0 && this.isLoading()) {
      setTimeout(() => this.isLoading.set(false), 100);
    }
    return records;
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
    // Desactivar loading después de un tiempo razonable
    setTimeout(() => {
      if (this.dailyRecords().length > 0 || this.alerts().length > 0) {
        this.isLoading.set(false);
      }
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
        machineId: '02',
        driver: 'Ana Gómez',
        date: yesterday,
        status: 'PENDIENTE_TRABAJADOR',
        recaudacion: 100000
      },
      {
        machineId: '04',
        driver: 'Luis Martínez',
        date: today,
        status: 'INCIDENTE_REPORTADO',
        recaudacion: 85000
      },
      {
        machineId: '01',
        driver: 'Carlos Rodríguez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        machineId: '05',
        driver: 'Juan Pérez',
        date: yesterday,
        status: 'NO_TRABAJADO',
        motivo: 'Descanso Semanal'
      },
      {
        machineId: '03',
        driver: 'María López',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        machineId: '07',
        driver: 'Pedro Gómez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        machineId: '08',
        driver: 'Juan Pérez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      },
      {
        machineId: '09',
        driver: 'Juan Pérez',
        date: today,
        status: 'COMPLETO',
        recaudacion: 100000
      }
    ];
  }

  onDeleteAlert(alertId: string): void {
    // TODO: Implementar lógica para eliminar alerta
    console.log('Eliminar alerta:', alertId);
    // Ejemplo: this.alertService.deleteAlert(alertId);
  }

  onDeleteAllAlerts(): void {
    // TODO: Implementar lógica para eliminar todas las alertas
    console.log('Eliminar todas las alertas');
    // Ejemplo: this.alertService.deleteAllAlerts();
  }
}
