import { Component, ViewEncapsulation, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef, computed, effect, OnInit, OnDestroy, afterNextRender } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { NavbarTrabajador } from './shared/navbar-trabajador/navbar-trabajador';
import { CommonModule } from '@angular/common';
import { AuthService } from './shared/services/auth.service';
import { TransitionService } from './shared/services/transition.service';
import { RouteTransitionService } from './shared/services/route-transition.service';
import { RouteTransitionOutlet } from './shared/components/route-transition-outlet/route-transition-outlet';
import { TransitionOrchestratorService } from './shared/services/transition-orchestrator.service';
import { SpinnerService } from './shared/services/spinner.service';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal';
import { MaintenanceFormModalComponent } from './shared/components/maintenance-form-modal/maintenance-form-modal';
import { NewRecordModalComponent } from './shared/components/new-record-modal/new-record-modal';
import { LedgerMovementModalComponent } from './shared/accounting/ledger-movement-modal/ledger-movement-modal';
import { DriverLedgerHistoryComponent } from './shared/accounting/driver-ledger-history/driver-ledger-history';
import { AlertModalComponent } from './shared/components/alert-modal/alert-modal';
import { PaymentConfirmModalComponent } from './shared/components/payment-confirm-modal/payment-confirm-modal';
import { ImageModalComponent } from './shared/components/image-modal/image-modal';
import { GlobalErrorDisplayComponent } from './shared/components/global-error-display/global-error-display';
import { GlobalErrorService } from './shared/services/global-error.service';
import { DriverLedgerHistoryModalService } from './shared/services/driver-ledger-history-modal.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AppUpdateModal } from './shared/components/app-update-modal/app-update-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, NavbarTrabajador, CommonModule, RouteTransitionOutlet, ConfirmModalComponent, MaintenanceFormModalComponent, NewRecordModalComponent, AlertModalComponent, PaymentConfirmModalComponent, ImageModalComponent, GlobalErrorDisplayComponent, LedgerMovementModalComponent, DriverLedgerHistoryComponent, AppUpdateModal],
  template: `
    <!-- CRÍTICO: Spinner de recarga tiene prioridad sobre showInitialLoading -->
    <!-- Spinner de 3 puntos para recarga, cambio de pestaña o volver al navegador -->
    @if (showReloadSpinner()) {
      <div class="reload-spinner-overlay">
        <span class="loading loading-dots loading-lg text-primary"></span>
      </div>
    } @else if (showLogoutSpinner()) {
      <!-- Spinner de logout con animación de salida -->
      <div class="logout-exit-overlay">
        <span class="loading loading-dots loading-lg text-primary"></span>
      </div>
    } @else if (showInitialLoading()) {
      <!-- Loading overlay durante verificación inicial de sesión -->
      <div class="session-verification-overlay"></div>
    }
    
    @if (shouldShowAdminNav() || (isLoggingOut() && showLogoutSpinner())) {
      <!-- Layout con Sidebar (Administrador) -->
      <div class="h-dvh bg-base-200" [class.dashboard-exiting]="isLoggingOut() && showLogoutSpinner()">
        <app-navbar 
          [initialCollapsed]="sidebarCollapsed()"
          [shouldAnimate]="shouldAnimateSidebar()"
          [shouldStartHidden]="shouldStartHidden()"
          (collapsedChange)="onSidebarCollapseChange($event)"></app-navbar>
        <main 
          [attr.class]="adminMainClasses()"
          class="admin-main-content"
          style="padding-bottom: env(safe-area-inset-bottom, 0px);">
          @if (globalErrorService.hasError()) {
            <!-- Error global dentro del main - sidebar sigue visible -->
            <app-global-error-display></app-global-error-display>
          } @else {
            <div class="px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6">
              <app-route-transition-outlet></app-route-transition-outlet>
            </div>
          }
        </main>
      </div>
    } @else if (shouldShowWorkerNav()) {
      <!-- Layout con Navbar Móvil (Trabajador) -->
      <div class="flex flex-col min-h-screen bg-base-200">
        <main class="flex-1 bg-base-200 p-4" style="padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px)); padding-top: calc(env(safe-area-inset-top, 0px) + 0.5rem);">
          @if (globalErrorService.hasError()) {
            <!-- Error global dentro del main - navbar sigue visible -->
            <app-global-error-display></app-global-error-display>
          } @else {
            <router-outlet></router-outlet>
          }
        </main>
        @if (!hideWorkerNav()) {
          <app-navbar-trabajador></app-navbar-trabajador>
        }
      </div>
    } @else {
      <!-- Sin navbar/sidebar (Login) -->
      @if (globalErrorService.hasError()) {
        <!-- Error global sin sidebar/navbar -->
        <app-global-error-display></app-global-error-display>
      } @else {
        <router-outlet></router-outlet>
      }
    }

    <!-- Modal de confirmación global -->
    <app-confirm-modal></app-confirm-modal>
    
    <!-- Modal de registro de mantenimiento global -->
    <app-maintenance-form-modal></app-maintenance-form-modal>

    <!-- Modal de nuevo registro diario (global) -->
    <app-new-record-modal></app-new-record-modal>

    <!-- Modal de alerta global -->
    <app-alert-modal></app-alert-modal>

    <!-- Modal de confirmación de pago global -->
    <app-payment-confirm-modal></app-payment-confirm-modal>

    <!-- Modal de imagen global -->
    <app-image-modal></app-image-modal>

    <!-- Modal de movimiento de cuenta corriente (global) -->
    <app-ledger-movement-modal></app-ledger-movement-modal>

    <!-- Modal de historial de cuenta corriente (global) -->
    @if (driverLedgerHistoryModalService.isVisible()) {
      <app-driver-ledger-history></app-driver-ledger-history>
    }
    
    <!-- Modal de Actualización de App -->
    <app-update-modal></app-update-modal>
  `,
  styles: [
    `
    @media (max-width: 1023px) {
      .mobile-pt-adjust {
        padding-bottom: env(safe-area-inset-bottom, 0px) !important;
      }
      /* Asegurar que no haya margen o padding adicional en el contenido */
      .mobile-pt-adjust > div {
        margin-top: 0 !important;
        /* padding-top eliminado para permitir espaciado */
      }
      /* Eliminar cualquier espacio adicional del route-transition-outlet */
      .mobile-pt-adjust app-route-transition-outlet,
      .mobile-pt-adjust app-route-transition-outlet > div {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
    }
    
    .main-content-transition {
      transition: margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Animación de entrada del main content - Coordinada con sidebar */
    /* Entra desde la izquierda (no desde la derecha) para mantener continuidad espacial */
    /* IMPORTANTE: Desactivar transición de margin-left durante entrada para evitar desplazamiento */
    /* COREOGRAFÍA: Sidebar (600ms, 0ms delay) → Main (500ms, 100ms delay) → Ambos terminan a 600ms */
    .main-content-enter {
      transition: none !important; /* Desactivar transición de margin-left durante entrada */
      opacity: 0 !important; /* Forzar opacidad 0 para evitar flash */
      transform: translateX(20px) !important;
      visibility: hidden !important; /* Ocultar completamente durante entrada */
      will-change: transform, opacity;
      animation: mainContentEnter 500ms cubic-bezier(0.22, 0.61, 0.36, 1) 100ms forwards;
    }
    
    @keyframes mainContentEnter {
      to {
        opacity: 1;
        transform: translateX(0);
        visibility: visible;
      }
    }
    
    /* En móvil, no animar el main content */
    @media (max-width: 1023px) {
      .main-content-enter {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
    
    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .main-content-enter {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
    
    /* ============================================
       SESSION VERIFICATION OVERLAY
       Fondo blanco simple durante verificación
       ============================================ */
    .session-verification-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99998;
      background: rgba(255, 255, 255, 1);
      animation: sessionVerificationEnter 400ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
      will-change: opacity;
    }
    
    @keyframes sessionVerificationEnter {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .session-verification-overlay {
        animation: none !important;
      }
    }
    
    /* ============================================
       RELOAD SPINNER OVERLAY
       Spinner de 3 puntos para recarga, cambio de pestaña o volver al navegador
       NO se muestra en login/redirect
       ============================================ */
    .reload-spinner-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      background: rgba(255, 255, 255, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: reloadSpinnerEnter 300ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
      will-change: opacity;
    }
    
    @keyframes reloadSpinnerEnter {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .reload-spinner-overlay {
        animation: none !important;
      }
    }
    
    /* ============================================
       LOGOUT EXIT ANIMATION
       Animación de salida suave al cerrar sesión
       ============================================ */
    .logout-exit-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      background: rgba(255, 255, 255, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: logoutExitEnter 400ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
      will-change: opacity;
    }
    
    @keyframes logoutExitEnter {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* Animación de salida del contenido del dashboard */
    .dashboard-exiting {
      animation: dashboardExit 500ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      will-change: opacity, transform;
    }
    
    @keyframes dashboardExit {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }
    
    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .logout-exit-overlay {
        animation: none !important;
      }
      
      .dashboard-exiting {
        animation: none !important;
      }
    }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router) as Router;
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  transitionService = inject(TransitionService);
  private routeTransitionService = inject(RouteTransitionService);
  private orchestrator = inject(TransitionOrchestratorService);
  private spinnerService = inject(SpinnerService);
  globalErrorService = inject(GlobalErrorService);
  driverLedgerHistoryModalService = inject(DriverLedgerHistoryModalService);

  sidebarCollapsed = signal(false);
  isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');
  isWorker = computed(() => this.auth.currentUser()?.role === 'worker');

  // Signal para rastrear si estamos en proceso de logout
  isLoggingOut = signal(false);

  private zoomFixTimeout: any = null;
  private resizeHandler = this.handleResize.bind(this);

  constructor() {
    // CRÍTICO: Detectar recarga DESPUÉS del primer render usando afterNextRender
    // Esto asegura que el componente ya está renderizado y podemos forzar detección de cambios
    afterNextRender(() => {
      // Esto se ejecuta DESPUÉS del primer render
      if (typeof window !== 'undefined' && window.performance) {
        try {
          const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navEntries.length > 0) {
            const navEntry = navEntries[0];
            const isPageReload = navEntry.type === 'reload';

            if (isPageReload) {
              const currentUrl = this.router.url;
              let user = this.auth.currentUser();

              // CRÍTICO: Si el usuario no está disponible aún, esperar a que esté disponible
              // En una recarga, el usuario puede no estar disponible inmediatamente
              if (!user) {
                // Esperar a que el usuario esté disponible (máximo 2 segundos)
                const startTime = Date.now();
                const checkUser = setInterval(() => {
                  user = this.auth.currentUser();
                  if (user || Date.now() - startTime > 2000) {
                    clearInterval(checkUser);
                    if (user?.role === 'admin' && this.routeTransitionService.isAdminRoute(currentUrl)) {
                      this.showSpinnerForReload(currentUrl);
                    }
                  }
                }, 50);
              } else {
                const isAdminRoute = user.role === 'admin' &&
                  this.routeTransitionService.isAdminRoute(currentUrl);

                if (isAdminRoute) {
                  this.showSpinnerForReload(currentUrl);
                }
              }
            }
          }
        } catch (e) {
          // Si falla, no hacer nada
        }
      }
    });
  }

  // Signal reactivo para la URL actual del router
  currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Computed para mostrar loading durante inicialización de sesión
  showInitialLoading = computed(() => {
    return this.auth.isInitializing() && !this.auth.currentUser();
  });

  // Usar el servicio de spinner en lugar de signal local
  showReloadSpinner = this.spinnerService.isVisible;

  // Signal para detectar cuando se está cerrando sesión (logout)
  showLogoutSpinner = computed(() => {
    const spinnerVisible = this.spinnerService.isVisible();
    const url = this.currentUrl();
    const user = this.auth.currentUser();
    const loggingOut = this.isLoggingOut();

    // Mostrar spinner de logout si:
    // 1. El spinner está visible
    // 2. Estamos en proceso de logout
    // 3. No estamos en login
    // 4. No hay usuario (se cerró sesión) o estamos marcados como logout
    if (!spinnerVisible) return false;
    if (!loggingOut && user) return false; // Si hay usuario y no estamos en logout, no mostrar
    if (url?.startsWith('/login')) return false;

    // Verificar si estábamos en una ruta protegida
    const wasAdminRoute = url ? this.routeTransitionService.isAdminRoute(url) : false;
    const wasWorkerRoute = url ? url.startsWith('/trabajador') : false;

    return (wasAdminRoute || wasWorkerRoute) && (loggingOut || !user);
  });

  // Effect para detectar cuando comienza el logout
  private monitorLogout = effect(() => {
    const spinnerVisible = this.spinnerService.isVisible();
    const url = this.currentUrl();
    const user = this.auth.currentUser();

    // Si el spinner está visible, no hay usuario, y estamos en una ruta protegida, es logout
    if (spinnerVisible && !user && url && !url.startsWith('/login')) {
      const isAdminRoute = this.routeTransitionService.isAdminRoute(url);
      const isWorkerRoute = url.startsWith('/trabajador');

      if (isAdminRoute || isWorkerRoute) {
        this.isLoggingOut.set(true);

        // Resetear después de que termine la animación
        setTimeout(() => {
          this.isLoggingOut.set(false);
        }, 1000);
      }
    }
  });

  // REDISEÑO: Usar orchestrator para determinar cuándo mostrar el navbar
  // CRÍTICO: El navbar DEBE renderizarse incluso cuando el orchestrator está en 'login-exiting'
  // para que los inputs shouldAnimate y shouldStartHidden se pasen correctamente
  // La visibilidad se controla con shouldStartHidden, no con shouldShowAdminNav
  shouldShowAdminNav = computed(() => {
    const url = this.currentUrl();
    const orchestratorState = this.orchestrator.state();

    // No mostrar si estamos en login o rutas públicas
    if (!url || url.startsWith('/login') || url.startsWith('/recuperar-clave') || url.startsWith('/restablecer-clave')) {
      return false;
    }

    // CRÍTICO: Permitir renderizar el navbar incluso cuando el orchestrator está en 'login-exiting'
    // Esto asegura que los inputs se pasen correctamente y el navbar pueda aplicar las clases CSS
    // La visibilidad se controla con shouldStartHidden, que retorna true cuando orchestratorState === 'login-exiting'

    // Si es admin y está en una ruta admin, mostrar el navbar
    // El orchestrator puede estar en 'idle', 'login-exiting', 'dashboard-entering' o 'dashboard-ready'
    // En todos estos casos, el navbar debe renderizarse para que las clases CSS funcionen correctamente
    return this.isAdmin() && this.routeTransitionService.isAdminRoute(url);
  });

  shouldShowWorkerNav = computed(() => {
    const url = this.currentUrl();
    return this.isWorker() && url && !url.startsWith('/login') && !url.startsWith('/recuperar-clave') && !url.startsWith('/restablecer-clave');
  });

  // REDISEÑO: Usar orchestrator para controlar animación del sidebar
  // El sidebar siempre empieza oculto si el orchestrator está en 'dashboard-entering'
  shouldAnimateSidebar = computed(() => {
    const orchestratorState = this.orchestrator.state();
    // Solo animar cuando el dashboard está entrando
    return orchestratorState === 'dashboard-entering';
  });

  // REDISEÑO: shouldStartHidden ahora se basa directamente en el estado del orchestrator
  // Esto garantiza que el navbar esté oculto antes de renderizarse
  shouldStartHidden = computed(() => {
    const orchestratorState = this.orchestrator.state();
    const url = this.currentUrl();
    const shouldAnimate = this.shouldAnimateSidebar();

    // CRÍTICO: Si el orchestrator está en 'dashboard-entering' Y shouldAnimate es true,
    // NO ocultar (permitir que sidebar-enter se ejecute sin conflicto con sidebar-start-hidden)
    // Esto evita que sidebar-start-hidden bloquee la animación sidebar-enter
    if (orchestratorState === 'dashboard-entering' && shouldAnimate) {
      return false;
    }

    // IMPORTANTE: También ocultar cuando el login está saliendo
    // Esto evita que el navbar aparezca antes de que termine la transición del login
    if (orchestratorState === 'login-exiting') {
      return true;
    }

    // CRÍTICO: Detectar si venimos de login usando el estado del orchestrator
    // Si el orchestrator está en 'dashboard-entering' pero shouldAnimate es false,
    // significa que aún no se ha activado la animación, así que ocultar
    // Usar el estado del orchestrator es más confiable que previousUrl porque:
    // 1. previousUrl puede no estar actualizado cuando el dashboard se renderiza
    // 2. El orchestrator solo se activa cuando venimos de login
    // 3. El estado del orchestrator es reactivo y se actualiza inmediatamente
    if (orchestratorState === 'dashboard-entering' && !shouldAnimate) {
      return true;
    }

    // Si es una recarga de página y estamos en una ruta admin, empezar oculto
    // para evitar que el navbar aparezca antes de la animación
    if (orchestratorState === 'idle' && url && this.routeTransitionService.isAdminRoute(url)) {
      // Verificar si es recarga usando Performance API
      if (typeof window !== 'undefined' && window.performance) {
        try {
          const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navEntries.length > 0 && navEntries[0].type === 'reload') {
            return true; // Es recarga, empezar oculto
          }
        } catch (e) {
          // Si falla, no empezar oculto
        }
      }
    }

    return false;
  });

  // REDISEÑO: Simplificar clases del main usando orchestrator
  adminMainClasses = computed(() => {
    const base = 'bg-base-200 h-dvh overflow-y-auto lg:pt-0 mobile-pt-adjust';
    const orchestratorState = this.orchestrator.state();
    const url = this.currentUrl();
    const shouldAnimate = orchestratorState === 'dashboard-entering';

    // IMPORTANTE: Si el orchestrator está en 'login-exiting', también ocultar el main
    // Esto evita que el main aparezca antes de que termine la transición del login
    const isLoginExiting = orchestratorState === 'login-exiting';

    // CRÍTICO: Detectar si venimos de login usando el estado del orchestrator
    // Si el orchestrator está en 'login-exiting' o acaba de pasar a 'dashboard-entering',
    // significa que venimos de login (redirect o no)
    // Usar el estado del orchestrator es más confiable que previousUrl
    const isComingFromLogin = isLoginExiting || (orchestratorState === 'dashboard-entering' && !shouldAnimate);

    // Si es recarga de página y estamos en una ruta admin, también animar
    let shouldAnimateForReload = false;
    if (orchestratorState === 'idle' && url && this.routeTransitionService.isAdminRoute(url)) {
      if (typeof window !== 'undefined' && window.performance) {
        try {
          const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navEntries.length > 0 && navEntries[0].type === 'reload') {
            shouldAnimateForReload = true;
          }
        } catch (e) {
          // Si falla, no animar
        }
      }
    }

    // Si el login está saliendo O venimos de login (pero no cuando dashboard-entering con animación), ocultar el main
    const animateClass = (shouldAnimate || shouldAnimateForReload || isComingFromLogin) ? 'main-content-enter' : 'main-content-transition';
    const marginClass = this.sidebarCollapsed() ? 'lg:ml-16' : 'lg:ml-72';
    return `${base} ${marginClass} ${animateClass}`.trim();
  });


  hideWorkerNav = computed(() => {
    if (!this.isWorker()) {
      return false;
    }
    const url = this.currentUrl();
    return url ? url.startsWith('/trabajador/reportar') : false;
  });

  // REDISEÑO: Effect simplificado que solo maneja recargas de página y tab-restore
  // La transición desde login ahora es manejada completamente por el orchestrator en login.ts
  private monitorNavigation = effect(() => {
    const url = this.currentUrl();
    const user = this.auth.currentUser();
    const orchestratorState = this.orchestrator.state();
    const previousUrl = this.routeTransitionService.getPreviousUrl();

    if (!url) return;

    // Solo aplicar para rutas del dashboard admin
    const isAdminRoute = this.routeTransitionService.isAdminRoute(url);
    if (!isAdminRoute) {
      // Si salimos de una ruta admin, resetear el orchestrator
      if (orchestratorState !== 'idle') {
        this.orchestrator.reset();
      }
      return;
    }

    // IMPORTANTE: Si venimos de login y el orchestrator está en 'idle', activarlo
    // Esto cubre el caso donde el orchestrator no se activó correctamente desde login
    // (puede pasar si hay un redirect o si el timing no coincide)
    // CRÍTICO: Usar previousUrl del RouteTransitionService, pero también verificar router.url
    // para asegurar que detectamos correctamente cuando venimos de login
    const routerUrl = this.router.url;
    const isComingFromLogin = previousUrl?.startsWith('/login') ||
      (routerUrl && !routerUrl.startsWith('/login') && orchestratorState === 'idle' && !previousUrl);

    if (isComingFromLogin && orchestratorState === 'idle') {
      // Activar el orchestrator manualmente para que las animaciones funcionen
      queueMicrotask(() => {
        this.orchestrator.activateDashboardEntry();
      });
      return;
    }

    // CRÍTICO: Si el orchestrator está en 'login-exiting', esperar a que pase a 'dashboard-entering'
    // Cuando pase a 'dashboard-entering', el effect se re-ejecutará automáticamente porque orchestratorState cambió
    // En ese momento, shouldAnimateSidebar y shouldStartHidden se actualizarán automáticamente
    if (orchestratorState === 'login-exiting') {
      // No hacer nada, solo esperar a que el orchestrator pase a 'dashboard-entering'
      // El orchestrator se encargará de pasar a 'dashboard-entering' automáticamente después de 1200ms
      return;
    }

    // CRÍTICO: Si el orchestrator está en 'dashboard-entering', asegurar que las animaciones estén activas
    // Esto se ejecuta cuando el orchestrator pasa de 'login-exiting' a 'dashboard-entering'
    if (orchestratorState === 'dashboard-entering') {
      // Las animaciones ya deberían estar activas porque:
      // - shouldAnimateSidebar() retorna true cuando orchestratorState === 'dashboard-entering'
      // - shouldStartHidden() retorna false cuando orchestratorState === 'dashboard-entering' && shouldAnimate === true
      // - adminMainClasses() aplica 'main-content-enter' cuando orchestratorState === 'dashboard-entering'
      // No necesitamos hacer nada aquí, solo verificar que todo esté correcto
      return;
    }

    // Detectar recarga de página usando Performance API
    let isPageReload = false;
    let isFirstLoad = false;

    if (typeof window !== 'undefined' && window.performance) {
      try {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const navEntry = navEntries[0];
          // TYPE_RELOAD = recarga (F5)
          isPageReload = navEntry.type === 'reload';
          // TYPE_NAVIGATE = nueva pestaña o navegación normal
          isFirstLoad = navEntry.type === 'navigate' && !previousUrl && !!user && user.role === 'admin';
        }
      } catch (e) {
        // Fallback: si no hay previousUrl y estamos en una ruta admin, probablemente es recarga
        isPageReload = !previousUrl;
        isFirstLoad = !previousUrl && !!user && user.role === 'admin';
      }
    }

    // IMPORTANTE: Activar INMEDIATAMENTE si es recarga o primera carga
    // Esto debe hacerse antes de que Angular renderice el navbar
    // CRÍTICO: NO mostrar spinner si venimos de login (redirect)
    const isComingFromLoginInEffect = previousUrl?.startsWith('/login');

    if ((isPageReload || isFirstLoad) && orchestratorState === 'idle' && !isComingFromLoginInEffect) {
      // Mostrar spinner de recarga
      this.spinnerService.show();

      // Activar animación de entrada para recarga/tab-restore
      // Usar queueMicrotask para asegurar que se ejecute antes del siguiente ciclo de detección de cambios
      queueMicrotask(() => {
        this.triggerEntryAnimationForReload();
      });
    }

    // CRÍTICO: Mostrar spinner cuando viene de login (redirect)
    // Esto se ejecuta cuando el orchestrator está en 'login-exiting' o cuando detectamos que venimos de login
    if (isComingFromLoginInEffect && orchestratorState === 'idle' && isAdminRoute) {
      // Mostrar spinner inmediatamente
      this.spinnerService.show();
      this.cdr.markForCheck();

      // Activar orchestrator para que las animaciones funcionen
      queueMicrotask(() => {
        this.orchestrator.activateDashboardEntry();
      });
    }
  });

  // Effect para monitorear cambios en el estado de transición (sin logs en producción)
  private monitorTransition = effect(() => {
    const isTransitioning = this.transitionService.isTransitioning();
  });

  // Effect para resetear el estado del sidebar cuando cambia la autenticación
  private resetSidebarOnAuthChange = effect(() => {
    const user = this.auth.currentUser();
    const wasAdmin = this.isAdmin();
    const url = this.currentUrl();

    // Si el usuario no es admin (cerró sesión o cambió de rol), resetear el sidebar
    if (!wasAdmin) {
      this.sidebarCollapsed.set(false);
    }

    // Si no hay usuario y estamos en una ruta protegida, redirigir al login
    // Excluir rutas públicas: login, recuperar-clave, restablecer-clave
    if (!url) return;

    const isPublicRoute = url.startsWith('/login') ||
      url.startsWith('/recuperar-clave') ||
      url.startsWith('/restablecer-clave');

    if (!user && !isPublicRoute && url !== '/') {
      // Usar queueMicrotask para evitar problemas de detección de cambios
      queueMicrotask(() => {
        // Verificar nuevamente la URL antes de redirigir (por si cambió durante el microtask)
        const currentUrl = this.currentUrl();
        if (!currentUrl) return;

        const stillPublicRoute = currentUrl.startsWith('/login') ||
          currentUrl.startsWith('/recuperar-clave') ||
          currentUrl.startsWith('/restablecer-clave');

        if (!stillPublicRoute && currentUrl !== '/') {
          this.router.navigateByUrl('/login', { skipLocationChange: false });
        }
      });
    }
  });

  onSidebarCollapseChange(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }

  /**
   * REDISEÑO: Función para activar animación de entrada solo para recargas de página
   * Las transiciones desde login son manejadas por el orchestrator
   */
  private triggerEntryAnimationForReload(): void {
    // Activar estado de entrada en el orchestrator
    // Esto hará que shouldStartHidden y shouldAnimateSidebar se activen automáticamente
    this.orchestrator.activateDashboardEntry();
    this.transitionService.startTransition('admin');

    // El orchestrator manejará automáticamente el cambio a 'dashboard-ready'
    // después de dashboardTotalEntry, pero también necesitamos terminar la transición del servicio
    const timeline = this.orchestrator.TIMELINE;
    setTimeout(() => {
      this.transitionService.endTransition();
      // Ocultar spinner cuando termine la animación
      this.spinnerService.hide();
      this.cdr.markForCheck();
    }, timeline.dashboardTotalEntry);
  }

  /**
   * CRÍTICO: Método centralizado para mostrar spinner de recarga
   * Verifica si venimos de login y muestra el spinner solo si NO venimos de login
   */
  private showSpinnerForReload(currentUrl: string): void {
    // Verificar si venimos de login usando sessionStorage
    let isComingFromLogin = false;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const lastRoute = window.sessionStorage.getItem('lastRoute');
        isComingFromLogin = lastRoute?.startsWith('/login') || false;
      } catch (e) {
        isComingFromLogin = false;
      }
    }

    // Si NO venimos de login, mostrar spinner
    if (!isComingFromLogin) {
      // CRÍTICO: Mostrar spinner INMEDIATAMENTE
      // Usar requestAnimationFrame para asegurar que se ejecute en el siguiente frame
      requestAnimationFrame(() => {
        this.spinnerService.show();
        // Forzar detección de cambios para asegurar que el spinner se renderice
        this.cdr.markForCheck();

        // Activar orchestrator y transición
        this.orchestrator.activateDashboardEntry();
        this.transitionService.startTransition('admin');

        // Ocultar spinner cuando termine la animación
        const timeline = this.orchestrator.TIMELINE;
        setTimeout(() => {
          this.transitionService.endTransition();
          this.spinnerService.hide();
          this.cdr.markForCheck();
        }, timeline.dashboardTotalEntry);
      });
    }
  }

  ngOnInit(): void {
    // NOTA: La detección de recarga ahora se hace en el constructor usando afterNextRender
    // para asegurar que se ejecute después del primer render y podamos forzar detección de cambios

    // Detectar y corregir problemas de zoom al cambiar entre vista móvil/desktop
    if (typeof window !== 'undefined') {
      // Resetear zoom al cargar si detectamos un zoom anormal
      this.fixZoomOnLoad();

      // Escuchar cambios de tamaño de ventana (útil cuando cambias de móvil a desktop)
      window.addEventListener('resize', this.resizeHandler);

      // También escuchar cambios de orientación en dispositivos móviles
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.checkAndFixZoom(), 300);
      });

      // REDISEÑO: Detectar reapertura de pestaña o volver al navegador
      // NOTA: Cuando se vuelve al navegador, NO se muestra el spinner ni se reproduce la animación
      // para evitar molestias al usuario
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Cuando la pestaña se oculta, ocultar el spinner si está visible
          this.spinnerService.hide();
        }
        // Cuando se vuelve al navegador (visibilityState === 'visible'), 
        // NO se muestra el spinner ni se activa la animación para evitar molestias
      });
    }
  }

  ngOnDestroy(): void {
    // Limpiar el timeout si existe
    if (this.zoomFixTimeout) {
      clearTimeout(this.zoomFixTimeout);
    }

    // Remover listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private handleResize(): void {
    // Debounce para evitar llamadas excesivas
    if (this.zoomFixTimeout) {
      clearTimeout(this.zoomFixTimeout);
    }
    this.zoomFixTimeout = setTimeout(() => {
      this.checkAndFixZoom();
    }, 300);
  }

  private fixZoomOnLoad(): void {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.checkAndFixZoom(), 100);
      });
    } else {
      setTimeout(() => this.checkAndFixZoom(), 100);
    }
  }

  private checkAndFixZoom(): void {
    // Verificar si el zoom visual es diferente al esperado
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;

    // Obtener el ancho real de la ventana
    const windowWidth = window.innerWidth;

    // Si estamos en desktop (ancho > 1024px) y el zoom parece estar aplicado incorrectamente
    if (windowWidth > 1024) {
      // Calcular el zoom actual aproximado comparando innerWidth con outerWidth
      // Nota: outerWidth puede no ser confiable en todos los navegadores, así que usamos otra estrategia

      // Obtener el ancho del body para comparar
      const bodyWidth = document.body.offsetWidth;

      // Si hay una discrepancia significativa, puede ser un problema de zoom
      // En desktop normal, window.innerWidth debería ser cercano al ancho del viewport
      const expectedWidth = Math.min(window.screen.width, 1920); // Asumir máximo 1920px para desktop

      // Si el ancho es significativamente menor que el esperado, puede ser un problema de zoom
      if (windowWidth < expectedWidth * 0.8 && windowWidth > 400) {
        // Forzar actualización del viewport para resetear el zoom
        const currentContent = viewport.getAttribute('content') || '';
        const newContent = 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes';

        // Solo actualizar si es diferente
        if (currentContent !== newContent) {
          viewport.setAttribute('content', newContent);

          // Pequeño delay y luego verificar si se corrigió
          setTimeout(() => {
            // Si aún hay problema, intentar forzar un reflow
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
          }, 50);
        }
      }
    }
  }
}
