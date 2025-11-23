import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { StatusFilter, MachineDocumentAlerts } from '../../models/machine.models';

@Component({
  selector: 'app-machine-filters',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl hover-lift">
      <div class="card-body">
        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-4">
            Filtro rápido
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-sm"
              [class.btn-active]="activeFilter() === 'all'"
              (click)="onFilterChange('all')"
              type="button">
              Todas
            </button>
            <button
              class="btn btn-sm"
              [class.btn-active]="activeFilter() === 'Operativa'"
              (click)="onFilterChange('Operativa')"
              type="button">
              Operativas
            </button>
            <button
              class="btn btn-sm"
              [class.btn-active]="activeFilter() === 'En Taller'"
              (click)="onFilterChange('En Taller')"
              type="button">
              En taller
            </button>
            <button
              class="btn btn-sm"
              [class.btn-active]="activeFilter() === 'Inactiva'"
              (click)="onFilterChange('Inactiva')"
              type="button">
              Inactivas
            </button>
          </div>
        </section>

        <section class="mt-6">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-4">
            Alertas documentales
          </h3>
          <ul class="space-y-2">
            <li class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 rounded-full bg-error"></span>
              Vencidos: <strong>{{ alerts().vencidos }}</strong>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 rounded-full bg-warning"></span>
              Por vencer: <strong>{{ alerts().por_vencer }}</strong>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              Al día: <strong>{{ alerts().al_dia }}</strong>
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
export class MachineFilters {
  activeFilter = input<StatusFilter>('all');
  alerts = input.required<MachineDocumentAlerts>();
  filterChange = output<StatusFilter>();

  onFilterChange(filter: StatusFilter): void {
    this.filterChange.emit(filter);
  }
}

