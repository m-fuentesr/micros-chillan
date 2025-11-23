import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Machine, ViewMode, StatusFilter, MachineDocumentAlerts } from '../../models/machine.models';
import { MachineCard } from '../machine-card/machine-card';
import { MachineTable } from '../machine-table/machine-table';
import { DocumentStatus } from '../../models/machine.models';

@Component({
  selector: 'app-machine-list',
  imports: [MachineCard, MachineTable],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header p-6 pb-4 relative">
        <!-- Contenedor principal del header -->
        <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
          <!-- Título y descripción con padding adecuado -->
          <div class="flex-1 min-w-0 pr-4">
            <h2 class="card-title text-2xl mb-2">Máquinas Registradas</h2>
            <p class="text-sm text-base-content/70 mb-4">
              Escoge cómo visualizar según la tarea: tarjetas para escanear riesgos, tabla para listados extensos.
            </p>
            
            <!-- Filtro rápido integrado -->
            <div class="flex flex-wrap items-center gap-3 mb-3">
              <span class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Filtro rápido:</span>
              <div class="flex flex-wrap gap-2">
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'all'"
                  (click)="onFilterChange('all')"
                  type="button">
                  Todas
                </button>
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'Operativa'"
                  (click)="onFilterChange('Operativa')"
                  type="button">
                  Operativas
                </button>
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'En Taller'"
                  (click)="onFilterChange('En Taller')"
                  type="button">
                  En taller
                </button>
                <button
                  class="btn btn-sm"
                  [class.btn-active]="statusFilter() === 'Inactiva'"
                  (click)="onFilterChange('Inactiva')"
                  type="button">
                  Inactivas
                </button>
              </div>
            </div>
            
            <!-- Alertas documentales -->
            <div class="flex flex-wrap items-center gap-4">
              <span class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Alertas documentales:</span>
              <div class="flex flex-wrap gap-3">
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2 h-2 rounded-full bg-error"></span>
                  <span>Vencidos: <strong>{{ alerts().vencidos }}</strong></span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2 h-2 rounded-full bg-warning"></span>
                  <span>Por vencer: <strong>{{ alerts().por_vencer }}</strong></span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-2 h-2 rounded-full bg-success"></span>
                  <span>Al día: <strong>{{ alerts().al_dia }}</strong></span>
                </div>
              </div>
            </div>
            
            <p class="text-xs text-base-content/60 mt-3">
              Los filtros afectan ambas vistas y los conteos de documentos se recalculan automáticamente.
            </p>
          </div>

          <!-- Contenedor derecho: Badge y Selector -->
          <div class="flex flex-col items-end gap-3 xl:flex-row xl:items-center">
            <!-- Badge de conteo -->
            <span class="badge badge-lg badge-outline font-semibold">
              {{ filteredMachines().length }} {{ filteredMachines().length === 1 ? 'máquina' : 'máquinas' }}
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
            @for (machine of filteredMachines(); track machine.id; let i = $index) {
              @if (getDocStatus(machine.id)) {
                <div [class]="getCardAnimationClass(i)">
                  <app-machine-card
                    [machine]="machine"
                    [docStatus]="getDocStatus(machine.id)!" />
                </div>
              }
            } @empty {
              <div class="col-span-full text-center py-12">
                <div class="flex flex-col items-center gap-2">
                  <div class="text-4xl opacity-50">🚛</div>
                  <h3 class="font-semibold">No hay máquinas disponibles</h3>
                  <p class="text-sm text-base-content/70">
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
              @for (machine of filteredMachines(); track machine.id; let i = $index) {
                @if (getDocStatus(machine.id)) {
                  <div [class]="getCardAnimationClass(i)">
                    <app-machine-card
                      [machine]="machine"
                      [docStatus]="getDocStatus(machine.id)!" />
                  </div>
                }
              } @empty {
                <div class="col-span-full text-center py-12">
                  <div class="flex flex-col items-center gap-2">
                    <div class="text-4xl opacity-50">🚛</div>
                    <h3 class="font-semibold">No hay máquinas disponibles</h3>
                    <p class="text-sm text-base-content/70">
                      Relaja los filtros para ver más resultados.
                    </p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <app-machine-table
              [machines]="filteredMachines()"
              [docStatusMap]="docStatusMap()" />
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineList {
  machines = input.required<Machine[]>();
  viewMode = input<ViewMode>('cards');
  statusFilter = input<StatusFilter>('all');
  docStatusMap = input.required<Map<number, {
    revision_tecnica?: DocumentStatus;
    permiso_circulacion?: DocumentStatus;
    seguro_obligatorio?: DocumentStatus;
  }>>();
  alerts = input.required<MachineDocumentAlerts>();
  viewModeChange = output<ViewMode>();
  filterChange = output<StatusFilter>();

  filteredMachines = computed(() => {
    const machines = this.machines();
    const filter = this.statusFilter();
    if (filter === 'all') {
      return machines;
    }
    return machines.filter(m => m.estado_operativo === filter);
  });

  getDocStatus(machineId: number) {
    return this.docStatusMap().get(machineId);
  }

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

  onViewModeChange(mode: ViewMode): void {
    this.viewModeChange.emit(mode);
  }

  onFilterChange(filter: StatusFilter): void {
    this.filterChange.emit(filter);
  }
}

