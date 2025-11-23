import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Driver } from '../../models/driver.models';

@Component({
  selector: 'app-driver-summary',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl sticky top-6">
      <div class="card-body">
        <h3 class="card-title text-base mb-4">Resumen Rápido</h3>
        
        <div class="space-y-4">
          <div class="border-b border-base-300 pb-2">
            <span class="text-xs uppercase tracking-wide text-base-content/70">ID Chofer</span>
            <div class="font-semibold mt-1">CH-{{ driver().id.toString().padStart(3, '0') }}</div>
          </div>
          
          <div class="border-b border-base-300 pb-2">
            <span class="text-xs uppercase tracking-wide text-base-content/70">Fecha Registro</span>
            <div class="font-semibold mt-1">{{ formatDate(driver().created_at) }}</div>
          </div>
          
          <div class="border-b border-base-300 pb-2">
            <span class="text-xs uppercase tracking-wide text-base-content/70">Reportes Totales</span>
            <div class="font-semibold mt-1">{{ reportCount() }}</div>
          </div>
          
          <div class="pb-2">
            <span class="text-xs uppercase tracking-wide text-base-content/70">Último Reporte</span>
            <div class="font-semibold mt-1">{{ formatDate(lastReportDate()) }}</div>
          </div>
        </div>

        <div class="divider"></div>

        <p class="text-xs text-base-content/70 mt-4">
          Usa los tabs arriba para navegar entre los reportes diarios y las liquidaciones mensuales de este chofer.
        </p>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverSummary {
  driver = input.required<Driver>();
  reportCount = input(0);
  lastReportDate = input<string | null>(null);

  formatDate(date: string | null | undefined): string {
    if (!date) return '--';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
    }
  }
}

