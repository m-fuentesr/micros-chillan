import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Driver, DriverViewMode, DriverStatusFilter } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';
import { DriverCard } from '../driver-card/driver-card';
import { DriverTable } from '../driver-table/driver-table';

interface LicenseAlerts {
  vencidas: number;
  por_vencer: number;
  al_dia: number;
}

@Component({
  selector: 'app-driver-list',
  imports: [DriverCard, DriverTable],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header p-6 pb-4 relative">
        <!-- Contenedor principal del header -->
        <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
          <!-- Título y descripción con padding adecuado -->
          <div class="flex-1 min-w-0 pr-4">
            <h2 class="card-title text-2xl mb-2">Choferes Registrados</h2>
            <p class="text-sm text-base-content/70 mb-4">
              Escoge cómo visualizar según la tarea: tarjetas para escanear riesgos, tabla para listados extensos.
            </p>
            
            <!-- Filtro rápido integrado -->
            <div class="flex flex-wrap items-center gap-3 mb-3">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/70">Filtro rápido:</span>
              <div class="flex flex-wrap gap-2">
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'all'"
                  (click)="onFilterChange('all')"
                  type="button">
                  Todos
                </button>
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'activo'"
                  (click)="onFilterChange('activo')"
                  type="button">
                  Activos
                </button>
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'inactivo'"
                  (click)="onFilterChange('inactivo')"
                  type="button">
                  Inactivos
                </button>
              </div>
            </div>
            
            <!-- Alertas de licencias -->
            <div class="flex flex-wrap items-center gap-4">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/70">Alertas de licencias:</span>
              <div class="flex flex-wrap gap-3">
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2 h-2 rounded-full bg-error"></span>
                  <span>Vencidas: <strong>{{ licenseAlerts().vencidas }}</strong></span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2 h-2 rounded-full bg-warning"></span>
                  <span>Por vencer: <strong>{{ licenseAlerts().por_vencer }}</strong></span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2 h-2 rounded-full bg-success"></span>
                  <span>Al día: <strong>{{ licenseAlerts().al_dia }}</strong></span>
                </div>
              </div>
            </div>
            
            <p class="text-xs text-base-content/60 mt-3">
              Los filtros afectan ambas vistas y los conteos de licencias se recalculan automáticamente.
            </p>
          </div>

          <!-- Contenedor derecho: Badge y Selector -->
          <div class="flex flex-col items-end gap-3 xl:flex-row xl:items-center">
            <!-- Badge de conteo -->
            <span class="badge badge-lg badge-outline font-bold">
              {{ filteredDrivers().length }} {{ filteredDrivers().length === 1 ? 'chofer' : 'choferes' }}
            </span>
            
            <!-- Selector de vista - Solo visible en desktop -->
            <div class="hidden xl:flex">
              <div class="join">
                <button
                  class="btn join-item btn-sm"
                  [class.btn-active]="viewMode() === 'cards'"
                  (click)="onViewModeChange('cards')"
                  type="button">
                  Tarjetas
                </button>
                <button
                  class="btn join-item btn-sm"
                  [class.btn-active]="viewMode() === 'table'"
                  (click)="onViewModeChange('table')"
                  type="button">
                  Tabla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <!-- En móvil/tablet siempre mostrar tarjetas -->
        <div class="xl:hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (driver of filteredDrivers(); track driver.id; let i = $index) {
              <div [class]="getCardAnimationClass(i)">
                <app-driver-card [driver]="driver" />
              </div>
            } @empty {
              <div class="col-span-full text-left py-12 pl-4 border-l-4 border-l-primary">
                <div class="flex flex-col items-start gap-2">
                  <div class="text-4xl opacity-50">👤</div>
                  <h3 class="font-bold">No hay choferes disponibles</h3>
                  <p class="text-sm text-base-content/70 italic">
                    Relaja los filtros para ver más resultados.
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- En desktop mostrar según viewMode -->
        <div class="hidden xl:block">
          @if (viewMode() === 'cards') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (driver of filteredDrivers(); track driver.id; let i = $index) {
                <div [class]="getCardAnimationClass(i)">
                  <app-driver-card [driver]="driver" />
                </div>
              } @empty {
                <div class="col-span-full text-center py-12">
                  <div class="flex flex-col items-center gap-2">
                    <div class="text-4xl opacity-50">👤</div>
                    <h3 class="font-semibold">No hay choferes disponibles</h3>
                    <p class="text-sm text-base-content/70">
                      Relaja los filtros para ver más resultados.
                    </p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <app-driver-table
              [drivers]="filteredDrivers()" />
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverList {
  drivers = input.required<Driver[]>();
  viewMode = input<DriverViewMode>('cards');
  statusFilter = input<DriverStatusFilter>('all');
  licenseAlerts = input.required<LicenseAlerts>();
  
  viewModeChange = output<DriverViewMode>();
  filterChange = output<DriverStatusFilter>();

  filteredDrivers = computed(() => {
    const drivers = this.drivers();
    const filter = this.statusFilter();
    
    if (filter === 'all') {
      return drivers;
    }
    
    return drivers.filter(d => d.estado === filter);
  });

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
}

