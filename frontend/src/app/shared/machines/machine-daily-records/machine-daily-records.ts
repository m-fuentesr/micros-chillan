import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineDailyRecord, MachineDailyRecordFilters } from '../../models/machine-detail.models';
import { Driver } from '../../models/driver.models';

@Component({
  selector: 'app-machine-daily-records',
  imports: [CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header">
        <div>
          <h2 class="card-title text-2xl">Historial de Registros Diarios</h2>
          <p class="text-sm text-base-content/70">
            Últimos registros, estado de cierre y KPIs por jornada.
          </p>
        </div>
      </div>
      <div class="card-body">
        <!-- Filtros -->
        <div class="flex flex-wrap gap-4 mb-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Chofer</span>
            </label>
            <select 
              class="select select-bordered select-sm w-48"
              [value]="filters().chofer_id || ''"
              (change)="onFilterChange('chofer_id', $event)">
              <option value="">Todos</option>
              @for (chofer of choferes(); track chofer.id) {
                <option [value]="chofer.id">{{ chofer.nombre_completo }}</option>
              }
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Desde</span>
            </label>
            <input
              type="date"
              class="input input-bordered input-sm w-48"
              [value]="filters().desde || ''"
              (change)="onFilterChange('desde', $event)">
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Hasta</span>
            </label>
            <input
              type="date"
              class="input input-bordered input-sm w-48"
              [value]="filters().hasta || ''"
              (change)="onFilterChange('hasta', $event)">
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Orden</span>
            </label>
            <select 
              class="select select-bordered select-sm w-48"
              [value]="filters().orden || 'mas_reciente'"
              (change)="onFilterChange('orden', $event)">
              <option value="mas_reciente">Más reciente</option>
              <option value="mas_antiguo">Más antiguo</option>
            </select>
          </div>

          <div class="form-control self-end">
            <button class="btn btn-ghost btn-sm" (click)="onClearFilters()">
              Limpiar filtros
            </button>
          </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>CHOFER</th>
                <th>RECAUDADO</th>
                <th>DIÉSEL</th>
                <th>OBS.</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (record of filteredRecords(); track record.id) {
                <tr>
                  <td class="font-mono text-sm">{{ formatDate(record.fecha) }}</td>
                  <td class="truncate tooltip" [attr.data-tip]="record.chofer">{{ record.chofer }}</td>
                  <td class="font-semibold">{{ formatCurrency(record.recaudado) }}</td>
                  <td class="font-semibold">{{ formatCurrency(record.diesel) }}</td>
                  <td>
                    @if (record.observaciones) {
                      <div class="tooltip" [attr.data-tip]="record.observaciones">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="text-info">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                          <path d="m8.93 6.588-2.29.287-.082 38.35.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                        </svg>
                      </div>
                    } @else {
                      <span class="text-base-content/30">—</span>
                    }
                  </td>
                  <td>
                    <button class="link link-primary text-sm" (click)="onViewDetail(record)">
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center text-base-content/50 py-8">
                    No hay registros que coincidan con los filtros
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineDailyRecords {
  records = input.required<MachineDailyRecord[]>();
  choferes = input<Driver[]>([]);
  filters = input<MachineDailyRecordFilters>({});
  
  filterChange = output<MachineDailyRecordFilters>();
  viewDetail = output<MachineDailyRecord>();

  filteredRecords = computed(() => {
    let filtered = [...this.records()];
    const filters = this.filters();

    // Filtrar por chofer
    if (filters.chofer_id) {
      filtered = filtered.filter(r => r.chofer_id === filters.chofer_id);
    }

    // Filtrar por fecha desde
    if (filters.desde) {
      const desde = new Date(filters.desde);
      filtered = filtered.filter(r => {
        const fecha = new Date(r.fecha);
        return fecha >= desde;
      });
    }

    // Filtrar por fecha hasta
    if (filters.hasta) {
      const hasta = new Date(filters.hasta);
      hasta.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        const fecha = new Date(r.fecha);
        return fecha <= hasta;
      });
    }

    // Ordenar
    if (filters.orden === 'mas_antiguo') {
      filtered.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    return filtered;
  });

  onFilterChange(field: keyof MachineDailyRecordFilters, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value || null;
    
    const newFilters: MachineDailyRecordFilters = {
      ...this.filters(),
      [field]: field === 'chofer_id' ? (value ? Number(value) : null) : value
    };
    
    this.filterChange.emit(newFilters);
  }

  onClearFilters(): void {
    this.filterChange.emit({});
  }

  onViewDetail(record: MachineDailyRecord): void {
    this.viewDetail.emit(record);
  }

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }
}

