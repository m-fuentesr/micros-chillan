import { Component, ChangeDetectionStrategy, inject, computed, OnInit, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { WorkerService } from '../../../shared/services/worker.service';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, delay } from 'rxjs';
import { AnimatedCounterDirective } from '../../../shared/directives/animated-counter.directive';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, CommonModule, LoadingSkeleton, AnimatedCounterDirective, UiIconComponent],
  template: `
    <div class="perfil-background-enter min-h-screen bg-slate-50 pb-28 font-sans">
      @if (profileLoadingState.isLoading()) {
        <div class="relative bg-gradient-to-br from-slate-200 to-slate-300 pb-24 pt-8 px-6 rounded-b-[2.5rem] shadow-lg">
          <div class="flex flex-col items-center">
            <div class="w-20 h-20 skeleton-shimmer rounded-full mb-3"></div>
            <div class="h-6 w-32 skeleton-shimmer rounded mb-2"></div>
            <div class="h-4 w-24 skeleton-shimmer rounded"></div>
          </div>
        </div>
      } @else {
      <header class="perfil-header-enter relative pt-0 pb-20 px-6 rounded-b-[3rem] overflow-hidden z-0 shadow-2xl shadow-blue-900/20">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 z-0 rounded-b-[3rem]"></div>
        <div
          class="absolute inset-0 opacity-10 z-0 rounded-b-[3rem] overflow-hidden pointer-events-none"
          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
        ></div>
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none"></div>
        <div class="relative z-10 flex flex-col items-center text-white text-center" [style.padding-top]="'calc(40px + env(safe-area-inset-top, 0px))'">
          <div class="avatar online mb-3">
            <div class="w-20 rounded-full ring ring-white ring-offset-base-100 ring-offset-2 bg-white/20 backdrop-blur-sm flex items-center justify-center text-primary">
              <ui-icon name="IdCard" size="xl" class="text-white drop-shadow-md" />
            </div>
          </div>
          
          <h1 class="text-lg sm:text-xl md:text-2xl font-bold px-2 break-words max-w-full drop-shadow-sm">{{ workerName() }}</h1>
          <div class="text-blue-100 text-sm flex flex-col items-center gap-1 mt-1">
            <span class="opacity-90">Chofer Profesional</span>
            
            @if (phoneNumber()) {
              <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full mt-1 backdrop-blur-md border border-white/20 shadow-sm">
                <ui-icon name="Phone" size="xs" />
                <span class="font-mono text-xs tracking-wide">{{ phoneNumber() }}</span>
              </div>
            }
          </div>
        </div>
      </header>
      }

      <div class="perfil-stats-enter px-4 mt-4 mb-6 relative z-10">
        @if (statsLoadingState.isLoading()) {
          <app-loading-skeleton type="worker-stats" />
          @if (statsLoadingState.showFeedback()) {
            <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p class="text-sm text-blue-700">{{ statsLoadingState.feedbackMessage() }}</p>
            </div>
          }
        } @else {
        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 flex justify-between items-center divide-x divide-slate-100">
          <div class="flex-1 text-left px-2 pl-4 border-l-4 border-l-primary">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Días Trab.</p>
            <p class="text-2xl font-black text-slate-800 tabular-nums" [appAnimatedCounter]="daysWorked()" [duration]="1200"></p>
          </div>

          <div class="flex-1 text-left px-2 pl-4 border-l-4 border-l-primary">
            <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Recaudado</p>
            <p class="text-2xl font-black text-emerald-600 tracking-tight tabular-nums" [appAnimatedCounter]="totalRevenue()" [duration]="1500" format="currency" currencyCode="CLP" currencyDisplay="symbol-narrow" [minFractionDigits]="0" [maxFractionDigits]="0"></p>
          </div>
        </div>
        }
      </div>

      <div class="perfil-content-enter px-6 mt-6 space-y-6">
        @if (profileLoadingState.isLoading()) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div class="h-4 w-full skeleton-shimmer rounded"></div>
            <div class="h-4 w-full skeleton-shimmer rounded"></div>
            <div class="h-4 w-3/4 skeleton-shimmer rounded"></div>
          </div>
        } @else {
        <div>
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Gestión</h3>
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden space-y-0.5">
            <a routerLink="/trabajador/mi-historial" class="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors active:bg-blue-50 group">
              <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ui-icon name="Calendar" size="sm" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold text-slate-700">Historial de Reportes</p>
                <p class="text-xs text-slate-400">Revisar tus envíos anteriores</p>
              </div>
              <ui-icon name="ChevronRight" size="sm" class="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </a>
            <a routerLink="/trabajador/centro-ayuda" class="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors active:bg-blue-50 group border-t border-slate-100">
              <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ui-icon name="LifeBuoy" size="sm" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold text-slate-700">Centro de Ayuda</p>
                <p class="text-xs text-slate-400">Guías y respuestas rápidas</p>
              </div>
              <ui-icon name="ChevronRight" size="sm" class="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </a>
          </div>
        </div>

        <div>
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Información</h3>
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            @if (rut()) {
              <div class="flex justify-between border-b border-slate-50 pb-3">
                <span class="text-sm text-slate-400">RUT</span>
                <span class="text-sm font-bold text-slate-700 font-mono">{{ rut() }}</span>
              </div>
            }
            @if (assignedMachine()) {
              <div class="flex justify-between border-b border-slate-50 pb-3">
                <span class="text-sm text-slate-400">Máquina</span>
                <span class="text-sm font-semibold text-slate-700">{{ assignedMachine() }}</span>
              </div>
            }
            @if (email()) {
              <div class="flex justify-between">
                <span class="text-sm text-slate-400">Email</span>
                <span class="text-sm font-semibold text-slate-700 truncate">{{ email() }}</span>
              </div>
            }
          </div>
        </div>

        <div class="mt-12">
          <button class="w-full py-3 px-4 border border-red-200 text-red-600 bg-transparent rounded-xl font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2" (click)="openLogoutConfirm()">
            <ui-icon name="LogOut" size="sm" />
            Cerrar Sesión
          </button>
        </div>
        }

        <div class="pt-4">
          <p class="text-center text-[10px] text-slate-300 mt-4">Versión 2.4.0</p>
        </div>
      </div>
    </div>

    <!-- Modal Confirmación Logout (full viewport, estilo consistente) -->
    @if (logoutModalOpen()) {
      <div class="fixed inset-0 z-[1100] flex items-center justify-center px-4 sm:px-6">
        <div class="absolute inset-0 bg-base-content/60 backdrop-blur-sm" (click)="closeLogoutModal()"></div>
        <div class="relative w-full max-w-md">
          <div class="card bg-base-100 shadow-2xl border border-base-200 rounded-2xl overflow-hidden animate-fade-in">
            <div class="card-body p-6 sm:p-7">
              <div class="flex items-start gap-4 pb-4 border-b border-base-200">
                <div class="p-3 rounded-xl bg-error/10 text-error shrink-0 ring-4 ring-error/5">
                  <ui-icon name="TriangleAlert" size="md" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-base-content">¿Cerrar sesión?</h3>
                  <p class="text-sm text-base-content/70 mt-1">Confirma para salir de tu cuenta.</p>
                </div>
              </div>
              <div class="pt-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button class="btn btn-ghost w-full sm:w-auto rounded-xl border border-base-300 hover:border-base-content/20 font-semibold" type="button" (click)="closeLogoutModal()">Cancelar</button>
                <button class="btn btn-error text-white w-full sm:w-auto shadow-error/20 rounded-xl border border-error/30 font-semibold" type="button" (click)="confirmLogout()">Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de confirmación de cierre de sesión -->
  `,
  styles: [
    `
    /* ============================================
       ANIMACIONES DE ENTRADA ELEGANTES - PERFIL
       Transición slide desde la derecha (navegación lateral)
       ============================================ */
    
    /* Fondo: Fade-in suave */
    .perfil-background-enter {
      animation: perfilBackgroundEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      will-change: opacity;
      animation-fill-mode: both;
    }
    
    @keyframes perfilBackgroundEnter {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    
    /* Header: Slide desde la derecha con fade */
    .perfil-header-enter {
      animation: perfilHeaderEnter 650ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateX(30px);
      will-change: opacity, transform;
      animation-fill-mode: both;
    }
    
    @keyframes perfilHeaderEnter {
      0% {
        opacity: 0;
        transform: translateX(30px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Stats: Slide desde la derecha con delay */
    .perfil-stats-enter {
      animation: perfilContentEnter 650ms cubic-bezier(0.22, 0.61, 0.36, 1) 150ms forwards;
      opacity: 0;
      transform: translateX(30px);
      will-change: opacity, transform;
      animation-fill-mode: both;
    }
    
    /* Contenido: Slide desde la derecha con delay adicional */
    .perfil-content-enter {
      animation: perfilContentEnter 650ms cubic-bezier(0.22, 0.61, 0.36, 1) 250ms forwards;
      opacity: 0;
      transform: translateX(30px);
      will-change: opacity, transform;
      animation-fill-mode: both;
    }
    
    @keyframes perfilContentEnter {
      0% {
        opacity: 0;
        transform: translateX(30px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .perfil-background-enter,
      .perfil-header-enter,
      .perfil-stats-enter,
      .perfil-content-enter {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    /* Animación modal */
    .animate-fade-in {
      animation: fadeInModal 200ms ease-out forwards;
      opacity: 0;
      transform: translateY(8px);
    }

    @keyframes fadeInModal {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private workerService = inject(WorkerService);
  private loadingStateService = inject(LoadingStateService);

  // Estados de carga
  profileLoadingState = this.loadingStateService.createLoadingState();
  statsLoadingState = this.loadingStateService.createLoadingState();

  // Obtener perfil del trabajador (carga crítica - sin delay)
  private workerProfile = toSignal(
    this.workerService.getProfile().pipe(
      catchError(() => of(null))
    ),
    { initialValue: null }
  );

  // Obtener estadísticas mensuales (carga secundaria - con delay de 200ms)
  private monthlyStats = toSignal(
    this.workerService.getMonthlyStats().pipe(
      delay(200), // Stagger: cargar después del perfil
      catchError(() => of(null))
    ),
    { initialValue: null }
  );

  // Effects como inicializadores de campo (contexto de inyección válido)
  private profileEffect = effect(() => {
    const profile = this.workerProfile();
    // Verificar que el perfil realmente llegó (no es null y tiene datos)
    if (profile !== null && profile.nombre_completo && this.profileLoadingState.isLoading()) {
      this.profileLoadingState.setDataLoaded();
    }
  });

  private statsEffect = effect(() => {
    const stats = this.monthlyStats();
    // Verificar que las stats realmente llegaron (no es null y tiene datos)
    if (stats !== null && stats.estadisticas && this.statsLoadingState.isLoading()) {
      this.statsLoadingState.setDataLoaded();
    }
  });

  ngOnInit(): void {
    // Iniciar carga de perfil (crítico)
    this.profileLoadingState.setLoading(true);
    
    // Iniciar carga de stats después de 200ms (stagger)
    setTimeout(() => {
      this.statsLoadingState.setLoading(true);
    }, 200);
  }

  // Computed: Iniciales del nombre
  initials = computed(() => {
    const profile = this.workerProfile();
    if (profile?.nombre_completo) {
      const parts = profile.nombre_completo.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return profile.nombre_completo.substring(0, 2).toUpperCase();
    }
    return 'TP';
  });

  // Computed: Nombre del trabajador
  workerName = computed(() => {
    const profile = this.workerProfile();
    return profile?.nombre_completo || 'Trabajador';
  });

  // Computed: RUT
  rut = computed(() => {
    const profile = this.workerProfile();
    return profile?.rut || null;
  });

  // Computed: Teléfono
  phoneNumber = computed(() => {
    const profile = this.workerProfile();
    return profile?.telefono || null;
  });

  // Computed: Email
  email = computed(() => {
    const profile = this.workerProfile();
    return profile?.email || null;
  });

  // Computed: Máquina asignada
  assignedMachine = computed(() => {
    const profile = this.workerProfile();
    return profile?.maquina_detalle || null;
  });

  // Computed: Días trabajados (este mes)
  daysWorked = computed(() => {
    const stats = this.monthlyStats();
    return stats?.estadisticas.dias_trabajados || 0;
  });

  // Computed: Recaudado total (este mes)
  totalRevenue = computed(() => {
    const stats = this.monthlyStats();
    return stats?.estadisticas.total_recaudado || 0;
  });

  // Modal logout
  logoutModalOpen = signal(false);

  openLogoutConfirm(): void {
    this.logoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.logoutModalOpen.set(false);
  }

  confirmLogout(): void {
    this.auth.logout();
    this.logoutModalOpen.set(false);
  }
}
