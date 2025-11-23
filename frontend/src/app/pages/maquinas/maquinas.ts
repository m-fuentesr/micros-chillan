import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MachineService } from '../../shared/services/machine.service';
import { MachineKPIs } from '../../shared/machines/machine-kpis/machine-kpis';
import { MachineFilters } from '../../shared/machines/machine-filters/machine-filters';
import { MachineList } from '../../shared/machines/machine-list/machine-list';
import { Machine, StatusFilter, ViewMode, MachineKPIs as MachineKPIsType, MachineDocumentAlerts, DocumentStatus } from '../../shared/models/machine.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, map } from 'rxjs';
import { calculateMachineDocumentStatus } from '../../shared/utils/document.utils';

@Component({
  selector: 'app-maquinas',
  imports: [MachineKPIs, MachineList, RouterLink],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header -->
      <div class="animate-header-enter">
        <div class="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 class="text-4xl font-bold mb-2">Lista de Máquinas (Microbuses)</h1>
            <p class="text-base-content/70">
              Gestiona todas las máquinas registradas en el sistema.
            </p>
          </div>
          <a routerLink="/maquinas/nueva" class="btn btn-primary hover-lift">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Registrar Nueva Máquina
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <app-machine-kpis [kpis]="kpis()" />

      <!-- Layout Principal: Lista de Máquinas (Full Width) -->
      <div class="animate-page-enter" style="animation-delay: 200ms; animation-fill-mode: both;">
        <app-machine-list
          [machines]="filteredMachines()"
          [viewMode]="viewMode()"
          [statusFilter]="statusFilter()"
          [docStatusMap]="docStatusMap()"
          [alerts]="documentAlerts()"
          (viewModeChange)="onViewModeChange($event)"
          (filterChange)="onFilterChange($event)" />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Maquinas implements OnInit {
  private machineService = inject(MachineService);

  viewMode = signal<ViewMode>('cards');
  statusFilter = signal<StatusFilter>('all');

  // Cargar máquinas
  machinesData = toSignal(
    this.machineService.getMachines().pipe(
      catchError(() => of<Machine[]>(this.getMockMachines()))
    ),
    { initialValue: this.getMockMachines() }
  );

  machines = computed(() => this.machinesData() ?? []);

  // Cargar KPIs
  kpisData = toSignal(
    this.machineService.getKPIs().pipe(
      catchError(() => of<MachineKPIsType>(this.calculateMockKPIs()))
    ),
    { initialValue: this.calculateMockKPIs() }
  );

  kpis = computed(() => this.kpisData() ?? this.calculateMockKPIs());

  // Calcular alertas de documentación desde las máquinas filtradas
  documentAlerts = computed(() => {
    const machines = this.filteredMachines();
    let vencidos = 0;
    let por_vencer = 0;
    let al_dia = 0;

    machines.forEach(machine => {
      const status = calculateMachineDocumentStatus(machine);
      ['revision_tecnica', 'permiso_circulacion', 'seguro_obligatorio'].forEach(key => {
        const doc = status[key as keyof typeof status];
        if (doc) {
          if (doc.estado === 'error') {
            vencidos++;
          } else if (doc.estado === 'warning') {
            por_vencer++;
          } else {
            al_dia++;
          }
        }
      });
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

  // Máquinas filtradas
  filteredMachines = computed(() => {
    const machines = this.machines();
    const filter = this.statusFilter();
    if (filter === 'all') {
      return machines;
    }
    return machines.filter(m => m.estado_operativo === filter);
  });

  ngOnInit(): void {
    // Los datos se cargan automáticamente con toSignal
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onFilterChange(filter: StatusFilter): void {
    this.statusFilter.set(filter);
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
