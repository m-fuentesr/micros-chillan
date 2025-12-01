import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';

/**
 * Estrategia de preloading inteligente que pre-carga rutas críticas
 * después del login basándose en el rol del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class SmartPreloadingStrategy implements PreloadingStrategy {
  private authService = inject(AuthService);

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Rutas que siempre se pre-cargan (críticas)
    const criticalRoutes = ['dashboard', 'bitacora-operaciones'];
    
    // Rutas para trabajador
    const workerRoutes = ['trabajador', 'trabajador/reportar'];
    
    // Rutas que nunca se pre-cargan (pesadas o poco usadas)
    const neverPreload = ['reportes', 'contabilidad', 'configuracion', 'centro-ayuda', 'about'];
    
    const routePath = route.path || '';
    
    // No pre-cargar rutas que están en la lista de nunca pre-cargar
    if (neverPreload.includes(routePath)) {
      return of(null);
    }
    
    // Pre-cargar rutas críticas inmediatamente después del login
    if (criticalRoutes.includes(routePath)) {
      // Esperar 2 segundos después del login para no afectar la carga inicial
      return timer(2000).pipe(
        mergeMap(() => {
          const currentUser = this.authService.currentUser();
          // Solo pre-cargar si el usuario está autenticado y es admin
          if (currentUser && currentUser.role === 'admin') {
            return load();
          }
          return of(null);
        })
      );
    }
    
    // Pre-cargar rutas de trabajador
    if (workerRoutes.includes(routePath)) {
      return timer(2000).pipe(
        mergeMap(() => {
          const currentUser = this.authService.currentUser();
          // Solo pre-cargar si el usuario está autenticado y es trabajador
          if (currentUser && currentUser.role === 'worker') {
            return load();
          }
          return of(null);
        })
      );
    }
    
    // Para otras rutas, usar preloading estándar (preload después de 5 segundos)
    return timer(5000).pipe(
      mergeMap(() => load())
    );
  }
}

