import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject, effect, untracked } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MachineService } from '../../shared/services/machine.service';
import { MachineKPIs } from '../../shared/machines/machine-kpis/machine-kpis';
import { MachineFilters } from '../../shared/machines/machine-filters/machine-filters';
import { MachineList } from '../../shared/machines/machine-list/machine-list';
import { Machine, StatusFilter, DocumentFilter, ViewMode, MachineKPIs as MachineKPIsType, MachineDocumentAlerts, DocumentStatus } from '../../shared/models/machine.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, map } from 'rxjs';
import { calculateMachineDocumentStatus } from '../../shared/utils/document.utils';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-maquinas',
  imports: [MachineKPIs, MachineList, RouterLink, LoadingSkeleton, UiIconComponent],
  template: `
    <div class="space-y-6">
      <!-- Hero Section Premium -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
              Flota de Vehículos
            </h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
              Administración completa de la flota: estado operativo, documentación y asignación de conductores.
            </p>
          </div>
          <a routerLink="/maquinas/nueva" class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-primary-content px-4 py-2.5 rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-sm font-medium shrink-0">
            <ui-icon name="CirclePlus" size="sm" />
            <span class="sm:hidden">Registrar</span>
            <span class="hidden sm:inline">Registrar Máquina</span>
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="pl-3 md:pl-4">
        @if (kpisLoadingState.isLoading() && !sequentialState.kpisError()) {
          <!-- Skeleton simplificado - se muestra cuando isLoading es true -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            @for (i of [1,2,3,4]; track i) {
              <app-loading-skeleton 
                type="kpi" 
                [isExiting]="kpisLoadingState.isSkeletonExiting()" />
            }
          </div>
        } @else if (sequentialState.kpisError()) {
          <div class="card bg-error/10 border border-error/20 rounded-3xl p-4 mb-4">
            <div class="flex items-center gap-3">
              <ui-icon name="AlertCircle" size="sm" class="text-error" />
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
            <app-machine-kpis [kpis]="kpis()" />
          </div>
        } @else {
          <div 
            [class.opacity-0]="!sequentialState.canShowKPIs()" 
            [class.animate-fade-in]="sequentialState.canShowKPIs()" 
            [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <app-machine-kpis [kpis]="kpis()" />
          </div>
        }
      </div>

      <!-- Layout Principal: Lista de Máquinas (Full Width) -->
      <div class="page-entry-content">
        @if (!sequentialState.canShowContent()) {
          <!-- Mostrar skeleton mientras esperamos que los KPIs aparezcan -->
          @if (machinesLoadingState.isLoading() && !sequentialState.contentError()) {
            <!-- Skeleton simplificado - se muestra cuando isLoading es true -->
            <app-loading-skeleton 
              type="machine-list" 
              [count]="6"
              [isExiting]="machinesLoadingState.isSkeletonExiting()" />
          } @else if (sequentialState.contentError()) {
            <div class="card bg-error/10 border border-error/20 rounded-3xl p-6">
              <div class="flex flex-col items-center gap-4 text-center">
                <ui-icon name="AlertCircle" size="xl" class="text-error" />
                <div>
                  <h3 class="text-lg font-semibold text-error mb-2">Error al cargar máquinas</h3>
                  <p class="text-sm text-error/70 mb-4">No se pudieron cargar las máquinas desde el servidor.</p>
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
              [count]="6"
              [isExiting]="machinesLoadingState.isSkeletonExiting()" />
          }
        } @else {
          <!-- Solo renderizar el componente cuando canShowContent es true -->
          <div 
            [class.animate-fade-in]="sequentialState.canShowContent()" 
            [style.transition]="sequentialState.canShowContent() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowContent() ? 'translateY(0)' : 'translateY(12px)'"
            [style.opacity]="sequentialState.canShowContent() ? '1' : '0'">
            @if (sequentialState.contentError()) {
              <div class="card bg-error/10 border border-error/20 rounded-3xl p-6">
                <div class="flex flex-col items-center gap-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 class="text-lg font-semibold text-error mb-2">Error al cargar máquinas</h3>
                    <p class="text-sm text-error/70 mb-4">No se pudieron cargar las máquinas desde el servidor.</p>
                    <button (click)="retryLoad()" class="btn btn-sm btn-error">
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <app-machine-list
                [machines]="machines()"
                [viewMode]="viewMode()"
                [statusFilter]="statusFilter()"
                [documentFilter]="documentFilter()"
                [docStatusMap]="docStatusMap()"
                [alerts]="documentAlerts()"
                [isLoading]="isLoadingPage()"
                [totalOperativas]="kpis().operativas"
                (viewModeChange)="onViewModeChange($event)"
                (filterChange)="onFilterChange($event)"
                (documentFilterChange)="onDocumentFilterChange($event)" />
              
              <!-- Paginación -->
              @if (totalMachines() > 0) {
                <div class="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
                  <span>Mostrando {{ startRecord() }}-{{ endRecord() }} de {{ totalMachines() }} máquinas</span>
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
export class Maquinas implements OnInit, OnDestroy {
  private machineService = inject(MachineService);
  private loadingStateService = inject(LoadingStateService);
  private router = inject(Router);
  private navigationSubscription?: Subscription;

  viewMode = signal<ViewMode>('cards');
  statusFilter = signal<StatusFilter>('all');
  documentFilter = signal<DocumentFilter>('all');
  
  // Paginación
  currentPage = signal(1);
  itemsPerPage = 12;
  isLoadingPage = signal(false); // Indicador de carga para cambios de página
  private isLoadingMachines = false; // Flag para evitar múltiples peticiones simultáneas
  private machinesResponse = signal<{
    datos: Machine[];
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
  machinesLoadingState = this.loadingStateService.createLoadingState();
  
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
  // private machinesEffectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // private kpisEffectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // private machinesDataProcessed = signal(false);
  // private kpisDataProcessed = signal(false);
  // ============================================

  constructor() {
    // Iniciar estados de carga inmediatamente, antes del primer render
    this.kpisLoadingState.setLoading(true);
    this.machinesLoadingState.setLoading(true);
  }

  // Cargar máquinas con paginación
  private loadMachines(): void {
    // Evitar múltiples peticiones simultáneas
    if (this.isLoadingMachines) {
      return;
    }
    
    this.isLoadingMachines = true;
    
    // Si es la primera carga, usar isLoading, si es cambio de página, usar isLoadingPage
    const isFirstLoad = this.currentPage() === 1 && this.machinesResponse().datos.length === 0;
    if (isFirstLoad) {
      this.machinesLoadingState.setLoading(true);
    } else {
      this.isLoadingPage.set(true);
    }
    
    const filters: {
      estado?: string;
      search?: string;
      documento_estado?: 'vencidos' | 'por_vencer' | 'al_dia';
      page: number;
      per_page: number;
    } = {
      page: this.currentPage(),
      per_page: this.itemsPerPage
    };
    
    // Aplicar filtros
    if (this.statusFilter() !== 'all') {
      const estadoMap: Record<StatusFilter, string> = {
        'Operativa': 'operativa',
        'En Taller': 'en_taller',
        'Inactiva': 'inactiva',
        'all': ''
      };
      filters.estado = estadoMap[this.statusFilter()];
    }
    
    // Aplicar filtro de documentos
    if (this.documentFilter() !== 'all') {
      filters.documento_estado = this.documentFilter() as 'vencidos' | 'por_vencer' | 'al_dia';
    }
    
    console.log('Cargando máquinas con filtros:', filters);
    this.machineService.getMachines(filters).pipe(
      catchError((error) => {
        console.error('Error cargando máquinas:', error);
        this.sequentialState.setContentReady(true); // Marcar error
        this.machinesLoadingState.setDataLoaded();
        this.isLoadingPage.set(false);
        this.isLoadingMachines = false;
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
        console.log('Máquinas recibidas:', response);
        this.machinesResponse.set(response);
        this.machinesLoadingState.setDataLoaded();
        this.isLoadingPage.set(false);
        this.isLoadingMachines = false;
        if (!this.sequentialState.contentError()) {
          setTimeout(() => {
            this.sequentialState.setContentReady(false);
          }, 50);
        }
      },
      error: (error) => {
        console.error('Error cargando máquinas:', error);
        this.sequentialState.setContentReady(true);
        this.machinesLoadingState.setDataLoaded();
        this.isLoadingPage.set(false);
        this.isLoadingMachines = false;
      }
    });
  }

  machines = computed(() => this.machinesResponse().datos);
  totalMachines = computed(() => this.machinesResponse().total);
  totalPages = computed(() => this.machinesResponse().total_paginas);

  // Cargar KPIs con manejo de errores
  kpisData = toSignal(
    this.machineService.getKPIs().pipe(
      catchError((error) => {
        console.error('Error cargando KPIs:', error);
        this.sequentialState.setKPIsReady(true); // Marcar error
        setTimeout(() => {
          this.kpisLoadingState.setDataLoaded();
        }, 100);
        return of<MachineKPIsType>({ operativas: 0, en_taller: 0, inactivas: 0, documentos_por_vencer: 0 });
      })
    ),
    { initialValue: null }
  );

  kpis = computed(() => {
    const kpisData = this.kpisData();
    // Si aún no hay datos reales y estamos cargando, retornar KPIs vacíos para evitar mostrar 0s
    if (kpisData === null && this.kpisLoadingState.isLoading()) {
      return { operativas: 0, en_taller: 0, inactivas: 0, documentos_por_vencer: 0 };
    }
    return kpisData ?? { operativas: 0, en_taller: 0, inactivas: 0, documentos_por_vencer: 0 };
  });

  // Effect deshabilitado - las funciones de filtros y paginación manejan la recarga explícitamente
  // Esto evita dobles llamadas y problemas de timing
  
  // Effect para actualizar estado de carga
  private machinesLoadingEffect = effect(() => {
    const machines = this.machines();
    const isLoading = this.machinesLoadingState.isLoading();
    
    // Cuando hay datos y está cargando, marcar como cargado directamente
    if (machines.length > 0 && isLoading && !this.sequentialState.contentError()) {
      this.machinesLoadingState.setDataLoaded();
      // Coordinar con sequentialState para animaciones suaves
      setTimeout(() => {
        this.sequentialState.setContentReady(false);
      }, 50);
    } else if (this.sequentialState.contentError() && isLoading) {
      this.machinesLoadingState.setDataLoaded();
    }
  });

  private kpisEffect = effect(() => {
    const kpis = this.kpisData();
    const isLoading = this.kpisLoadingState.isLoading();
    
    // Cuando hay datos y está cargando, marcar como cargado directamente
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
  
  // ============================================
  // CÓDIGO ANTIGUO - COMENTADO (complejidad innecesaria)
  // ============================================
  // Effects con flags y timeouts complejos
  // private machinesEffect = effect(() => {
  //   const machines = this.machines();
  //   const isLoading = this.machinesLoadingState.isLoading();
  //   const alreadyProcessed = this.machinesDataProcessed();
  //   
  //   if (machines.length > 0 && isLoading && !this.sequentialState.contentError() && !alreadyProcessed) {
  //     if (this.machinesEffectTimeoutId) {
  //       clearTimeout(this.machinesEffectTimeoutId);
  //     }
  //     this.machinesDataProcessed.set(true);
  //     this.machinesEffectTimeoutId = setTimeout(() => {
  //       this.machinesLoadingState.setDataLoaded();
  //       setTimeout(() => {
  //         this.sequentialState.setContentReady(false);
  //       }, 50);
  //       this.machinesEffectTimeoutId = null;
  //     }, 300);
  //   } else if (this.sequentialState.contentError() && isLoading && !alreadyProcessed) {
  //     this.machinesDataProcessed.set(true);
  //     this.machinesLoadingState.setDataLoaded();
  //   }
  // });
  //
  // private kpisEffect = effect(() => {
  //   const kpis = this.kpisData();
  //   const isLoading = this.kpisLoadingState.isLoading();
  //   const alreadyProcessed = this.kpisDataProcessed();
  //   
  //   if (kpis !== null && isLoading && !this.sequentialState.kpisError() && !alreadyProcessed) {
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
  //   const showSkeleton = this.machinesLoadingState.showSkeleton();
  //   const isSkeletonExiting = this.machinesLoadingState.isSkeletonExiting();
  //   
  //   if (canShowContent && showSkeleton && !isSkeletonExiting) {
  //     // Lógica de sincronización
  //   }
  // });
  // ============================================

  // Función para reintentar carga
  retryLoad(): void {
    this.sequentialState.resetErrors();
    this.sequentialState.reset();
    this.machinesLoadingState.setLoading(true);
    this.currentPage.set(1);
    
    // Recargar máquinas
    this.loadMachines();
  }

  // Cargar alertas de documentación desde el backend (sin filtro de documentos)
  private documentAlertsResponse = signal<MachineDocumentAlerts>({
    vencidos: 0,
    por_vencer: 0,
    al_dia: 0
  });

  // Cargar alertas de documentación
  private loadDocumentAlerts(): void {
    const filters: {
      estado?: string;
    } = {};
    
    // Aplicar solo el filtro de estado operativo (no el de documentos)
    if (this.statusFilter() !== 'all') {
      const estadoMap: Record<StatusFilter, string> = {
        'Operativa': 'operativa',
        'En Taller': 'en_taller',
        'Inactiva': 'inactiva',
        'all': ''
      };
      filters.estado = estadoMap[this.statusFilter()];
    }
    
    this.machineService.getDocumentAlerts(filters).pipe(
      catchError((error) => {
        console.error('Error cargando alertas de documentos:', error);
        return of({ vencidos: 0, por_vencer: 0, al_dia: 0 });
      })
    ).subscribe({
      next: (alerts) => {
        this.documentAlertsResponse.set(alerts);
      }
    });
  }

  documentAlerts = computed(() => this.documentAlertsResponse());

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


  private isFirstLoad = true;

  ngOnInit(): void {
    // Cargar máquinas inicialmente
    this.loadMachines();
    // Cargar alertas de documentos inicialmente
    this.loadDocumentAlerts();
    
    // Suscribirse a eventos de navegación para resetear estados cuando se vuelve a la página
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Si la URL es la de máquinas y no es la primera carga, resetear estados de carga
        const isMachinesRoute = event.url === '/maquinas' || event.url.startsWith('/maquinas');
        if (isMachinesRoute && !this.isFirstLoad) {
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
    this.machinesLoadingState.setLoading(true);
  }
  
  // ============================================
  // CÓDIGO ANTIGUO - COMENTADO (complejidad innecesaria)
  // ============================================
  // private resetLoadingStates(): void {
  //   // Cancelar timeouts pendientes
  //   if (this.machinesEffectTimeoutId) {
  //     clearTimeout(this.machinesEffectTimeoutId);
  //     this.machinesEffectTimeoutId = null;
  //   }
  //   if (this.kpisEffectTimeoutId) {
  //     clearTimeout(this.kpisEffectTimeoutId);
  //     this.kpisEffectTimeoutId = null;
  //   }
  //   
  //   // Resetear flags de procesamiento
  //   this.machinesDataProcessed.set(false);
  //   this.kpisDataProcessed.set(false);
  //   
  //   // Resetear estados de carga secuencial primero
  //   this.sequentialState.reset();
  //   this.sequentialState.resetErrors();
  //   
  //   // Reiniciar estados de carga con delays complejos
  //   setTimeout(() => {
  //     this.kpisLoadingState.setLoading(true);
  //     this.machinesLoadingState.setLoading(true);
  //     setTimeout(() => {
  //       // Lógica compleja innecesaria
  //     }, 100);
  //   }, 0);
  // }
  // ============================================

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onFilterChange(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1); // Resetear a página 1 cuando cambian los filtros
    // Recargar explícitamente los datos
    untracked(() => {
      this.loadMachines();
      this.loadDocumentAlerts(); // Recargar alertas cuando cambia el filtro de estado
    });
  }

  onDocumentFilterChange(filter: DocumentFilter): void {
    this.documentFilter.set(filter);
    this.currentPage.set(1); // Resetear a página 1 cuando cambian los filtros
    // Recargar explícitamente los datos
    untracked(() => {
      this.loadMachines();
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
    const total = this.totalMachines();
    return Math.min(page * pageSize, total);
  });
  
  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      // Asegurar que se carguen los registros de la nueva página
      untracked(() => {
        this.loadMachines();
      });
    }
  }
  
  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      // Asegurar que se carguen los registros de la nueva página
      untracked(() => {
        this.loadMachines();
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
      this.loadMachines();
    });
  }

}
