import { Component, ChangeDetectionStrategy, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklySummary, WeeklyDriverBreakdown } from '../../models/accounting.models';
import { AccountingService } from '../../services/accounting.service';
import { KpiCard } from '../../components/kpi-card/kpi-card';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-weekly-summary-table',
  standalone: true,
  imports: [CommonModule, KpiCard, UiIconComponent],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body p-4 sm:p-6">
        <!-- Header -->
        <div class="mb-6 flex flex-col gap-4">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-bold border-l-4 border-l-primary pl-3">Desempeño Semanal</h2>
              <p class="text-xs sm:text-sm text-base-content/60">Rentabilidad operativa.</p>
            </div>
            <div class="bg-success/10 px-3 py-1.5 rounded-lg border border-success/20 text-left pl-4 border-l-4 border-l-success">
              <div class="text-[10px] text-success/80 uppercase font-bold tracking-wider">Total Mes</div>
              <div class="font-bold text-success text-sm sm:text-base tabular-nums tracking-tight">
                {{ getTotalGanancia() | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
          </div>
        </div>

        <!-- KPIs: Grid 2x2 en móvil, 4 columnas en desktop -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <!-- KPI: Recaudado -->
          <app-kpi-card
            title="Recaudado"
            [subtitle]="'Producción bruta'"
            [value]="(totalRecaudado() | currency:'CLP':'symbol-narrow':'1.0-0') || ''"
            type="financial"
            size="medium"
            [responsive]="true"
            badgeText="Volumen real"
            [animationDelay]="0">
            <span icon><ui-icon name="Wallet" size="sm" /></span>
          </app-kpi-card>

          <!-- KPI: Pago Choferes -->
          <app-kpi-card
            title="Pago Choferes"
            [subtitle]="'Compensación flota'"
            [value]="(totalPagos() | currency:'CLP':'symbol-narrow':'1.0-0') || ''"
            type="warning"
            size="medium"
            [responsive]="true"
            badgeText="Por procesar"
            [animationDelay]="1">
            <span icon><ui-icon name="Users" size="sm" /></span>
          </app-kpi-card>

          <!-- KPI: Gastos Operacionales -->
          <app-kpi-card
            title="Gastos Op."
            [subtitle]="'Costos de ejecución'"
            [value]="(totalGastos() | currency:'CLP':'symbol-narrow':'1.0-0') || ''"
            type="danger"
            size="medium"
            [responsive]="true"
            badgeText="Impacto margen"
            [animationDelay]="2">
            <span icon><ui-icon name="TriangleAlert" size="sm" /></span>
          </app-kpi-card>

          <!-- KPI: Promedio Semanal -->
          <app-kpi-card
            title="Promedio Semanal"
            [subtitle]="'Eficiencia media'"
            [value]="(promedioSemanal() | currency:'CLP':'symbol-narrow':'1.0-0') || ''"
            type="success"
            size="medium"
            [responsive]="true"
            badgeText="Ritmo actual"
            [animationDelay]="3">
            <span icon><ui-icon name="TrendingUp" size="sm" /></span>
          </app-kpi-card>
        </div>

        <!-- Vista Desktop: Tabla (md y arriba) -->
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
              @for (summary of summariesWithDrivers(); track summary.semana) {
                <!-- Fila principal resumen semana -->
                <tr 
                  class="group cursor-pointer hover:bg-base-50 transition-colors border-b border-base-100 last:border-none"
                  [class.bg-base-50]="expandedWeeks().has(summary.semana)"
                  (click)="toggleWeek(summary.semana)">
                  
                  <td class="pl-6 py-4">
                    <div class="flex flex-col">
                      <span class="font-bold text-base-content group-hover:text-primary transition-colors">Semana {{ summary.semana }}</span>
                      <span class="text-xs text-base-content/50 font-normal italic">{{ formatDateRange(summary.fecha_inicio, summary.fecha_fin) }}</span>
                    </div>
                  </td>
                  
                  <td class="text-right tabular-nums font-medium text-sm">{{ summary.total_recaudado | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                  <td class="text-right tabular-nums text-base-content/60 text-sm">{{ summary.gasto_diesel | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                  <td class="text-right tabular-nums text-base-content/60 text-sm">{{ summary.gasto_mantenimiento | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                  <td class="text-right tabular-nums text-base-content/60 text-sm">{{ summary.total_egresos | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                  <td class="text-right tabular-nums font-bold text-success pr-12 text-sm">{{ summary.ganancia_neta | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                  <td class="pr-6 text-right">
                    <ui-icon 
                      name="ChevronDown" 
                      size="sm" 
                      class="transition-transform duration-300 text-base-content/40"
                      [class.rotate-180]="expandedWeeks().has(summary.semana)" />
                  </td>
                </tr>

                <!-- Fila detalle semana (siempre presente, con animación de altura) -->
                <tr>
                  <td colspan="7" class="p-0 border-b border-base-200">
                    <div class="collapse-anim" [class.collapse-expanded]="expandedWeeks().has(summary.semana)">
                      <div class="bg-base-200/30 flex shadow-inner motion-panel" [attr.id]="'week-detail-' + summary.semana">
                        <div class="w-1 bg-primary self-stretch shrink-0"></div>
                        <div class="p-6 w-full">
                          <div class="bg-base-100 rounded-lg shadow-sm border border-base-200 overflow-hidden">
                            <table class="table table-sm w-full">
                              <thead class="bg-base-100 border-b border-base-200">
                                <tr>
                                  <th class="pl-4 py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Chofer</th>
                                  <th class="text-center py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Días</th>
                                  <th class="text-right py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Recaudado</th>
                                  <th class="text-right py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Combustible</th>
                                  <th class="text-right py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Mantenimiento</th>
                                  <th class="text-right py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Pago Chofer</th>
                                  <th class="text-right pr-4 py-3 text-xs font-bold uppercase tracking-widest text-base-content/70">Contribución</th>
                                </tr>
                              </thead>
                              <tbody>
                                @if (isLoadingWeek(summary.semana)) {
                                  <tr>
                                    <td colspan="7" class="text-center py-8 text-base-content/50">
                                      <div class="flex items-center justify-center gap-2">
                                        <span class="loading loading-spinner loading-sm"></span>
                                        <span>Cargando detalles...</span>
                                      </div>
                                    </td>
                                  </tr>
                                } @else if (summary.choferes.length === 0) {
                                  <tr>
                                    <td colspan="7" class="text-center py-8 text-base-content/50">
                                      No hay datos de choferes para esta semana
                                    </td>
                                  </tr>
                                } @else {
                                  @for (chofer of summary.choferes; track chofer.chofer_id) {
                                  <tr class="hover:bg-base-50 border-b border-base-100 last:border-none">
                                    <td class="font-bold pl-4 text-base-content py-3">{{ chofer.chofer_nombre }}</td>
                                    <td class="text-center"><div class="badge badge-sm badge-ghost tabular-nums">{{ chofer.dias_trabajados }}d</div></td>
                                    <td class="text-right tabular-nums text-xs font-medium">{{ chofer.recaudado | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                                    <td class="text-right">
                                      <div class="inline-block text-right w-20 px-1.5 py-0.5 rounded bg-error/10 text-error text-xs tabular-nums tracking-tight font-bold">
                                        -{{ chofer.diesel | currency:'CLP':'symbol-narrow':'1.0-0' }}
                                      </div>
                                    </td>
                                    <td class="text-right">
                                      @if (chofer.mantenimiento && chofer.mantenimiento > 0) {
                                        <div class="inline-block text-right w-20 px-1.5 py-0.5 rounded bg-error/10 text-error text-xs tabular-nums tracking-tight font-bold">
                                          -{{ chofer.mantenimiento | currency:'CLP':'symbol-narrow':'1.0-0' }}
                                        </div>
                                      } @else {
                                        <span class="text-base-content/30 text-xs">—</span>
                                      }
                                    </td>
                                    <td class="text-right">
                                      <div class="inline-block text-right w-20 px-1.5 py-0.5 rounded bg-warning/10 text-warning text-xs tabular-nums tracking-tight font-bold">
                                        -{{ chofer.pago_chofer | currency:'CLP':'symbol-narrow':'1.0-0' }}
                                      </div>
                                    </td>
                                    <td class="text-right pr-4">
                                      <span class="tabular-nums tracking-tight font-bold text-success text-sm">
                                        {{ chofer.ganancia_neta | currency:'CLP':'symbol-narrow':'1.0-0' }}
                                      </span>
                                    </td>
                                  </tr>
                                  }
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Vista Móvil: Cards (sm y abajo) -->
        <div class="md:hidden space-y-3">
          @for (summary of summariesWithDrivers(); track summary.semana) {
              <div 
              class="border border-base-200 rounded-3xl overflow-hidden transition-all duration-200"
              [class.shadow-md]="expandedWeeks().has(summary.semana)"
              [class.border-primary]="expandedWeeks().has(summary.semana)"
              (click)="toggleWeek(summary.semana)">
              
              <div class="bg-base-100 p-4 flex justify-between items-center">
                <div class="flex gap-3 items-center">
                  <div class="bg-base-200 rounded-lg p-2 text-center min-w-[3rem]">
                    <div class="text-[10px] font-bold text-base-content/50 uppercase">SEM</div>
                    <div class="font-black text-lg leading-none">{{ summary.semana }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-base-content/50 font-medium">{{ formatDateRange(summary.fecha_inicio, summary.fecha_fin) }}</div>
                    <div class="font-bold text-success text-lg tabular-nums tracking-tight">
                      {{ summary.ganancia_neta | currency:'CLP':'symbol-narrow':'1.0-0' }}
                    </div>
                  </div>
                </div>
                
                <div class="btn btn-circle btn-ghost btn-xs">
                  <ui-icon 
                    name="ChevronDown" 
                    size="sm" 
                    class="transition-transform duration-300 text-base-content/40"
                    [class.rotate-180]="expandedWeeks().has(summary.semana)" />
                </div>
              </div>

              <div class="px-4 pb-4 grid grid-cols-2 gap-2 text-xs">
                <div class="bg-base-50 p-2 rounded border border-base-100">
                  <div class="text-base-content/50 mb-0.5">Ingresos</div>
                  <div class="font-bold tabular-nums tracking-tight">{{ summary.total_recaudado | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                </div>
                <div class="bg-base-50 p-2 rounded border border-base-100">
                  <div class="text-base-content/50 mb-0.5">Egresos</div>
                  <div class="font-bold text-base-content/70 tabular-nums tracking-tight">{{ summary.total_egresos | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                </div>
              </div>

              <div class="collapse-anim-mobile bg-base-200/30 border-t border-base-200 p-3 space-y-3 motion-panel"
                   [class.collapse-expanded]="expandedWeeks().has(summary.semana)"
                   [attr.id]="'week-detail-' + summary.semana">
                  <div class="text-[10px] font-bold uppercase tracking-widest text-base-content/50 px-1">Desglose por Chofer</div>
                  
                  @if (isLoadingWeek(summary.semana)) {
                    <div class="text-center py-8 text-base-content/50">
                      <div class="flex items-center justify-center gap-2">
                        <span class="loading loading-spinner loading-sm"></span>
                        <span>Cargando detalles...</span>
                      </div>
                    </div>
                  } @else if (summary.choferes.length === 0) {
                    <div class="text-center py-8 text-base-content/50">
                      No hay datos de choferes para esta semana
                    </div>
                  } @else {
                    @for (chofer of summary.choferes; track chofer.chofer_id) {
                    <div class="bg-base-100 rounded-lg p-3 shadow-sm border border-base-200">
                      <div class="flex justify-between items-start mb-2">
                        <span class="font-bold text-sm text-base-content">{{ chofer.chofer_nombre }}</span>
                        <span class="badge badge-sm badge-ghost tabular-nums">{{ chofer.dias_trabajados }}d</span>
                      </div>
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-3 text-[11px] sm:text-xs">
                        <div class="flex justify-between items-center gap-2">
                          <span class="text-base-content/50 whitespace-normal">Recaudado:</span>
                          <span class="font-medium tabular-nums tracking-tight text-right break-words">{{ chofer.recaudado | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                        </div>
                        <div class="flex justify-between items-center gap-2 text-error/70">
                          <span class="whitespace-normal">Diésel:</span>
                          <span class="tabular-nums tracking-tight text-right break-words">-{{ chofer.diesel | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                        </div>
                        <div class="flex justify-between items-center gap-2 text-warning/80">
                          <span class="whitespace-normal">Pago:</span>
                          <span class="tabular-nums tracking-tight text-right break-words">-{{ chofer.pago_chofer | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                        </div>
                        @if (chofer.mantenimiento && chofer.mantenimiento > 0) {
                          <div class="flex justify-between items-center gap-2 text-error/70 sm:col-span-2">
                            <span class="whitespace-normal">Mantenimiento:</span>
                            <span class="tabular-nums tracking-tight text-right break-words">-{{ chofer.mantenimiento | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                          </div>
                        }
                        <div class="flex justify-between items-center gap-2 text-success font-bold sm:col-span-2">
                          <span class="whitespace-normal">Neto:</span>
                          <span class="tabular-nums tracking-tight text-right break-words">{{ chofer.ganancia_neta | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                        </div>
                      </div>
                    </div>
                    }
                  }
                </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Micro-animación optimizada para paneles de detalle (solo opacity + transform) */
    @keyframes motionFadeInUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .motion-panel {
      animation: motionFadeInUp 320ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
      will-change: transform, opacity;
      transform-origin: top;
    }

    /* Animación del crecimiento/colapso del contenedor padre (altura) */
    .collapse-anim,
    .collapse-anim-mobile {
      max-height: 0;
      overflow: hidden;
      transition: max-height 800ms cubic-bezier(0.22, 0.8, 0.35, 1);
    }

    .collapse-anim.collapse-expanded,
    .collapse-anim-mobile.collapse-expanded {
      max-height: 600px; /* valor suficientemente grande para cubrir el contenido */
    }

    @media (prefers-reduced-motion: reduce) {
      .motion-panel {
        animation: none;
        transform: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeeklySummaryTable {
  summaries = input.required<WeeklySummary[]>();
  mes = input.required<number>();
  anio = input.required<number>();
  
  private accountingService = inject(AccountingService);
  
  // Cache de choferes cargados por semana (usando signal para reactividad)
  private loadedDriversCache = signal<Map<number, WeeklyDriverBreakdown[]>>(new Map());
  private loadingWeeks = signal<Set<number>>(new Set());

  /**
   * Semanas actualmente expandidas (permite múltiples abiertas para comparación).
   */
  expandedWeeks = signal<Set<number>>(new Set());
  
  // Summaries con choferes cargados
  summariesWithDrivers = computed(() => {
    const cache = this.loadedDriversCache();
    return this.summaries().map(summary => {
      const drivers = cache.get(summary.semana);
      return {
        ...summary,
        choferes: drivers || summary.choferes || []
      };
    });
  });

  // Cálculos rápidos para los KPIs superiores
  totalRecaudado = computed(() => 
    this.summariesWithDrivers().reduce((acc, s) => acc + s.total_recaudado, 0)
  );

  totalPagos = computed(() => 
    this.summariesWithDrivers().reduce((acc, s) => {
      const pagoChoferes = s.choferes.reduce((sum, c) => sum + c.pago_chofer, 0);
      return acc + pagoChoferes;
    }, 0)
  );

  totalGastos = computed(() => 
    this.summariesWithDrivers().reduce((acc, s) => acc + s.gasto_diesel + (s.gasto_mantenimiento || 0), 0)
  );

  getTotalGanancia = computed(() => 
    this.summariesWithDrivers().reduce((acc, s) => acc + s.ganancia_neta, 0)
  );

  promedioSemanal = computed(() => 
    this.summariesWithDrivers().length > 0 ? this.getTotalGanancia() / this.summariesWithDrivers().length : 0
  );

  toggleWeek(weekNumber: number): void {
    const current = this.expandedWeeks();
    const isExpanded = current.has(weekNumber);

    const next = new Set(current);
    if (isExpanded) {
      next.delete(weekNumber);
    } else {
      next.add(weekNumber);
      // Cargar detalles de choferes si no están en caché
      const cache = this.loadedDriversCache();
      if (!cache.has(weekNumber)) {
        this.loadWeekDetails(weekNumber);
      }
    }

    this.expandedWeeks.set(next);

    // Desplazar suavemente el panel de detalle a la vista una vez que Angular haya
    // pintado el contenido expandido. Usamos scrollIntoView con behavior smooth.
    if (!isExpanded) {
      queueMicrotask(() => {
        const detail = document.getElementById(`week-detail-${weekNumber}`);
        if (detail) {
          detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  }

  private loadWeekDetails(weekNumber: number): void {
    // Marcar como cargando
    this.loadingWeeks.update(weeks => new Set(weeks).add(weekNumber));
    
    this.accountingService.getWeekDetail(this.mes(), this.anio(), weekNumber)
      .subscribe({
        next: (drivers) => {
          console.log(`✅ Choferes cargados para semana ${weekNumber}:`, drivers);
          // Guardar en caché usando signal para que sea reactivo
          this.loadedDriversCache.update(cache => {
            const newCache = new Map(cache);
            newCache.set(weekNumber, drivers);
            return newCache;
          });
          // Quitar de loading
          this.loadingWeeks.update(weeks => {
            const next = new Set(weeks);
            next.delete(weekNumber);
            return next;
          });
        },
        error: (error) => {
          console.error(`❌ Error al cargar detalles de la semana ${weekNumber}:`, error);
          // Quitar de loading incluso si hay error
          this.loadingWeeks.update(weeks => {
            const next = new Set(weeks);
            next.delete(weekNumber);
            return next;
          });
        }
      });
  }
  
  isLoadingWeek(weekNumber: number): boolean {
    return this.loadingWeeks().has(weekNumber);
  }

  formatDateRange(start: string, end: string): string {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = monthNames[startDate.getMonth()];
      return `${startDay}-${endDay} ${month}`;
    } catch {
      return `${start} - ${end}`;
    }
  }
}
