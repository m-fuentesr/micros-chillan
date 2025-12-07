import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Machine, ViewMode, StatusFilter, DocumentFilter, MachineDocumentAlerts } from '../../models/machine.models';
import { MachineCard } from '../machine-card/machine-card';
import { MachineTable } from '../machine-table/machine-table';
import { DocumentStatus } from '../../models/machine.models';
import { BusIcon } from '../../components/bus-icon/bus-icon';

@Component({
  selector: 'app-machine-list',
  imports: [MachineCard, MachineTable, BusIcon],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 relative">
        <!-- Badge solo móvil/tablet -->
        <span class="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 inline-flex items-center gap-1.5 px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full bg-success/10 text-success-content border border-success/30 text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap z-10 min-[1184px]:hidden">
          <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success"></span>
          {{ operativasCount() }} {{ operativasCount() === 1 ? 'operativa' : 'operativas' }}
        </span>

        <!-- Controles superiores (selector + badge) en desktop -->
        <div class="hidden min-[1184px]:flex items-center gap-3 absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 z-10">
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
            {{ operativasCount() }} {{ operativasCount() === 1 ? 'operativa' : 'operativas' }}
          </span>
        </div>
        
        <!-- Nivel 1: Header Principal - Título y Controles -->
        <div class="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 pr-24 sm:pr-28 lg:pr-32">
          <!-- Fila superior: Título + Selector -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <!-- Título compacto -->
            <div class="flex-1 min-w-0">
              <h2 class="card-title text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-1 sm:mb-2">Inventario de Flota</h2>
              <p class="text-xs sm:text-sm text-base-content/60 leading-relaxed max-w-xl hidden sm:block mt-1">
                Accede al detalle de cada unidad mediante fichas visuales o cambia a la vista de lista para búsquedas rápidas y administración masiva.
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
            <!-- Filtros de Estado Operativo -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-4 rounded-full bg-primary"></div>
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                  Estado Operativo
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
                  Todas
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
                  [class.bg-success]="statusFilter() === 'Operativa'"
                  [class.text-success-content]="statusFilter() === 'Operativa'"
                  [class.text-base-content]="statusFilter() === 'Operativa'"
                  [class.bg-base-200/60]="statusFilter() !== 'Operativa'"
                  [class.text-base-content/70]="statusFilter() !== 'Operativa'"
                  [class.hover:bg-base-200]="statusFilter() !== 'Operativa'"
                  (click)="onFilterChange('Operativa')"
                  type="button">
                  Operativas
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
                  [class.bg-warning]="statusFilter() === 'En Taller'"
                  [class.text-warning-content]="statusFilter() === 'En Taller'"
                  [class.text-base-content]="statusFilter() === 'En Taller'"
                  [class.bg-base-200/60]="statusFilter() !== 'En Taller'"
                  [class.text-base-content/70]="statusFilter() !== 'En Taller'"
                  [class.hover:bg-base-200]="statusFilter() !== 'En Taller'"
                  (click)="onFilterChange('En Taller')"
                  type="button">
                  En taller
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
                  [class.bg-error]="statusFilter() === 'Inactiva'"
                  [class.text-error-content]="statusFilter() === 'Inactiva'"
                  [class.text-base-content]="statusFilter() === 'Inactiva'"
                  [class.bg-base-200/60]="statusFilter() !== 'Inactiva'"
                  [class.text-base-content/70]="statusFilter() !== 'Inactiva'"
                  [class.hover:bg-base-200]="statusFilter() !== 'Inactiva'"
                  (click)="onFilterChange('Inactiva')"
                  type="button">
                  Inactivas
                </button>
              </div>
            </div>
            
            <!-- Separador vertical en desktop -->
            <div class="hidden lg:block w-px h-auto bg-base-200/50 self-stretch"></div>
            
            <!-- Filtros de Estado Documental -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 sm:mb-3">
                <div class="w-1 h-4 rounded-full bg-warning"></div>
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                  Estado Documental
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-primary]="documentFilter() === 'all'"
                  [class.text-primary-content]="documentFilter() === 'all'"
                  [class.text-base-content]="documentFilter() === 'all'"
                  [class.bg-base-200/60]="documentFilter() !== 'all'"
                  [class.text-base-content/70]="documentFilter() !== 'all'"
                  [class.hover:bg-base-200]="documentFilter() !== 'all'"
                  (click)="onDocumentFilterChange('all')"
                  type="button">
                  Todas
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-error]="documentFilter() === 'vencidos'"
                  [class.text-error-content]="documentFilter() === 'vencidos'"
                  [class.text-base-content]="documentFilter() === 'vencidos'"
                  [class.bg-base-200/60]="documentFilter() !== 'vencidos'"
                  [class.text-base-content/70]="documentFilter() !== 'vencidos'"
                  [class.hover:bg-base-200]="documentFilter() !== 'vencidos'"
                  (click)="onDocumentFilterChange('vencidos')"
                  type="button">
                  <span class="w-1.5 h-1.5 rounded-full bg-error shadow-sm"></span>
                  <span>{{ alerts().vencidos }} vencidos</span>
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-warning]="documentFilter() === 'por_vencer'"
                  [class.text-warning-content]="documentFilter() === 'por_vencer'"
                  [class.text-base-content]="documentFilter() === 'por_vencer'"
                  [class.bg-base-200/60]="documentFilter() !== 'por_vencer'"
                  [class.text-base-content/70]="documentFilter() !== 'por_vencer'"
                  [class.hover:bg-base-200]="documentFilter() !== 'por_vencer'"
                  (click)="onDocumentFilterChange('por_vencer')"
                  type="button">
                  <span class="w-1.5 h-1.5 rounded-full bg-warning shadow-sm"></span>
                  <span>{{ alerts().por_vencer }} por vencer</span>
                </button>
                <button
                  class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0 flex items-center gap-1.5"
                  [class.bg-success]="documentFilter() === 'al_dia'"
                  [class.text-success-content]="documentFilter() === 'al_dia'"
                  [class.text-base-content]="documentFilter() === 'al_dia'"
                  [class.bg-base-200/60]="documentFilter() !== 'al_dia'"
                  [class.text-base-content/70]="documentFilter() !== 'al_dia'"
                  [class.hover:bg-base-200]="documentFilter() !== 'al_dia'"
                  (click)="onDocumentFilterChange('al_dia')"
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
        <!-- En ≤1183px solo mostrar tarjetas (sin selector) -->
        <div class="min-[1184px]:hidden">
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
              <div class="col-span-full py-16 sm:py-20">
                <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                  <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                    <app-bus-icon class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40" />
                  </div>
                  <div class="space-y-2">
                    <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay máquinas disponibles</h3>
                    <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                      Ajusta los filtros para ver más resultados o registra una nueva máquina.
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- En ≥1184px mostrar según viewMode (con selector) -->
        <div class="hidden min-[1184px]:block">
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
                <div class="col-span-full py-16 sm:py-20">
                  <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                      <app-bus-icon class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40" />
                    </div>
                    <div class="space-y-2">
                      <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay máquinas disponibles</h3>
                      <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                        Ajusta los filtros para ver más resultados o registra una nueva máquina.
                      </p>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="animate-table-enter">
              <app-machine-table
                [machines]="filteredMachines()"
                [docStatusMap]="docStatusMap()" />
            </div>
          }
        </div>
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
export class MachineList {
  machines = input.required<Machine[]>();
  viewMode = input<ViewMode>('cards');
  statusFilter = input<StatusFilter>('all');
  documentFilter = input<DocumentFilter>('all');
  docStatusMap = input.required<Map<number, {
    revision_tecnica?: DocumentStatus;
    permiso_circulacion?: DocumentStatus;
    seguro_obligatorio?: DocumentStatus;
  }>>();
  alerts = input.required<MachineDocumentAlerts>();
  viewModeChange = output<ViewMode>();
  filterChange = output<StatusFilter>();
  documentFilterChange = output<DocumentFilter>();

  filteredMachines = computed(() => {
    const machines = this.machines();
    const statusFilter = this.statusFilter();
    const documentFilter = this.documentFilter();
    const docStatusMap = this.docStatusMap();

    let filtered = machines;

    // Filtrar por estado operativo
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.estado_operativo === statusFilter);
    }

    // Filtrar por estado documental
    if (documentFilter !== 'all') {
      filtered = filtered.filter(machine => {
        const docStatus = docStatusMap.get(machine.id);
        if (!docStatus) return false;

        const docs = [
          docStatus.revision_tecnica,
          docStatus.permiso_circulacion,
          docStatus.seguro_obligatorio
        ].filter(Boolean) as DocumentStatus[];

        if (docs.length === 0) return false;

        switch (documentFilter) {
          case 'vencidos':
            // Al menos un documento vencido
            return docs.some(doc => doc.estado === 'error');
          case 'por_vencer':
            // Al menos un documento por vencer (y ninguno vencido)
            return docs.some(doc => doc.estado === 'warning') && 
                   !docs.some(doc => doc.estado === 'error');
          case 'al_dia':
            // Todos los documentos al día
            return docs.every(doc => doc.estado === 'ok');
          default:
            return true;
        }
      });
    }

    return filtered;
  });

  operativasCount = computed(() => {
    return this.machines().filter(m => m.estado_operativo === 'Operativa').length;
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

  onDocumentFilterChange(filter: DocumentFilter): void {
    this.documentFilterChange.emit(filter);
  }
}

