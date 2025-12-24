import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🎭 GhostWire Skeleton - Panel Principal (Dashboard)
 * 
 * Skeleton de alta fidelidad que mapea exactamente la estructura final del componente Home
 * para eliminar CLS (Cumulative Layout Shift) y reducir ansiedad de espera.
 * 
 * Estructura replicada:
 * - Header Hero Section (título + descripción)
 * - 4 KPIs Cards (2 estándar + 2 personalizadas complejas)
 * - Gráfico Financiero (2/3) + Alertas (1/3)
 * - Tabla Registros Diarios (full width)
 */
@Component({
  selector: 'app-home-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6" aria-busy="true" aria-label="Cargando panel principal">
      
      <!-- Header Hero Section -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <!-- Título skeleton -->
            <div class="skeleton-shimmer h-8 md:h-10 lg:h-12 xl:h-14 w-48 md:w-56 lg:w-64 rounded-lg mb-2"></div>
            <!-- Descripción skeleton -->
            <div class="skeleton-shimmer h-3 md:h-4 w-64 md:w-80 lg:w-96 rounded ml-4 md:ml-5 mt-1"></div>
          </div>
        </div>
      </div>

      <!-- Zona VIP: 4 KPIs Cards -->
      <div class="pl-3 md:pl-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          
          <!-- KPI Card 1: Ganancia Neta (estándar) -->
          <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl overflow-hidden animate-skeleton-fade-in"
               [style.animation-delay.ms]="0">
            <div class="card-body p-4 md:p-5 gap-3 md:gap-4 min-h-[150px] md:min-h-[170px]">
              <div class="flex items-center gap-3">
                <div class="skeleton-shimmer w-10 h-10 rounded-xl shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="skeleton-shimmer h-3 w-24 rounded"></div>
                  <div class="skeleton-shimmer h-2 w-32 rounded"></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="skeleton-shimmer h-6 w-20 rounded-full"></div>
                <div class="skeleton-shimmer h-8 w-32 rounded"></div>
              </div>
            </div>
          </div>

          <!-- KPI Card 2: Recaudación Total (estándar) -->
          <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl overflow-hidden animate-skeleton-fade-in"
               [style.animation-delay.ms]="100">
            <div class="card-body p-4 md:p-5 gap-3 md:gap-4 min-h-[150px] md:min-h-[170px]">
              <div class="flex items-center gap-3">
                <div class="skeleton-shimmer w-10 h-10 rounded-xl shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="skeleton-shimmer h-3 w-28 rounded"></div>
                  <div class="skeleton-shimmer h-2 w-36 rounded"></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="skeleton-shimmer h-6 w-16 rounded-full"></div>
                <div class="skeleton-shimmer h-8 w-32 rounded"></div>
              </div>
            </div>
          </div>

          <!-- KPI Card 3: Flota en Ruta (personalizada compleja) -->
          <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl overflow-hidden animate-skeleton-fade-in"
               [style.animation-delay.ms]="200">
            <div class="card-body p-4 md:p-5 gap-3 md:gap-4 min-h-[150px] md:min-h-[170px]">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <div class="skeleton-shimmer w-10 h-10 rounded-xl shrink-0"></div>
                  <div class="space-y-2">
                    <div class="skeleton-shimmer h-3 w-24 rounded"></div>
                    <div class="flex items-center gap-1.5">
                      <div class="skeleton-shimmer w-2 h-2 rounded-full"></div>
                      <div class="skeleton-shimmer h-3 w-16 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between items-end">
                  <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                  <div class="skeleton-shimmer h-4 w-16 rounded"></div>
                </div>
                <div class="skeleton-shimmer h-2.5 w-full rounded-full"></div>
                <div class="skeleton-shimmer h-2 w-32 rounded ml-auto"></div>
              </div>
            </div>
          </div>

          <!-- KPI Card 4: Resumen de Salud (personalizada compleja) -->
          <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl overflow-hidden animate-skeleton-fade-in"
               [style.animation-delay.ms]="300">
            <div class="card-body p-4 md:p-5 gap-1 min-h-[150px] md:min-h-[170px]">
              <div class="px-5 pt-5 pb-2">
                <div class="skeleton-shimmer h-3 w-28 rounded"></div>
              </div>
              <div class="flex flex-col flex-1 gap-1 px-2 pb-2">
                <div class="flex-1 flex items-center justify-between rounded-3xl p-4">
                  <div class="flex items-center gap-2">
                    <div class="skeleton-shimmer w-2 h-2 rounded-full"></div>
                    <div class="skeleton-shimmer h-3 w-16 rounded"></div>
                  </div>
                  <div class="skeleton-shimmer h-6 w-8 rounded"></div>
                </div>
                <div class="flex gap-1 h-16">
                  <div class="flex-1 flex flex-col items-center justify-center rounded-3xl">
                    <div class="skeleton-shimmer h-5 w-6 rounded mb-1"></div>
                    <div class="skeleton-shimmer h-2 w-20 rounded"></div>
                  </div>
                  <div class="flex-1 flex flex-col items-center justify-center rounded-3xl">
                    <div class="skeleton-shimmer h-5 w-6 rounded mb-1"></div>
                    <div class="skeleton-shimmer h-2 w-20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zona de Análisis: Gráfico (2/3) + Alertas (1/3) -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 border-t-2 border-t-base-300 pt-6">
        
        <!-- Gráfico Financiero (2/3) -->
        <div class="xl:col-span-2 animate-skeleton-fade-in" [style.animation-delay.ms]="400">
          <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden h-[424px]">
            <div class="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-0 border-b border-base-200 bg-base-50/60">
              <div class="skeleton-shimmer h-4 w-56 rounded"></div>
              <div class="flex gap-1.5 sm:gap-2">
                <div class="skeleton-shimmer h-7 w-24 rounded-lg"></div>
                <div class="skeleton-shimmer h-7 w-24 rounded-lg"></div>
              </div>
            </div>
            <div class="card-body p-0 flex flex-col flex-1 min-h-0 relative">
              <div class="absolute inset-0 bg-gradient-to-b from-base-50/60 to-base-100 pointer-events-none"></div>
              <div class="relative h-full min-h-[200px] flex items-center justify-center">
                <!-- Área del gráfico skeleton -->
                <div class="w-full h-full flex flex-col items-center justify-center gap-4 px-4">
                  <div class="skeleton-shimmer h-32 w-full max-w-md rounded-lg"></div>
                  <div class="flex gap-2">
                    <div class="skeleton-shimmer h-2 w-16 rounded-full"></div>
                    <div class="skeleton-shimmer h-2 w-16 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alertas (1/3) -->
        <div class="xl:col-span-1 animate-skeleton-fade-in" [style.animation-delay.ms]="500">
          <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden h-[424px] flex flex-col">
            <div class="px-5 py-4 border-b border-base-200 flex items-center justify-between bg-base-100/80 backdrop-blur-md z-20 sticky top-0">
              <div class="flex items-center gap-3">
                <div class="skeleton-shimmer w-10 h-10 rounded-xl shrink-0"></div>
                <div class="space-y-1">
                  <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                  <div class="skeleton-shimmer h-3 w-24 rounded"></div>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <div class="skeleton-shimmer w-8 h-8 rounded"></div>
                <div class="skeleton-shimmer w-8 h-8 rounded"></div>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto bg-base-100 p-2 space-y-1 min-h-0">
              @for (i of [1,2,3]; track i) {
                <div class="bg-base-100 rounded-3xl border border-base-200 p-3 pl-4 animate-skeleton-fade-in"
                     [style.animation-delay.ms]="500 + (i * 50)">
                  <div class="flex gap-3 items-start">
                    <div class="skeleton-shimmer w-8 h-8 rounded-lg shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="flex justify-between items-center">
                        <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                        <div class="skeleton-shimmer h-3 w-16 rounded"></div>
                      </div>
                      <div class="skeleton-shimmer h-3 w-full rounded"></div>
                      <div class="skeleton-shimmer h-3 w-3/4 rounded"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla Registros Diarios (Full Width) -->
      <div class="border-t-2 border-t-base-300 pt-6 animate-skeleton-fade-in" [style.animation-delay.ms]="600">
        <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden">
          <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/60 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="skeleton-shimmer w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0"></div>
                <div class="space-y-1">
                  <div class="skeleton-shimmer h-6 sm:h-7 w-40 rounded"></div>
                  <div class="skeleton-shimmer h-4 w-64 rounded"></div>
                </div>
              </div>
              <div class="skeleton-shimmer h-7 w-28 rounded-full"></div>
            </div>
          </div>
          <div class="card-body p-6">
            <!-- Vista Mobile: Cards -->
            <div class="block xl:hidden space-y-4">
              @for (i of [1,2,3]; track i) {
                <div class="card bg-base-100 shadow-sm border border-base-200/70 rounded-2xl animate-skeleton-fade-in"
                     [style.animation-delay.ms]="600 + (i * 50)">
                  <div class="card-body p-5">
                    <div class="flex items-start gap-4 mb-4">
                      <div class="skeleton-shimmer w-12 h-12 rounded-lg shrink-0"></div>
                      <div class="flex-1 space-y-2">
                        <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                        <div class="skeleton-shimmer h-3 w-24 rounded"></div>
                      </div>
                      <div class="skeleton-shimmer h-6 w-20 rounded-full"></div>
                    </div>
                    <div class="divider my-3 opacity-30"></div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div class="skeleton-shimmer h-3 w-16 rounded mb-1"></div>
                        <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                      </div>
                      <div class="text-right">
                        <div class="skeleton-shimmer h-3 w-20 rounded mb-1 ml-auto"></div>
                        <div class="skeleton-shimmer h-4 w-28 rounded ml-auto"></div>
                      </div>
                    </div>
                    <div class="skeleton-shimmer h-9 w-full rounded-lg"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Vista Desktop: Tabla -->
            <div class="hidden xl:block">
              <table class="table w-full">
                <thead class="bg-base-50 text-base-content/50 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th class="py-4 pl-4 xl:pl-6"><div class="skeleton-shimmer h-3 w-16 rounded"></div></th>
                    <th class="py-4"><div class="skeleton-shimmer h-3 w-20 rounded"></div></th>
                    <th class="py-4 text-center"><div class="skeleton-shimmer h-3 w-12 rounded mx-auto"></div></th>
                    <th class="py-4 text-center"><div class="skeleton-shimmer h-3 w-14 rounded mx-auto"></div></th>
                    <th class="py-4 text-right"><div class="skeleton-shimmer h-3 w-24 rounded ml-auto"></div></th>
                    <th class="py-4 pr-4 xl:pr-6 text-right"><div class="skeleton-shimmer h-3 w-16 rounded ml-auto"></div></th>
                  </tr>
                </thead>
                <tbody class="text-sm">
                  @for (row of [1,2,3,4,5]; track row) {
                    <tr class="border-b border-base-100 last:border-0 animate-skeleton-fade-in"
                        [style.animation-delay.ms]="600 + (row * 40)">
                      <td class="pl-4 xl:pl-6 py-4">
                        <div class="flex items-center gap-2 xl:gap-3">
                          <div class="skeleton-shimmer w-8 h-8 xl:w-10 xl:h-10 rounded-lg shrink-0"></div>
                          <div class="space-y-1">
                            <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                            <div class="skeleton-shimmer h-2 w-12 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td class="py-4">
                        <div class="flex items-center gap-2">
                          <div class="skeleton-shimmer w-6 h-6 rounded-full shrink-0"></div>
                          <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                        </div>
                      </td>
                      <td class="text-center py-4">
                        <div class="skeleton-shimmer h-3 w-20 rounded mx-auto"></div>
                      </td>
                      <td class="text-center py-4">
                        <div class="skeleton-shimmer h-6 w-20 rounded-full mx-auto"></div>
                      </td>
                      <td class="text-right py-4">
                        <div class="skeleton-shimmer h-4 w-24 rounded ml-auto"></div>
                      </td>
                      <td class="pr-4 xl:pr-6 text-right py-4">
                        <div class="skeleton-shimmer h-8 w-20 rounded-lg ml-auto"></div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
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

    /* Accesibilidad: ocultar para lectores de pantalla */
    [aria-busy="true"] {
      pointer-events: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeSkeleton {}

