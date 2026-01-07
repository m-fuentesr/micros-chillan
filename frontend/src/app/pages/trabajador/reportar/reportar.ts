import { Component, inject, ChangeDetectionStrategy, signal, OnInit, effect, computed, ViewChild, ElementRef } from '@angular/core';
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
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import type { CreateDailyRecordDto } from '../../../shared/models/daily-record.models';
import { StorageService, UploadResult } from '../../../shared/services/storage.service';
import type { MachineSelect } from '../../../shared/models/machine.models';

@Component({
  selector: 'app-reportar',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingSkeleton, UiIconComponent],
  template: `
    <div class="reportar-background-enter bg-slate-50 font-sans">
      <header 
        class="reportar-header-enter bg-gradient-to-br from-blue-600 to-indigo-800 pt-12 pb-24 px-6 relative overflow-hidden shadow-lg rounded-b-3xl"
        [class.reportar-header-fade-out]="expanding()"
      >
        <a
          routerLink="/trabajador"
          class="absolute top-12 left-6 btn btn-circle btn-ghost text-white hover:bg-white/20 z-20"
          aria-label="Volver"
        >
          <ui-icon name="ChevronLeft" size="md" />
        </a>

        <div class="relative z-10 text-left pl-20 pr-4 border-l-4 border-l-white/30">
          <p class="text-blue-200 text-xs font-bold uppercase tracking-[0.35em] mb-1">Nuevo registro</p>
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Reporte diario</h1>
        </div>
        <div
          class="absolute top-0 left-0 w-full h-full opacity-10 rounded-b-3xl overflow-hidden pointer-events-none"
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
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shadow-inner">
              <ui-icon name="BusFront" size="lg" class="text-blue-600" />
            </div>
            <div class="flex-1">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Máquina asignada</label>
              <div class="relative">
                <select 
                  class="machine-select-premium appearance-none bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl px-4 py-3 pr-10 font-bold text-slate-800 text-base w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-2 border-transparent transition-all cursor-pointer"
                  formControlName="machine"
                >
                  <option [value]="null" disabled selected>Selecciona una máquina</option>
                  @for (machine of sortedMachines(); track machine.id) {
                    <option [value]="machine.id">{{ machine.display_name }}</option>
                  }
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 transition-transform">
                  <ui-icon name="ChevronDown" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 border-l-4 border-emerald-500 relative overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all" [style.animation-delay.ms]="300">
          <label class="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-[0.35em] mb-2">
            <ui-icon name="Wallet" size="xs" />
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
              max="999999"
              (keydown)="preventInvalidNumberInput($event)"
              (input)="limitAmountDigits($event)"
            />
          </div>
          <p class="text-xs text-slate-400 mt-2">Ingresa el monto final del día.</p>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="400">
          <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <ui-icon name="Droplet" size="xs" />
            </div>
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
                  [class.border-2]="reportForm.get('fuelLiters')?.invalid && reportForm.get('fuelLiters')?.touched"
                  [class.border-red-500]="reportForm.get('fuelLiters')?.invalid && reportForm.get('fuelLiters')?.touched"
                  max="999"
                  (keydown)="preventInvalidNumberInput($event)"
                  (input)="limitFieldDigits($event, 'fuelLiters', 3)"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">L</span>
              </div>
              @if (reportForm.get('fuelLiters')?.errors?.['fuelCoherence'] && reportForm.get('fuelLiters')?.touched) {
                <p class="text-xs text-red-600 font-semibold ml-1">{{ reportForm.get('fuelLiters')?.errors?.['fuelCoherence']?.message }}</p>
              }
            </div>
            <div class="space-y-2">
              <label class="text-xs text-slate-400 font-normal ml-1">Costo total</label>
              <div class="relative">
                <input
                  type="number"
                  formControlName="fuelCost"
                  placeholder="0"
                  class="w-full bg-slate-50 rounded-xl pl-8 pr-4 py-3 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-left"
                  [class.border-2]="reportForm.get('fuelCost')?.invalid && reportForm.get('fuelCost')?.touched"
                  [class.border-red-500]="reportForm.get('fuelCost')?.invalid && reportForm.get('fuelCost')?.touched"
                  max="999999"
                  (keydown)="preventInvalidNumberInput($event)"
                  (input)="limitFieldDigits($event, 'fuelCost', 6)"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
              </div>
              @if (reportForm.get('fuelCost')?.errors?.['fuelCoherence'] && reportForm.get('fuelCost')?.touched) {
                <p class="text-xs text-red-600 font-semibold ml-1">{{ reportForm.get('fuelCost')?.errors?.['fuelCoherence']?.message }}</p>
              }
            </div>
          </div>
        </div>

        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="500">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.35em] mb-3">
            <ui-icon name="Camera" size="xs" />
            Foto del comprobante del registro diario *
          </label>

          <!-- Preview de imagen -->
          @if (imagePreview()) {
            <div class="mb-4 relative rounded-xl overflow-hidden border-2 border-blue-200">
              <img [src]="imagePreview()!" alt="Preview comprobante registro" class="w-full h-48 object-cover" />
              <button
                type="button"
                (click)="removeImage()"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                aria-label="Eliminar imagen"
                [disabled]="isSubmitting()"
              >
                <ui-icon name="X" size="xs" />
              </button>
            </div>
          }

          <!-- Input de archivo -->
          <label class="block w-full aspect-[3/1] border-2 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden" 
            [class.border-red-500]="showPhotoError() && !imagePreview()"
            [class.bg-red-50]="showPhotoError() && !imagePreview()"
            [class.border-slate-300]="!showPhotoError() || imagePreview()"
            [class.hover:border-blue-400]="!showPhotoError() || imagePreview()"
            [class.opacity-50]="isSubmitting()" 
            [class.cursor-not-allowed]="isSubmitting()">
            <input 
              type="file" 
              class="hidden" 
              accept="image/*" 
              (change)="onEvidenceSelected($event)"
              [disabled]="isSubmitting()"
            />
            <div class="absolute inset-0 flex flex-col items-center justify-center transition-colors"
              [class.text-slate-400]="!showPhotoError() || imagePreview()"
              [class.text-red-600]="showPhotoError() && !imagePreview()"
              [class.hover:text-blue-500]="!showPhotoError() || imagePreview()">
              @if (!imagePreview()) {
                <ui-icon name="Camera" size="lg" class="mb-1" />
                <span class="text-xs font-bold uppercase">Tomar foto</span>
              } @else {
                <span class="text-xs font-bold uppercase text-blue-600">Cambiar imagen</span>
              }
            </div>
          </label>
          @if (showPhotoError() && !imagePreview()) {
            <p class="text-xs text-red-600 font-semibold mt-2 ml-1">Campo requerido</p>
          }
        </div>

        <!-- Comprobante de combustible (opcional) -->
        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="550">
          <div class="flex items-center gap-2 mb-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.35em]">
              <ui-icon name="Camera" size="xs" />
              Foto del comprobante de combustible
            </label>
            <span class="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Opcional</span>
          </div>

          <!-- Preview de imagen combustible -->
          @if (dieselImagePreview()) {
            <div class="mb-4 relative rounded-xl overflow-hidden border-2 border-amber-200">
              <img [src]="dieselImagePreview()!" alt="Preview comprobante combustible" class="w-full h-48 object-cover" />
              <button
                type="button"
                (click)="removeDieselImage()"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                aria-label="Eliminar imagen"
                [disabled]="isSubmitting()"
              >
                <ui-icon name="X" size="xs" />
              </button>
            </div>
          }

          <!-- Input de archivo combustible -->
          <label class="block w-full aspect-[3/1] border-2 border-dashed rounded-xl transition-colors cursor-pointer relative overflow-hidden" 
            [class.border-amber-400]="shouldShowDieselPhotoWarning()"
            [class.bg-amber-50]="shouldShowDieselPhotoWarning()"
            [class.border-slate-300]="!shouldShowDieselPhotoWarning()"
            [class.bg-slate-50]="!shouldShowDieselPhotoWarning()"
            [class.hover:bg-slate-100]="!shouldShowDieselPhotoWarning()"
            [class.hover:border-amber-400]="!shouldShowDieselPhotoWarning() || shouldShowDieselPhotoWarning()"
            [class.opacity-50]="isSubmitting()" 
            [class.cursor-not-allowed]="isSubmitting()">
            <input 
              type="file" 
              class="hidden" 
              accept="image/*" 
              (change)="onDieselEvidenceSelected($event)"
              [disabled]="isSubmitting()"
            />
            <div class="absolute inset-0 flex flex-col items-center justify-center transition-colors"
              [class.text-slate-400]="!shouldShowDieselPhotoWarning()"
              [class.text-amber-600]="shouldShowDieselPhotoWarning()"
              [class.hover:text-amber-500]="true">
              @if (!dieselImagePreview()) {
                <ui-icon name="Camera" size="lg" class="mb-1" />
                <span class="text-xs font-bold uppercase">Tomar foto del comprobante</span>
              } @else {
                <span class="text-xs font-bold uppercase text-amber-600">Cambiar imagen</span>
              }
            </div>
          </label>
          @if (shouldShowDieselPhotoWarning()) {
            <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <ui-icon name="TriangleAlert" size="xs" />
                Advertencia: Has declarado gasto de combustible pero no has adjuntado el comprobante. Se recomienda agregarlo.
              </p>
            </div>
          }
        </div>

        <!-- ¿Hubo incidente? - Movido antes de observaciones (TC-24) -->
        <div class="reportar-field-enter bg-red-50 rounded-2xl border border-red-100 p-4 flex items-center justify-between" [style.animation-delay.ms]="600">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm">
              <ui-icon name="TriangleAlert" size="sm" />
            </div>
            <div>
              <p class="text-sm font-bold text-red-800">¿Hubo incidente?</p>
              <p class="text-[10px] text-red-600/70">Choque, falla mecánica, etc.</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" formControlName="incident" (change)="onIncidentToggle()" />
            <div class="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <!-- Observaciones - Ahora después de incidente (TC-24) -->
        <div class="reportar-field-enter bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5" [style.animation-delay.ms]="650">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.35em] mb-3">
            <ui-icon name="FileText" size="xs" />
            Observaciones
            @if (reportForm.get('incident')?.value) {
              <span class="text-red-600">*</span>
            }
          </label>
          <textarea
            placeholder="Observaciones o notas adicionales..."
            formControlName="notes"
            class="w-full bg-slate-50 rounded-xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
            [class.border-2]="reportForm.get('notes')?.invalid && reportForm.get('notes')?.touched"
            [class.border-red-500]="reportForm.get('notes')?.invalid && reportForm.get('notes')?.touched"
            rows="3"
          ></textarea>
          @if (reportForm.get('notes')?.errors?.['required'] && reportForm.get('notes')?.touched) {
            <p class="text-xs text-red-600 font-semibold mt-2 ml-1">Las observaciones son obligatorias cuando hay un incidente</p>
          }
        </div>

        <div
          class="reportar-button-enter p-4 bg-white rounded-2xl shadow-xl shadow-blue-900/5"
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
                  <ui-icon name="Check" size="lg" class="checkmark-premium" />
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
      
      <!-- Modal de Error para errores críticos (duplicados, etc.) -->
      <dialog #errorModal class="modal" [class.modal-open]="showErrorModal()">
        <form method="dialog" class="modal-box" (submit)="closeErrorModal()">
          <h3 class="font-bold text-lg text-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Error al crear registro
          </h3>
          <p class="py-4 text-base-content whitespace-pre-line">{{ errorModalMessage() }}</p>
          <div class="modal-action">
            <button type="submit" class="btn btn-primary" (click)="closeErrorModal()">Entendido</button>
          </div>
        </form>
        <form method="dialog" class="modal-backdrop" (click)="closeErrorModal()">
          <button type="button">Cerrar</button>
        </form>
      </dialog>
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
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .checkmark-premium {
      width: 28px;
      height: 28px;
      color: white;
      animation: checkmarkScaleReportar 600ms var(--button-ease-elastic) 100ms forwards;
      transform: scale(0);
    }

    @keyframes checkmarkScaleReportar {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
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

  // Imagen del comprobante del registro diario (obligatorio)
  evidenceName = signal('');
  evidenceFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  showPhotoError = signal(false); // Para mostrar error visual cuando falta la foto
  
  // Imagen del comprobante de diesel (opcional)
  dieselEvidenceName = signal('');
  dieselEvidenceFile = signal<File | null>(null);
  dieselImagePreview = signal<string | null>(null);
  
  uploadProgress = signal<{ loaded: number; total: number; percentage: number } | null>(null);
  isSubmitting = signal(false);
  reportSuccess = signal(false);
  expanding = signal(false);
  hasError = signal(false);
  
  // Modal de error
  @ViewChild('errorModal') errorModalRef!: ElementRef<HTMLDialogElement>;
  showErrorModal = signal(false);
  errorModalMessage = signal('');
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

  // Obtener perfil del trabajador para saber la máquina asignada
  workerProfile = toSignal(
    this.workerService.getProfile().pipe(
      catchError(() => {
        return of(null);
      })
    ),
    { initialValue: null }
  );

  // Máquinas ordenadas: primero la asignada al chofer, luego las demás
  sortedMachines = computed(() => {
    const allMachines = this.machines();
    const profile = this.workerProfile();
    
    if (allMachines.length === 0) {
      return [];
    }

    // Si no hay perfil o no tiene máquina asignada, retornar las máquinas tal cual
    if (!profile || !profile.maquina_detalle || profile.maquina_detalle === 'Sin Asignar') {
      return allMachines;
    }

    // Extraer el número de máquina del maquina_detalle
    // Formato del backend: "20 - Mercedes-Benz" (número antes del primer guion)
    const maquinaDetalle = profile.maquina_detalle.trim();
    const match = maquinaDetalle.match(/^(\d+)\s*-\s*/);
    
    if (!match) {
      // Si no se puede extraer el número, retornar las máquinas tal cual
      console.warn('No se pudo extraer el número de máquina del formato:', maquinaDetalle);
      return allMachines;
    }

    const numeroAsignado = match[1];
    
    // Buscar la máquina asignada por numero_interno (es un string)
    const assignedMachineIndex = allMachines.findIndex(
      m => String(m.numero_interno) === String(numeroAsignado)
    );

    if (assignedMachineIndex === -1) {
      // Si no se encuentra la máquina asignada en la lista, retornar las máquinas tal cual
      console.warn('Máquina asignada no encontrada en la lista de máquinas activas:', numeroAsignado);
      return allMachines;
    }

    // Reordenar: poner la máquina asignada primero
    const sorted = [...allMachines];
    const [assignedMachine] = sorted.splice(assignedMachineIndex, 1);
    return [assignedMachine, ...sorted];
  });

  // Effect como inicializador de campo (contexto de inyección válido)
  private machinesEffect = effect(() => {
    // Monitorear cuando el observable emite
    if (this.machinesEmitted() && this.machinesLoadingState.isLoading()) {
      this.machinesLoadingState.setDataLoaded();
      
      // Establecer máquina por defecto: primero la asignada, si no hay ninguna asignada, la primera disponible
      const sortedMachines = this.sortedMachines();
      if (sortedMachines.length > 0) {
        this.reportForm.patchValue({ machine: sortedMachines[0].id });
      }
    }
  });

  /**
   * Validador de coherencia de combustible (TC-21)
   * Si hay litros > 0, entonces costo > 0 es requerido
   * Si hay costo > 0, entonces litros > 0 es requerido
   */
  private fuelCoherenceValidator(fieldType: 'liters' | 'cost') {
    return (control: any) => {
      const form = control.parent;
      if (!form) {
        return null;
      }

      const fuelLiters = form.get('fuelLiters')?.value;
      const fuelCost = form.get('fuelCost')?.value;

      // Si ambos están vacíos, es válido (combustible es opcional)
      if ((!fuelLiters || fuelLiters === 0) && (!fuelCost || fuelCost === 0)) {
        return null;
      }

      // Si hay litros > 0 pero costo es 0 o vacío
      if (fieldType === 'cost' && fuelLiters > 0 && (!fuelCost || fuelCost === 0)) {
        return { fuelCoherence: { message: 'Si ingresas litros, debes ingresar el costo total' } };
      }

      // Si hay costo > 0 pero litros es 0 o vacío
      if (fieldType === 'liters' && fuelCost > 0 && (!fuelLiters || fuelLiters === 0)) {
        return { fuelCoherence: { message: 'Si ingresas costo, debes ingresar los litros' } };
      }

      return null;
    };
  }

  private maxDigitsValidator(maxDigits: number) {
    return (control: any) => {
      if (!control.value) {
        return null; // Permitir valores vacíos, el required se encarga de eso
      }
      
      const value = control.value.toString().replace(/[^0-9]/g, '');
      if (value.length > maxDigits) {
        return { maxDigits: { maxDigits, actual: value.length } };
      }
      
      return null;
    };
  }

  // Effect para actualizar validación de combustible cuando cambian los valores
  private fuelValidationEffect = effect(() => {
    // Suscribirse a cambios en fuelLiters y fuelCost para actualizar validación cruzada
    const fuelLitersControl = this.reportForm.get('fuelLiters');
    const fuelCostControl = this.reportForm.get('fuelCost');
    
    if (fuelLitersControl && fuelCostControl) {
      // Cuando cambia fuelLiters, actualizar validación de fuelCost
      fuelLitersControl.valueChanges.subscribe(() => {
        fuelCostControl.updateValueAndValidity();
      });
      
      // Cuando cambia fuelCost, actualizar validación de fuelLiters
      fuelCostControl.valueChanges.subscribe(() => {
        fuelLitersControl.updateValueAndValidity();
      });
    }
  });

  // Effect para validación condicional de observaciones cuando hay incidente (TC-24)
  private incidentValidationEffect = effect(() => {
    const incidentControl = this.reportForm.get('incident');
    const notesControl = this.reportForm.get('notes');
    
    if (incidentControl && notesControl) {
      // Suscribirse a cambios en el toggle de incidente
      incidentControl.valueChanges.subscribe((hasIncident) => {
        if (hasIncident) {
          // Si hay incidente, hacer observaciones obligatorias
          notesControl.setValidators([Validators.required]);
        } else {
          // Si no hay incidente, quitar validación requerida
          notesControl.clearValidators();
        }
        notesControl.updateValueAndValidity();
      });
    }
  });

  // Computed: Detectar si hay gasto de combustible sin foto (TC-23)
  // Se actualiza inmediatamente cuando el usuario escribe en los campos (en tiempo real)
  shouldShowDieselPhotoWarning = computed(() => {
    // Usar los signals reactivos que se actualizan en tiempo real mientras el usuario escribe
    const fuelCost = this.fuelCostValue();
    const fuelLiters = this.fuelLitersValue();
    const hasDieselFile = this.dieselEvidenceFile() !== null;
    
    // Mostrar advertencia si hay gasto de combustible pero no hay foto
    // Se muestra inmediatamente cuando el usuario escribe (sin necesidad de hacer blur)
    const hasFuelCost = fuelCost !== null && fuelCost > 0;
    const hasFuelLiters = fuelLiters !== null && fuelLiters > 0;
    
    return (hasFuelCost || hasFuelLiters) && !hasDieselFile;
  });

  reportForm = this.fb.group({
    machine: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, this.maxDigitsValidator(6)]],
    fuelLiters: [null as number | null, [this.maxDigitsValidator(3), this.fuelCoherenceValidator('liters')]],
    fuelCost: [null as number | null, [this.maxDigitsValidator(6), this.fuelCoherenceValidator('cost')]],
    notes: [''],
    incident: [false],
  });

  // Signals reactivos para los valores de combustible (se actualizan en tiempo real mientras el usuario escribe)
  // Estos signals se actualizan inmediatamente cuando el usuario escribe en los campos
  fuelCostValue = toSignal(
    this.reportForm.get('fuelCost')?.valueChanges ?? of(null),
    { initialValue: this.reportForm.get('fuelCost')?.value ?? null }
  );
  
  fuelLitersValue = toSignal(
    this.reportForm.get('fuelLiters')?.valueChanges ?? of(null),
    { initialValue: this.reportForm.get('fuelLiters')?.value ?? null }
  );

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
      
      // Mostrar mensaje específico si hay error de coherencia de combustible
      const fuelLitersError = this.reportForm.get('fuelLiters')?.errors?.['fuelCoherence'];
      const fuelCostError = this.reportForm.get('fuelCost')?.errors?.['fuelCoherence'];
      if (fuelLitersError || fuelCostError) {
        const errorMessage = fuelLitersError?.message || fuelCostError?.message || 'Los datos de combustible deben ser coherentes';
        this.showErrorToast(errorMessage);
        return;
      }
      
      // Mostrar mensaje específico si hay incidente pero no hay observaciones (TC-24)
      const hasIncident = this.reportForm.get('incident')?.value === true;
      const notesError = this.reportForm.get('notes')?.errors?.['required'];
      if (hasIncident && notesError) {
        this.showErrorToast('Las observaciones son obligatorias cuando hay un incidente');
        // Scroll suave al campo de observaciones
        setTimeout(() => {
          const notesField = document.querySelector('[formcontrolname="notes"]');
          if (notesField) {
            notesField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
      
      return;
    }

    // Validar que haya foto del comprobante (obligatorio) - TC-22
    if (!this.evidenceFile()) {
      this.isSubmitting.set(false);
      this.showPhotoError.set(true); // Mostrar error visual
      this.showErrorToast('Debes adjuntar una foto del comprobante');
      // Scroll suave al campo de foto para que el usuario vea el error
      setTimeout(() => {
        const photoField = document.querySelector('[formcontrolname="photo"]') || 
                          document.querySelector('label[for*="photo"]') ||
                          document.querySelector('.reportar-field-enter:nth-of-type(4)');
        if (photoField) {
          photoField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    // Si hay foto, ocultar el error
    this.showPhotoError.set(false);

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

    // Función para crear el registro después de subir las imágenes (si es necesario)
    const createRecord = (imagenRegistroUrl: string, imagenDieselUrl?: string): Promise<void> => {
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
        // Comprobante del registro diario (obligatorio)
        comprobante_registro: {
          imagen: imagenRegistroUrl
        },
        // Comprobante de diesel (opcional) - solo si hay imagen o fuelCost
        comprobante_diesel: (fuelCost || imagenDieselUrl) ? {
          monto: fuelCost || 0,
          imagen: imagenDieselUrl || undefined
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
            
            // Detectar si es un error crítico (duplicado de máquina) para mostrar en modal
            const errorDetail = error?.error?.detail || error?.error?.message || '';
            const isCriticalError = typeof errorDetail === 'string' && (
              errorDetail.includes('Ya existe un registro para') ||
              errorDetail.includes('máquina') && errorDetail.includes('fecha') ||
              errorDetail.includes('No se puede facturar dos veces')
            );
            
            if (isCriticalError) {
              // Mostrar en modal para errores críticos
              this.errorModalMessage.set(errorMessage);
              this.showErrorModal.set(true);
              // Abrir el modal usando la API nativa
              setTimeout(() => {
                if (this.errorModalRef?.nativeElement) {
                  this.errorModalRef.nativeElement.showModal();
                }
              }, 100);
            } else {
              // Mostrar toast para errores no críticos
              this.showErrorToast(errorMessage);
            }
            
            // Resetear estado de error después de la animación
            setTimeout(() => {
              this.hasError.set(false);
            }, 2000);
            
            reject(error);
          }
        });
      });
    };

    // Subir imágenes si existen
    try {
      // Obtener choferId del usuario actual
      const currentUser = this.authService.currentUser();
      const choferId = currentUser?.choferId;
      
      if (!choferId) {
        throw new Error('No se pudo obtener el ID del chofer');
      }

      let imagenRegistroUrl = '';
      let imagenDieselUrl: string | undefined = undefined;

      // Subir imagen del comprobante del registro diario (obligatorio)
      if (this.evidenceFile()) {
        const file = this.evidenceFile()!;
        const compressedFile = await this.storageService.compressImage(file);
        
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
              this.uploadProgress.set(null);
              console.log('✅ Imagen del registro subida exitosamente:', result);
              resolve(result);
            },
            error: (error) => {
              this.uploadProgress.set(null);
              reject(error);
            }
          });
        });
        
        imagenRegistroUrl = uploadResult.url;
      }

      // Subir imagen del comprobante de diesel (opcional)
      if (this.dieselEvidenceFile()) {
        const dieselFile = this.dieselEvidenceFile()!;
        const compressedDieselFile = await this.storageService.compressImage(dieselFile);
        
        const dieselUploadResult = await new Promise<UploadResult>((resolve, reject) => {
          this.storageService.uploadDailyRecordImage(
            compressedDieselFile,
            choferId,
            fecha,
            (progress) => {
              // Usar el mismo progreso para no confundir al usuario
              this.uploadProgress.set(progress);
            }
          ).subscribe({
            next: (result) => {
              this.uploadProgress.set(null);
              console.log('✅ Imagen del comprobante diesel subida exitosamente:', result);
              resolve(result);
            },
            error: (error) => {
              this.uploadProgress.set(null);
              reject(error);
            }
          });
        });
        
        imagenDieselUrl = dieselUploadResult.url;
      }

      // Crear registro con las URLs de las imágenes subidas
      console.log('📤 URLs a guardar - Registro:', imagenRegistroUrl, 'Diesel:', imagenDieselUrl);
      await createRecord(imagenRegistroUrl, imagenDieselUrl);
    } catch (error: any) {
      console.error('Error al subir imágenes o crear registro:', error);
      this.isSubmitting.set(false);
      this.hasError.set(true);
      this.uploadProgress.set(null);
      
      // Verificar si es un error crítico (duplicado)
      const errorMessage = error?.error?.detail || error?.message || 'Error al subir las imágenes';
      const isCriticalError = typeof errorMessage === 'string' && (
        errorMessage.includes('Ya existe un registro para') ||
        errorMessage.includes('máquina') && errorMessage.includes('fecha') ||
        errorMessage.includes('No se puede facturar dos veces')
      );
      
      if (isCriticalError) {
        // Mostrar en modal para errores críticos
        this.errorModalMessage.set(errorMessage);
        this.showErrorModal.set(true);
        setTimeout(() => {
          if (this.errorModalRef?.nativeElement) {
            this.errorModalRef.nativeElement.showModal();
          }
        }, 100);
      } else {
        // Mostrar toast para errores no críticos
        this.showErrorToast(errorMessage);
      }
      return;
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
      this.showPhotoError.set(false); // Ocultar error cuando se selecciona una foto

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
    // Resetear el input file del comprobante del registro
    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    if (inputs.length > 0) {
      inputs[0].value = '';
    }
  }

  // Método para manejar el toggle de incidente (TC-24)
  onIncidentToggle(): void {
    const incidentControl = this.reportForm.get('incident');
    const notesControl = this.reportForm.get('notes');
    
    if (!incidentControl || !notesControl) return;
    
    const hasIncident = incidentControl.value === true;
    
    if (hasIncident) {
      // Si hay incidente, hacer observaciones obligatorias
      notesControl.setValidators([Validators.required]);
      notesControl.updateValueAndValidity();
    } else {
      // Si no hay incidente, quitar validación requerida
      notesControl.clearValidators();
      notesControl.updateValueAndValidity();
    }
  }

  onDieselEvidenceSelected(event: Event): void {
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

      this.dieselEvidenceName.set(file.name);
      this.dieselEvidenceFile.set(file);

      // Generar preview inmediato
      this.storageService.createPreviewUrl(file).subscribe({
        next: (previewUrl) => {
          this.dieselImagePreview.set(previewUrl);
        },
        error: (error) => {
          console.error('Error generando preview:', error);
        }
      });
    } else {
      this.dieselEvidenceName.set('');
      this.dieselEvidenceFile.set(null);
      this.dieselImagePreview.set(null);
    }
  }

  removeDieselImage(): void {
    this.dieselEvidenceFile.set(null);
    this.dieselEvidenceName.set('');
    this.dieselImagePreview.set(null);
    // Resetear el input file del comprobante de diesel
    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    if (inputs.length > 1) {
      inputs[1].value = '';
    }
  }

  preventInvalidNumberInput(event: KeyboardEvent): void {
    // Prevenir entrada de 'e', 'E', '+', '-' (no permitimos números negativos)
    const invalidKeys = ['e', 'E', '+', '-'];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevenir entrada según el límite de dígitos del campo (excepto teclas de control)
    const input = event.target as HTMLInputElement;
    const formControlName = input.getAttribute('formcontrolname');
    const currentValue = input.value || '';
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    // Determinar el límite según el campo
    let maxDigits = 6; // Por defecto
    if (formControlName === 'fuelLiters') {
      maxDigits = 3;
    } else if (formControlName === 'fuelCost' || formControlName === 'amount') {
      maxDigits = 6;
    }
    
    if (!controlKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
      // Si el valor actual tiene el máximo de dígitos y no es una tecla de control, prevenir entrada
      const digitsOnly = currentValue.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= maxDigits && /[0-9]/.test(event.key)) {
        event.preventDefault();
        return;
      }
    }
  }

  limitAmountDigits(event: Event): void {
    this.limitFieldDigits(event, 'amount', 6);
  }

  limitFieldDigits(event: Event, fieldName: 'amount' | 'fuelLiters' | 'fuelCost', maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, ''); // Solo números
    
    // Limitar a maxDigits dígitos
    if (value.length > maxDigits) {
      value = value.substring(0, maxDigits);
    }
    
    // Actualizar el valor del input y del formulario
    const numericValue = value === '' ? null : parseInt(value, 10);
    input.value = value === '' ? '' : value;
    this.reportForm.patchValue({ [fieldName]: numericValue }, { emitEvent: false });
  }

  private getErrorMessage(error: any): string {
    // Error de red (sin conexión)
    if (!error.status || error.status === 0) {
      return 'No hay conexión a internet. Verifica tu conexión e intenta nuevamente.';
    }
    
    // Error 422 (Unprocessable Entity) - Validación de Pydantic (TC-27)
    if (error.status === 422) {
      const detail = error.error?.detail;
      
      // Si detail es un array, son errores de validación de campos específicos
      if (Array.isArray(detail) && detail.length > 0) {
        const errorMessages: string[] = [];
        
        detail.forEach((err: any) => {
          const field = err.loc?.[err.loc.length - 1]; // Último elemento del path
          const message = err.msg || 'Campo inválido';
          
          // Mapear nombres de campos técnicos a nombres amigables
          const fieldNames: Record<string, string> = {
            'maquina_id': 'Máquina',
            'fecha': 'Fecha',
            'monto_recaudado': 'Monto recaudado',
            'litros_diesel': 'Litros de diésel',
            'costo_total_diesel': 'Costo de diésel',
            'imagen_url': 'Foto del comprobante',
            'imagen_comprobante_diesel_url': 'Foto del comprobante de combustible',
            'observaciones': 'Observaciones',
            'incidente_critico': 'Incidente crítico'
          };
          
          const friendlyFieldName = fieldNames[field] || field;
          
          // Mensajes más amigables según el tipo de error
          let friendlyMessage = message;
          if (message.includes('field required')) {
            friendlyMessage = `${friendlyFieldName} es obligatorio`;
          } else if (message.includes('value is not a valid')) {
            friendlyMessage = `${friendlyFieldName} tiene un formato inválido`;
          } else if (message.includes('cannot be negative')) {
            friendlyMessage = `${friendlyFieldName} no puede ser negativo`;
          } else if (message.includes('greater than')) {
            friendlyMessage = `${friendlyFieldName} debe ser mayor a 0`;
          }
          
          errorMessages.push(friendlyMessage);
        });
        
        // Si hay múltiples errores, mostrar los primeros 3
        if (errorMessages.length > 3) {
          return `${errorMessages.slice(0, 3).join('. ')}. Y ${errorMessages.length - 3} error(es) más.`;
        }
        
        return errorMessages.join('. ');
      }
      
      // Si detail es un string, es un mensaje de error general
      if (typeof detail === 'string') {
        return detail;
      }
      
      // Fallback para errores 422 sin formato esperado
      return 'Los datos enviados no son válidos. Por favor, revisa el formulario.';
    }
    
    // Error 400 (Bad Request) - Validación general
    if (error.status === 400) {
      const errorDetail = error.error?.detail || error.error?.message;
      if (errorDetail) {
        // Si es un string, mostrarlo directamente
        if (typeof errorDetail === 'string') {
          return errorDetail;
        }
        // Si es un objeto, intentar extraer el mensaje
        if (typeof errorDetail === 'object') {
          return errorDetail.message || JSON.stringify(errorDetail);
        }
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

  closeErrorModal(): void {
    this.showErrorModal.set(false);
    if (this.errorModalRef?.nativeElement) {
      this.errorModalRef.nativeElement.close();
    }
  }

  private showErrorToast(message: string): void {
    // Crear toast usando DaisyUI
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end z-[100]';
    toast.innerHTML = `
      <div class="alert alert-error shadow-lg animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="m15 9-6 6"/>
          <path d="m9 9 6 6"/>
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
