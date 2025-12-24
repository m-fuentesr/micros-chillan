import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🎭 GhostWire Skeleton - Contabilidad (Finanzas y Nómina)
 * 
 * Skeleton de alta fidelidad que mapea exactamente la estructura final del componente
 * Contabilidad para eliminar CLS (Cumulative Layout Shift) y reducir ansiedad de espera.
 * 
 * Características:
 * - Mapeo geométrico 1:1 con el contenido final
 * - Tipografía fantasma: Calcula dimensiones basándose en font-size y line-height reales
 * - Shimmer effect optimizado con transform (no background-position)
 * - Carga escalonada (staggered loading) para sensación orgánica
 * - Responsive: Adapta espaciados según breakpoints (sm, md, lg, xl)
 * - Respeta prefers-reduced-motion
 * - Contraste adaptativo para Light/Dark mode
 */
@Component({
  selector: 'app-contabilidad-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6" aria-busy="true" aria-label="Cargando finanzas y nómina">
      
      <!-- Hero Section Skeleton - Mapeo exacto del hero real -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-skeleton-fade-in"
           [style.animation-delay.ms]="0">
        <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4">
          <!-- Título skeleton (text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold) -->
          <div class="skeleton-shimmer h-8 md:h-9 lg:h-10 xl:h-12 w-64 md:w-72 lg:w-80 xl:w-96 rounded-lg mb-2"></div>
          <!-- Descripción skeleton (text-xs md:text-sm) -->
          <div class="skeleton-shimmer h-3 md:h-4 w-full max-w-2xl rounded mt-1"></div>
        </div>
      </div>

      <!-- Barra de Comandos: Tabs + Filtros Skeleton -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-base-200 pb-6 mb-6 animate-skeleton-fade-in"
           [style.animation-delay.ms]="100">
        
        <!-- Segmented Control (Tabs) Skeleton -->
        <div class="overflow-x-auto scrollbar-hide -mx-4 lg:mx-0 px-4 lg:px-0">
          <div class="tabs tabs-boxed bg-base-100/50 p-1 gap-1 inline-flex min-w-full lg:min-w-0">
            @for (tab of [1,2,3,4]; track tab) {
              <!-- Tab skeleton (h-11 px-4 sm:px-5) -->
              <div class="skeleton-shimmer h-11 px-4 sm:px-5 rounded-lg flex items-center gap-2 whitespace-nowrap"
                   [style.animation-delay.ms]="100 + (tab * 30)">
                <!-- Icono skeleton (w-4 h-4) -->
                <div class="skeleton-shimmer w-4 h-4 rounded shrink-0"></div>
                <!-- Texto skeleton (text-xs sm:text-sm) -->
                <div class="skeleton-shimmer h-3 sm:h-4 w-16 sm:w-20 rounded"></div>
              </div>
            }
          </div>
        </div>

        <!-- Filtros Globales Skeleton (solo visible en summary/weekly) -->
        @if (showFilters()) {
          <div class="flex flex-row items-center gap-2 w-full lg:w-auto animate-skeleton-fade-in"
               [style.animation-delay.ms]="250">
            <div class="grid grid-cols-[2fr_1fr] lg:flex lg:items-center gap-2 flex-1 min-w-0 bg-white p-1.5 rounded-xl border border-base-200 shadow-sm">
              <!-- Select Mes skeleton -->
              <div class="relative w-full min-w-0">
                <div class="skeleton-shimmer h-9 w-full rounded-lg pl-3 pr-8"></div>
                <!-- Icono chevron skeleton -->
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <div class="skeleton-shimmer w-3 h-3 rounded"></div>
                </div>
              </div>

              <!-- Separador (hidden lg:block) -->
              <div class="w-px h-4 bg-base-200 hidden lg:block"></div>

              <!-- Select Año skeleton -->
              <div class="relative w-full min-w-0">
                <div class="skeleton-shimmer h-9 w-full rounded-lg pl-3 pr-8"></div>
                <!-- Icono chevron skeleton -->
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <div class="skeleton-shimmer w-3 h-3 rounded"></div>
                </div>
              </div>
            </div>
            <!-- Botón refresh skeleton (btn-square btn-sm) -->
            <div class="skeleton-shimmer w-9 h-9 rounded-lg shrink-0 flex-shrink-0"></div>
          </div>
        }
      </div>

      <!-- Contenido de Tabs Skeleton -->
      <div class="card bg-base-100 shadow-xl animate-skeleton-fade-in min-h-[520px] lg:min-h-[560px] flex flex-col"
           [style.animation-delay.ms]="300">
        <div class="card-body flex-1 overflow-hidden">
          
          @if (activeTab() === 'summary') {
            <!-- Tab: Resumen General Skeleton -->
            <div class="space-y-8">
              
              <!-- KPIs Grid Skeleton (lg:grid-cols-12) -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                <!-- Hero Card: Ganancia Líquida (lg:col-span-5) -->
                <div class="lg:col-span-5 card bg-base-100 shadow-xl border-l-8 border-success h-full animate-skeleton-fade-in"
                     [style.animation-delay.ms]="400">
                  <div class="card-body flex flex-col justify-center gap-1">
                    <!-- Título (text-sm uppercase tracking-widest font-bold) -->
                    <div class="skeleton-shimmer h-4 w-40 rounded mb-2"></div>
                    
                    <!-- Monto grande (text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight) -->
                    <!-- Usando line-height aproximado: text-3xl ≈ h-9, text-4xl ≈ h-10, text-5xl ≈ h-12, text-6xl ≈ h-14 -->
                    <div class="skeleton-shimmer h-9 sm:h-10 md:h-12 xl:h-14 w-48 sm:w-56 md:w-64 xl:w-72 rounded-lg mt-2"></div>
                    
                    <!-- Badge skeleton (text-sm bg-base-200 px-3 py-1 rounded-full) -->
                    <div class="mt-4 flex items-center gap-2">
                      <!-- Icono TrendingUp (w-4 h-4) -->
                      <div class="skeleton-shimmer w-4 h-4 rounded shrink-0"></div>
                      <!-- Texto (text-sm) -->
                      <div class="skeleton-shimmer h-4 w-32 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <!-- Grid de 4 KPIs secundarios (lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4) -->
                <div class="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
                  @for (kpi of [1,2,3,4]; track kpi) {
                    <!-- KPI Card skeleton (size="medium") - Mapeo exacto de KpiCard -->
                    <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-skeleton-fade-in"
                         [style.animation-delay.ms]="450 + (kpi * 50)">
                      <!-- Background blur effect skeleton -->
                      <div class="absolute right-0 top-0 -mt-3 -mr-3 h-20 w-20 rounded-full opacity-50 blur-xl skeleton-shimmer"></div>
                      
                      <div class="relative gap-2 md:gap-3 p-3 md:p-4 min-h-[112px] md:min-h-[128px] flex flex-col">
                        <!-- Header: Icon + Title (gap-2.5 para medium) -->
                        <div class="flex items-center gap-2.5">
                          <!-- Icono (h-8 w-8 para size medium) -->
                          <div class="skeleton-shimmer h-8 w-8 rounded-xl shrink-0 ring-1 ring-base-200"></div>
                          <div class="flex-1 min-w-0">
                            <!-- Título (text-[10px] font-bold uppercase tracking-wider) -->
                            <div class="skeleton-shimmer h-3 w-24 sm:w-28 rounded"></div>
                            <!-- Subtítulo (text-[9px] font-medium) -->
                            <div class="skeleton-shimmer h-2.5 w-32 sm:w-36 rounded mt-0.5"></div>
                          </div>
                        </div>
                        
                        <!-- Body: Value (pl-[39px] para medium) -->
                        <div class="flex flex-col mt-auto">
                          <!-- Valor (text-[10px] sm:text-xs md:text-sm lg:text-base font-black) -->
                          <div class="skeleton-shimmer h-3 sm:h-3.5 md:h-4 lg:h-5 w-28 sm:w-32 md:w-36 rounded pl-[39px]"></div>
                          
                          <!-- Footer: Badge (mt-1.5 min-h-[20px] pl-[39px]) -->
                          <div class="mt-1.5 min-h-[20px] pl-[39px]">
                            <div class="skeleton-shimmer h-4 w-20 sm:w-24 rounded-full inline-block"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Separador Visual Skeleton -->
              <div class="divider text-base-content/30 text-xs uppercase tracking-widest my-8">
                <div class="skeleton-shimmer h-3 w-40 mx-auto rounded"></div>
              </div>

              <!-- Gráfico Skeleton - Mapeo exacto del componente AccountingChart -->
              <div class="card bg-base-100 shadow-sm border border-base-200 w-full animate-skeleton-fade-in"
                   [style.animation-delay.ms]="700">
                <div class="card-body p-6">
                  <!-- Header del gráfico -->
                  <div class="flex justify-between items-start mb-6">
                    <div class="space-y-2">
                      <!-- Título (text-lg font-bold) -->
                      <div class="skeleton-shimmer h-5 w-48 rounded"></div>
                      <!-- Descripción (text-sm) -->
                      <div class="skeleton-shimmer h-4 w-64 rounded"></div>
                    </div>
                  </div>
                  
                  <!-- Área del gráfico skeleton (h-[400px]) -->
                  <div class="w-full relative h-[400px]">
                    <div class="w-full h-full relative bg-base-50 rounded-xl border border-base-200/50 overflow-hidden p-6">
                      <!-- Gradiente de fondo -->
                      <div class="absolute inset-0 bg-gradient-to-b from-base-50/60 to-white pointer-events-none"></div>
                      
                      <!-- Contenedor del gráfico -->
                      <div class="relative h-full w-full rounded-xl border border-dashed border-base-200/80 overflow-hidden bg-white">
                        <div class="absolute inset-0 flex flex-col gap-3 p-6">
                          <!-- Eje Y labels (izquierda, w-12) -->
                          <div class="absolute left-0 top-6 bottom-6 w-12 flex flex-col justify-between">
                            @for (i of [1,2,3,4,5]; track i) {
                              <div class="skeleton-shimmer h-2.5 w-12 rounded"></div>
                            }
                          </div>
                          
                          <!-- Eje X labels (abajo, h-6) -->
                          <div class="absolute bottom-0 left-12 right-0 h-6 flex items-center justify-between px-6">
                            @for (i of [1,2,3,4,5,6,7]; track i) {
                              <div class="skeleton-shimmer h-2 w-10 rounded"></div>
                            }
                          </div>
                          
                          <!-- Área principal del gráfico (flex-1) -->
                          <div class="flex-1 rounded-xl skeleton-shimmer mt-8 mb-8 ml-12 mr-0"></div>
                        </div>
                      </div>
                      
                      <!-- Leyenda skeleton (centrada abajo) -->
                      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-6">
                        @for (i of [1,2,3]; track i) {
                          <div class="flex items-center gap-2">
                            <div class="skeleton-shimmer w-3 h-3 rounded-full"></div>
                            <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          @if (activeTab() === 'weekly') {
            <!-- Tab: Resumen Semanal Skeleton -->
            <div class="space-y-6 animate-skeleton-fade-in" [style.animation-delay.ms]="400">
              <!-- Header -->
              <div class="mb-6 flex flex-col gap-4">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="skeleton-shimmer h-7 w-48 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-3 w-64 rounded"></div>
                  </div>
                  <div class="bg-success/10 px-3 py-1.5 rounded-lg border border-success/20 border-l-4 border-l-success">
                    <div class="skeleton-shimmer h-3 w-20 rounded mb-1"></div>
                    <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- KPIs Grid 2x2 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                @for (kpi of [1,2,3,4]; track kpi) {
                  <div class="card bg-base-100 shadow-sm border border-base-200 rounded-xl animate-skeleton-fade-in"
                       [style.animation-delay.ms]="450 + (kpi * 50)">
                    <div class="card-body p-4 gap-3">
                      <div class="flex items-center gap-3">
                        <div class="skeleton-shimmer w-8 h-8 rounded-lg shrink-0"></div>
                        <div class="flex-1 space-y-1.5">
                          <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                          <div class="skeleton-shimmer h-2.5 w-24 rounded"></div>
                        </div>
                      </div>
                      <div class="skeleton-shimmer h-5 w-24 rounded"></div>
                    </div>
                  </div>
                }
              </div>

              <!-- Tabla skeleton -->
              <div class="hidden md:block overflow-hidden rounded-3xl border border-base-200">
                <table class="table w-full">
                  <thead class="bg-base-100 border-b border-base-200">
                    <tr>
                      @for (header of [1,2,3,4,5,6,7]; track header) {
                        <th class="pl-6 py-4">
                          <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of [1,2,3,4,5]; track row) {
                      <tr class="border-b border-base-100 last:border-none animate-skeleton-fade-in"
                          [style.animation-delay.ms]="600 + (row * 40)">
                        @for (cell of [1,2,3,4,5,6,7]; track cell) {
                          <td class="pl-6 py-4">
                            <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @if (activeTab() === 'payroll') {
            <!-- Tab: Liquidación Skeleton - Usar el skeleton existente -->
            <div class="animate-skeleton-fade-in" [style.animation-delay.ms]="400">
              <!-- El skeleton de liquidación ya existe como componente separado -->
              <!-- Aquí solo mostramos un placeholder mientras se carga -->
              <div class="space-y-4">
                <div class="skeleton-shimmer h-8 w-48 rounded"></div>
                <div class="skeleton-shimmer h-96 w-full rounded-lg"></div>
              </div>
            </div>
          }

          @if (activeTab() === 'history') {
            <!-- Tab: Historial Skeleton -->
            <div class="animate-skeleton-fade-in" [style.animation-delay.ms]="400">
              <!-- Tabla skeleton -->
              <div class="overflow-hidden rounded-3xl border border-base-200">
                <table class="table w-full">
                  <thead class="bg-base-50 border-b border-base-200">
                    <tr>
                      @for (header of [1,2,3,4,5,6]; track header) {
                        <th class="pl-6 py-4">
                          <div class="skeleton-shimmer h-3 w-24 rounded"></div>
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of [1,2,3,4,5]; track row) {
                      <tr class="border-b border-base-100 last:border-none animate-skeleton-fade-in"
                          [style.animation-delay.ms]="500 + (row * 40)">
                        @for (cell of [1,2,3,4,5,6]; track cell) {
                          <td class="pl-6 py-4">
                            <div class="skeleton-shimmer h-4 w-28 rounded"></div>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* 
     * 🎭 GhostWire Shimmer Effect
     * Optimizado con transform (GPU-accelerated) para evitar repaints costosos
     * Velocidad: 1.8s (punto dulce entre ansiedad y percepción de cuelgue)
     */
    .skeleton-shimmer {
      position: relative;
      background: linear-gradient(
        90deg,
        hsl(var(--b2) / 0.5) 0%,
        hsl(var(--b2) / 0.8) 50%,
        hsl(var(--b2) / 0.5) 100%
      );
      background-size: 200% 100%;
      overflow: hidden;
      will-change: transform;
    }

    .skeleton-shimmer::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        hsl(var(--b1) / 0.6) 50%,
        transparent 100%
      );
      animation: skeleton-shimmer 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    @keyframes skeleton-shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    /* 
     * Fade-in escalonado para carga orgánica
     * Timing: 400ms con curva de aceleración natural
     */
    @keyframes skeleton-fade-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-skeleton-fade-in {
      animation: skeleton-fade-in 400ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    /* 
     * Respeto por prefers-reduced-motion (a11y)
     * Usuarios con sensibilidad al movimiento ven skeleton estático
     */
    @media (prefers-reduced-motion: reduce) {
      .skeleton-shimmer::after {
        animation: none;
      }
      
      .animate-skeleton-fade-in {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    /* 
     * Dark mode: Contraste adaptativo
     * Reduce opacidad para evitar "flashbang" blanco en modo oscuro
     */
    @media (prefers-color-scheme: dark) {
      .skeleton-shimmer {
        background: linear-gradient(
          90deg,
          hsl(var(--b2) / 0.3) 0%,
          hsl(var(--b2) / 0.5) 50%,
          hsl(var(--b2) / 0.3) 100%
        );
      }

      .skeleton-shimmer::after {
        background: linear-gradient(
          90deg,
          transparent 0%,
          hsl(var(--b1) / 0.3) 50%,
          transparent 100%
        );
      }
    }

    /* Ocultar scrollbar pero mantener funcionalidad */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }

    /* Accesibilidad: ocultar para lectores de pantalla */
    [aria-busy="true"] {
      pointer-events: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContabilidadSkeleton {
  // Input para controlar qué tab mostrar en el skeleton
  activeTab = input<'summary' | 'weekly' | 'payroll' | 'history'>('summary');
  
  // Input para mostrar/ocultar filtros (solo visible en summary/weekly)
  showFilters = input<boolean>(true);

}

