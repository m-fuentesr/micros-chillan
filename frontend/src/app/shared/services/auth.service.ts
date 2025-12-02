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

  private supabase: SupabaseClient;

  private readonly _currentUser = signal<AuthUser | null>(this.hydrateUser());
  readonly currentUser = this._currentUser;

  // Flag para prevenir múltiples llamadas simultáneas a syncDomainUser
  private isSyncing = false;
  // Flag para prevenir múltiples inicializaciones
  private isInitialized = false;
  // Flag para indicar que estamos en proceso de login manual
  private isManualLogin = false;

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
      this.tryRestoreSession();
      this.isInitialized = true;
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
        throw new Error('Credenciales inválidas');
      }

      const accessToken = data.session.access_token;
      this.persistToken(accessToken);

      // Esperar un momento para que el evento SIGNED_IN se procese
      // y luego sincronizar con el backend
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Sincronizar con el backend (el evento SIGNED_IN ya actualizó el token)
      await this.syncDomainUser();

      const user = this.currentUser();
      if (!user) {
        // Si no hay usuario después de sincronizar, algo salió mal
        throw new Error('No se pudo obtener la información del usuario');
      }
      // NO navegar automáticamente aquí - el componente Login manejará la navegación
      // después de la animación de transición
    } catch (error) {
      this.isManualLogin = false;
      throw error;
    } finally {
      // Asegurar que el flag se resetee incluso si hay un error
      setTimeout(() => {
        this.isManualLogin = false;
      }, 500);
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
          await new Promise(resolve => setTimeout(resolve, 300));
          // Reintentar - si el retry es exitoso, no lanzar error
          try {
            await this.syncDomainUser(1);
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

  private async tryRestoreSession(): Promise<void> {
    try {
      const { data } = await this.supabase.auth.getSession();

      if (data.session?.access_token) {
        this.persistToken(data.session.access_token);
        // Solo sincronizar si no estamos ya sincronizando
        if (!this.isSyncing) {
          await this.syncDomainUser();
        }
      } else {
        // Si no hay sesión, limpiar estado local
        this.clearSession();
      }
    } catch (error) {
      // Si hay error al obtener la sesión, limpiar estado local
      console.error('Error al restaurar sesión:', error);
      this.clearSession();
    }
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.clearSession();
    await this.router.navigate(['/login']);
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
}

