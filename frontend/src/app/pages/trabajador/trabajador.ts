import { Component, ChangeDetectionStrategy, inject, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkerService } from '../../shared/services/worker.service';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import { TodayRecordStatusService } from '../../shared/services/today-record-status.service';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { BusIcon } from '../../shared/components/bus-icon/bus-icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, delay } from 'rxjs';
import type { DailyRecord } from '../../shared/models/daily-record.models';

@Component({
  selector: 'app-trabajador',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSkeleton, BusIcon],
  template: `
    <div class="trabajador-background-enter min-h-screen bg-slate-50 pb-28 font-sans">
      @if (profileLoadingState.showSkeleton() && profileLoadingState.isLoading()) {
        <app-loading-skeleton type="worker-header" />
      } @else {
      <header class="trabajador-header-enter relative pt-10 pb-20 px-6 rounded-b-[3rem] overflow-hidden z-0 shadow-2xl shadow-blue-900/20">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 z-0"></div>
        <div
          class="absolute inset-0 opacity-10 z-0"
          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
        ></div>
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none"></div>
        <div class="relative z-10 text-white flex justify-between items-start">
          <div>
            <p class="text-blue-100 text-xs font-bold uppercase tracking-[0.35em] mb-1 opacity-80">Bienvenido</p>
            <h1 class="text-3xl font-black tracking-tight drop-shadow-sm">{{ workerName() }}</h1>
            <div class="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
              <app-bus-icon class="w-5 h-5 text-white drop-shadow-md"></app-bus-icon>
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
        @if (profileLoadingState.showSkeleton() && profileLoadingState.isLoading()) {
          <div class="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden">
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-3"></div>
            <div class="p-6 space-y-4">
              <div class="h-6 w-3/4 skeleton-shimmer rounded"></div>
              <div class="h-4 w-full skeleton-shimmer rounded"></div>
              <div class="h-12 w-full skeleton-shimmer rounded-xl"></div>
            </div>
          </div>
        } @else if (todayRecordStatus() === null || (statusLoadingState.showSkeleton() && statusLoadingState.isLoading())) {
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
        @if (historyLoadingState.showSkeleton() && historyLoadingState.isLoading()) {
          <app-loading-skeleton type="worker-timeline" />
          @if (historyLoadingState.showFeedback()) {
            <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p class="text-sm text-blue-700">{{ historyLoadingState.feedbackMessage() }}</p>
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
              [class.trabajador-activity-delay-2]="i === 2">
              <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
                <div class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-500]="activity.type === 'report'" [class.bg-blue-500]="activity.type === 'assignment'" [class.bg-amber-500]="activity.type === 'warning'"></div>
              </div>
              <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100" [class.border-l-4]="activity.type === 'warning'" [class.border-l-amber-400]="activity.type === 'warning'" [class.group-active:scale-[0.99]]="activity.type === 'report'" [class.transition-transform]="activity.type === 'report'">
                <div class="flex justify-between items-start mb-1">
                  <p class="font-bold text-sm text-slate-800">{{ activity.title }}</p>
                  <span class="text-[10px] font-normal text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{{ activity.time }}</span>
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

  // Estados de carga
  profileLoadingState = this.loadingStateService.createLoadingState();
  historyLoadingState = this.loadingStateService.createLoadingState();
  statusLoadingState = this.loadingStateService.createLoadingState();

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

  private statusEffect = effect(() => {
    const status = this.todayRecordStatus();
    // Verificar que el estado realmente llegó (no es null inicial)
    if (status !== null && this.statusLoadingState.isLoading()) {
      this.statusLoadingState.setDataLoaded();
    }
  });

  ngOnInit(): void {
    // Iniciar carga de perfil (crítico)
    this.profileLoadingState.setLoading(true);
    
    // Iniciar carga del estado del reporte (crítico también, pero después del perfil)
    this.statusLoadingState.setLoading(true);
    
    // Iniciar carga de historial después de 400ms (stagger)
    setTimeout(() => {
      this.historyLoadingState.setLoading(true);
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

  // Computed: Actividad reciente
  recentActivity = computed(() => {
    const history = this.recentHistory();
    
    // Obtener últimos 3 registros
    const recentRecords = history
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3);

    const activities: Array<{
      id: string;
      type: 'report' | 'assignment' | 'warning';
      title: string;
      description: string;
      time: string;
    }> = [];

    // Agregar registros recientes
    recentRecords.forEach((record) => {
      const date = new Date(record.fecha);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let timeLabel = '';
      if (diffDays === 0) {
        timeLabel = 'Hoy';
      } else if (diffDays === 1) {
        timeLabel = 'Ayer';
      } else if (diffDays < 7) {
        timeLabel = `Hace ${diffDays} días`;
      } else {
        timeLabel = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
      }

      const estadoLower = record.estado.toLowerCase();
      const statusText = estadoLower.includes('completo')
        ? 'completado sin incidentes'
        : estadoLower.includes('incidente')
        ? 'con incidente reportado'
        : 'pendiente de validación';

      activities.push({
        id: record.id.toString(),
        type: record.incidente_critico ? 'warning' : 'report',
        title: 'Reporte enviado',
        description: `Registro diario ${statusText}.`,
        time: timeLabel
      });
    });

    // Agregar actividad de asignación (mock por ahora)
    if (activities.length < 3) {
      activities.push({
        id: 'assignment-1',
        type: 'assignment',
        title: 'Nueva asignación',
        description: `Admin te asignó la ${this.assignedMachine()}.`,
        time: 'Ayer'
      });
    }

    return activities;
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
}
