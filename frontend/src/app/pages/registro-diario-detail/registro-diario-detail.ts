import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import { StorageService } from '../../shared/services/storage.service';
import { ImageModalService } from '../../shared/services/image-modal.service';
import { GlobalErrorService } from '../../shared/services/global-error.service';
import type { DailyRecord, DailyRecordHistoryItem } from '../../shared/models/daily-record.models';
import { catchError, EMPTY, forkJoin, of, switchMap, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { getDateInChileTime, getDaysDifferenceInChile, getDatePartsInChile } from '../../shared/utils/date.utils';
import { DailyRecordDetailSkeleton } from '../../shared/daily-records/daily-record-detail-skeleton/daily-record-detail-skeleton';
import { AccountingService } from '../../shared/services/accounting.service';

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
  neto?: number; // utilidad neta (recaudado - diesel - pago chofer)
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgOptimizedImage, UiIconComponent, DailyRecordDetailSkeleton],
  template: `
    <main class="bg-base-200 min-h-screen">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        @if (isLoading()) {
          <!-- Skeleton completo de alta fidelidad -->
          <app-daily-record-detail-skeleton />
        } @else {
          <!-- Hero alineado al estilo de flota/choferes -->
          <!-- Hero Section Real -->
          <section class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/60 rounded-3xl border border-base-200 shadow-sm p-5 sm:p-7 lg:p-8">
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
                    <ui-icon name="ChevronLeft" size="md" />
                  </button>

                  <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content tracking-tight">
                      Registro #{{ record()?.id || '--' }}
                    </h1>
                    @if (isIncidente()) {
                      <span class="inline-flex items-center gap-2 rounded-full bg-error/10 text-error px-3 py-1 text-xs sm:text-sm font-semibold border border-error/20 shadow-sm">
                        <ui-icon name="AlertCircle" size="sm" />
                        Incidente
                      </span>
                    } @else if (record()?.noWorkDay) {
                      <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs sm:text-sm font-semibold border border-slate-200 shadow-sm">
                        <ui-icon name="XCircle" size="sm" />
                        Día No Trabajado
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
                    <ui-icon name="Calendar" size="sm" class="text-primary/80" />
                    {{ record()?.date }}
                  </span>
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-100 border border-base-200 shadow-sm">
                    <ui-icon name="BusFront" size="sm" class="text-primary/80" />
                    {{ record()?.machine }}
                  </span>
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-100 border border-base-200 shadow-sm">
                    <ui-icon name="IdCard" size="sm" class="text-primary/80" />
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
                    <ui-icon name="Pencil" size="sm" />
                    <span>Editar registro</span>
                  </button>
                } @else {
                  <button 
                    class="btn btn-ghost border border-base-300 h-11 px-4 rounded-lg" 
                    (click)="cancelEdit()"
                    type="button">Cancelar</button>
                  <button 
                    class="btn bg-success text-white h-11 px-5 gap-2 rounded-lg shadow-lg shadow-success/25 disabled:opacity-50 disabled:pointer-events-none" 
                    (click)="saveRecord()"
                    [disabled]="recordForm.invalid || isSubmittingRecord()"
                    type="button">
                    @if (isSubmittingRecord()) {
                      <span class="loading loading-spinner loading-xs"></span>
                      <span>Guardando...</span>
                    } @else {
                      <ui-icon name="Check" size="sm" />
                      <span>Guardar cambios</span>
                    }
                  </button>
                }
              </div>
            </div>
          </section>
        }

        <div class="space-y-6 sm:space-y-8">
        @if (record()) {
          <form [formGroup]="recordForm">
            <!-- Alert para Incidente -->
            @if (isIncidente()) {
              <div class="alert alert-error bg-error/10 border-l-4 border-l-error border-y-0 border-r-0 rounded-r-lg text-base-content shadow-sm mb-6 flex items-start">
                <ui-icon name="TriangleAlert" size="lg" class="stroke-error shrink-0 mt-0.5" />
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
                          <div class="label">
                            <span class="label-text font-bold text-sm sm:text-base">Motivo de inactividad</span>
                          </div>
                          @if (isEditMode()) {
                            <select 
                              class="select select-bordered w-full bg-base-200 text-sm" 
                              formControlName="noWorkDayReason"
                              [attr.aria-disabled]="!isEditMode()"
                              [attr.disabled]="!isEditMode() ? true : null">
                              <option value="">Seleccione un motivo...</option>
                              <option value="Descanso Semanal">Descanso Semanal</option>
                              <option value="Vacaciones">Vacaciones</option>
                              <option value="Licencia Médica">Licencia Médica</option>
                              <option value="Permiso Personal">Permiso Personal</option>
                              <option value="En Taller / Mantenimiento">En Taller / Mantenimiento</option>
                              <option value="Sin Chofer Asignado">Sin Chofer Asignado</option>
                            </select>
                          } @else {
                            <div class="input input-bordered w-full bg-base-200 text-sm text-base-content font-bold select-none border-2 border-info/30">
                              {{ record()?.noWorkDayReason || 'Sin motivo asignado' }}
                            </div>
                          }
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
                          <ui-icon name="Wallet" size="md" />
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
                            <ui-icon name="TriangleAlert" size="md" />
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
                            (click)="preventToggleIfNotEditing($event)" />
                          <div class="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-disabled:opacity-50"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Observaciones -->
                  <div class="card bg-base-100 shadow-sm border border-base-200"
                       [class.border-error/30]="isEditMode() && recordForm.get('isEmergency')?.value"
                       [class.bg-error/5]="isEditMode() && recordForm.get('isEmergency')?.value">
                    <div class="card-body p-4 sm:p-5 lg:p-6">
                      <h2 class="card-title text-base sm:text-lg mb-2">
                        Observaciones
                        @if (isEditMode() && recordForm.get('isEmergency')?.value) {
                          <span class="text-error">*</span>
                        }
                      </h2>
                      @if (isEditMode() && recordForm.get('isEmergency')?.value) {
                        <p class="text-xs text-error font-semibold mb-2">
                          Las observaciones son obligatorias cuando hay un incidente crítico
                        </p>
                      }
                      @if (isEditMode()) {
                        <textarea 
                          formControlName="observations"
                          class="textarea textarea-bordered w-full h-32 leading-relaxed text-base focus:textarea-primary bg-base-200/30 focus:bg-white transition-all"
                          [class.textarea-error]="recordForm.get('isEmergency')?.value && !recordForm.get('observations')?.value?.trim()"
                          placeholder="Escribe aquí cualquier detalle relevante de la jornada, incidentes menores, estado de la ruta..."></textarea>
                        @if (recordForm.get('isEmergency')?.value && recordForm.get('observations')?.invalid && recordForm.get('observations')?.touched) {
                          <p class="text-xs text-error mt-1">Este campo es obligatorio cuando hay un incidente crítico</p>
                        }
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
                          <ui-icon name="Check" size="xs" />
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
                            fill
                            priority
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        } @else {
                          <img 
                            [src]="getRegistroImageUrl()" 
                            alt="Comprobante registro diario" 
                            loading="lazy"
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        }
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm pointer-events-none">
                          <ui-icon name="Search" size="lg" class="text-white" />
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
                          <ui-icon name="FileText" size="lg" class="mb-2" />
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
                              fill
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
                            <ui-icon name="Camera" size="lg" class="text-white" />
                            <span class="font-bold text-sm">Cambiar foto</span>
                          </div>
                        } @else {
                          <div class="absolute inset-0 flex flex-col items-center justify-center text-base-content/40 group-hover:text-primary transition-colors">
                            <ui-icon name="Upload" size="lg" class="mb-1" />
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
                          <ui-icon name="Check" size="xs" />
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
                            fill
                            priority
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        } @else {
                          <img 
                            [src]="record()?.receipt?.imageUrl || 'https://via.placeholder.com/400x300?text=Comprobante'" 
                            alt="Comprobante diésel" 
                            loading="lazy"
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                        }
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm pointer-events-none">
                          <ui-icon name="Search" size="lg" class="text-white" />
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
                          <ui-icon name="FileText" size="lg" class="mb-2" />
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
                              fill
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
                            <ui-icon name="Camera" size="lg" class="text-white" />
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
                    <div class="flex justify-between text-[9px] sm:text-[10px] text-base-content/40 font-mono uppercase tracking-wide mb-4 sm:mb-6">
                      <span>Cálculo</span>
                      <span class="text-right break-all">Base: {{ currentPaymentBreakdown().base | currency:'CLP':'symbol':'1.0-0' }}</span>
                    </div>

                    <!-- Cálculo de Utilidad Neta (TC-185) -->
                    <div class="pt-4 sm:pt-6 border-t border-base-300">
                      <h4 class="text-[10px] sm:text-xs font-black text-base-content/30 uppercase tracking-widest mb-3 sm:mb-4">Cálculo de Utilidad</h4>
                      
                      <div class="space-y-2 font-mono text-xs sm:text-sm">
                        <div class="flex justify-between items-center">
                          <span class="text-base-content/70">Recaudado:</span>
                          <span class="font-bold tabular-nums text-base-content">
                            {{ (isEditMode() ? incomeValue() : record()?.income) || 0 | currency:'CLP':'symbol':'1.0-0' }}
                          </span>
                        </div>
                        
                        <div class="flex justify-between items-center text-red-600">
                          <span class="text-base-content/70">- Diésel:</span>
                          <span class="font-bold tabular-nums">
                            - {{ (isEditMode() ? dieselExpenseValue() : record()?.dieselExpense) || 0 | currency:'CLP':'symbol':'1.0-0' }}
                          </span>
                        </div>
                        
                        <div class="flex justify-between items-center text-primary">
                          <span class="text-base-content/70">- Pago Chofer:</span>
                          <span class="font-bold tabular-nums">
                            - {{ currentPaymentBreakdown().amount | currency:'CLP':'symbol':'1.0-0' }}
                          </span>
                        </div>
                        
                        <div class="divider my-2 h-px bg-base-300"></div>
                        
                        <div class="flex justify-between items-center pt-2 border-t-2 border-base-300">
                          <span class="font-bold text-base-content">Utilidad Neta:</span>
                          <span class="text-lg sm:text-xl font-black tabular-nums" [class.text-emerald-600]="currentNeto() >= 0" [class.text-red-600]="currentNeto() < 0">
                            {{ currentNeto() | currency:'CLP':'symbol':'1.0-0' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                }

                <!-- Historial (Último) -->
                <div class="card bg-base-100 shadow-sm border border-base-200 order-3 lg:order-3">
                  <div class="card-body p-4 sm:p-5">
                    <h3 class="font-bold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                      <ui-icon name="Clock" size="sm" class="text-base-content/50" />
                      Historial
                    </h3>
                    @if (historyItems().length > 0) {
                      <ul class="timeline timeline-vertical timeline-compact -ml-2 pl-2">
                        @for (item of historyItems(); track item.id; let last = $last) {
                          <li>
                            <div class="timeline-middle">
                              <div class="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 flex-shrink-0" [class.bg-base-300]="!last"></div>
                            </div>
                            <div class="timeline-end timeline-box bg-transparent border-none shadow-none p-0 pl-3 mb-4 min-w-0 flex-1">
                              <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <div class="text-xs font-bold text-base-content break-words">{{ item.usuario }}</div>
                                @if (item.tipoActor || item.rol) {
                                  <div class="badge badge-xs badge-ghost text-[9px] font-medium">
                                    @if (item.tipoActor === 'admin') {
                                      <span>Admin</span>
                                    } @else if (item.tipoActor === 'chofer') {
                                      <span>Chofer</span>
                                    }
                                    @if (item.rol) {
                                      <span class="ml-1 opacity-70">• {{ item.rol }}</span>
                                    }
                                  </div>
                                }
                              </div>
                              <div class="text-[10px] text-base-content/50 break-words">{{ item.accion }} • {{ formatTimeAgo(item.timestamp) }}</div>
                              @if (item.cambios) {
                                <div class="text-[10px] text-base-content/40 mt-1 break-words overflow-wrap-anywhere">{{ item.cambios }}</div>
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
            <ui-icon name="AlertCircle" size="lg" class="stroke-current shrink-0" />
            <span>No se pudo cargar el registro.</span>
          </div>
        }
      </div>
      </div>
    </main>
  `,
  styles: [`
    /* Mejoras de responsividad para el timeline del historial */
    .timeline {
      max-width: 100%;
      overflow-x: visible;
      overflow-y: visible;
    }
    
    .timeline li {
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: visible;
    }
    
    .timeline-middle {
      overflow: visible !important;
      padding: 0.5rem 0;
      min-width: 1rem;
    }
    
    .timeline-middle > div {
      position: relative;
      z-index: 1;
    }
    
    .timeline-end {
      max-width: 100%;
      min-width: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    
    .break-words {
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      max-width: 100%;
    }
    
    .overflow-wrap-anywhere {
      overflow-wrap: anywhere;
      word-break: break-word;
      hyphens: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroDiarioDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private dailyRecordService = inject(DailyRecordService);
  private storageService = inject(StorageService);
  private imageModalService = inject(ImageModalService);
  private globalErrorService = inject(GlobalErrorService);
  private accountingService = inject(AccountingService);

  record = signal<DailyRecordDetailView | null>(null);
  isLoading = signal(true);
  isEditMode = signal(false);

  isResolvingIncident = signal(false);
  isSubmittingRecord = signal(false);
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
  incomeValue = toSignal(
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

    // Calcular el monto a pagar (usar Math.round para evitar errores de redondeo)
    const amount = Math.round(base * (percentage / 100));

    return {
      base,
      percentage,
      amount
    };
  });

  // Signal reactivo del valor de dieselExpense del formulario
  dieselExpenseValue = toSignal(
    this.recordForm.get('dieselExpense')?.valueChanges.pipe(
      startWith(this.recordForm.get('dieselExpense')?.value || 0)
    ) || of(0),
    { initialValue: 0 }
  );

  // Neto calculado en tiempo real (recaudado - diésel - pago chofer) - Sin redondeo, cálculo exacto
  currentNeto = computed(() => {
    const isEditing = this.isEditMode();
    const noWorkDay = this.recordForm.get('noWorkDay')?.value;

    // Si es día no trabajado, no hay neto
    if (noWorkDay) {
      return 0;
    }

    // Obtener valores actuales (del formulario si está editando, del record si no)
    const income = isEditing
      ? (this.incomeValue() || 0)
      : (this.record()?.income || 0);

    const diesel = isEditing
      ? (this.dieselExpenseValue() || 0)
      : (this.record()?.dieselExpense || 0);

    const pagoChofer = this.currentPaymentBreakdown().amount;

    // Cálculo exacto sin redondeo: todos los valores son enteros
    const neto = income - diesel - pagoChofer;

    return neto;
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

  // Effect para habilitar/deshabilitar el formulario según el modo de edición
  // Esto resuelve el warning: It looks like you're using the disabled attribute with a reactive form directive...
  private formStateEffect = effect(() => {
    const isEditing = this.isEditMode();
    if (isEditing) {
      this.recordForm.enable({ emitEvent: false });
    } else {
      this.recordForm.disable({ emitEvent: false });
    }
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

        // Actualizar validación de observaciones cuando cambia isEmergency
        const observationsControl = this.recordForm.get('observations');
        if (value) {
          // Si hay incidente crítico, las observaciones son obligatorias
          observationsControl?.setValidators([Validators.required]);
        } else {
          // Si no hay incidente crítico, las observaciones son opcionales
          observationsControl?.clearValidators();
        }
        observationsControl?.updateValueAndValidity();
      }
    });
  }

  private loadRecord(id: string): void {
    this.isLoading.set(true);

    forkJoin({
      record: this.dailyRecordService.getDailyRecordById(id),
      history: this.dailyRecordService.getDailyRecordHistory(id)
    }).subscribe({
      next: ({ record, history }) => {
        const viewRecord = this.mapToDetailView(record);
        const recordWithHistory = { ...viewRecord, history };

        this.record.set(recordWithHistory);
        this.recordForm.patchValue({
          noWorkDay: recordWithHistory.noWorkDay,
          noWorkDayReason: recordWithHistory.noWorkDayReason || '',
          isEmergency: recordWithHistory.isEmergency || false,
          income: recordWithHistory.income,
          dieselExpense: recordWithHistory.dieselExpense,
          dieselLiters: recordWithHistory.dieselLiters || 0,
          observations: recordWithHistory.observations || ''
        });

        // Configurar validación condicional de observaciones según isEmergency
        const observationsControl = this.recordForm.get('observations');
        if (recordWithHistory.isEmergency) {
          observationsControl?.setValidators([Validators.required]);
        } else {
          observationsControl?.clearValidators();
        }
        observationsControl?.updateValueAndValidity();

        if (recordWithHistory.receipt?.imageUrl) {
          this.receiptPreview.set(recordWithHistory.receipt.imageUrl);
        }
        if (recordWithHistory.comprobanteRegistro?.imageUrl) {
          this.registroPreview.set(recordWithHistory.comprobanteRegistro.imageUrl);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar registro o historial:', error);
        this.isLoading.set(false);
        // Mostrar error global
        this.globalErrorService.showError(
          'No se pudo cargar el registro diario desde el servidor.',
          'Error al cargar registro diario'
        );
      }
    });
  }

  /**
   * Mapear desde el modelo unificado a la vista de detalle
   */
  private mapToDetailView(record: DailyRecord): DailyRecordDetailView {
    // Formatear fecha usando parseo local para evitar problemas de zona horaria
    const date = this.parseLocalDate(record.fecha);
    const formattedDate = date
      ? date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
      : record.fecha;

    // Mapear comprobante de diesel
    const receipt = record.comprobante_diesel ? {
      amount: record.comprobante_diesel.monto,
      uploadedAt: record.comprobante_diesel.subido_en
        ? this.formatDateToChileTime(record.comprobante_diesel.subido_en)
        : undefined,
      imageUrl: record.comprobante_diesel.imagen_url
    } : undefined;

    // Mapear comprobante del registro diario (desde imagen_url del backend)
    // El backend devuelve imagen_url directamente, no en un objeto anidado
    const comprobanteRegistro = record.comprobante_registro ? {
      imageUrl: record.comprobante_registro.imagen_url,
      uploadedAt: record.comprobante_registro.subido_en
        ? this.formatDateToChileTime(record.comprobante_registro.subido_en)
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

      // Configurar validación condicional de observaciones según isEmergency
      const observationsControl = this.recordForm.get('observations');
      if (this.record()!.isEmergency) {
        observationsControl?.setValidators([Validators.required]);
      } else {
        observationsControl?.clearValidators();
      }
      observationsControl?.updateValueAndValidity();
    }
    this.receiptFile.set(null);
    this.receiptPreview.set(this.record()?.receipt?.imageUrl || null);
    this.registroFile.set(null);
    this.registroPreview.set(this.record()?.comprobanteRegistro?.imageUrl || null);
    this.isEditMode.set(false);
  }

  saveRecord(): void {
    if (this.isSubmittingRecord()) return;

    if (this.recordForm.valid && this.record()) {
      this.isSubmittingRecord.set(true);
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
      // Guardar si se subieron archivos nuevos para actualizar uploadedAt después
      const hasNewRegistroFile = !!registroFile;
      const hasNewReceiptFile = !!receiptFile;
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

            // Agregar URLs de imágenes subidas (nuevas)
            results.forEach(result => {
              if (result.type === 'registro') {
                updateDto.comprobante_registro = { imagen: result.url };
              } else if (result.type === 'diesel') {
                updateDto.comprobante_diesel = { imagen: result.url };
              }
            });

            // Si solo se cambió una imagen, mantener la URL existente de la otra
            const hasRegistroUpload = results.some(r => r.type === 'registro');
            const hasDieselUpload = results.some(r => r.type === 'diesel');

            if (!hasRegistroUpload && currentRecord.comprobanteRegistro?.imageUrl) {
              updateDto.comprobante_registro = { imagen: currentRecord.comprobanteRegistro.imageUrl };
            }

            if (!hasDieselUpload && currentRecord.receipt?.imageUrl) {
              updateDto.comprobante_diesel = { imagen: currentRecord.receipt.imageUrl };
            }

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
        // 5. Después de actualizar, recargar el registro completo y su historial
        // para obtener todos los datos actualizados (historial, desglose de pago, etc.)
        switchMap(() => {
          return forkJoin({
            record: this.dailyRecordService.getDailyRecordById(recordId),
            history: this.dailyRecordService.getDailyRecordHistory(recordId)
          });
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

            // Restaurar validación condicional de observaciones
            const observationsControl = this.recordForm.get('observations');
            if (this.previousRecordState.isEmergency) {
              observationsControl?.setValidators([Validators.required]);
            } else {
              observationsControl?.clearValidators();
            }
            observationsControl?.updateValueAndValidity();
          }

          // 7. Notificar al usuario
          this.showErrorToast('No se pudo guardar el registro. Intenta nuevamente.');
          this.isSubmittingRecord.set(false);

          return EMPTY;
        })
      ).subscribe({
        next: ({ record: updatedRecord, history }) => {
          // 8. Actualizar con el registro e historial recargados del servidor
          // El backend ahora devuelve los timestamps de actualización de imágenes
          const viewRecord = this.mapToDetailView(updatedRecord);
          const recordWithHistory = { ...viewRecord, history };
          this.record.set(recordWithHistory);

          // 9. Actualizar el formulario con los valores del servidor
          this.recordForm.patchValue({
            noWorkDay: recordWithHistory.noWorkDay,
            noWorkDayReason: recordWithHistory.noWorkDayReason || '',
            isEmergency: recordWithHistory.isEmergency || false,
            income: recordWithHistory.income,
            dieselExpense: recordWithHistory.dieselExpense,
            dieselLiters: recordWithHistory.dieselLiters || 0,
            observations: recordWithHistory.observations || ''
          });

          // Configurar validación condicional de observaciones según isEmergency
          const observationsControl = this.recordForm.get('observations');
          if (recordWithHistory.isEmergency) {
            observationsControl?.setValidators([Validators.required]);
          } else {
            observationsControl?.clearValidators();
          }
          observationsControl?.updateValueAndValidity();

          // 10. Actualizar previews de imágenes con las URLs del servidor
          if (viewRecord.receipt?.imageUrl) {
            this.receiptPreview.set(viewRecord.receipt.imageUrl);
          }
          if (viewRecord.comprobanteRegistro?.imageUrl) {
            this.registroPreview.set(viewRecord.comprobanteRegistro.imageUrl);
          }

          // 11. Invalidar caché de liquidación para todas las semanas del mes
          // Esto es necesario porque los cambios en registros diarios afectan los cálculos de liquidación
          if (updatedRecord?.fecha) {
            try {
              const dateParts = getDatePartsInChile(updatedRecord.fecha);
              if (dateParts.year > 0 && dateParts.month > 0) {
                this.accountingService.invalidateAllWeeksInMonth(dateParts.month, dateParts.year);
              }
            } catch (error) {
              console.warn('Error al invalidar caché de liquidación:', error);
            }
          }

          this.isEditMode.set(false);
          this.receiptFile.set(null);
          this.registroFile.set(null);
          this.previousRecordState = null;
          this.showSuccessToast('Registro guardado exitosamente');
          this.isSubmittingRecord.set(false);
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

  /**
   * Parsea una fecha en formato YYYY-MM-DD como fecha local (evita problemas de zona horaria)
   */
  private parseLocalDate(value: string): Date | null {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Formatea una fecha UTC a hora de Chile (America/Santiago)
   * Maneja correctamente la conversión de zona horaria
   */
  formatDateToChileTime(dateString: string | null | undefined): string {
    // Manejar valores nulos, undefined o vacíos
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '';
    }

    try {
      // Asegurarnos de que es un string
      if (typeof dateString !== 'string') {
        console.warn('Expected string but got:', typeof dateString, dateString);
        return '';
      }

      // Limpiar el string
      let dateStr = dateString.trim();

      // Si está vacío después de trim, retornar vacío
      if (!dateStr) {
        return '';
      }

      // Si la fecha viene sin 'Z' al final y no tiene offset, asumimos que es UTC
      // Si viene con 'Z', JavaScript la interpretará correctamente como UTC
      // Si viene con offset (+00:00, -03:00, etc), JavaScript la interpretará correctamente
      if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        // Si no tiene timezone info, agregar 'Z' para indicar UTC
        dateStr = dateStr + 'Z';
      }

      const date = new Date(dateStr);

      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.warn('Invalid date received:', dateString);
        return '';
      }

      // Formatear en hora de Chile usando la zona horaria específica
      const formatted = date.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '';
    }
  }

  formatTimeAgo(timestamp: string): string {
    if (!timestamp) {
      return '';
    }

    // Parsear la fecha preservando la hora
    let dateStr = timestamp.trim();
    // Si no tiene timezone, asumir UTC
    if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      dateStr = dateStr + 'Z';
    }
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      return '';
    }

    // Obtener la fecha/hora actual
    const now = new Date();

    // Calcular diferencia en milisegundos directamente
    // (ambas fechas están en UTC internamente, la diferencia es correcta)
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    // Para días, usar función que compara solo fechas (sin horas)
    const diffDays = getDaysDifferenceInChile(timestamp);

    if (diffMins < 1) {
      return 'Hace menos de 1 min';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24 && diffDays === 0) {
      return `Hace ${diffHours} h`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        day: 'numeric',
        month: 'short'
      });
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
    // Usar Location.back() para regresar a la página anterior
    // Esto funcionará automáticamente tanto desde el panel principal como desde registros diarios
    // Si no hay historial (acceso directo), navegar al dashboard como fallback

    // Verificar si hay historial en la sesión actual
    // window.history.length puede incluir todo el historial del navegador,
    // así que usamos una verificación más simple: intentar regresar
    const canGoBack = window.history.length > 1;

    if (canGoBack) {
      // Regresar a la página anterior (funciona desde panel principal o registros diarios)
      this.location.back();
    } else {
      // Si no hay historial, navegar al dashboard (panel principal) como fallback
      this.router.navigate(['/dashboard']);
    }
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
