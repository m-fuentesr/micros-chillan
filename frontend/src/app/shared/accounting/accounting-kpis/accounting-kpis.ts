import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AccountingSummary } from '../../models/accounting.models';
import { KpiCard } from '../../components/kpi-card/kpi-card';

@Component({
  selector: 'app-accounting-kpis',
  imports: [KpiCard],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Hero Card: Ganancia Líquida (Ocupa 5/12 del ancho) -->
      <div class="lg:col-span-5 card bg-base-100 shadow-xl border-l-8 border-success h-full">
        <div class="card-body flex flex-col justify-center gap-1">
          <h3 class="text-sm uppercase tracking-widest text-base-content/60 font-bold">
            Ganancia Líquida (Neta)
          </h3>
          
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-success tracking-tight">
              {{ formatCurrency(summary().totales.ganancia_liquida) }}
            </span>
          </div>

          <div class="mt-4 flex items-center gap-2 text-sm text-base-content/70 bg-base-200 w-fit px-3 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4 text-success">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
            <span>Rentabilidad acumulada</span>
          </div>
        </div>
      </div>

      <!-- Grid de 4 KPIs secundarios (Ocupa 7/12 del ancho) -->
      <div class="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
        <!-- KPI: Total Recaudado (Ingreso - Azul) -->
        <app-kpi-card
          title="Total Recaudado"
          [subtitle]="'Liquidez operativa'"
          [value]="formatCurrency(summary().totales.total_recaudado)"
          type="financial"
          badgeText="Flujo real"
          [animationDelay]="0">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" />
          </svg>
        </app-kpi-card>

        <!-- KPI: Pago Choferes (Egreso - Warning) -->
        <app-kpi-card
          title="Pago Choferes"
          [subtitle]="'Capital humano'"
          [value]="formatCurrency(summary().totales.total_pago_choferes)"
          type="warning"
          badgeText="Retribución variable"
          [animationDelay]="1">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </app-kpi-card>

        <!-- KPI: Costo Diésel (Egreso - Error/Rojo) -->
        <app-kpi-card
          title="Costo Diésel"
          [subtitle]="'Eficiencia energética'"
          [value]="formatCurrency(summary().totales.total_costo_diesel)"
          type="danger"
          badgeText="Insumo crítico"
          [animationDelay]="2">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.457-.899c-1.252.81-1.272 2.596-.546 4.717.37.957.983 1.93 1.745 2.825A9 9 0 0010 18a9 9 0 006.326-15.485c-.328-.15-.698-.277-1.09-.38l-1.434-.374a1.001 1.001 0 00-1.407 1.192z" />
          </svg>
        </app-kpi-card>

        <!-- KPI: Gastos Repuestos (Egreso - Neutro) -->
        <app-kpi-card
          title="Repuestos"
          [subtitle]="'Continuidad de servicio'"
          [value]="formatCurrency(summary().totales.total_gastos_mantenimiento)"
          type="info"
          badgeText="Reinversión activos"
          [animationDelay]="3">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </app-kpi-card>
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

