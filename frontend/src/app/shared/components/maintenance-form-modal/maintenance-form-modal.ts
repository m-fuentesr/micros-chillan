import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceFormModalService } from '../../services/maintenance-form-modal.service';

@Component({
  selector: 'app-maintenance-form-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="maintenance-form-modal">
      <div class="modal-box max-w-2xl">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-base-200">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-xl text-base-content">Registrar Compra de Repuesto</h3>
            <p class="text-xs text-base-content/60">Completa los datos para registrar un nuevo gasto de mantenimiento</p>
          </div>
        </div>
        
        <form (ngSubmit)="onSubmit($event)" #form="ngForm">
          <div class="space-y-5">
            <!-- Ítem/Repuesto -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Ítem/Repuesto 
                  <span class="text-error">*</span>
                </span>
              </label>
              <select
                class="select select-bordered w-full"
                [ngModel]="modalService.formData().item"
                (ngModelChange)="updateField('item', $event)"
                name="item"
                required>
                <option value="">Seleccione un ítem</option>
                @for (item of modalService.availableItems(); track item) {
                  <option [value]="item">{{ item }}</option>
                }
              </select>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Ingrese el nombre del repuesto o ítem comprado
                </span>
              </label>
            </div>

            <!-- Costo -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Costo ($) 
                  <span class="text-error">*</span>
                </span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 font-mono">$</span>
                <input
                  type="number"
                  class="input input-bordered w-full pl-8 font-mono"
                  [ngModel]="modalService.formData().costo"
                  (ngModelChange)="updateCosto($event)"
                  name="costo"
                  min="0"
                  step="1"
                  placeholder="0"
                  required>
              </div>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Ingrese el costo en pesos chilenos
                </span>
              </label>
            </div>

            <!-- Nº Factura/Boleta -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Nº Factura/Boleta 
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                class="input input-bordered w-full font-mono"
                [ngModel]="modalService.formData().numero_factura"
                (ngModelChange)="updateField('numero_factura', $event)"
                name="numero_factura"
                placeholder="Ej: 001-00001234"
                required>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Número de factura o boleta para trazabilidad contable/SII
                </span>
              </label>
            </div>

            <!-- Categoría -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Categoría</span>
              </label>
              <select
                class="select select-bordered w-full"
                [ngModel]="modalService.formData().categoria"
                (ngModelChange)="updateField('categoria', $event)"
                name="categoria">
                <option value="">Seleccione una categoría (opcional)</option>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Tipo de mantenimiento (opcional pero recomendado)
                </span>
              </label>
            </div>

            <!-- Fecha de Compra -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Fecha de Compra 
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                class="input input-bordered w-full"
                [ngModel]="modalService.formData().fecha"
                (ngModelChange)="updateField('fecha', $event)"
                name="fecha"
                required>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Fecha en que se realizó la compra
                </span>
              </label>
            </div>
          </div>

          <!-- Acciones del Modal -->
          <div class="modal-action mt-6 pt-6 border-t border-base-200">
            <button 
              type="button" 
              class="btn btn-ghost gap-2"
              (click)="modalService.cancel()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
              [disabled]="!form.valid">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
              Guardar Registro
            </button>
          </div>
        </form>
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

    /* Backdrop invisible */
    .modal-backdrop {
      background: transparent;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceFormModalComponent implements AfterViewInit {
  modalService = inject(MaintenanceFormModalService);
  
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

  updateField(field: 'item' | 'costo' | 'numero_factura' | 'categoria' | 'fecha', value: any): void {
    this.modalService.updateFormData({ [field]: value });
  }

  updateCosto(value: string | number | null): void {
    const numValue = value === '' || value === null ? null : Number(value);
    this.modalService.updateFormData({ costo: numValue });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.modalService.save();
  }
}

