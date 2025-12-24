import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject, effect, untracked } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { DriverService } from '../../../shared/services/driver.service';
import { DriverKPIs } from '../../../shared/drivers/driver-kpis/driver-kpis';
import { DriverList } from '../../../shared/drivers/driver-list/driver-list';
import { Driver, DriverKPIs as DriverKPIsType, DriverViewMode, DriverStatusFilter, LicenseFilter } from '../../../shared/models/driver.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { calculateLicenseStatus } from '../../../shared/utils/license.utils';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { GlobalErrorService } from '../../../shared/services/global-error.service';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-drivers-list',
  imports: [DriverKPIs, DriverList, RouterLink, LoadingSkeleton, UiIconComponent],
  template: `
    <div class="space-y-6">
      <!-- Hero Section Premium -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
              Conductores
            </h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
              Gestión integral de conductores: estado, licencias, asignaciones y liquidaciones.
            </p>
          </div>
          <a routerLink="/choferes/nuevo" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-primary-content px-4 py-2.5 rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-sm font-medium shrink-0">
            <ui-icon name="CirclePlus" size="sm" />
            <span class="sm:hidden">Registrar</span>
            <span class="hidden sm:inline">Registrar Chofer</span>
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="pl-3 md:pl-4">
        @if (kpisLoadingState.isLoading() && !sequentialState.kpisError()) {
          <!-- Skeleton responsive - replica exacta de las KPI cards -->
          <app-loading-skeleton 
            type="responsive-kpis" 
            [isExiting]="kpisLoadingState.isSkeletonExiting()" />
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
            <!-- Skeleton simplificado - se muestra cuando isLoading es true -->
            <app-loading-skeleton 
              type="machine-list" 
              [count]="6"
              [isExiting]="driversLoadingState.isSkeletonExiting()" />
          } @else {
            <!-- Mantener skeleton visible hasta que canShowContent sea true -->
            <app-loading-skeleton 
              type="machine-list" 
              [count]="6"
              [isExiting]="driversLoadingState.isSkeletonExiting()" />
          }
        } @else {
          <!-- Solo renderizar el componente cuando canShowContent es true -->
          <div 
            [class.animate-fade-in]="sequentialState.canShowContent()" 
            [style.transition]="sequentialState.canShowContent() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowContent() ? 'translateY(0)' : 'translateY(12px)'"
            [style.opacity]="sequentialState.canShowContent() ? '1' : '0'">
            @if (!sequentialState.contentError()) {
              <app-driver-list
                [drivers]="drivers()"
                [viewMode]="viewMode()"
                [statusFilter]="statusFilter()"
                [licenseFilter]="licenseFilter()"
                [licenseAlerts]="licenseAlerts()"
                [isLoading]="isLoadingPage()"
                [totalActivos]="kpis().activos"
                (viewModeChange)="onViewModeChange($event)"
                (filterChange)="onFilterChange($event)"
                (licenseFilterChange)="onLicenseFilterChange($event)" />
              
              <!-- Paginación -->
              @if (totalDrivers() > 0) {
                <div class="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
                  <span>Mostrando {{ startRecord() }}-{{ endRecord() }} de {{ totalDrivers() }} conductores</span>
                  <div class="join">
                    <button 
                      (click)="goToPreviousPage()" 
                      [disabled]="currentPage() === 1 || isLoadingPage()" 
                      class="join-item btn btn-sm px-3" 
                      [class.btn-disabled]="currentPage() === 1 || isLoadingPage()">
                      «
                    </button>
                    @for (page of pages(); track page) {
                      <button 
                        (click)="goToPage(page)" 
                        [disabled]="isLoadingPage()" 
                        [class.btn-active]="page === currentPage()" 
                        class="join-item btn btn-sm px-4">{{ page }}</button>
                    }
                    <button 
                      (click)="goToNextPage()" 
                      [disabled]="currentPage() === totalPages() || isLoadingPage()" 
                      class="join-item btn btn-sm px-3" 
                      [class.btn-disabled]="currentPage() === totalPages() || isLoadingPage()">
                      »
                    </button>
                  </div>
                </div>
              }
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
export class DriversList implements OnInit, OnDestroy {
  private driverService = inject(DriverService);
  private loadingStateService = inject(LoadingStateService);
  private globalErrorService = inject(GlobalErrorService);
  private router = inject(Router);
  private navigationSubscription?: Subscription;

  viewMode = signal<DriverViewMode>('cards');
  statusFilter = signal<DriverStatusFilter>('all');
  licenseFilter = signal<LicenseFilter>('all');
  
  // Paginación
  currentPage = signal(1);
  itemsPerPage = 12;
  isLoadingPage = signal(false); // Indicador de carga para cambios de página
  private isLoadingDrivers = false; // Flag para evitar múltiples peticiones simultáneas
  private driversResponse = signal<{
    datos: Driver[];
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
  }>({
    datos: [],
    total: 0,
    pagina: 1,
    por_pagina: 12,
    total_paginas: 0
  });
  
  // Estados de carga simplificados (siguiendo patrón de driver-detail)
  kpisLoadingState = this.loadingStateService.createLoadingState();
  driversLoadingState = this.loadingStateService.createLoadingState();
  
  // Estado de carga secuencial coordinado (para animaciones suaves)
  sequentialState = this.loadingStateService.createSequentialLoadingState({
    kpisDelay: 100,
    contentDelay: 300,
    maxWaitTime: 2000
  });
  
  // ============================================
  // CÓDIGO ANTIGUO - COMENTADO (complejidad innecesaria)
  // ============================================
  // Flags para prevenir múltiples ejecuciones de effects
  // private driversEffectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // private kpisEffectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // private driversDataProcessed = signal(false);
  // private kpisDataProcessed = signal(false);
  // ============================================

  constructor() {
    // Iniciar estados de carga inmediatamente, antes del primer render
    this.kpisLoadingState.setLoading(true);
    this.driversLoadingState.setLoading(true);
  }

  // Cargar conductores con paginación
  private loadDrivers(): void {
    // Evitar múltiples peticiones simultáneas
    if (this.isLoadingDrivers) {
      return;
    }
    
    this.isLoadingDrivers = true;
    
    // Si es la primera carga, usar isLoading, si es cambio de página, usar isLoadingPage
    const isFirstLoad = this.currentPage() === 1 && this.driversResponse().datos.length === 0;
    if (isFirstLoad) {
      this.driversLoadingState.setLoading(true);
    } else {
      this.isLoadingPage.set(true);
    }
    
    const filters: {
      estado?: 'todos' | 'activos' | 'inactivos';
      licencia_estado?: 'vencidas' | 'por_vencer' | 'vigentes';
      search?: string;
      page: number;
      per_page: number;
    } = {
      page: this.currentPage(),
      per_page: this.itemsPerPage
    };
    
    // Aplicar filtros
    if (this.statusFilter() !== 'all') {
      const estadoMap: Record<DriverStatusFilter, 'todos' | 'activos' | 'inactivos'> = {
        'all': 'todos',
        'activo': 'activos',
        'inactivo': 'inactivos'
      };
      filters.estado = estadoMap[this.statusFilter()];
    }
    
    // Aplicar filtro de licencia
    if (this.licenseFilter() !== 'all') {
      const licenciaMap: Record<LicenseFilter, 'vencidas' | 'por_vencer' | 'vigentes'> = {
        'all': 'vigentes', // No debería llegar aquí
        'vencidas': 'vencidas',
        'por_vencer': 'por_vencer',
        'al_dia': 'vigentes' // 'al_dia' en frontend se mapea a 'vigentes' en backend
      };
      filters.licencia_estado = licenciaMap[this.licenseFilter()];
    }
    
    this.driverService.getDrivers(filters).pipe(
      catchError((error) => {
        console.error('Error cargando conductores:', error);
        // Mostrar error global en lugar de error local
        const isFirstLoad = this.currentPage() === 1 && this.driversResponse().datos.length === 0;
        if (isFirstLoad) {
          this.globalErrorService.showError(
            'No se pudieron cargar los conductores desde el servidor.',
            'Error al cargar conductores'
          );
        }
        this.sequentialState.setContentReady(true); // Marcar error
        this.driversLoadingState.setDataLoaded();
        this.isLoadingPage.set(false);
        this.isLoadingDrivers = false;
        return of({
          datos: [],
          total: 0,
          pagina: 1,
          por_pagina: 12,
          total_paginas: 0
        });
      })
    ).subscribe({
      next: (response) => {
        this.driversResponse.set(response);
        this.driversLoadingState.setDataLoaded();
        this.isLoadingPage.set(false);
        this.isLoadingDrivers = false;
        if (!this.sequentialState.contentError()) {
          setTimeout(() => {
            this.sequentialState.setContentReady(false);
          }, 50);
        }
      },
      error: (error) => {
        console.error('Error cargando conductores:', error);
        // Mostrar error global en lugar de error local
        const isFirstLoad = this.currentPage() === 1 && this.driversResponse().datos.length === 0;
        if (isFirstLoad) {
          this.globalErrorService.showError(
            'No se pudieron cargar los conductores desde el servidor.',
            'Error al cargar conductores'
          );
        }
        this.sequentialState.setContentReady(true);
        this.driversLoadingState.setDataLoaded();
        this.isLoadingPage.set(false);
        this.isLoadingDrivers = false;
      }
    });
  }

  drivers = computed(() => this.driversResponse().datos);
  totalDrivers = computed(() => this.driversResponse().total);
  totalPages = computed(() => this.driversResponse().total_paginas);

  // Cargar KPIs desde el backend
  kpisData = toSignal(
    this.driverService.getKPIs().pipe(
      catchError((error) => {
        console.error('Error cargando KPIs:', error);
        // Mostrar error global en lugar de error local
        this.globalErrorService.showError(
          'No se pudieron cargar los datos desde el servidor.',
          'Error al cargar conductores'
        );
        this.sequentialState.setKPIsReady(true); // Marcar error
        setTimeout(() => {
          this.kpisLoadingState.setDataLoaded();
        }, 100);
        return of<DriverKPIsType>({ activos: 0, inactivos: 0, con_maquina: 0, licencias_por_vencer: 0 });
      })
    ),
    { initialValue: null }
  );

  kpis = computed(() => {
    const kpisData = this.kpisData();
    // Si aún no hay datos reales y estamos cargando, retornar KPIs vacíos para evitar mostrar 0s
    if (kpisData === null && this.kpisLoadingState.isLoading()) {
      return { activos: 0, inactivos: 0, con_maquina: 0, licencias_por_vencer: 0 };
    }
    return kpisData ?? { activos: 0, inactivos: 0, con_maquina: 0, licencias_por_vencer: 0 };
  });

  // Effect para actualizar estado de carga
  private driversLoadingEffect = effect(() => {
    const drivers = this.drivers();
    const isLoading = this.driversLoadingState.isLoading();
    
    // Cuando hay datos y está cargando, marcar como cargado directamente
    if (drivers.length > 0 && isLoading && !this.sequentialState.contentError()) {
      this.driversLoadingState.setDataLoaded();
      // Coordinar con sequentialState para animaciones suaves
      setTimeout(() => {
        this.sequentialState.setContentReady(false);
      }, 50);
    } else if (this.sequentialState.contentError() && isLoading) {
      this.driversLoadingState.setDataLoaded();
    }
  });

  private kpisEffect = effect(() => {
    const kpis = this.kpisData();
    const isLoading = this.kpisLoadingState.isLoading();
    
    // Cuando los KPIs están listos
    if (kpis !== null && isLoading && !this.sequentialState.kpisError()) {
      this.kpisLoadingState.setDataLoaded();
      // Coordinar con sequentialState para animaciones suaves
      setTimeout(() => {
        this.sequentialState.setKPIsReady(false);
      }, 50);
    } else if (this.sequentialState.kpisError() && isLoading) {
      this.kpisLoadingState.setDataLoaded();
    }
  });

  // Cargar alertas de licencia desde el backend (sin filtro de licencia)
  private licenseAlertsResponse = signal<{
    vencidas: number;
    por_vencer: number;
    vigentes: number;
  }>({
    vencidas: 0,
    por_vencer: 0,
    vigentes: 0
  });

  // Cargar alertas de licencia
  private loadLicenseAlerts(): void {
    const filters: {
      estado?: 'todos' | 'activos' | 'inactivos';
    } = {};
    
    // Aplicar solo el filtro de estado (no el de licencia)
    if (this.statusFilter() !== 'all') {
      const estadoMap: Record<DriverStatusFilter, 'todos' | 'activos' | 'inactivos'> = {
        'all': 'todos',
        'activo': 'activos',
        'inactivo': 'inactivos'
      };
      filters.estado = estadoMap[this.statusFilter()];
    }
    
    this.driverService.getLicenseAlerts(filters).pipe(
      catchError((error) => {
        console.error('Error cargando alertas de licencia:', error);
        return of({ vencidas: 0, por_vencer: 0, vigentes: 0 });
      })
    ).subscribe({
      next: (alerts) => {
        this.licenseAlertsResponse.set(alerts);
      }
    });
  }

  licenseAlerts = computed(() => {
    const response = this.licenseAlertsResponse();
    // Mapear 'vigentes' del backend a 'al_dia' que espera el componente
    return {
      vencidas: response.vencidas,
      por_vencer: response.por_vencer,
      al_dia: response.vigentes
    };
  });
  
  // ============================================
  // CÓDIGO ANTIGUO - COMENTADO (complejidad innecesaria)
  // ============================================
  // Effects con flags y timeouts complejos
  // private driversEffect = effect(() => {
  //   const drivers = this.drivers();
  //   const isLoading = this.driversLoadingState.isLoading();
  //   const alreadyProcessed = this.driversDataProcessed();
  //   
  //   if (drivers.length > 0 && isLoading && !this.sequentialState.contentError() && !alreadyProcessed) {
  //     if (this.driversEffectTimeoutId) {
  //       clearTimeout(this.driversEffectTimeoutId);
  //     }
  //     this.driversDataProcessed.set(true);
  //     this.driversEffectTimeoutId = setTimeout(() => {
  //       this.driversLoadingState.setDataLoaded();
  //       setTimeout(() => {
  //         this.sequentialState.setContentReady(false);
  //       }, 50);
  //       this.driversEffectTimeoutId = null;
  //     }, 300);
  //   } else if (this.sequentialState.contentError() && isLoading && !alreadyProcessed) {
  //     this.driversDataProcessed.set(true);
  //     this.driversLoadingState.setDataLoaded();
  //   }
  // });
  //
  // private kpisEffect = effect(() => {
  //   const drivers = this.drivers();
  //   const isLoading = this.kpisLoadingState.isLoading();
  //   const alreadyProcessed = this.kpisDataProcessed();
  //   
  //   if (drivers.length > 0 && isLoading && !this.sequentialState.kpisError() && !alreadyProcessed) {
  //     if (this.kpisEffectTimeoutId) {
  //       clearTimeout(this.kpisEffectTimeoutId);
  //     }
  //     this.kpisDataProcessed.set(true);
  //     this.kpisEffectTimeoutId = setTimeout(() => {
  //       this.kpisLoadingState.setDataLoaded();
  //       setTimeout(() => {
  //         this.sequentialState.setKPIsReady(false);
  //       }, 50);
  //       this.kpisEffectTimeoutId = null;
  //     }, 300);
  //   } else if (this.sequentialState.kpisError() && isLoading && !alreadyProcessed) {
  //     this.kpisDataProcessed.set(true);
  //     this.kpisLoadingState.setDataLoaded();
  //   }
  // });
  //
  // private skeletonContentSyncEffect = effect(() => {
  //   const canShowContent = this.sequentialState.canShowContent();
  //   const showSkeleton = this.driversLoadingState.showSkeleton();
  //   const isSkeletonExiting = this.driversLoadingState.isSkeletonExiting();
  //   
  //   if (canShowContent && showSkeleton && !isSkeletonExiting) {
  //     // Lógica de sincronización
  //   }
  // });
  // ============================================

  // Función para reintentar carga
  // Función para reintentar carga (ya no se usa, pero se mantiene por compatibilidad)
  retryLoad(): void {
    // Limpiar error global y recargar página
    this.globalErrorService.clearError();
    this.globalErrorService.reloadPage();
  }


  private isFirstLoad = true;

  ngOnInit(): void {
    // Cargar conductores inicialmente
    this.loadDrivers();
    // Cargar alertas de licencia inicialmente
    this.loadLicenseAlerts();
    
    // Suscribirse a eventos de navegación para resetear estados cuando se vuelve a la página
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Si la URL es la de conductores y no es la primera carga, resetear estados de carga
        const isDriversRoute = event.url === '/choferes' || event.url.startsWith('/choferes');
        if (isDriversRoute && !this.isFirstLoad) {
          this.resetLoadingStates();
        }
        this.isFirstLoad = false;
      });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private resetLoadingStates(): void {
    // Resetear estados de carga secuencial
    this.sequentialState.reset();
    this.sequentialState.resetErrors();
    
    // Reiniciar estados de carga - esto activará los skeletons
    // Simple y directo, como en driver-detail
    this.kpisLoadingState.setLoading(true);
    this.driversLoadingState.setLoading(true);
    
    // Recargar datos
    this.currentPage.set(1);
    this.loadDrivers();
    this.loadLicenseAlerts();
  }
  
  // ============================================
  // CÓDIGO ANTIGUO - COMENTADO (complejidad innecesaria)
  // ============================================
  // private resetLoadingStates(): void {
  //   // Cancelar timeouts pendientes
  //   if (this.driversEffectTimeoutId) {
  //     clearTimeout(this.driversEffectTimeoutId);
  //     this.driversEffectTimeoutId = null;
  //   }
  //   if (this.kpisEffectTimeoutId) {
  //     clearTimeout(this.kpisEffectTimeoutId);
  //     this.kpisEffectTimeoutId = null;
  //   }
  //   
  //   // Resetear flags de procesamiento
  //   this.driversDataProcessed.set(false);
  //   this.kpisDataProcessed.set(false);
  //   
  //   // Resetear estados de carga secuencial primero
  //   this.sequentialState.reset();
  //   this.sequentialState.resetErrors();
  //   
  //   // Reiniciar estados de carga con delays complejos
  //   setTimeout(() => {
  //     this.kpisLoadingState.setLoading(true);
  //     this.driversLoadingState.setLoading(true);
  //     setTimeout(() => {
  //       // Lógica compleja innecesaria
  //     }, 100);
  //   }, 0);
  // }
  // ============================================

  onViewModeChange(mode: DriverViewMode): void {
    this.viewMode.set(mode);
  }

  onFilterChange(filter: DriverStatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1); // Resetear a página 1 cuando cambian los filtros
    // Recargar explícitamente los datos
    untracked(() => {
      this.loadDrivers();
      this.loadLicenseAlerts(); // Recargar alertas cuando cambia el filtro de estado
    });
  }

  onLicenseFilterChange(filter: LicenseFilter): void {
    this.licenseFilter.set(filter);
    this.currentPage.set(1); // Resetear a página 1 cuando cambian los filtros
    // Recargar explícitamente los datos
    untracked(() => {
      this.loadDrivers();
    });
  }
  
  // Funciones de paginación
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    return pages;
  });
  
  startRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = this.itemsPerPage;
    return (page - 1) * pageSize + 1;
  });
  
  endRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = this.itemsPerPage;
    const total = this.totalDrivers();
    return Math.min(page * pageSize, total);
  });
  
  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      // Asegurar que se carguen los registros de la nueva página
      untracked(() => {
        this.loadDrivers();
      });
    }
  }
  
  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      // Asegurar que se carguen los registros de la nueva página
      untracked(() => {
        this.loadDrivers();
      });
    }
  }
  
  goToPage(page: number): void {
    if (page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    // Asegurar que se carguen los registros de la nueva página
    untracked(() => {
      this.loadDrivers();
    });
  }

}

