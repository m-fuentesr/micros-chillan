import { Component, inject, ChangeDetectionStrategy, signal, OnInit, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { TodayRecordStatusService } from '../../../shared/services/today-record-status.service';
import { AuthService } from '../../../shared/services/auth.service';
import { MachineService } from '../../../shared/services/machine.service';
import { WorkerService } from '../../../shared/services/worker.service';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { TransitionService } from '../../../shared/services/transition.service';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import type { CreateDailyRecordDto } from '../../../shared/models/daily-record.models';
import { StorageService, UploadResult } from '../../../shared/services/storage.service';

@Component({
  selector: 'app-reportar',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingSkeleton],
  template: `
    <div class="reportar-background-enter bg-slate-50 font-sans">
      <header 
        class="reportar-header-enter bg-gradient-to-br from-blue-600 to-indigo-800 pt-12 pb-24 px-6 relative overflow-hidden shadow-lg"
        [class.reportar-header-fade-out]="expanding()"
      >
        <a
          routerLink="/trabajador"
          class="absolute top-12 left-4 btn btn-circle btn-ghost text-white hover:bg-white/20 z-20"
          aria-label="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </a>

        <div class="relative z-10 text-left pl-4 border-l-4 border-l-white/30">
          <p class="text-blue-200 text-xs font-bold uppercase tracking-[0.35em] mb-1">Nuevo registro</p>
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Reporte diario</h1>
        </div>
        <div
          class="absolute top-0 left-0 w-full h-full opacity-10"
          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
        ></div>
      </header>

      @if (machinesLoadingState.showSkeleton() && machinesLoadingState.isLoading()) {
        <div class="px-4 mt-4 relative z-20">
          <app-loading-skeleton type="worker-form" />
          @if (machinesLoadingState.showFeedback()) {
            <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p class="text-sm text-blue-700">{{ machinesLoadingState.feedbackMessage() }}</p>
            </div>
          }
        </div>
      } @else {
      <form 
        class="reportar-form-enter px-4 mt-4 pb-20 relative z-20 space-y-6" 
        [formGroup]="reportForm" 
        (ngSubmit)="enviarReporte()"
        [class.reportar-form-fade-out]="expanding()"
      >
        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-1 overflow-hidden" [style.animation-delay.ms]="200">
          <div class="flex items-center p-4 gap-4">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">
              🚛
            </div>
            <div class="flex-1">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Máquina asignada</label>
              <div class="relative">
                <select 
                  class="machine-select-premium appearance-none bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-3 pr-10 font-bold text-slate-800 text-base w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-2 border-transparent transition-all cursor-pointer"
                  formControlName="machine"
                >
                  <option [value]="null" disabled selected>Selecciona una máquina</option>
                  @for (machine of machines(); track machine.id) {
                    <option [value]="machine.id">{{ machine.display_name }}</option>
                  }
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 border-l-4 border-emerald-500 relative overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all" [style.animation-delay.ms]="300">
          <label class="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-[0.35em] mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.732 6.232a2.5 2.5 0 0 1 3.536 0 .75.75 0 1 0 1.06-1.06A4 4 0 0 0 6.5 8v.165c0 .364.034.709.13 1.04l.635 2.048a.75.75 0 0 1-1.428.442l-.636-2.047a5.507 5.507 0 0 1-.18-.762 3.996 3.996 0 0 1 .978-3.654Z" clip-rule="evenodd" />
              <path d="M6.25 8a2.5 2.5 0 0 1 2.5-2.5h2.5a2.5 2.5 0 0 1 2.5 2.5v.5a2.5 2.5 0 0 1-2.5 2.5h-2.5a2.5 2.5 0 0 1-2.5-2.5V8Z" />
            </svg>
            Total recaudado
          </label>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-black text-slate-300">$</span>
            <input
              type="number"
              placeholder="0"
              formControlName="amount"
              class="w-full text-4xl font-black text-slate-800 placeholder:text-slate-200 focus:outline-none border-none p-0 tabular-nums h-12 bg-transparent"
              aria-label="Total recaudado"
              (keydown)="preventInvalidNumberInput($event)"
            />
          </div>
          <p class="text-xs text-slate-400 mt-2">Ingresa el monto final del día.</p>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="400">
          <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs">⛽</div>
            <span class="text-sm font-bold text-slate-700">Carga de combustible</span>
            <span class="ml-auto text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Opcional</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs text-slate-400 font-normal ml-1">Litros</label>
              <div class="relative">
                <input
                  type="number"
                  formControlName="fuelLiters"
                  placeholder="0"
                  class="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-left"
                  (keydown)="preventInvalidNumberInput($event)"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">L</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs text-slate-400 font-normal ml-1">Costo total</label>
              <div class="relative">
                <input
                  type="number"
                  formControlName="fuelCost"
                  placeholder="0"
                  class="w-full bg-slate-50 rounded-xl pl-8 pr-4 py-3 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-left"
                  (keydown)="preventInvalidNumberInput($event)"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
              </div>
            </div>
          </div>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="500">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.35em] mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clip-rule="evenodd" />
            </svg>
            Foto del comprobante *
          </label>

          <!-- Preview de imagen -->
          @if (imagePreview()) {
            <div class="mb-4 relative rounded-xl overflow-hidden border-2 border-blue-200">
              <img [src]="imagePreview()!" alt="Preview" class="w-full h-48 object-cover" />
              <button
                type="button"
                (click)="removeImage()"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                aria-label="Eliminar imagen"
                [disabled]="isSubmitting()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          }

          <!-- Barra de progreso -->
          @if (uploadProgress() && uploadProgress()!.percentage < 100) {
            <div class="mb-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>Subiendo imagen...</span>
                <span>{{ uploadProgress()!.percentage }}%</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  [style.width.%]="uploadProgress()!.percentage"
                ></div>
              </div>
            </div>
          }

          <!-- Input de archivo -->
          <label class="block w-full aspect-[3/1] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer relative overflow-hidden" [class.opacity-50]="isSubmitting()" [class.cursor-not-allowed]="isSubmitting()">
            <input 
              type="file" 
              class="hidden" 
              accept="image/*" 
              (change)="onEvidenceSelected($event)"
              [disabled]="isSubmitting()"
            />
            <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
              @if (!imagePreview()) {
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mb-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm2.25-2.25h.008v.008h-.008V10.5Z" />
                </svg>
                <span class="text-xs font-bold uppercase">Tomar foto</span>
              } @else {
                <span class="text-xs font-bold uppercase text-blue-600">Cambiar imagen</span>
              }
            </div>
          </label>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="600">
          <textarea
            placeholder="Observaciones o notas adicionales..."
            formControlName="notes"
            class="w-full bg-slate-50 rounded-xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
            rows="3"
          ></textarea>
        </div>

        <div class="reportar-field-enter bg-red-50 rounded-2xl border border-red-100 p-4 flex items-center justify-between" [style.animation-delay.ms]="700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm">⚠️</div>
            <div>
              <p class="text-sm font-bold text-red-800">¿Hubo incidente?</p>
              <p class="text-[10px] text-red-600/70">Choque, falla mecánica, etc.</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" formControlName="incident" />
            <div class="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div
          class="reportar-button-enter fixed bottom-0 left-0 right-0 p-4 bg-white rounded-t-3xl shadow-xl shadow-blue-900/5 border-t border-slate-100 z-[60]"
          style="padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 1rem);"
        >
          <button
            #submitButton
            type="submit"
            class="button-morph-premium-reportar"
            [class.state-idle]="!isSubmitting() && !reportSuccess() && !expanding() && !hasError()"
            [class.state-loading]="isSubmitting() && !reportSuccess() && !expanding() && !hasError()"
            [class.state-success]="reportSuccess() && !expanding() && !hasError()"
            [class.state-error]="hasError() && !expanding()"
            [class.state-expanding]="expanding()"
            [disabled]="reportForm.invalid || isSubmitting() || expanding() || !evidenceFile()"
            [style.top.px]="expanding() ? buttonY : null"
            [style.left.px]="expanding() ? buttonX : null"
            [style.transform]="expanding() ? 'translate(-50%, -50%)' : null"
          >
            <!-- Capa de profundidad (Neumorphism sutil) -->
            <div class="button-depth-layer"></div>
            
            <!-- Contenido del botón -->
            <span class="button-content-wrapper relative z-10">
              @if (!isSubmitting() && !reportSuccess() && !hasError()) {
                <span class="button-text-premium">
                  <span class="button-text-main">Enviar reporte</span>
                  <span class="button-text-glow">Enviar reporte</span>
                </span>
              }
              @if (isSubmitting() && !reportSuccess() && !hasError()) {
                <div class="spinner-dots-orbit">
                  <div class="orbit-dot dot-1"></div>
                  <div class="orbit-dot dot-2"></div>
                  <div class="orbit-dot dot-3"></div>
                </div>
              }
              @if (reportSuccess() && !hasError()) {
                <div class="checkmark-premium-wrapper">
                  <svg class="checkmark-premium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path class="checkmark-path" d="M20 6L9 17l-5-5"/>
                  </svg>
                  <div class="checkmark-ripple"></div>
                </div>
              }
              @if (hasError()) {
                <span class="button-text-premium">
                  <span class="button-text-main">Reintentar</span>
                </span>
              }
            </span>
          </button>
        </div>
      </form>
      }
    </div>
  `,
  styles: [
    `
    /* ============================================
       ANIMACIONES DE ENTRADA ELEGANTES - REPORTAR
       Transición slide desde abajo (formulario de acción)
       ============================================ */
    
    /* Fondo: Fade-in suave */
    .reportar-background-enter {
      animation: reportarBackgroundEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      will-change: opacity;
    }
    
    @keyframes reportarBackgroundEnter {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    
    /* Header: Slide desde arriba con fade */
    .reportar-header-enter {
      animation: reportarHeaderEnter 700ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateY(-30px);
      will-change: opacity, transform;
    }
    
    @keyframes reportarHeaderEnter {
      0% {
        opacity: 0;
        transform: translateY(-30px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Formulario: Slide desde abajo con fade */
    .reportar-form-enter {
      animation: reportarFormEnter 700ms cubic-bezier(0.22, 0.61, 0.36, 1) 150ms forwards;
      opacity: 0;
      transform: translateY(40px);
      will-change: opacity, transform;
    }
    
    @keyframes reportarFormEnter {
      0% {
        opacity: 0;
        transform: translateY(40px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Campos del formulario: Fade-up con stagger */
    .reportar-field-enter {
      animation: reportarFieldEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
      will-change: opacity, transform;
    }
    
    @keyframes reportarFieldEnter {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Botón fijo: Slide desde abajo con delay */
    .reportar-button-enter {
      animation: reportarButtonEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 800ms forwards;
      opacity: 0;
      transform: translateY(100%);
      will-change: opacity, transform;
    }
    
    @keyframes reportarButtonEnter {
      0% {
        opacity: 0;
        transform: translateY(100%);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .reportar-background-enter,
      .reportar-header-enter,
      .reportar-form-enter,
      .reportar-field-enter,
      .reportar-button-enter {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    /* ============================================
       BOTÓN PREMIUM REPORTAR - Estilo del Login
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
    
    .button-morph-premium-reportar {
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
      overflow: hidden;
      transition: 
        width var(--button-transition-slow) var(--button-ease-elastic),
        height var(--button-transition-slow) var(--button-ease-elastic),
        background var(--button-transition-slow) var(--button-ease-elastic),
        box-shadow var(--button-transition-slow) var(--button-ease-elastic),
        transform var(--button-transition-fast) var(--button-ease-premium),
        min-width var(--button-transition-slow) var(--button-ease-elastic),
        clip-path 0ms;
      border-radius: 0.75rem;
      clip-path: inset(0 round 0.75rem);
      width: 100%;
      height: 3.5rem;
    }

    /* Estado IDLE */
    .button-morph-premium-reportar.state-idle {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
      color: white;
    }

    .button-morph-premium-reportar.state-idle:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 
        0 0 0 4px rgba(59, 130, 246, 0.15),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .button-morph-premium-reportar.state-idle:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      transition-duration: var(--button-transition-fast);
    }

    /* Estado LOADING */
    .button-morph-premium-reportar.state-loading {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      width: 3.5rem;
      height: 3.5rem;
      min-width: 3.5rem;
      border-radius: 50%;
      clip-path: circle(50% at center);
      box-shadow: 
        0 0 0 0 rgba(0, 0, 0, 0),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
      margin-left: auto;
      margin-right: auto;
      padding: 0;
    }

    /* Estado SUCCESS */
    .button-morph-premium-reportar.state-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      width: 3.5rem;
      height: 3.5rem;
      min-width: 3.5rem;
      border-radius: 50%;
      clip-path: circle(50% at center);
      box-shadow: 
        0 0 0 4px rgba(16, 185, 129, 0.18),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
      margin-left: auto;
      margin-right: auto;
      padding: 0;
      animation: successPulseReportar 750ms cubic-bezier(0.22, 0.61, 0.36, 1);
    }

    @keyframes successPulseReportar {
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

    /* Estado ERROR - Botón rojo con shake */
    .button-morph-premium-reportar.state-error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      width: 100%;
      height: 3.5rem;
      border-radius: 0.75rem;
      clip-path: inset(0 round 0.75rem);
      box-shadow: 
        0 0 0 4px rgba(239, 68, 68, 0.2),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
      animation: errorShakeReportar 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      color: white;
    }

    @keyframes errorShakeReportar {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-8px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(8px);
      }
    }

    /* Estado EXPANDING - Expansión hacia el éxito */
    .button-morph-premium-reportar.state-expanding {
      position: fixed;
      z-index: 99999;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-radius: 50%;
      animation: buttonExpandToSuccess 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      box-shadow: 
        0 0 0 0 rgba(5, 150, 105, 0.2),
        inset 0 0 0 0 rgba(255, 255, 255, 0.3);
      padding: 0;
      /* La posición se calcula dinámicamente en el componente */
    }

    @keyframes buttonExpandToSuccess {
      0% {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
      }
      40% {
        border-radius: 50%;
        box-shadow: 
          0 0 0 100px rgba(5, 150, 105, 0.3),
          inset 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      100% {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 
          0 0 0 0 rgba(5, 150, 105, 0),
          inset 0 0 0 0 rgba(255, 255, 255, 0);
      }
    }

    .button-morph-premium-reportar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
      background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;
    }

    .button-morph-premium-reportar:disabled:hover {
      transform: none !important;
      background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
    }

    .button-morph-premium-reportar:disabled .button-text-main,
    .button-morph-premium-reportar:disabled .button-text-glow {
      color: #ffffff !important;
      opacity: 0.9;
    }

    /* Capa de profundidad */
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

    /* Contenido del botón */
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

    .button-morph-premium-reportar.state-idle:hover:not(:disabled) .button-text-glow {
      opacity: 0.6;
    }

    .button-morph-premium-reportar.state-loading .button-text-premium,
    .button-morph-premium-reportar.state-success .button-text-premium,
    .button-morph-premium-reportar.state-expanding .button-text-premium {
      display: none;
    }

    /* Spinner Premium - Puntos Orbitantes */
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
      animation: orbitRotate1Reportar 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      opacity: 1;
      transform: rotate(0deg) translateX(8px) rotate(0deg) scale(1);
    }

    .dot-2 {
      animation: orbitRotate2Reportar 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 200ms;
      opacity: 0.75;
      transform: rotate(120deg) translateX(8px) rotate(-120deg) scale(0.85);
    }

    .dot-3 {
      animation: orbitRotate3Reportar 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation-delay: 400ms;
      opacity: 0.6;
      transform: rotate(240deg) translateX(8px) rotate(-240deg) scale(0.7);
    }

    @keyframes orbitRotate1Reportar {
      0% { transform: rotate(0deg) translateX(8px) rotate(0deg) scale(1); }
      100% { transform: rotate(360deg) translateX(8px) rotate(-360deg) scale(1); }
    }

    @keyframes orbitRotate2Reportar {
      0% { transform: rotate(120deg) translateX(8px) rotate(-120deg) scale(0.85); }
      100% { transform: rotate(480deg) translateX(8px) rotate(-480deg) scale(0.85); }
    }

    @keyframes orbitRotate3Reportar {
      0% { transform: rotate(240deg) translateX(8px) rotate(-240deg) scale(0.7); }
      100% { transform: rotate(600deg) translateX(8px) rotate(-600deg) scale(0.7); }
    }

    /* Checkmark Premium */
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
      animation: checkmarkDrawReportar 600ms var(--button-ease-elastic) 100ms forwards;
    }

    @keyframes checkmarkDrawReportar {
      0% {
        stroke-dashoffset: 24;
      }
      100% {
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
      border: 2px solid white;
      transform: translate(-50%, -50%) scale(0);
      opacity: 0.8;
      animation: checkmarkRippleReportar 600ms var(--button-ease-bounce) 300ms;
    }

    @keyframes checkmarkRippleReportar {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.8;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }

    /* Icono de error */
    .error-icon-wrapper {
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon {
      width: 100%;
      height: 100%;
      stroke: white;
      animation: errorIconPulse 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    @keyframes errorIconPulse {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Fade-out del header y formulario durante expansión */
    .reportar-header-fade-out,
    .reportar-form-fade-out {
      animation: reportarContentFadeOut 500ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      pointer-events: none;
    }

    @keyframes reportarContentFadeOut {
      0% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
      }
      100% {
        opacity: 0;
        transform: translateY(20px);
        filter: blur(4px);
      }
    }

    /* ============================================
       SELECTOR DE MÁQUINA PREMIUM
       ============================================ */
    .machine-select-premium {
      min-height: 48px;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .machine-select-premium:hover {
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .machine-select-premium:focus {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .machine-select-premium option {
      padding: 12px;
      font-weight: 600;
      background: white;
    }

    .machine-select-premium option:disabled {
      color: #94a3b8;
      font-style: italic;
    }

    @media (prefers-reduced-motion: reduce) {
      .button-morph-premium-reportar {
        transition: none;
      }
      .button-morph-premium-reportar.state-expanding,
      .button-morph-premium-reportar.state-error {
        animation: none !important;
      }
      .spinner-dots-orbit,
      .orbit-dot,
      .checkmark-premium,
      .checkmark-ripple,
      .error-icon,
      .reportar-form-fade-out {
        animation: none !important;
      }
      .machine-select-premium {
        transition: none;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reportar implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dailyRecordService = inject(DailyRecordService);
  private todayRecordStatusService = inject(TodayRecordStatusService);
  private authService = inject(AuthService);
  private machineService = inject(MachineService);
  private loadingStateService = inject(LoadingStateService);
  private transitionService = inject(TransitionService);
  private storageService = inject(StorageService);
  private workerService = inject(WorkerService);

  evidenceName = signal('');
  evidenceFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  uploadProgress = signal<{ loaded: number; total: number; percentage: number } | null>(null);
  isSubmitting = signal(false);
  reportSuccess = signal(false);
  expanding = signal(false);
  hasError = signal(false);
  buttonX = 0;
  buttonY = 0;

  // Estado de carga para máquinas
  machinesLoadingState = this.loadingStateService.createLoadingState();

  // Flag para trackear cuando el observable emite
  private machinesEmitted = signal(false);

  // Obtener máquinas activas del backend
  machines = toSignal(
    this.machineService.getActiveMachines().pipe(
      tap(() => {
        // Cuando el observable emite (éxito), marcar que emitió
        this.machinesEmitted.set(true);
      }),
      catchError(() => {
        // También marcar como emitido en caso de error
        this.machinesEmitted.set(true);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  // Effect como inicializador de campo (contexto de inyección válido)
  private machinesEffect = effect(() => {
    // Monitorear cuando el observable emite
    if (this.machinesEmitted() && this.machinesLoadingState.isLoading()) {
      this.machinesLoadingState.setDataLoaded();
      
      // Establecer máquina por defecto si hay alguna disponible
      const currentMachines = this.machines();
      if (currentMachines.length > 0) {
        this.reportForm.patchValue({ machine: currentMachines[0].id });
      }
    }
  });

  reportForm = this.fb.group({
    machine: [null as number | null, Validators.required],
    amount: [null as number | null, Validators.required],
    fuelLiters: [null as number | null],
    fuelCost: [null as number | null],
    notes: [''],
    incident: [false],
  });

  ngOnInit(): void {
    // Verificar si ya tiene un reporte para hoy
    // Si ya tiene reporte, redirigir a la página principal
    const status = this.todayRecordStatusService.status();
    
    if (status?.exists && !status.can_create_new) {
      // Ya tiene un reporte para hoy, redirigir
      this.router.navigate(['/trabajador'], { 
        queryParams: { 
          message: 'Ya has registrado tu reporte diario para hoy. Podrás crear uno nuevo después de las 12:00 AM.' 
        } 
      });
      return;
    }
    
    // Si el estado aún no se ha cargado, esperar un momento y verificar nuevamente
    if (status === null) {
      // Refrescar el estado y verificar después
      this.todayRecordStatusService.refreshStatus();
      
      // Esperar un momento para que se cargue el estado
      setTimeout(() => {
        const updatedStatus = this.todayRecordStatusService.status();
        if (updatedStatus?.exists && !updatedStatus.can_create_new) {
          this.router.navigate(['/trabajador'], { 
            queryParams: { 
              message: 'Ya has registrado tu reporte diario para hoy. Podrás crear uno nuevo después de las 12:00 AM.' 
            } 
          });
          return;
        }
      }, 500);
    }
    
    // Iniciar estado de carga
    this.machinesLoadingState.setLoading(true);
  }

  async enviarReporte() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    // Validar que haya foto del comprobante (obligatorio)
    if (!this.evidenceFile()) {
      this.isSubmitting.set(false);
      this.showErrorToast('Debes adjuntar una foto del comprobante');
      return;
    }

    this.isSubmitting.set(true);
    this.reportSuccess.set(false);
    this.expanding.set(false);
    this.hasError.set(false);

    const formValue = this.reportForm.value;
    
    // Capturar posición del botón para la animación Hero Expansion
    const submitButton = document.querySelector('.button-morph-premium-reportar') as HTMLElement;
    const buttonRect = submitButton?.getBoundingClientRect();
    
    this.buttonX = buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth / 2;
    this.buttonY = buttonRect ? buttonRect.top + buttonRect.height / 2 : window.innerHeight - 100;
    
    const transitionData = {
      buttonX: this.buttonX,
      buttonY: this.buttonY,
      buttonWidth: buttonRect?.width || 0,
      buttonHeight: buttonRect?.height || 0,
    };
    
    // Guardar datos de transición en el servicio
    this.transitionService.setReportTransitionData(transitionData);

    // Obtener fecha actual (usar fecha local, no UTC)
    const today = new Date();
    // Usar fecha local para que coincida con la lógica del backend
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fecha = `${year}-${month}-${day}`; // YYYY-MM-DD (fecha local)

    // Preparar DTO según el schema del backend
    const machineId = typeof formValue.machine === 'number' ? formValue.machine : parseInt(String(formValue.machine || '0'));
    const amount = formValue.amount ? (typeof formValue.amount === 'number' ? formValue.amount : parseFloat(String(formValue.amount))) : 0;
    const fuelCost = formValue.fuelCost ? (typeof formValue.fuelCost === 'number' ? formValue.fuelCost : parseFloat(String(formValue.fuelCost))) : undefined;
    const fuelLiters = formValue.fuelLiters ? (typeof formValue.fuelLiters === 'number' ? formValue.fuelLiters : parseFloat(String(formValue.fuelLiters))) : undefined;

    // La validación de foto ya se hizo al inicio de enviarReporte()

    // Función para crear el registro después de subir la imagen (si es necesario)
    const createRecord = (imagenUrl: string): Promise<void> => {
      // El backend espera estos campos según el schema DailyRecordCreate
      // Nota: chofer_id se obtiene automáticamente del token, no se envía
      const dto: CreateDailyRecordDto = {
        fecha,
        maquina_id: machineId,
        chofer_id: 0, // Campo requerido por el DTO pero el backend lo ignora (lo obtiene del token)
        recaudado: amount,
        costo_diesel: fuelCost,
        litros_diesel: fuelLiters,
        dia_no_trabajado: false,
        incidente_critico: formValue.incident || false, // Mapear checkbox a incidente_critico
        observaciones: formValue.notes || null,
        // Incluir comprobante_diesel si hay fuelCost O si hay imagen subida
        comprobante_diesel: (fuelCost || imagenUrl) ? {
          monto: fuelCost || 0,
          imagen: imagenUrl // Siempre incluir la URL si se subió una imagen
        } : undefined
      };

      return new Promise<void>((resolve, reject) => {
        this.dailyRecordService.createDailyRecord(dto).subscribe({
          next: async (createdRecord) => {
            // Actualizar el estado del reporte en el servicio compartido
            this.todayRecordStatusService.refreshStatus();
            
            // Invalidar caché del historial para que se refleje el nuevo reporte
            this.dailyRecordService.invalidateHistoryCache();
            
            // Invalidar caché de estadísticas mensuales para actualizar el recaudo en el perfil
            this.workerService.invalidateCache('stats');
            
            // Mostrar estado de éxito en el botón
            this.reportSuccess.set(true);
            this.isSubmitting.set(false);
            
            // Esperar un momento para mostrar el check (micro-éxito)
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Activar expansión
            this.expanding.set(true);
            
            // Esperar un momento para que la expansión comience
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Generar ID de referencia (usar ID del registro o generar uno)
            const recordId = createdRecord?.id 
              ? `REF-${new Date().getFullYear()}-${createdRecord.id}` 
              : null;
            
            // Navegar con datos de transición
            this.router.navigate(['/trabajador/reporte-exito'], {
              state: { 
                transitionData,
                reportData: {
                  amount: amount,
                  fuelLiters: fuelLiters,
                  fuelCost: fuelCost,
                  fecha: fecha
                },
                recordId: recordId
              }
            });
            resolve();
          },
          error: (error) => {
            console.error('Error al enviar reporte:', error);
            this.isSubmitting.set(false);
            this.reportSuccess.set(false);
            this.expanding.set(false);
            this.hasError.set(true);
            
            // Obtener mensaje de error específico
            const errorMessage = this.getErrorMessage(error);
            this.showErrorToast(errorMessage);
            
            // Resetear estado de error después de la animación
            setTimeout(() => {
              this.hasError.set(false);
            }, 2000);
            
            reject(error);
          }
        });
      });
    };

    // Si hay archivo, subirlo primero
    if (this.evidenceFile()) {
      try {
        const file = this.evidenceFile()!;
        
        // Opcional: Comprimir antes de subir (mejora UX en conexiones lentas)
        const compressedFile = await this.storageService.compressImage(file);
        
        // Obtener choferId del usuario actual
        const currentUser = this.authService.currentUser();
        const choferId = currentUser?.choferId;
        
        if (!choferId) {
          throw new Error('No se pudo obtener el ID del chofer');
        }

        // Subir imagen con progreso
        const uploadResult = await new Promise<UploadResult>((resolve, reject) => {
          this.storageService.uploadDailyRecordImage(
            compressedFile,
            choferId,
            fecha,
            (progress) => {
              this.uploadProgress.set(progress);
            }
          ).subscribe({
            next: (result) => {
              this.uploadProgress.set(null); // Limpiar progreso
              console.log('✅ Imagen subida exitosamente:', result);
              resolve(result);
            },
            error: (error) => {
              this.uploadProgress.set(null); // Limpiar progreso
              reject(error);
            }
          });
        });

        // Crear registro con la URL de la imagen subida
        console.log('📤 URL de imagen a guardar:', uploadResult.url);
        await createRecord(uploadResult.url);
      } catch (error: any) {
        console.error('Error al subir imagen:', error);
        this.isSubmitting.set(false);
        this.hasError.set(true);
        this.uploadProgress.set(null);
        this.showErrorToast(error.message || 'Error al subir la imagen');
        return;
      }
    } else {
      // No hay archivo, crear registro con imagen_url vacío
      try {
        await createRecord('');
      } catch (error: any) {
        console.error('Error al crear registro:', error);
        this.isSubmitting.set(false);
        this.hasError.set(true);
        this.showErrorToast(this.getErrorMessage(error));
        return;
      }
    }

  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      // Validación inmediata
      const validationError = this.validateImageFile(file);
      if (validationError) {
        this.showErrorToast(validationError);
        input.value = '';
        return;
      }

      this.evidenceName.set(file.name);
      this.evidenceFile.set(file);

      // Generar preview inmediato
      this.storageService.createPreviewUrl(file).subscribe({
        next: (previewUrl) => {
          this.imagePreview.set(previewUrl);
        },
        error: (error) => {
          console.error('Error generando preview:', error);
        }
      });
    } else {
      this.evidenceName.set('');
      this.evidenceFile.set(null);
      this.imagePreview.set(null);
    }
  }

  private validateImageFile(file: File): string | null {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return 'Solo se permiten archivos de imagen (JPG, PNG, WebP, JFIF)';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
    }

    return null;
  }

  removeImage(): void {
    this.evidenceFile.set(null);
    this.evidenceName.set('');
    this.imagePreview.set(null);
    // Resetear el input file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  preventInvalidNumberInput(event: KeyboardEvent): void {
    // Prevenir entrada de 'e', 'E', '+', '-' (no permitimos números negativos)
    const invalidKeys = ['e', 'E', '+', '-'];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }
  }

  private getErrorMessage(error: any): string {
    // Error de red (sin conexión)
    if (!error.status || error.status === 0) {
      return 'No hay conexión a internet. Verifica tu conexión e intenta nuevamente.';
    }
    
    // Error 400 (Bad Request) - Validación
    if (error.status === 400) {
      const errorDetail = error.error?.detail || error.error?.message;
      if (errorDetail) {
        return `Error de validación: ${errorDetail}`;
      }
      return 'Los datos enviados no son válidos. Por favor, revisa el formulario.';
    }
    
    // Error 401 (Unauthorized)
    if (error.status === 401) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    
    // Error 403 (Forbidden)
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    
    // Error 500 (Server Error)
    if (error.status === 500) {
      return 'Error en el servidor. Por favor, intenta nuevamente en unos momentos.';
    }
    
    // Error 503 (Service Unavailable)
    if (error.status === 503) {
      return 'El servicio no está disponible temporalmente. Intenta más tarde.';
    }
    
    // Error genérico
    return 'Error al enviar el reporte. Por favor, intenta nuevamente.';
  }

  private showErrorToast(message: string): void {
    // Crear toast usando DaisyUI
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end z-[100]';
    toast.innerHTML = `
      <div class="alert alert-error shadow-lg animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <h3 class="font-bold">Error al enviar reporte</h3>
          <div class="text-xs">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Remover después de 4 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 300ms ease-out';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
}
