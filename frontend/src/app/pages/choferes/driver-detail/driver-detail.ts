import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineService } from '../../../shared/services/machine.service';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { AccountingService } from '../../../shared/services/accounting.service';
import type { DailyRecord, DailyRecordStatus } from '../../../shared/models/daily-record.models';
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
  private dailyRecordService = inject(DailyRecordService);
  private accountingService = inject(AccountingService);

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
    const driverId = this.driverId();
    if (!driverId) return;

    this.dailyRecordService.getDailyRecords({
      chofer_id: driverId
    }).subscribe({
      next: (response) => {
        const records = response.datos || [];
        
        // Mapear DailyRecord a DriverDailyRecord
        const driverRecords: DriverDailyRecord[] = records.map((record: DailyRecord) => {
          // Mapear estado
          let estado: 'completo' | 'pendiente_trabajador' | 'incidente_reportado' | 'no_trabajado';
          switch (record.estado) {
            case 'COMPLETO':
              estado = 'completo';
              break;
            case 'PENDIENTE_TRABAJADOR':
              estado = 'pendiente_trabajador';
              break;
            case 'INCIDENTE_REPORTADO':
              estado = 'incidente_reportado';
              break;
            case 'NO_TRABAJADO':
            case 'DIA_NO_TRABAJADO':
              estado = 'no_trabajado';
              break;
            default:
              estado = 'completo';
          }

          return {
            id: parseInt(record.id),
            fecha: record.fecha,
            estado,
            recaudado: record.recaudado || 0,
            diesel: record.costo_diesel || 0,
            observaciones: record.observaciones || null
          };
        });

        // Ordenar por fecha (más reciente primero)
        driverRecords.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.dailyRecords.set(driverRecords);
      },
      error: (error) => {
        console.error('Error al cargar registros diarios:', error);
        this.dailyRecords.set([]);
      }
    });
  }

  private loadLiquidations(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    // Obtener liquidaciones del chofer
    // Por ahora, obtener del mes actual y meses anteriores
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    this.accountingService.getLiquidation(currentMonth, currentYear).subscribe({
      next: (liquidation) => {
        const liquidations: DriverLiquidation[] = [];

        // Buscar el chofer en la liquidación
        const driverLiquidation = liquidation.choferes.find(c => c.chofer_id === driverId);
        
        if (driverLiquidation) {
          liquidations.push({
            id: driverLiquidation.chofer_id,
            fecha: `${String(currentMonth).padStart(2, '0')}/${currentYear}`,
            total_ganado: driverLiquidation.total_ganado,
            minimo_garantizado: driverLiquidation.minimo_garantizado || 0,
            pago_final: driverLiquidation.pago_final,
            metodo_pago: driverLiquidation.metodo_pago || 'transferencia',
            codigo_transferencia: driverLiquidation.codigo_transferencia || null,
            estado_pago: driverLiquidation.estado_pago === 'pagado' ? 'pagado' : 'pendiente'
          });
        }

        // Obtener historial de liquidaciones
        this.accountingService.getLiquidationHistory().subscribe({
          next: (history) => {
            // Filtrar liquidaciones del chofer
            history.forEach((item) => {
              const driverItem = item.choferes.find(c => c.chofer_id === driverId);
              if (driverItem) {
                liquidations.push({
                  id: driverItem.chofer_id,
                  fecha: `${String(item.mes).padStart(2, '0')}/${item.anio}`,
                  total_ganado: driverItem.total_ganado,
                  minimo_garantizado: driverItem.minimo_garantizado || 0,
                  pago_final: driverItem.pago_final,
                  metodo_pago: driverItem.metodo_pago || 'transferencia',
                  codigo_transferencia: driverItem.codigo_transferencia || null,
                  estado_pago: driverItem.estado_pago === 'pagado' ? 'pagado' : 'pendiente'
                });
              }
            });

            // Ordenar por fecha (más reciente primero)
            liquidations.sort((a, b) => {
              const [monthA, yearA] = a.fecha.split('/').map(Number);
              const [monthB, yearB] = b.fecha.split('/').map(Number);
              if (yearA !== yearB) return yearB - yearA;
              return monthB - monthA;
            });

            this.liquidations.set(liquidations);
          },
          error: (error) => {
            console.error('Error al cargar historial de liquidaciones:', error);
            this.liquidations.set(liquidations);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar liquidaciones:', error);
        this.liquidations.set([]);
      }
    });
  }
}

