import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes',
  imports: [BaseChartDirective, CommonModule],
  template: `
    <div class="space-y-6">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-3xl">Reportes y Estadísticas</h2>
          <p>Visualización de reportes y estadísticas de la flota.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico de Línea: Recaudación Mensual -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Recaudación Mensual</h3>
            <div class="relative h-64 w-full">
              <canvas baseChart
                [data]="lineChartData()"
                [options]="lineChartOptions"
                [type]="lineChartType">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Gráfico de Barras: Consumo de Diésel -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Consumo de Diésel por Máquina</h3>
            <div class="relative h-64 w-full">
              <canvas baseChart
                [data]="barChartData()"
                [options]="barChartOptions"
                [type]="barChartType">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Gráfico de Dona: Distribución de Máquinas -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Distribución de Reportes por Máquina</h3>
            <div class="relative h-64 w-full">
              <canvas baseChart
                [data]="doughnutChartData()"
                [options]="doughnutChartOptions"
                [type]="doughnutChartType">
              </canvas>
            </div>
          </div>
        </div>

        <!-- Gráfico de Área: Tendencia Semanal -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Tendencia Semanal de Recaudación</h3>
            <div class="relative h-64 w-full">
              <canvas baseChart
                [data]="areaChartData()"
                [options]="areaChartOptions"
                [type]="lineChartType">
              </canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reportes implements OnInit {
  // Datos para gráfico de línea
  lineChartData = signal<ChartData<'line'>>({
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Recaudación ($)',
        data: [1200000, 1500000, 1800000, 1650000, 2000000, 2200000],
        borderColor: 'hsl(217, 91%, 60%)', // Azul corporativo
        backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'hsl(217, 91%, 60%)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: false
      }
    ]
  });

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
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
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true
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
          callback: function(value) {
            return '$' + (value as number).toLocaleString('es-CL');
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
          font: {
            size: 11
          }
        }
      }
    }
  };

  lineChartType = 'line' as const;

  // Datos para gráfico de barras
  barChartData = signal<ChartData<'bar'>>({
    labels: ['Máquina 01', 'Máquina 02', 'Máquina 03', 'Máquina 04', 'Máquina 05'],
    datasets: [
      {
        label: 'Litros de Diésel',
        data: [450, 380, 520, 410, 480],
        backgroundColor: [
          'hsl(217, 91%, 60%)',  // Azul corporativo
          'hsl(217, 91%, 55%)',  // Azul más oscuro
          'hsl(217, 91%, 65%)',  // Azul más claro
          'hsl(217, 91%, 50%)',  // Azul más oscuro
          'hsl(217, 91%, 70%)'   // Azul más claro
        ],
        borderColor: [
          'hsl(217, 91%, 55%)',
          'hsl(217, 91%, 50%)',
          'hsl(217, 91%, 60%)',
          'hsl(217, 91%, 45%)',
          'hsl(217, 91%, 65%)'
        ],
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  });

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
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
        displayColors: true
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
          callback: function(value) {
            return value + ' Lts';
          },
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

  barChartType = 'bar' as const;

  // Datos para gráfico de dona
  doughnutChartData = signal<ChartData<'doughnut'>>({
    labels: ['Máquina 01', 'Máquina 02', 'Máquina 03', 'Máquina 04', 'Máquina 05'],
    datasets: [
      {
        label: 'Reportes',
        data: [25, 18, 30, 22, 28],
        backgroundColor: [
          'hsl(217, 91%, 60%)',  // Azul corporativo
          'hsl(217, 91%, 50%)',  // Azul más oscuro
          'hsl(217, 91%, 70%)',  // Azul más claro
          'hsl(142, 71%, 50%)',  // Verde corporativo
          'hsl(38, 92%, 50%)'    // Amarillo corporativo
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  });

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'rgba(0, 0, 0, 0.87)',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
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
        displayColors: true
      }
    }
  };

  doughnutChartType = 'doughnut' as const;

  // Datos para gráfico de área
  areaChartData = signal<ChartData<'line'>>({
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Recaudación ($)',
        data: [1200000, 1500000, 1800000, 1650000, 2000000, 2200000],
        borderColor: 'hsl(217, 91%, 60%)', // Azul corporativo
        backgroundColor: 'hsla(217, 91%, 60%, 0.3)', // Área con opacidad
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'hsl(217, 91%, 60%)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: true
      }
    ]
  });

  // Opciones para gráfico de área
  areaChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
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
        displayColors: true
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
          callback: function(value) {
            return '$' + (value as number).toLocaleString('es-CL');
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
          font: {
            size: 11
          }
        }
      }
    }
  };

  ngOnInit(): void {
    // Los datos se inicializan con signals, no se necesita lógica adicional
  }
}
