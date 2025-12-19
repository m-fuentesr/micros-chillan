import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject, WritableSignal, effect, PLATFORM_ID } from '@angular/core';
import { AlertList } from '../../shared/dashboard/alert-list/alert-list';
import { FinancialSummary } from '../../shared/dashboard/financial-summary/financial-summary';
import { DailyRecordsTable } from '../../shared/dashboard/daily-records-table/daily-records-table';
import { AlertService } from '../../shared/services/alert.service';
import { DashboardService } from '../../shared/services/dashboard.service';
import { Alert, DailyRecord, FinancialData, FinancialMetric } from '../../shared/models/dashboard.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, EMPTY } from 'rxjs';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { TransitionService } from '../../shared/services/transition.service';
import { BusIcon } from '../../shared/components/bus-icon/bus-icon';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AnimatedCounterDirective } from '../../shared/directives/animated-counter.directive';

@Component({
  selector: 'app-home',
  imports: [CommonModule, AlertList, FinancialSummary, DailyRecordsTable, LoadingSkeleton, BusIcon, KpiCard, AnimatedCounterDirective],
  template: `
    <div class="space-y-6">
      <!-- Header - coherente con el resto de la app -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
            <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
              Panel Principal
            </h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
              Vista rápida del estado operativo, alertas críticas y rendimiento financiero de la flota.
            </p>
          </div>
          
        </div>
      </div>

      <!-- Zona VIP: KPIs Superiores (4 Cards) -->
      <div class="pl-3 md:pl-4">
        @if (kpisLoadingState.isLoading() && !sequentialState.kpisError()) {
          <!-- Skeleton simplificado - se muestra cuando isLoading es true -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            @for (i of [1,2,3,4]; track i) {
              <app-loading-skeleton 
                type="dashboard-kpi" 
                [isExiting]="kpisLoadingState.isSkeletonExiting()" />
            }
          </div>
        } @else if (sequentialState.kpisError()) {
          <div class="card bg-error/10 border border-error/20 rounded-3xl p-4 mb-4">
            <div class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm font-semibold text-error">Error al cargar KPIs</p>
                <p class="text-xs text-error/70">Mostrando datos calculados localmente</p>
              </div>
            </div>
          </div>
          <div 
            [class.opacity-0]="!sequentialState.canShowKPIs()" 
            [class.animate-fade-in]="sequentialState.canShowKPIs()" 
            [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <!-- Card 1: Ganancia Neta (El Bolsillo) -->
              <app-kpi-card
                title="Ganancia Neta"
                [subtitle]="'Neto con descuentos'"
                [numericValue]="gananciaNetaTotalNumeric()"
                [valueFormat]="'currency'"
                [animationDuration]="1500"
                type="success"
                badgeText="Rentabilidad hoy"
                [externalSize]="cardSize()"
                [animationDelay]="0">
                <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
                </svg>
              </app-kpi-card>

              <!-- Card 2: Ingreso Total (El Bruto) -->
              <div 
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-card-enter-in-context-delay-1"
                [ngClass]="{
                  'gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]': cardSize() === 'default',
                  'gap-2 md:gap-3 p-3 md:p-4 min-h-[112px] md:min-h-[128px]': cardSize() === 'medium',
                  'gap-1.5 md:gap-2 p-2 md:p-2.5 min-h-[75px] md:min-h-[85px]': cardSize() === 'compact'
                }">
                <div class="flex items-center"
                  [ngClass]="{
                    'gap-3': cardSize() === 'default',
                    'gap-2.5': cardSize() === 'medium',
                    'gap-2': cardSize() === 'compact'
                  }">
                  <div 
                    class="flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
                    [ngClass]="{
                      'h-10 w-10': cardSize() === 'default',
                      'h-8 w-8': cardSize() === 'medium',
                      'h-5 w-5': cardSize() === 'compact'
                    }">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      [ngClass]="{
                        'w-5 h-5': cardSize() === 'default',
                        'w-4 h-4': cardSize() === 'medium',
                        'w-3 h-3': cardSize() === 'compact'
                      }"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                  </div>
                  <div>
                    <h3 
                      class="font-bold uppercase tracking-wider text-base-content"
                      [ngClass]="{
                        'text-xs': cardSize() === 'default',
                        'text-[10px]': cardSize() === 'medium' || cardSize() === 'compact'
                      }">Recaudación Total</h3>
                    <p 
                      class="font-medium text-zinc-400"
                      [ngClass]="{
                        'text-[10px] mt-0.5': cardSize() === 'default',
                        'text-[9px] mt-0.5': cardSize() === 'medium',
                        'text-[8px] mt-0.5': cardSize() === 'compact'
                      }">Bruto sin descuentos</p>
                  </div>
                </div>

                <div class="flex flex-col w-full">
                  <div 
                    class="font-black tracking-tight text-zinc-900 break-words overflow-hidden leading-tight"
                    [ngClass]="{
                      'text-base sm:text-lg md:text-xl lg:text-2xl': cardSize() === 'default',
                      'text-[10px] sm:text-xs md:text-sm lg:text-base': cardSize() === 'medium',
                      'text-[9px] sm:text-[10px] md:text-xs lg:text-sm': cardSize() === 'compact'
                    }">{{ ingresoTotal() }}</div>
                  <div 
                    [ngClass]="{
                      'mt-2': cardSize() === 'default',
                      'mt-1.5': cardSize() === 'medium',
                      'mt-1': cardSize() === 'compact'
                    }">
                    <span 
                      class="inline-flex items-center rounded bg-primary/10 font-bold text-primary ring-1 ring-inset ring-primary/15"
                      [ngClass]="{
                        'px-1.5 py-0.5 text-[10px]': cardSize() === 'default',
                        'px-1 py-0.5 text-[9px]': cardSize() === 'medium',
                        'px-1 py-0.5 text-[8px]': cardSize() === 'compact'
                      }">
                      Total hoy
                    </span>
                  </div>
                </div>
              </div>

              <!-- Card 3: Operación (El Monitor) -->
              <div 
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-card-enter-in-context-delay-2"
                [ngClass]="{
                  'gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]': cardSize() === 'default',
                  'gap-2 md:gap-3 p-3 md:p-4 min-h-[112px] md:min-h-[128px]': cardSize() === 'medium',
                  'gap-1.5 md:gap-2 p-2 md:p-2.5 min-h-[75px] md:min-h-[85px]': cardSize() === 'compact'
                }">
                <div class="flex justify-between items-start">
                  <div class="flex items-center"
                    [ngClass]="{
                      'gap-3': cardSize() === 'default',
                      'gap-2.5': cardSize() === 'medium',
                      'gap-2': cardSize() === 'compact'
                    }">
                    <div 
                      class="flex items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100"
                      [ngClass]="{
                        'h-10 w-10': cardSize() === 'default',
                        'h-8 w-8': cardSize() === 'medium',
                        'h-5 w-5': cardSize() === 'compact'
                      }">
                      <app-bus-icon 
                        [ngClass]="{
                          'h-5 w-5': cardSize() === 'default',
                          'h-4 w-4': cardSize() === 'medium',
                          'h-3 w-3': cardSize() === 'compact'
                        }" />
                    </div>
                    <div>
                      <h3 
                        class="font-bold uppercase tracking-wider text-base-content"
                        [ngClass]="{
                          'text-xs': cardSize() === 'default',
                          'text-[10px]': cardSize() === 'medium' || cardSize() === 'compact'
                        }">Flota en Ruta</h3>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span 
                          class="font-bold text-zinc-700"
                          [ngClass]="{
                            'text-sm': cardSize() === 'default',
                            'text-xs': cardSize() === 'medium',
                            'text-[10px]': cardSize() === 'compact'
                          }">
                          <span [appAnimatedCounter]="maquinasActivas()" format="number" [duration]="1000"></span> Activas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  [ngClass]="{
                    'space-y-2': cardSize() === 'default',
                    'space-y-1.5': cardSize() === 'medium',
                    'space-y-1': cardSize() === 'compact'
                  }">
                  <div class="flex justify-between items-end">
                    <span 
                      class="font-semibold text-zinc-500"
                      [ngClass]="{
                        'text-xs': cardSize() === 'default',
                        'text-[10px]': cardSize() === 'medium',
                        'text-[9px]': cardSize() === 'compact'
                      }">Reportes diarios</span>
                    <span 
                      class="font-black tabular-nums text-zinc-900"
                      [ngClass]="{
                        'text-base sm:text-lg': cardSize() === 'default',
                        'text-sm sm:text-base': cardSize() === 'medium',
                        'text-xs sm:text-sm': cardSize() === 'compact'
                      }">
                      <span [appAnimatedCounter]="reportesHoyCompletos()" format="number" [duration]="1000"></span>
                      <span class="text-zinc-300 mx-1">/</span>
                      <span [appAnimatedCounter]="reportesHoyTotales()" format="number" [duration]="1000"></span>
                    </span>
                  </div>
                  
                  <div 
                    class="relative w-full overflow-hidden rounded-full bg-zinc-100"
                    [ngClass]="{
                      'h-2.5': cardSize() === 'default',
                      'h-2': cardSize() === 'medium',
                      'h-1.5': cardSize() === 'compact'
                    }">
                    <div class="absolute left-0 top-0 h-full bg-violet-500 rounded-full" [style.width.%]="reportesHoyPorcentaje()"></div>
                  </div>
                  <p 
                    class="text-zinc-400 text-right"
                    [ngClass]="{
                      'text-[10px]': cardSize() === 'default',
                      'text-[9px]': cardSize() === 'medium',
                      'text-[8px]': cardSize() === 'compact'
                    }">
                    @if (reportesHoyPendientes() > 0) {
                      Falta {{ reportesHoyPendientes() }} registro(s) por cerrar
                    } @else {
                      Todo cerrado hoy
                    }
                  </p>
                </div>
              </div>

              <!-- Card 4: Alertas (El Semáforo) -->
              <div 
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-card-enter-in-context-delay-3"
                [ngClass]="{
                  'min-h-[150px] md:min-h-[170px]': cardSize() === 'default',
                  'min-h-[112px] md:min-h-[128px]': cardSize() === 'medium',
                  'min-h-[75px] md:min-h-[85px]': cardSize() === 'compact'
                }">
                <div 
                  [ngClass]="{
                    'px-5 pt-5 pb-2': cardSize() === 'default',
                    'px-4 pt-4 pb-1.5': cardSize() === 'medium',
                    'px-3 pt-3 pb-1': cardSize() === 'compact'
                  }">
                  <h3 
                    class="font-bold uppercase tracking-wider text-base-content"
                    [ngClass]="{
                      'text-xs': cardSize() === 'default',
                      'text-[10px]': cardSize() === 'medium' || cardSize() === 'compact'
                    }">Resumen de Salud</h3>
                </div>

                <div 
                  class="flex flex-col flex-1 gap-1"
                  [ngClass]="{
                    'px-2 pb-2': cardSize() === 'default',
                    'px-1.5 pb-1.5': cardSize() === 'medium',
                    'px-1 pb-1': cardSize() === 'compact'
                  }">
                  <div 
                    class="flex-1 flex items-center justify-between rounded-3xl bg-red-50/60 border border-red-100/50"
                    [ngClass]="{
                      'px-4': cardSize() === 'default',
                      'px-3': cardSize() === 'medium',
                      'px-2': cardSize() === 'compact'
                    }">
                    <div class="flex items-center"
                      [ngClass]="{
                        'gap-2': cardSize() === 'default',
                        'gap-1.5': cardSize() === 'medium',
                        'gap-1': cardSize() === 'compact'
                      }">
                      <div 
                        class="rounded-full bg-red-500 animate-pulse"
                        [ngClass]="{
                          'h-2 w-2': cardSize() === 'default',
                          'h-1.5 w-1.5': cardSize() === 'medium',
                          'h-1 w-1': cardSize() === 'compact'
                        }"></div>
                      <span 
                        class="font-bold text-red-700"
                        [ngClass]="{
                          'text-xs': cardSize() === 'default',
                          'text-[10px]': cardSize() === 'medium',
                          'text-[9px]': cardSize() === 'compact'
                        }">Críticas</span>
                    </div>
                    <span 
                      class="font-black text-red-600"
                      [ngClass]="{
                        'text-xl': cardSize() === 'default',
                        'text-lg': cardSize() === 'medium',
                        'text-base': cardSize() === 'compact'
                      }">
                      <span [appAnimatedCounter]="alertCounts().critical" format="number" [duration]="800"></span>
                    </span>
                  </div>

                  <div 
                    class="flex gap-1"
                    [ngClass]="{
                      'h-16': cardSize() === 'default',
                      'h-12': cardSize() === 'medium',
                      'h-10': cardSize() === 'compact'
                    }">
                    <div class="flex-1 flex flex-col items-center justify-center rounded-3xl bg-amber-50/60 border border-amber-100/50">
                      <span 
                        class="font-black text-amber-600 leading-none"
                        [ngClass]="{
                          'text-lg': cardSize() === 'default',
                          'text-base': cardSize() === 'medium',
                          'text-sm': cardSize() === 'compact'
                        }">
                        <span [appAnimatedCounter]="alertCounts().warning" format="number" [duration]="800"></span>
                      </span>
                      <span 
                        class="font-bold text-amber-700/70 uppercase"
                        [ngClass]="{
                          'text-[10px]': cardSize() === 'default',
                          'text-[9px]': cardSize() === 'medium',
                          'text-[8px]': cardSize() === 'compact'
                        }">Advertencias</span>
                    </div>
                    <div class="flex-1 flex flex-col items-center justify-center rounded-3xl bg-blue-50/60 border border-blue-100/50">
                      <span 
                        class="font-black text-blue-600 leading-none"
                        [ngClass]="{
                          'text-lg': cardSize() === 'default',
                          'text-base': cardSize() === 'medium',
                          'text-sm': cardSize() === 'compact'
                        }">
                        <span [appAnimatedCounter]="alertCounts().info" format="number" [duration]="800"></span>
                      </span>
                      <span 
                        class="font-bold text-blue-700/70 uppercase"
                        [ngClass]="{
                          'text-[10px]': cardSize() === 'default',
                          'text-[9px]': cardSize() === 'medium',
                          'text-[8px]': cardSize() === 'compact'
                        }">Info</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div 
            [class.opacity-0]="!sequentialState.canShowKPIs()" 
            [class.animate-fade-in]="sequentialState.canShowKPIs()" 
            [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <!-- Card 1: Ganancia Neta (El Bolsillo) -->
              <app-kpi-card
                title="Ganancia Neta"
                [subtitle]="'Neto con descuentos'"
                [numericValue]="gananciaNetaTotalNumeric()"
                [valueFormat]="'currency'"
                [animationDuration]="1500"
                type="success"
                badgeText="Rentabilidad hoy"
                [externalSize]="cardSize()"
                [animationDelay]="0">
                <svg icon xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
                </svg>
              </app-kpi-card>

              <!-- Card 2: Ingreso Total (El Bruto) -->
              <div 
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-card-enter-in-context-delay-1"
                [ngClass]="{
                  'gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]': cardSize() === 'default',
                  'gap-2 md:gap-3 p-3 md:p-4 min-h-[112px] md:min-h-[128px]': cardSize() === 'medium',
                  'gap-1.5 md:gap-2 p-2 md:p-2.5 min-h-[75px] md:min-h-[85px]': cardSize() === 'compact'
                }">
                <div class="flex items-center"
                  [ngClass]="{
                    'gap-3': cardSize() === 'default',
                    'gap-2.5': cardSize() === 'medium',
                    'gap-2': cardSize() === 'compact'
                  }">
                  <div 
                    class="flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
                    [ngClass]="{
                      'h-10 w-10': cardSize() === 'default',
                      'h-8 w-8': cardSize() === 'medium',
                      'h-5 w-5': cardSize() === 'compact'
                    }">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      [ngClass]="{
                        'w-5 h-5': cardSize() === 'default',
                        'w-4 h-4': cardSize() === 'medium',
                        'w-3 h-3': cardSize() === 'compact'
                      }"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                  </div>
                  <div>
                    <h3 
                      class="font-bold uppercase tracking-wider text-base-content"
                      [ngClass]="{
                        'text-xs': cardSize() === 'default',
                        'text-[10px]': cardSize() === 'medium' || cardSize() === 'compact'
                      }">Recaudación Total</h3>
                    <p 
                      class="font-medium text-zinc-400"
                      [ngClass]="{
                        'text-[10px] mt-0.5': cardSize() === 'default',
                        'text-[9px] mt-0.5': cardSize() === 'medium',
                        'text-[8px] mt-0.5': cardSize() === 'compact'
                      }">Bruto sin descuentos</p>
                  </div>
                </div>

                <div class="flex flex-col w-full">
                  <div 
                    class="font-black tracking-tight text-zinc-900 break-words overflow-hidden leading-tight"
                    [ngClass]="{
                      'text-base sm:text-lg md:text-xl lg:text-2xl': cardSize() === 'default',
                      'text-[10px] sm:text-xs md:text-sm lg:text-base': cardSize() === 'medium',
                      'text-[9px] sm:text-[10px] md:text-xs lg:text-sm': cardSize() === 'compact'
                    }">
                    <span [appAnimatedCounter]="ingresoTotalNumeric()" format="currency" [duration]="1500"></span>
                  </div>
                  <div 
                    [ngClass]="{
                      'mt-2': cardSize() === 'default',
                      'mt-1.5': cardSize() === 'medium',
                      'mt-1': cardSize() === 'compact'
                    }">
                    <span 
                      class="inline-flex items-center rounded bg-primary/10 font-bold text-primary ring-1 ring-inset ring-primary/15"
                      [ngClass]="{
                        'px-1.5 py-0.5 text-[10px]': cardSize() === 'default',
                        'px-1 py-0.5 text-[9px]': cardSize() === 'medium',
                        'px-1 py-0.5 text-[8px]': cardSize() === 'compact'
                      }">
                      Total hoy
                    </span>
                  </div>
                </div>
              </div>

              <!-- Card 3: Operación (El Monitor) -->
              <div 
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-card-enter-in-context-delay-2"
                [ngClass]="{
                  'gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]': cardSize() === 'default',
                  'gap-2 md:gap-3 p-3 md:p-4 min-h-[112px] md:min-h-[128px]': cardSize() === 'medium',
                  'gap-1.5 md:gap-2 p-2 md:p-2.5 min-h-[75px] md:min-h-[85px]': cardSize() === 'compact'
                }">
                <div class="flex justify-between items-start">
                  <div class="flex items-center"
                    [ngClass]="{
                      'gap-3': cardSize() === 'default',
                      'gap-2.5': cardSize() === 'medium',
                      'gap-2': cardSize() === 'compact'
                    }">
                    <div 
                      class="flex items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100"
                      [ngClass]="{
                        'h-10 w-10': cardSize() === 'default',
                        'h-8 w-8': cardSize() === 'medium',
                        'h-5 w-5': cardSize() === 'compact'
                      }">
                      <app-bus-icon 
                        [ngClass]="{
                          'h-5 w-5': cardSize() === 'default',
                          'h-4 w-4': cardSize() === 'medium',
                          'h-3 w-3': cardSize() === 'compact'
                        }" />
                    </div>
                    <div>
                      <h3 
                        class="font-bold uppercase tracking-wider text-base-content"
                        [ngClass]="{
                          'text-xs': cardSize() === 'default',
                          'text-[10px]': cardSize() === 'medium' || cardSize() === 'compact'
                        }">Flota en Ruta</h3>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span 
                          class="font-bold text-zinc-700"
                          [ngClass]="{
                            'text-sm': cardSize() === 'default',
                            'text-xs': cardSize() === 'medium',
                            'text-[10px]': cardSize() === 'compact'
                          }">
                          <span [appAnimatedCounter]="maquinasActivas()" format="number" [duration]="1000"></span> Activas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  [ngClass]="{
                    'space-y-2': cardSize() === 'default',
                    'space-y-1.5': cardSize() === 'medium',
                    'space-y-1': cardSize() === 'compact'
                  }">
                  <div class="flex justify-between items-end">
                    <span 
                      class="font-semibold text-zinc-500"
                      [ngClass]="{
                        'text-xs': cardSize() === 'default',
                        'text-[10px]': cardSize() === 'medium',
                        'text-[9px]': cardSize() === 'compact'
                      }">Reportes diarios</span>
                    <span 
                      class="font-black tabular-nums text-zinc-900"
                      [ngClass]="{
                        'text-base sm:text-lg': cardSize() === 'default',
                        'text-sm sm:text-base': cardSize() === 'medium',
                        'text-xs sm:text-sm': cardSize() === 'compact'
                      }">
                      <span [appAnimatedCounter]="reportesHoyCompletos()" format="number" [duration]="1000"></span>
                      <span class="text-zinc-300 mx-1">/</span>
                      <span [appAnimatedCounter]="reportesHoyTotales()" format="number" [duration]="1000"></span>
                    </span>
                  </div>
                  
                  <div 
                    class="relative w-full overflow-hidden rounded-full bg-zinc-100"
                    [ngClass]="{
                      'h-2.5': cardSize() === 'default',
                      'h-2': cardSize() === 'medium',
                      'h-1.5': cardSize() === 'compact'
                    }">
                    <div class="absolute left-0 top-0 h-full bg-violet-500 rounded-full" [style.width.%]="reportesHoyPorcentaje()"></div>
                  </div>
                  <p 
                    class="text-zinc-400 text-right"
                    [ngClass]="{
                      'text-[10px]': cardSize() === 'default',
                      'text-[9px]': cardSize() === 'medium',
                      'text-[8px]': cardSize() === 'compact'
                    }">
                    @if (reportesHoyPendientes() > 0) {
                      Falta {{ reportesHoyPendientes() }} registro(s) por cerrar
                    } @else {
                      Todo cerrado hoy
                    }
                  </p>
                </div>
              </div>

              <!-- Card 4: Alertas (El Semáforo) -->
              <div 
                class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] animate-card-enter-in-context-delay-3"
                [ngClass]="{
                  'min-h-[150px] md:min-h-[170px]': cardSize() === 'default',
                  'min-h-[112px] md:min-h-[128px]': cardSize() === 'medium',
                  'min-h-[75px] md:min-h-[85px]': cardSize() === 'compact'
                }">
                <div 
                  [ngClass]="{
                    'px-5 pt-5 pb-2': cardSize() === 'default',
                    'px-4 pt-4 pb-1.5': cardSize() === 'medium',
                    'px-3 pt-3 pb-1': cardSize() === 'compact'
                  }">
                  <h3 
                    class="font-bold uppercase tracking-wider text-base-content"
                    [ngClass]="{
                      'text-xs': cardSize() === 'default',
                      'text-[10px]': cardSize() === 'medium' || cardSize() === 'compact'
                    }">Resumen de Salud</h3>
                </div>

                <div 
                  class="flex flex-col flex-1 gap-1"
                  [ngClass]="{
                    'px-2 pb-2': cardSize() === 'default',
                    'px-1.5 pb-1.5': cardSize() === 'medium',
                    'px-1 pb-1': cardSize() === 'compact'
                  }">
                  <div 
                    class="flex-1 flex items-center justify-between rounded-3xl bg-red-50/60 border border-red-100/50"
                    [ngClass]="{
                      'px-4': cardSize() === 'default',
                      'px-3': cardSize() === 'medium',
                      'px-2': cardSize() === 'compact'
                    }">
                    <div class="flex items-center"
                      [ngClass]="{
                        'gap-2': cardSize() === 'default',
                        'gap-1.5': cardSize() === 'medium',
                        'gap-1': cardSize() === 'compact'
                      }">
                      <div 
                        class="rounded-full bg-red-500 animate-pulse"
                        [ngClass]="{
                          'h-2 w-2': cardSize() === 'default',
                          'h-1.5 w-1.5': cardSize() === 'medium',
                          'h-1 w-1': cardSize() === 'compact'
                        }"></div>
                      <span 
                        class="font-bold text-red-700"
                        [ngClass]="{
                          'text-xs': cardSize() === 'default',
                          'text-[10px]': cardSize() === 'medium',
                          'text-[9px]': cardSize() === 'compact'
                        }">Críticas</span>
                    </div>
                    <span 
                      class="font-black text-red-600"
                      [ngClass]="{
                        'text-xl': cardSize() === 'default',
                        'text-lg': cardSize() === 'medium',
                        'text-base': cardSize() === 'compact'
                      }">
                      <span [appAnimatedCounter]="alertCounts().critical" format="number" [duration]="800"></span>
                    </span>
                  </div>

                  <div 
                    class="flex gap-1"
                    [ngClass]="{
                      'h-16': cardSize() === 'default',
                      'h-12': cardSize() === 'medium',
                      'h-10': cardSize() === 'compact'
                    }">
                    <div class="flex-1 flex flex-col items-center justify-center rounded-3xl bg-amber-50/60 border border-amber-100/50">
                      <span 
                        class="font-black text-amber-600 leading-none"
                        [ngClass]="{
                          'text-lg': cardSize() === 'default',
                          'text-base': cardSize() === 'medium',
                          'text-sm': cardSize() === 'compact'
                        }">
                        <span [appAnimatedCounter]="alertCounts().warning" format="number" [duration]="800"></span>
                      </span>
                      <span 
                        class="font-bold text-amber-700/70 uppercase"
                        [ngClass]="{
                          'text-[10px]': cardSize() === 'default',
                          'text-[9px]': cardSize() === 'medium',
                          'text-[8px]': cardSize() === 'compact'
                        }">Advertencias</span>
                    </div>
                    <div class="flex-1 flex flex-col items-center justify-center rounded-3xl bg-blue-50/60 border border-blue-100/50">
                      <span 
                        class="font-black text-blue-600 leading-none"
                        [ngClass]="{
                          'text-lg': cardSize() === 'default',
                          'text-base': cardSize() === 'medium',
                          'text-sm': cardSize() === 'compact'
                        }">
                        <span [appAnimatedCounter]="alertCounts().info" format="number" [duration]="800"></span>
                      </span>
                      <span 
                        class="font-bold text-blue-700/70 uppercase"
                        [ngClass]="{
                          'text-[10px]': cardSize() === 'default',
                          'text-[9px]': cardSize() === 'medium',
                          'text-[8px]': cardSize() === 'compact'
                        }">Info</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Zona de Análisis: Gráfico (66%) + Alertas (33%) -->
      <div class="page-entry-content">
        @if (!sequentialState.canShowContent()) {
          <!-- Mostrar skeleton mientras esperamos que los KPIs aparezcan -->
          @if (contentLoadingState.isLoading() && !sequentialState.contentError()) {
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 border-t-2 border-t-base-300 pt-6">
              <div class="xl:col-span-2">
                <app-loading-skeleton 
                  type="dashboard-chart" 
                  [isExiting]="contentLoadingState.isSkeletonExiting()" />
              </div>
              <div class="xl:col-span-1">
                <app-loading-skeleton 
                  type="dashboard-alerts" 
                  [isExiting]="contentLoadingState.isSkeletonExiting()" />
              </div>
            </div>
            <div class="border-t-2 border-t-base-300 pt-6">
              <app-loading-skeleton 
                type="dashboard-table" 
                [count]="5"
                [isExiting]="contentLoadingState.isSkeletonExiting()" />
            </div>
          } @else if (sequentialState.contentError()) {
            <div class="card bg-error/10 border border-error/20 rounded-3xl p-6">
              <div class="flex flex-col items-center gap-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 class="text-lg font-semibold text-error mb-2">Error al cargar contenido</h3>
                  <p class="text-sm text-error/70 mb-4">No se pudieron cargar los datos desde el servidor.</p>
                </div>
              </div>
            </div>
          } @else {
            <!-- Mantener skeleton visible hasta que canShowContent sea true -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 border-t-2 border-t-base-300 pt-6">
              <div class="xl:col-span-2">
                <app-loading-skeleton 
                  type="dashboard-chart" 
                  [isExiting]="contentLoadingState.isSkeletonExiting()" />
              </div>
              <div class="xl:col-span-1">
                <app-loading-skeleton 
                  type="dashboard-alerts" 
                  [isExiting]="contentLoadingState.isSkeletonExiting()" />
              </div>
            </div>
            <div class="border-t-2 border-t-base-300 pt-6">
              <app-loading-skeleton 
                type="dashboard-table" 
                [count]="5"
                [isExiting]="contentLoadingState.isSkeletonExiting()" />
            </div>
          }
        } @else {
          <!-- Solo renderizar el contenido cuando canShowContent es true -->
          <div 
            [class.animate-fade-in]="sequentialState.canShowContent()" 
            [style.transition]="sequentialState.canShowContent() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowContent() ? 'translateY(0)' : 'translateY(12px)'"
            [style.opacity]="sequentialState.canShowContent() ? '1' : '0'">
            @if (sequentialState.contentError()) {
              <div class="card bg-error/10 border border-error/20 rounded-3xl p-6">
                <div class="flex flex-col items-center gap-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 class="text-lg font-semibold text-error mb-2">Error al cargar contenido</h3>
                    <p class="text-sm text-error/70 mb-4">No se pudieron cargar los datos desde el servidor.</p>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Gráfico Financiero (2/3 del ancho) + Alertas (1/3 del ancho) -->
              <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 border-t-2 border-t-base-300 pt-6">
                <div class="xl:col-span-2">
                  <app-financial-summary [showChartOnly]="true" (metricChange)="onMetricChange($event)" />
                </div>

                <!-- Alertas Compactas (1/3 del ancho) -->
                <div class="xl:col-span-1">
                  <app-alert-list
                    [alerts]="alerts()"
                    [isExpanded]="true"
                    (deleteAlert)="onDeleteAlert($event)"
                    (deleteAllAlerts)="onDeleteAllAlerts()" />
                </div>
              </div>

              <!-- Zona de Detalle: Tabla Full Width -->
              <div class="border-t-2 border-t-base-300 pt-6">
                <app-daily-records-table
                  [records]="dailyRecords()"
                  [showOnlyPending]="showOnlyPending()"
                  (toggleFilter)="togglePendingFilter()" />
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in {
      animation: fade-in 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in {
        animation: none;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private dashboardService = inject(DashboardService);
  private transitionService = inject(TransitionService);
  private loadingStateService = inject(LoadingStateService);
  private platformId = inject(PLATFORM_ID);
  
  // Signals para detección de tamaño de pantalla
  private isMobile = signal<boolean>(false);
  private isMedium = signal<boolean>(false);
  private mobileMediaQuery: MediaQueryList | null = null;
  private mediumMediaQuery: MediaQueryList | null = null;
  private mobileMediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
  private mediumMediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
  
  // Tamaño efectivo para las cards personalizadas
  cardSize = computed<'compact' | 'medium' | 'default'>(() => {
    if (this.isMobile()) return 'compact';
    if (this.isMedium()) return 'medium';
    return 'default';
  });

  constructor() {
    // Iniciar estados de carga inmediatamente, antes del primer render
    this.kpisLoadingState.setLoading(true);
    this.contentLoadingState.setLoading(true);
    
    // Monitorear cuando el componente se monta
    effect(() => {
      const isTransitioning = this.transitionService.isTransitioning();
    });
  }
  
  ngOnInit(): void {
    // Inicializar detección de tamaño de pantalla
    if (isPlatformBrowser(this.platformId)) {
      // Detectar viewport móvil (< 768px)
      this.mobileMediaQuery = window.matchMedia('(max-width: 767px)');
      this.isMobile.set(this.mobileMediaQuery.matches);
      
      // Detectar viewport mediano (>= 768px y < 1024px)
      this.mediumMediaQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
      this.isMedium.set(this.mediumMediaQuery.matches);
      
      this.mobileMediaQueryHandler = (e: MediaQueryListEvent) => {
        this.isMobile.set(e.matches);
      };
      
      this.mediumMediaQueryHandler = (e: MediaQueryListEvent) => {
        this.isMedium.set(e.matches);
      };
      
      this.mobileMediaQuery.addEventListener('change', this.mobileMediaQueryHandler);
      this.mediumMediaQuery.addEventListener('change', this.mediumMediaQueryHandler);
    }

    // Conectar al WebSocket para actualizaciones en tiempo real
    this.dashboardService.connectToUpdates();
  }
  
  ngOnDestroy(): void {
    // Desconectar WebSocket al salir del componente
    this.dashboardService.disconnect();
    
    if (this.mobileMediaQuery && this.mobileMediaQueryHandler) {
      this.mobileMediaQuery.removeEventListener('change', this.mobileMediaQueryHandler);
    }
    if (this.mediumMediaQuery && this.mediumMediaQueryHandler) {
      this.mediumMediaQuery.removeEventListener('change', this.mediumMediaQueryHandler);
    }
  }
  
  // Effects para detectar cuando los datos están listos
  private kpisEffect = effect(() => {
    // Los KPIs se calculan desde financialData y dailyRecords
    // Consideramos que están listos cuando dailyRecords tiene datos o después de un tiempo mínimo
    const hasRecords = this.dailyRecords().length > 0;
    const isLoading = this.kpisLoadingState.isLoading();
    
    // Cuando hay datos y está cargando, marcar como cargado directamente
    if (hasRecords && isLoading && !this.sequentialState.kpisError()) {
      this.kpisLoadingState.setDataLoaded();
      // Coordinar con sequentialState para animaciones suaves
      setTimeout(() => {
        this.sequentialState.setKPIsReady(false);
      }, 50);
    } else if (this.sequentialState.kpisError() && isLoading) {
      this.kpisLoadingState.setDataLoaded();
    }
  });
  
  private contentEffect = effect(() => {
    // El contenido está listo cuando tenemos registros diarios o alertas cargadas
    const hasRecords = this.dailyRecords().length > 0;
    const hasAlerts = this.alertsInitialized; // Verificar si las alertas se inicializaron
    const isLoading = this.contentLoadingState.isLoading();
    
    // Cuando hay datos y está cargando, marcar como cargado directamente
    if ((hasRecords || hasAlerts) && isLoading && !this.sequentialState.contentError()) {
      this.contentLoadingState.setDataLoaded();
      // Coordinar con sequentialState para animaciones suaves
      setTimeout(() => {
        this.sequentialState.setContentReady(false);
      }, 50);
    } else if (this.sequentialState.contentError() && isLoading) {
      this.contentLoadingState.setDataLoaded();
    }
  });

  showOnlyPending = signal(false);
  currentFinancialMetric = signal<FinancialMetric>('Ganancia Neta');
  isDeletingAlert = signal(false);
  isDeletingAllAlerts = signal(false);
  
  // Estados de carga simplificados (siguiendo patrón de maquinas y bitacora-operaciones)
  kpisLoadingState = this.loadingStateService.createLoadingState();
  contentLoadingState = this.loadingStateService.createLoadingState();
  
  // Estado de carga secuencial coordinado (para animaciones suaves)
  sequentialState = this.loadingStateService.createSequentialLoadingState({
    kpisDelay: 100,
    contentDelay: 300,
    maxWaitTime: 2000
  });
  
  // Cargar alertas - usar signal mutable para Optimistic UI
  alertsData = toSignal(
    this.alertService.getAlerts().pipe(
      catchError(() => of<Alert[]>([]))
    ),
    { initialValue: [] }
  );

  // Signal mutable para permitir actualizaciones optimistas
  private _alerts = signal<Alert[]>([]);
  private alertsInitialized = false;
  
  // Effect para inicializar _alerts cuando se carguen los datos
  private alertsInitEffect = effect(() => {
    const loaded = this.alertsData();
    if (!this.alertsInitialized && loaded && loaded.length > 0) {
      this._alerts.set([...loaded]);
      this.alertsInitialized = true;
    }
  });
  
  alerts = computed(() => {
    const loaded = this.alertsData();
    const optimistic = this._alerts();
    
    // Si ya inicializamos y hay datos optimistas, usarlos
    if (this.alertsInitialized && optimistic.length >= 0) {
      return optimistic;
    }
    
    // Si no, usar los cargados
    return loaded ?? [];
  });

  alertCounts = computed(() => {
    // Usar datos del nuevo servicio cuando estén disponibles
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.alertas?.resumen) {
      return {
        critical: dashboardData.alertas.resumen.criticas,
        warning: dashboardData.alertas.resumen.advertencias,
        info: dashboardData.alertas.resumen.informativas
      };
    }
    // Fallback a alertas existentes
    const alerts = this.alerts();
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  });

  // Cargar registros diarios
  dailyRecordsData = toSignal(
    this.dashboardService.getDailyRecords().pipe(
      catchError((error) => {
        console.error('Error al cargar registros diarios en home:', error);
        return of<DailyRecord[]>([]);
      })
    ),
    { initialValue: [] }
  );

  dailyRecords = computed(() => {
    const records = this.dailyRecordsData() ?? [];
    return records;
  });

  // Datos financieros (se obtienen del backend)
  financialData = signal<Record<FinancialMetric, FinancialData[]>>({
    'Ganancia Neta': [],
    'Ingreso Total': []
  });

  // KPIs calculados - Usar datos del nuevo servicio cuando estén disponibles, sino usar fallback
  // Signals numéricos para animación
  gananciaNetaTotalNumeric = computed(() => {
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.kpis?.ganancia_neta !== undefined) {
      return dashboardData.kpis.ganancia_neta;
    }
    return 0;
  });

  ingresoTotalNumeric = computed(() => {
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.kpis?.recaudacion_total !== undefined) {
      return dashboardData.kpis.recaudacion_total;
    }
    return 0;
  });

  // Signals formateados (mantener para compatibilidad)
  gananciaNetaTotal = computed(() => {
    return this.formatCurrency(this.gananciaNetaTotalNumeric());
  });

  ingresoTotal = computed(() => {
    return this.formatCurrency(this.ingresoTotalNumeric());
  });

  reportesHoyTotales = computed(() => {
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.kpis?.flota_en_ruta?.reportes_totales !== undefined) {
      return dashboardData.kpis.flota_en_ruta.reportes_totales;
    }
    // Fallback
    const today = new Date().toISOString().split('T')[0];
    return this.dailyRecords().filter(r => r.date === today).length;
  });

  reportesHoyCompletos = computed(() => {
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.kpis?.flota_en_ruta?.reportes_recibidos !== undefined) {
      return dashboardData.kpis.flota_en_ruta.reportes_recibidos;
    }
    // Fallback
    const today = new Date().toISOString().split('T')[0];
    return this.dailyRecords().filter(r => r.date === today && r.status === 'COMPLETO').length;
  });

  reportesHoyPendientes = computed(() => {
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.kpis?.flota_en_ruta?.reportes_pendientes !== undefined) {
      return dashboardData.kpis.flota_en_ruta.reportes_pendientes;
    }
    // Fallback
    const total = this.reportesHoyTotales();
    const completos = this.reportesHoyCompletos();
    return Math.max(total - completos, 0);
  });

  reportesHoyPorcentaje = computed(() => {
    const total = this.reportesHoyTotales();
    if (total === 0) return 0;
    const completos = this.reportesHoyCompletos();
    return Math.round((completos / total) * 100);
  });

  maquinasActivas = computed(() => {
    const dashboardData = this.dashboardService.dashboardData();
    if (dashboardData?.kpis?.flota_en_ruta?.activas !== undefined) {
      return dashboardData.kpis.flota_en_ruta.activas;
    }
    // Fallback
    const records = this.dailyRecords();
    const today = new Date().toISOString().split('T')[0];
    const activeMachines = new Set(
      records
        .filter(r => r.date === today && (r.status === 'COMPLETO' || r.status === 'PENDIENTE_TRABAJADOR'))
        .map(r => r.machineId)
    );
    return activeMachines.size;
  });

  onMetricChange(metric: FinancialMetric): void {
    this.currentFinancialMetric.set(metric);
  }

  togglePendingFilter(): void {
    this.showOnlyPending.update(v => !v);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }


  onDeleteAlert(alertId: string): void {
    // Prevenir múltiples eliminaciones simultáneas
    if (this.isDeletingAlert()) {
      return;
    }

    // 1. Snapshot del estado actual (para rollback)
    const previousAlerts = [...this._alerts()];
    
    // 2. Optimistic update: Remover inmediatamente de la UI
    this._alerts.set(previousAlerts.filter(a => a.id !== alertId));
    this.isDeletingAlert.set(true);
    
    // 3. Llamar al servidor en segundo plano
    this.alertService.deleteAlert(alertId).pipe(
      catchError((error) => {
        // 4. Rollback en caso de error
        this._alerts.set(previousAlerts);
        
        // 5. Notificar al usuario
        this.showErrorToast('No se pudo eliminar la alerta. Intenta nuevamente.');
        
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.isDeletingAlert.set(false);
      },
      error: () => {
        this.isDeletingAlert.set(false);
      }
    });
  }

  onDeleteAllAlerts(): void {
    // Prevenir múltiples eliminaciones simultáneas
    if (this.isDeletingAllAlerts() || this.isDeletingAlert()) {
      return;
    }

    // 1. Snapshot del estado actual (para rollback)
    const previousAlerts = [...this._alerts()];
    
    // 2. Optimistic update: Remover todas las alertas inmediatamente
    this._alerts.set([]);
    this.isDeletingAllAlerts.set(true);
    
    // 3. Llamar al servidor en segundo plano
    this.alertService.deleteAllAlerts().pipe(
      catchError((error) => {
        // 4. Rollback en caso de error
        this._alerts.set(previousAlerts);
        
        // 5. Notificar al usuario
        this.showErrorToast('No se pudieron eliminar las alertas. Intenta nuevamente.');
        
        return EMPTY;
      })
    ).subscribe({
      next: () => {
        this.isDeletingAllAlerts.set(false);
      },
      error: () => {
        this.isDeletingAllAlerts.set(false);
      }
    });
  }

  private showErrorToast(message: string): void {
    // Crear toast usando DaisyUI
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end';
    toast.innerHTML = `
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
