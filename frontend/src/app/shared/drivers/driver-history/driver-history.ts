import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DriverDailyRecord, DriverLiquidation } from '../../models/driver.models';

@Component({
  selector: 'app-driver-history',
  imports: [RouterLink],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header">
        <h2 class="card-title text-2xl">Historial</h2>
      </div>
      <div class="card-body">
        <!-- Tabs -->
        <div class="tabs tabs-bordered mb-4">
          <button
            class="tab"
            [class.tab-active]="activeTab() === 'records'"
            (click)="setActiveTab('records')">
            Reportes del Chofer
          </button>
          <button
            class="tab"
            [class.tab-active]="activeTab() === 'liquidations'"
            (click)="setActiveTab('liquidations')">
            Liquidaciones
          </button>
        </div>

        <!-- Tab Content: Reportes -->
        @if (activeTab() === 'records') {
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Recaudado</th>
                  <th>Diésel</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (record of dailyRecords(); track record.id) {
                  <tr>
                    <td class="font-mono text-sm">{{ formatDate(record.fecha) }}</td>
                    <td>
                      @switch (record.estado) {
                        @case ('completo') {
                          <span class="badge badge-success">Completado</span>
                        }
                        @case ('pendiente_trabajador') {
                          <span class="badge badge-warning">Pendiente</span>
                        }
                        @case ('incidente_reportado') {
                          <span class="badge badge-error">Incidente</span>
                        }
                        @case ('no_trabajado') {
                          <span class="badge badge-ghost">No Trabajado</span>
                        }
                      }
                    </td>
                    <td class="font-semibold">{{ formatCurrency(record.recaudado) }}</td>
                    <td class="font-semibold">{{ formatCurrency(record.diesel) }}</td>
                    <td>
                      @if (record.observaciones) {
                        <div class="tooltip" [attr.data-tip]="record.observaciones">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="text-info">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="m8.93 6.588-2.29.287-.082 38.35.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                          </svg>
                        </div>
                      } @else {
                        <span class="text-base-content/30">—</span>
                      }
                    </td>
                    <td>
                      <a [routerLink]="['/registro-diario', record.id]" class="btn btn-secondary btn-sm">
                        Ver
                      </a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center py-8 text-base-content/50">
                      No hay registros disponibles
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Tab Content: Liquidaciones -->
        @if (activeTab() === 'liquidations') {
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Total Ganado</th>
                  <th>Mínimo Garantizado</th>
                  <th>Pago Final</th>
                  <th>Método de Pago</th>
                  <th>Código/Ref.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (liquidation of liquidations(); track liquidation.id) {
                  <tr>
                    <td class="font-mono text-sm">{{ liquidation.fecha }}</td>
                    <td class="font-semibold">{{ formatCurrency(liquidation.total_ganado) }}</td>
                    <td class="font-semibold">{{ formatCurrency(liquidation.minimo_garantizado) }}</td>
                    <td class="font-semibold">{{ formatCurrency(liquidation.pago_final) }}</td>
                    <td>{{ liquidation.metodo_pago || '—' }}</td>
                    <td>{{ liquidation.codigo_transferencia || '—' }}</td>
                    <td>
                      @if (liquidation.estado_pago === 'pagado') {
                        <span class="badge badge-success">Pagado</span>
                      } @else {
                        <span class="badge badge-warning">Pendiente</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-8 text-base-content/50">
                      No hay liquidaciones disponibles
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverHistory {
  dailyRecords = input<DriverDailyRecord[]>([]);
  liquidations = input<DriverLiquidation[]>([]);

  activeTab = signal<'records' | 'liquidations'>('records');

  setActiveTab(tab: 'records' | 'liquidations'): void {
    this.activeTab.set(tab);
  }

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
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

