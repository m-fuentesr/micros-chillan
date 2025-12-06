import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MachineService } from '../../shared/services/machine.service';
import { MachineKPIs } from '../../shared/machines/machine-kpis/machine-kpis';
import { MachineFilters } from '../../shared/machines/machine-filters/machine-filters';
import { MachineList } from '../../shared/machines/machine-list/machine-list';
import { Machine, StatusFilter, DocumentFilter, ViewMode, MachineKPIs as MachineKPIsType, MachineDocumentAlerts, DocumentStatus } from '../../shared/models/machine.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, map } from 'rxjs';
import { calculateMachineDocumentStatus } from '../../shared/utils/document.utils';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingStateService } from '../../shared/services/loading-state.service';

@Component({
  selector: 'app-maquinas',
  imports: [MachineKPIs, MachineList, RouterLink, LoadingSkeleton],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="page-entry-header border-b-2 border-b-base-300 pb-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <h1 class="text-xl md:text-2xl lg:text-4xl font-bold text-base-content tracking-tight">Flota de Vehículos</h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-md hidden sm:block">
              Administración completa de la flota: estado operativo, documentación y asignación de conductores.
            </p>
          </div>
          <a routerLink="/maquinas/nueva" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-primary-content px-4 py-2.5 rounded-lg shadow-sm border border-primary/20 transition-all active:scale-95 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span class="sm:hidden">Registrar</span>
            <span class="hidden sm:inline">Registrar Máquina</span>
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="pl-3 md:pl-4">
        @if (kpisLoadingState.isLoading()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            @for (i of [1,2,3,4]; track i) {
              <app-loading-skeleton 
                type="kpi" 
                [isExiting]="kpisLoadingState.isSkeletonExiting()" />
            }
          </div>
        } @else {
          <app-machine-kpis [kpis]="kpis()" />
        }
      </div>

      <!-- Layout Principal: Lista de Máquinas (Full Width) -->
      <div class="page-entry-content">
        @if (machinesLoadingState.isLoading()) {
          <app-loading-skeleton 
            type="machine-list" 
            [count]="6"
            [isExiting]="machinesLoadingState.isSkeletonExiting()" />
        } @else {
          <app-machine-list
          [machines]="machines()"
          [viewMode]="viewMode()"
          [statusFilter]="statusFilter()"
          [documentFilter]="documentFilter()"
          [docStatusMap]="docStatusMap()"
          [alerts]="documentAlerts()"
          (viewModeChange)="onViewModeChange($event)"
          (filterChange)="onFilterChange($event)"
          (documentFilterChange)="onDocumentFilterChange($event)" />
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Maquinas implements OnInit {
  private machineService = inject(MachineService);
  private loadingStateService = inject(LoadingStateService);

  viewMode = signal<ViewMode>('cards');
  statusFilter = signal<StatusFilter>('all');
  documentFilter = signal<DocumentFilter>('all');
  
  // Estados de carga con umbral de 200ms
  kpisLoadingState = this.loadingStateService.createLoadingState();
  machinesLoadingState = this.loadingStateService.createLoadingState();

  constructor() {
    // Iniciar estados de carga inmediatamente, antes del primer render
    this.kpisLoadingState.setLoading(true);
    this.machinesLoadingState.setLoading(true);
  }

  // Cargar máquinas
  machinesData = toSignal(
    this.machineService.getMachines().pipe(
      catchError(() => of<Machine[]>(this.getMockMachines()))
    ),
    { initialValue: [] }
  );

  machines = computed(() => this.machinesData() ?? []);

  // Cargar KPIs
  kpisData = toSignal(
    this.machineService.getKPIs().pipe(
      catchError(() => of<MachineKPIsType>(this.calculateMockKPIs()))
    ),
    { initialValue: null }
  );

  kpis = computed(() => {
    const kpisData = this.kpisData();
    // Si aún no hay datos reales y estamos cargando, retornar KPIs vacíos para evitar mostrar 0s
    if (kpisData === null && this.kpisLoadingState.isLoading()) {
      return { operativas: 0, en_taller: 0, inactivas: 0, documentos_por_vencer: 0 };
    }
    return kpisData ?? this.calculateMockKPIs();
  });

  // Effects para detectar cuando los datos están listos
  private machinesEffect = effect(() => {
    const machines = this.machines();
    if (machines.length > 0 && this.machinesLoadingState.isLoading()) {
      this.machinesLoadingState.setDataLoaded();
    }
  });

  private kpisEffect = effect(() => {
    const kpis = this.kpisData();
    if (kpis !== null && this.kpisLoadingState.isLoading()) {
      this.kpisLoadingState.setDataLoaded();
    }
  });

  // Calcular alertas de documentación desde todas las máquinas (no filtradas)
  documentAlerts = computed(() => {
    const machines = this.machines();
    const docStatusMap = this.docStatusMap();
    let vencidos = 0;
    let por_vencer = 0;
    let al_dia = 0;

    machines.forEach(machine => {
      const docStatus = docStatusMap.get(machine.id);
      if (!docStatus) return;

      const docs = [
        docStatus.revision_tecnica,
        docStatus.permiso_circulacion,
        docStatus.seguro_obligatorio
      ].filter(Boolean) as DocumentStatus[];

      if (docs.length === 0) return;

      // Una máquina cuenta como vencida si tiene al menos un documento vencido
      if (docs.some(doc => doc.estado === 'error')) {
        vencidos++;
      } else if (docs.some(doc => doc.estado === 'warning')) {
        por_vencer++;
      } else if (docs.every(doc => doc.estado === 'ok')) {
        al_dia++;
      }
    });

    return { vencidos, por_vencer, al_dia };
  });

  // Mapa de estados de documentos
  docStatusMap = computed(() => {
    const map = new Map<number, {
      revision_tecnica?: DocumentStatus;
      permiso_circulacion?: DocumentStatus;
      seguro_obligatorio?: DocumentStatus;
    }>();
    this.machines().forEach(machine => {
      map.set(machine.id, calculateMachineDocumentStatus(machine));
    });
    return map;
  });


  ngOnInit(): void {
    // Los estados de carga ya se iniciaron en la inicialización
    // Los datos se cargan automáticamente con toSignal
    // Los effects detectarán cuando estén listos y llamarán a setDataLoaded()
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onFilterChange(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  onDocumentFilterChange(filter: DocumentFilter): void {
    this.documentFilter.set(filter);
  }

  private calculateMockKPIs(): MachineKPIsType {
    const machines = this.machines();
    return {
      operativas: machines.filter(m => m.estado_operativo === 'Operativa').length,
      en_taller: machines.filter(m => m.estado_operativo === 'En Taller').length,
      inactivas: machines.filter(m => m.estado_operativo === 'Inactiva').length,
      documentos_por_vencer: machines.filter(m => {
        const status = calculateMachineDocumentStatus(m);
        return status.revision_tecnica?.estado !== 'ok' ||
               status.permiso_circulacion?.estado !== 'ok' ||
               status.seguro_obligatorio?.estado !== 'ok';
      }).length
    };
  }

  private getMockMachines(): Machine[] {
    return [
      {
        id: 1,
        numero: '05',
        marca: 'Mercedes-Benz',
        patente: 'ABCD-12',
        estado_operativo: 'Operativa',
        chofer_actual: {
          id: 1,
          nombre_completo: 'Juan Pérez'
        },
        documentos: {
          revision_tecnica: '2023-11-20',
          permiso_circulacion: '2024-03-31',
          seguro_obligatorio: '2024-01-15'
        }
      },
      {
        id: 2,
        numero: '02',
        marca: 'Caio',
        patente: 'EFGH-34',
        estado_operativo: 'Operativa',
        chofer_actual: {
          id: 2,
          nombre_completo: 'María Gómez'
        },
        documentos: {
          revision_tecnica: '2024-12-31',
          permiso_circulacion: '2024-12-31',
          seguro_obligatorio: '2024-12-31'
        }
      },
      {
        id: 3,
        numero: '07',
        marca: 'Mercedes-Benz',
        patente: 'IJKL-56',
        estado_operativo: 'En Taller',
        chofer_actual: {
          id: 3,
          nombre_completo: 'Pedro López'
        },
        documentos: {
          revision_tecnica: '2024-11-30',
          permiso_circulacion: '2024-11-30',
          seguro_obligatorio: '2024-11-30'
        }
      },
      {
        id: 4,
        numero: '03',
        marca: 'Marcopolo',
        patente: 'MNOP-78',
        estado_operativo: 'Inactiva',
        chofer_actual: null,
        documentos: {
          revision_tecnica: '2024-10-15',
          permiso_circulacion: '2024-10-15',
          seguro_obligatorio: '2024-10-15'
        }
      }
    ];
  }
}
