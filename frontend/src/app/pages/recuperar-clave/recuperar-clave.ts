import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row w-full bg-base-200 lg:bg-base-100 relative">
      <!-- Header móvil -->
      <div class="lg:hidden absolute top-0 left-0 w-full h-[240px] bg-primary rounded-b-[3rem] overflow-hidden z-0">
        <div class="absolute -top-20 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute bottom-6 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div class="flex flex-col items-center justify-center h-full pb-6 text-primary-content">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 text-white">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h2 class="text-lg font-bold tracking-tight opacity-90">Recuperación de acceso</h2>
        </div>
      </div>

      <!-- Panel branding desktop -->
      <div class="hidden lg:flex w-1/2 bg-primary text-primary-content relative flex-col justify-between p-16 overflow-hidden">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl opacity-20 pointer-events-none"></div>
        <div class="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl opacity-20 pointer-events-none"></div>

        <div class="relative z-10">
          <a routerLink="/login" class="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity w-fit">
            <div class="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center font-black text-xl shadow-lg">GF</div>
            <span class="text-2xl font-bold tracking-tight">Gestor de Flotas</span>
          </a>
          <h2 class="text-4xl font-bold leading-tight max-w-md">
            Seguridad ante todo.
          </h2>
          <p class="mt-4 text-lg opacity-90 max-w-sm">
            Restablece tu acceso de forma segura. Si necesitas ayuda, soporte TI está disponible 24/7.
          </p>
        </div>

        <div class="relative z-10 text-sm opacity-70">
          <p>© 2025 Gestor de Flotas</p>
        </div>
      </div>

      <!-- Panel formulario -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 z-10">
        <div class="w-full max-w-md bg-base-100 rounded-2xl shadow-xl lg:shadow-none p-6 sm:p-8 mt-[180px] sm:mt-[200px] lg:mt-0 relative overflow-hidden">
          <a routerLink="/login" class="absolute top-6 left-6 btn btn-circle btn-ghost btn-sm text-base-content/60 hover:bg-base-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </a>

          @if (currentStep() === 'request') {
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 lg:pt-2">
              <div class="text-left mb-8 pl-4 border-l-4 border-l-primary">
                <div class="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-base-content">¿Olvidaste tu clave?</h1>
                <p class="text-base-content/60 mt-2 text-sm px-2">
                  Ingresa tu correo corporativo y te enviaremos las instrucciones para restablecerla.
                </p>
              </div>

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <div class="form-control">
                  <label class="label pt-0">
                    <span class="label-text font-bold">Correo electrónico</span>
                  </label>
                  <label class="input input-bordered flex items-center gap-2 focus-within:input-primary transition-colors h-12">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70">
                      <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                      <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                    </svg>
                    <input
                      type="email"
                      class="grow"
                      placeholder="usuario@empresa.com"
                      formControlName="email"
                      required
                    />
                  </label>
                  @if (form.controls.email.invalid && form.controls.email.touched) {
                    <span class="text-error text-xs mt-1">Ingresa un correo válido.</span>
                  }
                </div>

                <button type="submit" class="btn btn-primary btn-block h-12 text-lg shadow-lg shadow-primary/20" [disabled]="form.invalid">
                  Enviar instrucciones
                </button>
              </form>
            </div>
          }

          @if (currentStep() === 'success') {
            <div class="text-left animate-in zoom-in duration-300 py-10 pl-4 border-l-4 border-l-primary">
              <div class="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold mb-2">¡Revisa tu correo!</h2>
              <p class="text-base-content/60 text-sm mb-8 px-4">
                Enviamos un enlace de recuperación a <br />
                <span class="font-bold text-base-content">{{ submittedEmail() }}</span>
              </p>

              <div class="space-y-3">
                <a routerLink="/login" class="btn btn-outline btn-block h-12 border-base-300 hover:bg-base-200 hover:text-base-content">
                  Volver al inicio de sesión
                </a>
                <button class="btn btn-ghost btn-sm text-base-content/50 font-normal" (click)="currentStep.set('request')">
                  Probar con otro correo
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarClave {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  currentStep = signal<'request' | 'success'>('request');
  submittedEmail = signal('');

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email ?? '';
    this.submittedEmail.set(email);
    this.currentStep.set('success');

    // Aquí se integrará la llamada real a Supabase en futuras versiones.
  }
}

