import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import { StorageService } from '../../shared/services/storage.service';
import { ImageModalService } from '../../shared/services/image-modal.service';
import type { DailyRecord, DailyRecordHistoryItem } from '../../shared/models/daily-record.models';
import { catchError, EMPTY, forkJoin, of, switchMap, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { BusIcon } from '../../shared/components/bus-icon/bus-icon';
import { DriverIcon } from '../../shared/components/driver-icon/driver-icon';

/**
 * Vista extendida de DailyRecord para uso en el detalle
 * Incluye campos formateados para display y compatibilidad con el template actual
 */
interface DailyRecordDetailView extends DailyRecord {
  // Campos de display (mapeados desde el modelo unificado)
  date: string; // fecha formateada
  machine: string; // maquina_identificador
  driver: string; // chofer_nombre
  income: number; // recaudado
  dieselExpense: number; // costo_diesel
  dieselLiters?: number; // litros_diesel (alias para compatibilidad con formulario)
  noWorkDay: boolean; // dia_no_trabajado
  noWorkDayReason?: string; // motivo_inactividad
  isEmergency?: boolean; // es_emergencia
  observations: string; // observaciones
  paymentBreakdown: {
    base: number;
    percentage: number;
    amount: number;
  }; // desglose_pago
  receipt?: {
    amount: number;
    uploadedAt?: string;
    imageUrl?: string;
  }; // comprobante_diesel
  comprobanteRegistro?: {  // Comprobante del registro diario
    imageUrl?: string;
    uploadedAt?: string;
  };
  history?: DailyRecordHistoryItem[]; // historial
}

@Component({
  selector: 'app-registro-diario-detail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgOptimizedImage, BusIcon, DriverIcon],
  template: `
    <main class="bg-base-200 min-h-screen">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        <!-- Hero alineado al estilo de flota/choferes -->
        @if (isLoading()) {
          <!-- Skeleton del Hero Section -->
          <section class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/60 rounded-2xl border border-base-200 shadow-sm p-5 sm:p-7 lg:p-8">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex-1 min-w-0 space-y-3">
                <!-- Skeleton: Breadcrumb -->
                <div class="flex items-center gap-2">
                  <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                  <div class="h-3 w-px bg-base-300"></div>
                  <div class="h-3 w-32 skeleton-shimmer rounded"></div>
                </div>

                <!-- Skeleton: Título y Badge -->
                <div class="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div class="h-8 w-8 skeleton-shimmer rounded-full"></div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <div class="h-8 sm:h-10 lg:h-12 w-40 skeleton-shimmer rounded"></div>
                    <div class="h-6 w-20 skeleton-shimmer rounded-full"></div>
                  </div>
                </div>

                <!-- Skeleton: Badges de información -->
                <div class="flex flex-wrap items-center gap-3">
                  <div class="h-7 w-24 skeleton-shimmer rounded-full"></div>
                  <div class="h-7 w-28 skeleton-shimmer rounded-full"></div>
                  <div class="h-7 w-32 skeleton-shimmer rounded-full"></div>
                </div>
              </div>

              <!-- Skeleton: Botón de acción -->
              <div class="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <div class="h-11 w-36 skeleton-shimmer rounded-lg"></div>
              </div>
            </div>
          </section>
        } @else {
          <section class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/60 rounded-2xl border border-base-200 shadow-sm p-5 sm:p-7 lg:p-8">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex-1 min-w-0 space-y-3">
                <div class="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                  <span class="text-primary">Registro diario</span>
                  <span class="h-3 w-px bg-primary/20"></span>
                  <span class="text-base-content/60">Detalle y edición</span>
                </div>

                <div class="flex flex-wrap items-center gap-3 sm:gap-4">
                  <button 
                    class="btn btn-circle btn-ghost btn-sm text-base-content/70 hover:bg-base-200/80 flex-shrink-0" 
                    (click)="goBack()"
                    type="button"
                    aria-label="Volver">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>

                  <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content tracking-tight">
                      Registro #{{ record()?.id || '--' }}
                    </h1>
                    @if (isIncidente()) {
                      <span class="inline-flex items-center gap-2 rounded-full bg-error/10 text-error px-3 py-1 text-xs sm:text-sm font-semibold border border-error/20 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        Incidente
                      </span>
                    } @else if (isCompleto()) {
                      <span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs sm:text-sm font-semibold border border-emerald-100 shadow-sm">✓ Completo</span>
                    } @else {
                      <span class="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs sm:text-sm font-semibold border border-amber-100 shadow-sm">⏳ Pendiente</span>
                    }
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-base-content/70">
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-100 border border-base-200 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/>
                    </svg>
                    {{ record()?.date }}
                  </span>
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-100 border border-base-200 shadow-sm">
                    <app-bus-icon class="w-4 h-4 text-primary/80"></app-bus-icon>
                    {{ record()?.machine }}
                  </span>
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-100 border border-base-200 shadow-sm">
                    <app-driver-icon class="w-4 h-4 text-primary/80"></app-driver-icon>
                    {{ record()?.driver }}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">
                @if (!isEditMode()) {
                  <button 
                    class="btn bg-primary text-primary-content border-none hover:bg-primary-focus h-11 px-5 gap-2 rounded-lg shadow-lg shadow-primary/25" 
                    (click)="enableEditMode()"
                    type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                    </svg>
                    <span>Editar registro</span>
                  </button>
                } @else {
                  <button 
                    class="btn btn-ghost border border-base-300 h-11 px-4 rounded-lg" 
                    (click)="cancelEdit()"
                    type="button">Cancelar</button>
                  <button 
                    class="btn bg-success text-white h-11 px-5 gap-2 rounded-lg shadow-lg shadow-success/25" 
                    (click)="saveRecord()"
                    [disabled]="recordForm.invalid"
                    type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg>
                    <span>Guardar cambios</span>
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <div class="space-y-6 sm:space-y-8">
        @if (isLoading()) {
          <!-- Skeleton que coincide con la estructura de la página -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <!-- Columna Principal (2/3) -->
            <div class="lg:col-span-2 space-y-4 sm:space-y-6">
              <!-- Skeleton: Toggle Día No Trabajado -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5 lg:p-6">
                  <div class="flex items-center gap-3">
                    <div class="h-6 w-6 skeleton-shimmer rounded"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-5 w-3/4 skeleton-shimmer rounded"></div>
                      <div class="h-4 w-full skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Skeleton: Información Financiera -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5 lg:p-6">
                  <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-base-200">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 skeleton-shimmer rounded-xl"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-5 w-40 skeleton-shimmer rounded"></div>
                      <div class="h-3 w-32 skeleton-shimmer rounded"></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <div class="sm:col-span-2 space-y-2">
                      <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                      <div class="h-16 w-full skeleton-shimmer rounded-lg"></div>
                      <div class="h-3 w-48 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="space-y-2">
                      <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                      <div class="h-12 w-full skeleton-shimmer rounded-lg"></div>
                    </div>
                    <div class="space-y-2">
                      <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                      <div class="h-12 w-full skeleton-shimmer rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Skeleton: Selector de Emergencia -->
              <div class="card bg-red-50 border border-red-100 shadow-sm">
                <div class="card-body p-4 sm:p-5">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2 sm:gap-3 flex-1">
                      <div class="w-8 h-8 sm:w-10 sm:h-10 skeleton-shimmer rounded-full"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                        <div class="h-3 w-40 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                    <div class="h-6 w-11 skeleton-shimmer rounded-full"></div>
                  </div>
                </div>
              </div>

              <!-- Skeleton: Observaciones -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5 lg:p-6">
                  <div class="h-5 w-32 skeleton-shimmer rounded mb-2"></div>
                  <div class="h-32 w-full skeleton-shimmer rounded-lg"></div>
                </div>
              </div>
            </div>

            <!-- Sidebar (1/3) -->
            <div class="lg:col-span-1 space-y-4 sm:space-y-6">
              <!-- Skeleton: Comprobante del Registro Diario -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <div class="h-5 w-48 skeleton-shimmer rounded mb-3 sm:mb-4"></div>
                  <div class="w-full aspect-[4/3] skeleton-shimmer rounded-xl mb-4"></div>
                  <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
              </div>

              <!-- Skeleton: Comprobante Diésel -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <div class="h-5 w-40 skeleton-shimmer rounded mb-3 sm:mb-4"></div>
                  <div class="w-full aspect-[4/3] skeleton-shimmer rounded-xl mb-4"></div>
                  <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
              </div>

              <!-- Skeleton: Desglose de Pago -->
              <div class="card bg-gradient-to-br from-white to-base-200 shadow-md border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <div class="h-3 w-32 skeleton-shimmer rounded mb-4 sm:mb-6"></div>
                  <div class="space-y-2 mb-4 sm:mb-6">
                    <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    <div class="h-10 w-3/4 skeleton-shimmer rounded"></div>
                  </div>
                  <div class="h-2 w-full skeleton-shimmer rounded-full mb-2"></div>
                  <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
              </div>

              <!-- Skeleton: Historial -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <div class="h-5 w-24 skeleton-shimmer rounded mb-3 sm:mb-4"></div>
                  <div class="space-y-4">
                    @for (i of [1,2,3]; track i) {
                      <div class="flex gap-3">
                        <div class="w-2 h-2 skeleton-shimmer rounded-full mt-2"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                          <div class="h-3 w-48 skeleton-shimmer rounded"></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        } @else if (record()) {
          <form [formGroup]="recordForm">
            <!-- Alert para Incidente -->
            @if (isIncidente()) {
              <div class="alert alert-error bg-error/10 border-l-4 border-l-error border-y-0 border-r-0 rounded-r-lg text-base-content shadow-sm mb-6 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-error shrink-0 h-6 w-6 mt-0.5" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div class="flex-1">
                  <h3 class="font-bold text-error">Incidente Crítico Reportado</h3>
                  <div class="text-sm opacity-90 italic mt-1">El conductor reportó un incidente. Revisa las observaciones y fotos antes de validar.</div>
                </div>
                <button 
                  class="btn btn-sm btn-error text-white shadow-sm" 
                  type="button" 
                  (click)="markIncidentResolved()"
                  [disabled]="isResolvingIncident()">
                  @if (isResolvingIncident()) {
                    <span class="loading loading-spinner loading-xs"></span>
                  }
                  Marcar Resuelto
                </button>
              </div>
            }

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <!-- Columna Principal (2/3) -->
              <div class="lg:col-span-2 space-y-4 sm:space-y-6">
                <!-- Toggle Día No Trabajado -->
                <div class="card bg-base-100 shadow-sm border border-base-200">
                  <div class="card-body p-4 sm:p-5 lg:p-6">
                    <div class="form-control w-full">
                      <label 
                        class="label justify-start gap-2 sm:gap-3 p-0 w-full"
                        [class.cursor-pointer]="isEditMode()"
                        [class.cursor-not-allowed]="!isEditMode()"
                        [class.opacity-60]="!isEditMode()"
                        (click)="preventToggleIfNotEditing($event)">
                        <input 
                          type="checkbox" 
                          class="toggle toggle-md sm:toggle-lg toggle-primary flex-shrink-0" 
                          formControlName="noWorkDay"
                          [disabled]="!isEditMode()"
                          [attr.aria-disabled]="!isEditMode()"
                          (click)="preventToggleIfNotEditing($event)" />
                        <div class="min-w-0 flex-1 flex flex-col overflow-hidden max-w-full">
                          <span class="label-text font-bold text-xs sm:text-sm lg:text-base text-base-content line-clamp-2 break-words">Marcar como Día No Trabajado</span>
                          <span class="label-text-alt text-base-content/60 text-[10px] sm:text-[11px] lg:text-xs mt-0.5 line-clamp-2 break-words">Activar si la máquina no operó (descanso, taller, etc.)</span>
                        </div>
                      </label>
                    </div>

                    @if (recordForm.get('noWorkDay')?.value) {
                      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-base-200">
                        <label class="form-control w-full">
                          <div class="label"><span class="label-text font-normal text-sm sm:text-base">Motivo de inactividad</span></div>
                          <select 
                            class="select select-bordered w-full bg-base-200 text-sm" 
                            formControlName="noWorkDayReason"
                            [disabled]="!isEditMode()">
                            <option value="">Seleccione un motivo...</option>
                            <option value="Descanso Semanal">Descanso Semanal</option>
                            <option value="Vacaciones">Vacaciones</option>
                            <option value="Licencia Médica">Licencia Médica</option>
                            <option value="Permiso Personal">Permiso Personal</option>
                            <option value="En Taller / Mantenimiento">En Taller / Mantenimiento</option>
                            <option value="Sin Chofer Asignado">Sin Chofer Asignado</option>
                          </select>
                        </label>
                      </div>
                    }
                  </div>
                </div>

                @if (!recordForm.get('noWorkDay')?.value) {
                  <!-- Información Financiera -->
                  <div class="card bg-base-100 shadow-sm border border-base-200">
                    <div class="card-body p-4 sm:p-5 lg:p-6">
                      <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-base-200">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3 0h6m-6-4h6m-6-4h6M4.5 6.75h15a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75h-15A.75.75 0 0 1 3.75 16.5v-9a.75.75 0 0 1 .75-.75Z" />
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <h2 class="card-title text-base sm:text-lg truncate">Información Financiera</h2>
                          <p class="text-[10px] sm:text-xs text-base-content/50">Ingresos y costos operativos del día</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div class="form-control sm:col-span-2">
                          <label class="label">
                            <span class="label-text font-bold text-sm sm:text-base text-base-content/80">Monto Recaudado Total</span>
                          </label>
                          <div class="relative group">
                            <span class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold text-lg sm:text-xl group-focus-within:text-primary transition-colors">$</span>
                            @if (isEditMode()) {
                              <input 
                                type="number" 
                                formControlName="income"
                                class="input input-bordered input-lg w-full pl-8 sm:pl-9 font-mono text-2xl sm:text-3xl font-bold tabular-nums h-14 sm:h-16 bg-base-200/30 focus:bg-white focus:input-primary transition-all placeholder:text-base-content/20" 
                                placeholder="0" />
                            } @else {
                              <div class="input input-bordered input-lg w-full pl-8 sm:pl-9 font-mono text-2xl sm:text-3xl font-bold tabular-nums h-14 sm:h-16 bg-base-200/30 flex items-center text-base-content">
                                {{ record()?.income | currency:'CLP':'symbol':'1.0-0' }}
                              </div>
                            }
                          </div>
                          <label class="label">
                            <span class="label-text-alt text-[10px] sm:text-xs text-base-content/50">Ingreso bruto antes de gastos</span>
                          </label>
                        </div>

                        <div class="form-control">
                                <label class="label">
                                  <span class="label-text font-normal">Costo Diésel</span>
                                </label>
                                <label class="input input-bordered flex items-center gap-2 bg-base-200/30 focus-within:bg-white focus-within:input-primary" [class.input-disabled]="!isEditMode()">
                                  <span class="text-base-content/40 font-bold">$</span>
                                  @if (isEditMode()) {
                                    <input
                                      type="number"
                                      class="grow font-mono font-bold"
                                      placeholder="0"
                                      formControlName="dieselExpense" />
                                  } @else {
                                    <span class="grow font-mono font-bold">{{ record()?.dieselExpense | currency:'CLP':'symbol':'1.0-0' }}</span>
                                  }
                                </label>
                              </div>
                              <div class="form-control">
                                <label class="label">
                                  <span class="label-text font-normal">Litros Cargados</span>
                                </label>
                                <label class="input input-bordered flex items-center gap-2 bg-base-200/30 focus-within:bg-white focus-within:input-primary" [class.input-disabled]="!isEditMode()">
                                  @if (isEditMode()) {
                                    <input
                                      type="number"
                                      class="grow font-mono font-bold"
                                      placeholder="0.0"
                                      formControlName="dieselLiters"
                                      step="0.1" />
                                  } @else {
                                    <span class="grow font-mono font-bold">{{ record()?.dieselLiters || 0 }}</span>
                                  }
                            <span class="badge badge-sm badge-ghost font-mono text-xs">LTS</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Selector de Emergencia -->
                  <div class="card bg-red-50 border border-red-100 shadow-sm">
                    <div class="card-body p-4 sm:p-5">
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm flex-shrink-0 text-sm sm:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.5m0 3.5h.01M10.29 3.86 2.82 17.25a1.5 1.5 0 0 0 1.29 2.25h15.78a1.5 1.5 0 0 0 1.29-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
                            </svg>
                          </div>
                          <div class="min-w-0">
                            <p class="text-xs sm:text-sm font-bold text-red-800 truncate">¿Es una emergencia?</p>
                            <p class="text-[9px] sm:text-[10px] text-red-600/70">Choque, falla mecánica, etc.</p>
                          </div>
                        </div>
                        <label 
                          class="relative inline-flex items-center"
                          [class.cursor-pointer]="isEditMode()"
                          [class.cursor-not-allowed]="!isEditMode()"
                          (click)="preventToggleIfNotEditing($event)">
                          <input 
                            type="checkbox" 
                            class="sr-only peer" 
                            formControlName="isEmergency"
                            [disabled]="!isEditMode()"
                            (click)="preventToggleIfNotEditing($event)" />
                          <div class="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-disabled:opacity-50"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Observaciones -->
                  <div class="card bg-base-100 shadow-sm border border-base-200">
                    <div class="card-body p-4 sm:p-5 lg:p-6">
                      <h2 class="card-title text-base sm:text-lg mb-2">Observaciones</h2>
                      @if (isEditMode()) {
                        <textarea 
                          formControlName="observations"
                          class="textarea textarea-bordered w-full h-32 leading-relaxed text-base focus:textarea-primary bg-base-200/30 focus:bg-white transition-all" 
                          placeholder="Escribe aquí cualquier detalle relevante de la jornada, incidentes menores, estado de la ruta..."></textarea>
                      } @else {
                        <p class="text-base-content/70 whitespace-pre-wrap min-h-[8rem]">{{ record()?.observations || 'Sin observaciones' }}</p>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Sidebar (1/3) -->
              <div class="lg:col-span-1 space-y-4 sm:space-y-6">
                <!-- Comprobante del Registro Diario (Primero) - Solo si NO es día no trabajado -->
                @if (!recordForm.get('noWorkDay')?.value) {
                  <div class="card bg-base-100 shadow-sm border border-base-200 order-1">
                  <div class="card-body p-4 sm:p-5">
                    <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                      <h3 class="font-bold text-sm sm:text-base">Comprobante del Registro Diario</h3>
                      @if (hasComprobanteRegistro()) {
                        <span class="badge badge-success badge-xs gap-1 py-1.5 sm:py-2 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="hidden sm:inline">Validado</span>
                        </span>
                      }
                    </div>
                    
                    @if (hasComprobanteRegistro() && !isEditMode()) {
                      <div 
                        class="relative group rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-[4/3] flex items-center justify-center cursor-pointer shadow-inner"
                        (click)="openImageModal(getRegistroImageUrl(), 'Comprobante del Registro Diario', record()?.comprobanteRegistro?.uploadedAt || record()?.date)">
                        @if (canUseNgOptimizedImageRegistro()) {
                          <img 
                            [ngSrc]="getRegistroImageUrl()" 
                            alt="Comprobante registro diario" 
                            width="400"
                            height="300"
                            loading="lazy"
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        } @else {
                          <img 
                            [src]="getRegistroImageUrl()" 
                            alt="Comprobante registro diario" 
                            loading="lazy"
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        }
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                          </svg>
                          <span class="font-bold text-sm">Ver Detalle</span>
                        </div>
                      </div>
                      
                      <div class="mt-4 p-3 bg-base-200/50 rounded-lg text-xs border border-base-200">
                        <div class="flex justify-between border-t border-base-300 pt-2 mt-2">
                          <span class="text-base-content/50">Subido:</span>
                          <span>{{ record()?.comprobanteRegistro?.uploadedAt || record()?.date }}</span>
                        </div>
                      </div>
                    }
                    
                    @if (!hasComprobanteRegistro() && !isEditMode()) {
                      <div class="w-full aspect-[4/3] border-2 border-dashed border-base-300 rounded-xl bg-base-50 flex items-center justify-center">
                        <div class="flex flex-col items-center justify-center text-base-content/40">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span class="text-sm font-medium">No hay foto subida</span>
                        </div>
                      </div>
                    }
                    
                    @if (isEditMode()) {
                      <label class="block w-full aspect-[4/3] border-2 border-dashed border-base-300 rounded-xl bg-base-50 hover:bg-base-100 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group">
                        <input 
                          type="file" 
                          class="hidden" 
                          accept="image/*" 
                          (change)="onRegistroSelected($event)" />
                        @if (registroPreview() || (hasComprobanteRegistro() && record()?.comprobanteRegistro?.imageUrl)) {
                          @if (canUseNgOptimizedImagePreviewRegistro()) {
                            <img 
                              [ngSrc]="getPreviewRegistroImageUrl()" 
                              alt="Preview comprobante registro" 
                              width="400"
                              height="300"
                              loading="lazy"
                              class="object-cover w-full h-full" />
                          } @else {
                            <img 
                              [src]="getPreviewRegistroImageUrl()" 
                              alt="Preview comprobante registro" 
                              loading="lazy"
                              class="object-cover w-full h-full" />
                          }
                          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm2.25-2.25h.008v.008h-.008V10.5z" />
                            </svg>
                            <span class="font-bold text-sm">Cambiar foto</span>
                          </div>
                        } @else {
                          <div class="absolute inset-0 flex flex-col items-center justify-center text-base-content/40 group-hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span class="text-xs font-bold uppercase">Sube o arrastra el comprobante</span>
                            <span class="text-[10px] mt-1">JPG, PNG, JFIF (Max 10MB)</span>
                          </div>
                        }
                      </label>
                    }
                  </div>
                </div>
                }

                <!-- Comprobante Diésel (Segundo) - Solo si NO es día no trabajado -->
                @if (!recordForm.get('noWorkDay')?.value) {
                  <div class="card bg-base-100 shadow-sm border border-base-200 order-2">
                  <div class="card-body p-4 sm:p-5">
                    <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                      <h3 class="font-bold text-sm sm:text-base">Comprobante Diésel</h3>
                      <span class="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 shrink-0">Opcional</span>
                      @if (hasComprobante()) {
                        <span class="badge badge-success badge-xs gap-1 py-1.5 sm:py-2 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="hidden sm:inline">Validado</span>
                        </span>
                      }
                    </div>
                    
                    @if (hasComprobante() && !isEditMode()) {
                      <div 
                        class="relative group rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-[4/3] flex items-center justify-center cursor-pointer shadow-inner"
                        (click)="openImageModal(getReceiptImageUrl(), 'Comprobante Diésel', record()?.receipt?.uploadedAt || record()?.date)">
                        @if (canUseNgOptimizedImage()) {
                          <img 
                            [ngSrc]="getReceiptImageUrl()" 
                            alt="Comprobante diésel" 
                            width="400"
                            height="300"
                            loading="lazy"
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        } @else {
                          <img 
                            [src]="record()?.receipt?.imageUrl || 'https://via.placeholder.com/400x300?text=Comprobante'" 
                            alt="Comprobante diésel" 
                            loading="lazy"
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        }
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                          </svg>
                          <span class="font-bold text-sm">Ver Detalle</span>
                        </div>
                      </div>
                      
                      <div class="mt-4 p-3 bg-base-200/50 rounded-lg text-xs border border-base-200">
                        <div class="flex justify-between border-t border-base-300 pt-2 mt-2">
                          <span class="text-base-content/50">Subido:</span>
                          <span>{{ record()?.receipt?.uploadedAt || record()?.date }}</span>
                        </div>
                      </div>
                    }
                    
                    @if (!hasComprobante() && !isEditMode()) {
                      <div class="w-full aspect-[4/3] border-2 border-dashed border-base-300 rounded-xl bg-base-50 flex items-center justify-center">
                        <div class="flex flex-col items-center justify-center text-base-content/40">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span class="text-sm font-medium">No hay foto subida</span>
                        </div>
                      </div>
                    }
                    
                    @if (isEditMode()) {
                      <label class="block w-full aspect-[4/3] border-2 border-dashed border-base-300 rounded-xl bg-base-50 hover:bg-base-100 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group">
                        <input 
                          type="file" 
                          class="hidden" 
                          accept="image/*" 
                          (change)="onReceiptSelected($event)" />
                        @if (receiptPreview() || (hasComprobante() && record()?.receipt?.imageUrl)) {
                          @if (canUseNgOptimizedImagePreview()) {
                            <img 
                              [ngSrc]="getPreviewImageUrl()" 
                              alt="Preview comprobante" 
                              width="400"
                              height="300"
                              loading="lazy"
                              class="object-cover w-full h-full" />
                          } @else {
                            <img 
                              [src]="getPreviewImageUrl()" 
                              alt="Preview comprobante" 
                              loading="lazy"
                              class="object-cover w-full h-full" />
                          }
                          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm2.25-2.25h.008v.008h-.008V10.5z" />
                            </svg>
                            <span class="font-bold text-sm">Cambiar foto</span>
                          </div>
                        } @else {
                          <div class="absolute inset-0 flex flex-col items-center justify-center text-base-content/40 group-hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span class="text-xs font-bold uppercase">Sube o arrastra el voucher</span>
                            <span class="text-[10px] mt-1">JPG, PNG, JFIF (Max 10MB)</span>
                          </div>
                        }
                      </label>
                    }
                  </div>
                </div>
                }

                <!-- Desglose de Pago con Gradiente (Penúltimo) - Solo si NO es día no trabajado -->
                @if (!recordForm.get('noWorkDay')?.value) {
                  <div class="card bg-gradient-to-br from-white to-base-200 shadow-md border border-base-200 relative overflow-hidden group order-2 lg:order-2">
                  <div class="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-bl-full mr-0 sm:mr-0 mt-0 sm:mt-0 pointer-events-none"></div>
                  
                  <div class="card-body p-4 sm:p-5 relative z-10">
                    <h3 class="text-[10px] sm:text-xs font-black text-base-content/30 uppercase tracking-widest mb-4 sm:mb-6">Desglose de Pago</h3>
                    
                          <div class="flex flex-col gap-1 mb-4 sm:mb-6">
                            <span class="text-xs sm:text-sm font-normal italic text-base-content/60">A pagar al Chofer ({{ currentPaymentBreakdown().percentage }}%)</span>
                      <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-primary tabular-nums tracking-tight break-all">
                        {{ currentPaymentBreakdown().amount | currency:'CLP':'symbol':'1.0-0' }}
                      </span>
                    </div>
                    
                    <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden mb-2">
                      <div 
                        class="bg-primary h-full shadow-[0_0_10px_rgba(var(--p),0.5)] transition-all duration-500"
                        [style.width.%]="currentPaymentBreakdown().percentage"></div>
                    </div>
                    <div class="flex justify-between text-[9px] sm:text-[10px] text-base-content/40 font-mono uppercase tracking-wide">
                      <span>Cálculo</span>
                      <span class="text-right break-all">Base: {{ currentPaymentBreakdown().base | currency:'CLP':'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                </div>
                }

                <!-- Historial (Último) -->
                <div class="card bg-base-100 shadow-sm border border-base-200 order-3 lg:order-3">
                  <div class="card-body p-4 sm:p-5">
                    <h3 class="font-bold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-base-content/50">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historial
                    </h3>
                    @if (historyItems().length > 0) {
                      <ul class="timeline timeline-vertical timeline-compact -ml-2">
                        @for (item of historyItems(); track item.id; let last = $last) {
                          <li>
                            <div class="timeline-middle">
                              <div class="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20" [class.bg-base-300]="!last"></div>
                            </div>
                            <div class="timeline-end timeline-box bg-transparent border-none shadow-none p-0 pl-3 mb-4">
                              <div class="text-xs font-bold text-base-content">{{ item.usuario }}</div>
                              <div class="text-[10px] text-base-content/50">{{ item.accion }} • {{ formatTimeAgo(item.timestamp) }}</div>
                              @if (item.cambios) {
                                <div class="text-[10px] text-base-content/40 mt-1">{{ item.cambios }}</div>
                              }
                            </div>
                            @if (!last) {
                              <hr class="bg-base-200"/>
                            }
                          </li>
                        }
                      </ul>
                    } @else {
                      <p class="text-sm text-base-content/50">Sin historial disponible</p>
                    }
                  </div>
                </div>
              </div>
            </div>
          </form>
        } @else {
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No se pudo cargar el registro.</span>
          </div>
        }
      </div>
      </div>
    </main>
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroDiarioDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dailyRecordService = inject(DailyRecordService);
  private storageService = inject(StorageService);
  private imageModalService = inject(ImageModalService);

  record = signal<DailyRecordDetailView | null>(null);
  isLoading = signal(true);
  isEditMode = signal(false);
  isResolvingIncident = signal(false);
  private previousRecordState: DailyRecordDetailView | null = null;

  recordForm = this.fb.group({
    noWorkDay: [false],
    noWorkDayReason: [''],
    isEmergency: [false],
    income: [0, [Validators.required, Validators.min(0)]],
    dieselExpense: [0, [Validators.required, Validators.min(0)]],
    dieselLiters: [0],
    observations: ['']
  });

  receiptFile = signal<File | null>(null);
  receiptPreview = signal<string | null>(null);
  
  // Comprobante del registro diario
  registroFile = signal<File | null>(null);
  registroPreview = signal<string | null>(null);

  // Computed signals
  // Mapeo de estados: 'INCIDENTE_REPORTADO' -> 'incident', 'COMPLETO' -> 'complete'
  isIncidente = computed(() => {
    const estado = this.record()?.estado;
    return estado === 'INCIDENTE_REPORTADO';
  });
  isCompleto = computed(() => {
    const estado = this.record()?.estado;
    return estado === 'COMPLETO';
  });
  hasComprobante = computed(() => !!this.record()?.receipt?.imageUrl);
  hasComprobanteRegistro = computed(() => !!this.record()?.comprobanteRegistro?.imageUrl);
  historyItems = computed(() => this.record()?.history ?? []);

  // Signal reactivo del valor de income del formulario
  private incomeValue = toSignal(
    this.recordForm.get('income')?.valueChanges.pipe(
      startWith(this.recordForm.get('income')?.value || 0)
    ) || of(0),
    { initialValue: 0 }
  );

  // Desglose de pago calculado en tiempo real (se actualiza mientras se edita)
  currentPaymentBreakdown = computed(() => {
    const isEditing = this.isEditMode();
    const noWorkDay = this.recordForm.get('noWorkDay')?.value;
    
    // Si es día no trabajado, no hay pago
    if (noWorkDay) {
      return {
        base: 0,
        percentage: 0,
        amount: 0
      };
    }

    // Obtener el porcentaje del chofer (del record original o 30% por defecto)
    const percentage = this.record()?.paymentBreakdown?.percentage || 30;
    
    // Si está editando, usar el valor reactivo del formulario; si no, usar el valor del record
    const base = isEditing 
      ? (this.incomeValue() || 0)
      : (this.record()?.paymentBreakdown?.base || this.record()?.income || 0);
    
    // Calcular el monto a pagar
    const amount = Math.round(base * (percentage / 100));
    
    return {
      base,
      percentage,
      amount
    };
  });

  // Effect para actualizar validación cuando cambia "Día No Trabajado"
  private updateValidation = effect(() => {
    const noWorkDay = this.recordForm.get('noWorkDay')?.value;
    const incomeControl = this.recordForm.get('income');
    const dieselControl = this.recordForm.get('dieselExpense');
    
    if (noWorkDay) {
      incomeControl?.clearValidators();
      dieselControl?.clearValidators();
    } else {
      incomeControl?.setValidators([Validators.required, Validators.min(0)]);
      dieselControl?.setValidators([Validators.required, Validators.min(0)]);
    }
    
    incomeControl?.updateValueAndValidity();
    dieselControl?.updateValueAndValidity();
  });

  constructor() {
    // Cargar registro basado en el ID de la ruta
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadRecord(id);
      }
    });

    // Listener para actualizar UI optimistamente cuando cambian los toggles
    this.recordForm.get('noWorkDay')?.valueChanges.subscribe(value => {
      if (this.isEditMode() && this.record()) {
        const currentRecord = this.record()!;
        this.record.set({
          ...currentRecord,
          noWorkDay: value || false
        });
      }
    });

    this.recordForm.get('isEmergency')?.valueChanges.subscribe(value => {
      if (this.isEditMode() && this.record()) {
        const currentRecord = this.record()!;
        this.record.set({
          ...currentRecord,
          isEmergency: value || false
        });
      }
    });
  }

  private loadRecord(id: string): void {
    this.isLoading.set(true);
    
    this.dailyRecordService.getDailyRecordById(id).subscribe({
      next: (unifiedRecord) => {
        const viewRecord = this.mapToDetailView(unifiedRecord);
        this.record.set(viewRecord);
        this.recordForm.patchValue({
          noWorkDay: viewRecord.noWorkDay,
          noWorkDayReason: viewRecord.noWorkDayReason || '',
          isEmergency: viewRecord.isEmergency || false,
          income: viewRecord.income,
          dieselExpense: viewRecord.dieselExpense,
          dieselLiters: viewRecord.dieselLiters || 0,
          observations: viewRecord.observations || ''
        });
        
        if (viewRecord.receipt?.imageUrl) {
          this.receiptPreview.set(viewRecord.receipt.imageUrl);
        }
        if (viewRecord.comprobanteRegistro?.imageUrl) {
          this.registroPreview.set(viewRecord.comprobanteRegistro.imageUrl);
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar registro:', error);
        this.isLoading.set(false);
        // TODO: Mostrar mensaje de error al usuario
      }
    });
  }

  /**
   * Mapear desde el modelo unificado a la vista de detalle
   */
  private mapToDetailView(record: DailyRecord): DailyRecordDetailView {
    // Formatear fecha
    const date = new Date(record.fecha);
    const formattedDate = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Mapear comprobante de diesel
    const receipt = record.comprobante_diesel ? {
      amount: record.comprobante_diesel.monto,
      uploadedAt: record.comprobante_diesel.subido_en 
        ? new Date(record.comprobante_diesel.subido_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : undefined,
      imageUrl: record.comprobante_diesel.imagen_url
    } : undefined;

    // Mapear comprobante del registro diario (desde imagen_url del backend)
    // El backend devuelve imagen_url directamente, no en un objeto anidado
    const comprobanteRegistro = (record as any).imagen_url ? {
      imageUrl: (record as any).imagen_url,
      uploadedAt: (record as any).imagen_updated_at 
        ? new Date((record as any).imagen_updated_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : undefined
    } : record.comprobante_registro ? {
      imageUrl: record.comprobante_registro.imagen_url,
      uploadedAt: record.comprobante_registro.subido_en 
        ? new Date(record.comprobante_registro.subido_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : undefined
    } : undefined;

    return {
      ...record,
      date: formattedDate,
      machine: record.maquina_identificador || `Máquina ${record.maquina_id}`,
      driver: record.chofer_nombre || '',
      income: record.recaudado,
      dieselExpense: record.costo_diesel,
      noWorkDay: record.dia_no_trabajado,
      noWorkDayReason: record.motivo_inactividad || undefined,
      isEmergency: record.es_emergencia,
      observations: record.observaciones || '',
      dieselLiters: record.litros_diesel,
      paymentBreakdown: record.desglose_pago ? {
        base: record.desglose_pago.base,
        percentage: record.desglose_pago.porcentaje,
        amount: record.desglose_pago.monto
      } : {
        base: record.recaudado,
        percentage: 30, // Por defecto, debería venir del chofer
        amount: record.recaudado * 0.3
      },
      receipt,
      comprobanteRegistro,
      history: record.historial
    };
  }

  enableEditMode(): void {
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    if (this.record()) {
      this.recordForm.patchValue({
        noWorkDay: this.record()!.noWorkDay,
        noWorkDayReason: this.record()!.noWorkDayReason || '',
        isEmergency: this.record()!.isEmergency || false,
        income: this.record()!.income,
        dieselExpense: this.record()!.dieselExpense,
        dieselLiters: this.record()!.dieselLiters || 0,
        observations: this.record()!.observations
      });
    }
    this.receiptFile.set(null);
    this.receiptPreview.set(this.record()?.receipt?.imageUrl || null);
    this.registroFile.set(null);
    this.registroPreview.set(this.record()?.comprobanteRegistro?.imageUrl || null);
    this.isEditMode.set(false);
  }

  saveRecord(): void {
    if (this.recordForm.valid && this.record()) {
      const formValue = this.recordForm.value;
      const recordId = this.record()!.id;
      const currentRecord = this.record()!;
      
      // 1. Snapshot del estado actual (para rollback)
      this.previousRecordState = { ...currentRecord };
      
      // 2. Optimistic update: Actualizar record signal inmediatamente
      const optimisticRecord: DailyRecordDetailView = {
        ...currentRecord,
        isEmergency: formValue.isEmergency || false,
        noWorkDay: formValue.noWorkDay || false,
        noWorkDayReason: formValue.noWorkDay ? (formValue.noWorkDayReason as string) : undefined,
        income: formValue.noWorkDay ? 0 : (formValue.income || 0),
        dieselExpense: formValue.noWorkDay ? 0 : (formValue.dieselExpense || 0),
        dieselLiters: formValue.noWorkDay ? 0 : (formValue.dieselLiters || 0),
        observations: formValue.observations || ''
      };
      this.record.set(optimisticRecord);
      
      // 3. Subir imágenes si hay archivos nuevos
      const registroFile = this.registroFile();
      const receiptFile = this.receiptFile();
      const uploads: Array<Observable<{ url: string; type: 'registro' | 'diesel' }>> = [];
      
      if (registroFile && currentRecord.chofer_id) {
        uploads.push(
          this.storageService.uploadDailyRecordImageAdmin(
            registroFile,
            currentRecord.chofer_id,
            currentRecord.fecha
          ).pipe(
            map(result => ({ url: result.url, type: 'registro' as const })),
            catchError((error) => {
              console.error('Error subiendo comprobante del registro:', error);
              this.showErrorToast('Error al subir comprobante del registro');
              return EMPTY;
            })
          )
        );
      }
      
      if (receiptFile && currentRecord.chofer_id) {
        uploads.push(
          this.storageService.uploadDailyRecordImageAdmin(
            receiptFile,
            currentRecord.chofer_id,
            currentRecord.fecha
          ).pipe(
            map(result => ({ url: result.url, type: 'diesel' as const })),
            catchError((error) => {
              console.error('Error subiendo comprobante de diesel:', error);
              this.showErrorToast('Error al subir comprobante de diesel');
              return EMPTY;
            })
          )
        );
      }
      
      // 4. Esperar a que se suban las imágenes (si hay) y luego actualizar
      const updateAfterUploads = uploads.length > 0 
        ? forkJoin(uploads).pipe(
            switchMap((results) => {
              // Construir DTO con URLs de imágenes subidas
              const updateDto: any = {
                recaudado: formValue.noWorkDay ? undefined : formValue.income,
                costo_diesel: formValue.noWorkDay ? undefined : formValue.dieselExpense,
                litros_diesel: formValue.noWorkDay ? undefined : formValue.dieselLiters,
                dia_no_trabajado: formValue.noWorkDay || false,
                motivo_inactividad: formValue.noWorkDay ? (formValue.noWorkDayReason as any) : undefined,
                es_emergencia: formValue.isEmergency || false,
                observaciones: formValue.observations || null
              };
              
              // Agregar URLs de imágenes subidas
              results.forEach(result => {
                if (result.type === 'registro') {
                  updateDto.comprobante_registro = { imagen: result.url };
                } else if (result.type === 'diesel') {
                  updateDto.comprobante_diesel = { imagen: result.url };
                }
              });
              
              return this.dailyRecordService.updateDailyRecord(recordId, updateDto);
            })
          )
        : of(null).pipe(
            switchMap(() => {
              // Sin archivos nuevos, solo actualizar datos
              const updateDto: any = {
                recaudado: formValue.noWorkDay ? undefined : formValue.income,
                costo_diesel: formValue.noWorkDay ? undefined : formValue.dieselExpense,
                litros_diesel: formValue.noWorkDay ? undefined : formValue.dieselLiters,
                dia_no_trabajado: formValue.noWorkDay || false,
                motivo_inactividad: formValue.noWorkDay ? (formValue.noWorkDayReason as any) : undefined,
                es_emergencia: formValue.isEmergency || false,
                observaciones: formValue.observations || null,
                // Mantener URLs existentes si no se cambiaron
                comprobante_registro: currentRecord.comprobanteRegistro?.imageUrl 
                  ? { imagen: currentRecord.comprobanteRegistro.imageUrl }
                  : undefined,
                comprobante_diesel: currentRecord.receipt?.imageUrl
                  ? { imagen: currentRecord.receipt.imageUrl }
                  : undefined
              };
              
              return this.dailyRecordService.updateDailyRecord(recordId, updateDto);
            })
          );
      
      updateAfterUploads.pipe(
        // 5. Después de actualizar, recargar el registro completo desde el servidor
        // para obtener todos los datos actualizados (historial, desglose de pago, etc.)
        switchMap(() => {
          return this.dailyRecordService.getDailyRecordById(recordId);
        }),
        catchError((error) => {
          // 6. Rollback en caso de error
          if (this.previousRecordState) {
            this.record.set(this.previousRecordState);
            // Restaurar formulario al estado anterior
            this.recordForm.patchValue({
              noWorkDay: this.previousRecordState.noWorkDay,
              noWorkDayReason: this.previousRecordState.noWorkDayReason || '',
              isEmergency: this.previousRecordState.isEmergency || false,
              income: this.previousRecordState.income,
              dieselExpense: this.previousRecordState.dieselExpense,
              dieselLiters: this.previousRecordState.dieselLiters || 0,
              observations: this.previousRecordState.observations
            });
          }
          
          // 7. Notificar al usuario
          this.showErrorToast('No se pudo guardar el registro. Intenta nuevamente.');
          
          return EMPTY;
        })
      ).subscribe({
        next: (updatedRecord) => {
          // 8. Actualizar con el registro completo recargado del servidor
          const viewRecord = this.mapToDetailView(updatedRecord);
          this.record.set(viewRecord);
          
          // 9. Actualizar el formulario con los valores del servidor
          this.recordForm.patchValue({
            noWorkDay: viewRecord.noWorkDay,
            noWorkDayReason: viewRecord.noWorkDayReason || '',
            isEmergency: viewRecord.isEmergency || false,
            income: viewRecord.income,
            dieselExpense: viewRecord.dieselExpense,
            dieselLiters: viewRecord.dieselLiters || 0,
            observations: viewRecord.observations || ''
          });
          
          // 10. Actualizar previews de imágenes con las URLs del servidor
          if (viewRecord.receipt?.imageUrl) {
            this.receiptPreview.set(viewRecord.receipt.imageUrl);
          }
          if (viewRecord.comprobanteRegistro?.imageUrl) {
            this.registroPreview.set(viewRecord.comprobanteRegistro.imageUrl);
          }
          
          this.isEditMode.set(false);
          this.receiptFile.set(null);
          this.registroFile.set(null);
          this.previousRecordState = null;
          this.showSuccessToast('Registro guardado exitosamente');
        },
        error: () => {
          // Error ya manejado en catchError
        }
      });
    }
  }

  markIncidentResolved(): void {
    if (!this.record() || this.isResolvingIncident()) {
      return;
    }

    const currentRecord = this.record();
    if (!currentRecord) {
      return;
    }

    // 1. Snapshot del estado actual (para rollback)
    const previousRecord = { ...currentRecord };
    
    // 2. Optimistic update: Actualizar estado inmediatamente
    const optimisticRecord: DailyRecordDetailView = {
      ...currentRecord,
      estado: 'COMPLETO' as const,
      // Actualizar historial con la acción
      history: [
        ...(currentRecord.history || []),
        {
          id: `temp-${Date.now()}`,
          usuario: 'Usuario',
          accion: 'Incidente marcado como resuelto',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    this.record.set(optimisticRecord);
    this.isResolvingIncident.set(true);
    
    // 3. Llamar al servidor en segundo plano
    const recordId = currentRecord.id;
    this.dailyRecordService.resolveIncident(recordId).pipe(
      catchError((error) => {
        // 4. Rollback en caso de error
        this.record.set(previousRecord);
        
        // 5. Notificar al usuario
        this.showErrorToast('No se pudo resolver el incidente. Intenta nuevamente.');
        
        return EMPTY;
      })
    ).subscribe({
      next: (resolvedRecord) => {
        // Actualizar con la respuesta del servidor
        const viewRecord = this.mapToDetailView(resolvedRecord);
        this.record.set(viewRecord);
        this.isResolvingIncident.set(false);
        this.showSuccessToast('Incidente resuelto exitosamente');
      },
      error: () => {
        this.isResolvingIncident.set(false);
      }
    });
  }

  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end';
    toast.innerHTML = `
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  private showSuccessToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end';
    toast.innerHTML = `
      <div class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return time.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    }
  }

  preventToggleIfNotEditing(event: Event): void {
    if (!this.isEditMode()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onReceiptSelected(event: Event): void {
    if (!this.isEditMode()) {
      event.preventDefault();
      return;
    }
    
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        return;
      }
      
      this.receiptFile.set(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.receiptPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onRegistroSelected(event: Event): void {
    if (!this.isEditMode()) {
      return;
    }
    
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        return;
      }
      
      this.registroFile.set(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.registroPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  goBack(): void {
    this.router.navigate(['/bitacora-operaciones']);
  }
  
  // Helper para verificar si se puede usar NgOptimizedImage
  canUseNgOptimizedImage(): boolean {
    const imageUrl = this.record()?.receipt?.imageUrl;
    return !!imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('data:');
  }
  
  // Helper para obtener la URL de la imagen de forma segura
  getReceiptImageUrl(): string {
    return this.record()?.receipt?.imageUrl || 'https://via.placeholder.com/400x300?text=Comprobante';
  }
  
  // Helper para verificar si se puede usar NgOptimizedImage en preview
  canUseNgOptimizedImagePreview(): boolean {
    const preview = this.receiptPreview();
    const recordUrl = this.record()?.receipt?.imageUrl;
    const url = preview || recordUrl;
    return !!url && typeof url === 'string' && !url.startsWith('data:');
  }
  
  // Helper para obtener la URL del preview de forma segura
  getPreviewImageUrl(): string {
    return this.receiptPreview() || this.record()?.receipt?.imageUrl || '';
  }
  
  // Helper para verificar si se puede usar NgOptimizedImage para comprobante del registro
  canUseNgOptimizedImageRegistro(): boolean {
    const imageUrl = this.record()?.comprobanteRegistro?.imageUrl;
    return !!imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('data:');
  }
  
  // Helper para obtener la URL de la imagen del comprobante del registro
  getRegistroImageUrl(): string {
    return this.record()?.comprobanteRegistro?.imageUrl || 'https://via.placeholder.com/400x300?text=Comprobante+Registro';
  }
  
  // Helper para verificar si se puede usar NgOptimizedImage en preview del registro
  canUseNgOptimizedImagePreviewRegistro(): boolean {
    const preview = this.registroPreview();
    const recordUrl = this.record()?.comprobanteRegistro?.imageUrl;
    const url = preview || recordUrl;
    return !!url && typeof url === 'string' && !url.startsWith('data:');
  }
  
  // Helper para obtener la URL del preview del comprobante del registro
  getPreviewRegistroImageUrl(): string {
    return this.registroPreview() || this.record()?.comprobanteRegistro?.imageUrl || '';
  }

  // Funciones para el modal de imágenes
  openImageModal(url: string, title: string, uploadedAt?: string): void {
    this.imageModalService.show({ url, title, uploadedAt });
  }
}
