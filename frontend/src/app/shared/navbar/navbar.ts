import { Component, ChangeDetectionStrategy, signal, output, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Top Bar Móvil Premium (solo visible en < lg) -->
    <div class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-base-200/60 z-30 flex items-center justify-between px-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <button class="btn btn-square btn-ghost hover:bg-base-100 transition-colors" (click)="toggleMobileMenu()" type="button" aria-label="Abrir menú">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-base-content/70">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div class="flex flex-col items-center">
        <span class="font-bold text-lg tracking-tight text-base-content leading-none">NombreApp</span>
        <span class="text-[10px] text-base-content/40 font-medium tracking-wide">ADMINISTRACIÓN</span>
      </div>

      <div class="w-10 h-10 rounded-lg bg-base-200/50 flex items-center justify-center text-xs font-bold text-base-content/70 ring-1 ring-base-200">
        AD
      </div>
    </div>

    <!-- Backdrop Móvil (solo visible cuando el menú está abierto) -->
    @if (isMobileMenuOpen()) {
      <div 
        class="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity animate-in fade-in"
        (click)="closeMobileMenu()">
      </div>
    }

    <!-- Sidebar Premium -->
    <aside 
      class="sidebar-container fixed top-0 bottom-0 left-0 bg-white flex flex-col z-50 border-r border-base-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out h-dvh overflow-hidden lg:translate-x-0"
      [class.w-72]="!isCollapsed()"
      [class.w-16]="isCollapsed()"
      [class.-translate-x-full]="!isMobileMenuOpen()"
      [class.translate-x-0]="isMobileMenuOpen()">
      
      <!-- Header con Branding -->
      <div class="h-20 flex items-center px-6 border-b border-base-100 flex-shrink-0"
           [class.justify-center]="isCollapsed()"
           [class.justify-between]="!isCollapsed()">
        @if (!isCollapsed()) {
          <div class="flex flex-col">
            <span class="font-bold text-lg tracking-tight text-base-content leading-none">NombreApp</span>
            <span class="text-[10px] text-base-content/40 font-medium tracking-wide mt-1">ADMINISTRACIÓN</span>
          </div>
        }
        <div class="flex items-center gap-2 flex-shrink-0">
          <button 
            (click)="toggleCollapse()"
            class="sidebar-toggle btn btn-ghost btn-sm btn-square hidden lg:flex"
            [class.collapsed]="isCollapsed()"
            type="button"
            [attr.aria-label]="isCollapsed() ? 'Expandir sidebar' : 'Colapsar sidebar'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            (click)="closeMobileMenu()"
            class="btn btn-square btn-sm btn-ghost lg:hidden"
            type="button"
            aria-label="Cerrar menú">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Menú de navegación Premium -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        <!-- Dashboard -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Dashboard' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 transition-transform group-hover:scale-110 duration-200">
            <path fill-rule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clip-rule="evenodd" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-bold text-sm tracking-wide">Dashboard</span>
          }
        </a>

        <!-- Bitácora de Operaciones -->
        <a 
          routerLink="/bitacora-operaciones" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Bitácora de Operaciones' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 transition-transform group-hover:scale-110 duration-200">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Bitácora de Operaciones</span>
          }
        </a>

        <!-- Separador: Gestión de Flota -->
        <div class="nav-separator" [class.collapsed]="isCollapsed()">
          @if (!isCollapsed()) {
            <div class="mt-6 mb-2 px-4 flex items-center justify-between group cursor-default">
              <span class="text-[10px] font-black text-base-content/30 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Gestión de Flota</span>
              <div class="h-px bg-base-200 flex-1 ml-3 group-hover:bg-primary/20 transition-colors"></div>
            </div>
          }
        </div>

        <!-- Máquinas -->
        <a 
          routerLink="/maquinas" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Máquinas' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:text-primary transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Máquinas</span>
          }
        </a>

        <!-- Choferes -->
        <a 
          routerLink="/choferes" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Choferes' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:text-primary transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Choferes</span>
          }
        </a>

        <!-- Separador: Finanzas -->
        <div class="nav-separator" [class.collapsed]="isCollapsed()">
          @if (!isCollapsed()) {
            <div class="mt-6 mb-2 px-4 flex items-center justify-between group cursor-default">
              <span class="text-[10px] font-black text-base-content/30 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Finanzas</span>
              <div class="h-px bg-base-200 flex-1 ml-3 group-hover:bg-primary/20 transition-colors"></div>
            </div>
          }
        </div>

        <!-- Contabilidad -->
        <a 
          routerLink="/contabilidad" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Contabilidad' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:text-primary transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Contabilidad</span>
          }
        </a>

        <!-- Reportes -->
        <a 
          routerLink="/reportes" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-base-content/60 hover:bg-base-100 hover:text-base-content hover:shadow-sm border border-transparent hover:border-base-200 transition-all duration-200 relative overflow-hidden"
          [attr.data-tip]="isCollapsed() ? 'Reportes' : null"
          (click)="closeMobileMenu()">
          <div class="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full nav-indicator"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:text-primary transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Reportes</span>
          }
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:text-primary transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Configuración</span>
          }
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:text-primary transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Centro de Ayuda</span>
          }
        </a>

        <!-- Cerrar Sesión -->
        <a 
          class="group flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 hover:text-error hover:shadow-sm border border-transparent hover:border-error/20 transition-all duration-200"
          [attr.data-tip]="isCollapsed() ? 'Cerrar Sesión' : null"
          (click)="onLogout($event)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          @if (!isCollapsed()) {
            <span class="font-medium text-sm">Cerrar Sesión</span>
          }
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
      :host ::ng-deep .sidebar-container.w-16 nav {
        transition: padding var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
        padding: 1rem 0.5rem !important;
      }
      
      /* Estado colapsado - Centrar iconos y ocultar texto */
      :host ::ng-deep .sidebar-container.w-16 nav a {
        padding: 0.75rem !important;
        justify-content: center !important;
        gap: 0 !important;
        height: 3rem !important; /* Altura fija para mantener posición */
        min-height: 3rem !important;
      }
      
      :host ::ng-deep .sidebar-container.w-16 nav a svg {
        margin: 0 !important;
        flex-shrink: 0;
        width: 1.25rem !important;
        height: 1.25rem !important;
      }
      
      :host ::ng-deep .sidebar-container.w-16 nav a .nav-indicator {
        display: none;
      }
      
      :host ::ng-deep .sidebar-container.w-16 nav a span {
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
      :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a,
      :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a {
        transition: padding var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    justify-content var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    gap var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    height var(--duration-collapse) var(--easing-collapse) var(--delay-medium);
      }
      
      /* Animación optimizada para iconos del footer */
      :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a svg,
      :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a svg {
        transition: transform var(--duration-collapse) var(--easing-collapse) var(--delay-medium),
                    color 200ms var(--easing-expand);
        will-change: transform;
      }
      
      /* Animación optimizada de colapso para footer - Padding se ajusta al final */
      :host ::ng-deep .sidebar-container.w-16 .sidebar-footer,
      :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] {
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
    
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a,
    :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a {
      padding: 0.75rem !important;
      justify-content: center !important;
      gap: 0 !important;
      height: 3rem !important; /* Altura fija para mantener posición */
      min-height: 3rem !important;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a svg,
    :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a svg {
      margin: 0 !important;
      flex-shrink: 0;
      width: 1.25rem !important;
      height: 1.25rem !important;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a .nav-indicator,
    :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a .nav-indicator {
      display: none;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a span,
    :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a span {
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
    :host ::ng-deep .sidebar-container.w-16 nav a.active {
      background-color: hsl(217, 91%, 60% / 0.15) !important;
    }
    
    :host ::ng-deep .sidebar-container.w-16 nav a.active svg {
      color: hsl(217, 91%, 60%) !important;
    }
    
    /* Footer activo en modo colapsado */
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a.active,
    :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a.active {
      background-color: hsl(217, 91%, 60% / 0.15) !important;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a.active svg,
    :host ::ng-deep .sidebar-container.w-16 div[class*="border-t"] a.active svg {
      color: hsl(217, 91%, 60%) !important;
    }
    
    /* Cerrar Sesión mantiene su color de error incluso cuando está activo */
    :host ::ng-deep .sidebar-container.w-16 .sidebar-footer a.text-error svg {
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
    :host ::ng-deep .sidebar-container.w-16 .nav-separator {
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
    :host ::ng-deep .sidebar-container.w-16 .nav-separator.collapsed::after {
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
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar {
  isCollapsed = signal(false);
  collapsedChange = output<boolean>();
  isMobileMenuOpen = signal(false);
  private readonly auth = inject(AuthService);

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

  onLogout(event: Event): void {
    event.preventDefault();
    this.auth.logout();
    this.closeMobileMenu();
  }
}
