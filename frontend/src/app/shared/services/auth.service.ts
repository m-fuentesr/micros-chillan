import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

    let me: MeResponse;

    try {
      me = await firstValueFrom(
        this.http.get<MeResponse>(`${API_BASE_URL}/api/auth/me`)
      );
    } catch (e) {
      // Limpia sesión — token puede ser inválido o backend desconectado
      this.clearSession();
      throw new Error('No se pudo validar la sesión con el servidor.');
    }

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

    // Navegación según rol
    await this.router.navigate(role === 'admin' ? ['/dashboard'] : ['/trabajador']);
  }


  /**
   * Accesos directos de DEV: usan cuentas reales de Supabase.
   * Configura estos correos/contraseñas en tu proyecto Supabase.
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

  // Persistencia
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

