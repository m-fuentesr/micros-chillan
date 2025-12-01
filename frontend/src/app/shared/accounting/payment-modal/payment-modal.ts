import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidationDriver } from '../../models/accounting.models';

@Component({
  selector: 'app-payment-modal',
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal modal-open">
        <div class="modal-box max-w-lg">
          <h3 class="font-bold text-lg mb-4">Confirmar Pago</h3>
          
          <p class="text-sm text-base-content/70 mb-4">
            Confirma el pago para <strong class="truncate tooltip" [attr.data-tip]="driver()?.chofer_nombre">{{ driver()?.chofer_nombre }}</strong> por un monto de 
            <strong>{{ formatCurrency(driver()?.pago_final || 0) }}</strong>
          </p>
          
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-bold">Método de Pago <span class="text-error">*</span></span>
            </label>
            <select
              class="select select-bordered w-full"
              [value]="paymentMethod()"
              (change)="onPaymentMethodChange($event)">
              <option value="">Seleccione un método</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>

          @if (paymentMethod() === 'transferencia') {
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-bold">Código de Transferencia <span class="text-error">*</span></span>
              </label>
              <input
                type="text"
                class="input input-bordered w-full break-all"
                placeholder="Ej: TRF-2025-001234"
                [value]="transferCode()"
                (input)="onTransferCodeChange($event)">
              <label class="label">
                <span class="label-text-alt">Ingrese el código o número de referencia de la transferencia</span>
              </label>
            </div>
          }

          <div class="modal-action">
            <button class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
            <button
              class="btn btn-primary"
              [disabled]="!canConfirm()"
              (click)="onConfirm()">
              Confirmar Pago
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" (click)="onCancel()"></form>
      </div>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentModal {
  isOpen = input(false);
  driver = input<LiquidationDriver | null>(null);
  
  confirm = output<{ metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string }>();
  cancel = output<void>();

  paymentMethod = signal<'transferencia' | 'efectivo' | ''>('');
  transferCode = signal('');

  canConfirm = computed(() => {
    const method = this.paymentMethod();
    if (!method) return false;
    if (method === 'transferencia') {
      return this.transferCode().trim().length > 0;
    }
    return true;
  });

  onPaymentMethodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.paymentMethod.set(select.value as 'transferencia' | 'efectivo' | '');
    if (select.value !== 'transferencia') {
      this.transferCode.set('');
    }
  }

  onTransferCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.transferCode.set(input.value);
  }

  onConfirm(): void {
    if (this.canConfirm() && this.driver()) {
      this.confirm.emit({
        metodo_pago: this.paymentMethod() as 'transferencia' | 'efectivo',
        codigo_transferencia: this.paymentMethod() === 'transferencia' ? this.transferCode().trim() : undefined
      });
      this.reset();
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.reset();
  }

  private reset(): void {
    this.paymentMethod.set('');
    this.transferCode.set('');
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

