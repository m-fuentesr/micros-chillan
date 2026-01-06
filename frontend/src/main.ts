import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

// Supresión global de errores no críticos antes de iniciar la aplicación
if (typeof window !== 'undefined') {
  // 1. Manejar unhandledrejection (Promesas)
  window.addEventListener('unhandledrejection', (event) => {
    // Ignorar error de LockManager de Supabase
    if (event.reason?.name === 'NavigatorLockAcquireTimeoutError' ||
      (typeof event.reason === 'string' && event.reason.includes('NavigatorLockAcquireTimeoutError'))) {
      event.preventDefault(); // Prevenir que aparezca en la consola
    }
  });

  // 2. Manejar window.onerror (Errores generales)
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Ignorar error de LockManager de Supabase
    if (error?.name === 'NavigatorLockAcquireTimeoutError' ||
      (typeof message === 'string' && message.includes('NavigatorLockAcquireTimeoutError'))) {
      return true; // Prevenir propagación
    }
    // Delegar a otros handlers si existen
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
