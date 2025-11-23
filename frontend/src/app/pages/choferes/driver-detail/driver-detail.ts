import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineService } from '../../../shared/services/machine.service';
import { DriverHeader } from '../../../shared/drivers/driver-header/driver-header';
import { DriverPersonalInfo } from '../../../shared/drivers/driver-personal-info/driver-personal-info';
import { DriverLicenseInfo } from '../../../shared/drivers/driver-license-info/driver-license-info';
import { DriverHistory } from '../../../shared/drivers/driver-history/driver-history';
import { DriverSummary } from '../../../shared/drivers/driver-summary/driver-summary';
import { Driver, DriverDailyRecord, DriverLiquidation } from '../../../shared/models/driver.models';
import { catchError, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-driver-detail',
  imports: [DriverHeader, DriverPersonalInfo, DriverLicenseInfo, DriverHistory, DriverSummary, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 class="text-4xl font-bold mb-2">Detalle del Chofer</h1>
          <p class="text-base-content/70">
            Información completa y gestión del chofer
          </p>
        </div>
        <a routerLink="/choferes" class="btn btn-secondary">
          Volver a lista
        </a>
      </div>

      <!-- Driver Header Card -->
      @if (driver()) {
        <app-driver-header
          [driver]="driver()!"
          (edit)="onEditPersonal()" />
      }

      <!-- Layout: Contenido y Sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Contenido Principal (3 columnas) -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Información Personal -->
          @if (driver()) {
            <app-driver-personal-info
              [driver]="driver()!"
              [maquinas]="maquinas()"
              (save)="onSavePersonal($event)" />
          }

          <!-- Detalles de Licencia -->
          @if (driver()) {
            <app-driver-license-info
              [driver]="driver()!"
              (save)="onSaveLicense($event)" />
          }

          <!-- Historial -->
          <app-driver-history
            [dailyRecords]="dailyRecords()"
            [liquidations]="liquidations()" />
        </div>

        <!-- Sidebar (1 columna) -->
        <div class="lg:col-span-1">
          @if (driver()) {
            <app-driver-summary
              [driver]="driver()!"
              [reportCount]="dailyRecords().length"
              [lastReportDate]="getLastReportDate()" />
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private driverService = inject(DriverService);
  private machineService = inject(MachineService);

  // Cargar chofer
  driverIdParam = toSignal(
    this.route.params.pipe(
      map(params => params['id'] ? Number(params['id']) : null)
    ),
    { initialValue: null }
  );

  driverId = computed(() => this.driverIdParam());

  driverData = toSignal(
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'] ? Number(params['id']) : null;
        if (!id) {
          return of<Driver | null>(null);
        }
        return this.driverService.getDriverById(id).pipe(
          catchError(() => of<Driver | null>(null))
        );
      })
    ),
    { initialValue: null }
  );

  driver = computed(() => this.driverData());

  // Cargar máquinas para el select
  maquinasData = toSignal(
    this.machineService.getMachines().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  maquinas = computed(() => {
    const machines = this.maquinasData() ?? [];
    return machines.map(m => ({
      id: m.id,
      identificador: `MÁQUINA ${m.numero}`
    }));
  });

  // Registros diarios (mock por ahora)
  dailyRecords = signal<DriverDailyRecord[]>([]);

  // Liquidaciones (mock por ahora)
  liquidations = signal<DriverLiquidation[]>([]);

  ngOnInit(): void {
    // Efecto para cargar datos cuando el chofer cambia
    effect(() => {
      const driver = this.driver();
      const driverId = this.driverId();
      
      if (!driverId) {
        this.router.navigate(['/choferes']);
        return;
      }

      if (driver) {
        // Cargar registros diarios del chofer
        this.loadDailyRecords();
        
        // Cargar liquidaciones
        this.loadLiquidations();
      }
    });
  }

  onEditPersonal(): void {
    // El componente DriverPersonalInfo maneja su propio estado de edición
  }

  onSavePersonal(data: Partial<Driver>): void {
    if (this.driverId()) {
      this.driverService.updateDriver(this.driverId()!, data)
        .pipe(
          catchError((error) => {
            console.error('Error al actualizar chofer:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          // Recargar datos del chofer
          // En producción, esto actualizaría el signal automáticamente
        });
    }
  }

  onSaveLicense(data: Partial<Driver>): void {
    if (this.driverId()) {
      this.driverService.updateDriver(this.driverId()!, data)
        .pipe(
          catchError((error) => {
            console.error('Error al actualizar licencia:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          // Recargar datos del chofer
        });
    }
  }

  getLastReportDate(): string | null {
    const records = this.dailyRecords();
    if (records.length === 0) return null;
    return records[0].fecha;
  }

  private loadDailyRecords(): void {
    // Mock data - en producción vendría del servicio
    this.dailyRecords.set([
      {
        id: 1,
        fecha: '2024-11-14',
        estado: 'completo',
        recaudado: 450000,
        diesel: 80000,
        observaciones: 'Sin novedades'
      },
      {
        id: 2,
        fecha: '2024-11-13',
        estado: 'pendiente_trabajador',
        recaudado: 0,
        diesel: 0,
        observaciones: null
      },
      {
        id: 3,
        fecha: '2024-11-12',
        estado: 'completo',
        recaudado: 520000,
        diesel: 75000,
        observaciones: 'Buen día'
      }
    ]);
  }

  private loadLiquidations(): void {
    // Mock data - en producción vendría del servicio
    this.liquidations.set([
      {
        id: 1,
        fecha: '01 Nov 2024',
        total_ganado: 450000,
        minimo_garantizado: 400000,
        pago_final: 450000,
        metodo_pago: 'transferencia',
        codigo_transferencia: 'TRF-2024-001',
        estado_pago: 'pagado'
      },
      {
        id: 2,
        fecha: '01 Oct 2024',
        total_ganado: 380000,
        minimo_garantizado: 400000,
        pago_final: 400000,
        metodo_pago: 'transferencia',
        codigo_transferencia: 'TRF-2024-002',
        estado_pago: 'pagado'
      },
      {
        id: 3,
        fecha: '01 Sep 2024',
        total_ganado: 520000,
        minimo_garantizado: 400000,
        pago_final: 520000,
        metodo_pago: 'transferencia',
        codigo_transferencia: 'TRF-2024-003',
        estado_pago: 'pendiente'
      }
    ]);
  }
}

