import { Component, ChangeDetectionStrategy, input, computed, signal, OnInit, effect } from '@angular/core';
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
        @case ('responsive-kpis') {
          <!-- 🎭 GhostWire Skeleton: KpiCard responsive - Replica exacta del componente real -->
          <div class="grid grid-cols-2 md:grid-cols-4">
            @for (i of [1,2,3,4]; track i) {
              <!-- KPI Card skeleton - Replica exacta usando las clases exactas del componente -->
              <!-- El componente aplica clases completas según viewport: compact/medium/default -->
              <!-- En desktop: gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px] -->
              <!-- Resultado final: móvil gap-1.5 p-2, tablet gap-3 p-4, desktop gap-4 p-5 -->
              <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] skeleton-entering gap-1.5 md:gap-3 lg:gap-4 p-2 md:p-4 lg:p-5 min-h-[75px] md:min-h-[85px] lg:min-h-[150px] md:min-h-[170px]"
                   [style.animation-delay.ms]="i * 50">
                
                <!-- Header: Icon + Title - Mismas clases exactas del componente -->
                <div class="relative flex items-center gap-2 md:gap-2.5 lg:gap-3">
                  <!-- Icono: h-5 w-5 compact, h-8 w-8 medium, h-10 w-10 default -->
                  <div class="skeleton-shimmer rounded-xl shrink-0 ring-1 ring-base-200 h-5 w-5 md:h-8 md:w-8 lg:h-10 lg:w-10"></div>
                  <div class="flex-1 min-w-0">
                    <!-- Título: text-[10px] compact/medium, text-xs default (12px) -->
                    <div class="skeleton-shimmer h-[10px] lg:h-3 rounded" style="width: 60px;"></div>
                    <!-- Subtítulo: text-[8px] compact, text-[9px] medium, text-[10px] default -->
                    <div class="skeleton-shimmer h-2 md:h-2.5 lg:h-2.5 rounded mt-0.5" style="width: 50px;"></div>
                  </div>
                </div>
                
                <!-- Body: Value - Mismas clases exactas del componente -->
                <div class="relative flex flex-col">
                  <!-- Valor: compact text-[9px] sm:text-[10px] md:text-xs lg:text-sm, medium text-[10px] sm:text-xs md:text-sm lg:text-base, default text-base sm:text-lg md:text-xl lg:text-2xl -->
                  <div class="skeleton-shimmer rounded leading-tight h-[10px] sm:h-[11px] md:h-[14px] lg:h-6 pl-[28px] md:pl-[39px] lg:pl-[52px]" style="width: 30px;"></div>
                  
                  <!-- Footer: Badge - Mismas clases exactas del componente -->
                  <div class="flex items-center mt-1 md:mt-1.5 lg:mt-2 min-h-[16px] md:min-h-[20px] lg:min-h-[24px] pl-[28px] md:pl-[39px] lg:pl-[52px]">
                    <!-- Badge: text-[8px] compact, text-[9px] medium, text-[10px] default -->
                    <div class="skeleton-shimmer rounded-full h-2 md:h-2.5 lg:h-2.5" style="width: 55px;"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
        @case ('weekly-summary') {
          <!-- 🎭 GhostWire Skeleton: WeeklySummaryTable - Replica exacta del componente real -->
          <div class="card bg-base-100 shadow-xl border border-base-200">
            <div class="card-body p-4 sm:p-6">
              <!-- Header - Replica exacta -->
              <div class="mb-6 flex flex-col gap-4">
                <div class="flex justify-between items-start">
                  <div>
                    <!-- Título: text-2xl font-bold border-l-4 border-l-primary pl-3 -->
                    <div class="border-l-4 border-l-primary pl-3">
                      <div class="skeleton-shimmer h-8 w-48 rounded"></div>
                    </div>
                    <!-- Subtítulo: text-xs sm:text-sm text-base-content/60 -->
                    <div class="skeleton-shimmer h-3 sm:h-4 w-40 rounded mt-2"></div>
                  </div>
                  <!-- Badge Total Mes: bg-success/10 px-3 py-1.5 rounded-lg border border-success/20 text-left pl-4 border-l-4 border-l-success -->
                  <div class="bg-success/10 px-3 py-1.5 rounded-lg border border-success/20 text-left pl-4 border-l-4 border-l-success">
                    <!-- text-[10px] text-success/80 uppercase font-bold tracking-wider -->
                    <div class="skeleton-shimmer h-3 w-20 rounded mb-1"></div>
                    <!-- font-bold text-success text-sm sm:text-base tabular-nums tracking-tight -->
                    <div class="skeleton-shimmer h-4 sm:h-5 w-32 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- KPIs: Grid 2x2 en móvil, 4 columnas en desktop - Usamos responsive-kpis -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                @for (i of [1,2,3,4]; track i) {
                  <!-- KPI Card skeleton - Usa las mismas clases que responsive-kpis -->
                  <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] skeleton-entering gap-1.5 md:gap-3 lg:gap-4 p-2 md:p-4 lg:p-5 min-h-[75px] md:min-h-[85px] lg:min-h-[150px] md:min-h-[170px]"
                       [style.animation-delay.ms]="i * 50">
                    
                    <!-- Header: Icon + Title -->
                    <div class="relative flex items-center gap-2 md:gap-2.5 lg:gap-3">
                      <div class="skeleton-shimmer rounded-xl shrink-0 ring-1 ring-base-200 h-5 w-5 md:h-8 md:w-8 lg:h-10 lg:w-10"></div>
                      <div class="flex-1 min-w-0">
                        <div class="skeleton-shimmer h-[10px] lg:h-3 rounded" style="width: 60px;"></div>
                        <div class="skeleton-shimmer h-2 md:h-2.5 lg:h-2.5 rounded mt-0.5" style="width: 50px;"></div>
                      </div>
                    </div>
                    
                    <!-- Body: Value -->
                    <div class="relative flex flex-col">
                      <div class="skeleton-shimmer rounded leading-tight h-[10px] sm:h-[11px] md:h-[14px] lg:h-6 pl-[28px] md:pl-[39px] lg:pl-[52px]" style="width: 30px;"></div>
                      
                      <!-- Footer: Badge -->
                      <div class="flex items-center mt-1 md:mt-1.5 lg:mt-2 pl-[28px] md:pl-[39px] lg:pl-[52px]">
                        <div class="skeleton-shimmer rounded-full h-2 md:h-2.5 lg:h-2.5" style="width: 55px;"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Vista Desktop: Tabla (md y arriba) - Replica exacta -->
              <div class="hidden md:block overflow-hidden rounded-3xl border border-base-200">
                <table class="table w-full">
                  <thead class="bg-base-100 border-b border-base-200">
                    <tr>
                      <th class="pl-6 w-48 text-base-content/70 text-xs font-bold uppercase tracking-wider">Semana</th>
                      <th class="text-left text-base-content/70 text-xs font-bold uppercase tracking-wider font-mono tabular-nums">Recaudado</th>
                      <th class="text-left text-base-content/70 text-xs font-bold uppercase tracking-wider font-mono tabular-nums">Combustible</th>
                      <th class="text-left text-base-content/70 text-xs font-bold uppercase tracking-wider font-mono tabular-nums">Mant.</th>
                      <th class="text-left text-base-content/70 text-xs font-bold uppercase tracking-wider font-mono tabular-nums">Egresos</th>
                      <th class="text-left pr-12 text-base-content/70 text-xs font-bold uppercase tracking-wider font-mono tabular-nums">Ganancia Neta</th>
                      <th class="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (i of [1,2,3,4,5]; track i) {
                      <tr class="group border-b border-base-100 last:border-none">
                        <!-- Semana -->
                        <td class="pl-6 py-4">
                          <div class="flex flex-col">
                            <!-- Semana X -->
                            <div class="skeleton-shimmer h-5 w-24 rounded mb-1"></div>
                            <!-- Fecha range -->
                            <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                          </div>
                        </td>
                        <!-- Recaudado -->
                        <td class="text-right">
                          <div class="skeleton-shimmer h-4 w-20 rounded ml-auto"></div>
                        </td>
                        <!-- Combustible -->
                        <td class="text-right">
                          <div class="skeleton-shimmer h-4 w-20 rounded ml-auto"></div>
                        </td>
                        <!-- Mant. -->
                        <td class="text-right">
                          <div class="skeleton-shimmer h-4 w-16 rounded ml-auto"></div>
                        </td>
                        <!-- Egresos -->
                        <td class="text-right">
                          <div class="skeleton-shimmer h-4 w-20 rounded ml-auto"></div>
                        </td>
                        <!-- Ganancia Neta -->
                        <td class="text-right pr-12">
                          <div class="skeleton-shimmer h-4 w-24 rounded ml-auto"></div>
                        </td>
                        <!-- Chevron -->
                        <td class="pr-6 text-right">
                          <div class="skeleton-shimmer h-4 w-4 rounded ml-auto"></div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Vista Móvil: Cards (sm y abajo) - Replica exacta -->
              <div class="md:hidden space-y-3">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="border border-base-200 rounded-3xl overflow-hidden">
                    <!-- Header card móvil -->
                    <div class="bg-base-100 p-4 flex justify-between items-center">
                      <div class="flex gap-3 items-center">
                        <!-- Badge Semana -->
                        <div class="bg-base-200 rounded-lg p-2 text-center min-w-[3rem]">
                          <div class="skeleton-shimmer h-3 w-8 rounded mb-1"></div>
                          <div class="skeleton-shimmer h-6 w-8 rounded"></div>
                        </div>
                        <div>
                          <!-- Fecha range -->
                          <div class="skeleton-shimmer h-3 w-32 rounded mb-1"></div>
                          <!-- Ganancia neta -->
                          <div class="skeleton-shimmer h-5 w-28 rounded"></div>
                        </div>
                      </div>
                      <!-- Chevron -->
                      <div class="skeleton-shimmer h-4 w-4 rounded"></div>
                    </div>
                    <!-- Grid de ingresos/egresos -->
                    <div class="px-4 pb-4 grid grid-cols-2 gap-2">
                      <div class="bg-base-50 p-2 rounded border border-base-100">
                        <div class="skeleton-shimmer h-3 w-16 rounded mb-1"></div>
                        <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                      </div>
                      <div class="bg-base-50 p-2 rounded border border-base-100">
                        <div class="skeleton-shimmer h-3 w-16 rounded mb-1"></div>
                        <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
        @case ('liquidation-history') {
          <!-- 🎭 GhostWire Skeleton: LiquidationHistory - Replica exacta del componente real -->
          <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden">
            <!-- Header - Replica exacta -->
            <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
              <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
                <div class="flex-1 min-w-0">
                  <!-- Título: text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2 -->
                  <div class="border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
                    <div class="skeleton-shimmer h-7 sm:h-8 lg:h-9 w-56 rounded"></div>
                  </div>
                  <!-- Subtítulo: text-xs sm:text-sm text-base-content/70 -->
                  <div class="skeleton-shimmer h-3 sm:h-4 w-64 rounded"></div>
                </div>
                
                <!-- Badge de conteo: inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm -->
                <div class="shrink-0">
                  <div class="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/30 shadow-sm">
                    <div class="skeleton-shimmer w-2 h-2 rounded-full bg-primary"></div>
                    <div class="skeleton-shimmer h-4 w-20 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6 pb-32 sm:pb-40 lg:pb-48">
              <!-- Filtros - Replica exacta de SearchFilters -->
              <div class="mb-6">
                <div class="bg-base-50/50 p-5 sm:p-6 rounded-3xl border border-base-200/50">
                  <!-- Header de Filtros -->
                  <div class="flex items-center justify-between gap-4 mb-5">
                    <div class="flex items-center gap-2">
                      <div class="w-1 h-4 rounded-full bg-primary"></div>
                      <div class="skeleton-shimmer h-4 w-32 rounded"></div>
                    </div>
                    <div class="skeleton-shimmer h-8 w-20 rounded-lg"></div>
                  </div>
                  
                  <!-- Grid de Filtros -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    @for (i of [1,2]; track i) {
                      <div class="form-control">
                        <div class="label py-1.5">
                          <div class="skeleton-shimmer h-3 w-24 rounded"></div>
                        </div>
                        <div class="skeleton-shimmer h-10 w-full rounded-lg"></div>
                      </div>
                    }
                  </div>
                </div>
              </div>
              
              <!-- Vista Desktop: Tabla (solo desde lg: 1024px) - Replica exacta -->
              <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
                <table class="table w-full table-fixed">
                  <thead class="bg-base-50 border-b border-base-200">
                    <tr>
                      <th class="pl-6 w-2/5 text-xs font-bold uppercase tracking-widest text-base-content/60">Período</th>
                      <th class="w-1/5 text-xs font-bold uppercase tracking-widest text-base-content/60">Fecha Cierre</th>
                      <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 pr-12 font-mono tabular-nums">Total</th>
                      <th class="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (i of [1,2,3,4,5]; track i) {
                      <tr class="group border-b border-base-100 last:border-none">
                        <!-- Período -->
                        <td class="pl-6 py-4">
                          <div class="flex items-center gap-3">
                            <!-- Icono calendario: bg-primary/10 p-2 rounded-lg -->
                            <div class="bg-primary/10 p-2 rounded-lg shrink-0">
                              <div class="skeleton-shimmer w-5 h-5 rounded"></div>
                            </div>
                            <!-- Texto período -->
                            <div class="skeleton-shimmer h-5 w-32 rounded"></div>
                          </div>
                        </td>
                        <!-- Fecha Cierre -->
                        <td class="tabular-nums text-sm">
                          <div class="skeleton-shimmer h-4 w-24 rounded"></div>
                        </td>
                        <!-- Total -->
                        <td class="text-left pr-12 font-mono tabular-nums">
                          <div class="skeleton-shimmer h-5 w-28 rounded"></div>
                        </td>
                        <!-- Chevron -->
                        <td class="pr-6 text-left">
                          <div class="skeleton-shimmer h-5 w-5 rounded ml-auto"></div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Vista Móvil y Tablet: Tarjetas (hasta lg: 1024px) - Replica exacta -->
              <div class="lg:hidden space-y-4">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="border border-base-200 rounded-xl overflow-hidden shadow-sm bg-base-100">
                    <!-- Header card móvil -->
                    <div class="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div class="flex items-center gap-3 min-w-0">
                        <!-- Icono calendario: bg-base-200/50 p-2.5 rounded-lg -->
                        <div class="bg-base-200/50 p-2.5 rounded-lg shrink-0">
                          <div class="skeleton-shimmer w-5 h-5 rounded"></div>
                        </div>
                        <div class="truncate">
                          <!-- Período -->
                          <div class="skeleton-shimmer h-4 sm:h-5 w-40 rounded mb-1"></div>
                          <!-- Fecha -->
                          <div class="skeleton-shimmer h-3 w-32 rounded"></div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
                        <!-- Total -->
                        <div class="skeleton-shimmer h-5 sm:h-6 w-24 rounded"></div>
                        <!-- Chevron -->
                        <div class="skeleton-shimmer h-4 w-4 sm:h-5 sm:w-5 rounded"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
        @case ('accounting-kpis') {
          <!-- 🎭 GhostWire Skeleton: AccountingKPIs - Mapeo geométrico exacto -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" aria-busy="true" aria-label="Cargando indicadores financieros">
            <!-- Hero Card: Ganancia Líquida (lg:col-span-5) -->
            <div class="lg:col-span-5 card bg-base-100 shadow-xl border-l-8 border-success h-full skeleton-entering">
              <div class="card-body flex flex-col justify-center gap-1">
                <!-- Título (text-sm uppercase tracking-widest font-bold) -->
                <div class="skeleton-shimmer h-4 w-40 rounded mb-2"></div>
                
                <!-- Monto grande (text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight) -->
                <!-- Line-height aproximado: text-3xl ≈ h-9, text-4xl ≈ h-10, text-5xl ≈ h-12, text-6xl ≈ h-14 -->
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
                <!-- KPI Card skeleton (size="medium" con responsive="true") -->
                <!-- En desktop (>=1024px): responsive cambia medium a default -->
                <!-- Resultado final: gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px] -->
                <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] skeleton-entering gap-1.5 md:gap-3 lg:gap-4 p-2 md:p-4 lg:p-5 min-h-[75px] md:min-h-[85px] lg:min-h-[150px] md:min-h-[170px]"
                     [style.animation-delay.ms]="kpi * 50">
                  
                  <!-- Header: Icon + Title - Responsive -->
                  <div class="relative flex items-center gap-2 md:gap-2.5 lg:gap-3">
                    <!-- Icono - Responsive: h-5 w-5 compact, h-8 w-8 medium, h-10 w-10 default -->
                    <div class="skeleton-shimmer h-5 w-5 md:h-8 md:w-8 lg:h-10 lg:w-10 rounded-xl shrink-0 ring-1 ring-base-200"></div>
                    <div class="flex-1 min-w-0">
                      <!-- Título - Responsive: text-[10px] compact/medium, text-xs default -->
                      <div class="skeleton-shimmer h-[10px] lg:h-3 rounded" style="width: 60px;"></div>
                      <!-- Subtítulo - Responsive: text-[8px] compact, text-[9px] medium, text-[10px] default -->
                      <div class="skeleton-shimmer h-2 md:h-2.5 lg:h-2.5 rounded mt-0.5" style="width: 50px;"></div>
                    </div>
                  </div>
                  
                  <!-- Body: Value - Responsive -->
                  <div class="relative flex flex-col">
                    <!-- Valor - Responsive: compact text-[9px] sm:text-[10px] md:text-xs lg:text-sm, medium text-[10px] sm:text-xs md:text-sm lg:text-base, default text-base sm:text-lg md:text-xl lg:text-2xl -->
                    <div class="skeleton-shimmer rounded leading-tight h-[10px] sm:h-[11px] md:h-[14px] lg:h-6 pl-[28px] md:pl-[39px] lg:pl-[52px]" style="width: 30px;"></div>
                    
                    <!-- Footer: Badge - Responsive -->
                    <div class="flex items-center mt-1 md:mt-1.5 lg:mt-2 pl-[28px] md:pl-[39px] lg:pl-[52px]">
                      <!-- Badge - Responsive: text-[8px] compact, text-[9px] medium, text-[10px] default -->
                      <div class="skeleton-shimmer rounded-full h-2 md:h-2.5 lg:h-2.5" style="width: 55px;"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
        @case ('dashboard-kpi') {
          <div class="group relative flex flex-col gap-3 md:gap-4 overflow-hidden rounded-3xl border border-base-200/80 bg-base-100 p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] min-h-[150px] md:min-h-[170px]">
            <div class="absolute right-0 top-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-base-200/30 blur-2xl"></div>
            <div class="relative flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-base-200/50 ring-1 ring-base-200/60">
                <div class="w-5 h-5 skeleton-shimmer rounded-lg"></div>
              </div>
              <div class="space-y-1">
                <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                <div class="h-3 w-16 skeleton-shimmer rounded"></div>
              </div>
            </div>
            <div class="relative flex flex-col gap-2">
              <div class="h-7 w-32 skeleton-shimmer rounded"></div>
              <div class="h-4 w-24 skeleton-shimmer rounded-full"></div>
            </div>
          </div>
        }
        @case ('dashboard-chart') {
          <div class="card bg-white shadow-xl border border-zinc-200 flex flex-col overflow-hidden rounded-3xl h-[424px]">
            <div class="px-6 pt-5 pb-3 mb-6 flex justify-between items-end border-b border-zinc-100 bg-zinc-50/60">
              <div class="h-3 w-56 skeleton-shimmer rounded"></div>
              <div class="flex gap-2 text-[10px]">
                <div class="h-6 w-24 skeleton-shimmer rounded-lg"></div>
                <div class="h-6 w-24 skeleton-shimmer rounded-lg"></div>
              </div>
            </div>
            <div class="card-body p-0 flex flex-col flex-1 min-h-0 relative">
              <div class="absolute inset-0 bg-gradient-to-b from-zinc-50/60 to-white pointer-events-none"></div>
              <div class="relative h-full w-full overflow-hidden">
                <!-- Grid de líneas horizontales para simular el fondo del gráfico -->
                <div class="absolute inset-0 flex flex-col justify-between py-6 px-6">
                  @for (i of [1,2,3,4,5]; track i) {
                    <div class="w-full h-px bg-zinc-100/50"></div>
                  }
                </div>
                
                <!-- Contenedor principal del gráfico -->
                <div class="relative h-full w-full flex flex-col">
                  <!-- Eje Y labels (izquierda) - valores monetarios -->
                  <div class="absolute left-0 top-6 bottom-8 w-16 flex flex-col justify-between items-end pr-2">
                    @for (i of [1,2,3,4,5]; track i) {
                      <div class="h-2.5 w-14 skeleton-shimmer rounded text-right"></div>
                    }
                  </div>
                  
                  <!-- Área principal del gráfico con barras verticales apiladas -->
                  <div class="flex-1 flex items-end justify-center gap-4 mt-6 mb-8 ml-16 mr-4 px-4">
                    @for (i of [1,2,3,4,5]; track i) {
                      <div class="flex-1 flex flex-col items-center justify-end max-w-[50px] min-w-[40px]">
                        <!-- Contenedor de barras apiladas verticalmente - altura total variable del grupo -->
                        <div class="w-full flex flex-col items-center justify-end" [style.height.%]="[55, 70, 45, 85, 65][i-1]">
                          <!-- Barra de Ingreso Bruto (púrpura, más ancha, abajo - base de la pila vertical) -->
                          <div 
                            class="w-full rounded-lg relative overflow-hidden flex-shrink-0" 
                            [style.height.%]="[70, 65, 75, 60, 68][i-1]"
                            [style.background]="'linear-gradient(180deg, rgba(124, 58, 237, 0.20) 0%, rgba(124, 58, 237, 0.30) 100%)'">
                            <div class="absolute inset-0 skeleton-shimmer opacity-40"></div>
                          </div>
                          <!-- Barra de Ganancia Neta (verde, más delgada, encima - apilada verticalmente sobre la púrpura) -->
                          <div 
                            class="w-4/5 rounded-t-lg relative overflow-hidden flex-shrink-0" 
                            [style.height.%]="[30, 35, 25, 40, 32][i-1]"
                            [style.background]="'linear-gradient(180deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.35) 100%)'">
                            <div class="absolute inset-0 skeleton-shimmer opacity-40"></div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                  
                  <!-- Eje X labels (abajo) - IDs de máquinas -->
                  <div class="absolute bottom-0 left-16 right-4 h-6 flex items-center justify-between px-4">
                    @for (i of [1,2,3,4,5]; track i) {
                      <div class="h-2.5 w-6 skeleton-shimmer rounded text-center"></div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        @case ('dashboard-alerts') {
          <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-base-200/80 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] min-h-[150px] md:min-h-[170px]">
            <div class="px-5 pt-5 pb-3">
              <div class="h-3 w-32 skeleton-shimmer rounded mb-2"></div>
              <div class="h-2.5 w-20 skeleton-shimmer rounded-full"></div>
            </div>
            <div class="flex flex-col flex-1 px-4 pb-5 gap-2">
              <div class="flex items-center justify-between rounded-3xl bg-base-200/60 border border-base-200/80 px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-base-content/40 skeleton-shimmer"></div>
                  <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-5 w-10 skeleton-shimmer rounded"></div>
              </div>
              <div class="flex gap-2 h-16">
                <div class="flex-1 flex flex-col items-center justify-center rounded-3xl bg-base-200/40 border border-base-200/60 space-y-2">
                  <div class="h-5 w-6 skeleton-shimmer rounded"></div>
                  <div class="h-2.5 w-16 skeleton-shimmer rounded"></div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center rounded-3xl bg-base-200/40 border border-base-200/60 space-y-2">
                  <div class="h-5 w-6 skeleton-shimmer rounded"></div>
                  <div class="h-2.5 w-10 skeleton-shimmer rounded"></div>
                </div>
              </div>
            </div>
          </div>
        }
        @case ('dashboard-table') {
          <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
            <div class="card-header p-4 sm:p-6 lg:p-7 border-b border-base-200/70">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex items-start gap-3">
                  <div class="rounded-xl bg-primary/10 text-primary w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ring-1 ring-primary/10 shadow-sm">
                    <div class="w-6 h-6 skeleton-shimmer rounded-lg"></div>
                  </div>
                  <div class="space-y-2">
                    <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-56 skeleton-shimmer rounded hidden sm:block"></div>
                  </div>
                </div>
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 text-xs font-semibold text-base-content shadow-sm ring-1 ring-base-200/60">
                  <div class="w-2 h-2 rounded-full skeleton-shimmer"></div>
                  <div class="h-3 w-16 skeleton-shimmer rounded-full"></div>
                </div>
              </div>
            </div>
            <div class="card-body p-6">
              <div class="hidden xl:block">
                <div class="space-y-4">
                  @for (row of rows(); track $index) {
                    <div class="flex items-center gap-4 p-3 rounded-xl border border-base-200/70 bg-base-50/40">
                      <div class="avatar placeholder shrink-0">
                        <div class="rounded-lg w-10 h-10 skeleton-shimmer"></div>
                      </div>
                      <div class="flex-1 grid grid-cols-5 items-center gap-3">
                        <div class="space-y-2">
                          <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                          <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                        </div>
                        <div class="h-4 w-28 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-20 skeleton-shimmer rounded mx-auto"></div>
                        <div class="h-4 w-16 skeleton-shimmer rounded mx-auto"></div>
                        <div class="h-8 w-24 skeleton-shimmer rounded-full justify-self-end"></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
              <div class="block xl:hidden space-y-3">
                @for (row of rows(); track $index) {
                  <div class="card bg-base-100 border border-base-200/70 rounded-3xl">
                    <div class="card-body p-4 space-y-3">
                      <div class="flex items-start gap-3">
                        <div class="rounded-lg w-12 h-12 skeleton-shimmer"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                          <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                        </div>
                        <div class="h-6 w-16 skeleton-shimmer rounded-full"></div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-3 w-20 skeleton-shimmer rounded justify-self-end"></div>
                      </div>
                      <div class="h-9 w-full skeleton-shimmer rounded-xl"></div>
                    </div>
                  </div>
                }
              </div>
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
                <div class="bg-white p-4 rounded-3xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100">
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
          <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-6 flex justify-between items-center divide-x divide-slate-100">
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
            <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-1">
              <div class="flex items-center p-4 gap-4">
                <div class="w-12 h-12 skeleton-shimmer rounded-xl"></div>
                <div class="flex-1">
                  <div class="h-3 w-24 skeleton-shimmer rounded mb-2"></div>
                  <div class="h-6 w-full skeleton-shimmer rounded"></div>
                </div>
              </div>
            </div>
            <!-- Campo de recaudado -->
            <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-6 border-l-4 border-slate-200">
              <div class="h-3 w-32 skeleton-shimmer rounded mb-2"></div>
              <div class="h-12 w-3/4 skeleton-shimmer rounded"></div>
              <div class="h-3 w-48 skeleton-shimmer rounded mt-2"></div>
            </div>
            <!-- Campos de combustible -->
            <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-5">
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
            <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-5">
              <div class="h-3 w-32 skeleton-shimmer rounded mb-3"></div>
              <div class="w-full aspect-[3/1] skeleton-shimmer rounded-xl"></div>
            </div>
            <!-- Textarea -->
            <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-5">
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
                @for (i of rows(); track $index) {
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

    /* Respeto por prefers-reduced-motion (a11y) */
    @media (prefers-reduced-motion: reduce) {
      .skeleton-shimmer::after {
        animation: none;
      }
    }

    /* Dark mode: Contraste adaptativo */
    @media (prefers-color-scheme: dark) {
      .skeleton-shimmer {
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%);
      }

      .skeleton-shimmer::after {
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%
        );
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
      position: relative;
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
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
        rgba(255, 255, 255, 0.6) 50%,
        transparent 100%
      );
      animation: shimmer-transform 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    @keyframes shimmer-transform {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
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
 * Tipo de skeleton: kpi, table, card, list, text, avatar, custom, worker-header, worker-timeline, worker-stats, worker-form, machine-list, dashboard-kpi, dashboard-chart, dashboard-alerts, dashboard-table
   * @default 'card'
   */
  type = input<'kpi' | 'accounting-kpis' | 'responsive-kpis' | 'weekly-summary' | 'liquidation-history' | 'table' | 'card' | 'list' | 'text' | 'avatar' | 'custom' | 'worker-header' | 'worker-timeline' | 'worker-stats' | 'worker-form' | 'machine-list' | 'dashboard-kpi' | 'dashboard-chart' | 'dashboard-alerts' | 'dashboard-table'>('card');

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
   * NO puede escribir a signals, solo leer
   */
  showEntering = computed(() => {
    // Si está saliendo, no mostrar animación de entrada
    if (this.isExiting()) {
      return false;
    }
    // Mostrar animación de entrada solo si aún no ha entrado
    return !this.hasEntered();
  });

  /**
   * Effect para manejar los cambios de isExiting y actualizar hasEntered
   * Esto debe estar fuera del computed para poder escribir a signals
   */
  private exitEffect = effect(() => {
    const exiting = this.isExiting();
    if (exiting) {
      // Cuando empieza a salir, resetear hasEntered
      this.hasEntered.set(false);
    }
  });

  ngOnInit(): void {
    // Resetear hasEntered cuando el componente se inicializa para asegurar que la animación se muestre
    this.hasEntered.set(false);

    // Usar un pequeño timeout para marcar que ha entrado después de que se renderice
    // Esto permite que la animación de entrada se muestre una vez
    setTimeout(() => {
      if (!this.isExiting()) {
        this.hasEntered.set(true);
      }
    }, 0);
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

