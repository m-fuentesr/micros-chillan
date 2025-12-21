import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Driver, DriverViewMode, DriverStatusFilter, LicenseFilter } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';
import { DriverCard } from '../driver-card/driver-card';
import { DriverTable } from '../driver-table/driver-table';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';

interface LicenseAlerts {
  vencidas: number;
  por_vencer: number;
  al_dia: number;
}

@Component({
  selector: 'app-driver-list',
  imports: [DriverCard, DriverTable, LoadingSpinner],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 relative">
        <!-- Badge solo móvil/tablet -->
        <span class="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 inline-flex items-center gap-1.5 px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full bg-success/10 text-success-content border border-success/30 text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap z-10 min-[1301px]:hidden">
          <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success"></span>
          {{ activosCount() }} {{ activosCount() === 1 ? 'activo' : 'activos' }}
        </span>

        <!-- Controles superiores (selector + badge) en desktop -->
        <div class="hidden min-[1501px]:flex items-center gap-3 absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 z-10">
          <div class="flex items-center gap-1 p-1 rounded-xl bg-base-200/40">
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              [class.bg-base-100]="viewMode() === 'cards'"
              [class.text-base-content]="viewMode() === 'cards'"
              [class.text-base-content/60]="viewMode() !== 'cards'"
              [class.shadow-sm]="viewMode() === 'cards'"
              (click)="onViewModeChange('cards')"
              type="button">
              Tarjetas
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              [class.bg-base-100]="viewMode() === 'table'"
              [class.text-base-content]="viewMode() === 'table'"
              [class.text-base-content/60]="viewMode() !== 'table'"
              [class.shadow-sm]="viewMode() === 'table'"
              (click)="onViewModeChange('table')"
              type="button">
              Tabla
            </button>
          </div>
          <span class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-success/10 text-success-content border border-success/30 text-sm font-semibold shadow-sm whitespace-nowrap">
            <span class="w-2 h-2 rounded-full bg-success"></span>
            {{ activosCount() }} {{ activosCount() === 1 ? 'activo' : 'activos' }}
          </span>
        </div>
        
        <!-- Nivel 1: Header Principal - Título y Controles -->
        <div class="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 pr-24 sm:pr-28 lg:pr-32">
          <!-- Fila superior: Título + Selector -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <!-- Título compacto -->
            <div class="flex-1 min-w-0">
              <h2 class="card-title text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-1 sm:mb-2">Inventario de Conductores</h2>
              <p class="text-xs sm:text-sm text-base-content/60 leading-relaxed max-w-xl hidden sm:block mt-1">
                Accede al detalle de cada conductor mediante fichas visuales o cambia a la vista de lista para búsquedas rápidas y administración masiva.
              </p>
            </div>
            
            <!-- Selector dentro del flow (oculto en desktop, visible solo si se rompe la tabla) -->
            <div class="hidden"></div>
          </div>
        </div>
        
        <!-- Nivel 2: Filtros Unificados - Agrupación Visual Inteligente -->
        <div class="border-t border-base-200/50">
          <!-- Contenedor de filtros: Layout adaptativo -->
          <div class="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
            <!-- Filtros de Estado -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-4 rounded-full bg-primary"></div>
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                  Estado
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
                  [class.bg-primary]="statusFilter() === 'all'"
                  [class.text-primary-content]="statusFilter() === 'all'"
                  [class.text-base-content]="statusFilter() === 'all'"
                  [class.bg-base-200/60]="statusFilter() !== 'all'"
                  [class.text-base-content/70]="statusFilter() !== 'all'"
                  [class.hover:bg-base-200]="statusFilter() !== 'all'"
                  (click)="onFilterChange('all')"
                  type="button">
                  Todos
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
                  [class.bg-success]="statusFilter() === 'activo'"
                  [class.text-success-content]="statusFilter() === 'activo'"
                  [class.text-base-content]="statusFilter() === 'activo'"
                  [class.bg-base-200/60]="statusFilter() !== 'activo'"
                  [class.text-base-content/70]="statusFilter() !== 'activo'"
                  [class.hover:bg-base-200]="statusFilter() !== 'activo'"
                  (click)="onFilterChange('activo')"
                  type="button">
                  Activos
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
                  [class.bg-error]="statusFilter() === 'inactivo'"
                  [class.text-error-content]="statusFilter() === 'inactivo'"
                  [class.text-base-content]="statusFilter() === 'inactivo'"
                  [class.bg-base-200/60]="statusFilter() !== 'inactivo'"
                  [class.text-base-content/70]="statusFilter() !== 'inactivo'"
                  [class.hover:bg-base-200]="statusFilter() !== 'inactivo'"
                  (click)="onFilterChange('inactivo')"
                  type="button">
                  Inactivos
                </button>
              </div>
            </div>
            
            <!-- Separador vertical en desktop -->
            <div class="hidden lg:block w-px h-auto bg-base-200/50 self-stretch"></div>
            
            <!-- Filtros de Estado de Licencias -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-4 rounded-full bg-warning"></div>
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                  Estado de Licencias
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-primary]="licenseFilter() === 'all'"
                  [class.text-primary-content]="licenseFilter() === 'all'"
                  [class.text-base-content]="licenseFilter() === 'all'"
                  [class.bg-base-200/60]="licenseFilter() !== 'all'"
                  [class.text-base-content/70]="licenseFilter() !== 'all'"
                  [class.hover:bg-base-200]="licenseFilter() !== 'all'"
                  (click)="onLicenseFilterChange('all')"
                  type="button">
                  Todas
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-error]="licenseFilter() === 'vencidas'"
                  [class.text-error-content]="licenseFilter() === 'vencidas'"
                  [class.text-base-content]="licenseFilter() === 'vencidas'"
                  [class.bg-base-200/60]="licenseFilter() !== 'vencidas'"
                  [class.text-base-content/70]="licenseFilter() !== 'vencidas'"
                  [class.hover:bg-base-200]="licenseFilter() !== 'vencidas'"
                  (click)="onLicenseFilterChange('vencidas')"
                  type="button">
                  <span class="w-1.5 h-1.5 rounded-full bg-error shadow-sm"></span>
                  <span>{{ alerts().vencidas }} vencidas</span>
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-warning]="licenseFilter() === 'por_vencer'"
                  [class.text-warning-content]="licenseFilter() === 'por_vencer'"
                  [class.text-base-content]="licenseFilter() === 'por_vencer'"
                  [class.bg-base-200/60]="licenseFilter() !== 'por_vencer'"
                  [class.text-base-content/70]="licenseFilter() !== 'por_vencer'"
                  [class.hover:bg-base-200]="licenseFilter() !== 'por_vencer'"
                  (click)="onLicenseFilterChange('por_vencer')"
                  type="button">
                  <span class="w-1.5 h-1.5 rounded-full bg-warning shadow-sm"></span>
                  <span>{{ alerts().por_vencer }} por vencer</span>
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-success]="licenseFilter() === 'al_dia'"
                  [class.text-success-content]="licenseFilter() === 'al_dia'"
                  [class.text-base-content]="licenseFilter() === 'al_dia'"
                  [class.bg-base-200/60]="licenseFilter() !== 'al_dia'"
                  [class.text-base-content/70]="licenseFilter() !== 'al_dia'"
                  [class.hover:bg-base-200]="licenseFilter() !== 'al_dia'"
                  (click)="onLicenseFilterChange('al_dia')"
                  type="button">
                  <span class="w-1.5 h-1.5 rounded-full bg-success shadow-sm"></span>
                  <span>{{ alerts().al_dia }} al día</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      <div class="card-body">
        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <app-loading-spinner size="md" text="Cargando conductores..." />
          </div>
        } @else {
          <!-- En ≤1300px solo mostrar tarjetas (sin selector) -->
          <div class="max-[1300px]:block min-[1301px]:hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (driver of filteredDrivers(); track driver.id; let i = $index) {
              <div [class]="getCardAnimationClass(i)">
                <app-driver-card [driver]="driver" />
              </div>
            } @empty {
              <div class="col-span-full py-16 sm:py-20">
                <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                  <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                  </div>
                  <div class="space-y-2">
                    <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay conductores disponibles</h3>
                    <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                      Ajusta los filtros para ver más resultados o registra un nuevo conductor.
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- En ≥1301px mostrar según viewMode (con selector) -->
        <div class="hidden min-[1301px]:block">
          @if (viewMode() === 'cards') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (driver of filteredDrivers(); track driver.id; let i = $index) {
                <div [class]="getCardAnimationClass(i)">
                  <app-driver-card [driver]="driver" />
                </div>
              } @empty {
                <div class="col-span-full py-16 sm:py-20">
                  <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                      </svg>
                    </div>
                    <div class="space-y-2">
                      <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay conductores disponibles</h3>
                      <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                        Ajusta los filtros para ver más resultados o registra un nuevo conductor.
                      </p>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="animate-table-enter">
              <app-driver-table
                [drivers]="filteredDrivers()" />
            </div>
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      /* Microinteracciones estilo Apple */
      button[type="button"] {
        transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      button[type="button"]:active {
        transform: scale(0.96);
      }
      
      /* Chips de filtro con hover suave */
      button[type="button"]:hover:not([class*="bg-primary"]):not([class*="bg-success"]):not([class*="bg-warning"]):not([class*="bg-error"]) {
        background-color: oklch(var(--b2) / 0.8);
      }
      
      /* Selector de vista con transición suave */
      button[type="button"][class*="bg-base-100"] {
        transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverList {
  drivers = input.required<Driver[]>();
  viewMode = input<DriverViewMode>('cards');
  statusFilter = input<DriverStatusFilter>('all');
  licenseFilter = input<LicenseFilter>('all');
  licenseAlerts = input.required<LicenseAlerts>();
  isLoading = input<boolean>(false);
  totalActivos = input<number>(0); // Total de conductores activos sin filtros
  
  viewModeChange = output<DriverViewMode>();
  filterChange = output<DriverStatusFilter>();
  licenseFilterChange = output<LicenseFilter>();

  filteredDrivers = computed(() => {
    // Los filtros ahora se aplican en el backend, así que solo retornamos los conductores recibidos
    // El backend ya aplica los filtros de estado y licencia_estado
    return this.drivers();
  });

  activosCount = computed(() => {
    // Usar el total de activos sin filtros (desde KPIs)
    return this.totalActivos();
  });

  alerts = computed(() => this.licenseAlerts());

  getCardAnimationClass(index: number): string {
    const delay = index % 4;
    switch (delay) {
      case 0:
        return 'animate-card-enter';
      case 1:
        return 'animate-card-enter-delay-1';
      case 2:
        return 'animate-card-enter-delay-2';
      case 3:
        return 'animate-card-enter-delay-3';
      default:
        return 'animate-card-enter';
    }
  }

  onViewModeChange(mode: DriverViewMode): void {
    this.viewModeChange.emit(mode);
  }

  onFilterChange(filter: DriverStatusFilter): void {
    this.filterChange.emit(filter);
  }

  onLicenseFilterChange(filter: LicenseFilter): void {
    this.licenseFilterChange.emit(filter);
  }
}
