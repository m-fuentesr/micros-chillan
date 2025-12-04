import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import type { DailyRecord, DailyRecordHistoryItem } from '../../shared/models/daily-record.models';
import { catchError, EMPTY } from 'rxjs';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgOptimizedImage],
  template: `
    <div class="bg-base-200 p-4 sm:p-6 rounded-lg">
      <!-- Sticky Header -->
      <div class="bg-base-100 border-b border-base-200 sticky top-0 z-30 shadow-sm transition-all">
        <div class="px-4 sm:px-6 py-3 sm:py-4 lg:h-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button 
              class="btn btn-circle btn-ghost btn-sm text-base-content/60 hover:bg-base-200 flex-shrink-0" 
              (click)="goBack()"
              type="button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl sm:text-3xl font-black text-base-content flex flex-wrap items-center gap-2 sm:gap-3 border-l-4 border-l-primary pl-3 mb-3">
                <span class="truncate">Registro #{{ record()?.id || '--' }}</span>
                @if (isIncidente()) {
                  <span class="badge badge-error gap-1 font-mono font-bold text-white shadow-sm shadow-error/20 text-xs sm:text-sm whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Incidente
                  </span>
                } @else if (isCompleto()) {
                  <span class="badge badge-success gap-1 font-mono font-bold text-white shadow-sm shadow-success/20 text-xs sm:text-sm whitespace-nowrap">✓ Completo</span>
                } @else {
                  <span class="badge badge-warning gap-1 font-mono font-bold text-warning-content text-xs sm:text-sm whitespace-nowrap">⏳ Pendiente</span>
                }
              </h1>
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-base-content/60 font-normal italic mt-0.5">
                <span class="truncate">📅 {{ record()?.date }}</span>
                <span class="hidden sm:inline">•</span>
                <span class="truncate">🚛 {{ record()?.machine }}</span>
                <span class="hidden sm:inline">•</span>
                <span class="truncate">👷 {{ record()?.driver }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 w-full sm:w-auto justify-end">
            @if (!isEditMode()) {
              <button 
                class="btn btn-primary btn-sm gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex-1 sm:flex-none" 
                (click)="enableEditMode()"
                type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                </svg>
                <span class="hidden sm:inline">Editar</span>
                <span class="sm:hidden">Editar</span>
              </button>
            } @else {
              <button 
                class="btn btn-ghost btn-sm flex-1 sm:flex-none" 
                (click)="cancelEdit()"
                type="button">Cancelar</button>
              <button 
                class="btn btn-success text-white btn-sm gap-2 shadow-lg shadow-success/20 flex-1 sm:flex-none" 
                (click)="saveRecord()"
                [disabled]="recordForm.invalid"
                type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span class="hidden sm:inline">Guardar</span>
                <span class="sm:hidden">Guardar</span>
              </button>
            }
          </div>
        </div>
      </div>

      <div class="px-4 sm:px-6 pt-4 sm:pt-6 pb-12 space-y-4 sm:space-y-6">
        @if (isLoading()) {
          <div class="flex justify-start items-center h-64 pl-4 border-l-4 border-l-primary">
            <span class="loading loading-spinner loading-lg"></span>
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
                  <div class="text-sm opacity-90 italic mt-1">El conductor reportó un choque leve en parachoques trasero. Revisa las observaciones y fotos antes de validar.</div>
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
                            <option value="En Taller / Mantenimiento">En Taller / Mantenimiento</option>
                            <option value="Sin Chofer Asignado">Sin Chofer Asignado</option>
                            <option value="Licencia Médica">Licencia Médica</option>
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
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 sm:w-6 sm:h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
                          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm flex-shrink-0 text-sm sm:text-base">⚠️</div>
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
                    <div class="flex justify-between items-center mb-3 sm:mb-4">
                      <h3 class="font-bold text-sm sm:text-base">Comprobante del Registro Diario</h3>
                      @if (hasComprobanteRegistro()) {
                        <span class="badge badge-success badge-xs gap-1 py-1.5 sm:py-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="hidden sm:inline">Validado</span>
                        </span>
                      }
                    </div>
                    
                    @if (hasComprobanteRegistro() && !isEditMode()) {
                      <div class="relative group rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-[4/3] flex items-center justify-center cursor-zoom-in shadow-inner">
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
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm">
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
                    
                    @if (isEditMode() || !hasComprobanteRegistro()) {
                      <label class="block w-full aspect-[4/3] border-2 border-dashed border-base-300 rounded-xl bg-base-50 hover:bg-base-100 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group">
                        <input 
                          type="file" 
                          class="hidden" 
                          accept="image/*" 
                          (change)="onRegistroSelected($event)"
                          [disabled]="!isEditMode()" />
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
                          @if (isEditMode()) {
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm2.25-2.25h.008v.008h-.008V10.5z" />
                              </svg>
                              <span class="font-bold text-sm">Cambiar foto</span>
                            </div>
                          }
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
                    <div class="flex justify-between items-center mb-3 sm:mb-4">
                      <h3 class="font-bold text-sm sm:text-base">Comprobante Diésel</h3>
                      <span class="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Opcional</span>
                      @if (hasComprobante()) {
                        <span class="badge badge-success badge-xs gap-1 py-1.5 sm:py-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="hidden sm:inline">Validado</span>
                        </span>
                      }
                    </div>
                    
                    @if (hasComprobante() && !isEditMode()) {
                      <div class="relative group rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-[4/3] flex items-center justify-center cursor-zoom-in shadow-inner">
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
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm">
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
                    
                    @if (isEditMode() || !hasComprobante()) {
                      <label class="block w-full aspect-[4/3] border-2 border-dashed border-base-300 rounded-xl bg-base-50 hover:bg-base-100 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group">
                        <input 
                          type="file" 
                          class="hidden" 
                          accept="image/*" 
                          (change)="onReceiptSelected($event)"
                          [disabled]="!isEditMode()" />
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
                          @if (isEditMode()) {
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm2.25-2.25h.008v.008h-.008V10.5z" />
                              </svg>
                              <span class="font-bold text-sm">Cambiar foto</span>
                            </div>
                          }
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
                            <span class="text-xs sm:text-sm font-normal italic text-base-content/60">A pagar al Chofer (30%)</span>
                      <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-primary tabular-nums tracking-tight break-all">
                        {{ (record()?.paymentBreakdown?.amount || 0) | currency:'CLP':'symbol':'1.0-0' }}
                      </span>
                    </div>
                    
                    <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden mb-2">
                      <div 
                        class="bg-primary h-full shadow-[0_0_10px_rgba(var(--p),0.5)] transition-all duration-500"
                        [style.width.%]="record()?.paymentBreakdown?.percentage || 0"></div>
                    </div>
                    <div class="flex justify-between text-[9px] sm:text-[10px] text-base-content/40 font-mono uppercase tracking-wide">
                      <span>Cálculo</span>
                      <span class="text-right break-all">Base: {{ (record()?.paymentBreakdown?.base || 0) | currency:'CLP':'symbol':'1.0-0' }}</span>
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroDiarioDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dailyRecordService = inject(DailyRecordService);

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
  hasComprobante = computed(() => !!this.record()?.receipt);
  hasComprobanteRegistro = computed(() => !!this.record()?.comprobanteRegistro?.imageUrl);
  historyItems = computed(() => this.record()?.history ?? []);

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
      
      // Mapear formulario a DTO de actualización
      const updateDto: any = {
        recaudado: formValue.noWorkDay ? undefined : formValue.income,
        costo_diesel: formValue.noWorkDay ? undefined : formValue.dieselExpense,
        litros_diesel: formValue.noWorkDay ? undefined : formValue.dieselLiters,
        dia_no_trabajado: formValue.noWorkDay || false,
        motivo_inactividad: formValue.noWorkDay ? (formValue.noWorkDayReason as any) : undefined,
        es_emergencia: formValue.isEmergency || false,
        observaciones: formValue.observations || null
      };
      
      // Actualizar comprobante si se subió una nueva imagen
      if (this.receiptFile()) {
        updateDto.comprobante_diesel = {
          monto: formValue.dieselExpense || 0,
          imagen: this.receiptFile()!
        };
      }
      
      this.dailyRecordService.updateDailyRecord(recordId, updateDto).pipe(
        catchError((error) => {
          // 3. Rollback en caso de error
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
          
          // 4. Notificar al usuario
          this.showErrorToast('No se pudo guardar el registro. Intenta nuevamente.');
          
          return EMPTY;
        })
      ).subscribe({
        next: (updatedRecord) => {
          const viewRecord = this.mapToDetailView(updatedRecord);
          this.record.set(viewRecord);
          this.isEditMode.set(false);
          this.receiptFile.set(null);
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
}
