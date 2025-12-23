import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  createClient,
  SupabaseClient,
  AuthChangeEvent,
  Session
} from '@supabase/supabase-js';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth.models';
import { environment } from '../../../environments/environment.development';
import { SpinnerService } from './spinner.service';

const SUPABASE_URL = environment.supabaseUrl;
const SUPABASE_ANON_KEY = environment.supabaseAnonKey;
const API_BASE_URL = environment.apiBaseUrl;

interface MeResponse {
  id: number;
  supabase_uid: string;
  rol_id: number;
  correo: string;
  estado: string;
  chofer_id: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userStorageKey = 'auth_user';
  private readonly tokenStorageKey = 'auth_token';

  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly spinnerService = inject(SpinnerService);

  private supabase: SupabaseClient;

  private readonly _currentUser = signal<AuthUser | null>(this.hydrateUser());
  readonly currentUser = this._currentUser;

  private readonly _isRecovering = signal(false);
  readonly isRecovering = this._isRecovering.asReadonly();

  // Signal para indicar si estamos verificando la sesión inicial
  private readonly _isInitializing = signal(true);
  readonly isInitializing = this._isInitializing.asReadonly();

  // Flag para prevenir múltiples llamadas simultáneas a syncDomainUser
  private isSyncing = false;
  // Flag para prevenir múltiples inicializaciones
  private isInitialized = false;
  // Flag para indicar que estamos en proceso de login manual
  private isManualLogin = false;
  // Flag para omitir la redirección automática al cerrar sesión (p.ej. flujo recovery)
  private skipSignOutRedirect = false;

  constructor() {
    // Configurar el cliente de Supabase
    // Nota: El error NavigatorLockAcquireTimeoutError no es crítico.
    // Ocurre cuando Supabase intenta usar LockManager para sincronizar entre pestañas
    // pero otra pestaña ya tiene el lock. La sincronización seguirá funcionando
    // a través de eventos de storage.
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Usar localStorage para mejor sincronización entre pestañas
        // Esto permite que múltiples pestañas compartan la sesión sin necesidad de locks
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Manejar errores de LockManager silenciosamente (no críticos)
    if (typeof window !== 'undefined') {
      const originalErrorHandler = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        // Ignorar errores de NavigatorLockAcquireTimeoutError
        if (error?.name === 'NavigatorLockAcquireTimeoutError' || 
            (typeof message === 'string' && message.includes('NavigatorLockAcquireTimeoutError'))) {
          // Este error no es crítico - Supabase seguirá funcionando correctamente
          return true; // Prevenir que el error se propague
        }
        // Llamar al handler original para otros errores
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
        return false;
      };

      // También manejar errores no capturados
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.name === 'NavigatorLockAcquireTimeoutError' ||
            (typeof event.reason === 'string' && event.reason.includes('NavigatorLockAcquireTimeoutError'))) {
          event.preventDefault(); // Prevenir que aparezca en la consola
        }
      });
    }

    this.supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
      // ===============================
      // Recovery flow
      // ===============================
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY detectado');

        this._isRecovering.set(true);

        // Cortar cualquier flujo previo
        this.isManualLogin = false;
        this.isSyncing = false;

        // Limpiar estado local (muy importante)
        this._currentUser.set(null);
        sessionStorage.removeItem(this.tokenStorageKey);
        sessionStorage.removeItem(this.userStorageKey);

        // NO persistir token
        // NO llamar syncDomainUser
        // NO dejar pasar guards

        await this.router.navigateByUrl('/restablecer-clave', {
          replaceUrl: true,
        });

        return; // No continuar
      }

      // Evitar logs excesivos en producción
      if (event !== 'TOKEN_REFRESHED') {
        console.log('Auth event:', event, session);
      }

      switch (event) {
        case 'TOKEN_REFRESHED':
          // Cuando el token se refresca, actualizar y sincronizar con el backend
          if (session?.access_token) {
            this.persistToken(session.access_token);
            // Sincronizar con el backend para asegurar que el nuevo token es válido
            if (!this.isSyncing) {
              await this.syncDomainUser().catch((err) => {
                // Si falla la sincronización con el nuevo token, limpiar sesión
                console.error('Error al sincronizar después de refresh:', err);
                this.clearSession();
                if (!this.router.url.startsWith('/login')) {
                  this.router.navigate(['/login']);
                }
              });
            }
          }
          break;

        case 'SIGNED_IN':
          if (session?.access_token) {
            this.persistToken(session.access_token);
            // Solo sincronizar si no estamos ya sincronizando y no es un login manual
            // (el login manual manejará la sincronización)
            if (!this.isSyncing && !this.isManualLogin) {
              await this.syncDomainUser();
            } else if (this.isManualLogin) {
              // Si es login manual, esperar un momento para que el token se propague
              // y luego sincronizar
              setTimeout(async () => {
                this.isManualLogin = false;
                if (!this.isSyncing) {
                  await this.syncDomainUser();
                }
              }, 100);
            }
          }
          break;

        case 'SIGNED_OUT':
          this.clearSession();
          if (this.skipSignOutRedirect) {
            this.skipSignOutRedirect = false;
            break;
          }
          // Solo navegar si no estamos ya en login
          if (!this.router.url.startsWith('/login')) {
            await this.router.navigate(['/login']);
          }
          break;

        case 'USER_UPDATED':
          // Solo sincronizar si no estamos ya sincronizando
          if (!this.isSyncing) {
            await this.syncDomainUser();
          }
          break;

        default:
          break;
      }
    });

    // Solo intentar restaurar sesión una vez
    if (!this.isInitialized) {
      // Timeout de seguridad: si la inicialización tarda más de 5 segundos, forzar fin
      const timeoutId = setTimeout(() => {
        if (this._isInitializing()) {
          console.warn('Timeout en inicialización de sesión, forzando fin');
          this._isInitializing.set(false);
        }
      }, 5000);
      
      this.tryRestoreSession().then((remainingDelay) => {
        clearTimeout(timeoutId);
        // Si la verificación fue muy rápida, esperar el tiempo restante
        // para asegurar que el spinner se muestre al menos 400ms
        if (remainingDelay > 0) {
          setTimeout(() => {
            this._isInitializing.set(false);
          }, remainingDelay);
        } else {
          // Si ya pasó el tiempo mínimo, ocultar inmediatamente
          this._isInitializing.set(false);
        }
      }).catch(() => {
        clearTimeout(timeoutId);
        // En caso de error, ocultar después del delay mínimo
        setTimeout(() => {
          this._isInitializing.set(false);
        }, 400);
      });
      this.isInitialized = true;
    } else {
      // Si ya está inicializado, no estamos verificando
      this._isInitializing.set(false);
    }
  }

  async loginWithCredentials(email: string, password: string): Promise<void> {
    // Marcar que estamos haciendo login manual
    this.isManualLogin = true;

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        this.isManualLogin = false;
        
        // Analizar el tipo de error de Supabase para dar mensajes más específicos
        // IMPORTANTE: Verificar errores de email PRIMERO antes que errores de contraseña
        if (error) {
          const errorMessage = error.message?.toLowerCase() || '';
          const errorStatus = error.status || 0;
          
          // PRIORIDAD 1: Errores de red/conexión (PRIMERO antes de analizar contenido)
          if (errorMessage.includes('failed to fetch') ||
              errorMessage.includes('network error') ||
              errorMessage.includes('networkerror') ||
              errorMessage.includes('fetch failed') ||
              errorMessage.includes('network') || 
              errorMessage.includes('timeout') ||
              errorMessage.includes('connection') ||
              error.message === 'Failed to fetch') {
            throw new Error('NETWORK_ERROR');
          }
          
          // PRIORIDAD 2: Errores de servidor
          if (errorMessage.includes('server error') ||
              errorMessage.includes('internal server error') ||
              errorMessage.includes('service unavailable')) {
            throw new Error('NETWORK_ERROR');
          }
          
          // PRIORIDAD 3: Email no encontrado o formato inválido
          if (errorMessage.includes('email') && 
              (errorMessage.includes('not found') || 
               errorMessage.includes('does not exist') ||
               errorMessage.includes('user not found') ||
               errorMessage.includes('no user found'))) {
            throw new Error('EMAIL_NOT_FOUND');
          }
          
          // PRIORIDAD 4: Email no confirmado
          if (errorMessage.includes('email not confirmed') || 
              errorMessage.includes('not confirmed') ||
              errorMessage.includes('email_not_confirmed')) {
            throw new Error('EMAIL_NOT_CONFIRMED');
          }
          
          // PRIORIDAD 5: Si el mensaje menciona específicamente "email" sin mencionar "password",
          // es más probable que sea un problema de email
          if (errorMessage.includes('email') && 
              !errorMessage.includes('password') &&
              (errorStatus === 400 || errorStatus === 404)) {
            throw new Error('EMAIL_NOT_FOUND');
          }
          
          // PRIORIDAD 6: Demasiados intentos
          if (errorMessage.includes('too many requests') || 
              errorMessage.includes('rate limit') ||
              errorMessage.includes('rate_limit_exceeded')) {
            throw new Error('TOO_MANY_ATTEMPTS');
          }
          
          // PRIORIDAD 7: Usuario deshabilitado
          if (errorMessage.includes('disabled') || 
              errorMessage.includes('banned') ||
              errorMessage.includes('user is disabled')) {
            throw new Error('USER_DISABLED');
          }
          
          // PRIORIDAD 8: Contraseña incorrecta - Solo si NO es un error de email
          // Supabase generalmente devuelve "Invalid login credentials" para ambos casos,
          // pero si menciona específicamente "password", es más probable que sea contraseña
          if (errorMessage.includes('invalid password') ||
              errorMessage.includes('wrong password') ||
              (errorMessage.includes('password') && 
               !errorMessage.includes('email') &&
               errorStatus === 400)) {
            throw new Error('INVALID_PASSWORD');
          }
          
          // PRIORIDAD 9: Si el error es 400 y menciona credenciales pero NO menciona email,
          // probablemente es contraseña incorrecta (el email existe pero la contraseña no)
          if (errorStatus === 400 && 
              errorMessage.includes('credentials') &&
              !errorMessage.includes('email')) {
            throw new Error('INVALID_PASSWORD');
          }
        }
        
        // Error genérico como fallback
        throw new Error('INVALID_CREDENTIALS');
      }

      const accessToken = data.session.access_token;
      this.persistToken(accessToken);

      // Esperar un momento para que el evento SIGNED_IN se procese
      // y luego sincronizar con el backend
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Sincronizar con el backend (el evento SIGNED_IN ya actualizó el token)
      // syncDomainUser tiene retry automático para errores 401, así que esperamos
      // un poco más después de la sincronización para dar tiempo a los retries
      try {
        await this.syncDomainUser();
      } catch (syncError: any) {
        // Si es un error 401 durante login manual, dar tiempo adicional para retry
        // El retry se ejecuta dentro de syncDomainUser, pero puede tardar
        if (syncError?.status === 401 && this.isManualLogin) {
          // Esperar tiempo suficiente para que el retry se complete (300ms + tiempo de petición)
          await new Promise(resolve => setTimeout(resolve, 600));
          // Verificar nuevamente si ahora hay usuario (el retry pudo haber funcionado)
          const userAfterRetry = this.currentUser();
          if (userAfterRetry) {
            // El retry fue exitoso, no lanzar error
            return;
          }
        }
        // Si no es un 401 o el retry no funcionó, lanzar el error
        throw syncError;
      }

      // Dar un pequeño tiempo adicional para asegurar que el usuario se haya persistido
      await new Promise(resolve => setTimeout(resolve, 100));

      const user = this.currentUser();
      if (!user) {
        // Si no hay usuario después de sincronizar, algo salió mal
        throw new Error('No se pudo obtener la información del usuario');
      }
      // NO navegar automáticamente aquí - el componente Login manejará la navegación
      // después de la animación de transición
    } catch (error: any) {
      this.isManualLogin = false;
      
      // Detectar errores de red a nivel de JavaScript/fetch que no fueron capturados por Supabase
      if (error?.message === 'Failed to fetch' ||
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('NETWORK_ERROR');
      }
      
      // Re-lanzar el error si ya está categorizado
      throw error;
    } finally {
      // Asegurar que el flag se resetee incluso si hay un error
      setTimeout(() => {
        this.isManualLogin = false;
      }, 500);
    }
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  async updatePassword(password: string) {
    return this.supabase.auth.updateUser({ password });
  }

  async sendPasswordResetEmail(email: string) {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/restablecer-clave`
      : undefined;

    try {
      const result = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      // Si hay un error, verificar si es un error de red
      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || '';
        
        // Detectar errores de red/conexión
        if (errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network error') ||
            errorMessage.includes('networkerror') ||
            errorMessage.includes('fetch failed') ||
            result.error.message === 'Failed to fetch') {
          throw new Error('NETWORK_ERROR');
        }
        
        // Detectar errores de servidor
        if (errorMessage.includes('server error') ||
            errorMessage.includes('internal server error') ||
            errorMessage.includes('service unavailable')) {
          throw new Error('SERVER_ERROR');
        }
        
        // Detectar si el email no existe
        if (errorMessage.includes('user not found') ||
            errorMessage.includes('email not found') ||
            errorMessage.includes('no user found')) {
          throw new Error('EMAIL_NOT_FOUND');
        }
        
        // Detectar si el email no está confirmado
        if (errorMessage.includes('email not confirmed') ||
            errorMessage.includes('not confirmed')) {
          throw new Error('EMAIL_NOT_CONFIRMED');
        }
        
        // Otros errores de Supabase
        throw new Error(result.error.message || 'UNKNOWN_ERROR');
      }

      return result;
    } catch (error: any) {
      // Si es un error de red que no fue capturado por Supabase
      if (error?.message === 'Failed to fetch' ||
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('NETWORK_ERROR');
      }
      
      // Si ya es un error que lanzamos nosotros, re-lanzarlo
      if (error?.message === 'NETWORK_ERROR' ||
          error?.message === 'SERVER_ERROR' ||
          error?.message === 'EMAIL_NOT_FOUND' ||
          error?.message === 'EMAIL_NOT_CONFIRMED' ||
          error?.message === 'UNKNOWN_ERROR') {
        throw error;
      }
      
      // Error desconocido
      throw new Error(error?.message || 'UNKNOWN_ERROR');
    }
  }


  private async syncDomainUser(retryCount = 0): Promise<void> {
    // Prevenir múltiples llamadas simultáneas
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const me = await firstValueFrom(
        this.http.get<MeResponse>(`${API_BASE_URL}/api/auth/me`)
      );

      const role: UserRole = me.rol_id === 1 ? 'admin' : 'worker';

      const user: AuthUser = {
        id: me.id,
        supabaseUid: me.supabase_uid,
        email: me.correo,
        displayName: me.correo,
        role,
        estado: me.estado,
        choferId: me.chofer_id,
      };

      this.persistUser(user);
    } catch (error: any) {
      // Solo limpiar sesión si es un error 401 (no autorizado)
      // No limpiar en otros errores (red, servidor, etc.)
      if (error?.status === 401) {
        // Si estamos en proceso de login manual y es el primer intento, esperar un poco y reintentar
        // (puede haber un delay en la propagación del token al backend)
        if (this.isManualLogin && retryCount === 0) {
          this.isSyncing = false;
          // Esperar un poco más para dar tiempo a que el token se propague completamente
          await new Promise(resolve => setTimeout(resolve, 400));
          // Reintentar - si el retry es exitoso, no lanzar error
          try {
            await this.syncDomainUser(1);
            // Si el retry fue exitoso, salir sin error
            this.isSyncing = false;
            return;
          } catch (retryError: any) {
            // Si el retry también falla con 401, intentar un segundo retry con más tiempo
            if (retryError?.status === 401 && retryCount === 0) {
              this.isSyncing = false;
              await new Promise(resolve => setTimeout(resolve, 500));
              try {
                await this.syncDomainUser(2);
                // Si el segundo retry fue exitoso, salir sin error
                this.isSyncing = false;
                return;
              } catch (secondRetryError: any) {
                // Si el segundo retry también falla, continuar con el manejo de error
                if (secondRetryError?.status === 401) {
                  error = secondRetryError;
                } else {
                  // Si es otro tipo de error, lanzarlo
                  this.isSyncing = false;
                  throw secondRetryError;
                }
              }
            } else if (retryError?.status === 401) {
              error = retryError;
            } else {
              // Si es otro tipo de error, lanzarlo
              this.isSyncing = false;
              throw retryError;
            }
          }
        }

        // Si no es un retry de login manual, intentar refrescar el token
        if (retryCount > 0 || !this.isManualLogin) {
          try {
            const { data: sessionData } = await this.supabase.auth.getSession();
            if (sessionData?.session) {
              // Intentar refrescar el token
              const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
              if (!refreshError && refreshData?.session?.access_token) {
                // Si el refresh fue exitoso, actualizar el token y reintentar
                this.persistToken(refreshData.session.access_token);
                // Reintentar la sincronización una vez más
                this.isSyncing = false;
                await new Promise(resolve => setTimeout(resolve, 200));
                // Reintentar - si el retry es exitoso, no lanzar error
                try {
                  await this.syncDomainUser(retryCount + 1);
                  // Si el retry fue exitoso, salir sin error
                  this.isSyncing = false;
                  return;
                } catch (retryError: any) {
                  // Si el retry también falla, continuar con el manejo de error
                  // pero solo si realmente falló (no es un 401 que se resolvió)
                  if (retryError?.status === 401) {
                    error = retryError;
                  } else {
                    // Si es otro tipo de error, lanzarlo
                    this.isSyncing = false;
                    throw retryError;
                  }
                }
              }
            }
          } catch (refreshAttemptError) {
            // Si el intento de refresh falla, continuar con el cierre de sesión
            console.debug('Error al intentar refrescar token:', refreshAttemptError);
          }
        }

        // Si llegamos aquí, el token es inválido y no se pudo refrescar
        // Limpiar inmediatamente el estado local (signal)
        this._currentUser.set(null);
        
        // Limpiar storage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(this.tokenStorageKey);
          sessionStorage.removeItem(this.userStorageKey);
        }
        
        // Cerrar sesión en Supabase también para evitar loops
        try {
          await this.supabase.auth.signOut();
        } catch (signOutError) {
          // Ignorar errores al cerrar sesión en Supabase
          console.debug('Error al cerrar sesión en Supabase:', signOutError);
        }
        
        // Forzar navegación al login si no estamos ya ahí
        const currentUrl = this.router.url;
        if (!currentUrl.startsWith('/login') && !currentUrl.startsWith('/recuperar-clave')) {
          // Usar navigateByUrl para forzar la navegación incluso si hay guards
          await this.router.navigateByUrl('/login', { skipLocationChange: false });
        }
      }
      
      // Solo lanzar error si no fue un retry exitoso
      throw new Error('No se pudo validar la sesión con el servidor.');
    } finally {
      this.isSyncing = false;
    }
  }

  private async tryRestoreSession(): Promise<number> {
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 400; // 400ms mínimo para mostrar el spinner y evitar flashes
    
    try {
      const { data, error } = await this.supabase.auth.getSession();

      // Si hay error o no hay sesión, limpiar estado local
      if (error || !data.session?.access_token) {
        this.clearSession();
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        return remaining;
      }

      // Validar que el token no esté expirado
      const token = data.session.access_token;
      try {
        // Decodificar el token JWT para verificar expiración (sin verificar firma)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        // Si el token está expirado, limpiar sesión
        if (payload.exp && payload.exp < now) {
          console.log('Token expirado, limpiando sesión');
          this.clearSession();
          // Cerrar sesión en Supabase también
          try {
            await this.supabase.auth.signOut();
            this.forceClearSupabaseStorage();
          } catch (signOutError) {
            console.error('Error al cerrar sesión expirada:', signOutError);
          }
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
          return remaining;
        }
      } catch (parseError) {
        // Si no se puede parsear el token, es inválido
        console.error('Token inválido, limpiando sesión:', parseError);
        this.clearSession();
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        return remaining;
      }

      // Si el token es válido, persistirlo y sincronizar
      this.persistToken(token);
      // Solo sincronizar si no estamos ya sincronizando
      if (!this.isSyncing) {
        await this.syncDomainUser();
      }
    } catch (error) {
      // Si hay error al obtener la sesión, limpiar estado local
      console.error('Error al restaurar sesión:', error);
      this.clearSession();
    }
    
    // Calcular tiempo transcurrido y retornar el delay restante necesario
    // Esto se ejecuta después del try-catch, antes de retornar
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
    return remaining;
  }

  finishRecovery(): void {
    this._isRecovering.set(false);
  }

  async logout(options?: { redirect?: boolean; showSpinner?: boolean }): Promise<void> {
    const redirect = options?.redirect ?? true;
    const showSpinner = options?.showSpinner ?? true;

    // Evitar la redirección automática del handler SIGNED_OUT si la llamada
    // explícitamente pide no redirigir (p.ej., después de resetear contraseña).
    this.skipSignOutRedirect = !redirect;

    if (showSpinner) {
      // Mostrar spinner inmediatamente para la animación de salida
      this.spinnerService.show();

      // Pequeño delay para que el spinner aparezca suavemente
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Primero limpiar el estado local para evitar que otras pestañas restauren la sesión
    this.clearSession();
    
    // Luego cerrar sesión en Supabase y esperar a que se complete
    // Esto asegura que localStorage de Supabase también se limpie
    try {
      await this.supabase.auth.signOut();
    } catch (error) {
      // Si falla el signOut, forzar limpieza manual de localStorage de Supabase
      console.error('Error al cerrar sesión en Supabase:', error);
      this.forceClearSupabaseStorage();
    }
    
    // Asegurar que localStorage de Supabase esté limpio
    this.forceClearSupabaseStorage();
    
    if (showSpinner) {
      // Esperar un poco para que la animación de salida se complete
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    if (redirect) {
      // Navegar al login (el login tiene sus propias animaciones de entrada)
      await this.router.navigate(['/login']);
    }

    if (showSpinner) {
      // Ocultar spinner después de que el login comience a aparecer
      setTimeout(() => {
        this.spinnerService.hide();
      }, 300);
    }
  }

  get token(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.tokenStorageKey);
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this._currentUser();
  }

  private persistUser(user: AuthUser | null): void {
    this._currentUser.set(user);
    if (typeof window === 'undefined') {
      return;
    }

    if (user) {
      sessionStorage.setItem(this.userStorageKey, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(this.userStorageKey);
    }
  }

  private hydrateUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = sessionStorage.getItem(this.userStorageKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      sessionStorage.removeItem(this.userStorageKey);
      return null;
    }
  }

  private persistToken(token: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.tokenStorageKey, token);
  }

  private clearSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.userStorageKey);
    this._currentUser.set(null);
  }

  /**
   * Fuerza la limpieza de todas las claves de Supabase en localStorage.
   * Esto asegura que la sesión no se restaure en nuevas pestañas después del logout.
   */
  private forceClearSupabaseStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Limpiar todas las claves relacionadas con Supabase en localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error al limpiar localStorage de Supabase:', error);
    }
  }
}

