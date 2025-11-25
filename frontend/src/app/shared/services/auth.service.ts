import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, UserRole } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'auth_user';
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthUser | null>(this.hydrateUser());
  readonly currentUser = this._currentUser;

  loginWithCredentials(email: string, password: string): void {
    // Lógica temporal: usa el correo para inferir rol hasta integrar Supabase
    const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'worker';
    const user: AuthUser = {
      id: `mock-${role}`,
      email,
      displayName: role === 'admin' ? 'Administrador' : 'Trabajador',
      role,
    };

    this.persistUser(user);
    this.router.navigate(role === 'admin' ? ['/dashboard'] : ['/trabajador']);
  }

  loginAsAdminMock(): void {
    const user: AuthUser = {
      id: 'mock-admin',
      email: 'admin@demo.local',
      displayName: 'Administrador Demo',
      role: 'admin',
    };
    this.persistUser(user);
    this.router.navigate(['/dashboard']);
  }

  loginAsWorkerMock(): void {
    const user: AuthUser = {
      id: 'mock-worker',
      email: 'worker@demo.local',
      displayName: 'Trabajador Demo',
      role: 'worker',
    };
    this.persistUser(user);
    this.router.navigate(['/trabajador']);
  }

  logout(): void {
    this.persistUser(null);
    this.router.navigate(['/login']);
  }

  private persistUser(user: AuthUser | null): void {
    this._currentUser.set(user);
    if (typeof window === 'undefined') {
      return;
    }

    if (user) {
      sessionStorage.setItem(this.storageKey, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  private hydrateUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }
}

