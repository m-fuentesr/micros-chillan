import { Component, ChangeDetectionStrategy, inject, computed, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkerService } from '../../shared/services/worker.service';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import { TodayRecordStatusService } from '../../shared/services/today-record-status.service';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { AlertService } from '../../shared/services/alert.service';
import { AuthService } from '../../shared/services/auth.service';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, delay, EMPTY } from 'rxjs';
import type { DailyRecord } from '../../shared/models/daily-record.models';
import type { Alert } from '../../shared/models/dashboard.models';
import { formatRelativeDate } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-trabajador',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSkeleton, UiIconComponent],
  template: `
    <div class="trabajador-background-enter min-h-screen bg-slate-50 pb-28 font-sans">
      @if (profileLoadingState.isLoading()) {
        <app-loading-skeleton type="worker-header" />
      } @else {
      <header class="trabajador-header-enter relative pt-0 pb-20 px-6 rounded-b-[3rem] overflow-hidden z-0 shadow-2xl shadow-blue-900/20">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 z-0 rounded-b-[3rem]"></div>
        <div
          class="absolute inset-0 opacity-10 z-0 rounded-b-[3rem] overflow-hidden pointer-events-none"
          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
        ></div>
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none"></div>
        <div class="relative z-10 text-white flex justify-between items-start" [style.padding-top]="'calc(40px + env(safe-area-inset-top, 0px))'">
          <div>
            <p class="text-blue-100 text-xs font-bold uppercase tracking-[0.35em] mb-1 opacity-80">Bienvenido</p>
            <h1 class="text-3xl font-black tracking-tight drop-shadow-sm">{{ workerName() }}</h1>
            <div class="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
              <ui-icon name="BusFront" size="md" class="text-white drop-shadow-md" />
              <span class="font-mono font-bold text-sm tracking-wide">{{ assignedMachine() }}</span>
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-black leading-none tracking-tighter">{{ currentDay() }}</div>
            <div class="text-xs font-bold uppercase text-blue-200 tracking-[0.3em]">{{ currentMonth() }}</div>
          </div>
        </div>
      </header>
      }

      <div class="px-5 mt-4 relative z-20 trabajador-content-enter">
        @if (profileLoadingState.isLoading() || statusLoadingState.isLoading()) {
          <div class="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-3"></div>
            <div class="p-6 space-y-4">
              <div class="h-6 w-3/4 skeleton-shimmer rounded"></div>
              <div class="h-4 w-full skeleton-shimmer rounded"></div>
              <div class="h-12 w-full skeleton-shimmer rounded-xl"></div>
            </div>
          </div>
        } @else if (todayRecordStatus() === null) {
          <!-- Skeleton mientras carga el estado del reporte -->
          <div class="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-3"></div>
            <div class="p-6 space-y-4">
              <div class="h-6 w-3/4 skeleton-shimmer rounded"></div>
              <div class="h-4 w-full skeleton-shimmer rounded"></div>
              <div class="h-12 w-full skeleton-shimmer rounded-xl"></div>
            </div>
          </div>
        } @else {
        @if (hasReportToday()) {
          <!-- Estado: Ya reportó hoy -->
          <div class="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 p-3 text-left border-b border-green-100/50 pl-4">
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex justify-center items-center gap-2">
                <span class="relative flex h-2 w-2">
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Reporte completado
              </p>
            </div>
            <div class="p-6">
              <div class="text-left pl-4 border-l-4 border-l-emerald-500">
                <h2 class="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Reporte enviado</h2>
                <p class="text-sm text-slate-500 italic leading-relaxed">Ya has registrado tu reporte diario para hoy. Podrás crear uno nuevo después de las 12:00 AM.</p>
              </div>
            </div>
          </div>
        } @else {
          <!-- Estado: Acción requerida -->
          <div class="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-left border-b border-orange-100/50 pl-4 border-l-4 border-l-primary">
              <p class="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] flex justify-center items-center gap-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Acción requerida
              </p>
            </div>
            <div class="p-6">
              <div class="text-left mb-6 pl-4 border-l-4 border-l-primary">
                <h2 class="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Registro diario</h2>
                <p class="text-sm text-slate-500 italic leading-relaxed">Registra tu operación del día.</p>
              </div>
              <a
                routerLink="/trabajador/reportar"
                class="group relative w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-[0.98]"
              >
                <div class="absolute inset-x-0 top-0 h-[1px] bg-white/20"></div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 transition-transform group-hover:-rotate-12">
                  <path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
                </svg>
                <span class="tracking-wide">Ingresar reporte</span>
              </a>
            </div>
          </div>
        }
        }
      </div>

      <div class="px-6 mt-10 trabajador-content-enter-delay-1">
        <div class="flex justify-between items-end mb-6">
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.35em]">Actividad reciente</h3>
        </div>
        @if (historyLoadingState.isLoading() || alertsLoadingState.isLoading()) {
          <app-loading-skeleton type="worker-timeline" />
          @if (historyLoadingState.showFeedback() || alertsLoadingState.showFeedback()) {
            <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p class="text-sm text-blue-700">{{ historyLoadingState.feedbackMessage() || alertsLoadingState.feedbackMessage() }}</p>
            </div>
          }
        } @else {
        <div class="space-y-0 relative pl-2">
          <div class="absolute left-[19px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
          @for (activity of recentActivity(); track activity.id; let i = $index) {
            <div 
              class="trabajador-activity-item relative pl-10 pb-8 group" 
              [class.pb-0]="i === recentActivity().length - 1"
              [class.trabajador-activity-delay-0]="i === 0"
              [class.trabajador-activity-delay-1]="i === 1"
              [class.trabajador-activity-delay-2]="i === 2"
              [class.trabajador-activity-exit]="removingIds().has(activity.id)">
              <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
                @if (activity.type === 'report') {
                  <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                } @else if (activity.type === 'assignment') {
                  <div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                } @else if (activity.type === 'warning') {
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                } @else if (activity.type === 'notification') {
                  <div class="w-2.5 h-2.5 rounded-full" 
                    [class.bg-red-500]="activity.severity === 'critical'"
                    [class.bg-amber-500]="activity.severity === 'warning'"
                    [class.bg-blue-500]="activity.severity === 'info'"></div>
                }
              </div>
              <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100" 
                [class.border-l-4]="activity.type === 'warning' || activity.type === 'notification'"
                [class.border-l-amber-400]="activity.type === 'warning' || (activity.type === 'notification' && activity.severity === 'warning')"
                [class.border-l-red-400]="activity.type === 'notification' && activity.severity === 'critical'"
                [class.border-l-blue-400]="activity.type === 'notification' && activity.severity === 'info'"
                [class.group-active:scale-[0.99]]="activity.type === 'report'"
                [class.transition-transform]="activity.type === 'report'">
                <div class="flex justify-between items-start mb-1">
                  <p class="font-bold text-sm text-slate-800 flex-1">{{ activity.title }}</p>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-normal text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{{ activity.time }}</span>
                    @if (activity.type === 'notification') {
                      <button
                        class="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-opacity"
                        type="button"
                        (click)="onDismissNotification(activity.id)"
                        aria-label="Marcar como leída">
                        <ui-icon name="X" size="xs" />
                      </button>
                    }
                    @if (activity.type === 'report' || activity.type === 'warning') {
                      <button
                        class="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-opacity"
                        type="button"
                        (click)="onHideReport(activity.id)"
                        aria-label="Ocultar reporte">
                        <ui-icon name="X" size="xs" />
                      </button>
                    }
                  </div>
                </div>
                <p class="text-xs text-slate-500">{{ activity.description }}</p>
              </div>
            </div>
          }
          @if (recentActivity().length === 0) {
            <div class="pl-10 pb-8">
              <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100 pl-4 border-l-4 border-l-primary">
                <p class="text-xs text-slate-500 italic">No hay actividad reciente</p>
              </div>
            </div>
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
    /* ============================================
       ANIMACIONES DE ENTRADA ELEGANTES - TRABAJADOR
       Fade Simple con Stagger Elegante
       ============================================ */
    
    /* Fondo: Fade-in suave */
    .trabajador-background-enter {
      animation: trabajadorBackgroundEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      will-change: opacity;
    }
    
    @keyframes trabajadorBackgroundEnter {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    
    /* Header: Fade-in con slide-down sutil */
    .trabajador-header-enter {
      animation: trabajadorHeaderEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateY(-15px);
      will-change: opacity, transform;
    }
    
    @keyframes trabajadorHeaderEnter {
      0% {
        opacity: 0;
        transform: translateY(-15px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Contenido principal: Fade-up con stagger */
    .trabajador-content-enter {
      animation: trabajadorContentEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 100ms forwards;
      opacity: 0;
      transform: translateY(20px);
      will-change: opacity, transform;
    }
    
    .trabajador-content-enter-delay-1 {
      animation: trabajadorContentEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 200ms forwards;
      opacity: 0;
      transform: translateY(20px);
      will-change: opacity, transform;
    }
    
    @keyframes trabajadorContentEnter {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Items de actividad: Stagger fade-up individual */
    .trabajador-activity-item {
      animation: trabajadorActivityItemEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateY(15px);
      will-change: opacity, transform;
    }
    
    .trabajador-activity-delay-0 {
      animation-delay: 300ms;
    }
    
    .trabajador-activity-delay-1 {
      animation-delay: 400ms;
    }
    
    .trabajador-activity-delay-2 {
      animation-delay: 500ms;
    }
    
    @keyframes trabajadorActivityItemEnter {
      0% {
        opacity: 0;
        transform: translateY(15px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Animación de salida para eliminación (60fps, rápida y fluida) */
    .trabajador-activity-exit {
      animation: trabajadorActivityItemExit 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      will-change: transform, opacity, height, margin;
      pointer-events: none;
      overflow: hidden;
    }

    @keyframes trabajadorActivityItemExit {
      0% {
        opacity: 1;
        transform: translateX(0) scale(1);
        max-height: 200px;
        margin-bottom: 2rem;
      }
      50% {
        opacity: 0;
        transform: translateX(-20px) scale(0.95);
      }
      100% {
        opacity: 0;
        transform: translateX(-30px) scale(0.9);
        max-height: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
      }
    }
    
    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .trabajador-background-enter,
      .trabajador-header-enter,
      .trabajador-content-enter,
      .trabajador-content-enter-delay-1,
      .trabajador-activity-item {
        animation: none;
        opacity: 1;
        transform: none;
      }
      .trabajador-activity-exit {
        animation: none;
        opacity: 0;
        height: 0;
        margin: 0;
        padding: 0;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Trabajador implements OnInit, OnDestroy {
  private workerService = inject(WorkerService);
  private dailyRecordService = inject(DailyRecordService);
  private todayRecordStatusService = inject(TodayRecordStatusService);
  private loadingStateService = inject(LoadingStateService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);

  // Estados de carga
  profileLoadingState = this.loadingStateService.createLoadingState();
  historyLoadingState = this.loadingStateService.createLoadingState();
  statusLoadingState = this.loadingStateService.createLoadingState();
  alertsLoadingState = this.loadingStateService.createLoadingState();

  // Obtener perfil del trabajador (carga crítica - sin delay)
  private workerProfile = toSignal(
    this.workerService.getProfile().pipe(
      catchError(() => of(null))
    ),
    { initialValue: null }
  );

  // Obtener registros recientes usando my-history (carga secundaria - con delay de 400ms)
  private recentHistory = toSignal(
    this.dailyRecordService.getMyHistory('este_mes').pipe(
      delay(400), // Stagger: cargar después del perfil
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  // Signal para alertas del trabajador
  private _workerAlerts = signal<Alert[]>([]);

  // Computed para obtener choferId del usuario actual
  private choferId = computed(() => {
    const currentUser = this.authService.currentUser();
    return currentUser?.choferId || null;
  });

  // Exponer alertas como readonly
  workerAlerts = this._workerAlerts.asReadonly();

  // IDs de reportes ocultos (solo frontend, localStorage)
  private hiddenReportIds = signal<Set<string>>(new Set());

  // IDs de elementos que están siendo eliminados (para animación)
  removingIds = signal<Set<string>>(new Set());

  // Usar el servicio compartido para el estado del reporte
  todayRecordStatus = this.todayRecordStatusService.status;

  // Effects como inicializadores de campo (contexto de inyección válido)
  private profileEffect = effect(() => {
    const profile = this.workerProfile();
    // Verificar que el perfil realmente llegó (no es null y tiene datos)
    if (profile !== null && profile.nombre_completo && this.profileLoadingState.isLoading()) {
      this.profileLoadingState.setDataLoaded();
    }
  });

  private historyEffect = effect(() => {
    const history = this.recentHistory();
    // Verificar que el historial realmente llegó (no es el array vacío inicial)
    // Usamos una marca: si tiene elementos o si el observable ya emitió (verificamos por estructura)
    if (history.length > 0 && this.historyLoadingState.isLoading()) {
      this.historyLoadingState.setDataLoaded();
    }
  });

  // Effect para cargar alertas cuando el chofer_id esté disponible
  private alertsLoadEffect = effect(() => {
    const choferId = this.choferId();
    if (choferId) {
      // Iniciar carga si aún no se ha iniciado
      if (this.alertsLoadingState.isLoading()) {
        // Cargar alertas con delay
        setTimeout(() => {
          this.alertService.getWorkerAlerts(choferId).pipe(
            catchError(() => of<Alert[]>([]))
          ).subscribe({
            next: (alerts) => {
              this._workerAlerts.set(alerts);
              this.alertsLoadingState.setDataLoaded();
            },
            error: () => {
              this._workerAlerts.set([]);
              this.alertsLoadingState.setDataLoaded();
            }
          });
        }, 400); // Stagger: cargar después del perfil
      }
    } else {
      // Si no hay chofer_id, marcar como cargado con array vacío
      this._workerAlerts.set([]);
      if (this.alertsLoadingState.isLoading()) {
        this.alertsLoadingState.setDataLoaded();
      }
    }
  });

  private statusEffect = effect(() => {
    const status = this.todayRecordStatus();
    // Verificar que el estado realmente llegó (no es null inicial)
    if (status !== null && this.statusLoadingState.isLoading()) {
      this.statusLoadingState.setDataLoaded();
    }
  });

  ngOnInit(): void {
    // Cargar reportes ocultos desde localStorage
    this.loadHiddenReports();
    
    // Iniciar carga de perfil (crítico)
    this.profileLoadingState.setLoading(true);
    
    // Iniciar carga del estado del reporte (crítico también, pero después del perfil)
    this.statusLoadingState.setLoading(true);
    
    // Iniciar carga de historial y alertas después de 400ms (stagger)
    setTimeout(() => {
      this.historyLoadingState.setLoading(true);
      // Iniciar carga de alertas (el effect se encargará de cargarlas cuando chofer_id esté disponible)
      this.alertsLoadingState.setLoading(true);
    }, 400);

    // El servicio compartido ya maneja la verificación periódica
    // Solo necesitamos asegurarnos de que el estado esté cargado
    if (this.todayRecordStatus() === null) {
      this.todayRecordStatusService.refreshStatus();
    }
  }

  ngOnDestroy(): void {
    // El servicio compartido maneja su propio ciclo de vida
    // No necesitamos limpiar nada aquí
  }

  // Computed: Nombre del trabajador
  workerName = computed(() => {
    const profile = this.workerProfile();
    return profile?.nombre_completo || 'Trabajador';
  });

  // Computed: Máquina asignada
  assignedMachine = computed(() => {
    const profile = this.workerProfile();
    return profile?.maquina_detalle || 'Sin asignar';
  });

  // Computed: Día actual
  currentDay = computed(() => {
    return new Date().getDate().toString();
  });

  // Computed: Mes actual
  currentMonth = computed(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[new Date().getMonth()];
  });

  // Computed: Determinar si puede crear reporte (usar servicio compartido)
  canCreateReport = this.todayRecordStatusService.canCreateReport;

  // Computed: Determinar si ya tiene reporte hoy (usar servicio compartido)
  hasReportToday = this.todayRecordStatusService.hasReportToday;

  // Computed: Obtener estado del reporte de hoy
  todayRecord = computed(() => {
    const status = this.todayRecordStatus();
    if (status === null) return null; // Aún no se ha cargado
    return status.record;
  });

  // Computed: Monto recaudado formateado
  montoRecaudadoFormatted = computed(() => {
    const record = this.todayRecord();
    const monto = record?.monto_recaudado;
    if (!monto) return '$0';
    return '$' + monto.toLocaleString('es-CL');
  });

  // Computed: Actividad reciente (combinando registros y alertas)
  recentActivity = computed(() => {
    const history = this.recentHistory();
    const alerts = this.workerAlerts();
    const hiddenIds = this.hiddenReportIds();

    const activities: Array<{
      id: string;
      type: 'report' | 'assignment' | 'warning' | 'notification';
      title: string;
      description: string;
      time: string;
      date: string; // Para ordenamiento
      severity?: 'critical' | 'warning' | 'info' | 'success'; // Solo para alertas
    }> = [];

    // Agregar registros diarios (filtrar los ocultos)
    history.forEach((record) => {
      const recordId = `record-${record.id}`;
      // Saltar si está oculto
      if (hiddenIds.has(recordId)) {
        return;
      }

      const timeLabel = formatRelativeDate(record.fecha);
      const estadoLower = record.estado.toLowerCase();
      const statusText = estadoLower.includes('completo')
        ? 'completado sin incidentes'
        : estadoLower.includes('incidente')
        ? 'con incidente reportado'
        : 'pendiente de validación';

      activities.push({
        id: recordId,
        type: record.incidente_critico ? 'warning' : 'report',
        title: 'Reporte enviado',
        description: `Registro diario ${statusText}.`,
        time: timeLabel,
        date: record.fecha
      });
    });

    // Agregar alertas del trabajador
    alerts.forEach((alert: Alert) => {
      const timeLabel = formatRelativeDate(alert.date || new Date().toISOString());
      
      // Determinar tipo según el tipo de alerta
      let type: 'assignment' | 'notification' = 'assignment';
      if (alert.type === 'operational' && alert.title.toLowerCase().includes('asign')) {
        type = 'assignment';
      } else {
        type = 'notification';
      }

      activities.push({
        id: `alert-${alert.id}`,
        type: type,
        title: alert.title,
        description: alert.description,
        time: timeLabel,
        date: alert.date || new Date().toISOString(),
        severity: alert.severity === 'success' ? 'info' : alert.severity // Mapear 'success' a 'info' para consistencia
      });
    });

    // Ordenar por fecha descendente (más reciente primero)
    activities.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Limitar a los últimos 6 items
    return activities.slice(0, 6);
  });

  // Helper: Obtener estado del reporte
  getRecordEstado(): string {
    const record = this.todayRecord();
    return record?.estado || 'Completo';
  }

  // Helper: Verificar si tiene monto recaudado
  hasMontoRecaudado(): boolean {
    const record = this.todayRecord();
    return !!record?.monto_recaudado;
  }

  // Cargar reportes ocultos desde localStorage al inicializar
  private loadHiddenReports(): void {
    try {
      const stored = localStorage.getItem('hidden_reports');
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        this.hiddenReportIds.set(new Set(ids));
      }
    } catch (error) {
      console.error('Error cargando reportes ocultos:', error);
    }
  }

  private saveHiddenReports(ids: Set<string>): void {
    try {
      localStorage.setItem('hidden_reports', JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Error guardando reportes ocultos:', error);
    }
  }

  // Manejar ocultar reporte (solo frontend)
  onHideReport(activityId: string): void {
    // Validar que es un reporte (formato: "record-123")
    if (!activityId.startsWith('record-')) {
      return;
    }

    // 1. Agregar a la lista de elementos que se están eliminando (para animación)
    const currentRemoving = new Set(this.removingIds());
    currentRemoving.add(activityId);
    this.removingIds.set(currentRemoving);

    // 2. Esperar a que termine la animación (250ms) antes de ocultar
    setTimeout(() => {
      // Remover de la lista de eliminando
      const updatedRemoving = new Set(this.removingIds());
      updatedRemoving.delete(activityId);
      this.removingIds.set(updatedRemoving);

      // Agregar a la lista de ocultos
      const currentHidden = new Set(this.hiddenReportIds());
      currentHidden.add(activityId);
      this.hiddenReportIds.set(currentHidden);
      
      // Guardar en localStorage
      this.saveHiddenReports(currentHidden);
    }, 250); // Duración de la animación
  }

  // Manejar eliminación de notificación
  onDismissNotification(activityId: string): void {
    // Extraer ID numérico (formato: "alert-123")
    if (!activityId.startsWith('alert-')) {
      return;
    }
    
    const alertIdStr = activityId.replace('alert-', '');
    const alertId = parseInt(alertIdStr, 10);
    if (isNaN(alertId)) {
      return;
    }

    // 1. Agregar a la lista de elementos que se están eliminando (para animación)
    const currentRemoving = new Set(this.removingIds());
    currentRemoving.add(activityId);
    this.removingIds.set(currentRemoving);

    // Snapshot del estado actual (para rollback)
    const previousAlerts = [...this._workerAlerts()];
    
    // 2. Esperar a que termine la animación (250ms) antes de remover de la UI
    setTimeout(() => {
      // Remover de la lista de eliminando
      const updatedRemoving = new Set(this.removingIds());
      updatedRemoving.delete(activityId);
      this.removingIds.set(updatedRemoving);

      // Optimistic update: Remover de la UI
      // Comparar usando el ID numérico convertido a string
      this._workerAlerts.set(previousAlerts.filter(a => a.id !== alertIdStr));
      
      // Llamar al servidor en segundo plano
      this.alertService.resolveAlert(alertId).pipe(
        catchError((error) => {
          // Rollback en caso de error
          this._workerAlerts.set(previousAlerts);
          
          // Notificar al usuario
          console.error('Error al marcar notificación como leída:', error);
          return EMPTY;
        })
      ).subscribe({
        next: () => {
          // Refrescar alertas después de resolver para sincronizar con el servidor
          const choferId = this.choferId();
          if (choferId) {
            this.alertService.getWorkerAlerts(choferId).pipe(
              catchError(() => of<Alert[]>([]))
            ).subscribe({
              next: (alerts) => {
                this._workerAlerts.set(alerts);
              }
            });
          }
        }
      });
    }, 250); // Duración de la animación
  }
}
