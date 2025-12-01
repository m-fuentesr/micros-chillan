import { Component, inject, ChangeDetectionStrategy, effect, signal, } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex flex-col lg:flex-row w-full bg-base-200 lg:bg-base-100 relative"
    >
      <!-- Header móvil -->
      <div
        class="lg:hidden absolute top-0 left-0 w-full h-60 bg-primary rounded-b-[3rem] overflow-hidden z-0"
      >
        <div
          class="absolute -top-20 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"
        ></div>
        <div
          class="absolute bottom-6 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"
        ></div>
        <div
          class="flex flex-col items-center justify-center h-full pb-3 text-primary-content"
        >
          <div
            class="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center font-black text-xl shadow-lg mb-1"
          >
            GF
          </div>
          <h2 class="text-xl font-bold tracking-tight">Gestor de Flotas</h2>
        </div>
      </div>

      <!-- Panel de marca desktop -->
      <div
        class="hidden lg:flex w-1/2 bg-primary text-primary-content relative flex-col justify-between p-16 overflow-hidden"
      >
        <div
          class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl opacity-20 pointer-events-none"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl opacity-20 pointer-events-none"
        ></div>

        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-8">
            <div
              class="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center font-black text-xl shadow-lg"
            >
              GF
            </div>
            <span class="text-2xl font-bold tracking-tight"
              >Gestor de Flotas</span
            >
          </div>
          <h2 class="text-4xl font-bold leading-tight max-w-md">
            Sistema integral de control de operaciones
          </h2>
          <p class="mt-4 text-lg opacity-90 max-w-sm">
            Acceso exclusivo para personal autorizado. Gestiona usuarios,
            mantenimiento y reportes en tiempo real.
          </p>
        </div>

        <div
          class="relative z-10 flex justify-between items-end text-sm opacity-70"
        >
          <div>
            <p>
              Estado del Sistema:
              <span class="text-success font-bold">● Operativo</span>
            </p>
            <p>Soporte TI: techsolutions@soporte.cl</p>
          </div>
          <p>© 2025 Empresa de Transportes</p>
        </div>
      </div>

      <!-- Panel formulario -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 z-10">
        <div class="w-full max-w-md bg-base-100 rounded-2xl shadow-xl lg:shadow-none p-6 sm:p-8 mt-[180px] sm:mt-[200px] lg:mt-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div class="text-left mb-8 space-y-2 border-l-4 border-l-primary pl-4">
            <p class="text-xs uppercase tracking-[0.35em] text-base-content/50 font-bold">Acceso corporativo</p>
            <h1 class="text-2xl lg:text-4xl font-bold text-base-content">Iniciar sesión</h1>
            <p class="text-base-content/60 text-sm italic">Ingresa tu RUT o correo corporativo.</p>
          </div>

          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="space-y-5"
          >
            <div class="form-control">
              <label class="label pt-0">
            <span class="label-text font-bold">Usuario</span>
              </label>
              <label
                class="input input-bordered flex items-center gap-2 focus-within:input-primary transition-colors h-12"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  class="w-4 h-4 opacity-70"
                >
                  <path
                    d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"
                  />
                </svg>
                <input
                  type="text"
                  class="grow"
                  placeholder="ejemplo@empresa.com"
                  formControlName="email"
                  required
                />
              </label>
            </div>

            <div class="form-control">
              <label class="label pt-0">
                <span class="label-text font-bold">Contraseña</span>
              </label>
              <label
                class="input input-bordered flex items-center gap-2 focus-within:input-primary transition-colors h-12"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  class="w-4 h-4 opacity-70"
                >
                  <path
                    fill-rule="evenodd"
                    d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <input
                  type="password"
                  class="grow"
                  placeholder="••••••••"
                  formControlName="password"
                  required
                />
              </label>
              <div class="flex justify-end mt-1">
                <a routerLink="/recuperar-clave" class="text-xs link link-primary no-underline hover:underline font-normal italic">Recuperar clave</a>
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block h-12 text-lg shadow-lg shadow-primary/20"
              [disabled]="loginForm.invalid || loading()"
            >
              <span *ngIf="!loading()">Ingresar al sistema</span>
              <span *ngIf="loading()" class="loading loading-spinner"></span>
            </button>

            <p
              *ngIf="error()"
              class="mt-2 text-sm text-error text-center whitespace-pre-line"
            >
              {{ error() }}
            </p>
          </form>

          <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-base-300"></div>
            </div>
            <div
              class="relative flex justify-center text-xs uppercase tracking-wider font-bold text-base-content/50"
            >
              <span class="px-2 bg-base-100">Accesos directos (Dev)</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="btn btn-outline border-base-300 hover:bg-base-200 hover:border-base-300 hover:text-base-content h-12 flex flex-col gap-0 leading-tight py-1"
              (click)="loginAsAdmin()"
            >
              <span class="font-bold">Admin</span>
              <span class="text-[10px] font-normal opacity-60">Escritorio</span>
            </button>
            <button
              type="button"
              class="btn btn-outline border-base-300 hover:bg-base-200 hover:border-base-300 hover:text-base-content h-12 flex flex-col gap-0 leading-tight py-1"
              (click)="loginAsWorker()"
            >
              <span class="font-bold">Operario</span>
              <span class="text-[10px] font-normal opacity-60">Móvil / Ruta</span>
            </button>
          </div>

          <div class="mt-8 text-center">
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/50 text-xs text-base-content/60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-3 h-3"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                  clip-rule="evenodd"
                />
              </svg>
              ¿Problemas de acceso? Contacta a RRHH
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['ejemplo@correo.com', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Si ya hay una sesión activa, redirige automáticamente
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        return;
      }

      const target = user.role === 'admin' ? '/dashboard' : '/trabajador';
      if (this.router.url !== target) {
        queueMicrotask(() => this.router.navigate([target]));
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.loginWithCredentials(email, password);
    } catch (err) {
      this.error.set(
        'No se pudo iniciar sesión.\nVerifica tus credenciales o inténtalo nuevamente.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async loginAsAdmin() {
    this.error.set(null);
    this.loading.set(true);

    try {
      await this.auth.loginAsAdminMock();
    } catch {
      this.error.set('No se pudo iniciar sesión (demo admin).');
    } finally {
      this.loading.set(false);
    }
  }


  async loginAsWorker() {
    this.error.set(null);
    this.loading.set(true);

    try {
      await this.auth.loginAsWorkerMock();
    } catch {
      this.error.set('No se pudo iniciar sesión (demo trabajador).');
    } finally {
      this.loading.set(false);
    }
  }

}
