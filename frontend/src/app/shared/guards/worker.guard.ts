import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const workerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  if (user && user.role === 'worker') {
    return true;
  }

  // Redirigir al login si no está autenticado
  return router.createUrlTree(['/login']);
};