import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { ClosedLiquidation } from '../../models/accounting.models';

@Component({
  selector: 'app-liquidation-history',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="text-2xl font-bold mb-4">Historial de Liquidaciones Cerradas</h2>
        
        <div class="overflow-x-auto mb-6">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Período</th>
                <th>Fecha de Cierre</th>
                <th>Total Pagado</th>
                <th>Cerrado por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (liquidation of liquidations(); track liquidation.id) {
                <tr>
                  <td class="font-semibold">{{ liquidation.periodo }}</td>
                  <td class="font-mono text-sm">{{ formatDate(liquidation.fecha_cierre) }}</td>
                  <td class="font-bold">{{ formatCurrency(liquidation.total_pagado) }}</td>
                  <td>{{ liquidation.cerrado_por }}</td>
                  <td>
                    <button
                      class="btn btn-secondary btn-sm"
                      (click)="toggleDetail(liquidation.id)">
                      Ver Detalle
                    </button>
                  </td>
                </tr>
                @if (expandedId() === liquidation.id) {
                  <tr class="bg-base-200">
                    <td colspan="5" class="p-6">
                      <div class="space-y-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <h4 class="text-lg font-bold">Detalle de {{ liquidation.periodo }}</h4>
                            <p class="text-sm text-base-content/70">
                              Cerrado el {{ formatDate(liquidation.fecha_cierre) }} por {{ liquidation.cerrado_por }}
                            </p>
                          </div>
                          <button class="btn btn-secondary btn-sm" (click)="toggleDetail(liquidation.id)">
                            ✕ Cerrar
                          </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-base-300 rounded-lg">
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Total Pagado</div>
                            <div class="text-xl font-bold">{{ formatCurrency(liquidation.total_pagado) }}</div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Choferes Liquidados</div>
                            <div class="text-xl font-bold">{{ liquidation.choferes.length }}</div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Promedio por Chofer</div>
                            <div class="text-xl font-bold">
                              {{ formatCurrency(liquidation.total_pagado / liquidation.choferes.length) }}
                            </div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Estado</div>
                            <div class="text-xl font-bold">Cerrado</div>
                          </div>
                        </div>

                        <div class="overflow-x-auto">
                          <table class="table table-zebra">
                            <thead>
                              <tr>
                                <th>Chofer</th>
                                <th>Total Ganado</th>
                                <th>Mínimo Garantizado</th>
                                <th>Pago Final</th>
                                <th>Método de Pago</th>
                                <th>Código/Ref.</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (chofer of liquidation.choferes; track chofer.chofer_id) {
                                <tr>
                                  <td class="font-semibold truncate tooltip" [attr.data-tip]="chofer.chofer_nombre">{{ chofer.chofer_nombre }}</td>
                                  <td class="font-mono">{{ formatCurrency(chofer.total_ganado) }}</td>
                                  <td class="font-mono">{{ formatCurrency(chofer.minimo_garantizado) }}</td>
                                  <td class="font-mono font-bold">{{ formatCurrency(chofer.pago_final) }}</td>
                                  <td>{{ chofer.metodo_pago || '—' }}</td>
                                  <td class="font-mono text-sm break-all">{{ chofer.codigo_transferencia || '—' }}</td>
                                  <td>
                                    <span class="badge badge-success">Pagado</span>
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiquidationHistory {
  liquidations = input.required<ClosedLiquidation[]>();

  expandedId = signal<number | null>(null);

  toggleDetail(id: number): void {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
    } else {
      this.expandedId.set(id);
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

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
    }
  }
}

