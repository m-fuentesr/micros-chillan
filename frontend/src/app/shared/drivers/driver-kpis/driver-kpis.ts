import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DriverKPIs as DriverKPIsType } from '../../models/driver.models';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-driver-kpis',
  imports: [KpiCard, UiIconComponent],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <!-- Card 1: Choferes Activos -->
      <app-kpi-card
        title="Activos"
        [subtitle]="'Plantilla vigente'"
        [value]="kpis().activos.toString()"
        type="success"
        [badgeText]="kpis().activos > 0 ? 'Habilitados' : ''"
        [responsive]="true"
        [animationDelay]="0">
        <span icon><ui-icon name="CheckCircle2" size="md" /></span>
      </app-kpi-card>

      <!-- Card 2: Choferes Inactivos -->
      <app-kpi-card
        title="Inactivos"
        [subtitle]="'Personal de baja'"
        [value]="kpis().inactivos.toString()"
        type="info"
        [badgeText]="kpis().inactivos > 0 ? 'Desvinculados' : ''"
        [successText]="kpis().inactivos === 0 ? 'Todo activo' : ''"
        [responsive]="true"
        [animationDelay]="1">
        <span icon><ui-icon name="Ban" size="md" /></span>
      </app-kpi-card>

      <!-- Card 3: Máquinas Asignadas -->
      <app-kpi-card
        title="Con Máquina"
        [subtitle]="'Asignación de flota'"
        [value]="kpis().con_maquina.toString()"
        type="info"
        [badgeText]="kpis().con_maquina > 0 ? 'Con unidad a cargo' : ''"
        [responsive]="true"
        [animationDelay]="2">
        <span icon><ui-icon name="BusFront" size="md" /></span>
      </app-kpi-card>

      <!-- Card 4: Licencias por Vencer -->
      <app-kpi-card
        title="Lic. por Vencer"
        [subtitle]="'Control documental'"
        [value]="kpis().licencias_por_vencer.toString()"
        type="danger"
        [badgeText]="kpis().licencias_por_vencer > 0 ? 'Renovar ahora' : ''"
        [successText]="kpis().licencias_por_vencer === 0 ? 'Todo al día' : ''"
        [responsive]="true"
        [animationDelay]="3">
        <span icon><ui-icon name="TriangleAlert" size="md" /></span>
      </app-kpi-card>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverKPIs {
  kpis = input.required<DriverKPIsType>();
}

