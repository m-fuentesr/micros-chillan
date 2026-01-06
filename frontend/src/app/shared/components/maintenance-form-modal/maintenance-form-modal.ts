import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal
} from '@angular/core';
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
            <p class="text-xs text-base-content/60">
              Completa los datos para registrar un nuevo gasto de mantenimiento
            </p>
          </div>
        </div>

        <form (ngSubmit)="onSubmit($event)" #form="ngForm">
          <div class="space-y-5">

            <!-- Ítem/Repuesto -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Ítem/Repuesto <span class="text-error">*</span>
                </span>
                <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                  Obligatorio
                </span>
              </label>

              <select
                class="select select-bordered w-full"
                [ngModel]="getSelectValue()"
                (ngModelChange)="onItemChange($event)"
                [name]="showCustomItem() ? 'item_select' : 'item'"
                [required]="!showCustomItem()">
                <option value="">-- Seleccione un ítem --</option>
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
                  Costo ($) <span class="text-error">*</span>
                </span>
                <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                  Obligatorio
                </span>
              </label>

              <input
                type="text"
                inputmode="numeric"
                class="input input-bordered w-full font-mono placeholder-gray-400"
                [value]="formattedCosto()"
                (input)="onCostoFormattedInput($event)"
                name="costo"
                placeholder="Ej: $40.000"
                maxlength="10"
                required>

              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <ui-icon name="Info" size="xs" class="inline mr-1" />
                  El monto se formatea automáticamente en pesos chilenos
                </span>
              </label>
            </div>

            <!-- Nº Factura/Boleta -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Nº Factura/Boleta <span class="text-error">*</span>
                </span>
                <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                  Obligatorio
                </span>
              </label>

              <input
                type="text"
                class="input input-bordered w-full font-mono placeholder-gray-400"
                [ngModel]="modalService.formData().numero_factura"
                (input)="onFacturaInput($event)"
                name="numero_factura"
                placeholder="Ej: 001-00001234"
                maxlength="20"
                pattern="[0-9\\-]+"
                required>

              <label class="label">
                <span class="label-text-alt text-base-content/50 hidden sm:block">
                  <ui-icon name="Info" size="xs" class="inline mr-1" />
                  Solo números y guion (-). Máximo 20 caracteres
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
                <option value="">-- Seleccione una categoría (opcional) --</option>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
            </div>

            <!-- Fecha -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Fecha de Compra <span class="text-error">*</span>
                </span>
                <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                  Obligatorio
                </span>
              </label>

              <input
                type="date"
                class="input input-bordered w-full"
                [ngModel]="modalService.formData().fecha"
                (ngModelChange)="updateField('fecha', $event)"
                name="fecha"
                required>
            </div>
          </div>

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
              [disabled]="!form.valid || modalService.isSubmitting()">
              @if (modalService.isSubmitting()) {
                <span class="loading loading-spinner loading-sm"></span>
                <span>Guardando...</span>
              } @else {
                <ui-icon name="Check" size="sm" />
                <span>Guardar Registro</span>
              }
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
    dialog.modal {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
    }

    .modal-backdrop {
      background: transparent;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceFormModalComponent implements AfterViewInit {
  modalService = inject(MaintenanceFormModalService);

  @ViewChild('dialogRef', { static: false })
  dialogRef!: ElementRef<HTMLDialogElement>;

  showCustomItem = signal(false);

  private clpFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });

  ngAfterViewInit(): void {
    effect(() => {
      const dialog = this.dialogRef?.nativeElement;
      if (!dialog) return;

      if (this.modalService.isVisible()) {
        dialog.showModal();
      } else {
        dialog.close();
        this.showCustomItem.set(false);
      }
    });
  }

  formattedCosto(): string {
    const costo = this.modalService.formData().costo;
    return costo == null ? '' : this.clpFormatter.format(costo);
  }

  onCostoFormattedInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let numeric = input.value.replace(/[^0-9]/g, '');

    if (!numeric) {
      this.modalService.updateFormData({ costo: null });
      input.value = '';
      return;
    }

    let value = Number(numeric);
    if (value > 9_999_999) value = 9_999_999;

    this.modalService.updateFormData({ costo: value });
    input.value = this.clpFormatter.format(value);
  }

  getSelectValue(): string {
    const item = this.modalService.formData().item;
    const available = this.modalService.availableItems();
    return item && !available.includes(item) ? '__OTRO__' : item || '';
  }

  onItemChange(value: string): void {
    if (value === '__OTRO__') {
      this.showCustomItem.set(true);
      this.updateField('item', '');
    } else {
      this.showCustomItem.set(false);
      this.updateField('item', value);
    }
  }

  updateField(
    field: 'item' | 'costo' | 'numero_factura' | 'categoria' | 'fecha',
    value: any
  ): void {
    this.modalService.updateFormData({ [field]: value });
  }

  onFacturaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let clean = input.value.replace(/[^0-9\-]/g, '').slice(0, 20);
    input.value = clean;
    this.updateField('numero_factura', clean);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.modalService.save();
  }
}
