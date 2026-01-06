import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LedgerMovementModalService } from '../../services/ledger-movement-modal.service';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-ledger-movement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UiIconComponent],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="ledger-movement-modal">
      @if (modalService.chofer()) {
        <div class="modal-box max-w-lg w-full max-h-[88vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-base-100 text-base-content rounded-3xl border border-base-200 shadow-2xl px-4 py-5 sm:px-6 sm:py-6 gap-4 sm:gap-5">
          <!-- Header Compacto -->
          <div class="flex items-start justify-between gap-4 flex-shrink-0 pb-3 border-b border-base-200">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0 border border-primary/20 shadow-sm">
                <ui-icon name="DollarSign" size="sm" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-lg sm:text-xl font-bold leading-tight text-base-content">Registrar Movimiento</h3>
                <p class="text-xs text-base-content/60 mt-0.5">Préstamo o pago de chofer</p>
              </div>
            </div>
            <button 
              type="button"
              class="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:bg-base-200 hover:text-base-content flex-shrink-0"
              (click)="modalService.cancel()">
              <ui-icon name="X" size="xs" />
            </button>
          </div>

          <!-- Body con scroll -->
          <div class="overflow-y-auto overscroll-contain flex-1 min-h-0 pr-1 custom-scrollbar">
            <!-- Bento Grid: Resumen del Chofer -->
            <div class="rounded-3xl border border-base-200 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30 shadow-sm p-4 sm:p-5 mb-4 sm:mb-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-primary/10 text-primary rounded-xl w-10 h-10 flex items-center justify-center border border-primary/20 shadow-sm">
                  <ui-icon name="Users" size="sm" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-base sm:text-lg text-base-content truncate">{{ modalService.chofer()!.nombre_completo }}</div>
                  <div class="text-xs text-base-content/50">Cuenta Corriente</div>
                </div>
              </div>
              
              <div class="grid grid-cols-1 gap-3">
                <div class="p-3 rounded-lg border" 
                     [class.bg-error/10]="modalService.chofer()!.saldo_actual < 0"
                     [class.border-error/20]="modalService.chofer()!.saldo_actual < 0"
                     [class.bg-success/10]="modalService.chofer()!.saldo_actual > 0"
                     [class.border-success/20]="modalService.chofer()!.saldo_actual > 0"
                     [class.bg-base-50]="modalService.chofer()!.saldo_actual === 0"
                     [class.border-base-200]="modalService.chofer()!.saldo_actual === 0">
                  <div class="text-[10px] uppercase tracking-wider text-base-content/50 mb-1">Saldo Actual</div>
                  <div class="font-bold text-lg font-mono tabular-nums"
                       [class.text-error]="modalService.chofer()!.saldo_actual < 0"
                       [class.text-success]="modalService.chofer()!.saldo_actual > 0"
                       [class.text-base-content]="modalService.chofer()!.saldo_actual === 0">
                    {{ formatCurrency(modalService.chofer()!.saldo_actual) }}
                  </div>
                  <div class="text-[10px] mt-1"
                       [class.text-error]="modalService.chofer()!.saldo_actual < 0"
                       [class.text-success]="modalService.chofer()!.saldo_actual > 0"
                       [class.text-base-content/50]="modalService.chofer()!.saldo_actual === 0">
                    @if (modalService.chofer()!.saldo_actual < 0) {
                      🔴 Deudor
                    } @else if (modalService.chofer()!.saldo_actual > 0) {
                      🟢 A Favor
                    } @else {
                      ⚪ Al Día
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Bento Grid: Formulario -->
            <form id="movement-form" (ngSubmit)="onSubmit($event)" #form="ngForm" class="grid grid-cols-1 gap-4">


              <!-- Tipo de Movimiento (Radio/Toggle) -->
              <div class="rounded-3xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5">
                <label class="label items-center justify-between pb-2.5 pt-0 mb-0">
                  <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                    Tipo de Movimiento <span class="text-error">*</span>
                  </span>
                  <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                    Obligatorio
                  </span>
                </label>
                <div class="flex gap-3">
                  <label class="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo"
                      value="CARGO"
                      class="radio radio-primary hidden"
                      [checked]="modalService.formData().tipo === 'CARGO'"
                      (change)="updateField('tipo', 'CARGO')"
                      required>
                    <div class="card bg-base-200/50 border-2 rounded-xl p-4 text-center transition-all"
                         [class.border-primary]="modalService.formData().tipo === 'CARGO'"
                         [class.bg-primary/10]="modalService.formData().tipo === 'CARGO'"
                         [class.border-base-200]="modalService.formData().tipo !== 'CARGO'">
                      <div class="text-error mb-2">
                        <ui-icon name="TrendingDown" size="lg" />
                      </div>
                      <div class="font-bold text-sm text-base-content">Entregar Dinero</div>
                      <div class="text-xs text-base-content/60 mt-1">(Cargo)</div>
                    </div>
                  </label>
                  <label class="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo"
                      value="ABONO"
                      class="radio radio-primary hidden"
                      [checked]="modalService.formData().tipo === 'ABONO'"
                      (change)="updateField('tipo', 'ABONO')"
                      required>
                    <div class="card bg-base-200/50 border-2 rounded-xl p-4 text-center transition-all"
                         [class.border-primary]="modalService.formData().tipo === 'ABONO'"
                         [class.bg-primary/10]="modalService.formData().tipo === 'ABONO'"
                         [class.border-base-200]="modalService.formData().tipo !== 'ABONO'">
                      <div class="text-success mb-2">
                        <ui-icon name="TrendingUp" size="lg" />
                      </div>
                      <div class="font-bold text-sm text-base-content">Recibir Dinero</div>
                      <div class="text-xs text-base-content/60 mt-1">(Abono)</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Monto y Fecha -->
              <div class="rounded-3xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
                <div class="form-control">
                  <label class="label items-center justify-between pb-2.5 pt-0 mb-0">
                    <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                      Monto <span class="text-error">*</span>
                    </span>
                  <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                    Obligatorio
                  </span>                    
                  </label>
                  <input
                    type="number"
                    class="input input-bordered w-full h-11 rounded-lg text-sm font-mono tabular-nums focus:border-primary focus:ring-2 focus:ring-primary/30"
                    [ngModel]="modalService.formData().monto"
                    (ngModelChange)="onMontoChange($event)"
                    name="monto"
                    placeholder="0"
                    min="1"
                    step="1"
                    required>
                </div>
                <div class="form-control">
                  <label class="label items-center justify-between pb-2.5 pt-0 mb-0">
                    <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                      Fecha <span class="text-error">*</span>
                    </span>
                  <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                    Obligatorio
                  </span>                    
                  </label>
                  <input
                    type="date"
                    class="input input-bordered w-full h-11 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                    [ngModel]="modalService.formData().fecha_movimiento"
                    (ngModelChange)="updateField('fecha_movimiento', $event)"
                    name="fecha_movimiento"
                    required>
                </div>
              </div>

              <!-- Descripción -->
              <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5">
                <div class="form-control">
                  <label class="label items-center justify-between pb-2.5 pt-0 mb-0">
                    <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/70">
                      Descripción <span class="text-error">*</span>
                    </span>
                  <span class="label-text-alt text-[10px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-md">
                    Obligatorio
                  </span>                    
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full h-11 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                    [ngModel]="modalService.formData().descripcion"
                    (ngModelChange)="updateField('descripcion', $event)"
                    name="descripcion"
                    placeholder="Ej: Préstamo repuestos"
                    required>
                  <label class="label pt-1 pb-0">
                    <span class="label-text-alt text-[11px] text-base-content/50">
                      Breve descripción del movimiento
                    </span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <!-- Footer Sticky -->
          <div class="modal-action sticky bottom-0 left-0 right-0 bg-base-100 mt-3 pt-3 pb-2 border-t border-base-200 flex-shrink-0 justify-end gap-2 sm:gap-3 px-0">
            <button 
              type="button" 
              class="btn btn-ghost gap-2 font-normal text-base-content hover:bg-base-200 hover:text-base-content"
              [disabled]="modalService.isSubmitting()"
              (click)="modalService.cancel()">
              <ui-icon name="X" size="xs" />
              Cancelar
            </button>
            <button 
              type="submit" 
              form="movement-form"
              class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
              [disabled]="!isFormValid() || modalService.isSubmitting()">
              @if (modalService.isSubmitting()) {
                <span class="loading loading-spinner loading-sm"></span>
                <span>Guardando...</span>
              } @else {
                <ui-icon name="Check" size="xs" />
                <span>Registrar Movimiento</span>
              }
            </button>
          </div>
        </div>
      }
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
export class LedgerMovementModalComponent implements AfterViewInit {
  modalService = inject(LedgerMovementModalService);
  @ViewChild('dialogRef', { static: false }) dialogRef!: ElementRef<HTMLDialogElement>;

  constructor() {
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

  ngAfterViewInit(): void {
    // Verificación manual inicial por si el effect corrió antes de que la vista estuviera lista
    if (this.modalService.isVisible() && this.dialogRef?.nativeElement) {
      this.dialogRef.nativeElement.showModal();
    }
  }

  updateField(field: keyof import('../../services/ledger-movement-modal.service').LedgerMovementFormData, value: any): void {
    this.modalService.updateFormData({ [field]: value });
  }

  onMontoChange(value: string | number): void {
    const numValue = value ? Number(value) : null;
    this.updateField('monto', numValue);
  }

  isFormValid(): boolean {
    const data = this.modalService.formData();
    return !!(data.tipo && data.monto !== null && data.monto > 0 && data.descripcion.trim() && data.fecha_movimiento);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isFormValid()) {
      this.modalService.save();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }
}
