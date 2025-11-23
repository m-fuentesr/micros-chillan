import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { WeeklySummary } from '../../models/accounting.models';

@Component({
  selector: 'app-weekly-summary-table',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="text-2xl font-bold mb-4">Resumen Semanal Detallado</h2>
        <p class="text-sm text-base-content/70 mb-6">
          Vista consolidada de ingresos, egresos y ganancias por semana con desglose detallado por chofer.
        </p>

        <!-- KPIs Mensuales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="card bg-base-200">
            <div class="card-body">
              <div class="text-sm text-base-content/70 mb-1">Total Recaudado (Mes)</div>
              <div class="text-2xl font-bold">{{ formatCurrency(monthTotals().totalRecaudado) }}</div>
              <div class="text-xs text-base-content/70 mt-1">{{ summaries().length }} semanas completas</div>
            </div>
          </div>
          <div class="card bg-base-200">
            <div class="card-body">
              <div class="text-sm text-base-content/70 mb-1">Total Pagado a Choferes</div>
              <div class="text-2xl font-bold">{{ formatCurrency(monthTotals().totalPagoChoferes) }}</div>
              <div class="text-xs text-base-content/70 mt-1">30% de ganancia bruta</div>
            </div>
          </div>
          <div class="card bg-base-200 border-2 border-success">
            <div class="card-body">
              <div class="text-sm text-base-content/70 mb-1">Ganancia Neta (Mes)</div>
              <div class="text-3xl font-bold text-success">{{ formatCurrency(monthTotals().gananciaNeta) }}</div>
              <div class="text-xs text-base-content/70 mt-1">Después de todos los gastos</div>
            </div>
          </div>
          <div class="card bg-base-200">
            <div class="card-body">
              <div class="text-sm text-base-content/70 mb-1">Promedio por Semana</div>
              <div class="text-2xl font-bold">{{ formatCurrency(monthTotals().promedioSemanal) }}</div>
              <div class="text-xs text-base-content/70 mt-1">Ganancia promedio semanal</div>
            </div>
          </div>
        </div>

          <!-- Tabla de Resumen por Semana -->
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Semana</th>
                <th>Rango de Fechas</th>
                <th class="text-right">Total Recaudado</th>
                <th class="text-right">Gasto Diésel</th>
                <th class="text-right">Mantenimiento</th>
                <th class="text-right">Total Egresos</th>
                <th class="text-right">Ganancia Neta</th>
                <th class="text-center">Ver Desglose</th>
              </tr>
            </thead>
            <tbody>
              @for (summary of summaries(); track summary.semana) {
                <tr class="cursor-pointer hover:bg-base-200" (click)="toggleWeek(summary.semana)">
                  <td>
                    <span class="font-semibold">Semana {{ summary.semana }}</span>
                    @if (expandedWeek() === summary.semana) {
                      <span class="text-primary">▼</span>
                    } @else {
                      <span class="text-primary">▶</span>
                    }
                  </td>
                  <td>{{ formatDateRange(summary.fecha_inicio, summary.fecha_fin) }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(summary.total_recaudado) }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(summary.gasto_diesel || 0) }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(summary.gasto_mantenimiento || 0) }}</td>
                  <td class="text-right font-mono">{{ formatCurrency(summary.total_egresos) }}</td>
                  <td class="text-right font-mono font-bold text-success">
                    {{ formatCurrency(summary.ganancia_neta) }}
                  </td>
                  <td class="text-center">
                    <button class="btn btn-secondary btn-sm" (click)="toggleWeek(summary.semana); $event.stopPropagation()">
                      Ver Detalle
                    </button>
                  </td>
                </tr>
                @if (expandedWeek() === summary.semana) {
                  <tr class="bg-base-200">
                    <td colspan="8" class="p-6">
                      <div class="space-y-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <h4 class="text-lg font-bold">Desglose por Chofer - Semana {{ summary.semana }}</h4>
                            <p class="text-sm text-base-content/70">
                              Detalle de cuánto ganó cada chofer y la ganancia generada
                            </p>
                          </div>
                          <button class="btn btn-secondary btn-sm" (click)="toggleWeek(summary.semana)">
                            ✕ Cerrar
                          </button>
                        </div>
                        
                        <div class="overflow-x-auto">
                          <table class="table table-zebra">
                            <thead>
                              <tr>
                                <th>Chofer</th>
                                <th class="text-center">Días Trabajados</th>
                                <th class="text-right">Total Recaudado</th>
                                <th class="text-right">Gasto Diésel</th>
                                <th class="text-right">Mantenimiento</th>
                                <th class="text-right">Pago Chofer</th>
                                <th class="text-right bg-success/10">Ganancia Neta</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (chofer of summary.choferes; track chofer.chofer_id) {
                                <tr>
                                  <td><strong>{{ chofer.chofer_nombre }}</strong></td>
                                  <td class="text-center">{{ chofer.dias_trabajados }} días</td>
                                  <td class="text-right font-mono">{{ formatCurrency(chofer.recaudado) }}</td>
                                  <td class="text-right font-mono">{{ formatCurrency(chofer.diesel || 0) }}</td>
                                  <td class="text-right font-mono">{{ formatCurrency(chofer.mantenimiento || 0) }}</td>
                                  <td class="text-right font-mono font-bold text-primary">{{ formatCurrency(chofer.pago_chofer) }}</td>
                                  <td class="text-right font-mono font-bold text-success bg-success/10">
                                    {{ formatCurrency(chofer.ganancia_neta) }}
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-base-300 rounded-lg">
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Total Recaudado</div>
                            <div class="text-xl font-bold">{{ formatCurrency(summary.total_recaudado) }}</div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Total Gasto Diésel</div>
                            <div class="text-xl font-bold">{{ formatCurrency(getWeekTotals(summary.semana).totalDiesel) }}</div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Total Mantenimiento</div>
                            <div class="text-xl font-bold">{{ formatCurrency(getWeekTotals(summary.semana).totalMantenimiento) }}</div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Total Pagado a Choferes</div>
                            <div class="text-xl font-bold">{{ formatCurrency(getWeekDriverTotal(summary.semana).totalPagoChoferes) }}</div>
                          </div>
                          <div>
                            <div class="text-xs uppercase tracking-wide text-base-content/70 mb-1">Ganancia Neta</div>
                            <div class="text-2xl font-bold text-success">{{ formatCurrency(summary.ganancia_neta) }}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeeklySummaryTable {
  summaries = input.required<WeeklySummary[]>();

  expandedWeek = signal<number | null>(null);

  monthTotals = computed(() => {
    const summaries = this.summaries();
    let totalRecaudado = 0;
    let totalPagoChoferes = 0;
    let gananciaNeta = 0;

    summaries.forEach(summary => {
      totalRecaudado += summary.total_recaudado;
      gananciaNeta += summary.ganancia_neta;
      summary.choferes.forEach(chofer => {
        totalPagoChoferes += chofer.pago_chofer;
      });
    });

    return {
      totalRecaudado,
      totalPagoChoferes,
      gananciaNeta,
      promedioSemanal: summaries.length > 0 ? gananciaNeta / summaries.length : 0
    };
  });

  getWeekDriverTotal(weekNumber: number): { totalPagoChoferes: number } {
    const summary = this.summaries().find(s => s.semana === weekNumber);
    if (!summary) return { totalPagoChoferes: 0 };
    
    const totalPagoChoferes = summary.choferes.reduce((sum, c) => sum + c.pago_chofer, 0);
    return { totalPagoChoferes };
  }

  getWeekTotals(weekNumber: number): { totalDiesel: number; totalMantenimiento: number } {
    const summary = this.summaries().find(s => s.semana === weekNumber);
    if (!summary) return { totalDiesel: 0, totalMantenimiento: 0 };
    
    const totalDiesel = summary.choferes.reduce((sum, c) => sum + (c.diesel || 0), 0);
    const totalMantenimiento = summary.choferes.reduce((sum, c) => sum + (c.mantenimiento || 0), 0);
    return { totalDiesel, totalMantenimiento };
  }

  toggleWeek(weekNumber: number): void {
    if (this.expandedWeek() === weekNumber) {
      this.expandedWeek.set(null);
    } else {
      this.expandedWeek.set(weekNumber);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
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

