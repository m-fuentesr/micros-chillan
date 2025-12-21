import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AccountingSummary } from '../../models/accounting.models';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-accounting-kpis',
  imports: [KpiCard, UiIconComponent],
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
            <ui-icon name="TrendingUp" size="xs" class="text-success" />
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
          size="medium"
          [responsive]="true"
          badgeText="Flujo real"
          [animationDelay]="0">
          <span icon><ui-icon name="Wallet" size="sm" /></span>
        </app-kpi-card>

        <!-- KPI: Pago Choferes (Egreso - Warning) -->
        <app-kpi-card
          title="Pago Choferes"
          [subtitle]="'Capital humano'"
          [value]="formatCurrency(summary().totales.total_pago_choferes)"
          type="warning"
          size="medium"
          [responsive]="true"
          badgeText="Retribución variable"
          [animationDelay]="1">
          <span icon><ui-icon name="Users" size="sm" /></span>
        </app-kpi-card>

        <!-- KPI: Costo Diésel (Egreso - Error/Rojo) -->
        <app-kpi-card
          title="Costo Diésel"
          [subtitle]="'Eficiencia energética'"
          [value]="formatCurrency(summary().totales.total_costo_diesel)"
          type="danger"
          size="medium"
          [responsive]="true"
          badgeText="Insumo crítico"
          [animationDelay]="2">
          <span icon><ui-icon name="TriangleAlert" size="sm" /></span>
        </app-kpi-card>

        <!-- KPI: Gastos Repuestos (Egreso - Neutro) -->
        <app-kpi-card
          title="Repuestos"
          [subtitle]="'Continuidad de servicio'"
          [value]="formatCurrency(summary().totales.total_gastos_mantenimiento)"
          type="info"
          size="medium"
          [responsive]="true"
          badgeText="Reinversión activos"
          [animationDelay]="3">
          <span icon><ui-icon name="Settings" size="sm" /></span>
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

