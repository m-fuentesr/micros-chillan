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

@Component({
  selector: 'app-home',
  imports: [AlertList, FinancialSummary, DailyRecordsTable, LoadingSkeleton],
  template: `
    <div class="space-y-6">
      <!-- Header - Aparece primero -->
      <div class="dashboard-header-enter border-b-2 border-b-base-300 pb-4 mb-6">
        <h1 class="text-4xl font-bold mb-3 border-l-4 border-l-primary pl-4">Dashboard del Administrador</h1>
        <p class="text-base-content/70 italic">
          Vista rápida del estado operativo, alertas críticas y rendimiento financiero de la flota.
        </p>
      </div>

      <!-- Zona VIP: KPIs Superiores (4 Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 dashboard-content-enter">
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
            <div class="text-sm text-base-content/70 font-normal mb-2 border-l-4 border-l-primary pl-2">Ganancia Neta Total</div>
            <div class="text-[clamp(1.5rem,3vw,2.5rem)] sm:text-[clamp(1.75rem,3.5vw,2.75rem)] font-black tabular-nums break-words leading-tight">{{ gananciaNetaTotal() }}</div>
            <div class="text-xs text-base-content/60 italic mt-2">Período actual</div>
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
            <div class="text-sm text-base-content/70 font-normal mb-2 border-l-4 border-l-primary pl-2">Ingreso Total</div>
            <div class="text-[clamp(1.5rem,3vw,2.5rem)] sm:text-[clamp(1.75rem,3.5vw,2.75rem)] font-black tabular-nums break-words leading-tight">{{ ingresoTotal() }}</div>
            <div class="text-xs text-base-content/60 italic mt-2">Período actual</div>
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
            <div class="text-sm text-base-content/70 font-normal mb-2 border-l-4 border-l-primary pl-2">Máquinas Activas</div>
            <div class="text-[clamp(1.5rem,3vw,2.5rem)] sm:text-[clamp(1.75rem,3.5vw,2.75rem)] font-black break-words leading-tight">{{ maquinasActivas() }}</div>
            <div class="text-xs text-base-content/60 italic mt-2">En operación hoy</div>
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
            <div class="text-sm text-base-content/70 font-normal mb-2 border-l-4 border-l-primary pl-2">Resumen de Alertas</div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span class="text-2xl font-black">{{ alertCounts().critical }}</span>
                <span class="text-xs text-base-content/70 italic">críticas</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span class="text-2xl font-black">{{ alertCounts().warning }}</span>
                <span class="text-xs text-base-content/70 italic">advertencias</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <span class="text-2xl font-black">{{ alertCounts().info }}</span>
                <span class="text-xs text-base-content/70 italic">informativas</span>
              </div>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Zona de Análisis: Gráfico (66%) + Alertas (33%) -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 border-t-2 border-t-base-300 pt-6 dashboard-content-enter-delay-1">
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
      </div>

      <!-- Zona de Detalle: Tabla Full Width -->
      <div class="border-t-2 border-t-base-300 pt-6 dashboard-content-enter-delay-2">
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
  styles: [
    `
    /* ============================================
       TRANSICIÓN "LA INMERSIÓN FOCAL" - DASHBOARD
       ============================================ */
    
    /* Header aparece primero - Fade up rápido */
    .dashboard-header-enter {
      animation: dashboardHeaderEnter 650ms cubic-bezier(0.22, 0.61, 0.36, 1) 260ms forwards;
      opacity: 0;
      transform: translateY(-15px);
    }
    
    @keyframes dashboardHeaderEnter {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Contenido principal - Staggered fade-up */
    .dashboard-content-enter {
      animation: dashboardContentEnter 850ms cubic-bezier(0.22, 0.61, 0.36, 1) 520ms forwards;
      opacity: 0;
      transform: translateY(30px);
    }
    
    @keyframes dashboardContentEnter {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Delay para segunda sección */
    .dashboard-content-enter-delay-1 {
      animation: dashboardContentEnter 850ms cubic-bezier(0.22, 0.61, 0.36, 1) 620ms forwards;
      opacity: 0;
      transform: translateY(30px);
    }
    
    /* Delay para tercera sección */
    .dashboard-content-enter-delay-2 {
      animation: dashboardContentEnter 850ms cubic-bezier(0.22, 0.61, 0.36, 1) 720ms forwards;
      opacity: 0;
      transform: translateY(30px);
    }
    
    /* Cards individuales con stagger adicional */
    .dashboard-content-enter .card {
      animation: dashboardCardEnter 650ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateY(15px);
    }
    
    .dashboard-content-enter .card:nth-child(1) {
      animation-delay: 260ms;
    }
    
    .dashboard-content-enter .card:nth-child(2) {
      animation-delay: 320ms;
    }
    
    .dashboard-content-enter .card:nth-child(3) {
      animation-delay: 380ms;
    }
    
    .dashboard-content-enter .card:nth-child(4) {
      animation-delay: 440ms;
    }
    
    @keyframes dashboardCardEnter {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .dashboard-header-enter,
      .dashboard-content-enter,
      .dashboard-content-enter-delay-1,
      .dashboard-content-enter-delay-2,
      .dashboard-content-enter .card {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
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
