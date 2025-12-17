import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row w-full bg-base-200 lg:bg-base-100 relative">
      <!-- Header móvil -->
      <div class="lg:hidden absolute top-0 left-0 w-full h-60 bg-primary rounded-b-[3rem] overflow-hidden z-0">
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
          <h2 class="text-xl font-bold tracking-tight animate-entrance-fade-up delay-300">Recuperación de acceso</h2>
        </div>
      </div>

      <!-- Panel branding desktop -->
      <div class="hidden lg:flex w-1/2 bg-primary text-primary-content relative flex-col justify-between p-16 overflow-hidden">
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
          <a routerLink="/login" class="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity w-fit">
            <div class="logo-brand w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center text-xl shadow-lg">GF</div>
            <span class="logo-brand text-2xl">GESTOR DE FLOTAS</span>
          </a>
          <h2 class="text-4xl font-bold leading-tight max-w-md">
            Seguridad ante todo.
          </h2>
          <p class="mt-4 text-lg opacity-90 max-w-sm">
            Restablece tu acceso de forma segura. Si necesitas ayuda, soporte TI está disponible 24/7.
          </p>
        </div>

        <div
          class="relative z-10 flex justify-between items-end text-sm opacity-70"
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
      <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 z-10">
        <div class="w-full max-w-md bg-base-100 rounded-2xl shadow-xl lg:shadow-none p-6 sm:p-8 mt-[180px] sm:mt-[200px] lg:mt-0 animate-entrance-zoom delay-mobile-400 delay-100 relative overflow-hidden">
          <a 
            routerLink="/login" 
            class="absolute top-4 right-4 lg:top-6 lg:right-6 btn btn-circle btn-ghost btn-sm text-base-content/60 hover:text-base-content hover:bg-base-200/80 transition-all duration-200 z-20 animate-entrance-fade-up delay-mobile-300 delay-50 backdrop-blur-sm"
            aria-label="Volver al inicio de sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </a>

          @if (currentStep() === 'request') {
            <div class="pt-6 lg:pt-2">
              <div class="text-left mb-8 space-y-2 border-l-4 border-l-primary pl-4 animate-entrance-fade-up delay-mobile-500 delay-200">
                <p class="text-xs uppercase tracking-[0.35em] text-base-content/50 font-bold">Recuperación de acceso</p>
                <h1 class="text-2xl lg:text-4xl font-bold text-base-content">¿Olvidaste tu clave?</h1>
                <p class="text-base-content/60 text-sm italic">Ingresa tu correo corporativo y te enviaremos las instrucciones para restablecerla.</p>
              </div>

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6 mt-2 transition-all">
                <!-- Input Email Premium -->
                <div class="form-control animate-entrance-fade-up delay-mobile-600 delay-300">
                  <label class="label pb-2.5">
                    <span class="label-text font-semibold text-base-content text-sm tracking-wide">Correo electrónico</span>
                  </label>
                  <div class="relative premium-input-wrapper" 
                       [class.premium-input-error]="form.get('email')?.invalid && form.get('email')?.touched">
                    <div class="premium-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-5 h-5">
                        <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      class="premium-input w-full"
                      placeholder="usuario@empresa.com"
                      formControlName="email"
                      autocomplete="email"
                      required
                    />
                    @if (form.get('email')?.invalid && form.get('email')?.touched) {
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 text-error animate-scale-up z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    }
                  </div>
                  @if (form.get('email')?.invalid && form.get('email')?.touched) {
                    <span class="text-error text-xs mt-1 px-1">Ingresa un correo válido.</span>
                  }
                </div>

                <div class="pt-2 animate-entrance-fade-up delay-mobile-700 delay-400 relative overflow-hidden">
                  <!-- Partículas de Éxito -->
                  @if (submitSuccess() && !loading()) {
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
                    class="button-morph-premium"
                    [class.state-idle]="!loading() && !submitSuccess()"
                    [class.state-loading]="loading() && !submitSuccess()"
                    [class.state-success]="submitSuccess() && !loading()"
                    [disabled]="form.invalid || loading()"
                  >
                    <!-- Capa de profundidad (Neumorphism sutil) -->
                    <div class="button-depth-layer"></div>
                    
                    <!-- Contenido del botón -->
                    <span class="button-content-wrapper relative z-10">
                      @if (!loading() && !submitSuccess()) {
                        <span class="button-text-premium">
                          <span class="button-text-main">Enviar instrucciones</span>
                          <span class="button-text-glow">Enviar instrucciones</span>
                        </span>
                      }
                      @if (loading() && !submitSuccess()) {
                        <div class="spinner-dots-orbit">
                          <div class="orbit-dot dot-1"></div>
                          <div class="orbit-dot dot-2"></div>
                          <div class="orbit-dot dot-3"></div>
                        </div>
                      }
                      @if (submitSuccess() && !loading()) {
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
                @if (error()) {
                  <p class="text-error text-sm mt-2 animate-entrance-fade-up delay-500">
                    {{ error() }}
                  </p>
                }
              </form>
            </div>
          }

          @if (currentStep() === 'success') {
            <div class="text-left animate-entrance-fade-up delay-200 py-10">
              <div class="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 animate-entrance-zoom delay-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div class="pl-4 border-l-4 border-l-primary mb-8">
                <h2 class="text-2xl font-bold mb-2 animate-entrance-fade-up delay-400">¡Revisa tu correo!</h2>
                <p class="text-base-content/60 text-sm px-4 animate-entrance-fade-up delay-500">
                  Enviamos un enlace de recuperación a <br />
                  <span class="font-bold text-base-content">{{ submittedEmail() }}</span>
                </p>
              </div>

              <div class="space-y-3 animate-entrance-fade-up delay-600">
                <a routerLink="/login" class="btn btn-outline btn-block h-12 border-base-300 hover:bg-base-200 hover:text-base-content">
                  Volver al inicio de sesión
                </a>
                <button class="btn btn-ghost btn-sm text-base-content/50 font-normal" (click)="currentStep.set('request'); submitSuccess.set(false);">
                  Probar con otro correo
                </button>
              </div>
            </div>
          }
        </div>
      </div>
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

    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
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

    .animate-scale-up {
      animation: scaleUp 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .delay-50 {
      animation-delay: 50ms;
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

    .delay-600 {
      animation-delay: 600ms;
    }

    .delay-700 {
      animation-delay: 700ms;
    }

    /* Delays específicos para móvil - El formulario empieza después del header */
    @media (max-width: 1023px) {
      .delay-mobile-300 {
        animation-delay: 300ms !important;
      }

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
      .delay-mobile-300,
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
       ============================================ */
    
    /* Variables CSS para control fino */
    :host {
      --button-ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
      --button-ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      --button-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
      --button-ease-premium: cubic-bezier(0.4, 0, 0.2, 1);
      --button-ease-color: cubic-bezier(0.4, 0, 0.2, 1); /* Easing suave para transiciones de color */
      --button-transition-fast: 200ms;
      --button-transition-normal: 300ms;
      --button-transition-slow: 500ms;
      --button-transition-color: 600ms; /* Duración más larga y suave para cambios de color */
    }

    /* Contenedor del botón */
    .pt-2.relative {
      position: relative;
      isolation: isolate;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: visible;
    }
    
    form {
      overflow: hidden;
      position: relative;
    }

    /* BOTÓN PREMIUM - Base Arquitectónica */
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
        background var(--button-transition-color) var(--button-ease-color),
        box-shadow var(--button-transition-color) var(--button-ease-color),
        transform var(--button-transition-fast) var(--button-ease-premium),
        min-width var(--button-transition-slow) var(--button-ease-elastic),
        clip-path 0ms; /* Cambio instantáneo del clip-path */
      /* Border-radius base - se sobrescribe en estados específicos */
      border-radius: 0.75rem;
      /* Clip-path como respaldo para forzar la forma durante la transición */
      clip-path: inset(0 round 0.75rem);
    }

    /* Estado IDLE - Botón ancho con texto */
    .button-morph-premium.state-idle:not(:disabled) {
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

    /* Estado DISABLED - Botón gris cuando está deshabilitado (solo en estado idle) */
    .button-morph-premium.state-idle:disabled {
      opacity: 1; /* Mantener opacidad completa incluso cuando está disabled */
      cursor: not-allowed;
      transform: none !important;
      background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important; /* Gris cuando está deshabilitado */
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
      width: 100%;
      height: 3.5rem;
      min-width: auto;
      border-radius: 0.75rem;
      clip-path: inset(0 round 0.75rem);
      color: white;
      /* Asegurar que la transición de color se aplique también cuando está disabled */
      transition: 
        width var(--button-transition-slow) var(--button-ease-elastic),
        height var(--button-transition-slow) var(--button-ease-elastic),
        background var(--button-transition-color) var(--button-ease-color),
        box-shadow var(--button-transition-color) var(--button-ease-color),
        transform var(--button-transition-fast) var(--button-ease-premium),
        min-width var(--button-transition-slow) var(--button-ease-elastic),
        clip-path 0ms;
    }

    .button-morph-premium.state-idle:disabled:hover {
      transform: none !important;
      background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important; /* Mantener gris en hover */
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
    }

    /* Los estados loading y success mantienen sus colores incluso cuando están disabled */
    .button-morph-premium.state-loading:disabled {
      opacity: 1;
      cursor: not-allowed;
      /* NO aplicar transform: none para permitir animaciones del botón si las hay */
      /* Mantener el color azul del loading */
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.2) !important;
    }

    .button-morph-premium.state-success:disabled {
      opacity: 1;
      cursor: not-allowed;
      /* NO aplicar transform: none para permitir la animación successPulse */
      /* Mantener el color verde del success */
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      box-shadow: 
        0 0 0 4px rgba(16, 185, 129, 0.18),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.3) !important;
      /* Mantener la animación de success - esta animación usa transform */
      animation: successPulse 750ms cubic-bezier(0.22, 0.61, 0.36, 1);
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

    /* CAPAS DE PROFUNDIDAD Y BRILLO */
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

    /* CONTENIDO DEL BOTÓN */
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
    .button-morph-premium.state-success .button-text-premium {
      display: none;
    }

    /* SPINNER PREMIUM - Puntos Orbitantes */
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
      animation-fill-mode: both;
      will-change: transform;
      top: 10px;
      left: 10px;
      margin: -2px 0 0 -2px;
      transform-origin: 2px 2px;
    }

    .dot-1 {
      animation: orbitRotate1 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 0ms;
      opacity: 1;
      transform: rotate(0deg) translateX(8px) rotate(0deg) scale(1);
    }

    .dot-2 {
      animation: orbitRotate2 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 200ms;
      opacity: 0.75;
      transform: rotate(120deg) translateX(8px) rotate(-120deg) scale(0.85);
    }

    .dot-3 {
      animation: orbitRotate3 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 400ms;
      opacity: 0.6;
      transform: rotate(240deg) translateX(8px) rotate(-240deg) scale(0.7);
    }

    @keyframes orbitRotate1 {
      0% {
        transform: rotate(0deg) translateX(8px) rotate(0deg) scale(1);
      }
      100% {
        transform: rotate(360deg) translateX(8px) rotate(-360deg) scale(1);
      }
    }

    @keyframes orbitRotate2 {
      0% {
        transform: rotate(120deg) translateX(8px) rotate(-120deg) scale(0.85);
      }
      100% {
        transform: rotate(480deg) translateX(8px) rotate(-480deg) scale(0.85);
      }
    }

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

    /* PARTÍCULAS DE ÉXITO */
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

    /* INPUTS PREMIUM - Diseño Elegante y Funcional */
    .premium-input-wrapper {
      position: relative;
      background: hsl(var(--bc) / 0.04);
      border: 1.5px solid hsl(var(--bc) / 0.12);
      border-radius: 0.875rem;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 0 0 0 rgba(59, 130, 246, 0);
    }

    .premium-input-wrapper:hover {
      background: hsl(var(--bc) / 0.06);
      border-color: hsl(var(--bc) / 0.2);
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.06),
        0 0 0 0 rgba(59, 130, 246, 0);
    }

    .premium-input-wrapper:focus-within {
      background: hsl(var(--b1));
      border-color: hsl(var(--p));
      box-shadow: 
        0 0 0 3px hsl(var(--p) / 0.12),
        0 4px 12px rgba(59, 130, 246, 0.15),
        0 1px 3px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .premium-input-wrapper.premium-input-error {
      background: hsl(var(--er) / 0.04);
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
      padding-left: 3.5rem;
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
      z-index: 2;
    }

    .premium-input::placeholder {
      color: #9ca3af !important;
      font-weight: 400;
      opacity: 1 !important;
    }

    .premium-input-wrapper:focus-within .premium-input::placeholder {
      color: #9ca3af !important;
      opacity: 1 !important;
    }

    .premium-input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 2;
      pointer-events: none;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: hsl(var(--bc) / 0.5);
    }

    .premium-input-icon svg {
      width: 100%;
      height: 100%;
      fill: hsl(var(--bc) / 0.5);
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .premium-input-wrapper:focus-within .premium-input-icon {
      transform: translateY(-50%) scale(1.05);
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

      .button-morph-premium {
        transition: none;
      }

      .success-particles,
      .particle {
        animation: none !important;
      }
    }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarClave {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  currentStep = signal<'request' | 'success'>('request');
  submittedEmail = signal('');
  loading = signal(false);
  submitSuccess = signal(false);
  error = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.submitSuccess.set(false);
    this.error.set(null);

    const email = this.form.value.email ?? '';

    try {
      const { error } = await this.auth.sendPasswordResetEmail(email);

      if (error) {
        throw new Error(error.message || 'No se pudo enviar el correo de recuperación.');
      }

      this.submittedEmail.set(email);
      this.submitSuccess.set(true);

      // Dar tiempo a la animación de éxito antes de mostrar el paso final
      await new Promise(resolve => setTimeout(resolve, 800));
      this.currentStep.set('success');
    } catch (err: any) {
      this.error.set(
        err?.message || 'No pudimos enviar el correo de recuperación. Inténtalo nuevamente más tarde.'
      );
      this.submitSuccess.set(false);
    } finally {
      this.loading.set(false);
    }

    // Esperar un momento para mostrar el éxito, luego cambiar al paso de éxito
    await new Promise(resolve => setTimeout(resolve, 800));
    this.currentStep.set('success');
  }
}

