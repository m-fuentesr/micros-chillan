import { Component, ChangeDetectionStrategy, input, computed, OnInit, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DailyProfitabilityData } from '../../models/accounting.models';

@Component({
  selector: 'app-accounting-chart',
  imports: [BaseChartDirective],
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
        
        <div class="w-full relative h-[400px]">
          @if (chartData().labels && chartData().labels!.length > 0) {
            <canvas baseChart
              class="w-full h-full"
              [data]="chartData()"
              [options]="chartOptions"
              [type]="chartType">
            </canvas>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingChart implements OnInit {
  dailyData = input.required<DailyProfitabilityData[]>();

  chartType = 'line' as const;

  chartData = computed<ChartData<'line'>>(() => {
    const data = this.dailyData();
    return {
      labels: data.map(d => {
        const date = new Date(d.fecha);
        return date.getDate().toString();
      }),
      datasets: [
        {
          label: 'Ingresos (Bruto)',
          data: data.map(d => d.ingresos),
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
          data: data.map(d => d.egresos),
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
          data: data.map(d => d.ganancia),
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

