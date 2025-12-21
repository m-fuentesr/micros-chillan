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
        [animationDelay]="0">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
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
        [animationDelay]="1">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
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
        [animationDelay]="2">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
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
        [animationDelay]="3">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </app-kpi-card>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineKPIs {
  kpis = input.required<MachineKPIsType>();
}

