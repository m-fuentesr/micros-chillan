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
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

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



