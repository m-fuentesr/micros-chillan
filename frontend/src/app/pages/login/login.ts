import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation, effect, signal, } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { TransitionService } from '../../shared/services/transition.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex flex-col lg:flex-row w-full bg-base-200 lg:bg-base-100 relative"
      [class.ripple-active]="expanding()"
      [class.login-root-fade-out]="expanding()"
    >
      @if (!expanding()) {
      <!-- Header móvil -->
      <div
        class="lg:hidden absolute top-0 left-0 w-full h-60 bg-primary rounded-b-[3rem] overflow-hidden z-0"
      >
        <!-- Patrón de Grilla Tech (móvil) -->
        <div class="absolute inset-0 bg-grid-pattern z-0 pointer-events-none"></div>

        <!-- Blobs con animación orgánica -->
        <div
          class="absolute -top-20 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-blob-1"
        ></div>
        <div
          class="absolute bottom-6 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-blob-2"
        ></div>

        <!-- Contenido con animación de entrada -->
        <div
          class="flex flex-col items-center justify-center h-full pb-3 text-primary-content relative z-10 animate-entrance-fade-up delay-100"
        >
          <div
            class="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center font-black text-xl shadow-lg mb-1 animate-entrance-zoom delay-200"
          >
            GF
          </div>
          <h2 class="text-xl font-bold tracking-tight animate-entrance-fade-up delay-300">Gestor de Flotas</h2>
        </div>
      </div>

      <!-- Panel de marca desktop -->
      <div
        class="hidden lg:flex w-1/2 bg-primary text-primary-content relative flex-col justify-between p-16 overflow-hidden transition-transform duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] login-leaving"
        [class.login-leaving-active]="leaving()"
      >
        <!-- Patrón de Grilla Tech -->
        <div class="absolute inset-0 bg-grid-pattern z-0 pointer-events-none"></div>

        <!-- Blobs con animación orgánica -->
        <div
          class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl opacity-20 pointer-events-none animate-blob-1"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl opacity-20 pointer-events-none animate-blob-2"
        ></div>

        <!-- Contenido con entrada desde la izquierda -->
        <div class="relative z-10 animate-entrance-fade-left delay-100">
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
          class="relative z-10 flex justify-between items-end text-sm opacity-70 animate-entrance-fade-left opacity-preserved delay-200"
        >
          <div>
            <p class="flex items-center gap-1.5">
              <span>Estado del Sistema:</span>
              <span class="text-success font-bold inline-flex items-center gap-1.5">
                <span class="status-dot opacity-100"></span>
                <span>Operativo</span>
              </span>
            </p>
            <p>Soporte TI: techsolutions@soporte.cl</p>
          </div>
          <p>© 2025 Empresa de Transportes</p>
        </div>
      </div>

      <!-- Panel formulario -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 z-10 relative">
        <div
          class="w-full max-w-md bg-base-100 rounded-2xl shadow-xl lg:shadow-none p-6 sm:p-8 mt-[180px] sm:mt-[200px] lg:mt-0 animate-entrance-zoom delay-mobile-400 delay-100 login-leaving"
          [class.login-leaving-active]="leaving()"
        >
          <div class="text-left mb-8 space-y-2 border-l-4 border-l-primary pl-4 animate-entrance-fade-up delay-mobile-500 delay-200">
            <p class="text-xs uppercase tracking-[0.35em] text-base-content/50 font-bold">Acceso corporativo</p>
            <h1 class="text-2xl lg:text-4xl font-bold text-base-content">Iniciar sesión</h1>
            <p class="text-base-content/60 text-sm italic">Ingresa tu RUT o correo corporativo.</p>
          </div>

          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6 mt-2 transition-all"
            [class.animate-shake]="shakeError()"
          >
            <!-- Input Email Premium -->
            <div class="form-control animate-entrance-fade-up delay-mobile-600 delay-300">
              <label class="label pb-2.5">
                <span class="label-text font-semibold text-base-content text-sm tracking-wide">Usuario Corporativo</span>
              </label>
              <div class="relative premium-input-wrapper" 
                   [class.premium-input-error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                <div class="premium-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-5 h-5">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="email"
                  class="premium-input w-full"
                  placeholder="Correo electrónico ..." 
                  formControlName="email"
                  autocomplete="email"
                />
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <div class="absolute right-4 top-1/2 -translate-y-1/2 text-error animate-scale-up z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                    </svg>
                  </div>
                }
              </div>
            </div>

            <!-- Input Password Premium -->
            <div class="form-control animate-entrance-fade-up delay-mobile-600 delay-300">
              <label class="label pb-2.5">
                <span class="label-text font-semibold text-base-content text-sm tracking-wide">Contraseña</span>
              </label>
              <div class="relative premium-input-wrapper"
                   [class.premium-input-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <div class="premium-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-5 h-5">
                    <path fill-rule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="password"
                  class="premium-input w-full pr-12" 
                  placeholder="Contraseña ..."
                  formControlName="password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-all duration-200 hover:scale-110 active:scale-95 z-10 rounded-md p-1 hover:bg-base-200/50"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  @if (!showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  }
                </button>
              </div>
              <div class="flex justify-end mt-3 px-1">
                <a routerLink="/recuperar-clave" class="text-xs font-medium text-primary/80 hover:text-primary transition-colors">¿Olvidaste tu clave?</a>
              </div>
            </div>

            <div class="pt-2 animate-entrance-fade-up delay-mobile-700 delay-400 relative overflow-hidden">
              <!-- Partículas de Éxito -->
              @if (loginSuccess()) {
                <div class="success-particles">
                  <div class="particle particle-1"></div>
                  <div class="particle particle-2"></div>
                  <div class="particle particle-3"></div>
                  <div class="particle particle-4"></div>
                  <div class="particle particle-5"></div>
                </div>
              }
              
              <button
                type="submit"
                #submitButton
                class="button-morph-premium"
                [class.state-idle]="!loading() && !loginSuccess() && !expanding()"
                [class.state-loading]="loading() && !loginSuccess() && !expanding()"
                [class.state-success]="loginSuccess() && !expanding()"
                [class.state-expanding]="expanding()"
                [disabled]="loginForm.invalid || loading() || expanding()"
              >
                <!-- Capa de profundidad (Neumorphism sutil) -->
                <div class="button-depth-layer"></div>
                
                <!-- Contenido del botón -->
                <span class="button-content-wrapper relative z-10">
                  @if (!loading() && !loginSuccess()) {
                    <span class="button-text-premium">
                      <span class="button-text-main">Ingresar</span>
                      <span class="button-text-glow">Ingresar</span>
                    </span>
                  }
                  @if (loading() && !loginSuccess()) {
                    <div class="spinner-dots-orbit">
                      <div class="orbit-dot dot-1"></div>
                      <div class="orbit-dot dot-2"></div>
                      <div class="orbit-dot dot-3"></div>
                    </div>
                  }
                  @if (loginSuccess()) {
                    <div class="checkmark-premium-wrapper">
                      <svg class="checkmark-premium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <path class="checkmark-path" d="M20 6L9 17l-5-5"/>
                  </svg>
                      <div class="checkmark-ripple"></div>
                    </div>
                  }
                </span>
              </button>
            </div>

            <p
              *ngIf="error()"
              class="mt-4 text-sm font-medium text-error text-center whitespace-pre-line animate-pulse"
            >
              {{ error() }}
            </p>
          </form>

          <div class="mt-8 text-center animate-entrance-fade-up delay-mobile-1000 delay-700">
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
      } <!-- fin @if !expanding -->
    </div>
  `,
  styles: [
    `
    /* Animación de "Respiración" para los Blobs - Optimizada para GPU */
    @keyframes drift-slow {
      0% {
        transform: translate3d(0, 0, 0) scale(1);
      }
      33% {
        transform: translate3d(30px, -50px, 0) scale(1.1);
      }
      66% {
        transform: translate3d(-20px, 20px, 0) scale(0.9);
      }
      100% {
        transform: translate3d(0, 0, 0) scale(1);
      }
    }

    @keyframes drift-medium {
      0% {
        transform: translate3d(0, 0, 0) scale(1);
      }
      33% {
        transform: translate3d(-30px, 40px, 0) scale(1.2);
      }
      66% {
        transform: translate3d(20px, -30px, 0) scale(0.8);
      }
      100% {
        transform: translate3d(0, 0, 0) scale(1);
      }
    }

    .animate-blob-1 {
      animation: drift-slow 15s infinite ease-in-out alternate;
      will-change: transform;
    }

    .animate-blob-2 {
      animation: drift-medium 12s infinite ease-in-out alternate-reverse;
      will-change: transform;
    }

    /* Patrón de Grilla Sutil (Tech Vibe) */
    .bg-grid-pattern {
      background-size: 40px 40px;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    }

    /* Animaciones de Entrada Escalonada */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translate3d(0, 16px, 0);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }

    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translate3d(-32px, 0, 0);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }

    /* Animación solo de movimiento para elementos que deben mantener opacidad */
    @keyframes slideInLeftOnly {
      from {
        transform: translate3d(-32px, 0, 0);
      }
      to {
        transform: translate3d(0, 0, 0);
      }
    }

    @keyframes zoomIn {
      from {
        opacity: 0;
        transform: scale3d(0.95, 0.95, 1);
      }
      to {
        opacity: 1;
        transform: scale3d(1, 1, 1);
      }
    }

    .animate-entrance-fade-up {
      animation: fadeInUp 700ms cubic-bezier(0.25, 1, 0.5, 1) backwards;
    }

    .animate-entrance-fade-left {
      animation: fadeInLeft 700ms cubic-bezier(0.25, 1, 0.5, 1) backwards;
    }

    /* Para el footer que debe mantener opacidad */
    .animate-entrance-fade-left.opacity-preserved {
      animation: slideInLeftOnly 700ms cubic-bezier(0.25, 1, 0.5, 1) backwards;
      opacity: 0.7 !important;
    }

    /* Efecto Radar - Punto estático con onda expansiva */
    .status-dot {
      position: relative;
      display: inline-block;
      width: 12px;
      height: 12px;
      min-width: 12px;
      min-height: 12px;
      background-color: #22c55e; /* Success Green directo para asegurar visibilidad */
      border-radius: 50%;
      flex-shrink: 0;
      z-index: 1; /* Asegurar que esté por encima de la onda */
      opacity: 1 !important; /* Forzar opacidad completa */
      vertical-align: middle; /* Alineación vertical con el texto */
    }

    /* La onda expansiva detrás del punto - Centrada perfectamente */
    .status-dot::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #22c55e;
      z-index: -1;
      transform: translate(-50%, -50%) scale(1);
      transform-origin: center center;
      animation: radarWave 2s infinite cubic-bezier(0, 0, 0.2, 1);
    }

    @keyframes radarWave {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.75;
      }
      100% {
        transform: translate(-50%, -50%) scale(2.5);
        opacity: 0;
      }
    }

    /* Asegurar que el footer mantenga su opacidad después de la animación */
    .animate-entrance-fade-left .opacity-70 {
      animation-fill-mode: forwards;
    }


    .animate-entrance-zoom {
      animation: zoomIn 500ms cubic-bezier(0.25, 1, 0.5, 1) backwards;
    }

    .delay-100 {
      animation-delay: 100ms;
    }

    .delay-200 {
      animation-delay: 200ms;
    }

    .delay-300 {
      animation-delay: 300ms;
    }

    .delay-400 {
      animation-delay: 400ms;
    }

    .delay-500 {
      animation-delay: 500ms;
    }

    .delay-700 {
      animation-delay: 700ms;
    }

    /* Delays específicos para móvil - El formulario empieza después del header */
    /* En móvil, el formulario empieza después de que termine el header (300ms + buffer) */
    @media (max-width: 1023px) {
      .delay-mobile-400 {
        animation-delay: 400ms !important;
      }

      .delay-mobile-500 {
        animation-delay: 500ms !important;
      }

      .delay-mobile-600 {
        animation-delay: 600ms !important;
      }

      .delay-mobile-700 {
        animation-delay: 700ms !important;
      }

      .delay-mobile-800 {
        animation-delay: 800ms !important;
      }

      .delay-mobile-1000 {
        animation-delay: 1000ms !important;
      }
    }

    /* En desktop, los delays móviles no se aplican */
    @media (min-width: 1024px) {
      .delay-mobile-400,
      .delay-mobile-500,
      .delay-mobile-600,
      .delay-mobile-700,
      .delay-mobile-800,
      .delay-mobile-1000 {
        animation-delay: inherit !important;
      }
    }

    /* ============================================
       BUTTON MORPH PREMIUM - Arquitectura de Élite
       Diseñado con amor por el detalle y performance
       ============================================ */
    
    /* Variables CSS para control fino */
    :host {
      --button-ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
      --button-ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      --button-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
      --button-ease-premium: cubic-bezier(0.4, 0, 0.2, 1);
      --button-transition-fast: 200ms;
      --button-transition-normal: 300ms;
      --button-transition-slow: 500ms;
    }

    /* Contenedor del botón */
    .pt-2.relative {
      position: relative;
      isolation: isolate;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: visible; /* Permitir que los efectos ripple se expandan */
    }
    
    /* Asegurar que el contenedor del formulario no muestre efectos fuera */
    form {
      overflow: hidden;
      position: relative;
    }

    /* ============================================
       BOTÓN PREMIUM - Base Arquitectónica
       ============================================ */
    
    .button-morph-premium {
      position: relative;
      z-index: 10;
      transform-origin: center center;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      will-change: transform, width, height, border-radius;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      overflow: hidden; /* Forzar que el contenido respete el border-radius */
      /* Transiciones sincronizadas - border-radius sin transición para cambio instantáneo */
      transition: 
        width var(--button-transition-slow) var(--button-ease-elastic),
        height var(--button-transition-slow) var(--button-ease-elastic),
        background var(--button-transition-slow) var(--button-ease-elastic),
        box-shadow var(--button-transition-slow) var(--button-ease-elastic),
        transform var(--button-transition-fast) var(--button-ease-premium),
        min-width var(--button-transition-slow) var(--button-ease-elastic),
        clip-path 0ms; /* Cambio instantáneo del clip-path */
      /* Border-radius base - se sobrescribe en estados específicos */
      border-radius: 0.75rem;
      /* Clip-path como respaldo para forzar la forma durante la transición */
      clip-path: inset(0 round 0.75rem);
    }

    /* Estado IDLE - Botón ancho con texto */
    .button-morph-premium.state-idle {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
      width: 100%;
      height: 3.5rem;
      min-width: auto;
      border-radius: 0.75rem;
      clip-path: inset(0 round 0.75rem); /* Forzar forma redondeada */
      color: white;
    }
    
    /* Forzar border-radius en el pseudo-elemento también */
    .button-morph-premium.state-idle::before {
      border-radius: 0.75rem;
    }

    .button-morph-premium:disabled {
      opacity: 1; /* Mantener opacidad completa incluso cuando está disabled */
      cursor: not-allowed;
      transform: none !important;
    }

    .button-morph-premium:disabled:hover {
      transform: none !important;
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
    }

    .button-morph-premium.state-idle:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 
        0 0 0 4px rgba(59, 130, 246, 0.15),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .button-morph-premium.state-idle:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      transition-duration: var(--button-transition-fast);
    }

    /* Estado LOADING - Botón se encoge a círculo */
    .button-morph-premium.state-loading {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      width: 3.5rem;
      height: 3.5rem;
      min-width: 3.5rem;
      border-radius: 50%;
      clip-path: circle(50% at center); /* Forzar forma circular */
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
      margin-left: auto;
      margin-right: auto;
      padding: 0;
    }

    /* Estado SUCCESS - Botón verde con check */
    .button-morph-premium.state-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      width: 3.5rem;
      height: 3.5rem;
      min-width: 3.5rem;
      border-radius: 50%;
      clip-path: circle(50% at center); /* Forzar forma circular */
      box-shadow: 
        0 0 0 4px rgba(16, 185, 129, 0.18),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
      margin-left: auto;
      margin-right: auto;
      padding: 0;
      animation: successPulse 750ms cubic-bezier(0.22, 0.61, 0.36, 1);
    }

    @keyframes successPulse {
      0% {
        transform: scale(0.92);
        opacity: 0;
      }
      50% {
        transform: scale(1.06);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Estado EXPANDING - Transición discreta (sin ocupar toda la pantalla)
       El protagonismo de la macro-transición lo tiene el overlay blanco global. */
    .button-morph-premium.state-expanding {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 1) 45%, rgba(241, 245, 249, 1) 100%);
      border-radius: 50%;
      animation: buttonExpandPremium 650ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      box-shadow: 
        0 0 0 0 rgba(15, 23, 42, 0.08),
        inset 0 0 0 0 rgba(255, 255, 255, 0.5);
      padding: 0;
    }

      @keyframes buttonExpandPremium {
      0% {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 
          0 0 0 0 rgba(15, 23, 42, 0.12),
          inset 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      40% {
        border-radius: 50%;
        box-shadow: 
          0 0 0 80px rgba(15, 23, 42, 0.16),
          inset 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      100% {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0.95);
        box-shadow: 
          0 0 0 0 rgba(15, 23, 42, 0),
          inset 0 0 0 0 rgba(255, 255, 255, 0);
      }
    }

    /* ============================================
       CAPAS DE PROFUNDIDAD Y BRILLO
       ============================================ */

    /* Capa de profundidad (Neumorphism sutil) */
    .button-depth-layer {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%,
        rgba(0, 0, 0, 0.05) 100%
      );
      pointer-events: none;
      z-index: 1;
      opacity: 0.6;
    }

    /* ============================================
       CONTENIDO DEL BOTÓN
       ============================================ */

    .button-content-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;
    }

    /* Texto Premium con efecto glow */
    .button-text-premium {
      position: relative;
      display: inline-block;
      transition: 
        opacity var(--button-transition-fast) var(--button-ease-premium),
        transform var(--button-transition-fast) var(--button-ease-premium);
    }

    .button-text-main {
      position: relative;
      z-index: 2;
      color: white;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      display: inline-block;
    }

    .button-text-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      color: white;
      opacity: 0;
      filter: blur(8px);
      z-index: 1;
      transition: opacity var(--button-transition-normal) var(--button-ease-premium);
      pointer-events: none;
    }

    .button-morph-premium.state-idle:hover:not(:disabled) .button-text-glow {
      opacity: 0.6;
    }

    /* Ocultar texto cuando el botón se encoge - Sin efecto de opacidad */
    .button-morph-premium.state-loading .button-text-premium,
    .button-morph-premium.state-success .button-text-premium,
    .button-morph-premium.state-expanding .button-text-premium {
      display: none;
    }

    /* ============================================
       SPINNER PREMIUM - Puntos Orbitantes
       Diseño elegante con efecto de profundidad
       ============================================ */
    
    .spinner-dots-orbit {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
    }

    .orbit-dot {
      position: absolute;
      width: 4px;
      height: 4px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
      animation-fill-mode: both; /* Mantener estado inicial y final */
      will-change: transform;
      /* Centrar el punto en el contenedor (10px, 10px es el centro de un contenedor de 20px) */
      top: 10px;
      left: 10px;
      margin: -2px 0 0 -2px;
      /* Transform origin en el centro del contenedor - relativo al punto */
      transform-origin: 2px 2px;
    }

    .dot-1 {
      animation: orbitRotate1 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 0ms;
      opacity: 1;
      /* Posición inicial explícita - 0 grados */
      transform: rotate(0deg) translateX(8px) rotate(0deg) scale(1);
    }

    .dot-2 {
      animation: orbitRotate2 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 200ms;
      opacity: 0.75;
      /* Posición inicial explícita - 120 grados */
      transform: rotate(120deg) translateX(8px) rotate(-120deg) scale(0.85);
    }

    .dot-3 {
      animation: orbitRotate3 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 400ms;
      opacity: 0.6;
      /* Posición inicial explícita - 240 grados */
      transform: rotate(240deg) translateX(8px) rotate(-240deg) scale(0.7);
    }

    /* Animación para dot-1: comienza en 0° */
    @keyframes orbitRotate1 {
      0% {
        transform: rotate(0deg) translateX(8px) rotate(0deg) scale(1);
      }
      100% {
        transform: rotate(360deg) translateX(8px) rotate(-360deg) scale(1);
      }
    }

    /* Animación para dot-2: comienza en 120° */
    @keyframes orbitRotate2 {
      0% {
        transform: rotate(120deg) translateX(8px) rotate(-120deg) scale(0.85);
      }
      100% {
        transform: rotate(480deg) translateX(8px) rotate(-480deg) scale(0.85);
      }
    }

    /* Animación para dot-3: comienza en 240° */
    @keyframes orbitRotate3 {
      0% {
        transform: rotate(240deg) translateX(8px) rotate(-240deg) scale(0.7);
      }
      100% {
        transform: rotate(600deg) translateX(8px) rotate(-600deg) scale(0.7);
      }
    }

    /* Checkmark Premium - Animación de dibujo */
    .checkmark-premium-wrapper {
      position: relative;
      width: 28px;
      height: 28px;
    }

    .checkmark-premium {
      width: 100%;
      height: 100%;
      stroke: white;
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: checkmarkDraw 600ms var(--button-ease-elastic) 100ms forwards;
    }

    @keyframes checkmarkDraw {
      to {
        stroke-dashoffset: 0;
      }
    }

    .checkmark-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%) scale(0);
      animation: checkmarkRipple 600ms var(--button-ease-bounce) 300ms;
    }

    @keyframes checkmarkRipple {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2.5);
        opacity: 0;
      }
    }

    /* ============================================
       EFECTOS RIPPLE PREMIUM
       ============================================ */

    .button-ripple-expand-premium {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 3.5rem;
      height: 3.5rem;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 60%, rgba(241, 245, 249, 0.9) 100%);
      border-radius: 50%;
      z-index: 9998;
      animation: rippleExpandPremium 700ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      pointer-events: none;
      filter: blur(18px);
      will-change: width, height, opacity;
    }

    @keyframes rippleExpandPremium {
      0% {
        width: 3.5rem;
        height: 3.5rem;
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
      }
      10% {
        opacity: 0.65;
      }
      100% {
        width: 160vw;
        height: 160vh;
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    .button-ripple-wave-1,
    .button-ripple-wave-2 {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 3.5rem;
      height: 3.5rem;
      transform: translate(-50%, -50%);
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      z-index: 9997;
      pointer-events: none;
      will-change: width, height, opacity;
    }

    .button-ripple-wave-1 {
      animation: rippleWave 900ms cubic-bezier(0.25, 1, 0.5, 1) 100ms forwards;
    }

    .button-ripple-wave-2 {
      animation: rippleWave 900ms cubic-bezier(0.25, 1, 0.5, 1) 200ms forwards;
    }

    @keyframes rippleWave {
      0% {
        width: 3.5rem;
        height: 3.5rem;
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
      }
      5% {
        opacity: 0.5;
      }
      100% {
        width: 200vw;
        height: 200vh;
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    /* ============================================
       PARTÍCULAS DE ÉXITO
       ============================================ */

    .success-particles {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      z-index: 9996;
      pointer-events: none;
      will-change: transform;
    }

    .particle {
      position: absolute;
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      opacity: 0;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
      animation: particleExplode 800ms var(--button-ease-bounce) forwards;
    }

    .particle-1 {
      animation-delay: 0ms;
      --particle-angle: 0deg;
      --particle-distance: 40px;
    }

    .particle-2 {
      animation-delay: 50ms;
      --particle-angle: 72deg;
      --particle-distance: 40px;
    }

    .particle-3 {
      animation-delay: 100ms;
      --particle-angle: 144deg;
      --particle-distance: 40px;
    }

    .particle-4 {
      animation-delay: 150ms;
      --particle-angle: 216deg;
      --particle-distance: 40px;
    }

    .particle-5 {
      animation-delay: 200ms;
      --particle-angle: 288deg;
      --particle-distance: 40px;
    }

    @keyframes particleExplode {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: 
          translate(
            calc(cos(var(--particle-angle)) * var(--particle-distance)),
            calc(sin(var(--particle-angle)) * var(--particle-distance))
          ) 
          scale(0);
      }
    }

    /* Password Toggle Icon Animation */
    button[type="button"][aria-label] {
      transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    button[type="button"][aria-label]:hover {
      transform: scale(1.1);
    }

    button[type="button"][aria-label]:active {
      transform: scale(0.95);
    }

    button[type="button"][aria-label] svg {
      transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* ============================================
       INPUTS PREMIUM - Diseño Elegante y Funcional
       ============================================ */

    .premium-input-wrapper {
      position: relative;
      background: hsl(var(--bc) / 0.04); /* Fondo gris sutil pero notorio */
      border: 1.5px solid hsl(var(--bc) / 0.12);
      border-radius: 0.875rem;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 0 0 0 rgba(59, 130, 246, 0);
    }

    .premium-input-wrapper:hover {
      background: hsl(var(--bc) / 0.06); /* Fondo un poco más visible en hover */
      border-color: hsl(var(--bc) / 0.2);
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.06),
        0 0 0 0 rgba(59, 130, 246, 0);
    }

    .premium-input-wrapper:focus-within {
      background: hsl(var(--b1)); /* Fondo blanco en focus para contraste */
      border-color: hsl(var(--p));
      box-shadow: 
        0 0 0 3px hsl(var(--p) / 0.12),
        0 4px 12px rgba(59, 130, 246, 0.15),
        0 1px 3px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .premium-input-wrapper.premium-input-error {
      background: hsl(var(--er) / 0.04); /* Fondo rojo muy sutil en error */
      border-color: hsl(var(--er));
      box-shadow: 
        0 0 0 3px hsl(var(--er) / 0.12),
        0 4px 12px rgba(239, 68, 68, 0.15),
        0 1px 3px rgba(0, 0, 0, 0.1);
      animation: premiumShake 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes premiumShake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }

    .premium-input {
      height: 3.75rem;
      padding-left: 3.5rem; /* 56px - espacio suficiente para icono (16px left + 20px icono + 20px gap) */
      padding-right: 1rem;
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.9375rem;
      font-weight: 500;
      color: hsl(var(--bc));
      letter-spacing: 0.01em;
      transition: color 200ms ease;
      position: relative;
      z-index: 2; /* Por encima de la línea azul */
    }

    .premium-input::placeholder {
      color: #9ca3af !important; /* Gray-400 - Gris específico y visible */
      font-weight: 400;
      opacity: 1 !important;
    }

    .premium-input-wrapper:focus-within .premium-input::placeholder {
      color: #9ca3af !important; /* Mantener gris incluso en focus */
      opacity: 1 !important;
    }

    .premium-input-icon {
      position: absolute;
      left: 1rem; /* 16px desde la izquierda */
      top: 50%;
      transform: translateY(-50%);
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 2; /* Por encima de la línea azul */
      pointer-events: none;
      width: 1.25rem; /* 20px - ancho fijo del icono */
      height: 1.25rem; /* 20px - alto fijo del icono */
      display: flex;
      align-items: center;
      justify-content: center;
      color: hsl(var(--bc) / 0.5); /* Color base gris - siempre gris */
    }

    .premium-input-icon svg {
      width: 100%;
      height: 100%;
      fill: hsl(var(--bc) / 0.5); /* Color gris por defecto - siempre gris */
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .premium-input-wrapper:focus-within .premium-input-icon {
      transform: translateY(-50%) scale(1.05); /* Solo escala sutil, sin cambio de color */
    }

    .premium-input-wrapper.premium-input-error .premium-input-icon {
      color: hsl(var(--er)) !important;
    }

    .premium-input-wrapper.premium-input-error .premium-input-icon svg {
      fill: hsl(var(--er)) !important;
    }

    /* Autofill fix para inputs premium */
    .premium-input:-webkit-autofill,
    .premium-input:-webkit-autofill:hover, 
    .premium-input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0px 1000px hsl(var(--bc) / 0.04) inset;
      transition: background-color 5000s ease-in-out 0s;
      -webkit-text-fill-color: hsl(var(--bc));
      border-radius: 0.875rem;
    }

    .premium-input-wrapper:focus-within .premium-input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0px 1000px hsl(var(--b1)) inset;
    }

    /* Contenedor principal durante expansión */
    .ripple-active {
      overflow: hidden;
    }

    /* Fase LEAVING - solo fade-out (sin movimiento) del login antes del overlay */
    .login-leaving {
      transition: opacity 120ms cubic-bezier(0.25, 0.8, 0.25, 1);
      will-change: opacity;
    }

    .login-leaving.login-leaving-active {
      opacity: 0;
    }

    /* Cuando comienza la fase EXPANDING, apagar visualmente el layout restante
       muy rápido, para que el foco pase al overlay global */
    .login-root-fade-out {
      animation: loginRootFadeOut 280ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      will-change: opacity, transform;
    }

    @keyframes loginRootFadeOut {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    /* ============================================
       TRANSICIÓN "LA INMERSIÓN FOCAL"
       ============================================ */
    
    /* Panel azul desliza hacia la izquierda */
    .slide-out-left {
      transform: translateX(-100%);
      pointer-events: none;
      transition: transform 800ms cubic-bezier(0.65, 0, 0.35, 1);
    }
    
    /* Contenedor blanco se expande hasta cubrir todo */
    .expanding-white {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: white;
      pointer-events: none;
      overflow: hidden;
    }
    
    /* Usar un pseudo-elemento para la expansión con scale desde el centro derecho */
    .expanding-white::before {
      content: '';
      position: absolute;
      top: 50%;
      right: 25%;
      width: 0;
      height: 0;
      background: white;
      border-radius: 50%;
      transform: translate(50%, -50%) scale(0);
      animation: expandWhiteContainer 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
      will-change: transform;
    }
    
    @keyframes expandWhiteContainer {
      0% {
        width: 0;
        height: 0;
        transform: translate(50%, -50%) scale(0);
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      100% {
        width: 300vw;
        height: 300vh;
        transform: translate(50%, -50%) scale(1);
        opacity: 1;
      }
    }
    
    /* En móvil, expandir desde el centro */
    @media (max-width: 1023px) {
      .expanding-white::before {
        right: 50%;
        animation: expandWhiteContainerMobile 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
      }
    }
    
    @keyframes expandWhiteContainerMobile {
      0% {
        width: 0;
        height: 0;
        transform: translate(50%, -50%) scale(0);
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      100% {
        width: 300vw;
        height: 300vh;
        transform: translate(50%, -50%) scale(1);
        opacity: 1;
      }
    }
    
    /* Formulario fade + scale */
    .form-fade-out {
      opacity: 0;
      transform: scale(0.9);
      pointer-events: none;
      transition: opacity 700ms cubic-bezier(0.65, 0, 0.35, 1),
                  transform 700ms cubic-bezier(0.65, 0, 0.35, 1);
    }
    
    /* Fade out del contenido durante expansión (mantener para compatibilidad) */
    .fade-out {
      animation: fadeOutContent 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      pointer-events: none;
    }

    @keyframes fadeOutContent {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .animate-blob-1,
      .animate-blob-2 {
        animation: none;
      }

      .animate-entrance-fade-up,
      .animate-entrance-fade-left,
      .animate-entrance-zoom {
        animation: none;
      }

      .status-dot::after {
        animation: none;
      }

      button[type="submit"],
      .button-morph,
      .button-morph-premium {
        transition: none;
      }

      .button-morph.expanding,
      .button-ripple-expand,
      .button-morph-premium.state-expanding,
      .button-ripple-expand-premium,
      .button-ripple-wave-1,
      .button-ripple-wave-2,
      .success-particles,
      .particle,
      .fade-out {
        animation: none !important;
      }

      button[type="button"] svg {
        transition: none;
      }
    }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private transitionService = inject(TransitionService);

  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  shakeError = signal(false);
  loginSuccess = signal(false);
  // Nuevo estado: fase de salida física del login antes del overlay global
  leaving = signal(false);
  expanding = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Si ya hay una sesión activa, redirige automáticamente
    // PERO NO durante la animación de expansión / salida ni durante un login manual en curso
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        return;
      }

      // Si estamos en pleno flujo de login (loading true), dejamos que onSubmit controle la navegación
      if (this.loading()) {
        console.log('[LOGIN] ⏸️ Effect bloqueado: loading está activo (flujo de login manual)');
        return;
      }

      // No navegar si estamos en proceso de salida/expansión (transición visual)
      if (this.leaving()) {
        console.log('[LOGIN] ⏸️ Effect bloqueado: leaving está activo');
        return;
      }

      if (this.expanding()) {
        console.log('[LOGIN] ⏸️ Effect bloqueado: expanding está activo');
        return;
      }

      const target = user.role === 'admin' ? '/dashboard' : '/trabajador';
      if (this.router.url !== target) {
        console.log('[LOGIN] 🔄 Effect detectó usuario con sesión previa, navegando a:', target, 'URL actual:', this.router.url);
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
    this.shakeError.set(false);
    this.loginSuccess.set(false);
    this.expanding.set(false);

    try {
      await this.auth.loginWithCredentials(email, password);
      // Si el login fue exitoso, mostrar estado de éxito
      const user = this.auth.currentUser();
      if (user) {
        this.loginSuccess.set(true);
      this.error.set(null);
        
        console.log('[LOGIN] ✅ Login exitoso, esperando 1200ms para mostrar check...');
        // Esperar un momento para mostrar el check (micro-éxito)
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        console.log('[LOGIN] 🎬 Activando fase LEAVING (salida física del login)...');
        // Fase de salida física del login (se desplaza y desvanece)
        this.leaving.set(true);
        await new Promise(resolve => setTimeout(resolve, 650));

        console.log('[LOGIN] 🎬 Activando expansión y animaciones de salida (EXPANDING)...');
        // Activar expansión ripple y animaciones de salida
        this.expanding.set(true);
        
        console.log('[LOGIN] 🌐 Activando overlay de transición global...');
        // Activar el overlay de transición global ANTES de navegar
        this.transitionService.startTransition();
        
        console.log('[LOGIN] ⏳ Esperando 50ms para que overlay se active...');
        // Esperar un momento para que el overlay se active
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log('[LOGIN] ⏳ Esperando 900ms para animación de expansión...');
        // Esperar a que la animación termine completamente (900ms) antes de navegar
        await new Promise(resolve => setTimeout(resolve, 900));
        
        console.log('[LOGIN] 🚀 Navegando al dashboard...');
        // Navegar después de la animación
        const target = user.role === 'admin' ? '/dashboard' : '/trabajador';
        await this.router.navigate([target]);
        
        console.log('[LOGIN] ⏳ Esperando 200ms para que dashboard se cargue...');
        // Esperar a que el dashboard se cargue antes de ocultar el overlay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('[LOGIN] 🎭 Ocultando overlay de transición...');
        // Ocultar el overlay de transición
        this.transitionService.endTransition();
        
        // Resetear el estado de expansión después de navegar
        setTimeout(() => {
          this.expanding.set(false);
        }, 100);
      }
    } catch (err) {
      // Esperar más tiempo para dar tiempo a todos los retries de syncDomainUser
      // syncDomainUser puede hacer múltiples retries:
      // - Primer retry después de 300ms (si es login manual)
      // - Segundo retry después de 200ms adicionales (si intenta refrescar token)
      // - Más el tiempo de las peticiones HTTP
      // Total puede ser más de 800ms, así que esperamos 1200ms para estar seguros
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Verificar nuevamente si el usuario está autenticado después de los retries
      const user = this.auth.currentUser();
      if (!user) {
        // Si después de todos los retries aún no hay usuario, mostrar error
        this.error.set(
          'No se pudo iniciar sesión.\nVerifica tus credenciales o inténtalo nuevamente.'
        );
        // Activar animación de shake
        this.shakeError.set(true);
        setTimeout(() => this.shakeError.set(false), 500);
      } else {
        // Si hay usuario después del retry, el login fue exitoso
        // Mostrar estado de éxito igual que en el caso exitoso normal
        this.error.set(null);
        this.loginSuccess.set(true);
        
        console.log('[LOGIN] ✅ Login exitoso, esperando 1200ms para mostrar check...');
        // Esperar un momento para mostrar el check (micro-éxito)
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        console.log('[LOGIN] 🎬 Activando fase LEAVING (salida física del login)...');
        // Fase de salida física del login (se desplaza y desvanece)
        this.leaving.set(true);
        await new Promise(resolve => setTimeout(resolve, 650));

        console.log('[LOGIN] 🎬 Activando expansión y animaciones de salida (EXPANDING)...');
        // Activar expansión ripple y animaciones de salida
        this.expanding.set(true);
        
        console.log('[LOGIN] 🌐 Activando overlay de transición global...');
        // Activar el overlay de transición global ANTES de navegar
        this.transitionService.startTransition();
        
        console.log('[LOGIN] ⏳ Esperando 50ms para que overlay se active...');
        // Esperar un momento para que el overlay se active
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log('[LOGIN] ⏳ Esperando 900ms para animación de expansión...');
        // Esperar a que la animación termine completamente (900ms) antes de navegar
        await new Promise(resolve => setTimeout(resolve, 900));
        
        console.log('[LOGIN] 🚀 Navegando al dashboard...');
        // Navegar después de la animación
        const target = user.role === 'admin' ? '/dashboard' : '/trabajador';
        await this.router.navigate([target]);
        
        console.log('[LOGIN] ⏳ Esperando 200ms para que dashboard se cargue...');
        // Esperar a que el dashboard se cargue antes de ocultar el overlay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('[LOGIN] 🎭 Ocultando overlay de transición...');
        // Ocultar el overlay de transición
        this.transitionService.endTransition();
        
        // Resetear el estado de expansión después de navegar
        setTimeout(() => {
          this.expanding.set(false);
        }, 100);
      }
    } finally {
      this.loading.set(false);
    }
  }


}

