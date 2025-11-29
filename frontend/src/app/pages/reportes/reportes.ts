import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReportsService } from '../../shared/services/reports.service';
import { LazyChartDirective } from '../../shared/directives/lazy-chart.directive';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

interface MachineProfit {
  rank: number;
  machine: string;
  income: number;
  dieselCost: number;
  driverPayment: number;
  maintenance: number | null;
  netProfit: number;
}

interface DriverProfit {
  rank: number;
  driver: string;
  income: number;
  dieselCost: number;
  payment: number;
  netProfit: number;
}

@Component({
  selector: 'app-reportes',
  imports: [BaseChartDirective, CommonModule, LazyChartDirective, LoadingSkeleton, LoadingSpinner],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header -->
      <div class="animate-header-enter">
        <h1 class="text-4xl font-bold mb-2 tracking-tight text-base-content">Reportes y Estadísticas</h1>
        <p class="text-base-content/60 font-medium">Análisis financiero y operativo de la flota</p>
      </div>

      <!-- Barra de Comandos: Tabs -->
      <div class="border-b border-base-200 pb-4 mb-6">
        <!-- Segmented Control (Tabs) - Carrusel horizontal en móvil -->
        <div class="flex overflow-x-auto gap-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide items-center">
          <div class="inline-flex bg-base-200/50 p-1 rounded-xl gap-1 lg:min-w-0">
            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap flex-shrink-0"
              [class.bg-white]="activeTab() === 'profit'"
              [class.shadow-sm]="activeTab() === 'profit'"
              [class.text-primary]="activeTab() === 'profit'"
              [class.text-base-content/60]="activeTab() !== 'profit'"
              [class.hover:bg-base-200]="activeTab() !== 'profit'"
              [class.bg-transparent]="activeTab() !== 'profit'"
              (click)="activeTab.set('profit')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
              <span class="text-xs lg:text-sm">Rentabilidad por Máquina</span>
            </button>

            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap flex-shrink-0"
              [class.bg-white]="activeTab() === 'revenue'"
              [class.shadow-sm]="activeTab() === 'revenue'"
              [class.text-primary]="activeTab() === 'revenue'"
              [class.text-base-content/60]="activeTab() !== 'revenue'"
              [class.hover:bg-base-200]="activeTab() !== 'revenue'"
              [class.bg-transparent]="activeTab() !== 'revenue'"
              (click)="activeTab.set('revenue')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <span class="text-xs lg:text-sm">Ranking de Ingresos</span>
            </button>

            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap flex-shrink-0"
              [class.bg-white]="activeTab() === 'driver'"
              [class.shadow-sm]="activeTab() === 'driver'"
              [class.text-primary]="activeTab() === 'driver'"
              [class.text-base-content/60]="activeTab() !== 'driver'"
              [class.hover:bg-base-200]="activeTab() !== 'driver'"
              [class.bg-transparent]="activeTab() !== 'driver'"
              (click)="activeTab.set('driver')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span class="text-xs lg:text-sm">Rentabilidad por Chofer</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Contenido de Tabs -->
      <div class="card bg-base-100 shadow-xl animate-card-enter">
        <div class="card-body">
          @if (activeTab() === 'profit') {
            <!-- Tab: Rentabilidad por Máquina -->
            <div class="space-y-6 animate-tab-panel">
              <!-- Header con KPI y controles -->
              <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Ganancia Neta Total</div>
                  <div class="text-3xl lg:text-4xl font-bold text-base-content tabular-nums">{{ totalProfit() | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                </div>
                <div class="flex items-center gap-2 w-full lg:w-auto">
                  <div class="dropdown dropdown-end w-1/2 lg:w-auto">
                    <div tabindex="0" role="button" class="btn btn-outline btn-sm gap-2 w-full lg:w-auto justify-between">
                      <span>{{ selectedPeriod() }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
                      <li><a (click)="selectedPeriod.set('Noviembre 2025')">Noviembre 2025</a></li>
                      <li><a (click)="selectedPeriod.set('Octubre 2025')">Octubre 2025</a></li>
                      <li><a (click)="selectedPeriod.set('Últimos 3 Meses')">Últimos 3 Meses</a></li>
                      <li><a (click)="selectedPeriod.set('Año 2025')">Año 2025</a></li>
                    </ul>
                  </div>
                  <button class="btn btn-primary btn-sm gap-2 w-1/2 lg:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Exportar
                  </button>
                </div>
              </div>

              <!-- Gráfico -->
              <div class="relative h-64 lg:h-80 w-full" appLazyChart #profitChart="lazyChart">
                @if (profitChart.isVisible()) {
                  <canvas baseChart
                    [data]="profitChartData()"
                    [options]="profitChartOptions"
                    [type]="barChartType">
                  </canvas>
                } @else {
                  <div class="flex items-center justify-center h-full text-base-content/40">
                    <div class="text-center">
                      <app-loading-spinner size="md" text="Cargando gráfico..." />
                    </div>
                  </div>
                }
              </div>

              <!-- Tabla Financiera Desktop -->
              <div class="hidden lg:block overflow-x-auto">
                @if (isLoading().profit && machinesData().length === 0) {
                  <app-loading-skeleton type="table" [count]="5" />
                } @else {
                  <table class="table w-full data-table">
                  <thead class="bg-base-200">
                    <tr>
                      <th class="w-16">Rank</th>
                      <th>Máquina</th>
                      <th class="text-right">Ingreso Total ($)</th>
                      <th class="text-right">Costo Diésel ($)</th>
                      <th class="text-right">Pago Choferes ($)</th>
                      <th class="text-right">Mantenimiento ($)</th>
                      <th class="text-right">Ganancia Neta ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of machinesData(); track item.rank) {
                      <tr class="hover">
                        <td class="font-mono text-xs text-base-content/60">{{ item.rank }}</td>
                        <td><strong>{{ item.machine }}</strong></td>
                        <td class="text-right tabular-nums">{{ item.income | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="text-right tabular-nums text-base-content/70">{{ item.dieselCost | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="text-right tabular-nums text-base-content/70">{{ item.driverPayment | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="text-right tabular-nums text-base-content/70">
                          @if (item.maintenance !== null) {
                            {{ item.maintenance | currency:'CLP':'symbol-narrow':'1.0-0' }}
                          } @else {
                            <span class="text-base-content/40">-</span>
                          }
                        </td>
                        <td class="text-right tabular-nums font-bold text-primary bg-primary/5">{{ item.netProfit | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                }
              </div>

              <!-- Tarjetas Móviles -->
              <div class="block lg:hidden space-y-4">
                @if (isLoading().profit && machinesData().length === 0) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <app-loading-skeleton type="card" />
                  }
                } @else {
                  @for (item of machinesData(); track item.rank) {
                  <div class="bg-base-100 rounded-xl border border-base-200 p-4 shadow-sm relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1" [class.bg-primary]="item.rank === 1" [class.bg-primary/70]="item.rank === 2" [class.bg-primary/50]="item.rank > 2"></div>
                    <div class="pl-2">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="badge badge-sm badge-ghost font-mono">#{{ item.rank }}</span>
                            <h3 class="font-bold text-lg">{{ item.machine }}</h3>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-xs text-base-content/60 uppercase">Ganancia Neta</div>
                          <div class="text-xl font-bold text-primary tabular-nums">{{ item.netProfit | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm border-t border-base-100 pt-3">
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Ingreso Total</div>
                          <div class="font-semibold tabular-nums">{{ item.income | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Pago Choferes</div>
                          <div class="font-semibold tabular-nums">{{ item.driverPayment | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Costo Diésel</div>
                          <div class="font-semibold tabular-nums text-error/80">{{ item.dieselCost | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Mantenimiento</div>
                          @if (item.maintenance !== null) {
                            <div class="font-semibold tabular-nums text-error/80">{{ item.maintenance | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                          } @else {
                            <div class="text-base-content/40 italic">-</div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  }
                }
              </div>
            </div>
          }

          @if (activeTab() === 'revenue') {
            <!-- Tab: Ranking de Ingresos (Bruto) -->
            <div class="space-y-6 animate-tab-panel">
              <!-- Header con KPI y controles -->
              <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Ingreso Total Bruto</div>
                  <div class="text-3xl lg:text-4xl font-bold text-base-content tabular-nums">{{ totalIncome() | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                </div>
                <div class="flex items-center gap-2 w-full lg:w-auto">
                  <div class="dropdown dropdown-end w-1/2 lg:w-auto">
                    <div tabindex="0" role="button" class="btn btn-outline btn-sm gap-2 w-full lg:w-auto justify-between">
                      <span>{{ selectedPeriod() }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
                      <li><a (click)="selectedPeriod.set('Noviembre 2025')">Noviembre 2025</a></li>
                      <li><a (click)="selectedPeriod.set('Octubre 2025')">Octubre 2025</a></li>
                      <li><a (click)="selectedPeriod.set('Últimos 3 Meses')">Últimos 3 Meses</a></li>
                      <li><a (click)="selectedPeriod.set('Año 2025')">Año 2025</a></li>
                    </ul>
                  </div>
                  <button class="btn btn-primary btn-sm gap-2 w-1/2 lg:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Exportar
                  </button>
                </div>
              </div>

              <!-- Gráfico -->
              <div class="relative h-64 lg:h-80 w-full" appLazyChart #revenueChart="lazyChart">
                @if (revenueChart.isVisible()) {
                  <canvas baseChart
                    [data]="revenueChartData()"
                    [options]="revenueChartOptions"
                    [type]="barChartType">
                  </canvas>
                } @else {
                  <div class="flex items-center justify-center h-full text-base-content/40">
                    <div class="text-center">
                      <app-loading-spinner size="md" text="Cargando gráfico..." />
                    </div>
                  </div>
                }
              </div>

              <!-- Tabla de Ingresos Desktop -->
              <div class="hidden lg:block overflow-x-auto">
                @if (isLoading().revenue && revenueRankingData().length === 0) {
                  <app-loading-skeleton type="table" [count]="5" />
                } @else {
                  <table class="table w-full data-table">
                  <thead class="bg-base-200">
                    <tr>
                      <th class="w-16">Ranking</th>
                      <th>Nº Máquina</th>
                      <th class="text-right">Ingreso Total ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of revenueRankingData(); track item.rank) {
                      <tr class="hover">
                        <td class="font-mono text-xs text-base-content/60">{{ item.rank }}</td>
                        <td><strong>{{ item.machine }}</strong></td>
                        <td class="text-right tabular-nums font-bold text-primary">{{ item.income | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                }
              </div>

              <!-- Tarjetas Móviles -->
              <div class="block lg:hidden space-y-4">
                @if (isLoading().revenue && revenueRankingData().length === 0) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <app-loading-skeleton type="card" />
                  }
                } @else {
                  @for (item of revenueRankingData(); track item.rank) {
                  <div class="bg-base-100 rounded-xl border border-base-200 p-4 shadow-sm relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1" [class.bg-success]="item.rank === 1" [class.bg-success/70]="item.rank === 2" [class.bg-success/50]="item.rank > 2"></div>
                    <div class="pl-2">
                      <div class="flex justify-between items-start">
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="badge badge-sm badge-ghost font-mono">#{{ item.rank }}</span>
                            <h3 class="font-bold text-lg">{{ item.machine }}</h3>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-xs text-base-content/60 uppercase mb-1">Ingreso Total</div>
                          <div class="text-xl font-bold text-success tabular-nums">{{ item.income | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  }
                }
              </div>
            </div>
          }

          @if (activeTab() === 'driver') {
            <!-- Tab: Rentabilidad por Chofer -->
            <div class="space-y-6 animate-tab-panel">
              <!-- Header con KPI y controles -->
              <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Ganancia Neta Total Choferes</div>
                  <div class="text-3xl lg:text-4xl font-bold text-base-content tabular-nums">{{ totalDriverProfit() | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                </div>
                <div class="flex items-center gap-2 w-full lg:w-auto">
                  <div class="dropdown dropdown-end w-1/2 lg:w-auto">
                    <div tabindex="0" role="button" class="btn btn-outline btn-sm gap-2 w-full lg:w-auto justify-between">
                      <span>{{ selectedPeriod() }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
                      <li><a (click)="selectedPeriod.set('Noviembre 2025')">Noviembre 2025</a></li>
                      <li><a (click)="selectedPeriod.set('Octubre 2025')">Octubre 2025</a></li>
                      <li><a (click)="selectedPeriod.set('Últimos 3 Meses')">Últimos 3 Meses</a></li>
                      <li><a (click)="selectedPeriod.set('Año 2025')">Año 2025</a></li>
                    </ul>
                  </div>
                  <button class="btn btn-primary btn-sm gap-2 w-1/2 lg:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Exportar
                  </button>
                </div>
              </div>

              <!-- Gráfico -->
              <div class="relative h-64 lg:h-80 w-full" appLazyChart #driverChart="lazyChart">
                @if (driverChart.isVisible()) {
                  <canvas baseChart
                    [data]="driverChartData()"
                    [options]="driverChartOptions"
                    [type]="barChartType">
                  </canvas>
                } @else {
                  <div class="flex items-center justify-center h-full text-base-content/40">
                    <div class="text-center">
                      <app-loading-spinner size="md" text="Cargando gráfico..." />
                    </div>
                  </div>
                }
              </div>

              <!-- Tabla de Choferes Desktop -->
              <div class="hidden lg:block overflow-x-auto">
                @if (isLoading().driver && driversData().length === 0) {
                  <app-loading-skeleton type="table" [count]="5" />
                } @else {
                  <table class="table w-full data-table">
                  <thead class="bg-base-200">
                    <tr>
                      <th class="w-16">Rank</th>
                      <th>Chofer</th>
                      <th class="text-right">Ingreso Total ($)</th>
                      <th class="text-right">Costo Diésel ($)</th>
                      <th class="text-right">Pago Chofer ($)</th>
                      <th class="text-right">Ganancia Neta ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of driversData(); track item.rank) {
                      <tr class="hover">
                        <td class="font-mono text-xs text-base-content/60">{{ item.rank }}</td>
                        <td><strong>{{ item.driver }}</strong></td>
                        <td class="text-right tabular-nums">{{ item.income | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="text-right tabular-nums text-base-content/70">{{ item.dieselCost | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="text-right tabular-nums text-base-content/70">{{ item.payment | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="text-right tabular-nums font-bold text-primary bg-primary/5">{{ item.netProfit | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                }
              </div>

              <!-- Tarjetas Móviles -->
              <div class="block lg:hidden space-y-4">
                @if (isLoading().driver && driversData().length === 0) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <app-loading-skeleton type="card" />
                  }
                } @else {
                  @for (item of driversData(); track item.rank) {
                  <div class="bg-base-100 rounded-xl border border-base-200 p-4 shadow-sm relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1" [class.bg-primary]="item.rank === 1" [class.bg-primary/70]="item.rank === 2" [class.bg-primary/50]="item.rank > 2"></div>
                    <div class="pl-2">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="badge badge-sm badge-ghost font-mono">#{{ item.rank }}</span>
                            <h3 class="font-bold text-lg">{{ item.driver }}</h3>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-xs text-base-content/60 uppercase">Ganancia Neta</div>
                          <div class="text-xl font-bold text-primary tabular-nums">{{ item.netProfit | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm border-t border-base-100 pt-3">
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Ingreso Total</div>
                          <div class="font-semibold tabular-nums">{{ item.income | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Pago Chofer</div>
                          <div class="font-semibold tabular-nums">{{ item.payment | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
                        <div>
                          <div class="text-xs text-base-content/50 mb-0.5">Costo Diésel</div>
                          <div class="font-semibold tabular-nums text-error/80">{{ item.dieselCost | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                        </div>
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
    /* Ocultar scrollbar pero mantener funcionalidad de scroll */
    .scrollbar-hide {
      -ms-overflow-style: none;  /* IE y Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;  /* Chrome, Safari y Opera */
    }

    .data-table {
      font-size: 13px;
    }

    .data-table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      font-size: 11px;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f3f4f6;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
    }

    /* Columnas numéricas alineadas a la derecha */
    .data-table th:nth-child(3),
    .data-table td:nth-child(3),
    .data-table th:nth-child(4),
    .data-table td:nth-child(4),
    .data-table th:nth-child(5),
    .data-table td:nth-child(5),
    .data-table th:nth-child(6),
    .data-table td:nth-child(6),
    .data-table th:nth-child(7),
    .data-table td:nth-child(7),
    .data-table th:nth-child(8),
    .data-table td:nth-child(8) {
      text-align: right;
    }

    .data-table td:last-child {
      font-weight: 700;
      color: hsl(var(--p));
      background-color: hsl(var(--p) / 0.05);
    }

    .data-table tr:hover td {
      background-color: #f1f5f9;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reportes implements OnInit {
  private reportsService = inject(ReportsService);
  
  selectedPeriod = signal<string>('Noviembre 2025');
  activeTab = signal<string>('profit');
  isLoading = signal({
    profit: true,
    revenue: true,
    driver: true
  } as { profit: boolean; revenue: boolean; driver: boolean });

  // Cargar datos del servicio
  private machineRankingResponse = toSignal(
    this.reportsService.getMachineRanking({
      orden_por: 'ganancia',
      orden: 'desc'
    }),
    { initialValue: [] }
  );

  private driverRankingResponse = toSignal(
    this.reportsService.getDriverRanking({
      orden_por: 'ganancia',
      orden: 'desc'
    }),
    { initialValue: [] }
  );

  private profitabilityResponse = toSignal(
    this.reportsService.getProfitabilityReport({
      agrupado_por: 'mes'
    }),
    { initialValue: null }
  );

  ngOnInit(): void {
    // Desactivar loading después de un tiempo razonable
    setTimeout(() => {
      this.isLoading.update(state => ({
        ...state,
        profit: false,
        revenue: false,
        driver: false
      }));
    }, 500);
  }

  // Mapear datos de máquinas desde el servicio
  private rawMachinesData = computed((): MachineProfit[] => {
    const ranking = this.machineRankingResponse();
    return ranking.map((item, index) => ({
      rank: index + 1,
      machine: item.maquina_identificador,
      income: item.total_recaudado,
      dieselCost: 0, // TODO: Calcular desde datos de registros diarios
      driverPayment: 0, // TODO: Calcular desde datos de registros diarios
      maintenance: null, // TODO: Obtener desde servicio de mantenimiento
      netProfit: item.total_ganancia
    }));
  });

  // Datos hardcodeados de respaldo (temporal)
  private fallbackMachinesData: MachineProfit[] = [
    {
      rank: 1,
      machine: 'Máquina 02',
      income: 4700000,
      dieselCost: 1100000,
      driverPayment: 320000,
      maintenance: null,
      netProfit: 3280000
    },
    {
      rank: 2,
      machine: 'Máquina 05',
      income: 5200000,
      dieselCost: 1350000,
      driverPayment: 350000,
      maintenance: 535000,
      netProfit: 2965000
    },
    {
      rank: 3,
      machine: 'Máquina 07',
      income: 4250000,
      dieselCost: 1050000,
      driverPayment: 300000,
      maintenance: 120000,
      netProfit: 2780000
    },
    {
      rank: 4,
      machine: 'Máquina 01',
      income: 3950000,
      dieselCost: 980000,
      driverPayment: 290000,
      maintenance: null,
      netProfit: 2680000
    },
    {
      rank: 5,
      machine: 'Máquina 03',
      income: 3500000,
      dieselCost: 990000,
      driverPayment: 310000,
      maintenance: null,
      netProfit: 2200000
    }
  ];

  machinesData = computed(() => {
    const data = this.rawMachinesData();
    return data.length > 0 ? data : this.fallbackMachinesData;
  });

  totalProfit = computed(() => {
    const data = this.rawMachinesData();
    return data.reduce((sum: number, m: MachineProfit) => sum + m.netProfit, 0);
  });

  // Datos para Ranking de Ingresos (Bruto)
  private rawRevenueData = [
    { machine: 'Máquina 05', income: 5200000, reports: 28, average: 185714 },
    { machine: 'Máquina 02', income: 4700000, reports: 25, average: 188000 },
    { machine: 'Máquina 01', income: 3950000, reports: 22, average: 179545 },
    { machine: 'Máquina 07', income: 4250000, reports: 24, average: 177083 },
    { machine: 'Máquina 03', income: 3500000, reports: 20, average: 175000 }
  ];

  revenueRankingData = computed(() => {
    return this.rawRevenueData
      .sort((a, b) => b.income - a.income)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  });

  totalIncome = computed(() => {
    return this.rawRevenueData.reduce((sum: number, m) => sum + m.income, 0);
  });

  revenueChartData = computed<ChartData<'bar'>>(() => {
    const data = this.revenueRankingData();
    return {
      labels: data.map(m => m.machine),
      datasets: [
        {
          label: 'Ingreso Bruto',
          data: data.map(m => m.income),
          backgroundColor: '#10b981',
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    };
  });

  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            if (value === null || value === undefined) return 'Ingreso: $0';
            return `Ingreso: ${new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value).replace('CLP', '$')}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          callback: function(value) {
            const num = value as number;
            return '$' + (num / 1000000).toFixed(0) + 'M';
          },
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false
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

  // Mapear datos de choferes desde el servicio
  private rawDriversData = computed((): DriverProfit[] => {
    const ranking = this.driverRankingResponse();
    return ranking.map((item, index) => ({
      rank: index + 1,
      driver: item.chofer_nombre,
      income: item.total_recaudado,
      dieselCost: 0, // TODO: Calcular desde datos de registros diarios
      payment: 0, // TODO: Calcular desde datos de registros diarios
      netProfit: item.total_ganancia
    }));
  });

  // Datos hardcodeados de respaldo (temporal)
  private fallbackDriversData: DriverProfit[] = [
    {
      rank: 1,
      driver: 'Juan Pérez',
      income: 5200000,
      dieselCost: 1350000,
      payment: 350000,
      netProfit: 3500000
    },
    {
      rank: 2,
      driver: 'Carlos Rodríguez',
      income: 4700000,
      dieselCost: 1100000,
      payment: 320000,
      netProfit: 3280000
    },
    {
      rank: 3,
      driver: 'Luis González',
      income: 4250000,
      dieselCost: 1050000,
      payment: 300000,
      netProfit: 2900000
    },
    {
      rank: 4,
      driver: 'Pedro Martínez',
      income: 3950000,
      dieselCost: 980000,
      payment: 290000,
      netProfit: 2680000
    },
    {
      rank: 5,
      driver: 'Miguel Sánchez',
      income: 3500000,
      dieselCost: 990000,
      payment: 310000,
      netProfit: 2200000
    }
  ];

  driversData = computed(() => {
    const data = this.rawDriversData();
    const sorted = data.length > 0 ? data : this.fallbackDriversData;
    return sorted
      .sort((a, b) => b.netProfit - a.netProfit)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  });

  totalDriverProfit = computed(() => {
    const data = this.rawDriversData();
    return data.reduce((sum: number, d: DriverProfit) => sum + d.netProfit, 0);
  });

  driverChartData = computed<ChartData<'bar'>>(() => {
    const data = this.driversData();
    return {
      labels: data.map(d => d.driver),
      datasets: [
        {
          label: 'Ganancia Neta',
          data: data.map(d => d.netProfit),
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    };
  });

  driverChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            if (value === null || value === undefined) return 'Ganancia: $0';
            return `Ganancia: ${new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value).replace('CLP', '$')}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          callback: function(value) {
            const num = value as number;
            return '$' + (num / 1000000).toFixed(0) + 'M';
          },
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false
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

  // Gráfico de ganancia por máquina (horizontal, premium)
  profitChartData = computed<ChartData<'bar'>>(() => {
    const data = this.machinesData();
    return {
      labels: data.map(m => m.machine),
      datasets: [
        {
          label: 'Ganancia Neta',
          data: data.map(m => m.netProfit),
          backgroundColor: '#2563eb',
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    };
  });

  profitChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            if (value === null || value === undefined) return 'Ganancia: $0';
            return `Ganancia: ${new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value).replace('CLP', '$')}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9'
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          maxTicksLimit: 6,
          callback: function(value) {
            const num = value as number;
            return '$' + (num / 1000000).toFixed(0) + 'M';
          },
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false
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
}
