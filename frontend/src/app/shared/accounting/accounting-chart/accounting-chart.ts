import { Component, ChangeDetectionStrategy, input, computed, OnInit, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DailyProfitabilityData } from '../../models/accounting.models';
import { LazyChartDirective } from '../../directives/lazy-chart.directive';
import { getDatePartsInChile } from '../../utils/date.utils';

@Component({
  selector: 'app-accounting-chart',
  imports: [BaseChartDirective, LazyChartDirective],
  template: `
    <div class="card bg-base-100 shadow-sm border border-base-200 w-full">
      <div class="card-body p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-lg font-bold">Evolución de Rentabilidad</h3>
            <p class="text-sm text-base-content/70">
              Comportamiento diario de ingresos vs egresos (MTD).
            </p>
          </div>
        </div>
        
        @if (isLoading() || dailyData().length === 0) {
          <!-- Skeleton completo del gráfico -->
          <div class="w-full relative h-[400px] animate-fade-in">
            <div class="w-full h-full relative bg-base-50 rounded-xl border border-base-200/50 overflow-hidden p-6">
              <!-- Skeleton del área del gráfico con gradiente -->
              <div class="absolute inset-0 bg-gradient-to-b from-base-50/60 to-white pointer-events-none"></div>
              <div class="relative h-full w-full rounded-xl border border-dashed border-base-200/80 overflow-hidden bg-white">
                <div class="absolute inset-0 flex flex-col gap-3 p-6">
                  <!-- Eje Y labels (izquierda) -->
                  <div class="absolute left-0 top-6 bottom-6 w-12 flex flex-col justify-between">
                    @for (i of [1,2,3,4,5]; track i) {
                      <div class="h-2.5 w-12 skeleton-shimmer rounded"></div>
                    }
                  </div>
                  
                  <!-- Eje X labels (abajo) -->
                  <div class="absolute bottom-0 left-12 right-0 h-6 flex items-center justify-between px-6">
                    @for (i of [1,2,3,4,5,6,7]; track i) {
                      <div class="h-2 w-10 skeleton-shimmer rounded"></div>
                    }
                  </div>
                  
                  <!-- Área principal del gráfico -->
                  <div class="flex-1 rounded-xl skeleton-shimmer mt-8 mb-8 ml-12 mr-0"></div>
                </div>
              </div>
              
              <!-- Skeleton de la leyenda (fuera del área del gráfico, centrada) -->
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-6">
                @for (i of [1,2,3]; track i) {
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 skeleton-shimmer rounded-full"></div>
                    <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                  </div>
                }
              </div>
            </div>
          </div>
        } @else {
          <div class="w-full relative h-[400px]" appLazyChart #lazyChart="lazyChart">
            @if (lazyChart.isVisible()) {
              @if (chartData().labels && chartData().labels!.length > 0) {
                <canvas baseChart
                  class="w-full h-full"
                  [data]="chartData()"
                  [options]="chartOptions"
                  [type]="chartType">
                </canvas>
              }
            } @else {
              <div class="flex items-center justify-center h-full text-base-content/40">
                <div class="text-left pl-4 border-l-4 border-l-primary">
                  <div class="loading loading-spinner loading-md mb-2"></div>
                  <p class="text-sm">Cargando gráfico...</p>
                </div>
              </div>
            }
          </div>
        }
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
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
    
    .animate-fade-in {
      animation: fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .skeleton-shimmer {
        animation: none;
      }
      
      .animate-fade-in {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingChart implements OnInit {
  dailyData = input.required<DailyProfitabilityData[]>();
  isLoading = input<boolean>(false);

  chartType = 'line' as const;

  chartData = computed<ChartData<'line'>>(() => {
    const data = this.dailyData();
    
    // Ordenar los datos por fecha usando zona horaria de Chile
    const sortedData = [...data].sort((a, b) => {
      const partsA = getDatePartsInChile(a.fecha);
      const partsB = getDatePartsInChile(b.fecha);
      
      // Comparar año, mes y día
      if (partsA.year !== partsB.year) {
        return partsA.year - partsB.year;
      }
      if (partsA.month !== partsB.month) {
        return partsA.month - partsB.month;
      }
      return partsA.day - partsB.day;
    });
    
    return {
      labels: sortedData.map(d => {
        const parts = getDatePartsInChile(d.fecha);
        return parts.day.toString();
      }),
      datasets: [
        {
          label: 'Ingresos (Bruto)',
          data: sortedData.map(d => d.ingresos),
          borderColor: 'hsl(217, 91%, 60%)', // Azul corporativo (primary)
          backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(217, 91%, 60%)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          fill: false
        },
        {
          label: 'Egresos (Total)',
          data: sortedData.map(d => d.egresos),
          borderColor: 'hsl(0, 84%, 60%)', // Rojo corporativo (error)
          backgroundColor: 'hsla(0, 84%, 60%, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(0, 84%, 60%)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          fill: false
        },
        {
          label: 'Ganancia (Neta)',
          data: sortedData.map(d => d.ganancia),
          borderColor: 'hsl(142, 71%, 50%)', // Verde corporativo (success)
          backgroundColor: 'hsla(142, 71%, 50%, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(142, 71%, 50%)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderDash: [8, 4],
          fill: false
        }
      ]
    };
  });

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
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
          callback: (value) => {
            if (typeof value === 'number') {
              return this.formatCurrency(value);
            }
            return value;
          },
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          maxTicksLimit: 15,
          font: {
            size: 11
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(0, 0, 0, 0.87)',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const data = this.dailyData();
            const sortedData = [...data].sort((a, b) => {
              const partsA = getDatePartsInChile(a.fecha);
              const partsB = getDatePartsInChile(b.fecha);
              if (partsA.year !== partsB.year) return partsA.year - partsB.year;
              if (partsA.month !== partsB.month) return partsA.month - partsB.month;
              return partsA.day - partsB.day;
            });
            const index = context[0]?.dataIndex ?? 0;
            const item = sortedData[index];
            if (item) {
              const parts = getDatePartsInChile(item.fecha);
              const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
              return `${parts.day} ${monthNames[parts.month - 1]} ${parts.year}`;
            }
            return '';
          },
          label: (context) => {
            const value = context.raw;
            if (typeof value === 'number') {
              return ` ${context.dataset.label}: ${this.formatCurrency(value)}`;
            }
            return '';
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  ngOnInit(): void {
    // Chart se inicializa automáticamente
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }
}

