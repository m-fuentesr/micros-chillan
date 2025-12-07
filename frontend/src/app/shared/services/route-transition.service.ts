import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

export type NavigationType = 'lateral' | 'depth-forward' | 'depth-backward' | 'modal' | null;
export type TransitionDirection = 'forward' | 'backward';

/**
 * Rutas que siempre deben tratarse como modales
 */
const MODAL_ROUTES = [
  '/configuracion',
  '/centro-ayuda'
];

/**
 * Rutas base para detectar navegación a profundidad
 */
const DEPTH_ROUTES = [
  '/maquinas',
  '/choferes'
];

/**
 * Rutas del dashboard admin que deben tener transiciones
 */
const ADMIN_ROUTES = [
  '/dashboard',
  '/about',
  '/bitacora-operaciones',
  '/maquinas',
  '/choferes',
  '/contabilidad',
  '/reportes',
  '/configuracion',
  '/centro-ayuda'
];

@Injectable({
  providedIn: 'root'
})
export class RouteTransitionService {
  private router = inject(Router);
  private previousUrl: string | null = null;
  private currentUrl: string = '';

  constructor() {
    // Trackear URL anterior y actual
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.urlAfterRedirects;
        
        // CRÍTICO: Guardar la URL actual en sessionStorage para detectar recargas
        // Esto permite detectar si venimos de login incluso después de una recarga
        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            window.sessionStorage.setItem('lastRoute', this.currentUrl);
          } catch (e) {
            // Si falla (puede ser por privacidad del navegador), no hacer nada
          }
        }
      });
  }

  /**
   * Verifica si una ruta pertenece al dashboard admin
   */
  isAdminRoute(url: string): boolean {
    if (!url) return false;
    
    // Verificar rutas exactas
    if (ADMIN_ROUTES.some(route => url === route || url.startsWith(route + '/'))) {
      return true;
    }
    
    // Verificar subrutas de máquinas y choferes
    if (url.startsWith('/maquinas/') || url.startsWith('/choferes/')) {
      return true;
    }
    
    return false;
  }

  /**
   * Obtiene la URL anterior
   */
  getPreviousUrl(): string | null {
    return this.previousUrl;
  }

  /**
   * Detecta el tipo de navegación entre dos rutas
   * Retorna null si alguna ruta no es del dashboard admin
   */
  getNavigationType(from: string, to: string): NavigationType {
    // Si alguna ruta no es admin, retornar null
    if (!this.isAdminRoute(from) || !this.isAdminRoute(to)) {
      return null;
    }

    // Si la ruta destino es modal
    if (MODAL_ROUTES.some(route => to.startsWith(route))) {
      return 'modal';
    }

    // Detectar navegación a profundidad (padre → hijo)
    for (const baseRoute of DEPTH_ROUTES) {
      const fromIsBase = from === baseRoute || from === `${baseRoute}/nueva` || from === `${baseRoute}/nuevo`;
      const toIsDetail = to.startsWith(`${baseRoute}/`) && to !== baseRoute && 
                        !to.startsWith(`${baseRoute}/nueva`) && !to.startsWith(`${baseRoute}/nuevo`);
      
      if (fromIsBase && toIsDetail) {
        return 'depth-forward';
      }

      // Detectar navegación desde profundidad (hijo → padre)
      const fromIsDetail = from.startsWith(`${baseRoute}/`) && from !== baseRoute &&
                          !from.startsWith(`${baseRoute}/nueva`) && !from.startsWith(`${baseRoute}/nuevo`);
      const toIsBase = to === baseRoute || to === `${baseRoute}/nueva` || to === `${baseRoute}/nuevo`;
      
      if (fromIsDetail && toIsBase) {
        return 'depth-backward';
      }
    }

    // Detectar navegación entre listas y formularios de creación
    for (const baseRoute of DEPTH_ROUTES) {
      const fromIsList = from === baseRoute;
      const toIsCreate = to === `${baseRoute}/nueva` || to === `${baseRoute}/nuevo`;
      const fromIsCreate = from === `${baseRoute}/nueva` || from === `${baseRoute}/nuevo`;
      const toIsList = to === baseRoute;

      if ((fromIsList && toIsCreate) || (fromIsCreate && toIsList)) {
        return 'lateral';
      }
    }

    // Default: navegación lateral entre rutas del mismo nivel
    return 'lateral';
  }

  /**
   * Detecta la dirección de la transición
   */
  getTransitionDirection(from: string, to: string): TransitionDirection {
    // Si es navegación a profundidad, es forward
    if (this.getNavigationType(from, to) === 'depth-forward') {
      return 'forward';
    }
    
    // Si es navegación desde profundidad, es backward
    if (this.getNavigationType(from, to) === 'depth-backward') {
      return 'backward';
    }
    
    // Para lateral y modal, determinar por longitud de URL o estructura
    // Por ahora, asumimos forward para lateral y modal
    return 'forward';
  }

  /**
   * Obtiene la curva de transición según el tipo y dispositivo
   */
  getTransitionCurve(type: NavigationType, isMobile: boolean): string {
    if (!type) {
      return 'cubic-bezier(0.4, 0, 0.2, 1)';
    }

    // Curvas para desktop
    if (!isMobile) {
      switch (type) {
        case 'lateral':
          return 'cubic-bezier(0.4, 0, 0.2, 1)';
        case 'depth-forward':
          return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
        case 'depth-backward':
          return 'cubic-bezier(0.22, 0.61, 0.36, 1)';
        case 'modal':
          return 'cubic-bezier(0.16, 1, 0.3, 1)';
        default:
          return 'cubic-bezier(0.4, 0, 0.2, 1)';
      }
    }

    // Curvas para móvil
    switch (type) {
      case 'lateral':
        return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      case 'depth-forward':
        return 'cubic-bezier(0.25, 0.1, 0.25, 1)';
      case 'depth-backward':
        return 'cubic-bezier(0.4, 0, 1, 1)';
      case 'modal':
        return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      default:
        return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
  }
}

