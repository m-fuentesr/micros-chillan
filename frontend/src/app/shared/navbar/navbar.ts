import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Top Bar Móvil (solo visible en < lg) -->
    <div class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-base-300 border-b border-base-content/10 z-30 flex items-center justify-between px-4 shadow-sm">
      <button class="btn btn-square btn-ghost" (click)="toggleMobileMenu()" type="button" aria-label="Abrir menú">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <span class="font-bold text-lg text-base-content">Nombre de la App</span>

      <div class="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold">
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

    <!-- Sidebar -->
    <aside 
      class="sidebar-container fixed top-0 bottom-0 left-0 w-64 bg-base-300 flex flex-col z-50 border-r border-base-content/10 transition-transform duration-300 ease-in-out h-dvh overflow-y-auto overflow-x-hidden lg:translate-x-0"
      [class.w-64]="!isCollapsed()"
      [class.w-16]="isCollapsed()"
      [class.-translate-x-full]="!isMobileMenuOpen()"
      [class.translate-x-0]="isMobileMenuOpen()">
      
      <!-- Título superior con botón de colapsar -->
      <div class="sidebar-header p-4 border-b border-base-content/10 flex-shrink-0 flex items-center gap-2 overflow-x-hidden"
           [class.justify-between]="!isCollapsed()"
           [class.justify-center]="isCollapsed()">
        @if (!isCollapsed()) {
          <h2 class="sidebar-title text-xl font-bold text-base-content truncate flex-1 min-w-0">Nombre de la App</h2>
        }
        <div class="flex items-center gap-2 flex-shrink-0">
          <button 
            (click)="toggleCollapse()"
            class="sidebar-toggle btn btn-ghost btn-sm btn-square hidden lg:flex"
            type="button"
            [attr.aria-label]="isCollapsed() ? 'Expandir sidebar' : 'Colapsar sidebar'">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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

      <!-- Menú de navegación -->
      <nav class="sidebar-nav flex-1 p-4 overflow-y-auto overflow-x-hidden">
        <div class="space-y-2">
          <!-- Dashboard -->
          <a 
            routerLink="/dashboard" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item"
            [attr.data-tip]="isCollapsed() ? 'Dashboard' : null"
            (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="nav-text">Dashboard</span>
          </a>

          <!-- Separador: Gestión de Flota -->
          <div class="nav-separator" [class.collapsed]="isCollapsed()">
            <span class="separator-text">Gestión de Flota</span>
          </div>

          <!-- Máquinas -->
          <a 
            routerLink="/maquinas" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item"
            [attr.data-tip]="isCollapsed() ? 'Máquinas' : null"
            (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span class="nav-text">Máquinas</span>
          </a>

          <!-- Choferes -->
          <a 
            routerLink="/choferes" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item"
            [attr.data-tip]="isCollapsed() ? 'Choferes' : null"
            (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="nav-text">Choferes</span>
          </a>

          <!-- Separador: Finanzas -->
          <div class="nav-separator" [class.collapsed]="isCollapsed()">
            <span class="separator-text">Finanzas</span>
          </div>

          <!-- Contabilidad -->
          <a 
            routerLink="/contabilidad" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item"
            [attr.data-tip]="isCollapsed() ? 'Contabilidad' : null"
            (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="nav-text">Contabilidad</span>
          </a>

          <!-- Reportes -->
          <a 
            routerLink="/reportes" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item"
            [attr.data-tip]="isCollapsed() ? 'Reportes' : null"
            (click)="closeMobileMenu()">
            <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="nav-text">Reportes</span>
          </a>
        </div>
      </nav>

      <!-- Sección inferior -->
      <div class="sidebar-footer p-4 border-t border-base-content/10 space-y-2 flex-shrink-0 overflow-x-hidden">
        <!-- Configuración -->
        <a 
          routerLink="/configuracion" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="nav-item"
          [attr.data-tip]="isCollapsed() ? 'Configuración' : null"
          (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="nav-text">Configuración</span>
        </a>

        <!-- Centro de Ayuda -->
        <a 
          routerLink="/centro-ayuda" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: false}"
          class="nav-item"
          [attr.data-tip]="isCollapsed() ? 'Centro de Ayuda' : null"
          (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="nav-text">Centro de Ayuda</span>
        </a>

        <!-- Cerrar Sesión -->
        <a 
          class="nav-item text-error"
          [attr.data-tip]="isCollapsed() ? 'Cerrar Sesión' : null"
          (click)="closeMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="nav-text">Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  `,
  styles: [
    `    /* ============================================
       SIDEBAR PROFESIONAL - ANIMACIONES OPTIMIZADAS (60 FPS)
       Principios: Solo transform/opacity, Cubic-bezier refinados, Accesibilidad
       ============================================ */
    
    /* Contenedor principal - Animación suave y pausada */
    :host ::ng-deep .sidebar-container {
      transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
      will-change: width, transform;
    }
    
    /* En desktop (lg+), el sidebar siempre está visible */
    @media (min-width: 1024px) {
      :host ::ng-deep .sidebar-container {
        transform: translateX(0) !important;
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
    
    /* Header del sidebar - Animación suave y pausada */
    :host ::ng-deep .sidebar-header {
      transition: padding 500ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Título - Fade out suave */
    :host ::ng-deep .sidebar-title {
      transition: opacity 400ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: left center;
    }
    
    /* Icono de toggle - Rotación suave sin bounce */
    :host ::ng-deep .sidebar-toggle svg {
      transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center center;
    }
    
    :host ::ng-deep .sidebar-container.w-16 .sidebar-toggle svg {
      transform: rotate(180deg);
    }
    
    /* Items de navegación - Animación suave y pausada */
    :host ::ng-deep .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      height: 2.5rem;
      /* Transiciones suaves para estados - Solo propiedades GPU-accelerated */
      transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
                  border-left 200ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 0;
      overflow: hidden;
      cursor: pointer;
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
    }
    
    /* Efecto sutil de rotación en hover (más sutil) */
    :host ::ng-deep .nav-item:hover .nav-icon {
      transform: rotate(5deg) scale(1.05);
    }
    
    /* Texto de navegación - Desaparición RÁPIDA sin saltos visuales */
    :host ::ng-deep .nav-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      /* Transición MUY RÁPIDA para ocultar inmediatamente sin saltos */
      transition: opacity 900ms cubic-bezier(0.4, 0, 0.2, 1),
                  max-width 500ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 900ms cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: left center;
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
    
    /* Estado activo - Borde izquierdo + Color primario */
    :host ::ng-deep .nav-item.active {
      background-color: hsl(var(--b2) / 0.3);
      border-left: 4px solid hsl(var(--p));
      padding-left: calc(0.5rem - 4px);
    }
    
    :host ::ng-deep .nav-item.active .nav-icon {
      color: hsl(var(--p));
    }
    
    :host ::ng-deep .nav-item.active .nav-text {
      color: hsl(var(--p));
      font-weight: 600;
    }
    
    /* Hover state - Mejora con translateX sutil */
    :host ::ng-deep .nav-item:hover:not(.active) {
      background-color: hsl(var(--b2) / 0.2);
      transform: translateX(4px);
      transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Active state - Scale down ligero al hacer click */
    :host ::ng-deep .nav-item:active {
      transform: scale(0.98);
      transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* ============================================
       SEPARADORES - TRANSFORMACIÓN VISUAL
       Principios: Mantener altura constante, transformar contenido visualmente
       ============================================ */
    
    /* Contenedor del separador - Altura fija para mantener posición vertical */
    :host ::ng-deep .nav-separator {
      margin-top: 1rem;      /* 16px - Espaciado de sección (8pt grid) */
      margin-bottom: 0.5rem; /* 8px - Espaciado antes del primer item (8pt grid) */
      padding: 0 0.5rem;     /* 8px horizontal - Alineado con items de navegación */
      height: 1.5rem;        /* 24px - Altura FIJA para mantener posición vertical */
      min-height: 1.5rem;     /* 24px - Altura mínima también fija */
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden; /* Ocultar cualquier contenido que se desborde */
    }
    
    /* Texto del separador - Visible cuando expandido */
    :host ::ng-deep .separator-text {
      font-size: 0.75rem;           /* 12px - Tamaño estándar para labels de sección */
      line-height: 1.5rem;          /* 24px - Altura de línea = altura del contenedor */
      text-transform: uppercase;
      letter-spacing: 0.05em;       /* Tracking para legibilidad */
      color: hsl(var(--bc) / 0.5);  /* 50% opacidad - Jerarquía visual secundaria */
      font-weight: 600;
      white-space: nowrap;
      position: relative;
      z-index: 2;
      /* Animación RÁPIDA de desvanecimiento - El texto debe desaparecer rápido */
      transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: left center;
    }
    
    /* SOLUCIÓN PRINCIPAL: Pseudo-elemento ::after - Completamente invisible hasta el delay */
    :host ::ng-deep .nav-separator.collapsed::after {
      content: '';
      position: absolute;
      left: 0.5rem;
      right: 0.5rem;
      top: 50%;
      /* CRÍTICO: Iniciar completamente invisible - scaleX(0) y opacity 0 */
      transform: translateY(-50%) scaleX(0);
      transform-origin: center center;
      height: 1px;
      background-color: rgba(0, 0, 0, 0.2);
      z-index: 1;
      display: block;
      opacity: 0;
      visibility: hidden;
      /* Delay: 950ms (después de que el texto haya desaparecido completamente) */
      /* Duración: 1000ms para aparecer suavemente - La línea se transforma lentamente */
      /* Easing suave y natural */
      transition: opacity 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms,
                  visibility 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms,
                  transform 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms;
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
    
    /* Estado colapsado - El texto desaparece RÁPIDAMENTE */
    :host ::ng-deep .nav-separator.collapsed .separator-text {
      /* Desvanecimiento rápido - El texto debe desaparecer inmediatamente */
      opacity: 0;
      transform: translateX(-8px);
      width: 0;
      overflow: hidden;
      pointer-events: none;
      position: absolute;
      left: 0;
      /* Transición RÁPIDA (250ms) - DEBE coincidir con la regla general */
      transition: opacity 950ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 950ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Forzar estructura del pseudo-elemento ::after cuando está colapsado (sobrescribe regla base) */
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
      /* Transición con delay - Aparece después de que el texto haya desaparecido (250ms) */
      /* Duración: 1000ms para transformación suave de la línea */
      transition: opacity 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms !important,
                  visibility 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms !important,
                  transform 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 250ms !important;
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
}
