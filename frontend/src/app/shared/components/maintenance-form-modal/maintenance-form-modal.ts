import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceFormModalService } from '../../services/maintenance-form-modal.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-maintenance-form-modal',
  imports: [CommonModule, FormsModule, UiIconComponent],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="maintenance-form-modal">
      <div class="modal-box max-w-2xl">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-base-200">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <ui-icon name="CirclePlus" size="md" />
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
                [ngModel]="getSelectValue()"
                (ngModelChange)="onItemChange($event)"
                [name]="showCustomItem() ? 'item_select' : 'item'"
                [required]="!showCustomItem()">
                <option value="">Seleccione un ítem</option>
                @for (item of modalService.availableItems(); track item) {
                  <option [value]="item">{{ item }}</option>
                }
                <option value="__OTRO__">Otro (especificar)</option>
              </select>
              
              @if (showCustomItem()) {
                <div class="mt-3">
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    [ngModel]="modalService.formData().item"
                    (ngModelChange)="updateField('item', $event)"
                    name="item"
                    placeholder="Ej: Batería, Radiador, Amortiguadores, etc."
                    required>
                  <label class="label">
                    <span class="label-text-alt text-base-content/50">
                      <ui-icon name="Info" size="xs" class="inline mr-1" />
                      Especifique el nombre del ítem o repuesto
                    </span>
                  </label>
                </div>
              } @else {
                <label class="label">
                  <span class="label-text-alt text-base-content/50 hidden sm:block">
                    <ui-icon name="Info" size="xs" class="inline mr-1" />
                    Seleccione un ítem de la lista o elija "Otro" para especificar
                  </span>
                </label>
              }
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
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered w-full pl-8 font-mono"
                  [ngModel]="modalService.formData().costo === null ? '' : modalService.formData().costo?.toString()"
                  (ngModelChange)="updateCosto($event)"
                  (input)="onCostoInput($event)"
                  name="costo"
                  placeholder="0"
                  maxlength="7"
                  required>
              </div>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <ui-icon name="Info" size="xs" class="inline mr-1" />
                  Ingrese el costo en pesos chilenos (solo números)
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
                (input)="onFacturaInput($event)"
                name="numero_factura"
                placeholder="Ej: 001-00001234"
                maxlength="20"
                pattern="[0-9\-]+"
                required>
              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <ui-icon name="Info" size="xs" class="inline mr-1" />
                  Solo números y guion (-). Máximo 20 caracteres. Ej: 001-00001234
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
                  <ui-icon name="Info" size="xs" class="inline mr-1" />
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
                  <ui-icon name="Info" size="xs" class="inline mr-1" />
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
              <ui-icon name="X" size="sm" />
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
              [disabled]="!form.valid">
              <ui-icon name="Check" size="sm" />
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
  
  showCustomItem = signal(false);

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
          // Resetear el estado del input personalizado cuando se cierra el modal
          this.showCustomItem.set(false);
        }
      }
    });
  }

  getSelectValue(): string {
    const currentItem = this.modalService.formData().item;
    // Si el item actual no está en la lista de disponibles y no es vacío, significa que es personalizado
    const availableItems = this.modalService.availableItems();
    if (currentItem && !availableItems.includes(currentItem)) {
      return '__OTRO__';
    }
    return currentItem || '';
  }

  onItemChange(value: string): void {
    if (value === '__OTRO__') {
      this.showCustomItem.set(true);
      // Limpiar el item para que el usuario pueda escribir uno nuevo
      this.updateField('item', '');
    } else {
      this.showCustomItem.set(false);
      this.updateField('item', value);
    }
  }

  updateField(field: 'item' | 'costo' | 'numero_factura' | 'categoria' | 'fecha', value: any): void {
    this.modalService.updateFormData({ [field]: value });
  }

  onCostoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remover cualquier carácter que no sea un dígito (0-9)
    let numericValue = input.value.replace(/[^0-9]/g, '');
    
    // Limitar a máximo 9,999,999 (7 dígitos)
    const maxValue = 9999999;
    if (numericValue && Number(numericValue) > maxValue) {
      numericValue = maxValue.toString();
    }
    
    // Actualizar el valor del input
    input.value = numericValue;
    // Actualizar el modelo
    this.updateCosto(numericValue);
  }

  updateCosto(value: string | number | null): void {
    // Si es string, remover caracteres no numéricos
    if (typeof value === 'string') {
      value = value.replace(/[^0-9]/g, '');
    }
    
    // Limitar a máximo 9,999,999
    const maxValue = 9999999;
    let numValue = value === '' || value === null || value === undefined ? null : Number(value);
    
    if (numValue !== null && numValue > maxValue) {
      numValue = maxValue;
    }
    
    this.modalService.updateFormData({ costo: numValue });
  }

  onFacturaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Solo permitir dígitos (0-9) y guion medio (-)
    // Remover letras, espacios y otros caracteres especiales
    let cleanValue = input.value.replace(/[^0-9\-]/g, '');
    
    // Limitar a máximo 20 caracteres
    if (cleanValue.length > 20) {
      cleanValue = cleanValue.substring(0, 20);
    }
    
    // Actualizar el valor del input
    input.value = cleanValue;
    // Actualizar el modelo
    this.updateField('numero_factura', cleanValue);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.modalService.save();
  }
}

