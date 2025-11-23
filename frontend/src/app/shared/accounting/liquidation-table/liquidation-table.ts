import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { LiquidationPeriod, LiquidationDriver } from '../../models/accounting.models';

@Component({
  selector: 'app-liquidation-table',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="text-2xl font-bold mb-4">Procesar Liquidación</h2>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Chofer</th>
                <th>Total Ganado (RF-022)</th>
                <th>Mínimo Garantizado (RF-023)</th>
                <th>Monto a Completar (RF-024)</th>
                <th>Pago Final (RF-025)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (chofer of liquidation().choferes; track chofer.chofer_id) {
                <tr>
                  <td class="font-semibold truncate tooltip" [attr.data-tip]="chofer.chofer_nombre">{{ chofer.chofer_nombre }}</td>
                  <td>
                    <div class="font-bold">{{ formatCurrency(chofer.total_ganado) }}</div>
                    <div class="text-xs text-base-content/70">Suma de reportes diarios del mes</div>
                  </td>
                  <td class="font-semibold">{{ formatCurrency(chofer.minimo_garantizado) }}</td>
                  <td>
                    <input
                      type="number"
                      class="input input-bordered input-sm w-32"
                      [value]="chofer.monto_a_completar"
                      [disabled]="chofer.total_ganado >= chofer.minimo_garantizado || liquidation().estado === 'cerrado'"
                      (input)="onMissingAmountChange(chofer.chofer_id, $event)"
                      min="0">
                  </td>
                  <td>
                    <div class="font-bold">{{ formatCurrency(chofer.pago_final) }}</div>
                    <div class="text-xs text-base-content/70">
                      @if (chofer.total_ganado >= chofer.minimo_garantizado) {
                        Supera mínimo en {{ formatCurrency(chofer.total_ganado - chofer.minimo_garantizado) }}
                      } @else {
                        Total ganado + monto a completar hasta mínimo garantizado
                      }
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      @if (chofer.estado_pago === 'pagado') {
                        <button class="btn btn-success btn-sm" disabled>
                          Confirmado
                        </button>
                      } @else {
                        <button
                          class="btn btn-primary btn-sm"
                          [disabled]="liquidation().estado === 'cerrado'"
                          (click)="onConfirmPayment(chofer)">
                          Confirmar Pago
                        </button>
                      }
                      <button class="btn btn-secondary btn-sm">
                        Descargar PDF
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      @if (liquidation().estado === 'abierto') {
        <div class="card-footer flex justify-end gap-4">
          <button class="btn btn-secondary" (click)="onSaveDraft()">
            Guardar Borrador
          </button>
          <button class="btn btn-primary" (click)="onClosePeriod()">
            Cerrar y Finalizar Mes
          </button>
        </div>
      } @else {
        <div class="card-footer">
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
            </svg>
            <span>Este período fue cerrado y no puede ser modificado.</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiquidationTable {
  liquidation = input.required<LiquidationPeriod>();
  
  confirmPayment = output<{ choferId: number; data: { metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string } }>();
  missingAmountChange = output<{ choferId: number; monto: number }>();
  saveDraft = output<void>();
  closePeriod = output<void>();

  onMissingAmountChange(choferId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const monto = Math.max(0, Number(input.value) || 0);
    this.missingAmountChange.emit({ choferId, monto });
  }

  onConfirmPayment(chofer: LiquidationDriver): void {
    // Esto debería abrir un modal, pero por ahora emitimos el evento
    // En la página principal se manejará el modal
    this.confirmPayment.emit({
      choferId: chofer.chofer_id,
      data: {
        metodo_pago: 'transferencia',
        codigo_transferencia: ''
      }
    });
  }

  onSaveDraft(): void {
    this.saveDraft.emit();
  }

  onClosePeriod(): void {
    if (confirm('¿Está seguro de que desea cerrar y finalizar este período de liquidación? Esta acción es irreversible.')) {
      this.closePeriod.emit();
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

