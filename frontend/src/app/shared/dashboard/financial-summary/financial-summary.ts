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
                  <path d="M3 21h18M6 18v-6M10 18v-10M14 18v-4M18 18v-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
  
  // Datos reactivos desde el backend - se actualizan automáticamente con WebSocket
  financialData = computed<Record<FinancialMetric, FinancialData[]>>(() => {
    const dashboardData = this.dashboardService.dashboardData();
    
    // Si hay datos del backend, usarlos
    if (dashboardData?.rendimiento && dashboardData.rendimiento.length > 0) {
      const rendimiento = dashboardData.rendimiento;
      
      return {
        'Ganancia Neta': rendimiento.map(m => ({
          machineId: m.numero_interno?.toString() || `M${m.maquina_id}`,
          driver: m.chofer || 'Sin chofer asignado',
          value: m.ganancia_neta
        })),
        'Ingreso Total': rendimiento.map(m => ({
          machineId: m.numero_interno?.toString() || `M${m.maquina_id}`,
          driver: m.chofer || 'Sin chofer asignado',
          value: m.monto_recaudado
        }))
      };
    }
    
    return {
      'Ganancia Neta': [],
      'Ingreso Total': []
    };
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
    // Configuración general de animaciones
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
      onComplete: () => {
        // Callback cuando la animación completa
      }
    },
    // Transiciones Premium/Experta para efecto "Organic Rise"
    transitions: {
      // 1. Animación al cargar por primera vez (SHOW)
      show: {
        animations: {
          y: {
            from: (context) => {
              // Empieza desde abajo (base del gráfico)
              if (context.chart && context.chart.scales?.['y']) {
                return context.chart.scales['y'].getPixelForValue(0);
              }
              return 500; // Fallback: empieza desde abajo
            },
            duration: 800,
            easing: 'easeOutQuart' as const
          },
          opacity: {
            from: 0,
            to: 1,
            duration: 500,
            easing: 'easeOutQuart' as const
          }
        }
      },
      // 2. Animación cuando llegan DATOS NUEVOS (WebSocket)
      active: {
        animations: {
          // Eje X: Las barras existentes se deslizan a su nuevo lugar
          x: {
            duration: 600,
            easing: 'easeOutQuart' as const
          },
          // Eje Y: La NUEVA barra crece desde cero, las existentes se ajustan suavemente
          y: {
            duration: 800,
            easing: 'easeOutQuart' as const,
            delay: (context: any) => {
              // Efecto cascada: pequeño retraso basado en el índice si llegan varios datos a la vez
              return (context.dataIndex || 0) * 50;
            },
            from: (context: any) => {
              // MAGIA AQUÍ: Si es un dato nuevo, forzamos que la animación empiece desde la base (0)
              // chart.scales['y'].getPixelForValue(0) obtiene el pixel exacto de la base
              try {
                // Verificar si es una actualización de datos (nuevo elemento o cambio)
                if (context.chart && context.chart.scales?.['y']) {
                  const baseY = context.chart.scales['y'].getPixelForValue(0);
                  // Si el contexto indica que es un nuevo dato o actualización
                  // animar desde la base para efecto "Organic Rise"
                  if (context.type === 'data' || context.mode === 'default') {
                    return baseY;
                  }
                }
              } catch (e) {
                // Si hay algún error, usar undefined para animación natural
                console.debug('Error calculando from para animación Y:', e);
              }
              return undefined; // Si no es nuevo, usa la posición natural (animación suave)
            }
          },
          // Efecto visual: La barra nueva aparece un poco transparente y se llena
          backgroundColor: {
            type: 'color' as const,
            duration: 500,
            from: 'transparent',
            easing: 'easeOutQuart' as const
          }
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
    // Los datos se cargan automáticamente desde dashboardService.dashboardData()
    // que se actualiza mediante WebSocket cuando hay cambios
    // No necesitamos cargar datos aquí porque el servicio ya los tiene
    
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

