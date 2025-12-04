import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/auth.models';

/**
 * Guard de autenticación y autorización por rol.
 *
 * Uso en rutas:
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   data: { role: 'admin' }
 * }
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree | Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si aún estamos verificando la sesión inicial, esperar
  if (auth.isInitializing()) {
    return new Promise<boolean | UrlTree>((resolve) => {
      // Esperar a que termine la inicialización
      const checkAuth = () => {
        if (!auth.isInitializing()) {
          // Inicialización completa, verificar usuario
          const user = auth.currentUser();
          
          if (!user) {
            resolve(router.createUrlTree(['/login'], {
              queryParams: { redirectTo: state.url || '/' }
            }));
            return;
          }

          const requiredRole = route.data?.['role'] as UserRole | undefined;
          
          // Si la ruta no define rol, basta con estar autenticado
          if (!requiredRole) {
            resolve(true);
            return;
          }

          // Si la ruta define rol y no coincide con el del usuario, redirige a su "home"
          if (user.role !== requiredRole) {
            const fallback = user.role === 'admin' ? '/dashboard' : '/trabajador';
            resolve(router.createUrlTree([fallback]));
            return;
          }

          resolve(true);
        } else {
          // Aún inicializando, esperar un poco más (polling cada 50ms)
          setTimeout(checkAuth, 50);
        }
      };
      
      checkAuth();
    });
  }

  // Si ya terminó la inicialización, comportamiento normal (síncrono)
  const user = auth.currentUser();

  // Sin sesión -> redirige a login, conservando la URL objetivo
  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url || '/' }
    });
  }

  const requiredRole = route.data?.['role'] as UserRole | undefined;

  // Si la ruta no define rol, basta con estar autenticado
  if (!requiredRole) {
    return true;
  }

  // Si la ruta define rol y no coincide con el del usuario, redirige a su "home"
  if (user.role !== requiredRole) {
    const fallback = user.role === 'admin' ? '/dashboard' : '/trabajador';
    return router.createUrlTree([fallback]);
  }

  return true;
};



