import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  // Solo añadimos el header a peticiones que vayan a tu backend
  if (!token || !req.url.includes('/api/')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos un 401 (Unauthorized), el token es inválido o expiró
      if (error.status === 401 && !req.url.includes('/login')) {
        // Limpiar sesión y redirigir al login
        auth.logout().catch(() => {
          // Si logout falla, forzar navegación
          router.navigate(['/login']);
        });
      }
      return throwError(() => error);
    })
  );
};

