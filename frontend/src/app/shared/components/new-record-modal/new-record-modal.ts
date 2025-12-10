import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewRecordModalService, NewRecordFormData } from '../../services/new-record-modal.service';

@Component({
  selector: 'app-new-record-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="new-record-modal">
      <div class="modal-box max-w-2xl w-full max-h-[88vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-base-100 text-base-content rounded-2xl border border-base-200 shadow-2xl px-4 py-5 sm:px-6 sm:py-8 gap-5 sm:gap-6">
        <!-- Header -->
        <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-2xl p-5 sm:p-6 border border-base-200/70 shadow-sm flex items-start gap-4 flex-shrink-0 animate-fade-in-down">
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
            <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm">
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
                <div class="border-t border-base-200 p-4 sm:p-5 md:p-6 bg-base-50 rounded-b-2xl mt-2">
                  <label class="form-control w-full">
                    <div class="label pt-0">
                      <span class="label-text text-xs uppercase tracking-wide text-base-content/60">Motivo de Inactividad</span>
                    </div>
                    <select 
                      class="select select-bordered w-full bg-base-100 text-sm border-base-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                      [ngModel]="modalService.formData().noWorkDayReason"
                      (ngModelChange)="updateField('noWorkDayReason', $event)"
                      name="noWorkDayReason">
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
                      name="income"
                      placeholder="0"
                      min="0"
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
                      name="dieselExpense"
                      placeholder="0"
                      min="0" />
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
                      name="dieselLiters"
                      step="0.1"
                      placeholder="0.0"
                      min="0" />
                    <span class="px-2 py-1 rounded-md bg-base-200 text-[11px] font-mono text-base-content/80 border border-base-200">LTS</span>
                  </div>
                </div>
              </div>
            }

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
                  <option value="Máquina 01">Máquina 01</option>
                  <option value="Máquina 02">Máquina 02</option>
                  <option value="Máquina 03">Máquina 03</option>
                  <option value="Máquina 04">Máquina 04</option>
                  <option value="Máquina 05">Máquina 05</option>
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
                  <option value="Juan Pérez">Juan Pérez</option>
                  <option value="Luis Martínez">Luis Martínez</option>
                  <option value="Ana Gómez">Ana Gómez</option>
                </select>
              </div>
            </div>

            <!-- Bento: Uploads -->
            <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5 md:p-6 grid gap-4">
              <div class="form-control">
                <label class="label items-center justify-between pb-2 pt-0">
                  <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                    Foto comprobante <span class="text-error">*</span>
                  </span>
                </label>
                <label class="input input-bordered h-12 rounded-lg px-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/70 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    class="hidden"
                    (change)="onFileChange('receiptPhoto', $event)"
                    aria-label="Subir foto comprobante"
                  />
                  <div class="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-base-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M4.75 2A1.75 1.75 0 003 3.75v12.5A1.75 1.75 0 004.75 18h10.5A1.75 1.75 0 0017 16.25V7.914a1.75 1.75 0 00-.513-1.237l-3.164-3.164A1.75 1.75 0 0012.086 3H4.75zm7.5 8a.75.75 0 10-1.5 0v1.5H9.25a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5V10z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-base-content truncate">
                      {{ fileLabel(modalService.formData().receiptPhoto, 'Subir foto (máx. 5MB)') }}
                    </p>
                    <p class="text-[11px] text-base-content/60 truncate">Formatos: JPG, PNG, HEIC</p>
                  </div>
                </label>
                <p class="text-[11px] text-error mt-2" *ngIf="fileError('receiptPhoto')">La foto comprobante es obligatoria.</p>
              </div>

              <div class="form-control">
                <label class="label pb-2 pt-0">
                  <span class="label-text text-xs uppercase tracking-wide text-base-content/60">Comprobante de combustible (opcional)</span>
                </label>
                <label class="input input-bordered h-12 rounded-lg px-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/70 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    class="hidden"
                    (change)="onFileChange('fuelReceiptPhoto', $event)"
                    aria-label="Subir comprobante combustible"
                  />
                  <div class="p-2 rounded-lg bg-base-200 text-base-content flex items-center justify-center border border-base-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M5.75 2A1.75 1.75 0 004 3.75v12.5A1.75 1.75 0 005.75 18h8.5A1.75 1.75 0 0016 16.25v-7.5a.75.75 0 00-1.5 0v7.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25V3.75a.25.25 0 01.25-.25h3a.25.25 0 01.25.25v1.5c0 .966.784 1.75 1.75 1.75h1.5c.414 0 .75-.336.75-.75V3.75A1.75 1.75 0 0010.25 2h-4.5zM12 3.75v1.25h-.75a.25.25 0 01-.25-.25V3.75c0-.086-.01-.17-.029-.25H12z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-base-content truncate">
                      {{ fileLabel(modalService.formData().fuelReceiptPhoto, 'Subir comprobante (opcional)') }}
                    </p>
                    <p class="text-[11px] text-base-content/60 truncate">Formatos: JPG, PNG, HEIC</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Selector de Incidente Crítico -->
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

            <!-- Observaciones -->
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
            [disabled]="!isFormValid()"
            (click)="modalService.save()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
            </svg>
            Guardar Registro
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
export class NewRecordModalComponent implements AfterViewInit {
  modalService = inject(NewRecordModalService);
  
  @ViewChild('dialogRef', { static: false }) dialogRef!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    // Efecto para abrir/cerrar el dialog HTML5 cuando cambia isVisible
    effect(() => {
      const isVisible = this.modalService.isVisible();
      const dialog = this.dialogRef?.nativeElement;
      
      if (dialog) {
        if (isVisible) {
          dialog.showModal();
        } else {
          dialog.close();
        }
      }
    });
  }

  updateField(field: keyof NewRecordFormData, value: any): void {
    this.modalService.updateFormData({ [field]: value });
  }

  updateNumberField(field: 'income' | 'dieselExpense' | 'dieselLiters', value: string | number | null): void {
    const numValue = value === '' || value === null ? 0 : Number(value);
    this.modalService.updateFormData({ [field]: numValue });
  }

  onFileChange(field: 'receiptPhoto' | 'fuelReceiptPhoto', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.modalService.updateFormData({ [field]: file });
  }

  fileLabel(file: File | null, fallback: string): string {
    return file ? file.name : fallback;
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
    // Si no es día no trabajado, validar ingresos
    if (!data.noWorkDay) {
      if (data.income === undefined || data.income === null || data.income < 0) {
        return false;
      }
    }
    // Foto comprobante obligatoria
    if (!data.receiptPhoto) {
      return false;
    }
    // Si es día no trabajado, validar motivo
    if (data.noWorkDay && !data.noWorkDayReason) {
      return false;
    }
    return true;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isFormValid()) {
      this.modalService.save();
    }
  }
}

