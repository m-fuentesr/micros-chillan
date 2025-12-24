import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🎭 GhostWire Skeleton - Registro Diario Detalle
 * 
 * Skeleton de alta fidelidad que mapea exactamente la estructura final del componente
 * RegistroDiarioDetail para eliminar CLS (Cumulative Layout Shift) y reducir ansiedad de espera.
 * 
 * Características:
 * - Mapeo geométrico 1:1 con el contenido final
 * - Shimmer effect optimizado con transform (no background-position)
 * - Responsive: Adapta espaciados según breakpoints (sm, lg)
 * - Respeta prefers-reduced-motion
 * - Contraste adaptativo para Light/Dark mode
 */
@Component({
  selector: 'app-daily-record-detail-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="bg-base-200 min-h-screen">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8"
           aria-busy="true" 
           aria-label="Cargando detalle del registro diario">
        
        <!-- Hero Section Skeleton - Mapeo exacto del hero real -->
        <section class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/60 rounded-3xl border border-base-200 shadow-sm p-5 sm:p-7 lg:p-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <!-- Columna izquierda: Breadcrumb, Título, Badges -->
            <div class="flex-1 min-w-0 space-y-3">
              <!-- Breadcrumb skeleton -->
              <div class="flex items-center gap-2">
                <div class="skeleton-shimmer h-[11px] sm:h-3 w-28 sm:w-32 rounded"></div>
                <div class="h-3 w-px bg-base-300"></div>
                <div class="skeleton-shimmer h-[11px] sm:h-3 w-32 sm:w-36 rounded"></div>
              </div>

              <!-- Título y Badge de estado -->
              <div class="flex flex-wrap items-center gap-3 sm:gap-4">
                <!-- Botón volver skeleton -->
                <div class="skeleton-shimmer w-8 h-8 rounded-full shrink-0"></div>
                
                <!-- Título skeleton -->
                <div class="skeleton-shimmer h-8 sm:h-9 lg:h-10 w-40 sm:w-48 lg:w-56 rounded-lg"></div>
                
                <!-- Badge estado skeleton -->
                <div class="skeleton-shimmer h-6 sm:h-7 w-24 sm:w-28 rounded-full"></div>
              </div>

              <!-- Badges de información (Fecha, Máquina, Chofer) -->
              <div class="flex flex-wrap items-center gap-3">
                <div class="skeleton-shimmer h-7 sm:h-8 w-28 sm:w-32 rounded-full"></div>
                <div class="skeleton-shimmer h-7 sm:h-8 w-32 sm:w-36 rounded-full"></div>
                <div class="skeleton-shimmer h-7 sm:h-8 w-36 sm:w-40 rounded-full"></div>
              </div>
            </div>

            <!-- Columna derecha: Botón de acción -->
            <div class="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">
              <div class="skeleton-shimmer h-11 w-36 sm:w-40 rounded-lg"></div>
            </div>
          </div>
        </section>

        <!-- Grid Principal: 2/3 + 1/3 -->
        <div class="space-y-6 sm:space-y-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            
            <!-- Columna Principal (2/3) -->
            <div class="lg:col-span-2 space-y-4 sm:space-y-6">
              
              <!-- Toggle Día No Trabajado Card -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5 lg:p-6">
                  <div class="form-control w-full">
                    <div class="label justify-start gap-2 sm:gap-3 p-0 w-full">
                      <!-- Toggle skeleton (toggle-md sm:toggle-lg) -->
                      <div class="skeleton-shimmer w-12 h-6 sm:w-14 sm:h-7 rounded-full shrink-0"></div>
                      <div class="min-w-0 flex-1 flex flex-col overflow-hidden max-w-full space-y-1">
                        <!-- Label principal (text-xs sm:text-sm lg:text-base) -->
                        <div class="skeleton-shimmer h-4 sm:h-5 lg:h-6 w-48 sm:w-56 lg:w-64 rounded"></div>
                        <!-- Label secundario (text-[10px] sm:text-[11px] lg:text-xs) -->
                        <div class="skeleton-shimmer h-3 sm:h-3.5 lg:h-4 w-64 sm:w-72 lg:w-80 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Información Financiera Card -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5 lg:p-6">
                  <!-- Header con icono -->
                  <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-base-200">
                    <div class="skeleton-shimmer w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="skeleton-shimmer h-5 sm:h-6 w-48 sm:w-56 rounded"></div>
                      <div class="skeleton-shimmer h-3 sm:h-4 w-64 sm:w-72 rounded"></div>
                    </div>
                  </div>

                  <!-- Grid de campos financieros -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <!-- Monto Recaudado (full width) -->
                    <div class="form-control sm:col-span-2">
                      <div class="label">
                        <div class="skeleton-shimmer h-4 sm:h-5 w-40 sm:w-48 rounded"></div>
                      </div>
                      <!-- Input grande con símbolo $ (h-14 sm:h-16, text-2xl sm:text-3xl) -->
                      <div class="relative">
                        <div class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 bg-base-300 rounded"></div>
                        <div class="skeleton-shimmer h-14 sm:h-16 w-full rounded-lg pl-8 sm:pl-9"></div>
                      </div>
                      <div class="label">
                        <div class="skeleton-shimmer h-3 sm:h-4 w-56 sm:w-64 rounded label-text-alt"></div>
                      </div>
                    </div>

                    <!-- Costo Diésel -->
                    <div class="form-control">
                      <div class="label">
                        <div class="skeleton-shimmer h-4 sm:h-5 w-28 sm:w-32 rounded"></div>
                      </div>
                      <!-- Input con símbolo $ -->
                      <div class="input input-bordered flex items-center gap-2 bg-base-200/30">
                        <div class="w-3 h-3 bg-base-300 rounded"></div>
                        <div class="skeleton-shimmer h-11 sm:h-12 flex-1 rounded"></div>
                      </div>
                    </div>

                    <!-- Litros Cargados -->
                    <div class="form-control">
                      <div class="label">
                        <div class="skeleton-shimmer h-4 sm:h-5 w-32 sm:w-36 rounded"></div>
                      </div>
                      <!-- Input con badge LTS -->
                      <div class="input input-bordered flex items-center gap-2 bg-base-200/30">
                        <div class="skeleton-shimmer h-11 sm:h-12 flex-1 rounded"></div>
                        <div class="skeleton-shimmer h-5 w-10 rounded badge badge-sm badge-ghost"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selector de Emergencia Card -->
              <div class="card bg-red-50 border border-red-100 shadow-sm">
                <div class="card-body p-4 sm:p-5">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <!-- Icono (w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white) -->
                      <div class="skeleton-shimmer w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 bg-white"></div>
                      <div class="min-w-0 flex-1 space-y-1">
                        <!-- Texto principal (text-xs sm:text-sm font-bold) -->
                        <div class="skeleton-shimmer h-4 sm:h-5 w-36 sm:w-40 rounded"></div>
                        <!-- Texto secundario (text-[9px] sm:text-[10px]) -->
                        <div class="skeleton-shimmer h-3 w-48 sm:w-52 rounded"></div>
                      </div>
                    </div>
                    <!-- Toggle custom (w-11 h-6) -->
                    <div class="relative inline-flex items-center shrink-0">
                      <div class="skeleton-shimmer w-11 h-6 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Observaciones Card -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5 lg:p-6">
                  <!-- Título (card-title text-base sm:text-lg) -->
                  <div class="skeleton-shimmer h-5 sm:h-6 w-32 sm:w-40 rounded mb-2"></div>
                  <!-- Textarea skeleton (h-32) -->
                  <div class="skeleton-shimmer h-32 w-full rounded-lg textarea textarea-bordered"></div>
                </div>
              </div>
            </div>

            <!-- Sidebar (1/3) -->
            <div class="lg:col-span-1 space-y-4 sm:space-y-6">
              
              <!-- Comprobante del Registro Diario Card -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <!-- Header -->
                  <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div class="skeleton-shimmer h-4 sm:h-5 w-48 sm:w-52 rounded"></div>
                    <div class="skeleton-shimmer h-5 sm:h-6 w-16 sm:w-20 rounded-full"></div>
                  </div>
                  
                  <!-- Imagen skeleton (aspect 4:3) -->
                  <div class="skeleton-shimmer w-full aspect-[4/3] rounded-xl border border-base-300"></div>
                  
                  <!-- Metadata skeleton -->
                  <div class="mt-4 p-3 bg-base-200/50 rounded-lg space-y-2">
                    <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- Comprobante Diésel Card -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <!-- Header -->
                  <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div class="skeleton-shimmer h-4 sm:h-5 w-36 sm:w-40 rounded"></div>
                    <div class="skeleton-shimmer h-4 w-16 rounded"></div>
                    <div class="skeleton-shimmer h-5 sm:h-6 w-16 sm:w-20 rounded-full"></div>
                  </div>
                  
                  <!-- Imagen skeleton (aspect 4:3) -->
                  <div class="skeleton-shimmer w-full aspect-[4/3] rounded-xl border border-base-300"></div>
                  
                  <!-- Metadata skeleton -->
                  <div class="mt-4 p-3 bg-base-200/50 rounded-lg space-y-2">
                    <div class="skeleton-shimmer h-3 w-20 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- Desglose de Pago Card -->
              <div class="card bg-gradient-to-br from-white to-base-200 shadow-md border border-base-200 relative overflow-hidden">
                <!-- Decoración de esquina (igual que el componente real) -->
                <div class="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                
                <div class="card-body p-4 sm:p-5 relative z-10">
                  <!-- Título (text-[10px] sm:text-xs font-black uppercase tracking-widest) -->
                  <div class="skeleton-shimmer h-3 sm:h-4 w-32 sm:w-36 rounded mb-4 sm:mb-6"></div>
                  
                  <!-- Monto a pagar (flex flex-col gap-1) -->
                  <div class="flex flex-col gap-1 mb-4 sm:mb-6">
                    <!-- Subtítulo (text-xs sm:text-sm font-normal italic) -->
                    <div class="skeleton-shimmer h-3 sm:h-4 w-48 sm:w-56 rounded"></div>
                    <!-- Monto grande (text-2xl sm:text-3xl lg:text-4xl font-black) -->
                    <div class="skeleton-shimmer h-8 sm:h-9 lg:h-10 w-full rounded-lg"></div>
                  </div>
                  
                  <!-- Barra de progreso (h-1.5) -->
                  <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden mb-2">
                    <div class="skeleton-shimmer h-full w-3/4 rounded-full"></div>
                  </div>
                  
                  <!-- Labels (text-[9px] sm:text-[10px] font-mono uppercase) -->
                  <div class="flex justify-between">
                    <div class="skeleton-shimmer h-3 w-16 rounded"></div>
                    <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- Historial Card -->
              <div class="card bg-base-100 shadow-sm border border-base-200">
                <div class="card-body p-4 sm:p-5">
                  <!-- Título (font-bold text-sm sm:text-base) -->
                  <div class="flex items-center gap-2 mb-3 sm:mb-4">
                    <div class="skeleton-shimmer w-4 h-4 rounded shrink-0"></div>
                    <div class="skeleton-shimmer h-4 sm:h-5 w-24 sm:w-28 rounded"></div>
                  </div>
                  
                  <!-- Timeline skeleton (timeline timeline-vertical timeline-compact) -->
                  <ul class="timeline timeline-vertical timeline-compact -ml-2">
                    @for (item of [1,2,3]; track item; let last = $last) {
                      <li>
                        <!-- Timeline middle (punto) -->
                        <div class="timeline-middle">
                          <div class="skeleton-shimmer w-2 h-2 rounded-full" [class.ring-4]="!last" [class.ring-primary/20]="!last"></div>
                        </div>
                        <!-- Timeline end (contenido) -->
                        <div class="timeline-end timeline-box bg-transparent border-none shadow-none p-0 pl-3 mb-4 min-w-0 flex-1">
                          <!-- Usuario (text-xs font-bold) -->
                          <div class="skeleton-shimmer h-3 sm:h-4 w-32 sm:w-40 rounded mb-1"></div>
                          <!-- Acción y tiempo (text-[10px]) -->
                          <div class="skeleton-shimmer h-3 w-48 sm:w-56 rounded mb-1"></div>
                          <!-- Cambios (text-[10px], opcional) -->
                          <div class="skeleton-shimmer h-3 w-40 sm:w-48 rounded"></div>
                        </div>
                        @if (!last) {
                          <hr class="bg-base-200"/>
                        }
                      </li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
export class DailyRecordDetailSkeleton {}

