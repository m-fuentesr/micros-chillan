import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, output, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceRecord, MaintenanceFilters } from '../../models/machine-detail.models';
import { SearchFilters, FilterField } from '../../components/search-filters/search-filters';
import { ConfirmModalService } from '../../services/confirm-modal.service';
import { MaintenanceFormModalService } from '../../services/maintenance-form-modal.service';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';
import { getDatePartsInChile } from '../../utils/date.utils';

@Component({
  selector: 'app-machine-maintenance',
  imports: [CommonModule, FormsModule, SearchFilters, KpiCard, UiIconComponent, LoadingSpinner],
  template: `

    <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
      <!-- Header -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
          <div class="flex-1 min-w-0">
            <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
              Mantenimiento y Gastos
            </h2>
            <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
              Gestiona repuestos, mantenimientos y gastos asociados a esta máquina.
            </p>
          </div>
          
          <!-- Derecha: KPI, Badge y Botón -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 lg:gap-6 shrink-0 w-full sm:w-auto">
            <!-- KPI y Badge de conteo en fila -->
            <div class="flex items-center gap-4 sm:gap-5 flex-wrap">
              <!-- KPI de Gastos en Repuestos -->
              <app-kpi-card
                title="Gastos en Repuestos"
                [subtitle]="'Acumulado del mes actual'"
                [value]="formatCurrency(gastoMesActual())"
                type="danger"
                size="compact"
                badgeText="Inversión activos"
                [animationDelay]="0">
                <span icon><ui-icon name="Wallet" size="md" /></span>
              </app-kpi-card>
              
              <span class="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                {{ totalRecordsGlobal() }} {{ totalRecordsGlobal() === 1 ? 'registro' : 'registros' }}
              </span>
            </div>
            
            <!-- Botón Registrar Nueva Compra -->
            <button
              class="btn btn-primary gap-2 font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap w-full sm:w-auto"
              (click)="openAddRecordModal()">
              <ui-icon name="CirclePlus" size="sm" />
              Nueva compra
            </button>
          </div>
        </div>
      </div>

      <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6 pb-8 sm:pb-12 lg:pb-16">
        <!-- Filtros: mobile en panel plegable, desktop siempre visible -->
        <div class="md:hidden mb-4">
          <div class="sticky top-2 z-20">
            <button
              type="button"
              class="btn btn-sm w-full justify-between rounded-lg border border-base-200 bg-base-100 shadow-sm min-h-11"
              (click)="toggleFiltersMobile()"
              [attr.aria-expanded]="showFiltersMobile()">
              <div class="flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-primary"></span>
                <span class="text-xs font-semibold uppercase tracking-wider">Filtros</span>
              </div>
              <ui-icon name="ChevronDown" size="sm" [class]="'transition-transform duration-200' + (showFiltersMobile() ? ' rotate-180' : '')" />
            </button>
          </div>
          @if (showFiltersMobile()) {
            <div class="mt-3 bg-base-50/70 rounded-3xl border border-base-200/70 shadow-sm" (click)="$event.stopPropagation()">
              <app-search-filters
                [fields]="filterFields()"
                [filters]="filters()"
                [columns]="1"
                (filterChange)="onFiltersChange($event)" />
              <!-- Botón para cerrar el panel manualmente -->
              <div class="p-4 pt-0 border-t border-base-200/50">
                <button
                  type="button"
                  class="btn btn-sm btn-primary w-full"
                  (click)="showFiltersMobile.set(false)">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          }
        </div>

        <div class="hidden md:block">
          <app-search-filters
            [fields]="filterFields()"
            [filters]="filters()"
            [columns]="4"
            (filterChange)="onFiltersChange($event)" />
        </div>

        <!-- Vista Móvil: Cards -->
        <div class="block xl:hidden space-y-4">
          @if (isLoading()) {
            <div class="flex justify-center items-center py-12">
              <app-loading-spinner size="md" text="Cargando registros..." />
            </div>
          } @else {
            @for (record of records(); track record.id; let i = $index) {
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
                      <ui-icon name="Calendar" size="sm" />
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
                        <ui-icon name="Check" size="xs" />
                        Preventivo
                      </div>
                    } @else if (record.categoria === 'correctivo') {
                      <div class="badge badge-warning gap-1.5">
                        <ui-icon name="TriangleAlert" size="xs" />
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
                    <ui-icon name="Settings" size="lg" class="text-base-content/40" />
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
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="hidden xl:block overflow-x-auto rounded-xl border border-base-200">
          @if (isLoading()) {
            <div class="flex justify-center items-center py-12">
              <app-loading-spinner size="md" text="Cargando registros..." />
            </div>
          } @else {
            <table class="table w-full" style="table-layout: fixed; min-width: 1200px;">
              <colgroup>
                <col style="width: 200px;">
                <col style="width: auto;">
                <col style="width: 140px;">
                <col style="width: 180px;">
                <col style="width: 140px;">
                <col style="width: 140px;">
              </colgroup>
              <thead class="bg-base-50 border-b border-base-200">
                <tr>
                  <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60">Fecha</th>
                  <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60">Ítem/Repuesto</th>
                  <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums">Costo</th>
                  <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60">Nº Factura/Boleta</th>
                  <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60">Categoría</th>
                  <th class="py-4 pr-6 text-center text-xs font-bold uppercase tracking-widest text-base-content/60">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (record of records(); track record.id; let i = $index) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none"
                  [class.animate-table-row-enter]="!isNewlyAdded(record.id)"
                  [class.animate-new-record]="isNewlyAdded(record.id)"
                  [style.animation-delay.ms]="isNewlyAdded(record.id) ? 0 : i * 30"
                  [style.animation-fill-mode]="'both'">
                  
                  <td class="pl-6 py-4" style="width: 200px;">
                    <div class="flex items-center gap-2">
                      <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                        <ui-icon name="Calendar" size="sm" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-semibold text-base-content whitespace-nowrap">{{ formatDate(record.fecha) }}</div>
                        <div class="text-xs text-base-content/50 font-mono whitespace-nowrap">{{ formatDateFull(record.fecha) }}</div>
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
                      <ui-icon name="Trash2" size="sm" class="transition-transform group-hover:scale-110 shrink-0" />
                      <span class="whitespace-nowrap">Eliminar</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-16 sm:py-20">
                    <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                      <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                        <ui-icon name="Settings" size="lg" class="text-base-content/40" />
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
          }
        </div>

        <!-- Paginación -->
        @if (totalPages() > 0 && !isLoading()) {
          <div class="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
            <span>Mostrando {{ startRecord() }}-{{ endRecord() }} de {{ totalRecords() }} registros</span>
            <div class="join">
              <button 
                (click)="goToPreviousPage()" 
                [disabled]="currentPage() === 1 || isLoading()" 
                class="join-item btn btn-sm px-3" 
                [class.btn-disabled]="currentPage() === 1 || isLoading()">
                «
              </button>
              @for (page of pages(); track page) {
                <button 
                  (click)="goToPage(page)" 
                  [disabled]="isLoading()" 
                  [class.btn-active]="page === currentPage()" 
                  class="join-item btn btn-sm px-4">{{ page }}</button>
              }
              <button 
                (click)="goToNextPage()" 
                [disabled]="currentPage() === totalPages() || isLoading()" 
                class="join-item btn btn-sm px-3" 
                [class.btn-disabled]="currentPage() === totalPages() || isLoading()">
                »
              </button>
            </div>
          </div>
        }
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
  totalRecords = input<number>(0);
  totalRecordsGlobal = input<number>(0);
  gastoMesActual = input<number>(0);
  currentPage = input<number>(1);
  totalPages = input<number>(0);
  isLoading = input<boolean>(false);

  recordAdded = output<MaintenanceRecord>();
  recordDeleted = output<number>();
  filterChange = output<MaintenanceFilters>();
  pageChange = output<number>();

  showFiltersMobile = signal(false);

  private confirmModal = inject(ConfirmModalService);
  private maintenanceFormModal = inject(MaintenanceFormModalService);

  // Rastrear IDs de registros recién agregados para animación
  private newlyAddedIds = signal<Set<number>>(new Set());
  private previousRecordIds = signal<Set<number>>(new Set());


  // Funciones de paginación
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Mostrar máximo 5 páginas
    const maxPages = 5;
    let start = Math.max(1, current - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  startRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = 12;
    return (page - 1) * pageSize + 1;
  });

  endRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = 12;
    const total = this.totalRecords();
    return Math.min(page * pageSize, total);
  });

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) {
      return;
    }
    this.pageChange.emit(page);
  }

  // Verificar si un registro es nuevo (siempre retorna false para evitar problemas)
  isNewlyAdded = (recordId: number): boolean => {
    return false; // Deshabilitado temporalmente para evitar problemas con el cambio de pestañas
  };

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.item || f.categoria || f.desde || f.hasta);
  });

  filterFields = computed<FilterField[]>(() => {
    const items = this.availableItems();
    const itemOptions = [
      { value: 'all', label: 'Todos los repuestos' },
      ...items.map(item => ({ value: item, label: item }))
    ];

    return [
      {
        key: 'item',
        label: 'Ítem/Repuesto',
        type: 'select',
        options: itemOptions
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
    ];
  });

  onFiltersChange(newFilters: Record<string, any>): void {
    const updatedFilters: MaintenanceFilters = {};

    // Procesar cada filtro
    if (newFilters['item'] && typeof newFilters['item'] === 'string' && newFilters['item'].trim() && newFilters['item'] !== 'all') {
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

  toggleFiltersMobile(): void {
    this.showFiltersMobile.update(open => !open);
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

  private parseDateInChile(date: string): Date | null {
    if (!date) return null;

    const { year, month, day } = getDatePartsInChile(date);

    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  formatDate(date: string): string {
    const parsedDate = this.parseDateInChile(date);
    if (!parsedDate) return '';

    return parsedDate.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateFull(date: string): string {
    const parsedDate = this.parseDateInChile(date);
    if (!parsedDate) return '';

    return parsedDate.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
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
