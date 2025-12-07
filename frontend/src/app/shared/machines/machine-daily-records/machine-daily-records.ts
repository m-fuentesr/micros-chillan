import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MachineDailyRecord, MachineDailyRecordFilters } from '../../models/machine-detail.models';
import { Driver } from '../../models/driver.models';
import { SearchFilters, FilterField } from '../../components/search-filters/search-filters';
import { DriverIcon } from '../../components/driver-icon/driver-icon';

@Component({
  selector: 'app-machine-daily-records',
  imports: [CommonModule, RouterLink, SearchFilters, DriverIcon],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200/50 rounded-2xl overflow-hidden animate-component-enter">
      <!-- Header Premium con gradiente sutil -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex-1 min-w-0">
            <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
              Registros Diarios
            </h2>
            <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
              Historial de operaciones y rendimiento por jornada.
            </p>
          </div>
          
          <!-- Badge de conteo mejorado -->
          <div class="flex items-center gap-3 shrink-0">
            <span class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              {{ filteredRecords().length }} {{ filteredRecords().length === 1 ? 'registro' : 'registros' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
        <!-- Filtros usando componente reutilizable -->
        <app-search-filters
          [fields]="filterFields()"
          [filters]="filters()"
          [columns]="4"
          (filterChange)="onFiltersChange($event)" />

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
                  <div class="shrink-0">
                    <div class="bg-primary/10 w-10 h-10 rounded-full text-primary flex items-center justify-center border border-primary/20">
                      <app-driver-icon class="w-5 h-5 text-primary"></app-driver-icon>
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
            <div class="py-16 sm:py-20">
              <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div class="space-y-2">
                  <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay registros que coincidan con los filtros</h3>
                  <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                    Ajusta los filtros para ver más resultados.
                  </p>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full table-min-height">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[180px]">Conductor</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Recaudado</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Diésel</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Neto</th>
                <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[80px]">OBS.</th>
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
                      <div class="shrink-0">
                        <div class="bg-primary/10 w-8 h-8 rounded-full text-primary flex items-center justify-center border border-primary/20">
                          <app-driver-icon class="w-4 h-4 text-primary"></app-driver-icon>
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
                  
                  <td class="text-center py-4" (click)="$event.stopPropagation()">
                    <div class="flex items-center justify-center">
                      @if (record.observaciones) {
                        <div class="tooltip tooltip-top" [attr.data-tip]="record.observaciones">
                          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer group">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-primary group-hover:scale-110 transition-transform">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      } @else {
                        <div class="w-8 h-8 rounded-full bg-base-200/50 flex items-center justify-center border border-base-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-base-content/30">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      }
                    </div>
                  </td>
                  
                  <td class="pr-6 text-right py-4" (click)="$event.stopPropagation()">
                    <a 
                      [routerLink]="['/registro-diario', record.id]"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-base-content/70 hover:text-primary bg-base-100 hover:bg-primary/5 border border-base-200 hover:border-primary/30 transition-all duration-200 group">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 group-hover:scale-110 transition-transform">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                      </svg>
                      <span>Ver</span>
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="py-16 sm:py-20">
                    <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                      <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div class="space-y-2">
                        <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay registros que coincidan con los filtros</h3>
                        <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                          Ajusta los filtros para ver más resultados.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              }
              <!-- Filas vacías para mantener altura mínima en desktop -->
              @if (filteredRecords().length > 0 && filteredRecords().length < 5) {
                @for (i of getEmptyRows(); track i) {
                  <tr class="empty-row-spacer">
                    <td colspan="8" class="h-20"></td>
                  </tr>
                }
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

    /* Asegurar que los dropdowns se abran hacia abajo */
    .dropdown.dropdown-bottom {
      position: relative;
    }

    .dropdown-content {
      animation: dropdown-enter 200ms ease-out;
    }

    @keyframes dropdown-enter {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Estilo para el botón del dropdown que parece un select */
    .dropdown > div[role="button"] {
      user-select: none;
    }

    .dropdown > div[role="button"]:focus {
      outline: 2px solid hsl(var(--p));
      outline-offset: 2px;
    }

    /* Scroll personalizado para el dropdown de choferes */
    .dropdown-content.menu {
      scrollbar-width: thin;
      scrollbar-color: hsl(var(--bc) / 0.2) transparent;
    }

    .dropdown-content.menu::-webkit-scrollbar {
      width: 6px;
    }

    .dropdown-content.menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .dropdown-content.menu::-webkit-scrollbar-thumb {
      background-color: hsl(var(--bc) / 0.2);
      border-radius: 3px;
    }

    .dropdown-content.menu::-webkit-scrollbar-thumb:hover {
      background-color: hsl(var(--bc) / 0.3);
    }

    /* Filas vacías invisibles para mantener altura mínima en desktop */
    @media (min-width: 1280px) {
      .empty-row-spacer {
        visibility: hidden;
        pointer-events: none;
      }

      .empty-row-spacer td {
        border: none;
        padding: 0;
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

  selectedChoferName = computed(() => {
    const choferId = this.filters().chofer_id;
    if (!choferId) return 'Todos los choferes';
    const chofer = this.choferes().find(c => c.id === choferId);
    return chofer?.nombre_completo || 'Todos los choferes';
  });

  selectedOrdenText = computed(() => {
    const orden = this.filters().orden || 'mas_reciente';
    return orden === 'mas_reciente' ? 'Más reciente' : 'Más antiguo';
  });

  getEmptyRows(): number[] {
    const count = this.filteredRecords().length;
    if (count === 0) return [];
    const needed = 5 - count;
    return needed > 0 ? Array.from({ length: needed }, (_, i) => i) : [];
  }

  filterFields = computed((): FilterField[] => {
    return [
      {
        key: 'chofer_id',
        label: 'Chofer',
        type: 'select',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>',
        options: [
          { value: '', label: 'Todos los choferes' },
          ...this.choferes().map(c => ({ value: c.id, label: c.nombre_completo }))
        ]
      },
      {
        key: 'desde',
        label: 'Desde',
        type: 'date',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25a2.75 2.75 0 012.75 2.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75A2.75 2.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" /></svg>',
        placeholder: 'Seleccionar fecha'
      },
      {
        key: 'hasta',
        label: 'Hasta',
        type: 'date',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25a2.75 2.75 0 012.75 2.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75A2.75 2.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" /></svg>',
        placeholder: 'Seleccionar fecha'
      },
      {
        key: 'orden',
        label: 'Orden',
        type: 'select',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z" clip-rule="evenodd" /></svg>',
        options: [
          { value: 'mas_reciente', label: 'Más reciente' },
          { value: 'mas_antiguo', label: 'Más antiguo' }
        ]
      }
    ];
  });

  onFiltersChange(newFilters: Record<string, any>): void {
    const filters: MachineDailyRecordFilters = {
      chofer_id: (newFilters['chofer_id'] !== null && newFilters['chofer_id'] !== undefined && newFilters['chofer_id'] !== '') 
        ? Number(newFilters['chofer_id']) 
        : null,
      desde: newFilters['desde'] || null,
      hasta: newFilters['hasta'] || null,
      orden: newFilters['orden'] || 'mas_reciente'
    };
    this.filterChange.emit(filters);
  }

  onFilterChange(field: keyof MachineDailyRecordFilters, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value || null;
    
    const newFilters: MachineDailyRecordFilters = {
      ...this.filters(),
      [field]: field === 'chofer_id' ? (value ? Number(value) : null) : value
    };
    
    this.filterChange.emit(newFilters);
  }

  onFilterChangeDirect(field: keyof MachineDailyRecordFilters, value: string | number | null): void {
    const newFilters: MachineDailyRecordFilters = {
      ...this.filters(),
      [field]: field === 'chofer_id' ? (value ? Number(value) : null) : (value as string || null)
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
