import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DriverStatusFilter, Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';

@Component({
  selector: 'app-driver-filters',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <section>
          <h3 class="text-sm uppercase tracking-wide text-base-content/70 mb-4">Filtro Rápido</h3>
          <div class="join w-full">
            <button
              class="btn join-item flex-1"
              [class.btn-active]="activeFilter() === 'all'"
              (click)="onFilterChange('all')">
              Todos
            </button>
            <button
              class="btn join-item flex-1"
              [class.btn-active]="activeFilter() === 'activo'"
              (click)="onFilterChange('activo')">
              Activos
            </button>
            <button
              class="btn join-item flex-1"
              [class.btn-active]="activeFilter() === 'inactivo'"
              (click)="onFilterChange('inactivo')">
              Inactivos
            </button>
          </div>
        </section>

        <div class="divider"></div>

        <section>
          <h3 class="text-sm uppercase tracking-wide text-base-content/70 mb-4">Alertas de Licencias</h3>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-error"></span>
              Vencidas: <strong>{{ licenseAlerts().vencidas }}</strong>
            </li>
            <li class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-warning"></span>
              Por vencer: <strong>{{ licenseAlerts().por_vencer }}</strong>
            </li>
            <li class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              Al día: <strong>{{ licenseAlerts().al_dia }}</strong>
            </li>
          </ul>
        </section>

        <p class="text-xs text-base-content/70 mt-6">
          Los filtros afectan ambas vistas y los conteos de documentos se recalculan automáticamente.
        </p>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverFilters {
  activeFilter = input<DriverStatusFilter>('all');
  drivers = input<Driver[]>([]);
  
  filterChange = output<DriverStatusFilter>();

  licenseAlerts = computed(() => {
    const drivers = this.drivers();
    let vencidas = 0;
    let por_vencer = 0;
    let al_dia = 0;

    drivers.forEach(driver => {
      const status = calculateLicenseStatus(driver.fecha_venc_licencia, 30);
      if (status.estado === 'error') {
        vencidas++;
      } else if (status.estado === 'warning') {
        por_vencer++;
      } else {
        al_dia++;
      }
    });

    return { vencidas, por_vencer, al_dia };
  });

  onFilterChange(filter: DriverStatusFilter): void {
    this.filterChange.emit(filter);
  }
}

