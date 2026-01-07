import { Component, ChangeDetectionStrategy, signal, output, inject, effect, OnInit, OnDestroy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UiIconComponent } from '../components/ui-icon/ui-icon.component';
import { ConfirmModalService } from '../services/confirm-modal.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  template: `
    <!-- Top Bar Móvil Premium (solo visible en < lg) -->
    <div class="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-base-200/60 z-30 flex items-center justify-center px-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative" style="padding-top: env(safe-area-inset-top, 0px); min-height: calc(4rem + env(safe-area-inset-top, 0px));">
      <button class="btn btn-square btn-ghost hover:bg-base-100 transition-colors absolute left-4" (click)="toggleMobileMenu()" type="button" aria-label="Abrir menú" style="top: calc(env(safe-area-inset-top, 0px) + 0.5rem);">
        <ui-icon name="Menu" size="lg" class="text-base-content/70" />
      </button>

      <div class="flex flex-col items-center justify-center">
        <span class="logo-brand text-lg text-primary leading-tight">GESTOR DE FLOTAS</span>
        <span class="text-[10px] text-base-content/40 font-normal tracking-wide mt-0.5 leading-tight">ADMINISTRACIÓN</span>
      </div>
    </div>

    <!-- Backdrop Móvil (solo visible cuando el menú está abierto) -->
    @if (isMobileMenuOpen()) {
      <div 
        class="fixed z-40 lg:hidden bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        style="top: 0; left: 0; right: 0; bottom: 0; padding-bottom: env(safe-area-inset-bottom, 0px);"
        (click)="closeMobileMenu()">
      </div>
    }

    <!-- Sidebar Premium -->
    <aside 
      class="sidebar-container fixed left-0 bg-white flex flex-col z-50 border-r border-base-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out overflow-hidden lg:translate-x-0 w-72"
      style="top: 0; bottom: env(safe-area-inset-bottom, 0px); height: calc(100dvh - env(safe-area-inset-bottom, 0px));"
      [class.sidebar-enter]="shouldAnimate()"
      [class.sidebar-start-hidden]="shouldStartHidden()"
      [class.lg:w-72]="!isCollapsed()"
      [class.lg:w-16]="isCollapsed()"
      [class.collapsed]="isCollapsed()"
      [class.-translate-x-full]="!isMobileMenuOpen()"
      [class.translate-x-0]="isMobileMenuOpen()">
      
      <!-- Header con Branding -->
      <div class="flex items-center px-6 border-b border-base-100 flex-shrink-0 justify-between"
           style="padding-top: env(safe-area-inset-top, 0px); min-height: calc(5rem + env(safe-area-inset-top, 0px));"
           [class.lg:justify-center]="isCollapsed()"
           [class.lg:justify-between]="!isCollapsed()">
        <div class="flex flex-col justify-center sidebar-brand-text"
             [class.lg:hidden]="isCollapsed()">
          <span class="logo-brand text-lg text-primary leading-tight">GESTOR DE FLOTAS</span>
          <span class="text-[10px] text-base-content/40 font-medium tracking-wide mt-0.5 leading-tight">ADMINISTRACIÓN</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button 
            (click)="toggleCollapse()"
            class="sidebar-toggle btn btn-ghost btn-sm btn-square hidden lg:flex"
            [class.collapsed]="isCollapsed()"
            type="button"
            [attr.aria-label]="isCollapsed() ? 'Expandir sidebar' : 'Colapsar sidebar'">
            <ui-icon name="ChevronRight" size="md" />
          </button>
          <button 
            (click)="closeMobileMenu()"
            class="btn btn-square btn-sm btn-ghost lg:hidden"
            type="button"
            aria-label="Cerrar menú">
            <ui-icon name="X" size="md" />
          </button>
        </div>
      </div>

      <!-- Menú de navegación Premium -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <!-- Dashboard -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Panel Principal' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="LayoutDashboard" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-bold text-sm tracking-wide"
                [class.lg:hidden]="isCollapsed()">Panel Principal</span>
        </a>

        <!-- Bitácora de Operaciones -->
        <a 
          routerLink="/bitacora-operaciones" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Registros Diarios' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="ClipboardList" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-normal text-sm"
                [class.lg:hidden]="isCollapsed()">Registros Diarios</span>
        </a>

        <!-- Separador: Gestión de Flota -->
        <div class="nav-separator" [class.collapsed]="isCollapsed()" [class.lg:collapsed]="isCollapsed()">
          <div class="mt-6 mb-2 px-4 flex items-center justify-between group cursor-default"
               [class.lg:hidden]="isCollapsed()">
            <span class="text-[10px] font-black text-base-content/30 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Gestión de Flota</span>
            <div class="h-px bg-base-200 flex-1 ml-3 group-hover:bg-primary/20 transition-colors"></div>
          </div>
        </div>

        <!-- Máquinas -->
        <a 
          routerLink="/maquinas" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Flota de Vehículos' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="BusFront" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Flota de Vehículos</span>
        </a>

        <!-- Choferes -->
        <a 
          routerLink="/choferes" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Conductores' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="IdCard" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Conductores</span>
        </a>

        <!-- Separador: Finanzas -->
        <div class="nav-separator" [class.collapsed]="isCollapsed()" [class.lg:collapsed]="isCollapsed()">
          <div class="mt-6 mb-2 px-4 flex items-center justify-between group cursor-default"
               [class.lg:hidden]="isCollapsed()">
            <span class="text-[10px] font-black text-base-content/30 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Finanzas</span>
            <div class="h-px bg-base-200 flex-1 ml-3 group-hover:bg-primary/20 transition-colors"></div>
          </div>
        </div>

        <!-- Contabilidad -->
        <a 
          routerLink="/contabilidad" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Finanzas y Nómina' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="HandCoins" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Finanzas y Nómina</span>
        </a>

        <!-- Reportes -->
        <a 
          routerLink="/reportes" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Análisis y Reportes' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="ChartNoAxesCombined" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Análisis y Reportes</span>
        </a>
      </nav>

      <!-- Sección inferior -->
      <div class="sidebar-footer p-4 border-t border-base-200 space-y-2 flex-shrink-0 overflow-x-hidden">
        <!-- Configuración -->
        <a 
          routerLink="/configuracion" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Configuración' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="Settings" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Configuración</span>
        </a>

        <!-- Centro de Ayuda -->
        <a 
          routerLink="/centro-ayuda" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Centro de Ayuda' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <ui-icon name="LifeBuoy" size="md" class="text-base-content/60 group-hover:text-primary active:text-primary transition-colors" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Centro de Ayuda</span>
        </a>

        <!-- Cerrar Sesión -->
        <a 
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 hover:text-error hover:shadow-sm border border-transparent hover:border-error/20 transition-all duration-200"
          [attr.data-tip]="isCollapsed() ? 'Cerrar Sesión' : null"
          (click)="openLogoutConfirm($event)">
          <ui-icon name="LogOut" size="md" />
          <span class="font-medium text-sm"
                [class.lg:hidden]="isCollapsed()">Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  `,
  styles: [
    `    /* ============================================
       SIDEBAR PROFESIONAL - ANIMACIONES OPTIMIZADAS (60 FPS)
       Principios: GPU-accelerated (transform/opacity), Easing unificado, Delays simplificados
       ============================================ */
    
    /* Variables de timing unificadas */
    :host {
      --duration-expand: 400ms;
      --duration-collapse: 300ms;
      --easing-expand: cubic-bezier(0.4, 0, 0.2, 1); /* Material Design ease-in-out */
      --easing-collapse: cubic-bezier(0.4, 0, 0.6, 1); /* Material Design ease-in-out inverso */
      --delay-fast: 0ms;
      --delay-medium: 100ms;
    }
    
    /* ============================================
       BRAND TEXT - Animación de izquierda a derecha sincronizada con expansión
       ============================================ */
    
    /* Estado inicial: oculto y desplazado a la izquierda */
    @media (min-width: 1024px) {
      :host ::ng-deep .sidebar-brand-text {
        opacity: 0;
        transform: translateX(-20px);
        overflow: hidden;
        white-space: nowrap;
        transition: opacity 0ms ease 0ms,
                    transform 0ms ease 0ms;
      }
      
      /* Ocultar el texto cuando está colapsado */
      :host ::ng-deep .sidebar-container.collapsed .sidebar-brand-text,
      :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-brand-text {
        opacity: 0;
        transform: translateX(-20px);
        transition: opacity var(--duration-collapse) var(--easing-collapse) var(--delay-fast),
                    transform var(--duration-collapse) var(--easing-collapse) var(--delay-fast);
      }
      
      /* Mostrar el texto con animación de izquierda a derecha cuando se expande */
      /* Sincronizado con la expansión del navbar (300ms según transition-all duration-300) */
      :host ::ng-deep .sidebar-container:not(.collapsed):not([class*="w-16"]) .sidebar-brand-text {
        opacity: 1;
        transform: translateX(0);
        /* Animación sincronizada: empieza al mismo tiempo que la expansión (0ms delay) */
        /* Duración de 300ms para coincidir con transition-all duration-300 del sidebar */
        transition: opacity 300ms var(--easing-expand) 0ms,
                    transform 300ms var(--easing-expand) 0ms;
      }
    }
    
    /* Asegurar que en móvil siempre esté visible (no hay colapso en móvil) */
    @media (max-width: 1023px) {
      :host ::ng-deep .sidebar-brand-text {
        opacity: 1 !important;
        transform: translateX(0) !important;
        transition: none !important;
      }
    }
    
    /* ============================================
       TRANSICIÓN "LA INMERSIÓN FOCAL" - SIDEBAR
       Entrada desde la izquierda cuando se carga el dashboard
       ============================================ */
    
    /* Sidebar sin animación - Estado por defecto */
    .sidebar-container {
      opacity: 1;
      transform: translateX(0);
    }
    
    /* Sidebar que debe empezar oculto (evita parpadeo en recarga) */
    /* Esta clase se aplica ANTES de sidebar-enter para ocultar inmediatamente */
    /* CORRECCIÓN: Añadir visibility: hidden para asegurar que no sea visible en ningún momento */
    .sidebar-container.sidebar-start-hidden {
      opacity: 0 !important;
      transform: translateX(-30px) !important;
      visibility: hidden !important; /* Asegurar que no sea visible ni siquiera durante el renderizado inicial */
      /* Prevenir cualquier transición mientras está oculto */
      transition: none !important;
    }
    
    /* CRÍTICO: Cuando ambas clases están aplicadas (sidebar-start-hidden + sidebar-enter),
       priorizar sidebar-enter para permitir que la animación se ejecute */
    /* Esto ocurre cuando el orchestrator pasa de 'login-exiting' a 'dashboard-entering' */
    .sidebar-container.sidebar-start-hidden.sidebar-enter {
      /* Remover las restricciones de sidebar-start-hidden cuando sidebar-enter está presente */
      transition: none !important; /* Mantener sin transición para que la animación funcione */
      visibility: visible !important; /* Permitir que la animación sea visible */
      /* La animación sidebarEnter se ejecutará normalmente */
      animation: sidebarEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 0ms forwards;
    }
    
    /* Sidebar con animación de entrada - Solo cuando shouldAnimate es true */
    /* SIEMPRE empieza oculto para evitar parpadeo */
    /* Aparece PRIMERO (ancla persistente) sin delay para establecer contexto espacial */
    .sidebar-container.sidebar-enter {
      opacity: 0 !important;
      transform: translateX(-30px) !important;
      /* Animar hacia visible - Primero en la secuencia, sin delay */
      /* CORREGIDO: Duración ajustada a 600ms para coincidir con el timeline esperado */
      animation: sidebarEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 0ms forwards;
    }
    
    @keyframes sidebarEnter {
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    /* En móvil, mantener comportamiento original - Sin animación */
    @media (max-width: 1023px) {
      .sidebar-container.sidebar-enter,
      .sidebar-container.sidebar-start-hidden {
        animation: none;
        transform: none;
        opacity: 1;
      }
    }
    
    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .sidebar-container.sidebar-enter,
      .sidebar-container.sidebar-start-hidden {
        animation: none;
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    /* Contenedor principal - Animación optimizada */
    :host ::ng-deep .sidebar-container {
      transition: width var(--duration-expand) var(--easing-expand),
                  transform var(--duration-expand) var(--easing-expand);
      will-change: width, transform;
    }
    
    /* En desktop (lg+), el sidebar siempre está visible */
    @media (min-width: 1024px) {
      :host ::ng-deep .sidebar-container {
        transform: translateX(0) !important;
        visibility: visible !important;
      }
    }
    
    /* En móvil, siempre expandido (w-72) y oculto por defecto */
    @media (max-width: 1023px) {
      :host ::ng-deep .sidebar-container {
        visibility: visible;
        width: 18rem !important; /* w-72 - Siempre expandido en móvil */
      }
      
      /* Asegurar que el sidebar móvil tenga el mismo estilo premium */
      :host ::ng-deep .sidebar-container nav {
        padding: 1rem !important;
      }
      
      :host ::ng-deep .sidebar-container nav a {
        padding: 0.75rem 1rem !important;
        gap: 0.75rem !important;
      }
      
      :host ::ng-deep .sidebar-container .sidebar-footer {
        padding: 1rem !important;
      }
    }
    
    /* Soporte para usuarios con preferencia de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      :host ::ng-deep .sidebar-container,
      :host ::ng-deep .nav-item,
      :host ::ng-deep .nav-text,
      :host ::ng-deep .separator-text {
        transition: none !important;
        animation: none !important;
      }
    }
    
    /* Prevenir desbordamiento horizontal */
    :host {
      overflow-x: hidden;
    }
    
    :host > div {
      max-width: 100%;
    }
    
    /* Header del sidebar - Animación optimizada */
    :host ::ng-deep .sidebar-header {
      transition: padding var(--duration-expand) var(--easing-expand);
    }
    
    /* Título - Fade out optimizado */
    :host ::ng-deep .sidebar-title {
      transition: opacity var(--duration-expand) var(--easing-expand),
                  transform var(--duration-expand) var(--easing-expand);
      transform-origin: left center;
      will-change: opacity, transform;
    }
    
    /* Icono de toggle - Rotación optimizada */
    :host ::ng-deep .sidebar-toggle svg {
      transition: transform var(--duration-expand) var(--easing-expand);
      transform-origin: center center;
      will-change: transform;
    }
    
    /* Rotar el icono cuando el sidebar está colapsado */
    :host ::ng-deep .sidebar-toggle.collapsed svg,
    :host ::ng-deep .sidebar-container.w-16 .sidebar-toggle svg,
    :host ::ng-deep aside.w-16 .sidebar-toggle svg {
      transform: rotate(180deg);
    }
    
    /* Indicador de navegación activa - Oculto por defecto */
    :host ::ng-deep .nav-indicator {
      opacity: 0;
      transition: opacity var(--duration-expand) var(--easing-expand);
      will-change: opacity;
    }
    
    /* Scrollbar personalizado */
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar-thumb {
      background: hsl(var(--bc) / 0.2);
      border-radius: 3px;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--bc) / 0.3);
    }
    
    /* Iconos - Transición de color suave */
    :host ::ng-deep .nav-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
      margin: 0;
      transform-origin: center center;
      color: inherit;  /* Hereda el color del padre */
    }
    
    /* Efecto sutil de escala en hover (sin rotación) */
    :host ::ng-deep .nav-item:hover:not(.active) .nav-icon {
      transform: scale(1.1);
    }
    
    /* Texto de navegación - Optimizado para GPU */
    :host ::ng-deep nav a span,
    :host ::ng-deep .sidebar-footer a span {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.875rem;
      font-weight: 500;
      color: inherit;
      /* Priorizar transform y opacity (GPU-accelerated) */
      transition: opacity var(--duration-expand) var(--easing-expand),
                  transform var(--duration-expand) var(--easing-expand),
                  color 200ms var(--easing-expand);
      transform-origin: left center;
      will-change: opacity, transform;
    }
    
    /* Animación optimizada de colapso - Secuencia simplificada */
    :host ::ng-deep .sidebar-container.w-16 nav a span,
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a span {
      /* Fase 1: Fade out rápido (0-200ms) */
      opacity: 0;
      transform: translateX(-8px) scale(0.96);
      /* Usar max-width solo para layout, no animarlo */
      max-width: 0;
      width: 0;
      /* Transición unificada y rápida */
      transition: opacity var(--duration-collapse) var(--easing-collapse) var(--delay-fast),
                  transform var(--duration-collapse) var(--easing-collapse) var(--delay-fast);
    }
    
    /* Transiciones optimizadas para items de navegación */
    :host ::ng-deep nav {
      transition: padding var(--duration-expand) var(--easing-expand);
    }
    
    /* Animación optimizada de colapso para nav - Secuencia simplificada (solo desktop) */
    @media (min-width: 1024px) {
      :host ::ng-deep .sidebar-container.collapsed nav,
      :host ::ng-deep .sidebar-container[class*="w-16"] nav {
        transition: padding var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
        padding: 1rem 0.5rem !important;
      }
      
      /* Estado colapsado - Centrar iconos y ocultar texto */
      :host ::ng-deep .sidebar-container.collapsed nav a,
      :host ::ng-deep .sidebar-container[class*="w-16"] nav a {
        padding: 0.75rem !important;
        justify-content: center !important;
        gap: 0 !important;
        height: 3rem !important; /* Altura fija para mantener posición */
        min-height: 3rem !important;
      }
      
      :host ::ng-deep .sidebar-container.collapsed nav a svg,
      :host ::ng-deep .sidebar-container[class*="w-16"] nav a svg {
        margin: 0 !important;
        flex-shrink: 0;
        width: 1.25rem !important;
        height: 1.25rem !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      :host ::ng-deep .sidebar-container.collapsed nav a .nav-indicator,
      :host ::ng-deep .sidebar-container[class*="w-16"] nav a .nav-indicator {
        display: none;
      }
      
      :host ::ng-deep .sidebar-container.collapsed nav a span,
      :host ::ng-deep .sidebar-container[class*="w-16"] nav a span {
        display: none !important;
      }
    }
    
    /* Transiciones optimizadas para footer */
    :host ::ng-deep .sidebar-footer,
    :host ::ng-deep div[class*="border-t"] {
      transition: padding var(--duration-expand) var(--easing-expand);
    }
    
    :host ::ng-deep .sidebar-footer a,
    :host ::ng-deep div[class*="border-t"] a {
      transition: padding var(--duration-expand) var(--easing-expand),
                  justify-content var(--duration-expand) var(--easing-expand),
                  gap var(--duration-expand) var(--easing-expand),
                  height var(--duration-expand) var(--easing-expand);
    }
    
    /* Animación optimizada de colapso para footer - Secuencia simplificada (solo desktop) */
    @media (min-width: 1024px) {
      :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a,
      :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a,
      :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a,
      :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a {
        transition: padding var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    justify-content var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    gap var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    height var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
      }
      
      /* Animación optimizada para iconos del footer */
      :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a svg,
      :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a svg,
      :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a svg,
      :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a svg {
        transition: transform var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    color 200ms var(--easing-expand);
        will-change: transform;
      }
      
      /* Animación optimizada de colapso para footer - Padding se ajusta al final */
      :host ::ng-deep .sidebar-container.collapsed .sidebar-footer,
      :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer,
      :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"],
      :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] {
        transition: padding var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
        padding: 1rem 0.5rem !important;
      }
    }
    
    :host ::ng-deep .sidebar-footer a svg,
    :host ::ng-deep div[class*="border-t"] a svg {
      transition: transform var(--duration-expand) var(--easing-expand),
                  color 200ms var(--easing-expand);
      will-change: transform;
    }
    
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a,
    :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a,
    :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a {
      padding: 0.75rem !important;
      justify-content: center !important;
      gap: 0 !important;
      height: 3rem !important; /* Altura fija para mantener posición */
      min-height: 3rem !important;
    }
    
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a svg,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a svg,
    :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a svg,
    :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a svg {
      margin: 0 !important;
      flex-shrink: 0;
      width: 1.25rem !important;
      height: 1.25rem !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a .nav-indicator,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a .nav-indicator,
    :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a .nav-indicator,
    :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a .nav-indicator {
      display: none;
    }
    
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a span,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a span,
    :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a span,
    :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a span {
      display: none !important;
    }
    
    /* Estado colapsado - Texto desaparece INMEDIATAMENTE sin afectar layout */
    :host ::ng-deep .sidebar-container.w-16 .nav-item {
      padding: 0.5rem;
      height: 2.5rem;
      justify-content: flex-start;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .nav-text {
      opacity: 0;
      max-width: 0;
      transform: translateX(-8px);
      pointer-events: none;
      /* NO usar position: absolute - evita saltos visuales */
      overflow: hidden;
      width: 0;
    }
    
    /* Estado expandido - Texto aparece suavemente */
    :host ::ng-deep .sidebar-container.w-64 .nav-text {
      opacity: 1;
      max-width: 100%;
      transform: translateX(0);
      width: auto;
    }
    
    /* Estado activo Premium - Fondo verde suave + Barra lateral verde + Texto verde */
    :host ::ng-deep nav a.active,
    :host ::ng-deep .sidebar-footer a.active {
      background-color: hsl(var(--p) / 0.1) !important;
      color: hsl(var(--p)) !important;
    }
    
    /* Barra vertical izquierda para ítem activo */
    :host ::ng-deep nav a.active .nav-indicator,
    :host ::ng-deep .sidebar-footer a.active .nav-indicator {
      opacity: 1;
    }
    
    :host ::ng-deep nav a.active svg,
    :host ::ng-deep .sidebar-footer a.active svg {
      color: hsl(var(--p)) !important;
    }
    
    :host ::ng-deep nav a.active span,
    :host ::ng-deep .sidebar-footer a.active span {
      color: hsl(var(--p)) !important;
      font-weight: 700;
    }
    
    :host ::ng-deep nav a.active:hover,
    :host ::ng-deep .sidebar-footer a.active:hover {
      background-color: hsl(var(--p) / 0.15) !important;
    }
    
    /* Estado activo en modo colapsado - Fondo azul alrededor del icono */
    :host ::ng-deep .sidebar-container.collapsed nav a.active,
    :host ::ng-deep .sidebar-container[class*="w-16"] nav a.active {
      background-color: hsl(217, 91%, 60% / 0.15) !important;
    }
    
    :host ::ng-deep .sidebar-container.collapsed nav a.active svg,
    :host ::ng-deep .sidebar-container[class*="w-16"] nav a.active svg {
      color: hsl(217, 91%, 60%) !important;
    }
    
    /* Footer activo en modo colapsado */
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a.active,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a.active,
    :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a.active,
    :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a.active {
      background-color: hsl(217, 91%, 60% / 0.15) !important;
    }
    
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a.active svg,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a.active svg,
    :host ::ng-deep .sidebar-container.collapsed div[class*="border-t"] a.active svg,
    :host ::ng-deep .sidebar-container[class*="w-16"] div[class*="border-t"] a.active svg {
      color: hsl(217, 91%, 60%) !important;
    }
    
    /* Cerrar Sesión mantiene su color de error incluso cuando está activo */
    :host ::ng-deep .sidebar-container.collapsed .sidebar-footer a.text-error svg,
    :host ::ng-deep .sidebar-container[class*="w-16"] .sidebar-footer a.text-error svg {
      color: hsl(var(--er)) !important;
    }
    
    /* Transiciones optimizadas para hover y estados */
    :host ::ng-deep nav a {
      transition: background-color 200ms var(--easing-expand),
                  color 200ms var(--easing-expand),
                  transform 200ms var(--easing-expand),
                  padding var(--duration-expand) var(--easing-expand),
                  justify-content var(--duration-expand) var(--easing-expand),
                  gap var(--duration-expand) var(--easing-expand),
                  height var(--duration-expand) var(--easing-expand);
    }
    
    /* Animación optimizada de colapso para enlaces - Secuencia simplificada */
    :host ::ng-deep .sidebar-container.w-16 nav a {
      /* Fase 2: Ajuste de layout después de que el texto desaparece (100ms delay) */
      transition: padding var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  justify-content var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  gap var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  height var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
    }
    
    :host ::ng-deep nav a svg {
      transition: color 200ms var(--easing-expand),
                  transform 200ms var(--easing-expand);
      will-change: transform;
    }
    
    /* Animación optimizada de colapso para iconos - Centrado suave */
    :host ::ng-deep .sidebar-container.w-16 nav a svg {
      /* Fase 3: Iconos se centran (100ms delay) */
      transition: transform var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  color 200ms var(--easing-expand);
    }
    
    /* Active state - Scale down ligero al hacer click */
    :host ::ng-deep nav a:active {
      transform: scale(0.98);
      transition: transform 150ms var(--easing-expand);
    }
    
    /* Toggle button - Micro-interacción */
    :host ::ng-deep .sidebar-toggle:active {
      transform: scale(0.95);
      transition: transform 150ms var(--easing-expand);
    }
    
    /* ============================================
       SEPARADORES - TRANSFORMACIÓN VISUAL
       Principios: Mantener altura constante, transformar contenido visualmente
       ============================================ */
    
    /* Contenedor del separador - Altura fija para mantener posición vertical */
    :host ::ng-deep .nav-separator {
      margin-top: 1.5rem;    /* 24px - Espaciado de sección (mt-6 equivalente) */
      margin-bottom: 0.5rem; /* 8px - Espaciado antes del primer item (mb-2 equivalente) */
      padding: 0;             /* Sin padding, el contenido interno lo maneja */
      height: 1.5rem;        /* 24px - Altura FIJA para mantener posición vertical */
      min-height: 1.5rem;     /* 24px - Altura mínima también fija */
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
      /* Transición optimizada para el contenedor */
      transition: margin-top var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  margin-bottom var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
    }
    
    /* Cuando está colapsado, mantener altura pero mostrar línea */
    :host ::ng-deep .sidebar-container.collapsed .nav-separator,
    :host ::ng-deep .sidebar-container[class*="w-16"] .nav-separator {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      height: 1.5rem;
      min-height: 1.5rem;
    }
    
    /* Texto del separador - Visible cuando expandido */
    :host ::ng-deep .separator-text {
      font-size: 0.6875rem;
      line-height: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: hsl(var(--bc) / 0.4);
      font-weight: 800;
      white-space: nowrap;
      position: relative;
      z-index: 2;
      /* Animación optimizada - solo transform y opacity */
      transition: opacity var(--duration-expand) var(--easing-expand),
                  transform var(--duration-expand) var(--easing-expand);
      transform-origin: left center;
      will-change: opacity, transform;
    }
    
    /* Pseudo-elemento ::after optimizado - Usa scaleX para GPU */
    :host ::ng-deep .nav-separator.collapsed::after {
      content: '';
      position: absolute;
      left: 0.5rem;
      right: 0.5rem;
      top: 50%;
      /* Iniciar invisible - scaleX(0) para GPU acceleration */
      transform: translateY(-50%) scaleX(0);
      transform-origin: center center;
      height: 1px;
      background-color: rgba(0, 0, 0, 0.2);
      z-index: 1;
      display: block;
      opacity: 0;
      visibility: hidden;
      /* Delay reducido: 200ms (después de que el texto desaparezca) */
      /* Duración optimizada: 300ms */
      transition: opacity var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  visibility var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                  transform var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
      will-change: transform, opacity;
    }
    
    /* Estado expandido - Mostrar texto con animación suave */
    :host ::ng-deep .nav-separator:not(.collapsed) .separator-text {
      opacity: 1;
      transform: translateX(0);
      width: auto;
      display: block;
    }
    
    :host ::ng-deep .nav-separator:not(.collapsed)::after {
      display: none;
      content: none;
    }
    
    /* Estado colapsado - El texto desaparece con animación optimizada */
    :host ::ng-deep .nav-separator.collapsed .separator-text {
      /* Desvanecimiento optimizado - solo transform y opacity */
      opacity: 0;
      transform: translateX(-8px) scale(0.96);
      width: 0;
      overflow: hidden;
      pointer-events: none;
      position: absolute;
      left: 0;
      /* Transición rápida y unificada */
      transition: opacity var(--duration-collapse) var(--easing-collapse) var(--delay-fast),
                  transform var(--duration-collapse) var(--easing-collapse) var(--delay-fast);
    }
    
    /* Forzar estructura del pseudo-elemento ::after cuando está colapsado */
    :host ::ng-deep .sidebar-container.collapsed .nav-separator.collapsed::after,
    :host ::ng-deep .sidebar-container[class*="w-16"] .nav-separator.collapsed::after {
      content: '' !important;
      display: block !important;
      background-color: rgba(0, 0, 0, 0.2) !important;
      height: 1px !important;
      position: absolute !important;
      left: 0.5rem !important;
      right: 0.5rem !important;
      top: 50% !important;
      transform-origin: center center !important;
      z-index: 1 !important;
      /* Estado final: hacer visible después del delay */
      transform: translateY(-50%) scaleX(1) !important;
      opacity: 1 !important;
      visibility: visible !important;
      /* Transición optimizada - Delay reducido a 200ms */
      transition: opacity var(--duration-collapse) var(--easing-collapse) var(--delay-medium) !important,
                  visibility var(--duration-collapse) var(--easing-collapse) var(--delay-medium) !important,
                  transform var(--duration-collapse) var(--easing-collapse) var(--delay-medium) !important;
    }
    
    /* Tooltips para estado colapsado - Estilo profesional */
    :host ::ng-deep .nav-item[data-tip]:hover::before {
      content: attr(data-tip);
      position: absolute;
      left: calc(100% + 0.5rem);
      padding: 0.5rem 0.75rem;
      background-color: hsl(var(--b1));
      color: hsl(var(--bc));
      border: 1px solid hsl(var(--bc) / 0.2);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      white-space: nowrap;
      z-index: 50;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      pointer-events: none;
      opacity: 0;
      transform: translateX(-5px);
      transition: opacity 150ms ease, transform 150ms ease;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .nav-item[data-tip]:hover::before {
      opacity: 1;
      transform: translateX(0);
    }
    
    /* Asegurar que los items tengan la misma altura - altura fija, no mínima */
    :host ::ng-deep .nav-item,
    :host ::ng-deep .sidebar-footer .nav-item {
      height: 2.5rem; /* Altura fija para mantener posición vertical consistente */
    }
    
    /* Ajuste fino para el texto de error (Cerrar Sesión) */
    :host ::ng-deep .nav-item.text-error .nav-text {
      color: hsl(var(--er));
    }
    
    :host ::ng-deep .nav-item.text-error .nav-icon {
      color: hsl(var(--er));
    }
    
    :host ::ng-deep .nav-item.text-error:hover:not(.active) {
      background-color: hsl(var(--er) / 0.1);
    }
    
    :host ::ng-deep .nav-item.text-error.active .nav-text {
      color: hsl(var(--er));
    }

    /* ============================================
       MOBILE LANDSCAPE OPTIMIZATION
       Layout en GRID para pantallas rotadas (ahorrar espacio vertical)
       ============================================ */
    @media (orientation: landscape) and (max-height: 500px) {
      /* Ensanchar el sidebar para acomodar el grid */
      :host ::ng-deep .sidebar-container {
        width: 85vw !important;
        max-width: 600px !important;
      }

      /* Header más compacto */
      :host ::ng-deep .sidebar-container > div:first-child {
        min-height: 3rem !important;
        height: auto !important;
        padding: 0.5rem 1rem !important;
      }

      /* Navegación en Grid de 2 columnas */
      :host ::ng-deep nav {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap !important;
        gap: 0.5rem !important;
        padding: 0.5rem !important;
        align-content: flex-start !important;
        overflow-y: auto !important;
      }

      /* Items de navegación al 50% */
      :host ::ng-deep nav > a {
        width: calc(50% - 0.25rem) !important;
        height: 3rem !important;
        margin: 0 !important;
        padding: 0 0.75rem !important;
      }

      /* Ocultar separadores para ahorrar espacio */
      :host ::ng-deep .nav-separator {
        display: none !important;
      }

      /* Footer en Grid de 3 columnas (Config, Ayuda, Logout) */
      :host ::ng-deep .sidebar-footer {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap !important;
        gap: 0.5rem !important;
        padding: 0.5rem !important;
        height: auto !important;
        flex-shrink: 0 !important;
      }

      :host ::ng-deep .sidebar-footer > a {
        width: calc(33.33% - 0.33rem) !important;
        height: 3rem !important;
        padding: 0 0.5rem !important;
        justify-content: center !important;
      }
      
      /* Ocultar texto en footer si es muy estrecho, o reducir fuente */
      :host ::ng-deep .sidebar-footer > a span {
        font-size: 0.75rem !important;
      }
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar implements OnInit {
  // Input para recibir el estado inicial del sidebar desde app.ts
  initialCollapsed = input<boolean>(false);
  // Input para controlar si debe animarse durante entrada
  shouldAnimate = input<boolean>(false);
  // Input para controlar si debe empezar oculto (evita parpadeo en recarga)
  shouldStartHidden = input<boolean>(false);

  isCollapsed = signal(false);
  collapsedChange = output<boolean>();
  isMobileMenuOpen = signal(false);
  private readonly auth = inject(AuthService);
  private readonly confirmModal = inject(ConfirmModalService);
  private initialized = false;

  ngOnInit(): void {
    // Sincronizar el estado inicial solo una vez al montar el componente
    if (!this.initialized) {
      this.isCollapsed.set(this.initialCollapsed());
      this.initialized = true;
    }
  }

  toggleCollapse(): void {
    this.isCollapsed.update(v => {
      const newValue = !v;
      this.collapsedChange.emit(newValue);
      return newValue;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  async openLogoutConfirm(event: Event): Promise<void> {
    event.preventDefault();
    this.closeMobileMenu();

    const confirmed = await this.confirmModal.open({
      title: 'Cerrar sesión',
      message: '¿Seguro que deseas salir de tu cuenta?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      confirmButtonClass: 'btn-error'
    });

    if (confirmed) {
      this.auth.logout();
    }
  }
}
