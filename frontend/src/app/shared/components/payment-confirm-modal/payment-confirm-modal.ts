import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentConfirmModalService, PaymentConfirmFormData } from '../../services/payment-confirm-modal.service';

@Component({
  selector: 'app-payment-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="payment-confirm-modal">
      <div class="modal-box max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col bg-base-100 text-base-content rounded-3xl border border-base-200 shadow-2xl px-4 py-5 sm:px-6 sm:py-6 gap-4 sm:gap-5">
        <!-- Header Compacto -->
        <div class="flex items-start justify-between gap-4 flex-shrink-0 pb-3 border-b border-base-200">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0 border border-primary/20 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg sm:text-xl font-bold leading-tight text-base-content">Confirmar Pago</h3>
              <p class="text-xs text-base-content/60 mt-0.5">Completa los datos del pago</p>
            </div>
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

        @if (modalService.chofer()) {
          <!-- Body con scroll -->
          <div class="overflow-y-auto overscroll-contain flex-1 min-h-0 pr-1 custom-scrollbar">
            <!-- Bento Grid: Resumen del Pago -->
            <div class="rounded-3xl border border-base-200 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30 shadow-sm p-4 sm:p-5 mb-4 sm:mb-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-primary/10 text-primary rounded-xl w-10 h-10 flex items-center justify-center border border-primary/20 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM3.994 6.916l.855-.855a1 1 0 011.414 0l.855.855a1 1 0 01-1.414 1.414l-.855-.855a1 1 0 010-1.414l.855-.855a1 1 0 011.414 0zm12.012 0a1 1 0 011.414 0l.855.855a1 1 0 010 1.414l-.855.855a1 1 0 11-1.414-1.414l.855-.855a1 1 0 010-1.414l.855-.855a1 1 0 011.414 0zM5.525 13.657a1 1 0 011.414 0l.855.855a1 1 0 001.414 0l.855-.855a1 1 0 111.414 1.414l-.855.855a1 1 0 010 1.414l-.855.855a1 1 0 01-1.414 0l-.855-.855a1 1 0 00-1.414 0l-.855.855a1 1 0 01-1.414-1.414l.855-.855a1 1 0 000-1.414l-.855-.855a1 1 0 010-1.414zm9.95 0a1 1 0 011.414 0l.855.855a1 1 0 001.414 0l.855-.855a1 1 0 111.414 1.414l-.855.855a1 1 0 000 1.414l.855.855a1 1 0 01-1.414 0l-.855-.855a1 1 0 00-1.414 0l-.855.855a1 1 0 01-1.414-1.414l.855-.855a1 1 0 000-1.414l-.855-.855a1 1 0 010-1.414z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-base sm:text-lg text-base-content truncate">{{ modalService.chofer()!.chofer_nombre }}</div>
                  <div class="text-xs text-base-content/50">Semana {{ modalService.semana() }} - {{ getMonthName(modalService.mes()!) }} {{ modalService.anio() }}</div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-base-50 rounded-lg border border-base-200">
                  <div class="text-[10px] uppercase tracking-wider text-base-content/50 mb-1">Base Ganado</div>
                  <div class="font-bold text-sm text-base-content font-mono tabular-nums">
                    {{ modalService.chofer()!.total_ganado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                  </div>
                </div>
                @if (modalService.chofer()!.monto_a_completar > 0) {
                  <div class="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div class="text-[10px] uppercase tracking-wider text-base-content/50 mb-1">Ajuste</div>
                    <div class="font-bold text-sm text-primary font-mono tabular-nums">
                      {{ modalService.chofer()!.monto_a_completar | currency:'CLP':'symbol-narrow':'1.0-0' }}
                    </div>
                  </div>
                }
                <div class="col-span-2 p-3 bg-primary/10 rounded-xl border border-primary/20 mt-1">
                  <div class="flex justify-between items-center">
                    <div class="text-xs font-semibold uppercase tracking-wider text-base-content/70">Total a Pagar</div>
                    <div class="font-black text-xl sm:text-2xl text-primary font-mono tabular-nums">
                      {{ modalService.chofer()!.pago_final | currency:'CLP':'symbol-narrow':'1.0-0' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bento Grid: Formulario -->
            <form id="payment-form" (ngSubmit)="onSubmit($event)" #form="ngForm" class="grid grid-cols-1 gap-4">
              <!-- Método de Pago y Fecha -->
              <div class="rounded-3xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
                <div class="form-control">
                  <label class="label pb-2 pt-0">
                    <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                      Método de Pago <span class="text-error">*</span>
                    </span>
                  </label>
                  <select
                    class="select select-bordered w-full h-11 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                    [ngModel]="modalService.formData().metodo_pago"
                    (ngModelChange)="onMetodoPagoChange($event)"
                    name="metodo_pago"
                    required>
                    <option value="">Seleccionar</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label pb-2 pt-0">
                    <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                      Fecha de Pago <span class="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    class="input input-bordered w-full h-11 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                    [ngModel]="modalService.formData().fecha_pago"
                    (ngModelChange)="updateField('fecha_pago', $event)"
                    name="fecha_pago"
                    required>
                </div>
              </div>

              <!-- Código de Transferencia (solo si es transferencia) -->
              @if (modalService.formData().metodo_pago === 'transferencia') {
                <div class="rounded-3xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5">
                  <div class="form-control">
                    <label class="label pb-2 pt-0">
                      <span class="label-text text-xs uppercase tracking-wide text-base-content/60">
                        Código de Transferencia <span class="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      class="input input-bordered w-full h-11 rounded-lg text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/30"
                      [ngModel]="modalService.formData().codigo_transferencia"
                      (ngModelChange)="updateField('codigo_transferencia', $event)"
                      name="codigo_transferencia"
                      placeholder="Ej: TRF-123456"
                      required>
                    <label class="label pt-1 pb-0">
                      <span class="label-text-alt text-[11px] text-base-content/50">
                        Número de referencia de la transferencia
                      </span>
                    </label>
                  </div>
                </div>
              }

              <!-- Observaciones -->
              <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm p-4 sm:p-5">
                <div class="form-control">
                  <label class="label pb-2 pt-0">
                    <span class="label-text text-xs uppercase tracking-wide text-base-content/60">Observaciones</span>
                  </label>
                  <textarea
                    class="textarea textarea-bordered w-full h-20 rounded-lg text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/30"
                    [ngModel]="modalService.formData().observaciones"
                    (ngModelChange)="updateField('observaciones', $event)"
                    name="observaciones"
                    placeholder="Notas adicionales (opcional)"></textarea>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Cancelar
            </button>
            <button 
              type="submit" 
              form="payment-form"
              class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
              [disabled]="!isFormValid() || modalService.isSubmitting()">
              @if (modalService.isSubmitting()) {
                <span class="loading loading-spinner loading-sm"></span>
                <span>Procesando...</span>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span>Confirmar Pago</span>
              }
            </button>
          </div>
        }
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
export class PaymentConfirmModalComponent implements AfterViewInit {
  modalService = inject(PaymentConfirmModalService);
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

  updateField(field: keyof PaymentConfirmFormData, value: any): void {
    this.modalService.updateFormData({ [field]: value });
  }

  onMetodoPagoChange(value: string): void {
    this.updateField('metodo_pago', value);
    // Limpiar código de transferencia si cambia a efectivo
    if (value === 'efectivo') {
      this.updateField('codigo_transferencia', '');
    }
  }

  isFormValid(): boolean {
    const data = this.modalService.formData();
    if (!data.metodo_pago || !data.fecha_pago) {
      return false;
    }
    if (data.metodo_pago === 'transferencia' && (!data.codigo_transferencia || !data.codigo_transferencia.trim())) {
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

  getMonthName(mes: number): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1] || '';
  }
}

