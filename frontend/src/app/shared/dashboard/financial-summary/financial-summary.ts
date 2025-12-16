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
    <div class="card bg-base-100 shadow-xl animate-card-enter flex flex-col" [class.h-[424px]]="showChartOnly()">
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
        @if (!showChartOnly()) {
          <!-- KPI Total -->
          <div class="mb-4">
            <div class="text-sm text-base-content/70 mb-1">{{ kpiLabel() }}</div>
            <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold tabular-nums transition-all duration-300" 
                 [class.animate-scale-up]="kpiValueChanged()"
                 [style.animation-fill-mode]="'both'">
              {{ kpiValue() }}
            </div>
          </div>
        }

        <!-- Controles -->
        <div class="flex flex-wrap items-center gap-4 mb-4 flex-shrink-0">
          <div class="inline-flex bg-base-200/50 p-1 rounded-xl gap-1">
            <button 
              class="btn btn-sm h-9 px-4 rounded-lg border-none transition-all font-normal"
              [class.bg-white]="currentMetric() === 'Ganancia Neta'"
              [class.shadow-sm]="currentMetric() === 'Ganancia Neta'"
              [class.text-primary]="currentMetric() === 'Ganancia Neta'"
              [class.text-base-content/60]="currentMetric() !== 'Ganancia Neta'"
              [class.hover:bg-base-200]="currentMetric() !== 'Ganancia Neta'"
              [class.bg-transparent]="currentMetric() !== 'Ganancia Neta'"
              (click)="setMetric('Ganancia Neta')">
              Ganancia Neta
            </button>
            <button 
              class="btn btn-sm h-9 px-4 rounded-lg border-none transition-all font-normal"
              [class.bg-white]="currentMetric() === 'Ingreso Total'"
              [class.shadow-sm]="currentMetric() === 'Ingreso Total'"
              [class.text-primary]="currentMetric() === 'Ingreso Total'"
              [class.text-base-content/60]="currentMetric() !== 'Ingreso Total'"
              [class.hover:bg-base-200]="currentMetric() !== 'Ingreso Total'"
              [class.bg-transparent]="currentMetric() !== 'Ingreso Total'"
              (click)="setMetric('Ingreso Total')">
              Ingreso Total
            </button>
          </div>
          @if (!showChartOnly()) {
            <div class="form-control">
              <input 
                type="text" 
                class="input input-bordered input-sm w-48" 
                [value]="dateRange()"
                readonly>
            </div>
          }
        </div>

        <!-- Gráfico -->
        <div class="relative h-[280px] w-full flex-shrink-0" appLazyChart #lazyChart="lazyChart">
          <!-- Skeleton del gráfico (barras horizontales) -->
          @if (!lazyChart.isVisible()) {
            <div class="w-full h-full rounded-xl bg-base-100 border border-base-200 p-4 sm:p-6">
              <div class="h-full flex flex-col gap-3">
                <!-- Barras horizontales -->
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="flex items-center gap-3">
                    <!-- Etiqueta Y (izquierda) -->
                    <div class="w-16 h-4 skeleton-shimmer rounded flex-shrink-0"></div>
                    <!-- Barra horizontal -->
                    <div class="flex-1 h-6 skeleton-shimmer rounded" [style.width.%]="20 + (i * 15)"></div>
                    <!-- Valor X (derecha) -->
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
        <p class="text-xs text-base-content/70 mt-2 flex-shrink-0">
          Eje Y: Valores monetarios exactos. Hover sobre cada barra para ver detalles completos (RF-030).
        </p>
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

  chartData = computed<ChartData<'bar'>>(() => {
    const data = this.financialData()[this.currentMetric()];
    const isGanancia = this.currentMetric() === 'Ganancia Neta';
    
    // Paleta de colores corporativa profesional
    // Para ganancia: verde corporativo (success)
    // Para ingreso: azul corporativo (primary)
    const baseColor = isGanancia 
      ? 'hsl(142, 71%, 50%)'  // Verde corporativo para ganancia
      : 'hsl(217, 91%, 65%)'; // Azul corporativo para ingreso
    
    return {
      labels: data.map(item => item.machineId),
      datasets: [{
        label: this.currentMetric(),
        data: data.map(item => item.value),
        backgroundColor: baseColor,
        borderColor: baseColor,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
    };
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
          color: 'rgba(0, 0, 0, 0.1)'
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

