import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MachineDailyRecord, MachineDailyRecordFilters } from '../../models/machine-detail.models';
import { Driver } from '../../models/driver.models';

@Component({
  selector: 'app-machine-daily-records',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden animate-component-enter">
      <!-- Header -->
      <div class="card-header p-6 border-b border-base-200 bg-base-50">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="card-title text-2xl font-bold border-l-4 border-l-primary pl-3">
              Registros Diarios
            </h2>
            <p class="text-xs sm:text-sm text-base-content/60 mt-1">
              Historial de operaciones y rendimiento por jornada.
            </p>
          </div>
          
          <!-- Badge de conteo -->
          <div class="flex items-center gap-3">
            <span class="badge badge-lg badge-outline font-bold">
              {{ filteredRecords().length }} {{ filteredRecords().length === 1 ? 'registro' : 'registros' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-4 sm:p-6">
        <!-- Filtros Mejorados -->
        <div class="bg-base-50/50 p-4 rounded-xl border border-base-200 mb-6">
          <div class="flex flex-wrap items-end gap-3">
            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Chofer</span>
              </label>
              <select 
                class="select select-bordered select-sm w-full"
                [value]="filters().chofer_id || ''"
                (change)="onFilterChange('chofer_id', $event)">
                <option value="">Todos los choferes</option>
                @for (chofer of choferes(); track chofer.id) {
                  <option [value]="chofer.id">{{ chofer.nombre_completo }}</option>
                }
              </select>
            </div>

            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Desde</span>
              </label>
              <input
                type="date"
                class="input input-bordered input-sm w-full"
                [value]="filters().desde || ''"
                (change)="onFilterChange('desde', $event)">
            </div>

            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Hasta</span>
              </label>
              <input
                type="date"
                class="input input-bordered input-sm w-full"
                [value]="filters().hasta || ''"
                (change)="onFilterChange('hasta', $event)">
            </div>

            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Orden</span>
              </label>
              <select 
                class="select select-bordered select-sm w-full"
                [value]="filters().orden || 'mas_reciente'"
                (change)="onFilterChange('orden', $event)">
                <option value="mas_reciente">Más reciente</option>
                <option value="mas_antiguo">Más antiguo</option>
              </select>
            </div>

            <div class="form-control">
              <button 
                class="btn btn-ghost btn-sm gap-2" 
                (click)="onClearFilters()"
                [class.btn-disabled]="!hasActiveFilters()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.972.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.591l-4.682 4.683a2.25 2.25 0 00-.659 1.591v4.242a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L4.659 8.591A2.25 2.25 0 014 7V4.341a.75.75 0 01.628-.74z" clip-rule="evenodd" />
                </svg>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <!-- Vista Móvil: Cards -->
        <div class="block xl:hidden space-y-4">
          @for (record of filteredRecords(); track record.id; let i = $index) {
            <div 
              class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
              [style.animation-delay.ms]="i * 50"
              [style.animation-fill-mode]="'both'">
              <div class="card-body p-5">
                <!-- Header: Fecha y Estado -->
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-bold text-base text-base-content">{{ formatDate(record.fecha) }}</h3>
                      <p class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</p>
                    </div>
                  </div>
                  
                  @if (record.estado) {
                    <div class="badge badge-sm gap-1"
                      [class.badge-success]="record.estado === 'COMPLETO'"
                      [class.badge-warning]="record.estado === 'PENDIENTE_TRABAJADOR'"
                      [class.badge-error]="record.estado === 'INCIDENTE_REPORTADO'"
                      [class.badge-ghost]="record.estado === 'NO_TRABAJADO' || record.estado === 'DIA_NO_TRABAJADO'">
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {{ formatEstado(record.estado) }}
                    </div>
                  }
                </div>

                <!-- Chofer -->
                <div class="flex items-center gap-3 mb-4 p-3 bg-base-50 rounded-lg border border-base-200">
                  <div class="avatar placeholder shrink-0">
                    <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-10 h-10 rounded-full text-primary flex items-center justify-center border border-base-200">
                      <span class="text-xs font-bold">{{ getInitials(record.chofer) }}</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-base-content truncate tooltip" [attr.data-tip]="record.chofer">
                      {{ record.chofer }}
                    </p>
                    <p class="text-xs text-base-content/50">Conductor</p>
                  </div>
                </div>

                <!-- Divider -->
                <div class="divider my-2 opacity-30"></div>

                <!-- Información Financiera -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Recaudado</div>
                    <div class="font-bold text-base tabular-nums text-success">
                      {{ formatCurrency(record.recaudado) }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Diésel</div>
                    <div class="font-bold text-base tabular-nums text-error">
                      {{ formatCurrency(record.diesel) }}
                    </div>
                  </div>
                </div>

                <!-- Observaciones -->
                @if (record.observaciones) {
                  <div class="mt-3 p-2 bg-info/10 rounded border border-info/20">
                    <div class="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-info shrink-0 mt-0.5">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                      </svg>
                      <p class="text-xs text-base-content/70 flex-1">{{ record.observaciones }}</p>
                    </div>
                  </div>
                }

                <!-- Botón de Acción -->
                <div class="mt-4">
                  <a 
                    [routerLink]="['/registro-diario', record.id]"
                    class="btn btn-sm w-full btn-outline gap-2 hover:btn-primary transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                    Ver Detalle
                  </a>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12 animate-fade-in">
              <div class="text-4xl opacity-50 mb-3">📋</div>
              <p class="text-base-content/50 font-medium">No hay registros que coincidan con los filtros</p>
              <p class="text-sm text-base-content/40 mt-1">Intenta ajustar los filtros para ver más resultados</p>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[180px]">Conductor</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Recaudado</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Diésel</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Neto</th>
                <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                <th class="py-4 pr-6 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (record of filteredRecords(); track record.id; let i = $index) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter cursor-pointer"
                  [style.animation-delay.ms]="i * 30"
                  [style.animation-fill-mode]="'both'"
                  (click)="onViewDetail(record)">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div>
                        <div class="font-bold text-base-content">{{ formatDate(record.fecha) }}</div>
                        <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="py-4">
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder shrink-0">
                        <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-8 h-8 rounded-full text-primary flex items-center justify-center border border-base-200">
                          <span class="text-[10px] font-bold">{{ getInitials(record.chofer) }}</span>
                        </div>
                      </div>
                      <span class="font-medium text-base-content/80 truncate tooltip" [attr.data-tip]="record.chofer">
                        {{ record.chofer }}
                      </span>
                    </div>
                  </td>
                  
                  <td class="text-right py-4 font-mono font-bold text-success tabular-nums text-sm">
                    {{ formatCurrency(record.recaudado) }}
                  </td>
                  
                  <td class="text-right py-4 font-mono font-bold text-error tabular-nums text-sm">
                    {{ formatCurrency(record.diesel) }}
                  </td>
                  
                  <td class="text-right py-4 font-mono font-bold text-base-content tabular-nums text-sm">
                    {{ formatCurrency(record.recaudado - record.diesel) }}
                  </td>
                  
                  <td class="text-center py-4">
                    @if (record.estado) {
                      <div class="badge badge-sm gap-1"
                        [class.badge-success]="record.estado === 'COMPLETO'"
                        [class.badge-warning]="record.estado === 'PENDIENTE_TRABAJADOR'"
                        [class.badge-error]="record.estado === 'INCIDENTE_REPORTADO'"
                        [class.badge-ghost]="record.estado === 'NO_TRABAJADO' || record.estado === 'DIA_NO_TRABAJADO'">
                        <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {{ formatEstado(record.estado) }}
                      </div>
                    } @else {
                      <span class="text-base-content/30">—</span>
                    }
                  </td>
                  
                  <td class="pr-6 text-right py-4" (click)="$event.stopPropagation()">
                    <div class="flex items-center justify-end gap-2">
                      @if (record.observaciones) {
                        <div class="tooltip" [attr.data-tip]="record.observaciones">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-info">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      }
                      <a 
                        [routerLink]="['/registro-diario', record.id]"
                        class="btn btn-xs h-8 px-3 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                          <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                        Ver
                      </a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-12 animate-fade-in">
                    <div class="text-4xl opacity-50 mb-3">📋</div>
                    <p class="text-base-content/50 font-medium">No hay registros que coincidan con los filtros</p>
                    <p class="text-sm text-base-content/40 mt-1">Intenta ajustar los filtros para ver más resultados</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes componentEnter {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-component-enter {
      animation: componentEnter 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes card-enter {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes table-row-enter {
      from {
        opacity: 0;
        transform: translateX(-8px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-card-enter {
      animation: card-enter 400ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    .animate-table-row-enter {
      animation: table-row-enter 300ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    .animate-fade-in {
      animation: fade-in 400ms ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-component-enter,
      .animate-card-enter,
      .animate-table-row-enter,
      .animate-fade-in {
        animation: none;
        transform: none;
      }
    }
  `],
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

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.chofer_id || f.desde || f.hasta);
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

  getInitials(name: string): string {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  }

  formatDateFull(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short'
      });
    } catch {
      return '';
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

  formatEstado(estado: string): string {
    const estados: Record<string, string> = {
      'COMPLETO': 'Completo',
      'PENDIENTE_TRABAJADOR': 'Pendiente',
      'INCIDENTE_REPORTADO': 'Incidente',
      'NO_TRABAJADO': 'No Trabajado',
      'DIA_NO_TRABAJADO': 'No Trabajado'
    };
    return estados[estado] || estado;
  }
}
