import { Component, ChangeDetectionStrategy, input, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de skeleton reutilizable para mostrar placeholders de carga.
 * 
 * @example
 * ```html
 * <!-- Skeleton de KPI -->
 * <app-loading-skeleton type="kpi" />
 * 
 * <!-- Skeleton de tabla con 5 filas -->
 * <app-loading-skeleton type="table" [count]="5" />
 * 
 * <!-- Skeleton de card -->
 * <app-loading-skeleton type="card" />
 * 
 * <!-- Skeleton personalizado -->
 * <app-loading-skeleton type="custom" [width]="'200px'" [height]="'100px'" />
 * ```
 */
@Component({
  selector: 'app-loading-skeleton',
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()" [class.skeleton-exiting]="isExiting()" [class.skeleton-entering]="!isExiting() && showEntering()">
      @switch (type()) {
        @case ('kpi') {
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5">
              <div class="h-4 w-24 skeleton-shimmer rounded mb-3"></div>
              <div class="h-8 w-32 skeleton-shimmer rounded mb-2"></div>
              <div class="h-3 w-20 skeleton-shimmer rounded"></div>
            </div>
          </div>
        }
        @case ('table') {
          <div class="space-y-2">
            <!-- Header -->
            <div class="flex gap-4 pb-2 border-b border-base-200">
              @for (col of tableColumns(); track $index) {
                <div [class]="col" class="h-4 skeleton-shimmer rounded"></div>
              }
            </div>
            <!-- Rows -->
            @for (row of rows(); track $index) {
              <div class="flex gap-4 py-3">
                @for (col of tableColumns(); track $index) {
                  <div [class]="col" class="h-4 skeleton-shimmer rounded"></div>
                }
              </div>
            }
          </div>
        }
        @case ('card') {
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5">
              <div class="h-6 w-3/4 skeleton-shimmer rounded mb-4"></div>
              <div class="space-y-2">
                <div class="h-4 w-full skeleton-shimmer rounded"></div>
                <div class="h-4 w-5/6 skeleton-shimmer rounded"></div>
                <div class="h-4 w-4/6 skeleton-shimmer rounded"></div>
              </div>
            </div>
          </div>
        }
        @case ('list') {
          <div class="space-y-3">
            @for (item of rows(); track $index) {
              <div class="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-200">
                <div class="w-10 h-10 skeleton-shimmer rounded-full flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-3/4 skeleton-shimmer rounded"></div>
                  <div class="h-3 w-1/2 skeleton-shimmer rounded"></div>
                </div>
              </div>
            }
          </div>
        }
        @case ('text') {
          <div class="space-y-2">
            @for (line of textLines(); track $index) {
              <div [class]="line" class="h-4 skeleton-shimmer rounded"></div>
            }
          </div>
        }
        @case ('avatar') {
          <div class="w-12 h-12 skeleton-shimmer rounded-full"></div>
        }
        @case ('custom') {
          <div 
            [style.width]="width() || '100%'"
            [style.height]="height() || '100px'"
            class="skeleton-shimmer rounded-lg">
          </div>
        }
        @case ('worker-header') {
          <div class="relative pt-10 pb-20 px-6 rounded-b-[3rem] bg-gradient-to-br from-slate-200 to-slate-300">
            <div class="flex justify-between items-start">
              <div class="space-y-3">
                <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                <div class="h-8 w-48 skeleton-shimmer rounded"></div>
                <div class="h-6 w-32 skeleton-shimmer rounded-full"></div>
              </div>
              <div class="space-y-2">
                <div class="h-8 w-12 skeleton-shimmer rounded"></div>
                <div class="h-4 w-16 skeleton-shimmer rounded"></div>
              </div>
            </div>
          </div>
        }
        @case ('worker-timeline') {
          <div class="space-y-0 relative pl-2">
            <div class="absolute left-[19px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
            @for (i of [1,2,3]; track i) {
              <div class="relative pl-10 pb-8">
                <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
                  <div class="w-2.5 h-2.5 skeleton-shimmer rounded-full"></div>
                </div>
                <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100">
                  <div class="flex justify-between items-start mb-1">
                    <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                  </div>
                  <div class="h-3 w-48 skeleton-shimmer rounded mt-1"></div>
                </div>
              </div>
            }
          </div>
        }
        @case ('worker-stats') {
          <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 flex justify-between items-center divide-x divide-slate-100">
            <div class="flex-1 text-left px-2 pl-4 border-l-4 border-l-slate-200">
              <div class="h-3 w-20 skeleton-shimmer rounded mb-1"></div>
              <div class="h-8 w-24 skeleton-shimmer rounded"></div>
            </div>
            <div class="flex-1 text-left px-2 pl-4 border-l-4 border-l-slate-200">
              <div class="h-3 w-24 skeleton-shimmer rounded mb-1"></div>
              <div class="h-8 w-32 skeleton-shimmer rounded"></div>
            </div>
          </div>
        }
        @case ('worker-form') {
          <div class="space-y-6">
            <!-- Select de máquinas -->
            <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-1">
              <div class="flex items-center p-4 gap-4">
                <div class="w-12 h-12 skeleton-shimmer rounded-xl"></div>
                <div class="flex-1">
                  <div class="h-3 w-24 skeleton-shimmer rounded mb-2"></div>
                  <div class="h-6 w-full skeleton-shimmer rounded"></div>
                </div>
              </div>
            </div>
            <!-- Campo de recaudado -->
            <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 border-l-4 border-slate-200">
              <div class="h-3 w-32 skeleton-shimmer rounded mb-2"></div>
              <div class="h-12 w-3/4 skeleton-shimmer rounded"></div>
              <div class="h-3 w-48 skeleton-shimmer rounded mt-2"></div>
            </div>
            <!-- Campos de combustible -->
            <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5">
              <div class="h-4 w-40 skeleton-shimmer rounded mb-4"></div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                  <div class="h-12 w-full skeleton-shimmer rounded-xl"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                  <div class="h-12 w-full skeleton-shimmer rounded-xl"></div>
                </div>
              </div>
            </div>
            <!-- Área de imagen -->
            <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5">
              <div class="h-3 w-32 skeleton-shimmer rounded mb-3"></div>
              <div class="w-full aspect-[3/1] skeleton-shimmer rounded-xl"></div>
            </div>
            <!-- Textarea -->
            <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5">
              <div class="h-20 w-full skeleton-shimmer rounded-xl"></div>
            </div>
          </div>
        }
        @case ('machine-list') {
          <div class="card bg-base-100 shadow-xl">
            <!-- Header skeleton -->
            <div class="card-header p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6">
              <!-- Título y descripción -->
              <div class="mb-6 sm:mb-8">
                <div class="h-8 w-64 skeleton-shimmer rounded mb-3"></div>
                <div class="h-4 w-96 skeleton-shimmer rounded hidden sm:block"></div>
              </div>
              
              <!-- Filtros skeleton -->
              <div class="border-t border-base-200/50 pt-4">
                <div class="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  <!-- Filtros de estado operativo -->
                  <div class="flex-1">
                    <div class="h-4 w-32 skeleton-shimmer rounded mb-3"></div>
                    <div class="flex flex-wrap gap-2">
                      @for (i of [1,2,3,4]; track i) {
                        <div class="h-8 w-20 skeleton-shimmer rounded-full"></div>
                      }
                    </div>
                  </div>
                  
                  <!-- Separador -->
                  <div class="hidden lg:block w-px bg-base-200/50"></div>
                  
                  <!-- Filtros de documentos -->
                  <div class="flex-1">
                    <div class="h-4 w-36 skeleton-shimmer rounded mb-3"></div>
                    <div class="flex flex-wrap gap-2">
                      @for (i of [1,2,3,4]; track i) {
                        <div class="h-8 w-24 skeleton-shimmer rounded-full"></div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Body skeleton -->
            <div class="card-body">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (i of rows(); track i) {
                  <div class="card bg-base-100 shadow-sm border border-base-200">
                    <div class="card-body p-5">
                      <div class="h-6 w-3/4 skeleton-shimmer rounded mb-4"></div>
                      <div class="space-y-2">
                        <div class="h-4 w-full skeleton-shimmer rounded"></div>
                        <div class="h-4 w-5/6 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-4/6 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    
    @keyframes skeletonFadeIn {
      0% {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes skeletonFadeOut {
      0% {
        opacity: 1;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(0.98);
      }
    }
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
    
    .skeleton-entering {
      animation: skeletonFadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .skeleton-exiting {
      animation: skeletonFadeOut 200ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      pointer-events: none;
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSkeleton implements OnInit {
  /**
   * Tipo de skeleton: kpi, table, card, list, text, avatar, custom, worker-header, worker-timeline, worker-stats, worker-form, machine-list
   * @default 'card'
   */
  type = input<'kpi' | 'table' | 'card' | 'list' | 'text' | 'avatar' | 'custom' | 'worker-header' | 'worker-timeline' | 'worker-stats' | 'worker-form' | 'machine-list'>('card');

  /**
   * Indica si el skeleton está en estado de salida (animación fade-out)
   * @default false
   */
  isExiting = input<boolean>(false);
  
  /**
   * Indica si el skeleton ya ha entrado (para controlar la animación de entrada)
   */
  private hasEntered = signal<boolean>(false);
  
  /**
   * Determina si debe mostrarse la animación de entrada
   */
  showEntering = computed(() => {
    if (this.isExiting()) {
      this.hasEntered.set(false);
      return false;
    }
    if (!this.hasEntered()) {
      this.hasEntered.set(true);
      return true;
    }
    return false;
  });

  ngOnInit(): void {
    // Resetear hasEntered cuando el componente se inicializa para asegurar que la animación se muestre
    this.hasEntered.set(false);
  }

  /**
   * Cantidad de elementos a mostrar (para table, list, text)
   * @default 3
   */
  count = input<number>(3);

  /**
   * Ancho personalizado (solo para type="custom")
   */
  width = input<string | undefined>(undefined);

  /**
   * Alto personalizado (solo para type="custom")
   */
  height = input<string | undefined>(undefined);

  /**
   * Clases del contenedor
   */
  containerClasses = () => {
    return 'w-full';
  };

  /**
   * Genera las filas según el count
   */
  rows = computed(() => {
    return Array(this.count()).fill(0);
  });

  /**
   * Columnas para skeleton de tabla
   */
  tableColumns = () => {
    return [
      'flex-1',
      'flex-1',
      'w-24',
      'w-32',
      'w-20'
    ];
  };

  /**
   * Líneas de texto para skeleton de texto
   */
  textLines = () => {
    const lines = [];
    for (let i = 0; i < this.count(); i++) {
      if (i === this.count() - 1) {
        lines.push('w-3/4'); // Última línea más corta
      } else {
        lines.push('w-full');
      }
    }
    return lines;
  };
}

