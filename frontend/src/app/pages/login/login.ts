import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="h-dvh bg-base-200 flex items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-2xl">
        <div class="card-body">
          <!-- Icono superior -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <!-- Título y subtítulo -->
          <h1 class="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
          <p class="text-center text-base-content/70 mb-6">Accede al sistema para gestionar tu flota</p>

          <!-- Formulario -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Campo Correo electrónico -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Correo electrónico</span>
              </label>
              <input 
                type="email" 
                placeholder="ejemplo@correo.com" 
                class="input input-bordered w-full" 
                formControlName="email"
                required
              />
            </div>

            <!-- Campo Contraseña -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Contraseña</span>
              </label>
              <input 
                type="password" 
                placeholder="********" 
                class="input input-bordered w-full" 
                formControlName="password"
                required
              />
            </div>

            <!-- Botón Iniciar Sesión -->
            <div class="form-control mt-6">
              <button type="submit" class="btn btn-primary btn-block">Iniciar Sesión</button>
            </div>
          </form>

          <!-- Separador -->
          <div class="divider">
            <span class="text-sm text-base-content/70">o acceder rápidamente</span>
          </div>

          <!-- Botones de acceso rápido -->
          <div class="space-y-2">
            <button class="btn btn-outline btn-block" (click)="loginAsAdmin()">
              Entrar como Administrador
            </button>
            <button class="btn btn-outline btn-block" (click)="loginAsWorker()">
              Entrar como Trabajador
            </button>
          </div>

          <!-- Enlaces inferiores -->
          <div class="flex justify-between items-center mt-6 text-sm">
            <a routerLink="/centro-ayuda" class="link link-primary">Recuperar contraseña</a>
            <a routerLink="/centro-ayuda" class="link link-primary">¿Necesitas ayuda?</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['ejemplo@correo.com', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      console.log('Login attempt:', { email, password });
      // Aquí iría la lógica de autenticación
      // Por defecto, redirigimos al dashboard de administrador
      this.router.navigate(['/dashboard']);
    } else {
      console.log('Formulario inválido');
    }
  }

  loginAsAdmin() {
    console.log('Login como Administrador');
    // Redirigir al dashboard de administrador
    this.router.navigate(['/dashboard']);
  }

  loginAsWorker() {
    console.log('Login como Trabajador');
    // Redirigir a la página de trabajador
    this.router.navigate(['/trabajador']);
  }
}
