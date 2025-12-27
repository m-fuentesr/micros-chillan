import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewRecordModalService, NewRecordFormData } from '../../services/new-record-modal.service';
import { MachineService } from '../../services/machine.service';
import { DriverService } from '../../services/driver.service';
import { AuthService } from '../../services/auth.service';
import { MachineSelect } from '../../models/machine.models';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { catchError, of, combineLatest, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-new-record-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="new-record-modal">
      <div class="modal-box max-w-2xl w-full max-h-[88vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-base-100 text-base-content rounded-3xl border border-base-200 shadow-2xl px-4 py-5 sm:px-6 sm:py-8 gap-5 sm:gap-6">
        <!-- Header -->
        <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-5 sm:p-6 border border-base-200/70 shadow-sm flex items-start gap-4 flex-shrink-0 animate-fade-in-down">
          <div class="p-3 sm:p-3.5 bg-primary/10 rounded-xl text-primary shrink-0 border border-primary/20 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M5.625 3A2.625 2.625 0 003 5.625v12.75A2.625 2.625 0 005.625 21h12.75A2.625 2.625 0 0021 18.375V9.75a.75.75 0 00-1.5 0v8.625c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h8.625a.75.75 0 000-1.5H5.625z" clip-rule="evenodd" />
              <path fill-rule="evenodd" d="M18.75 3a.75.75 0 00-.75.75V6h-2.25a.75.75 0 000 1.5H18v2.25a.75.75 0 001.5 0V7.5h2.25a.75.75 0 000-1.5H19.5V3.75A.75.75 0 0018.75 3z" clip-rule="evenodd" />
              <path d="M7.5 12.75c0-.414.336-.75.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM8.25 15.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0 grid gap-1.5">
            <div class="flex items-center gap-3 flex-wrap">
              <h3 class="text-xl sm:text-2xl font-bold leading-tight text-base-content">Nuevo Registro Diario</h3>
              <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">Nuevo Registro</span>
            </div>
            <p class="text-sm sm:text-base text-base-content/80 leading-relaxed">Completa los datos operativos de la jornada para crear un nuevo registro.</p>
            <p class="text-xs text-base-content/60">Guarda ingresos, diésel y estado en un solo paso.</p>
          </div>
          <button 
            type="button"
            class="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:bg-base-200 hover:text-base-content flex-shrink-0"
            (click)="modalService.cancel()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Body con scroll -->
        <div class="overflow-y-auto overscroll-contain flex-1 min-h-0 pr-1 custom-scrollbar">
          <form (ngSubmit)="onSubmit($event)" #form="ngForm" class="grid grid-cols-1 gap-4 sm:gap-6">
            <!-- Estado de operación -->
            <div class="rounded-3xl border border-base-200 bg-base-100 shadow-sm">
              <div class="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl"
                [class.ring-1]="modalService.formData().noWorkDay"
                [class.ring-primary/30]="modalService.formData().noWorkDay"
                [class.bg-primary/5]="modalService.formData().noWorkDay">
                <div class="min-w-0 flex-1 grid gap-1.5">
                  <span class="text-xs uppercase tracking-wide text-base-content/60">Estado de Operación</span>
                  <span class="text-sm font-semibold text-base-content">¿La máquina trabajó hoy?</span>
                </div>
                <label class="cursor-pointer inline-flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs font-semibold uppercase tracking-[0.08em] transition-colors whitespace-nowrap" 
                    [class.text-base-content/50]="!modalService.formData().noWorkDay" 
                    [class.text-primary]="modalService.formData().noWorkDay">
                    {{ modalService.formData().noWorkDay ? 'No Trabajado' : 'Operativo' }}
                  </span>
                  <input 
                    type="checkbox" 
                    class="toggle toggle-sm toggle-primary"
                    [ngModel]="modalService.formData().noWorkDay"
                    (ngModelChange)="updateField('noWorkDay', $event)"
                    name="noWorkDay" />
                </label>
              </div>
              
              @if (modalService.formData().noWorkDay) {
                <div class="border-t border-base-200 p-4 sm:p-5 md:p-6 bg-base-50 rounded-b-2xl mt-2 space-y-4">
                  <label class="form-control w-full">
                    <div class="label pt-0">
                      <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                        Motivo de Inactividad <span class="text-error">*</span>
                      </span>
                    </div>
                    <select 
                      class="select select-bordered w-full bg-base-100 text-sm border-base-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                      [ngModel]="modalService.formData().noWorkDayReason"
                      (ngModelChange)="updateField('noWorkDayReason', $event)"
                      name="noWorkDayReason">
                      <option value="">Seleccione un motivo...</option>
                      <option value="Descanso Semanal">Descanso Semanal</option>
                      <option value="Vacaciones">Vacaciones</option>
                      <option value="Licencia Médica">Licencia Médica</option>
                      <option value="Permiso Personal">Permiso Personal</option>
                      <option value="En Taller / Mantenimiento">En Taller / Mantenimiento</option>
                      <option value="Sin Chofer Asignado">Sin Chofer Asignado</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>
                  
                  @if (modalService.formData().noWorkDayReason === 'Otro') {
                    <label class="form-control w-full">
                      <div class="label pt-0">
                        <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                          Especificar motivo <span class="text-error">*</span>
                        </span>
                      </div>
                      <input 
                        type="text"
                        class="input input-bordered w-full bg-base-100 text-sm border-base-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                        [ngModel]="modalService.formData().noWorkDayReasonOther"
                        (ngModelChange)="updateField('noWorkDayReasonOther', $event)"
                        name="noWorkDayReasonOther"
                        placeholder="Describe el motivo de inactividad..."
                        maxlength="200" />
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Bento: Contexto -->
            <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5 md:p-6 grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label pb-2 pt-0">
                  <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                    Fecha <span class="text-error">*</span>
                  </span>
                </label>
                <input 
                  type="date" 
                  class="input input-bordered w-full h-11 rounded-lg text-sm text-base-content placeholder:text-base-content/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/70"
                  [ngModel]="modalService.formData().date"
                  (ngModelChange)="updateField('date', $event)"
                  name="date"
                  required />
              </div>
              <div class="form-control">
                <label class="label pb-2 pt-0">
                  <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                    Máquina <span class="text-error">*</span>
                  </span>
                </label>
                <select 
                  class="select select-bordered w-full h-11 rounded-lg text-sm text-base-content focus:border-primary focus:ring-2 focus:ring-primary/30"
                  [ngModel]="modalService.formData().machine"
                  (ngModelChange)="updateField('machine', $event)"
                  name="machine"
                  required>
                  <option value="">Seleccionar máquina</option>
                  @if (machines().length === 0) {
                    <option disabled>Cargando máquinas...</option>
                  }
                  @for (machine of machines(); track machine.id) {
                    <option [value]="machine.id.toString()">{{ machine.display_name }}</option>
                  }
                </select>
              </div>
              <div class="form-control md:col-span-2">
                <label class="label pb-2 pt-0">
                  <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                    Chofer Asignado <span class="text-error">*</span>
                  </span>
                </label>
                <select 
                  class="select select-bordered w-full h-11 rounded-lg text-sm text-base-content focus:border-primary focus:ring-2 focus:ring-primary/30"
                  [ngModel]="modalService.formData().driver"
                  (ngModelChange)="updateField('driver', $event)"
                  name="driver"
                  required>
                  <option value="">Seleccionar chofer</option>
                  @if (drivers().length === 0) {
                    <option disabled>Cargando choferes...</option>
                  }
                  @for (driver of drivers(); track driver.id) {
                    <option [value]="driver.id.toString()">{{ driver.nombre_completo }}</option>
                  }
                </select>
              </div>
            </div>

            @if (!modalService.formData().noWorkDay) {
              <!-- Bento: Ingresos / Consumos -->
              <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5 md:p-6 grid gap-4 md:grid-cols-2">
                <div class="form-control md:col-span-2">
                  <span class="text-xs uppercase tracking-wide text-base-content/60">Ingresos</span>
                </div>
                <div class="form-control">
                  <label class="label pb-2 pt-0">
                    <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                      Ingreso del Día <span class="text-error">*</span>
                    </span>
                  </label>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 font-semibold text-base group-focus-within:text-primary transition-colors">$</span>
                    <input 
                      type="number" 
                      class="input input-bordered w-full h-12 rounded-lg pl-8 pr-3 text-base font-semibold font-mono tabular-nums text-base-content placeholder:text-base-content/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/70"
                      [ngModel]="modalService.formData().income"
                      (ngModelChange)="updateNumberField('income', $event)"
                      (keydown)="preventInvalidNumberInput($event, 6)"
                      (input)="limitFieldDigits($event, 'income', 6)"
                      (focus)="onNumberFieldFocus($event, 'income')"
                      name="income"
                      placeholder="0"
                      min="0"
                      max="999999"
                      required />
                  </div>
                </div>
                <div class="form-control">
                  <label class="label pb-2 pt-0 items-baseline justify-between">
                    <span class="label-text text-xs uppercase tracking-wide text-base-content/60">Gasto en Diésel</span>
                    <span class="label-text-alt text-[11px] text-base-content/60">Opcional</span>
                  </label>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 font-semibold text-base group-focus-within:text-primary transition-colors">$</span>
                    <input 
                      type="number" 
                      class="input input-bordered w-full h-12 rounded-lg pl-8 pr-3 text-base font-semibold font-mono tabular-nums text-base-content placeholder:text-base-content/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/70"
                      [ngModel]="modalService.formData().dieselExpense"
                      (ngModelChange)="updateNumberField('dieselExpense', $event)"
                      (keydown)="preventInvalidNumberInput($event, 6)"
                      (input)="limitFieldDigits($event, 'dieselExpense', 6)"
                      (focus)="onNumberFieldFocus($event, 'dieselExpense')"
                      name="dieselExpense"
                      placeholder="0"
                      min="0"
                      max="999999" />
                  </div>
                </div>
                <div class="form-control md:col-span-2">
                  <label class="label pb-2 pt-0 items-baseline justify-between">
                    <span class="label-text text-xs uppercase tracking-wide text-base-content/60">Litros Cargados</span>
                    <span class="label-text-alt text-[11px] text-base-content/60">Opcional</span>
                  </label>
                  <div class="input input-bordered h-12 rounded-lg px-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/70">
                    <input 
                      type="number" 
                      class="grow bg-transparent border-0 focus:outline-none text-base font-semibold font-mono text-base-content placeholder:text-base-content/50"
                      [ngModel]="modalService.formData().dieselLiters"
                      (ngModelChange)="updateNumberField('dieselLiters', $event)"
                      (keydown)="preventInvalidNumberInput($event, 3, true)"
                      (input)="limitFieldDigits($event, 'dieselLiters', 3, true)"
                      (focus)="onNumberFieldFocus($event, 'dieselLiters')"
                      name="dieselLiters"
                      step="0.1"
                      placeholder="0.0"
                      min="0"
                      max="999.9" />
                    <span class="px-2 py-1 rounded-md bg-base-200 text-[11px] font-mono text-base-content/80 border border-base-200">LTS</span>
                  </div>
                </div>
              </div>
            }

            <!-- Bento: Uploads (solo si es día trabajado) -->
            @if (!modalService.formData().noWorkDay) {
            <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-5 sm:p-6 grid gap-5 sm:gap-6 md:grid-cols-[1.618fr_1fr]">
              <!-- Foto Comprobante (Obligatorio) -->
              <div class="form-control">
                <label class="label items-center justify-between pb-2.5 pt-0 mb-0">
                  <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                    Foto Comprobante <span class="text-error">*</span>
                  </span>
                  <span class="label-text-alt text-[10px] font-medium text-base-content/50 bg-error/10 text-error px-2 py-0.5 rounded-md">Obligatorio</span>
                </label>
                <label 
                  class="group relative block w-full min-h-[140px] sm:min-h-[160px] rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden
                    [&:has(input:focus)]:border-primary [&:has(input:focus)]:ring-2 [&:has(input:focus)]:ring-primary/20 [&:has(input:focus)]:bg-primary/5
                    hover:border-primary/50 hover:bg-base-50/50
                    [&.has-file]:border-primary/30 [&.has-file]:bg-primary/5
                    [&.dragover]:border-primary [&.dragover]:bg-primary/10 [&.dragover]:ring-2 [&.dragover]:ring-primary/20"
                  [class.has-file]="modalService.formData().receiptPhoto"
                  [class.border-error]="fileError('receiptPhoto')"
                  [class.bg-error/5]="fileError('receiptPhoto')"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event, 'receiptPhoto')">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif"
                    class="hidden"
                    (change)="onFileChange('receiptPhoto', $event)"
                    aria-label="Subir foto comprobante"
                  />
                  @if (getFilePreview('receiptPhoto'); as preview) {
                    <div class="absolute inset-0 flex items-center justify-center bg-base-100/98 backdrop-blur-sm z-10 rounded-lg">
                      <button
                        type="button"
                        class="absolute top-2 right-2 w-7 h-7 rounded-full bg-error/90 hover:bg-error text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-20 group"
                        (click)="removeFile('receiptPhoto', $event)"
                        aria-label="Eliminar foto">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 group-hover:scale-110 transition-transform">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                      <div class="text-center p-4 max-w-full">
                        <div class="w-20 h-20 mx-auto mb-3 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md ring-1 ring-base-200">
                          <img [src]="preview" alt="Preview" class="w-full h-full object-cover" />
                        </div>
                        <p class="text-xs font-semibold text-base-content truncate max-w-full px-2">
                          {{ fileLabel(modalService.formData().receiptPhoto, '') }}
                        </p>
                        <p class="text-[10px] text-base-content/60 mt-1.5">Click para cambiar</p>
                      </div>
                    </div>
                  }
                  <div class="flex flex-col items-center justify-center h-full min-h-[140px] sm:min-h-[160px] p-5 sm:p-6 gap-3.5">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6 sm:w-7 sm:h-7">
                        <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="text-center space-y-1">
                      <p class="text-sm sm:text-base font-semibold text-base-content leading-tight">
                        {{ modalService.formData().receiptPhoto ? 'Archivo seleccionado' : 'Arrastra o haz click' }}
                      </p>
                      <p class="text-xs sm:text-sm text-base-content/70 leading-tight">
                        {{ modalService.formData().receiptPhoto ? fileLabel(modalService.formData().receiptPhoto, '') : 'Subir foto (máx. 5MB)' }}
                      </p>
                      <p class="text-[10px] sm:text-xs text-base-content/50 mt-2 flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 flex-shrink-0">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
                        </svg>
                        <span>JPG, PNG, WebP</span>
                      </p>
                    </div>
                  </div>
                </label>
                @if (fileError('receiptPhoto')) {
                  <p class="text-xs text-error mt-2.5 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 flex-shrink-0">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                    <span>La foto comprobante es obligatoria.</span>
                  </p>
                }
              </div>

              <!-- Comprobante de Combustible (Opcional) -->
              <div class="form-control">
                <label class="label items-center justify-between pb-2.5 pt-0 mb-0">
                  <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                    Comprobante de Combustible
                  </span>
                  <span class="label-text-alt text-[10px] font-medium text-base-content/50 bg-base-200 px-2 py-0.5 rounded-md">Opcional</span>
                </label>
                <label 
                  class="group relative block w-full min-h-[140px] sm:min-h-[160px] rounded-lg border-2 border-dashed border-base-300 transition-all duration-200 cursor-pointer overflow-hidden
                    [&:has(input:focus)]:border-primary [&:has(input:focus)]:ring-2 [&:has(input:focus)]:ring-primary/20 [&:has(input:focus)]:bg-primary/5
                    hover:border-primary/40 hover:bg-base-50/50
                    [&.has-file]:border-primary/30 [&.has-file]:bg-primary/5
                    [&.dragover]:border-primary [&.dragover]:bg-primary/10 [&.dragover]:ring-2 [&.dragover]:ring-primary/20"
                  [class.has-file]="modalService.formData().fuelReceiptPhoto"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event, 'fuelReceiptPhoto')">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif"
                    class="hidden"
                    (change)="onFileChange('fuelReceiptPhoto', $event)"
                    aria-label="Subir comprobante combustible"
                  />
                  @if (getFilePreview('fuelReceiptPhoto'); as preview) {
                    <div class="absolute inset-0 flex items-center justify-center bg-base-100/98 backdrop-blur-sm z-10 rounded-lg">
                      <button
                        type="button"
                        class="absolute top-2 right-2 w-7 h-7 rounded-full bg-error/90 hover:bg-error text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-20 group"
                        (click)="removeFile('fuelReceiptPhoto', $event)"
                        aria-label="Eliminar foto">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 group-hover:scale-110 transition-transform">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                      <div class="text-center p-3 max-w-full">
                        <div class="w-16 h-16 mx-auto mb-2.5 rounded-lg overflow-hidden border-2 border-primary/20 shadow-md ring-1 ring-base-200">
                          <img [src]="preview" alt="Preview" class="w-full h-full object-cover" />
                        </div>
                        <p class="text-xs font-semibold text-base-content truncate max-w-full px-2">
                          {{ fileLabel(modalService.formData().fuelReceiptPhoto, '') }}
                        </p>
                        <p class="text-[10px] text-base-content/60 mt-1.5">Click para cambiar</p>
                      </div>
                    </div>
                  }
                  <div class="flex flex-col items-center justify-center h-full min-h-[140px] sm:min-h-[160px] p-5 sm:p-6 gap-3.5">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-base-200 text-base-content/70 flex items-center justify-center border-2 border-base-300 group-hover:bg-base-300 group-hover:text-base-content group-hover:border-base-400 transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6 sm:w-7 sm:h-7">
                        <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="text-center space-y-1">
                      <p class="text-sm sm:text-base font-semibold text-base-content/80 leading-tight">
                        {{ modalService.formData().fuelReceiptPhoto ? 'Archivo seleccionado' : 'Arrastra o haz click' }}
                      </p>
                      <p class="text-xs sm:text-sm text-base-content/70 leading-tight">
                        {{ modalService.formData().fuelReceiptPhoto ? fileLabel(modalService.formData().fuelReceiptPhoto, '') : 'Subir comprobante' }}
                      </p>
                      <p class="text-[10px] sm:text-xs text-base-content/50 mt-2 flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 flex-shrink-0">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
                        </svg>
                        <span>JPG, PNG, WebP</span>
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            }

            <!-- Selector de Incidente Crítico (solo si es día trabajado) -->
            @if (!modalService.formData().noWorkDay) {
            <div class="rounded-2xl border border-error/30 bg-error/10 shadow-sm p-4 sm:p-5 md:p-6">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-error shadow-sm border border-error/10 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-error truncate">¿Ocurrió un incidente crítico?</p>
                    <p class="text-xs text-error/80 italic">Choque, falla mecánica, etc.</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input 
                    type="checkbox" 
                    class="sr-only peer" 
                    [ngModel]="modalService.formData().hasIncident"
                    (ngModelChange)="updateField('hasIncident', $event)"
                    name="hasIncident" />
                  <div class="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
            }

            <!-- Observaciones (solo si es día trabajado) -->
            @if (!modalService.formData().noWorkDay) {
            <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5 md:p-6 grid gap-3">
              <label class="label pb-0 pt-0">
                <span class="label-text text-xs uppercase tracking-wide text-base-content/60">Observaciones</span>
              </label>
              <textarea 
                class="textarea textarea-bordered h-24 w-full rounded-lg text-sm leading-relaxed text-base-content placeholder:text-base-content/50 focus:textarea-primary focus:ring-2 focus:ring-primary/30 focus:border-primary/70" 
                [ngModel]="modalService.formData().observations"
                (ngModelChange)="updateField('observations', $event)"
                name="observations"
                placeholder="Escribe aquí cualquier novedad, incidente o comentario sobre la jornada..."></textarea>
            </div>
            }
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-action sticky bottom-0 left-0 right-0 bg-base-100 mt-2 pt-3 pb-3 border-t border-base-200 flex-shrink-0 justify-end gap-2 sm:gap-3 px-0 sm:px-2">
          <button 
            type="button" 
            class="btn btn-ghost gap-2 font-normal text-base-content hover:bg-base-200 hover:text-base-content"
            (click)="modalService.cancel()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
            [disabled]="!isFormValid() || modalService.isSubmitting()"
            (click)="modalService.save()">
            @if (modalService.isSubmitting()) {
              <span class="loading loading-spinner loading-sm"></span>
              <span>Guardando...</span>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
              <span>Guardar Registro</span>
            }
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" (click)="modalService.cancel()">
        <button>close</button>
      </form>
    </dialog>
  `,
  styles: [`
    /* Asegurar que el modal esté fijo en el viewport */
    dialog.modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
    }

    /* Backdrop con fondo semitransparente */
    .modal-backdrop {
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
    }

    /* Scrollbar personalizado */
    .custom-scrollbar::-webkit-scrollbar { 
      width: 6px; 
    }
    .custom-scrollbar::-webkit-scrollbar-track { 
      background: transparent; 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background-color: rgba(0, 0, 0, 0.1); 
      border-radius: 20px; 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewRecordModalComponent implements AfterViewInit, OnDestroy {
  modalService = inject(NewRecordModalService);
  machineService = inject(MachineService);
  driverService = inject(DriverService);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef);
  
  @ViewChild('dialogRef', { static: false }) dialogRef!: ElementRef<HTMLDialogElement>;

  // Cargar datos solo cuando el modal esté visible Y el usuario esté autenticado
  machines = toSignal(
    combineLatest([
      toObservable(this.modalService.isVisible),
      toObservable(this.authService.currentUser)
    ]).pipe(
      filter(([isVisible, user]) => isVisible && !!user),
      switchMap(() => {
        return this.machineService.getActiveMachines().pipe(
          catchError((error) => {
            console.error('Error obteniendo máquinas activas:', error);
            return of([]);
          })
        );
      })
    ),
    { initialValue: [] }
  );

  drivers = toSignal(
    combineLatest([
      toObservable(this.modalService.isVisible),
      toObservable(this.authService.currentUser)
    ]).pipe(
      filter(([isVisible, user]) => isVisible && !!user),
      switchMap(() => {
        return this.driverService.getActiveDrivers().pipe(
          catchError((error) => {
            console.error('Error obteniendo choferes activos:', error);
            return of([]);
          })
        );
      })
    ),
    { initialValue: [] }
  );

  ngAfterViewInit(): void {
    // Convertir signal a Observable para suscribirse (sin paréntesis para pasar el signal, no su valor)
    const isVisible$ = toObservable(this.modalService.isVisible);
    
    // Suscribirse a cambios de visibilidad para abrir/cerrar el dialog
    isVisible$
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((isVisible) => {
        const dialog = this.dialogRef?.nativeElement;
        
        if (dialog) {
          if (isVisible) {
            dialog.showModal();
          } else {
            dialog.close();
          }
        }
      });
    
    // Verificar si el modal ya está visible al inicializar
    if (this.modalService.isVisible()) {
      const dialog = this.dialogRef?.nativeElement;
      if (dialog) {
        dialog.showModal();
      }
    }
  }

  updateField(field: keyof NewRecordFormData, value: any): void {
    this.modalService.updateFormData({ [field]: value });
  }

  updateNumberField(field: 'income' | 'dieselExpense' | 'dieselLiters', value: string | number | null): void {
    const numValue = value === '' || value === null ? 0 : Number(value);
    this.modalService.updateFormData({ [field]: numValue });
  }

  preventInvalidNumberInput(event: KeyboardEvent, maxDigits: number, allowDecimals: boolean = false): void {
    // Prevenir entrada de 'e', 'E', '+', '-' (no permitimos números negativos)
    const invalidKeys = ['e', 'E', '+', '-'];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevenir entrada según el límite de dígitos del campo (excepto teclas de control)
    const input = event.target as HTMLInputElement;
    const currentValue = input.value || '';
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (!controlKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
      // Si permite decimales, contar solo los dígitos enteros (antes del punto)
      if (allowDecimals) {
        const integerPart = currentValue.split('.')[0] || '';
        const digitsOnly = integerPart.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= maxDigits && /[0-9]/.test(event.key)) {
          event.preventDefault();
          return;
        }
        // Permitir punto decimal solo si no existe ya
        if (event.key === '.' && currentValue.includes('.')) {
          event.preventDefault();
          return;
        }
      } else {
        // Para enteros, contar todos los dígitos
        const digitsOnly = currentValue.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= maxDigits && /[0-9]/.test(event.key)) {
          event.preventDefault();
          return;
        }
      }
    }
  }

  limitFieldDigits(event: Event, fieldName: 'income' | 'dieselExpense' | 'dieselLiters', maxDigits: number, allowDecimals: boolean = false): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    if (allowDecimals) {
      // Para campos con decimales, limitar solo la parte entera
      const parts = value.split('.');
      let integerPart = parts[0]?.replace(/[^0-9]/g, '') || '';
      const decimalPart = parts[1]?.replace(/[^0-9]/g, '').substring(0, 1) || ''; // Máximo 1 decimal
      
      // Limitar parte entera a maxDigits dígitos
      if (integerPart.length > maxDigits) {
        integerPart = integerPart.substring(0, maxDigits);
      }
      
      // Reconstruir el valor
      if (decimalPart) {
        value = `${integerPart}.${decimalPart}`;
      } else if (value.includes('.')) {
        value = `${integerPart}.`;
      } else {
        value = integerPart;
      }
    } else {
      // Para enteros, limitar todos los dígitos
      value = value.replace(/[^0-9]/g, '');
      if (value.length > maxDigits) {
        value = value.substring(0, maxDigits);
      }
    }
    
    // Actualizar el valor del input
    input.value = value;
    
    // Actualizar el formulario
    const numValue = value === '' ? 0 : (allowDecimals ? parseFloat(value) : parseInt(value, 10));
    this.updateNumberField(fieldName, isNaN(numValue) ? 0 : numValue);
  }

  onNumberFieldFocus(event: FocusEvent, fieldName: 'income' | 'dieselExpense' | 'dieselLiters'): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    
    // Si el valor es "0" o está vacío, seleccionar todo el texto
    // Esto permite que al escribir se reemplace automáticamente
    if (currentValue === '0' || currentValue === '' || currentValue === '0.0' || currentValue === '0.') {
      // Usar setTimeout para asegurar que la selección ocurra después del focus
      setTimeout(() => {
        input.select();
      }, 0);
    }
  }

  onFileChange(field: 'receiptPhoto' | 'fuelReceiptPhoto', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    
    // Limpiar la URL anterior si existe
    const existingUrl = this.previewUrls.get(field);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
      this.previewUrls.delete(field);
    }
    
    this.modalService.updateFormData({ [field]: file });
  }

  removeFile(field: 'receiptPhoto' | 'fuelReceiptPhoto', event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Liberar la URL del objeto para evitar memory leaks
    const previewUrl = this.previewUrls.get(field);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrls.delete(field);
    }
    
    // Limpiar el archivo del formulario
    this.modalService.updateFormData({ [field]: null });
    
    // Limpiar el input file para permitir seleccionar el mismo archivo nuevamente
    const label = (event.target as HTMLElement).closest('label');
    if (label) {
      const input = label.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('dragover');
  }

  onDrop(event: DragEvent, field: 'receiptPhoto' | 'fuelReceiptPhoto'): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('dragover');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validar que sea una imagen
      if (file.type.startsWith('image/')) {
        this.modalService.updateFormData({ [field]: file });
      }
    }
  }

  fileLabel(file: File | null, fallback: string): string {
    return file ? file.name : fallback;
  }

  private previewUrls: Map<string, string> = new Map();

  getFilePreview(field: 'receiptPhoto' | 'fuelReceiptPhoto'): string | null {
    const file = this.modalService.formData()[field];
    if (file && file instanceof File) {
      // Si ya existe una URL para este archivo, reutilizarla
      const existingUrl = this.previewUrls.get(field);
      if (existingUrl) {
        return existingUrl;
      }
      // Crear nueva URL y guardarla
      const url = URL.createObjectURL(file);
      this.previewUrls.set(field, url);
      return url;
    }
    // Si no hay archivo, limpiar la URL si existe
    const existingUrl = this.previewUrls.get(field);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
      this.previewUrls.delete(field);
    }
    return null;
  }

  fileError(field: 'receiptPhoto'): boolean {
    const data = this.modalService.formData();
    if (field === 'receiptPhoto') {
      return !data.receiptPhoto;
    }
    return false;
  }

  isFormValid(): boolean {
    const data = this.modalService.formData();
    // Validar campos requeridos básicos
    if (!data.date || !data.machine || !data.driver) {
      return false;
    }
    // Si no es día no trabajado, validar ingresos y foto comprobante
    if (!data.noWorkDay) {
      if (data.income === undefined || data.income === null || data.income < 0) {
        return false;
      }
      // Foto comprobante obligatoria solo en días trabajados
      if (!data.receiptPhoto) {
        return false;
      }
    }
    // Si es día no trabajado, validar motivo
    if (data.noWorkDay) {
      if (!data.noWorkDayReason) {
        return false;
      }
      // Si el motivo es "Otro", validar que haya texto
      if (data.noWorkDayReason === 'Otro' && !data.noWorkDayReasonOther?.trim()) {
        return false;
      }
    }
    return true;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isFormValid()) {
      this.modalService.save();
    }
  }

  ngOnDestroy(): void {
    // Limpiar todas las URLs de objetos para evitar memory leaks
    this.previewUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.previewUrls.clear();
  }
}

