import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DriverService } from '../../../shared/services/driver.service';
import { DriverKPIs } from '../../../shared/drivers/driver-kpis/driver-kpis';
import { DriverList } from '../../../shared/drivers/driver-list/driver-list';
import { Driver, DriverKPIs as DriverKPIsType, DriverViewMode, DriverStatusFilter } from '../../../shared/models/driver.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { calculateLicenseStatus } from '../../../shared/utils/license.utils';

@Component({
  selector: 'app-drivers-list',
  imports: [DriverKPIs, DriverList, RouterLink],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header -->
      <div class="animate-header-enter border-b-2 border-b-base-300 pb-4 mb-6">
        <div class="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 class="text-4xl font-bold mb-3 border-l-4 border-l-primary pl-4">Lista de Choferes</h1>
            <p class="text-base-content/70 italic">
              Gestiona todos los choferes registrados en el sistema.
            </p>
          </div>
          <a routerLink="/choferes/nuevo" class="btn btn-primary hover-lift">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Registrar Chofer
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <app-driver-kpis [kpis]="kpis()" />

      <!-- Layout Principal: Lista de Choferes (Full Width) -->
      <div class="animate-page-enter" style="animation-delay: 200ms; animation-fill-mode: both;">
        <app-driver-list
          [drivers]="filteredDrivers()"
          [viewMode]="viewMode()"
          [statusFilter]="statusFilter()"
          [licenseAlerts]="licenseAlerts()"
          (viewModeChange)="onViewModeChange($event)"
          (filterChange)="onFilterChange($event)" />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriversList implements OnInit {
  private driverService = inject(DriverService);

  viewMode = signal<DriverViewMode>('cards');
  statusFilter = signal<DriverStatusFilter>('all');

  // Cargar choferes
  driversData = toSignal(
    this.driverService.getDrivers().pipe(
      catchError(() => of<Driver[]>(this.getMockDrivers()))
    ),
    { initialValue: this.getMockDrivers() }
  );

  drivers = computed(() => this.driversData() ?? []);

  // Calcular alertas de licencias
  licenseAlerts = computed(() => {
    const drivers = this.filteredDrivers();
    let vencidas = 0;
    let por_vencer = 0;
    let al_dia = 0;

    drivers.forEach(driver => {
      const status = calculateLicenseStatus(driver.fecha_venc_licencia, 30);
      if (status.estado === 'error') {
        vencidas++;
      } else if (status.estado === 'warning') {
        por_vencer++;
      } else {
        al_dia++;
      }
    });

    return { vencidas, por_vencer, al_dia };
  });

  // Choferes filtrados
  filteredDrivers = computed(() => {
    const drivers = this.drivers();
    const filter = this.statusFilter();
    if (filter === 'all') {
      return drivers;
    }
    return drivers.filter(d => d.estado === filter);
  });

  // Calcular KPIs
  kpis = computed(() => {
    const drivers = this.drivers();
    let activos = 0;
    let inactivos = 0;
    let con_maquina = 0;
    let licencias_por_vencer = 0;

    drivers.forEach(driver => {
      if (driver.estado === 'activo') activos++;
      else if (driver.estado === 'inactivo') inactivos++;

      if (driver.maquina_actual) con_maquina++;

      const licenseStatus = calculateLicenseStatus(driver.fecha_venc_licencia, 30);
      if (licenseStatus.estado !== 'ok') {
        licencias_por_vencer++;
      }
    });

    return {
      activos,
      inactivos,
      con_maquina,
      licencias_por_vencer
    };
  });

  ngOnInit(): void {
    // Los datos se cargan automáticamente con toSignal
  }

  onViewModeChange(mode: DriverViewMode): void {
    this.viewMode.set(mode);
  }

  onFilterChange(filter: DriverStatusFilter): void {
    this.statusFilter.set(filter);
  }

  private getMockDrivers(): Driver[] {
    return [
      {
        id: 1,
        nombre_completo: 'Juan Pérez González',
        rut: '12.345.678-9',
        telefono: '+56 9 1234 5678',
        correo: 'juan.perez@ejemplo.cl',
        porcentaje_pago: 16.5,
        fecha_venc_licencia: '2024-12-15',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: {
          id: 1,
          identificador: 'MÁQUINA 01'
        }
      },
      {
        id: 2,
        nombre_completo: 'María López Silva',
        rut: '18.765.432-1',
        telefono: '+56 9 8765 4321',
        correo: 'maria.lopez@ejemplo.cl',
        porcentaje_pago: 15.0,
        fecha_venc_licencia: '2025-06-20',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: {
          id: 3,
          identificador: 'MÁQUINA 03'
        }
      },
      {
        id: 3,
        nombre_completo: 'Pedro Ramírez Torres',
        rut: '15.987.654-3',
        telefono: '+56 9 5987 6543',
        correo: 'pedro.ramirez@ejemplo.cl',
        porcentaje_pago: 16.0,
        fecha_venc_licencia: '2024-11-25',
        alerta_licencia: true,
        estado: 'inactivo',
        maquina_actual: null
      },
      {
        id: 4,
        nombre_completo: 'Ana Fernández Muñoz',
        rut: '14.258.963-7',
        telefono: '+56 9 4258 9637',
        correo: 'ana.fernandez@ejemplo.cl',
        porcentaje_pago: 15.5,
        fecha_venc_licencia: '2025-03-10',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: {
          id: 5,
          identificador: 'MÁQUINA 05'
        }
      },
      {
        id: 5,
        nombre_completo: 'Carlos Soto Bravo',
        rut: '16.357.159-2',
        telefono: '+56 9 6357 1592',
        correo: 'carlos.soto@ejemplo.cl',
        porcentaje_pago: 16.0,
        fecha_venc_licencia: '2025-08-15',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: null
      }
    ];
  }
}

