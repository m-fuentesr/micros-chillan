import { Component, ViewEncapsulation, signal, inject, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { NavbarTrabajador } from './shared/navbar-trabajador/navbar-trabajador';
import { CommonModule } from '@angular/common';
import { AuthService } from './shared/services/auth.service';
import { TransitionService } from './shared/services/transition.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, NavbarTrabajador, CommonModule],
  template: `
    <!-- Overlay de expansión blanca para transición Login -> Dashboard -->
    @if (transitionService.isTransitioning()) {
      <div 
        class="transition-overlay-white" 
        [attr.data-transition-active]="transitionService.isTransitioning()">
      </div>
    }
    
    @if (shouldShowAdminNav()) {
      <!-- Layout con Sidebar (Administrador) -->
      <div class="h-dvh">
        <app-navbar 
          [initialCollapsed]="sidebarCollapsed()"
          (collapsedChange)="onSidebarCollapseChange($event)"></app-navbar>
        <main 
          [attr.class]="adminMainClasses()">
          <div class="p-4 sm:p-6">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    } @else if (shouldShowWorkerNav()) {
      <!-- Layout con Navbar Móvil (Trabajador) -->
      <div class="flex flex-col min-h-screen bg-base-200">
        <main class="flex-1 bg-base-200 p-4 pb-24">
          <router-outlet></router-outlet>
        </main>
        @if (!hideWorkerNav()) {
          <app-navbar-trabajador></app-navbar-trabajador>
        }
      </div>
    } @else {
      <!-- Sin navbar/sidebar (Login) -->
      <router-outlet></router-outlet>
    }
  `,
  styles: [
    `.main-content-transition {
      transition: margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* ============================================
       OVERLAY DE TRANSICIÓN BLANCA - NIVEL APP
       Persiste durante la transición Login -> Dashboard
       ============================================ */
    .transition-overlay-white {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      /* Ligero gradiente para que se perciba la transición desde el lado derecho (formulario) */
      background: radial-gradient(circle at 75% 50%,
        rgba(148, 163, 184, 0.14) 0%,
        rgba(248, 250, 252, 1) 55%,
        rgba(255, 255, 255, 1) 100%);
      pointer-events: none;
      overflow: hidden;
      /* Entrada + salida suaves, sin la animación duplicada anterior */
      animation: transitionOverlayEnter 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards,
                 transitionOverlayExit 650ms cubic-bezier(0.22, 0.61, 0.36, 1) 1300ms forwards;
    }
    
    .transition-overlay-white::before {
      content: '';
      position: absolute;
      top: 50%;
      right: 22%;
      width: 0;
      height: 0;
      border-radius: 9999px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      transform: translate(50%, -50%) scale(0);
      /* Expansión ligeramente más lenta y muy visible gracias al borde */
      animation: expandWhiteOverlay 900ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      will-change: transform, opacity;
    }
    
    @keyframes transitionOverlayEnter {
      0% {
        opacity: 0;
      }
      30% {
        opacity: 1;
      }
      100% {
        opacity: 1;
      }
    }
    
    @keyframes expandWhiteOverlay {
      0% {
        width: 0;
        height: 0;
        opacity: 0;
        transform: translate(50%, -50%) scale(0.5);
      }
      35% {
        opacity: 1;
      }
      100% {
        width: 260vw;
        height: 260vh;
        opacity: 0;
        transform: translate(50%, -50%) scale(1);
      }
    }
    
    @keyframes transitionOverlayExit {
      to {
        opacity: 0;
        pointer-events: none;
      }
    }
    
    @media (max-width: 1023px) {
      .transition-overlay-white::before {
        right: 50%;
      }
    }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private auth = inject(AuthService);
  private router = inject(Router);
  transitionService = inject(TransitionService);

  sidebarCollapsed = signal(false);
  isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');
  isWorker = computed(() => this.auth.currentUser()?.role === 'worker');
  
  // Verificar que no estemos en login antes de mostrar el navbar
  shouldShowAdminNav = computed(() => {
    const url = this.navigationEnd()?.urlAfterRedirects ?? this.router.url;
    return this.isAdmin() && !url.startsWith('/login') && !url.startsWith('/recuperar-clave') && !url.startsWith('/restablecer-clave');
  });
  
  shouldShowWorkerNav = computed(() => {
    const url = this.navigationEnd()?.urlAfterRedirects ?? this.router.url;
    return this.isWorker() && !url.startsWith('/login') && !url.startsWith('/recuperar-clave') && !url.startsWith('/restablecer-clave');
  });
  
  adminMainClasses = computed(() => {
    const base = 'bg-base-200 h-dvh overflow-y-auto main-content-transition pt-16 lg:pt-0 ml-0';
    return `${base} ${this.sidebarCollapsed() ? 'lg:ml-16' : 'lg:ml-72'}`;
  });

  private navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  hideWorkerNav = computed(() => {
    if (!this.isWorker()) {
      return false;
    }
    const url = this.navigationEnd()?.urlAfterRedirects ?? this.router.url;
    return url.startsWith('/trabajador/reportar');
  });

  // Effect para monitorear cambios de navegación y transición (sin logs en producción)
  private monitorNavigation = effect(() => {
    const navEnd = this.navigationEnd();
    const url = navEnd?.urlAfterRedirects ?? this.router.url;
    const isTransitioning = this.transitionService.isTransitioning();
  });

  // Effect para monitorear cambios en el estado de transición (sin logs en producción)
  private monitorTransition = effect(() => {
    const isTransitioning = this.transitionService.isTransitioning();
  });

  // Effect para resetear el estado del sidebar cuando cambia la autenticación
  private resetSidebarOnAuthChange = effect(() => {
    const user = this.auth.currentUser();
    const wasAdmin = this.isAdmin();
    const navEnd = this.navigationEnd();
    const url = navEnd?.urlAfterRedirects ?? this.router.url;
    
    // Si el usuario no es admin (cerró sesión o cambió de rol), resetear el sidebar
    if (!wasAdmin) {
      this.sidebarCollapsed.set(false);
    }
    
    // Solo verificar redirección si hay una navegación completa (no en carga inicial)
    // Esto evita redirecciones incorrectas cuando navigationEnd() es null
    if (navEnd) {
      // Si no hay usuario y estamos en una ruta protegida, redirigir al login
      // Excluir rutas públicas: login, recuperar-clave, restablecer-clave
      const isPublicRoute = url.startsWith('/login') || 
                           url.startsWith('/recuperar-clave') || 
                           url.startsWith('/restablecer-clave');
      
      if (!user && !isPublicRoute && url !== '/') {
        // Usar queueMicrotask para evitar problemas de detección de cambios
        queueMicrotask(() => {
          // Verificar nuevamente la URL antes de redirigir (por si cambió durante el microtask)
          const currentUrl = this.router.url;
          const stillPublicRoute = currentUrl.startsWith('/login') || 
                                  currentUrl.startsWith('/recuperar-clave') || 
                                  currentUrl.startsWith('/restablecer-clave');
          
          if (!stillPublicRoute && currentUrl !== '/') {
            this.router.navigateByUrl('/login', { skipLocationChange: false });
          }
        });
      }
    }
  });

  onSidebarCollapseChange(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
