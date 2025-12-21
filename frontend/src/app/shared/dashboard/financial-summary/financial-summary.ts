import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, input, output } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { FinancialData, FinancialMetric } from '../../models/dashboard.models';
import { catchError, of } from 'rxjs';
import { LazyChartDirective } from '../../directives/lazy-chart.directive';

@Component({
  selector: 'app-financial-summary',
  imports: [BaseChartDirective, CommonModule, LazyChartDirective],
  template: `
    <div class="card bg-white shadow-xl border border-zinc-200 h-full flex flex-col overflow-hidden rounded-3xl animate-card-enter" [class.h-[424px]]="showChartOnly()">
      <div class="px-6 pt-5 pb-3 mb-6 flex justify-between items-end border-b border-zinc-100 bg-zinc-50/60">
        <h2 class="text-sm font-bold uppercase tracking-wider text-base-content">Rendimiento Financiero (Periodo Actual)</h2>
        <div class="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
          <div class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg ring-1 ring-emerald-100/70 cursor-default">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            Ganancia Neta
          </div>
          <div class="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg ring-1 ring-indigo-100/70 cursor-default">
            <div class="w-2 h-2 rounded-full bg-indigo-400 opacity-50"></div>
            Ingreso Bruto
          </div>
        </div>
      </div>

      <div class="card-body p-0 flex flex-col flex-1 min-h-0 relative">
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-50/60 to-white pointer-events-none"></div>
        <div class="relative h-full" appLazyChart #lazyChart="lazyChart">
          @if (lazyChart.isVisible() && hasData()) {
            <canvas baseChart
              class="w-full h-full"
              [data]="chartData()"
              [options]="chartOptions"
              [type]="chartType">
            </canvas>
          } @else if (lazyChart.isVisible() && !hasData()) {
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 border border-dashed border-zinc-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="text-sm font-semibold text-zinc-500">Aún no hay datos para este periodo</div>
              <div class="text-xs text-zinc-400">Conecta las fuentes o espera la primera carga.</div>
            </div>
          } @else {
            <div class="flex items-center justify-center h-full text-zinc-300 font-bold text-sm uppercase tracking-widest">
              Área de gráfico combinada
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialSummary implements OnInit {
  private dashboardService = inject(DashboardService);

  showChartOnly = input(false);
  currentMetric = signal<FinancialMetric>('Ganancia Neta');
  metricChange = output<FinancialMetric>();
  
  // Datos de ejemplo (en producción vendrían del servicio)
  financialData = signal<Record<FinancialMetric, FinancialData[]>>({
    'Ganancia Neta': [
      { machineId: '01', driver: 'Carlos Rodríguez', value: 245000 },
      { machineId: '02', driver: 'Ana Gómez', value: 320000 },
      { machineId: '03', driver: 'María López', value: 180000 },
      { machineId: '05', driver: 'Juan Pérez', value: 410000 },
      { machineId: '07', driver: 'Pedro Gómez', value: 280000 }
    ],
    'Ingreso Total': [
      { machineId: '01', driver: 'Carlos Rodríguez', value: 850000 },
      { machineId: '02', driver: 'Ana Gómez', value: 920000 },
      { machineId: '03', driver: 'María López', value: 720000 },
      { machineId: '05', driver: 'Juan Pérez', value: 1050000 },
      { machineId: '07', driver: 'Pedro Gómez', value: 880000 }
    ]
  });

  private summaryData = computed(() => {
    const net = this.financialData()['Ganancia Neta'] ?? [];
    const income = this.financialData()['Ingreso Total'] ?? [];
    const byMachine = new Map<string, { machineId: string; driver: string; net: number; income: number }>();

    income.forEach(item => {
      byMachine.set(item.machineId, {
        machineId: item.machineId,
        driver: item.driver,
        net: byMachine.get(item.machineId)?.net ?? 0,
        income: item.value
      });
    });

    net.forEach(item => {
      byMachine.set(item.machineId, {
        machineId: item.machineId,
        driver: item.driver,
        net: item.value,
        income: byMachine.get(item.machineId)?.income ?? 0
      });
    });

    return Array.from(byMachine.values());
  });

  private driversByMachine = computed(() => new Map(this.summaryData().map(item => [item.machineId, item.driver])));

  netTotal = computed(() => this.summaryData().reduce((sum, item) => sum + item.net, 0));

  incomeTotal = computed(() => this.summaryData().reduce((sum, item) => sum + item.income, 0));

  margin = computed(() => {
    const income = this.incomeTotal();
    if (!income) return '0%';
    const value = (this.netTotal() / income) * 100;
    return `${value.toFixed(1)}%`;
  });

  hasData = computed(() => this.summaryData().length > 0);


  chartData = computed<ChartData<'bar'>>(() => {
    const data = this.summaryData();
    const labels = data.map(item => item.machineId);

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Ingreso Total',
          data: data.map(item => item.income),
          backgroundColor: 'rgba(124, 58, 237, 0.20)',
          borderColor: 'rgba(124, 58, 237, 0.55)',
          borderWidth: 2,
          borderRadius: 12,
          borderSkipped: false,
          barThickness: 34,
          maxBarThickness: 36,
          categoryPercentage: 1,
          barPercentage: 1,
          grouped: false,
          order: 1
        },
        {
          type: 'bar' as const,
          label: 'Ganancia Neta',
          data: data.map(item => item.net),
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 0,
          borderRadius: 10,
          borderSkipped: false,
          barThickness: 18,
          maxBarThickness: 20,
          categoryPercentage: 1,
          barPercentage: 1,
          grouped: false,
          order: 2
        }
      ]
    };
  });

  chartType = 'bar' as const;

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 24
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
      onComplete: () => {
        // Callback cuando la animación completa
      }
    },
    transitions: {
      active: {
        animation: {
          duration: 400
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (!items?.length) return '';
            const label = items[0].label ?? '';
            const driver = this.driversByMachine().get(label) ?? '';
            return driver ? `${driver} — Máquina ${label}` : `Máquina ${label}`;
          },
          label: (context) => {
            const value = context.parsed.y;
            const label = context.dataset.label ?? '';
            return `${label}: ${value !== null ? this.formatCurrency(value) : '$0'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          callback: (value) => this.formatCurrency(value as number),
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
          callback: (_value: string | number, index: number): string => {
            const labels = this.chartData().labels ?? [];
            return String(labels[index] ?? '');
          },
          font: {
            size: 11
          }
        }
      }
    }
  };

  ngOnInit(): void {
    // Cargar datos reales del servicio
    const now = new Date();
    this.dashboardService.getFinancialSummary(now.getMonth() + 1, now.getFullYear())
      .pipe(
        catchError(() => of(null))
      )
      .subscribe();

    // Emitimos la métrica inicial para mantener compatibilidad con el contenedor
    this.metricChange.emit(this.currentMetric());
  }

  // Exponer datos para uso externo
  getFinancialData() {
    return this.financialData();
  }

  getTotalForMetric(metric: FinancialMetric): number {
    const data = this.financialData()[metric];
    return data.reduce((sum, item) => sum + item.value, 0);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  formatHeaderValue(value: number): string {
    // Evitamos abreviar en millones para reflejar montos más realistas de los choferes.
    return this.formatCurrency(value);
  }

}

