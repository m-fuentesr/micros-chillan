import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🎭 GhostWire Skeleton - Registros Diarios
 * 
 * Skeleton de alta fidelidad que mapea exactamente la estructura final del componente
 * MachineDailyRecords para eliminar CLS (Cumulative Layout Shift) y reducir ansiedad de espera.
 * 
 * Características:
 * - Mapeo geométrico 1:1 con el contenido final
 * - Shimmer effect optimizado con transform (no background-position)
 * - Responsive: Cards en mobile (<XL), Tabla en desktop (>=XL)
 * - Respeta prefers-reduced-motion
 * - Contraste adaptativo para Light/Dark mode
 */
@Component({
  selector: 'app-machine-daily-records-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200/50 rounded-2xl overflow-hidden" 
         aria-busy="true" 
         aria-label="Cargando registros diarios">
      
      <!-- Header Premium con gradiente sutil -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex-1 min-w-0">
            <!-- Título skeleton -->
            <div class="flex items-start gap-3 sm:gap-4 mb-2">
              <div class="w-1 h-8 sm:h-10 lg:h-11 bg-primary rounded-full shrink-0"></div>
              <div class="skeleton-shimmer h-7 sm:h-8 lg:h-9 w-48 sm:w-56 rounded-lg"></div>
            </div>
            <!-- Descripción skeleton -->
            <div class="skeleton-shimmer h-3 sm:h-4 w-64 sm:w-80 rounded ml-4 sm:ml-5"></div>
          </div>
          
          <!-- Badge de conteo skeleton -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="skeleton-shimmer h-9 sm:h-10 w-28 sm:w-32 rounded-full"></div>
          </div>
        </div>
      </div>

      <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
        
        <!-- Filtros Mobile (< MD) -->
        <div class="md:hidden mb-4">
          <div class="sticky top-2 z-20">
            <div class="skeleton-shimmer h-11 w-full rounded-lg"></div>
          </div>
        </div>

        <!-- Filtros Desktop (>= MD) -->
        <div class="hidden md:block mb-6">
          <div class="grid grid-cols-4 gap-4">
            <div class="skeleton-shimmer h-11 rounded-lg"></div>
            <div class="skeleton-shimmer h-11 rounded-lg"></div>
            <div class="skeleton-shimmer h-11 rounded-lg"></div>
            <div class="skeleton-shimmer h-11 rounded-lg"></div>
          </div>
        </div>

        <!-- Vista Móvil: Cards (< XL) -->
        <div class="block xl:hidden space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="card bg-base-100 shadow-sm border border-base-200 rounded-2xl animate-skeleton-fade-in"
                 [style.animation-delay.ms]="i * 80">
              <div class="card-body p-5">
                <!-- Header: Fecha y Estado -->
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="skeleton-shimmer w-9 h-9 rounded-lg shrink-0"></div>
                    <div class="space-y-2">
                      <div class="skeleton-shimmer h-5 w-24 rounded"></div>
                      <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                    </div>
                  </div>
                  <div class="skeleton-shimmer h-6 w-20 rounded-full"></div>
                </div>

                <!-- Chofer -->
                <div class="flex items-center gap-3 mb-4 p-3 bg-base-50 rounded-lg border border-base-200">
                  <div class="skeleton-shimmer w-10 h-10 rounded-full shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="skeleton-shimmer h-4 w-36 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                  </div>
                </div>

                <!-- Divider -->
                <div class="divider my-2 opacity-30"></div>

                <!-- Información Financiera -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="skeleton-shimmer h-3 w-20 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-5 w-28 rounded"></div>
                  </div>
                  <div>
                    <div class="skeleton-shimmer h-3 w-16 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-5 w-24 rounded"></div>
                  </div>
                </div>

                <!-- Botón de Acción -->
                <div class="mt-4">
                  <div class="skeleton-shimmer h-9 w-full rounded-lg"></div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla (>= XL) -->
        <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 py-4 min-w-[140px]">
                  <div class="skeleton-shimmer h-3 w-16 rounded"></div>
                </th>
                <th class="py-4 min-w-[180px]">
                  <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                </th>
                <th class="py-4 text-right min-w-[120px]">
                  <div class="skeleton-shimmer h-3 w-20 rounded ml-auto"></div>
                </th>
                <th class="py-4 text-right min-w-[120px]">
                  <div class="skeleton-shimmer h-3 w-16 rounded ml-auto"></div>
                </th>
                <th class="py-4 text-right min-w-[120px]">
                  <div class="skeleton-shimmer h-3 w-12 rounded ml-auto"></div>
                </th>
                <th class="py-4 text-center min-w-[100px]">
                  <div class="skeleton-shimmer h-3 w-16 rounded mx-auto"></div>
                </th>
                <th class="py-4 text-center min-w-[80px]">
                  <div class="skeleton-shimmer h-3 w-10 rounded mx-auto"></div>
                </th>
                <th class="py-4 pr-6 text-right min-w-[120px]">
                  <div class="skeleton-shimmer h-3 w-20 rounded ml-auto"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (row of [1,2,3,4,5]; track row) {
                <tr class="border-b border-base-100 last:border-none animate-skeleton-fade-in"
                    [style.animation-delay.ms]="row * 60">
                  
                  <!-- Fecha -->
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="skeleton-shimmer w-8 h-8 rounded-lg shrink-0"></div>
                      <div class="space-y-2">
                        <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                        <div class="skeleton-shimmer h-3 w-28 rounded"></div>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Conductor -->
                  <td class="py-4">
                    <div class="flex items-center gap-2">
                      <div class="skeleton-shimmer w-8 h-8 rounded-full shrink-0"></div>
                      <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                    </div>
                  </td>
                  
                  <!-- Recaudado -->
                  <td class="text-right py-4">
                    <div class="skeleton-shimmer h-4 w-24 rounded ml-auto"></div>
                  </td>
                  
                  <!-- Diésel -->
                  <td class="text-right py-4">
                    <div class="skeleton-shimmer h-4 w-20 rounded ml-auto"></div>
                  </td>
                  
                  <!-- Neto -->
                  <td class="text-right py-4">
                    <div class="skeleton-shimmer h-4 w-24 rounded ml-auto"></div>
                  </td>
                  
                  <!-- Estado -->
                  <td class="text-center py-4">
                    <div class="skeleton-shimmer h-6 w-20 rounded-full mx-auto"></div>
                  </td>
                  
                  <!-- Observaciones -->
                  <td class="text-center py-4">
                    <div class="skeleton-shimmer w-8 h-8 rounded-full mx-auto"></div>
                  </td>
                  
                  <!-- Acciones -->
                  <td class="pr-6 text-right py-4">
                    <div class="skeleton-shimmer h-8 w-20 rounded-lg ml-auto"></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación skeleton -->
        <div class="p-4 border-t border-base-200 flex items-center justify-between">
          <div class="skeleton-shimmer h-4 w-48 rounded"></div>
          <div class="flex gap-2">
            <div class="skeleton-shimmer h-9 w-9 rounded"></div>
            <div class="skeleton-shimmer h-9 w-9 rounded"></div>
            <div class="skeleton-shimmer h-9 w-9 rounded"></div>
            <div class="skeleton-shimmer h-9 w-9 rounded"></div>
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
export class MachineDailyRecordsSkeleton {}

