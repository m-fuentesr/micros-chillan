import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, ChangeDetectorRef, input, output } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { FinancialData, FinancialMetric } from '../../models/dashboard.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LazyChartDirective } from '../../directives/lazy-chart.directive';

@Component({
  selector: 'app-financial-summary',
  imports: [BaseChartDirective, RouterLink, CommonModule, LazyChartDirective],
  template: `
    <div class="card bg-base-100 shadow-xl animate-card-enter flex flex-col relative overflow-hidden" [class.h-[424px]]="showChartOnly()">
      @if (!showChartOnly()) {
        <div class="card-header flex justify-between items-start mb-4">
          <div>
            <h2 class="card-title text-2xl">Resumen Financiero</h2>
            <p class="text-sm text-base-content/70">
              Vista rápida de ganancia neta e ingreso total por máquina (RF-018–RF-021, RF-030).
            </p>
          </div>
          <a routerLink="/reportes" class="btn btn-ghost btn-sm hover-scale">
            Ver Reporte Contable
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </a>
        </div>
      }
      <div class="card-body flex flex-col flex-1 min-h-0">
        <!-- Header compacto premium -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div class="relative flex bg-base-200/70 p-1 rounded-2xl shadow-inner">
            <span
              class="absolute inset-y-1 w-1/2 rounded-xl bg-white shadow-sm transition-transform duration-300"
              [style.transform]="currentMetric() === 'Ganancia Neta' ? 'translateX(0%)' : 'translateX(100%)'">
            </span>
            <button 
              class="relative z-10 px-4 py-1.5 text-xs font-semibold transition-colors"
              [class.text-base-content]="currentMetric() === 'Ganancia Neta'"
              [class.text-base-content/60]="currentMetric() !== 'Ganancia Neta'"
              (click)="setMetric('Ganancia Neta')">
              Ganancia Neta
            </button>
            <button 
              class="relative z-10 px-4 py-1.5 text-xs font-semibold transition-colors"
              [class.text-base-content]="currentMetric() === 'Ingreso Total'"
              [class.text-base-content/60]="currentMetric() !== 'Ingreso Total'"
              (click)="setMetric('Ingreso Total')">
              Ingreso Total
            </button>
          </div>

          <div class="flex items-end gap-4 ml-auto">
            @if (!showChartOnly()) {
              <div class="text-right">
                <p class="text-[10px] uppercase font-bold text-base-content/50 tracking-widest">Rango</p>
                <p class="text-xs font-semibold text-base-content/70">{{ dateRange() }}</p>
              </div>
            }
            <div class="text-right">
              <p class="text-[10px] uppercase font-bold text-base-content/40 tracking-widest">{{ kpiLabel() }}</p>
              <p class="text-lg sm:text-xl font-black text-base-content tabular-nums" 
                 [class.animate-scale-up]="kpiValueChanged()"
                 [style.animation-fill-mode]="'both'">
                {{ kpiValue() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Gráfico -->
        <div class="relative h-[290px] w-full flex-shrink-0 rounded-2xl border border-base-200/70 bg-base-100/80 overflow-hidden" appLazyChart #lazyChart="lazyChart"
             style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px); background-size: 100% 44px;">
          <button
            class="btn btn-ghost btn-xs btn-circle absolute right-2 top-2 text-base-content/60 hover:text-base-content tooltip tooltip-left"
            [attr.data-tip]="'Eje Y: Valores monetarios exactos. Hover para detalles (RF-030)'"
            type="button"
            aria-label="Detalles del gráfico">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </button>

          <!-- Skeleton del gráfico (barras horizontales) -->
          @if (!lazyChart.isVisible()) {
            <div class="w-full h-full bg-base-100/80 p-4 sm:p-6">
              <div class="h-full flex flex-col gap-3">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-4 skeleton-shimmer rounded flex-shrink-0"></div>
                    <div class="flex-1 h-6 skeleton-shimmer rounded" [style.width.%]="20 + (i * 15)"></div>
                    <div class="w-20 h-3 skeleton-shimmer rounded flex-shrink-0"></div>
                  </div>
                }
              </div>
            </div>
          }
          @if (lazyChart.isVisible()) {
            <canvas baseChart
              [data]="chartData()"
              [options]="chartOptions"
              [type]="chartType">
            </canvas>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialSummary implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  showChartOnly = input(false);
  currentMetric = signal<FinancialMetric>('Ganancia Neta');
  dateRange = signal('Ene 1 - Dic 31');
  metricChange = output<FinancialMetric>();
  private previousKpiValue = signal<string>('');
  kpiValueChanged = signal(false);
  
  // Datos de ejemplo (en producción vendrían del servicio)
  financialData = signal<Record<FinancialMetric, FinancialData[]>>({
    'Ganancia Neta': [
      { machineId: '01', driver: 'Carlos Rodríguez', value: 2450000 },
      { machineId: '02', driver: 'Ana Gómez', value: 3200000 },
      { machineId: '03', driver: 'María López', value: 1800000 },
      { machineId: '05', driver: 'Juan Pérez', value: 4100000 },
      { machineId: '07', driver: 'Pedro Gómez', value: 2800000 }
    ],
    'Ingreso Total': [
      { machineId: '01', driver: 'Carlos Rodríguez', value: 8500000 },
      { machineId: '02', driver: 'Ana Gómez', value: 9200000 },
      { machineId: '03', driver: 'María López', value: 7200000 },
      { machineId: '05', driver: 'Juan Pérez', value: 10500000 },
      { machineId: '07', driver: 'Pedro Gómez', value: 8800000 }
    ]
  });

  chartData = computed<ChartData<'bar' | 'line'>>(() => {
    const metric = this.currentMetric();
    const primaryData = this.financialData()[metric];
    const overlayMetric = metric === 'Ganancia Neta' ? 'Ingreso Total' : null;

    // Paleta de colores corporativa profesional
    const baseColor = metric === 'Ganancia Neta' 
      ? 'hsl(142, 71%, 45%)'  // Verde corporativo para ganancia
      : 'hsl(217, 91%, 60%)'; // Azul corporativo para ingreso
    
    const labels = primaryData.map(item => item.machineId);

    const datasets: ChartData<'bar' | 'line'>['datasets'] = [{
      label: metric,
      data: primaryData.map(item => item.value),
      backgroundColor: baseColor,
      borderColor: baseColor,
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 28
    }];

    // Overlay de referencia (línea gris con ingreso total cuando miramos ganancia)
    if (overlayMetric) {
      const overlayData = this.financialData()[overlayMetric];
      const overlayValues = labels.map(label => overlayData.find(item => item.machineId === label)?.value ?? 0);
      datasets.push({
        type: 'line',
        label: overlayMetric,
        data: overlayValues,
        borderColor: 'rgba(107, 114, 128, 0.7)',
        backgroundColor: 'rgba(107, 114, 128, 0.08)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        fill: false,
      } as any);
    }

    return { labels, datasets };
  });

  kpiLabel = computed(() => {
    const metric = this.currentMetric();
    return metric.includes('Total') ? metric : `${metric} Total`;
  });

  kpiValue = computed(() => {
    const data = this.financialData()[this.currentMetric()];
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return this.formatCurrency(total);
  });

  chartType = 'bar' as const;

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: () => '',
          label: (context) => {
            const index = context.dataIndex;
            const currentData = this.financialData()[this.currentMetric()];
            const value = context.parsed.y;
            return [
              currentData[index]?.driver || '',
              value !== null ? this.formatCurrency(value) : '$0'
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.08)'
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
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
          color: 'rgba(0, 0, 0, 0.7)',
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
  }

  setMetric(metric: FinancialMetric): void {
    if (this.currentMetric() !== metric) {
      this.currentMetric.set(metric);
      this.metricChange.emit(metric);
      
      // Trigger animation en KPI value
      const newValue = this.kpiValue();
      if (this.previousKpiValue() !== newValue) {
        this.kpiValueChanged.set(true);
        setTimeout(() => {
          this.kpiValueChanged.set(false);
        }, 300);
        this.previousKpiValue.set(newValue);
      }
    }
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
}

