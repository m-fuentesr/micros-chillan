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

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    this.supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth event:', event, session);

      switch (event) {
        case 'TOKEN_REFRESHED':
        case 'SIGNED_IN':
          if (session?.access_token) {
            this.persistToken(session.access_token);
            await this.syncDomainUser();
          }
          break;

        case 'SIGNED_OUT':
          this.clearSession();
          await this.router.navigate(['/login']);
          break;

        case 'USER_UPDATED':
          await this.syncDomainUser();
          break;

        default:
          break;
      }
    });

    this.tryRestoreSession();
  }

  async loginWithCredentials(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new Error('Credenciales inválidas');
    }

    const accessToken = data.session.access_token;
    this.persistToken(accessToken);

    await this.syncDomainUser();

    const user = this.currentUser();
    if (user) {
      await this.router.navigate(
        user.role === 'admin' ? ['/dashboard'] : ['/trabajador']
      );
    }
  }

  private async syncDomainUser(): Promise<void> {
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
    } catch {
      this.clearSession();
      throw new Error('No se pudo validar la sesión con el servidor.');
    }
  }

  private async tryRestoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();

    if (data.session?.access_token) {
      this.persistToken(data.session.access_token);
      await this.syncDomainUser();
    }
  }
  /**
   * Accesos directos de DEV: usan cuentas reales de Supabase.
   */
  async loginAsAdminMock(): Promise<void> {
    return this.loginWithCredentials('maj.fuentes@duocuc.cl', 'password');
  }

  async loginAsWorkerMock(): Promise<void> {
    return this.loginWithCredentials('nelopi8088@moondyal.com', 'password');
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

