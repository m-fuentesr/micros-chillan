import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AccountingSummary } from '../../models/accounting.models';

@Component({
  selector: 'app-accounting-kpis',
  imports: [],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-sm text-base-content/70 mb-1">Total Recaudado (Bruto)</div>
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold">{{ formatCurrency(summary().totales.total_recaudado) }}</div>
          <div class="text-xs text-base-content/70 mt-1">
            {{ summary().es_mes_actual ? 'Acumulado hasta hoy' : 'Total del período' }}
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-sm text-base-content/70 mb-1">Costo Diésel (Total)</div>
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold">{{ formatCurrency(summary().totales.total_costo_diesel) }}</div>
          <div class="text-xs text-base-content/70 mt-1">
            {{ summary().es_mes_actual ? 'Acumulado hasta hoy' : 'Total del período' }}
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-sm text-base-content/70 mb-1">Pago Choferes (Total)</div>
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold">{{ formatCurrency(summary().totales.total_pago_choferes) }}</div>
          <div class="text-xs text-base-content/70 mt-1">
            {{ summary().es_mes_actual ? 'Acumulado hasta hoy' : 'Total del período' }}
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-sm text-base-content/70 mb-1">Gastos en Repuestos (Mes)</div>
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold">{{ formatCurrency(summary().totales.gastos_repuestos) }}</div>
          <div class="text-xs text-base-content/70 mt-1">
            {{ summary().es_mes_actual ? 'Acumulado hasta hoy' : 'Total del período' }}
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-sm text-base-content/70 mb-1">Ganancia Líquida (Neta)</div>
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-success">{{ formatCurrency(summary().totales.ganancia_liquida) }}</div>
          <div class="text-xs text-base-content/70 mt-1">
            {{ summary().es_mes_actual ? 'Acumulado hasta hoy' : 'Total del período' }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingKPIs {
  summary = input.required<AccountingSummary>();

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }
}

