import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MachineService } from '../../../shared/services/machine.service';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineGeneralInfo } from '../../../shared/machines/machine-general-info/machine-general-info';
import { MachineDailyRecords } from '../../../shared/machines/machine-daily-records/machine-daily-records';
import { MachineAssignmentHistory } from '../../../shared/machines/machine-assignment-history/machine-assignment-history';
import { MachineMaintenance } from '../../../shared/machines/machine-maintenance/machine-maintenance';
import { Machine } from '../../../shared/models/machine.models';
import { MachineDailyRecord, MachineDailyRecordFilters, MachineAssignment, MaintenanceRecord, MaintenanceFilters } from '../../../shared/models/machine-detail.models';
import { catchError, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-machine-detail',
  imports: [MachineGeneralInfo, MachineDailyRecords, MachineAssignmentHistory, MachineMaintenance, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 class="text-4xl font-bold mb-2">
            Detalle de Máquina: Máquina {{ machine()?.numero || '--' }} - {{ machine()?.marca || '--' }}
          </h1>
          <p class="text-base-content/70">
            Gestiona información general, documentación y registros diarios.
          </p>
        </div>
        <div class="flex gap-2">
          <a 
            [routerLink]="['/maquinas', machine()?.id, 'editar']"
            class="btn btn-primary">
            Editar
          </a>
          <button 
            class="btn btn-error"
            (click)="onDelete()">
            Eliminar Máquina
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs tabs-bordered">
        <button
          class="tab"
          [class.tab-active]="activeTab() === 'general'"
          (click)="setActiveTab('general')">
          Información General
        </button>
        <button
          class="tab"
          [class.tab-active]="activeTab() === 'records'"
          (click)="setActiveTab('records')">
          Registros Diarios
        </button>
        <button
          class="tab"
          [class.tab-active]="activeTab() === 'assignments'"
          (click)="setActiveTab('assignments')">
          Historial de Asignaciones
        </button>
        <button
          class="tab"
          [class.tab-active]="activeTab() === 'maintenance'"
          (click)="setActiveTab('maintenance')">
          Mantenimiento y Gastos
        </button>
      </div>

      <!-- Contenido de Tabs -->
      <div>
        @if (activeTab() === 'general') {
          @if (machine()) {
            <app-machine-general-info
              [machine]="machine()!"
              (editDocs)="onEditDocs()" />
          }
        }

        @if (activeTab() === 'records') {
          <app-machine-daily-records
            [records]="dailyRecords()"
            [choferes]="choferes()"
            [filters]="recordFilters()"
            (filterChange)="onRecordFilterChange($event)"
            (viewDetail)="onViewRecordDetail($event)" />
        }

        @if (activeTab() === 'assignments') {
          <app-machine-assignment-history
            [assignments]="assignments()" />
        }

        @if (activeTab() === 'maintenance') {
          @if (machineId()) {
            <app-machine-maintenance
              [machineId]="machineId()!"
              [records]="maintenanceRecords()"
              [availableItems]="maintenanceItems()"
              [filters]="maintenanceFilters()"
              (recordAdded)="onMaintenanceRecordAdded($event)"
              (recordDeleted)="onMaintenanceRecordDeleted($event)"
              (filterChange)="onMaintenanceFilterChange($event)" />
          }
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private machineService = inject(MachineService);
  private driverService = inject(DriverService);

  activeTab = signal<'general' | 'records' | 'assignments' | 'maintenance'>('general');
  recordFilters = signal<MachineDailyRecordFilters>({});
  maintenanceFilters = signal<MaintenanceFilters>({});
  maintenanceRecords = signal<MaintenanceRecord[]>([]);
  maintenanceItems = signal<string[]>(['Neumáticos', 'Aceite Motor', 'Filtros', 'Reparación Frenos']);

  // Cargar máquina - usando route.params para reactividad
  machineIdParam = toSignal(
    this.route.params.pipe(
      map(params => params['id'] ? Number(params['id']) : null)
    ),
    { initialValue: null }
  );

  machineId = computed(() => this.machineIdParam());

  machineData = toSignal(
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'] ? Number(params['id']) : null;
        if (!id) {
          return of<Machine | null>(null);
        }
        return this.machineService.getMachineById(id).pipe(
          catchError(() => of<Machine | null>(null))
        );
      })
    ),
    { initialValue: null }
  );

  machine = computed(() => this.machineData());

  // Cargar choferes
  choferesData = toSignal(
    this.driverService.getDrivers({ estado: 'activo' }).pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  choferes = computed(() => this.choferesData() ?? []);

  // Registros diarios (mock por ahora)
  dailyRecords = signal<MachineDailyRecord[]>([]);

  // Asignaciones (mock por ahora)
  assignments = signal<MachineAssignment[]>([]);

  ngOnInit(): void {
    // Efecto para cargar datos cuando la máquina cambia
    effect(() => {
      const machine = this.machine();
      const machineId = this.machineId();
      
      if (!machineId) {
        this.router.navigate(['/maquinas']);
        return;
      }

      if (machine) {
        // Cargar registros diarios de la máquina
        this.loadDailyRecords();
        
        // Cargar historial de asignaciones
        this.loadAssignments();
        
        // Cargar registros de mantenimiento
        this.loadMaintenanceRecords();
      }
    });
  }

  setActiveTab(tab: 'general' | 'records' | 'assignments' | 'maintenance'): void {
    this.activeTab.set(tab);
  }

  onEditDocs(): void {
    // Navegar a edición de documentación
    this.router.navigate(['/maquinas', this.machineId(), 'editar'], {
      queryParams: { section: 'documentation' }
    });
  }

  onDelete(): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta máquina?')) {
      return;
    }

    if (this.machineId()) {
      this.machineService.deleteMachine(this.machineId()!)
        .pipe(
          catchError((error) => {
            console.error('Error al eliminar máquina:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          this.router.navigate(['/maquinas']);
        });
    }
  }

  onRecordFilterChange(filters: MachineDailyRecordFilters): void {
    this.recordFilters.set(filters);
    // Aquí podrías recargar los registros con los nuevos filtros
    this.loadDailyRecords();
  }

  onViewRecordDetail(record: MachineDailyRecord): void {
    // Navegar al detalle del registro
    this.router.navigate(['/registro-diario', record.id]);
  }

  private loadDailyRecords(): void {
    // Mock data - en producción vendría del servicio
    const machine = this.machine();
    if (!machine) return;

    this.dailyRecords.set([
      {
        id: 1,
        fecha: '2025-11-16',
        chofer: 'Juan Pérez',
        chofer_id: 1,
        recaudado: 150000,
        diesel: 35000,
        observaciones: 'Algunas observaciones',
        estado: 'COMPLETO'
      },
      {
        id: 2,
        fecha: '2025-11-15',
        chofer: 'Juan Pérez',
        chofer_id: 1,
        recaudado: 145000,
        diesel: 32000,
        estado: 'COMPLETO'
      },
      {
        id: 3,
        fecha: '2025-11-14',
        chofer: 'Laura Diaz',
        chofer_id: 2,
        recaudado: 0,
        diesel: 0,
        observaciones: 'Día no trabajado',
        estado: 'NO_TRABAJADO'
      }
    ]);
  }

  private loadAssignments(): void {
    // Mock data - en producción vendría del servicio
    const machine = this.machine();
    if (!machine) return;

    this.assignments.set([
      {
        id: 1,
        chofer: {
          id: 1,
          nombre_completo: 'Juan Pérez'
        },
        fecha_inicio: '2025-10-01',
        fecha_fin: null,
        duracion_dias: 51,
        estado: 'activa'
      },
      {
        id: 2,
        chofer: {
          id: 2,
          nombre_completo: 'Laura Diaz'
        },
        fecha_inicio: '2025-08-01',
        fecha_fin: '2025-09-30',
        duracion_dias: 60,
        estado: 'cerrada'
      },
      {
        id: 3,
        chofer: {
          id: 3,
          nombre_completo: 'Pedro López'
        },
        fecha_inicio: '2025-05-01',
        fecha_fin: '2025-07-31',
        duracion_dias: 91,
        estado: 'cerrada'
      }
    ]);
  }

  private loadMaintenanceRecords(): void {
    // Mock data - en producción vendría del servicio
    const machine = this.machine();
    if (!machine) return;

    this.maintenanceRecords.set([
      {
        id: 1,
        maquina_id: machine.id,
        item: 'Neumáticos',
        costo: 450000,
        numero_factura: '001-00001234',
        categoria: 'preventivo',
        fecha: '2025-11-10'
      },
      {
        id: 2,
        maquina_id: machine.id,
        item: 'Aceite Motor',
        costo: 85000,
        numero_factura: '001-00001233',
        categoria: 'preventivo',
        fecha: '2025-11-05'
      },
      {
        id: 3,
        maquina_id: machine.id,
        item: 'Filtros',
        costo: 120000,
        numero_factura: '001-00001232',
        categoria: 'preventivo',
        fecha: '2025-10-28'
      },
      {
        id: 4,
        maquina_id: machine.id,
        item: 'Reparación Frenos',
        costo: 280000,
        numero_factura: '001-00001231',
        categoria: 'correctivo',
        fecha: '2025-10-15'
      }
    ]);
  }

  onMaintenanceRecordAdded(record: MaintenanceRecord): void {
    const current = this.maintenanceRecords();
    this.maintenanceRecords.set([...current, record]);
    // En producción, aquí se enviaría al backend
  }

  onMaintenanceRecordDeleted(id: number): void {
    const current = this.maintenanceRecords();
    this.maintenanceRecords.set(current.filter(r => r.id !== id));
    // En producción, aquí se enviaría al backend
  }

  onMaintenanceFilterChange(filters: MaintenanceFilters): void {
    this.maintenanceFilters.set(filters);
  }
}

