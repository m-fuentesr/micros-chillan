import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, output, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceRecord, MaintenanceFilters } from '../../models/machine-detail.models';
import { SearchFilters, FilterField } from '../../components/search-filters/search-filters';
import { ConfirmModalService } from '../../services/confirm-modal.service';
import { MaintenanceFormModalService } from '../../services/maintenance-form-modal.service';

@Component({
  selector: 'app-machine-maintenance',
  imports: [CommonModule, FormsModule, SearchFilters],
  template: `

    <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden animate-component-enter">
      <!-- Header -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
          <div class="flex-1 min-w-0">
            <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
              Mantenimiento y Gastos
            </h2>
            <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
              Gestiona repuestos, mantenimientos y gastos asociados a esta máquina.
            </p>
          </div>
          
          <!-- Derecha: Badge, KPI y Botón -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 lg:gap-6 shrink-0 w-full sm:w-auto">
            <!-- Badge de conteo y KPI en fila -->
            <div class="flex items-center gap-4 sm:gap-5 flex-wrap">
              <span class="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                {{ filteredRecords().length }} {{ filteredRecords().length === 1 ? 'registro' : 'registros' }}
              </span>
              
              <!-- KPI de Gastos en Repuestos -->
              <div class="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg border border-error/20 bg-gradient-to-br from-error/10 via-error/5 to-transparent flex items-center gap-3 sm:gap-4">
                <div class="p-2 sm:p-2.5 bg-error/20 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.457-.899c-1.252.81-1.272 2.596-.546 4.717.37.957.983 1.93 1.745 2.825A9 9 0 0010 18a9 9 0 006.326-15.485c-.328-.15-.698-.277-1.09-.38l-1.434-.374a1.001 1.001 0 00-1.407 1.192z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="flex flex-col min-w-0">
                  <div class="text-[10px] sm:text-xs font-bold text-base-content/50 uppercase tracking-wider leading-tight">Gastos en Repuestos</div>
                  <div class="text-base sm:text-lg lg:text-xl font-black text-error tabular-nums tracking-tight leading-none">
                    {{ formatCurrency(monthTotal()) }}
                  </div>
                  <div class="text-[9px] sm:text-[10px] text-base-content/60 leading-tight mt-0.5">Acumulado del mes actual</div>
                </div>
              </div>
            </div>
            
            <!-- Botón Registrar Nueva Compra -->
            <button
              class="btn btn-primary gap-2 font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap w-full sm:w-auto"
              (click)="openAddRecordModal()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva compra
            </button>
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
              class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group"
              [class.animate-card-enter]="!isNewlyAdded(record.id)"
              [class.animate-new-record]="isNewlyAdded(record.id)"
              [style.animation-delay.ms]="isNewlyAdded(record.id) ? 0 : i * 50"
              [style.animation-fill-mode]="'both'">
              <div class="card-body p-5">
                <!-- Header: Fecha y Categoría -->
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
                  
                  <!-- Badge Categoría -->
                  <div class="shrink-0">
                    @if (record.categoria === 'preventivo') {
                      <div class="badge badge-success gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                        </svg>
                        Preventivo
                      </div>
                    } @else if (record.categoria === 'correctivo') {
                      <div class="badge badge-warning gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                        </svg>
                        Correctivo
                      </div>
                    } @else {
                      <div class="badge badge-ghost">—</div>
                    }
                  </div>
                </div>

                <!-- Divider -->
                <div class="divider my-3 opacity-30"></div>

                <!-- Información del Repuesto -->
                <div class="space-y-3">
                  <div class="p-3 bg-base-50 rounded-lg border border-base-200">
                    <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Ítem/Repuesto</div>
                    <div class="font-bold text-base text-base-content truncate tooltip" [attr.data-tip]="record.item">
                      {{ record.item }}
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 bg-error/5 rounded-lg border border-error/20">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Costo</div>
                      <div class="font-bold text-lg text-error tabular-nums">
                        {{ formatCurrency(record.costo) }}
                      </div>
                    </div>
                    <div class="p-3 bg-base-50 rounded-lg border border-base-200">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Nº Factura</div>
                      <div class="font-mono text-sm text-base-content break-all">
                        {{ record.numero_factura }}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          } @empty {
            <div class="text-center py-12 animate-fade-in">
              <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586L11.12 2.12a2.548 2.548 0 013.586 0l4.655 5.653a2.548 2.548 0 010 3.586l-5.877 5.877M11.42 15.17l-1.496 1.83" />
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
          <table class="table w-full">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[200px]">Ítem/Repuesto</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Costo</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[150px]">Nº Factura/Boleta</th>
                <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Categoría</th>
                <th class="py-4 pr-6 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (record of filteredRecords(); track record.id; let i = $index) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none"
                  [class.animate-table-row-enter]="!isNewlyAdded(record.id)"
                  [class.animate-new-record]="isNewlyAdded(record.id)"
                  [style.animation-delay.ms]="isNewlyAdded(record.id) ? 0 : i * 30"
                  [style.animation-fill-mode]="'both'">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div>
                        <div class="font-semibold text-base-content">{{ formatDate(record.fecha) }}</div>
                        <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="py-4">
                    <div class="font-bold text-base-content truncate tooltip" [attr.data-tip]="record.item">
                      {{ record.item }}
                    </div>
                  </td>
                  
                  <td class="text-right py-4 font-mono font-bold text-error tabular-nums text-sm">
                    {{ formatCurrency(record.costo) }}
                  </td>
                  
                  <td class="py-4">
                    <div class="font-mono text-sm text-base-content break-all">
                      {{ record.numero_factura }}
                    </div>
                  </td>
                  
                  <td class="text-center py-4">
                    @if (record.categoria === 'preventivo') {
                      <div class="badge badge-success gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                        </svg>
                        Preventivo
                      </div>
                    } @else if (record.categoria === 'correctivo') {
                      <div class="badge badge-warning gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                        </svg>
                        Correctivo
                      </div>
                    } @else {
                      <span class="text-base-content/30">—</span>
                    }
                  </td>
                  
                  <td class="pr-6 text-right py-4" (click)="$event.stopPropagation()">
                    <button 
                      class="btn-action-delete group relative overflow-hidden rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-error border border-error/30 bg-error/5 hover:bg-error hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                      (click)="openDeleteModal(record.id)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 shrink-0">
                        <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
                      </svg>
                      <span class="whitespace-nowrap">Eliminar</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-16 sm:py-20">
                    <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                      <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586L11.12 2.12a2.548 2.548 0 013.586 0l4.655 5.653a2.548 2.548 0 010 3.586l-5.877 5.877M11.42 15.17l-1.496 1.83" />
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

    @keyframes new-record-enter {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
        max-height: 0;
        margin-top: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
        max-height: 200px;
      }
    }

    .animate-new-record {
      animation: new-record-enter 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      background: linear-gradient(to right, 
        hsl(var(--p) / 0.05) 0%, 
        transparent 3%, 
        transparent 97%, 
        hsl(var(--p) / 0.05) 100%);
    }

    /* Resaltar temporalmente el nuevo registro */
    .animate-new-record::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: hsl(var(--p));
      animation: highlight-fade 2000ms ease-out forwards;
    }

    @keyframes highlight-fade {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-component-enter,
      .animate-card-enter,
      .animate-table-row-enter,
      .animate-fade-in,
      .animate-new-record {
        animation: none;
        transform: none;
      }
    }

    /* Estilos para botón de eliminar con efecto shimmer */
    .btn-action-delete {
      position: relative;
    }
    
    .btn-action-delete::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .btn-action-delete:hover::before {
      left: 100%;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineMaintenance implements OnInit, OnDestroy {
  machineId = input.required<number>();
  records = input.required<MaintenanceRecord[]>();
  availableItems = input<string[]>([]);
  filters = input<MaintenanceFilters>({});

  recordAdded = output<MaintenanceRecord>();
  recordDeleted = output<number>();
  filterChange = output<MaintenanceFilters>();

  private confirmModal = inject(ConfirmModalService);
  private maintenanceFormModal = inject(MaintenanceFormModalService);

  // Rastrear IDs de registros recién agregados para animación
  private newlyAddedIds = signal<Set<number>>(new Set());
  private previousRecordIds = signal<Set<number>>(new Set());

  monthTotal = computed(() => {
    const records = this.records();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records
      .filter(r => {
        const recordDate = new Date(r.fecha);
        return recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.costo, 0);
  });

  filteredRecords = computed(() => {
    const records = this.records();
    const filters = this.filters();

    return records.filter(record => {
      if (filters.item && !record.item.toLowerCase().includes(filters.item.toLowerCase())) {
        return false;
      }
      if (filters.categoria && filters.categoria !== 'all' && record.categoria !== filters.categoria) {
        return false;
      }
      if (filters.desde && record.fecha < filters.desde) {
        return false;
      }
      if (filters.hasta && record.fecha > filters.hasta) {
        return false;
      }
      return true;
    });
  });

  // Verificar si un registro es nuevo (siempre retorna false para evitar problemas)
  isNewlyAdded = (recordId: number): boolean => {
    return false; // Deshabilitado temporalmente para evitar problemas con el cambio de pestañas
  };

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.item || f.categoria || f.desde || f.hasta);
  });

  filterFields = computed<FilterField[]>(() => [
    {
      key: 'item',
      label: 'Ítem/Repuesto',
      type: 'text',
      placeholder: 'Buscar por ítem...'
    },
    {
      key: 'categoria',
      label: 'Categoría',
      type: 'select',
      options: [
        { value: 'all', label: 'Todas las categorías' },
        { value: 'preventivo', label: 'Preventivo' },
        { value: 'correctivo', label: 'Correctivo' }
      ]
    },
    {
      key: 'desde',
      label: 'Desde',
      type: 'date',
      placeholder: 'Seleccionar fecha'
    },
    {
      key: 'hasta',
      label: 'Hasta',
      type: 'date',
      placeholder: 'Seleccionar fecha'
    }
  ]);

  onFiltersChange(newFilters: Record<string, any>): void {
    const updatedFilters: MaintenanceFilters = {};
    
    // Procesar cada filtro
    if (newFilters['item'] && typeof newFilters['item'] === 'string' && newFilters['item'].trim()) {
      updatedFilters.item = newFilters['item'].trim();
    }
    
    if (newFilters['categoria'] && newFilters['categoria'] !== 'all' && newFilters['categoria'] !== '') {
      updatedFilters.categoria = newFilters['categoria'] as 'preventivo' | 'correctivo';
    }
    
    if (newFilters['desde'] && typeof newFilters['desde'] === 'string' && newFilters['desde'].trim()) {
      updatedFilters.desde = newFilters['desde'].trim();
    }
    
    if (newFilters['hasta'] && typeof newFilters['hasta'] === 'string' && newFilters['hasta'].trim()) {
      updatedFilters.hasta = newFilters['hasta'].trim();
    }
    
    this.filterChange.emit(updatedFilters);
  }

  ngOnInit(): void {
    // Inicializar la lista de IDs anteriores con los registros actuales
    const initialRecords = this.records();
    if (initialRecords.length > 0) {
      const initialIds = new Set(initialRecords.map(r => r.id));
      this.previousRecordIds.set(initialIds);
    }
  }

  ngOnDestroy(): void {
    // Limpiar cualquier timeout pendiente si es necesario
  }



  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  formatDate(date: string): string {
    if (!date) return '';
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
    if (!date) return '';
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

  openDeleteModal(recordId: number): void {
    this.confirmModal.open({
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar este registro de mantenimiento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButtonClass: 'btn-error hover:!text-white'
    }).then((confirmed) => {
      if (confirmed) {
        this.recordDeleted.emit(recordId);
      }
    });
  }

  openAddRecordModal(): void {
    this.maintenanceFormModal.open(this.machineId(), this.availableItems())
      .then((record) => {
        if (record) {
          this.recordAdded.emit(record);
        }
      });
  }
}
