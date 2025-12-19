import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { TodayRecordStatusService } from '../services/today-record-status.service';
import { filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-navbar-trabajador',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav 
      class="fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-200 shadow-lg shadow-base-300/40" 
      [class.trabajador-navbar-enter]="hasAnimated() === false"
      [class.trabajador-navbar-static]="hasAnimated() === true"
      style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0.25rem);">
      <div class="flex justify-around items-end px-3" style="height: calc(4rem + env(safe-area-inset-bottom, 0px)); min-height: 4rem; padding-bottom: 0.5rem;">
        <a
          routerLink="/trabajador"
          routerLinkActive="text-primary font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center w-full h-full text-base-content/60 transition-colors active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 mb-1">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="M12 5.432 2.15 15.28a.75.75 0 0 1-.53.22h1.5a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25v-6a.75.75 0 0 1 1.5 0v6a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25v-6a2.25 2.25 0 0 1 2.25-2.25h1.5a.75.75 0 0 1-.53-.22L12 5.432Z" />
          </svg>
          <span class="text-[10px]">Inicio</span>
        </a>

        @if (canCreateReport()) {
          <a
            routerLink="/trabajador/reportar"
            routerLinkActive="text-primary"
            class="flex flex-col items-center justify-center w-full h-full mt-2"
          >
            <div class="bg-primary text-primary-content rounded-full shadow-xl border-4 border-base-100 flex items-center justify-center transition-transform active:scale-95" style="width: 3.5rem; height: 3.5rem; min-width: 3.5rem; min-height: 3.5rem; aspect-ratio: 1; border-radius: 50%;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
                <path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-[10px] font-bold mt-1 text-primary">Nuevo</span>
          </a>
        } @else {
          <div
            class="flex flex-col items-center justify-center w-full h-full mt-2 cursor-not-allowed opacity-60"
            title="Ya has registrado tu reporte diario para hoy"
          >
            <div class="bg-base-300 text-base-content/40 rounded-full shadow-lg border-4 border-base-100 flex items-center justify-center" style="width: 3.5rem; height: 3.5rem; min-width: 3.5rem; min-height: 3.5rem; aspect-ratio: 1; border-radius: 50%;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
                <path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-[10px] font-bold mt-1 text-base-content/40">Nuevo</span>
          </div>
        }

        <a
          routerLink="/trabajador/perfil"
          routerLinkActive="text-primary font-bold"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex flex-col items-center justify-center w-full h-full text-base-content/60 transition-colors active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 mb-1">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
          <span class="text-[10px]">Perfil</span>
        </a>
      </div>
    </nav>
  `,
  styles: [
    `
    /* ============================================
       ANIMACIÓN DE ENTRADA DEL NAVBAR - TRABAJADOR
       Slide-up suave desde abajo (solo una vez)
       ============================================ */
    :host {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      width: 100vw;
      max-width: 100vw;
      overflow: hidden;
    }
    
    nav {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      padding-top: 0 !important;
      /* padding-bottom se maneja con inline style para área segura */
      transform: translateZ(0); /* Force GPU acceleration */
      backface-visibility: hidden; /* Prevent flickering */
      -webkit-backface-visibility: hidden;
    }
    
    .trabajador-navbar-enter {
      animation: trabajadorNavbarEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 400ms forwards;
      opacity: 0;
      transform: translateY(100%) translateZ(0);
      will-change: opacity, transform;
    }
    
    /* Estado estático después de la animación */
    .trabajador-navbar-static {
      opacity: 1;
      transform: translateY(0) translateZ(0);
    }
    
    @keyframes trabajadorNavbarEnter {
      0% {
        opacity: 0;
        transform: translateY(100%) translateZ(0);
      }
      100% {
        opacity: 1;
        transform: translateY(0) translateZ(0);
      }
    }
    
    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .trabajador-navbar-enter {
        animation: none;
        opacity: 1;
        transform: translateY(0) translateZ(0);
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarTrabajador implements OnInit, OnDestroy {
  private todayRecordStatusService = inject(TodayRecordStatusService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Signal para trackear si ya se animó
  hasAnimated = signal(false);

  // Usar el computed del servicio compartido
  canCreateReport = this.todayRecordStatusService.canCreateReport;

  ngOnInit(): void {
    // Marcar como animado después de que la animación termine
    // 400ms delay + 600ms animación = 1000ms
    setTimeout(() => {
      this.hasAnimated.set(true);
    }, 1000);

    // Suscribirse a eventos de navegación para refrescar el estado
    // (el servicio ya maneja la verificación periódica)
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Refrescar el estado cuando se navega, especialmente al volver de /trabajador/reportar
        this.todayRecordStatusService.refreshStatus();
      });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }
}
