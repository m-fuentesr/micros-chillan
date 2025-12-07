import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DriverService } from '../../../shared/services/driver.service';
import { DriverKPIs } from '../../../shared/drivers/driver-kpis/driver-kpis';
import { DriverList } from '../../../shared/drivers/driver-list/driver-list';
import { Driver, DriverKPIs as DriverKPIsType, DriverViewMode, DriverStatusFilter, LicenseFilter } from '../../../shared/models/driver.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { calculateLicenseStatus } from '../../../shared/utils/license.utils';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingStateService } from '../../../shared/services/loading-state.service';

@Component({
  selector: 'app-drivers-list',
  imports: [DriverKPIs, DriverList, RouterLink, LoadingSkeleton],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="page-entry-header border-b-2 border-b-base-300 pb-4 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <h1 class="text-xl md:text-2xl lg:text-4xl font-bold text-base-content tracking-tight">Conductores</h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-md hidden sm:block">
              Gestión integral de conductores: estado, licencias, asignaciones y liquidaciones.
            </p>
          </div>
          <a routerLink="/choferes/nuevo" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-primary-content px-4 py-2.5 rounded-lg shadow-sm border border-primary/20 transition-all active:scale-95 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span class="sm:hidden">Registrar</span>
            <span class="hidden sm:inline">Registrar Chofer</span>
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="pl-3 md:pl-4">
        @if (kpisLoadingState.isLoading() && !sequentialState.kpisError()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            @for (i of [1,2,3,4]; track i) {
              <app-loading-skeleton 
                type="kpi" 
                [isExiting]="kpisLoadingState.isSkeletonExiting()" />
            }
          </div>
        } @else if (sequentialState.kpisError()) {
          <div class="card bg-error/10 border border-error/20 rounded-xl p-4 mb-4">
            <div class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm font-semibold text-error">Error al cargar KPIs</p>
                <p class="text-xs text-error/70">Mostrando datos calculados localmente</p>
              </div>
            </div>
          </div>
          <div 
            [class.opacity-0]="!sequentialState.canShowKPIs()" 
            [class.animate-fade-in]="sequentialState.canShowKPIs()" 
            [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <app-driver-kpis [kpis]="kpis()" />
          </div>
        } @else {
          <div 
            [class.opacity-0]="!sequentialState.canShowKPIs()" 
            [class.animate-fade-in]="sequentialState.canShowKPIs()" 
            [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <app-driver-kpis [kpis]="kpis()" />
          </div>
        }
      </div>

      <!-- Layout Principal: Lista de Choferes (Full Width) -->
      <div class="page-entry-content">
        @if (!sequentialState.canShowContent()) {
          <!-- Mostrar skeleton mientras esperamos que los KPIs aparezcan -->
          @if (driversLoadingState.isLoading() && !sequentialState.contentError()) {
            <app-loading-skeleton 
              type="machine-list" 
              [count]="6"
              [isExiting]="driversLoadingState.isSkeletonExiting()" />
          } @else if (sequentialState.contentError()) {
            <div class="card bg-error/10 border border-error/20 rounded-xl p-6">
              <div class="flex flex-col items-center gap-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 class="text-lg font-semibold text-error mb-2">Error al cargar conductores</h3>
                  <p class="text-sm text-error/70 mb-4">No se pudieron cargar los conductores desde el servidor.</p>
                  <button (click)="retryLoad()" class="btn btn-sm btn-error">
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <!-- Mantener skeleton visible hasta que canShowContent sea true -->
            <app-loading-skeleton 
              type="machine-list" 
              [count]="6" />
          }
        } @else {
          <!-- Solo renderizar el componente cuando canShowContent es true -->
          <div 
            [class.animate-fade-in]="sequentialState.canShowContent()" 
            [style.transition]="sequentialState.canShowContent() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowContent() ? 'translateY(0)' : 'translateY(12px)'"
            [style.opacity]="sequentialState.canShowContent() ? '1' : '0'">
            @if (sequentialState.contentError()) {
              <div class="card bg-error/10 border border-error/20 rounded-xl p-6">
                <div class="flex flex-col items-center gap-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 class="text-lg font-semibold text-error mb-2">Error al cargar conductores</h3>
                    <p class="text-sm text-error/70 mb-4">No se pudieron cargar los conductores desde el servidor.</p>
                    <button (click)="retryLoad()" class="btn btn-sm btn-error">
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <app-driver-list
                [drivers]="drivers()"
                [viewMode]="viewMode()"
                [statusFilter]="statusFilter()"
                [licenseFilter]="licenseFilter()"
                [licenseAlerts]="licenseAlerts()"
                (viewModeChange)="onViewModeChange($event)"
                (filterChange)="onFilterChange($event)"
                (licenseFilterChange)="onLicenseFilterChange($event)" />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in {
      animation: fade-in 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriversList implements OnInit {
  private driverService = inject(DriverService);
  private loadingStateService = inject(LoadingStateService);

  viewMode = signal<DriverViewMode>('cards');
  statusFilter = signal<DriverStatusFilter>('all');
  licenseFilter = signal<LicenseFilter>('all');
  
  // Estados de carga con umbral de 200ms
  kpisLoadingState = this.loadingStateService.createLoadingState();
  driversLoadingState = this.loadingStateService.createLoadingState();
  
  // Estado de carga secuencial coordinado
  sequentialState = this.loadingStateService.createSequentialLoadingState({
    kpisDelay: 100,
    contentDelay: 300,
    maxWaitTime: 2000
  });

  constructor() {
    // Iniciar estados de carga inmediatamente, antes del primer render
    this.kpisLoadingState.setLoading(true);
    this.driversLoadingState.setLoading(true);
  }

  // Cargar choferes con manejo de errores
  driversData = toSignal(
    this.driverService.getDrivers().pipe(
      catchError((error) => {
        console.error('Error cargando conductores:', error);
        this.sequentialState.setContentReady(true); // Marcar error
        setTimeout(() => {
          this.driversLoadingState.setDataLoaded();
        }, 100);
        return of<Driver[]>(this.getMockDrivers());
      })
    ),
    { initialValue: [] }
  );

  drivers = computed(() => this.driversData() ?? []);

  // Calcular KPIs
  kpis = computed(() => {
    const drivers = this.drivers();
    // Si hay error, usar datos calculados localmente
    if (this.sequentialState.kpisError()) {
      return this.calculateMockKPIs();
    }
    // Si aún no hay datos reales y estamos cargando, retornar KPIs vacíos para evitar mostrar 0s
    if (drivers.length === 0 && this.kpisLoadingState.isLoading()) {
      return { activos: 0, inactivos: 0, con_maquina: 0, licencias_por_vencer: 0 };
    }
    return this.calculateMockKPIs();
  });

  // Effects para detectar cuando los datos están listos y coordinar la aparición
  private driversEffect = effect(() => {
    const drivers = this.drivers();
    const isLoading = this.driversLoadingState.isLoading();
    
    if (drivers.length > 0 && isLoading && !this.sequentialState.contentError()) {
      this.driversLoadingState.setDataLoaded();
      setTimeout(() => {
        this.sequentialState.setContentReady(false);
      }, 50);
    } else if (this.sequentialState.contentError() && isLoading) {
      this.driversLoadingState.setDataLoaded();
    }
  });

  private kpisEffect = effect(() => {
    const drivers = this.drivers();
    const isLoading = this.kpisLoadingState.isLoading();
    
    // Los KPIs se calculan desde los drivers, así que cuando los drivers están listos, los KPIs también
    if (drivers.length > 0 && isLoading && !this.sequentialState.kpisError()) {
      this.kpisLoadingState.setDataLoaded();
      setTimeout(() => {
        this.sequentialState.setKPIsReady(false);
      }, 50);
    } else if (this.sequentialState.kpisError() && isLoading) {
      this.kpisLoadingState.setDataLoaded();
    }
  });

  // Función para reintentar carga
  retryLoad(): void {
    this.sequentialState.resetErrors();
    this.sequentialState.reset();
    this.driversLoadingState.setLoading(true);
    
    // Recargar conductores
    this.driversData = toSignal(
      this.driverService.getDrivers().pipe(
        catchError((error) => {
          console.error('Error cargando conductores:', error);
          this.sequentialState.setContentReady(true);
          setTimeout(() => {
            this.driversLoadingState.setDataLoaded();
          }, 100);
          return of<Driver[]>(this.getMockDrivers());
        })
      ),
      { initialValue: [] }
    );
  }

  // Calcular alertas de licencias desde todos los conductores (no filtrados)
  licenseAlerts = computed(() => {
    const drivers = this.drivers();
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

  private calculateMockKPIs(): DriverKPIsType {
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
  }

  ngOnInit(): void {
    // Los estados de carga ya se iniciaron en la inicialización
    // Los datos se cargan automáticamente con toSignal
    // Los effects detectarán cuando estén listos y llamarán a setDataLoaded()
  }

  onViewModeChange(mode: DriverViewMode): void {
    this.viewMode.set(mode);
  }

  onFilterChange(filter: DriverStatusFilter): void {
    this.statusFilter.set(filter);
  }

  onLicenseFilterChange(filter: LicenseFilter): void {
    this.licenseFilter.set(filter);
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

