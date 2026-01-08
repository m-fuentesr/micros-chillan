import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MachineKPIs as MachineKPIsType } from '../../models/machine.models';
import { KpiCard } from '../../components/kpi-card/kpi-card';


@Component({
  selector: 'app-machine-kpis',
  imports: [KpiCard],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <!-- Card 1: Máquinas Operativas -->
      <app-kpi-card
        title="Operativas"
        [subtitle]="'En servicio activo'"
        [value]="kpis().operativas.toString()"
        type="success"
        [badgeText]="kpis().operativas > 0 ? 'En ruta' : ''"
        [responsive]="true"
        [animationDelay]="0"
        iconName="CheckCircle2">
      </app-kpi-card>

      <!-- Card 2: En Taller -->
      <app-kpi-card
        title="En Taller"
        [subtitle]="'Mantenimiento técnico'"
        [value]="kpis().en_taller.toString()"
        type="warning"
        [badgeText]="kpis().en_taller > 0 ? 'En reparación' : ''"
        [successText]="kpis().en_taller === 0 ? 'Sin máquinas en taller' : ''"
        [responsive]="true"
        [animationDelay]="1"
        iconName="Settings">
      </app-kpi-card>

      <!-- Card 3: Inactivas -->
      <app-kpi-card
        title="Inactivas"
        [subtitle]="'Sin asignación'"
        [value]="kpis().inactivas.toString()"
        type="info"
        [badgeText]="kpis().inactivas > 0 ? 'En Reserva' : ''"
        [successText]="kpis().inactivas === 0 ? 'Todas activas' : ''"
        [responsive]="true"
        [animationDelay]="2"
        iconName="Ban">
      </app-kpi-card>

      <!-- Card 4: Documentos por Vencer -->
      <app-kpi-card
        title="Docs. por Vencer"
        [subtitle]="'Caducidad próxima'"
        [value]="kpis().documentos_por_vencer.toString()"
        type="danger"
        [badgeText]="kpis().documentos_por_vencer > 0 ? 'Renovar ahora' : ''"
        [successText]="kpis().documentos_por_vencer === 0 ? 'Todo al día' : ''"
        [responsive]="true"
        [animationDelay]="3"
        iconName="TriangleAlert">
      </app-kpi-card>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineKPIs {
  kpis = input.required<MachineKPIsType>();
}

