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
      <div class="modal-box max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-base-200 flex-shrink-0">
          <div class="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-xl text-base-content">Nuevo Registro Diario</h3>
            <p class="text-xs text-base-content/60">Ingresa los datos operativos de la jornada</p>
          </div>
          <button 
            type="button"
            class="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:bg-base-200 flex-shrink-0"
            (click)="modalService.cancel()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Body con scroll -->
        <div class="overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
          <form (ngSubmit)="onSubmit($event)" #form="ngForm" class="space-y-4">
            <!-- Toggle Día No Trabajado -->
            <div class="card bg-base-200/50 border border-base-200">
              <div class="card-body p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <span class="font-bold text-sm block text-base-content">Estado de Operación</span>
                  <span class="text-xs text-base-content/60 italic block mt-0.5">¿La máquina trabajó hoy?</span>
                </div>
                <label class="cursor-pointer flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap" 
                    [class.text-base-content/40]="!modalService.formData().noWorkDay" 
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
                <div class="border-t border-base-200 p-4">
                  <label class="form-control w-full">
                    <div class="label pt-0">
                      <span class="label-text font-normal text-xs uppercase text-base-content/60">Motivo de Inactividad</span>
                    </div>
                    <select 
                      class="select select-bordered w-full bg-white focus:border-primary text-sm" 
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
              <!-- Campos Financieros -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-bold text-sm">Ingreso del Día</span>
                  </label>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold text-lg group-focus-within:text-primary transition-colors">$</span>
                    <input 
                      type="number" 
                      class="input input-bordered w-full pl-8 font-mono text-lg font-bold tabular-nums focus:input-primary h-12 bg-base-100"
                      [ngModel]="modalService.formData().income"
                      (ngModelChange)="updateNumberField('income', $event)"
                      name="income"
                      placeholder="0"
                      min="0"
                      required />
                  </div>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-normal text-sm">Gasto en Diésel</span>
                    <span class="label-text-alt text-base-content/50 italic text-xs">(Opcional)</span>
                  </label>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold text-lg group-focus-within:text-primary transition-colors">$</span>
                    <input 
                      type="number" 
                      class="input input-bordered w-full pl-8 font-mono text-lg font-bold tabular-nums focus:input-primary h-12 bg-base-100"
                      [ngModel]="modalService.formData().dieselExpense"
                      (ngModelChange)="updateNumberField('dieselExpense', $event)"
                      name="dieselExpense"
                      placeholder="0"
                      min="0" />
                  </div>
                </div>
                <div class="form-control sm:col-span-2">
                  <label class="label">
                    <span class="label-text font-normal text-sm">Litros Cargados</span>
                    <span class="label-text-alt text-base-content/50 italic text-xs">(Opcional)</span>
                  </label>
                  <label class="input input-bordered flex items-center gap-2 bg-base-100 focus-within:input-primary h-12">
                    <input 
                      type="number" 
                      class="grow font-mono font-bold text-base"
                      [ngModel]="modalService.formData().dieselLiters"
                      (ngModelChange)="updateNumberField('dieselLiters', $event)"
                      name="dieselLiters"
                      step="0.1"
                      placeholder="0.0"
                      min="0" />
                    <span class="badge badge-sm badge-ghost font-mono text-xs">LTS</span>
                  </label>
                </div>
              </div>
            }

            <!-- Campos de Contexto -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-xs font-bold text-base-content/60 uppercase">Fecha</span>
                </label>
                <input 
                  type="date" 
                  class="input input-bordered w-full text-sm focus:input-primary"
                  [ngModel]="modalService.formData().date"
                  (ngModelChange)="updateField('date', $event)"
                  name="date"
                  required />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text text-xs font-bold text-base-content/60 uppercase">Máquina</span>
                </label>
                <select 
                  class="select select-bordered w-full text-sm focus:select-primary"
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
              <div class="form-control sm:col-span-2">
                <label class="label">
                  <span class="label-text text-xs font-bold text-base-content/60 uppercase">Chofer Asignado</span>
                </label>
                <select 
                  class="select select-bordered w-full text-sm focus:select-primary"
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

            <!-- Selector de Incidente Crítico -->
            <div class="card bg-red-50 border border-red-100 shadow-sm">
              <div class="card-body p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-red-800 truncate">¿Ocurrió un incidente crítico?</p>
                      <p class="text-xs text-red-600/70 italic">Choque, falla mecánica, etc.</p>
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
            </div>

            <!-- Observaciones -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-normal text-sm">Observaciones</span>
              </label>
              <textarea 
                class="textarea textarea-bordered h-24 w-full focus:textarea-primary text-sm leading-relaxed" 
                [ngModel]="modalService.formData().observations"
                (ngModelChange)="updateField('observations', $event)"
                name="observations"
                placeholder="Escribe aquí cualquier novedad, incidente o comentario sobre la jornada..."></textarea>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-action mt-6 pt-6 border-t border-base-200 flex-shrink-0">
          <button 
            type="button" 
            class="btn btn-ghost gap-2 font-normal"
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

