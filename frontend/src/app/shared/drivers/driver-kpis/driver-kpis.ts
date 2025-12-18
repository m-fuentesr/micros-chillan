import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DriverKPIs as DriverKPIsType } from '../../models/driver.models';
import { KpiCard } from '../../components/kpi-card/kpi-card';

@Component({
  selector: 'app-driver-kpis',
  imports: [KpiCard],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <!-- Card 1: Choferes Activos -->
      <app-kpi-card
        title="Activos"
        [subtitle]="'Plantilla vigente'"
        [value]="kpis().activos.toString()"
        type="success"
        [badgeText]="kpis().activos > 0 ? 'Habilitados' : ''"
        [animationDelay]="0">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </app-kpi-card>

      <!-- Card 2: Choferes Inactivos -->
      <app-kpi-card
        title="Inactivos"
        [subtitle]="'Personal de baja'"
        [value]="kpis().inactivos.toString()"
        type="info"
        [badgeText]="kpis().inactivos > 0 ? 'Desvinculados' : ''"
        [successText]="kpis().inactivos === 0 ? 'Todo activo' : ''"
        [animationDelay]="1">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </app-kpi-card>

      <!-- Card 3: Máquinas Asignadas -->
      <app-kpi-card
        title="Con Máquina"
        [subtitle]="'Asignación de flota'"
        [value]="kpis().con_maquina.toString()"
        type="info"
        [badgeText]="kpis().con_maquina > 0 ? 'Con unidad a cargo' : ''"
        [animationDelay]="2">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      </app-kpi-card>

      <!-- Card 4: Licencias por Vencer -->
      <app-kpi-card
        title="Lic. por Vencer"
        [subtitle]="'Control documental'"
        [value]="kpis().licencias_por_vencer.toString()"
        type="danger"
        [badgeText]="kpis().licencias_por_vencer > 0 ? 'Renovar ahora' : ''"
        [successText]="kpis().licencias_por_vencer === 0 ? 'Todo al día' : ''"
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
export class DriverKPIs {
  kpis = input.required<DriverKPIsType>();
}

