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
      
      <!-- Header Hero Section - Sin skeleton, se muestra directamente -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <!-- El contenido real se muestra aquí, no skeleton -->
          </div>
        </div>
      </div>

      <!-- Zona VIP: 4 KPIs Cards -->
      <div class="pl-3 md:pl-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          
          <!-- KPI Card 1: Ganancia Neta - Replica exacta del KpiCard default -->
          <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-skeleton-fade-in gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]"
               [style.animation-delay.ms]="0">
            <!-- Header: Icon + Title - Mismas clases exactas del componente default -->
            <div class="relative flex items-center gap-3">
              <!-- Icono: h-10 w-10 - El skeleton-shimmer ES el icono -->
              <div class="skeleton-shimmer rounded-xl shrink-0 ring-1 ring-base-200 h-10 w-10"></div>
              <div class="flex-1 min-w-0">
                <!-- Título: text-xs (12px) font-bold uppercase tracking-wider -->
                <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                <!-- Subtítulo: text-[10px] font-medium text-zinc-400 -->
                <div class="skeleton-shimmer h-2.5 w-40 rounded mt-0.5"></div>
              </div>
            </div>
            
            <!-- Body: Value - Mismas clases exactas del componente default -->
            <div class="relative flex flex-col">
              <!-- Valor: text-base sm:text-lg md:text-xl lg:text-2xl pl-[52px] font-black -->
              <div class="skeleton-shimmer rounded leading-tight h-6 sm:h-7 md:h-8 lg:h-9 pl-[52px] w-32 sm:w-36 md:w-40 lg:w-44"></div>
              
              <!-- Footer: Badge - Mismas clases exactas del componente default -->
              <div class="flex items-center mt-2 min-h-[24px] pl-[52px]">
                <!-- Badge: px-1.5 py-0.5 text-[10px] rounded ring-1 ring-inset -->
                <div class="skeleton-shimmer rounded px-1.5 py-0.5 h-5 w-28 sm:w-32 ring-1 ring-base-200"></div>
              </div>
            </div>
          </div>

          <!-- KPI Card 2: Recaudación Total - Replica exacta del KpiCard default -->
          <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-skeleton-fade-in gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]"
               [style.animation-delay.ms]="100">
            <!-- Header: Icon + Title - Mismas clases exactas del componente default -->
            <div class="relative flex items-center gap-3">
              <!-- Icono: h-10 w-10 - El skeleton-shimmer ES el icono -->
              <div class="skeleton-shimmer rounded-xl shrink-0 ring-1 ring-base-200 h-10 w-10"></div>
              <div class="flex-1 min-w-0">
                <!-- Título: text-xs (12px) font-bold uppercase -->
                <div class="skeleton-shimmer h-3 w-36 rounded"></div>
                <!-- Subtítulo: text-[10px] font-medium -->
                <div class="skeleton-shimmer h-2.5 w-44 rounded mt-0.5"></div>
              </div>
            </div>
            
            <!-- Body: Value - Mismas clases exactas del componente default -->
            <div class="relative flex flex-col">
              <!-- Valor: text-base sm:text-lg md:text-xl lg:text-2xl pl-[52px] font-black -->
              <div class="skeleton-shimmer rounded leading-tight h-6 sm:h-7 md:h-8 lg:h-9 pl-[52px] w-32 sm:w-36 md:w-40 lg:w-44"></div>
              
              <!-- Footer: Badge - Mismas clases exactas del componente default -->
              <div class="flex items-center mt-2 min-h-[24px] pl-[52px]">
                <!-- Badge: px-1.5 py-0.5 text-[10px] rounded ring-1 -->
                <div class="skeleton-shimmer rounded px-1.5 py-0.5 h-5 w-20 sm:w-24 ring-1 ring-base-200"></div>
              </div>
            </div>
          </div>

          <!-- KPI Card 3: Flota en Ruta - Replica exacta del componente real -->
          <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-skeleton-fade-in gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]"
               [style.animation-delay.ms]="200">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <!-- Icono: h-10 w-10 - El skeleton-shimmer ES el icono -->
                <div class="skeleton-shimmer rounded-xl shrink-0 ring-1 ring-base-200 h-10 w-10"></div>
                <div>
                  <!-- Título: text-xs (12px) font-bold -->
                  <div class="skeleton-shimmer h-3 w-28 rounded"></div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <!-- Indicador: w-2 h-2 rounded-full -->
                    <div class="skeleton-shimmer w-2 h-2 rounded-full"></div>
                    <!-- Texto: text-sm (14px) -->
                    <div class="skeleton-shimmer h-3.5 w-20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-end">
                <!-- Label: text-xs (12px) -->
                <div class="skeleton-shimmer h-3 w-28 rounded"></div>
                <!-- Valor: text-base sm:text-lg (16px/18px) -->
                <div class="skeleton-shimmer h-4 sm:h-5 w-20 rounded"></div>
              </div>
              <!-- Barra de progreso: h-2.5 con contenedor -->
              <div class="w-full bg-base-200 h-2.5 rounded-full overflow-hidden">
                <div class="skeleton-shimmer h-full w-3/4 rounded-full"></div>
              </div>
              <!-- Texto inferior: text-[10px] -->
              <div class="skeleton-shimmer h-2.5 w-48 rounded ml-auto"></div>
            </div>
          </div>

          <!-- KPI Card 4: Resumen de Salud - Replica exacta del componente real -->
          <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-skeleton-fade-in min-h-[150px] md:min-h-[170px]"
               [style.animation-delay.ms]="300">
            <!-- Header: px-5 pt-5 pb-2 para default -->
            <div class="px-5 pt-5 pb-2">
              <!-- Título: text-xs (12px) para default -->
              <div class="skeleton-shimmer h-3 w-36 rounded"></div>
            </div>
            <!-- Body: flex flex-col flex-1 gap-1 px-2 pb-2 -->
            <div class="flex flex-col flex-1 gap-1 px-2 pb-2">
              <!-- Sección Críticas: flex-1 flex items-center justify-between rounded-3xl bg-red-50/60 border border-red-100/50 px-4 -->
              <div class="flex-1 flex items-center justify-between rounded-3xl p-4">
                <div class="flex items-center gap-2">
                  <!-- Indicador: h-2 w-2 para default -->
                  <div class="skeleton-shimmer w-2 h-2 rounded-full"></div>
                  <!-- Label: text-xs (12px) para default -->
                  <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                </div>
                <!-- Valor: text-xl (20px) para default -->
                <div class="skeleton-shimmer h-5 w-10 rounded"></div>
              </div>
              <!-- Sección Advertencias e Info: flex gap-1 h-16 -->
              <div class="flex gap-1 h-16">
                <!-- Advertencias: flex-1 flex flex-col items-center justify-center rounded-3xl bg-amber-50/60 border border-amber-100/50 -->
                <div class="flex-1 flex flex-col items-center justify-center rounded-3xl">
                  <!-- Valor: text-lg (18px) para default -->
                  <div class="skeleton-shimmer h-5 w-8 rounded mb-1"></div>
                  <!-- Label: text-[10px] para default -->
                  <div class="skeleton-shimmer h-2.5 w-28 rounded"></div>
                </div>
                <!-- Info: flex-1 flex flex-col items-center justify-center rounded-3xl bg-blue-50/60 border border-blue-100/50 -->
                <div class="flex-1 flex flex-col items-center justify-center rounded-3xl">
                  <!-- Valor: text-lg (18px) para default -->
                  <div class="skeleton-shimmer h-5 w-8 rounded mb-1"></div>
                  <!-- Label: text-[10px] para default -->
                  <div class="skeleton-shimmer h-2.5 w-16 rounded"></div>
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
          <div class="card bg-white shadow-xl border border-zinc-200 flex flex-col overflow-hidden rounded-3xl h-[424px]">
            <div class="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-0 border-b border-zinc-100 bg-zinc-50/60">
              <div class="skeleton-shimmer h-4 w-56 rounded"></div>
              <div class="flex gap-1.5 sm:gap-2">
                <div class="skeleton-shimmer h-7 w-24 rounded-lg"></div>
                <div class="skeleton-shimmer h-7 w-24 rounded-lg"></div>
              </div>
            </div>
            <div class="card-body p-0 flex flex-col flex-1 min-h-0 relative">
              <div class="absolute inset-0 bg-gradient-to-b from-zinc-50/60 to-white pointer-events-none"></div>
              <div class="relative w-full flex items-end justify-center px-4 pb-6" style="height: 300px;">
                <!-- Área del gráfico skeleton con barras verticales -->
                <div class="w-full h-full flex items-end justify-center gap-3 sm:gap-4 max-w-4xl">
                  <!-- Eje Y con valores skeleton -->
                  <div class="flex flex-col justify-between shrink-0 pr-2" style="height: 250px;">
                    <div class="skeleton-shimmer h-3 w-12 rounded text-right"></div>
                    <div class="skeleton-shimmer h-3 w-12 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-12 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-12 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-12 rounded"></div>
                  </div>
                  
                  <!-- Barras verticales representativas -->
                  <div class="flex-1 flex items-end justify-center gap-2 sm:gap-3" style="height: 250px; align-items: flex-end;">
                    @for (bar of [1,2,3,4,5,6,7,8]; track bar) {
                      <div class="flex-1 flex flex-col items-center justify-end gap-2 animate-skeleton-fade-in max-w-[50px]"
                           [style.animation-delay.ms]="400 + (bar * 25)">
                        <!-- Contenedor de la barra con altura fija -->
                        <div class="relative w-full flex items-end justify-center"
                             [style.height.px]="getBarHeightPx(bar, 'outer')"
                             style="min-height: 90px;">
                          <!-- Barra exterior (Ingreso Bruto - gris) -->
                          <div class="skeleton-bar-outer w-full"
                               [style.height.px]="getBarHeightPx(bar, 'outer')"
                               style="min-width: 20px;">
                          </div>
                          
                          <!-- Barra interior (Ganancia Neta - gris más oscuro) -->
                          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 skeleton-bar-inner"
                               [style.width.%]="getBarWidth(bar)"
                               [style.height.px]="getBarHeightPx(bar, 'inner')"
                               style="min-width: 12px;">
                          </div>
                        </div>
                        
                        <!-- Etiqueta X-axis skeleton -->
                        <div class="skeleton-shimmer h-3 w-8 rounded mt-1"></div>
                      </div>
                    }
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
                <!-- Icono: rounded-xl bg-primary/10 text-primary w-11 h-11 sm:w-12 sm:h-12 - El skeleton-shimmer ES el icono -->
                <div class="skeleton-shimmer rounded-xl ring-1 ring-base-200 w-11 h-11 sm:w-12 sm:h-12 shrink-0"></div>
                <div class="space-y-1">
                  <!-- Título: text-xl sm:text-2xl font-bold -->
                  <div class="skeleton-shimmer h-6 sm:h-7 w-48 sm:w-56 rounded"></div>
                  <!-- Descripción: text-sm sm:text-base text-base-content/70 -->
                  <div class="skeleton-shimmer h-4 sm:h-5 w-64 sm:w-80 rounded"></div>
                </div>
              </div>
              <!-- Badge conteo: inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/70 -->
              <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/70 ring-1 ring-base-200/60">
                <div class="skeleton-shimmer w-1.5 h-1.5 rounded-full bg-base-300"></div>
                <div class="skeleton-shimmer h-3 w-20 rounded"></div>
              </div>
            </div>
          </div>
          <div class="card-body p-6">
            <!-- Vista Mobile: Cards -->
            <div class="block xl:hidden space-y-4">
              @for (i of [1,2,3]; track i) {
                <div class="card bg-base-100 shadow-sm border border-base-200/70 rounded-2xl animate-skeleton-fade-in"
                     [style.animation-delay.ms]="600 + (i * 50)">
                  <div class="card-body p-5">
                    <!-- Header: Avatares y Estado con estructura detallada -->
                    <div class="flex items-start gap-4 mb-4">
                      <!-- Avatar Máquina - El skeleton-shimmer ES el icono -->
                      <div class="avatar placeholder shrink-0">
                        <div class="skeleton-shimmer rounded-lg w-12 h-12 shadow-sm"></div>
                      </div>
                      <div class="flex-1 min-w-0 space-y-2">
                        <!-- Máquina: font-bold text-base -->
                        <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                        <!-- Conductor con icono -->
                        <div class="flex items-center gap-2">
                          <div class="skeleton-shimmer w-6 h-6 rounded-full border border-base-200"></div>
                          <div class="skeleton-shimmer h-3.5 w-28 rounded"></div>
                        </div>
                      </div>
                      <!-- Badge Estado -->
                      <div class="skeleton-shimmer h-6 w-20 rounded-full ring-1 ring-base-200 shrink-0"></div>
                    </div>
                    <div class="divider my-3 opacity-30"></div>
                    <!-- Grid Fecha y Recaudación -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <!-- Label: text-xs font-semibold uppercase -->
                        <div class="skeleton-shimmer h-3 w-16 rounded mb-1"></div>
                        <!-- Valor: font-mono text-sm -->
                        <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                      </div>
                      <div class="text-right">
                        <!-- Label: text-xs font-semibold uppercase -->
                        <div class="skeleton-shimmer h-3 w-20 rounded mb-1 ml-auto"></div>
                        <!-- Valor: font-mono font-bold text-sm -->
                        <div class="skeleton-shimmer h-4 w-28 rounded ml-auto"></div>
                      </div>
                    </div>
                    <!-- Botón de acción -->
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
                    <th class="py-4 pl-4 xl:pl-6 min-w-[160px]"><div class="skeleton-shimmer h-3 w-16 rounded"></div></th>
                    <th class="py-4 min-w-[140px]"><div class="skeleton-shimmer h-3 w-20 rounded"></div></th>
                    <th class="py-4 text-center min-w-[90px]"><div class="skeleton-shimmer h-3 w-12 rounded mx-auto"></div></th>
                    <th class="py-4 text-center min-w-[100px]"><div class="skeleton-shimmer h-3 w-14 rounded mx-auto"></div></th>
                    <th class="py-4 text-right min-w-[110px]"><div class="skeleton-shimmer h-3 w-24 rounded ml-auto"></div></th>
                    <th class="py-4 pr-4 xl:pr-6 text-right min-w-[120px]"><div class="skeleton-shimmer h-3 w-16 rounded ml-auto"></div></th>
                  </tr>
                </thead>
                <tbody class="text-sm">
                  @for (row of [1,2,3,4,5]; track row) {
                    <tr class="border-b border-base-100 last:border-0 animate-skeleton-fade-in hover:bg-base-50/50"
                        [style.animation-delay.ms]="600 + (row * 40)">
                      <!-- Máquina: Icono + Texto con estructura detallada -->
                      <td class="pl-4 xl:pl-6 py-4 font-medium min-w-0">
                        <div class="flex items-center gap-2 xl:gap-3">
                          <!-- Avatar placeholder - El skeleton-shimmer ES el icono -->
                          <div class="avatar placeholder shrink-0">
                            <div class="skeleton-shimmer rounded-lg w-8 h-8 xl:w-10 xl:h-10 shadow-sm"></div>
                          </div>
                          <div class="flex flex-col min-w-0">
                            <!-- "Máquina X" font-bold -->
                            <div class="skeleton-shimmer h-4 w-28 rounded"></div>
                            <!-- "Bus" text-[10px] text-base-content/40 -->
                            <div class="skeleton-shimmer h-2.5 w-12 rounded mt-0.5"></div>
                          </div>
                        </div>
                      </td>
                      <!-- Conductor: Icono + Nombre con estructura detallada -->
                      <td class="py-4 min-w-0">
                        <div class="flex items-center gap-2">
                          <!-- Avatar placeholder - El skeleton-shimmer ES el icono -->
                          <div class="avatar placeholder shrink-0">
                            <div class="skeleton-shimmer w-6 h-6 rounded-full border border-base-200"></div>
                          </div>
                          <!-- Nombre font-medium -->
                          <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                        </div>
                      </td>
                      <!-- Fecha: font-mono text-xs -->
                      <td class="text-center py-4 font-mono">
                        <div class="skeleton-shimmer h-3 w-16 rounded mx-auto"></div>
                      </td>
                      <!-- Estado: Badge con estructura detallada -->
                      <td class="text-center py-4">
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full">
                          <div class="skeleton-shimmer h-5 w-20 rounded-full ring-1 ring-base-200"></div>
                        </div>
                      </td>
                      <!-- Recaudación: font-mono font-bold text-xs xl:text-sm -->
                      <td class="text-right py-4 font-mono">
                        <div class="skeleton-shimmer h-4 w-24 rounded ml-auto"></div>
                      </td>
                      <!-- Acciones: Placeholder "···" o botón -->
                      <td class="pr-4 xl:pr-6 text-right py-4">
                        <div class="relative flex items-center justify-end min-h-[32px]">
                          <div class="skeleton-shimmer h-4 w-6 rounded text-base-content/40"></div>
                        </div>
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

    /* 
     * Barras del gráfico skeleton
     * Solo colores grises para mantener consistencia con el resto del skeleton
     */
    .skeleton-bar-outer {
      background: linear-gradient(
        180deg,
        hsl(var(--b2) / 0.6) 0%,
        hsl(var(--b2) / 0.8) 50%,
        hsl(var(--b2) / 0.6) 100%
      );
      border: 2px solid hsl(var(--b3) / 0.7);
      border-radius: 12px 12px 0 0;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px hsl(var(--b3) / 0.2);
      min-width: 20px;
      min-height: 40px;
    }

    .skeleton-bar-outer::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        hsl(var(--b1) / 0.4) 50%,
        transparent 100%
      );
      animation: skeleton-shimmer 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    .skeleton-bar-inner {
      background: linear-gradient(
        180deg,
        hsl(var(--b2) / 0.7) 0%,
        hsl(var(--b2) / 0.9) 50%,
        hsl(var(--b2) / 0.7) 100%
      );
      border-radius: 10px 10px 0 0;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 2px hsl(var(--b3) / 0.3);
      min-width: 12px;
      min-height: 30px;
    }

    .skeleton-bar-inner::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        hsl(var(--b1) / 0.5) 50%,
        transparent 100%
      );
      animation: skeleton-shimmer 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-bar-outer::after,
      .skeleton-bar-inner::after {
        animation: none;
      }
    }

    /* Accesibilidad: ocultar para lectores de pantalla */
    [aria-busy="true"] {
      pointer-events: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeSkeleton {
  /**
   * Calcula la altura en píxeles de la barra
   * Usa una altura base de 200px y calcula porcentajes sobre esa base
   */
  private readonly BASE_HEIGHT = 200;

  /**
   * Calcula la altura de la barra exterior (Ingreso Bruto) en píxeles
   * Simula diferentes alturas para hacer el skeleton más realista
   */
  getBarHeightPx(index: number, type: 'outer' | 'inner'): number {
    // Alturas variadas para simular datos reales (entre 45% y 98% de la altura base)
    const outerHeights = [92, 78, 98, 65, 88, 72, 85, 95];
    // La ganancia neta siempre es menor que el ingreso bruto
    const innerHeights = [68, 58, 75, 48, 65, 54, 62, 72];
    
    const percentage = type === 'outer' 
      ? (outerHeights[index - 1] || 85) 
      : (innerHeights[index - 1] || 60);
    
    const height = Math.round((this.BASE_HEIGHT * percentage) / 100);
    // Asegurar altura mínima de 40px para que siempre sea visible
    return Math.max(height, type === 'outer' ? 90 : 50);
  }

  /**
   * Calcula el ancho de la barra interior (Ganancia Neta)
   * La barra interior es más estrecha que la exterior (entre 50% y 65%)
   */
  getBarWidth(index: number): number {
    // Anchos variados para simular diferentes proporciones de ganancia
    const widths = [58, 62, 60, 55, 64, 57, 59, 61];
    return widths[index - 1] || 58;
  }
}


