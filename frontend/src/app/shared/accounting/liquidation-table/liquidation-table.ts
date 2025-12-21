import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidationPeriod, LiquidationDriver } from '../../models/accounting.models';
import { DriverIcon } from '../../components/driver-icon/driver-icon';

@Component({
  selector: 'app-liquidation-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DriverIcon],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body p-4 sm:p-6">
        
        <!-- Header con Resumen Activo -->
        <div class="space-y-4 mb-6">
          <!-- Primera fila: Título, Selector de Período y Resumen de Nómina -->
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div class="flex-1">
              <h2 class="text-xl font-bold">Procesar Liquidación</h2>
              <p class="text-sm text-base-content/60">Ajusta los montos garantizados y confirma los pagos.</p>
            </div>
            
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <!-- Selector de Período (Mes actual / Mes anterior) -->
              <div class="w-full sm:w-auto">
                <div class="bg-white p-1.5 rounded-xl border border-base-200 shadow-sm">
                  <div class="relative w-full sm:w-auto min-w-[180px]">
                    <select 
                      class="appearance-none w-full bg-transparent pl-3 pr-8 py-2 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none" 
                      [value]="payrollPeriod()" 
                      (change)="onPayrollPeriodChange($event)">
                      <option value="current">Mes actual</option>
                      <option value="previous">Mes anterior</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                      <svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resumen Total Nómina -->
              <div class="bg-primary/5 border border-primary/20 px-4 py-3 rounded-xl flex items-center gap-4 shadow-sm w-full sm:w-auto">
                <div class="flex flex-col">
                  <span class="text-[10px] uppercase font-bold tracking-widest text-primary/70">Total Nómina</span>
                  <span class="text-xl font-black text-primary tabular-nums tracking-tight">
                    {{ calculateTotalPayroll() | currency:'CLP':'symbol-narrow':'1.0-0' }}
                  </span>
                </div>
                <div class="h-10 w-px bg-primary/20"></div>
                <div class="flex flex-col items-end">
                  <span class="text-[10px] uppercase font-bold tracking-widest text-base-content/50">Pendientes</span>
                  <span class="text-sm font-bold text-base-content">{{ getPendingCount() }} / {{ liquidation().choferes.length }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Segunda fila: Botones de Semanas -->
          <div class="flex flex-col gap-2">
            <span class="text-xs font-bold uppercase tracking-widest text-base-content/50">Seleccionar Semana:</span>
            <div class="overflow-x-auto scrollbar-hide -mx-4 lg:mx-0 px-4 lg:px-0">
              <div class="tabs tabs-boxed bg-base-200/50 p-1 gap-1 inline-flex min-w-full lg:min-w-0">
                @for (week of availableWeeks(); track week) {
                  <button
                    type="button"
                    class="tab h-9 px-3 sm:px-4 font-semibold transition-all rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                    [class.tab-active]="selectedWeek() === week"
                    [class.bg-primary]="selectedWeek() === week"
                    [class.text-primary-content]="selectedWeek() === week"
                    [class.text-base-content/60]="selectedWeek() !== week"
                    (click)="onWeekChange(week)">
                    <span class="text-xs sm:text-sm">Semana {{ week }}</span>
                    @if (week === availableWeeks()[availableWeeks().length - 1]) {
                      <span class="badge badge-xs badge-warning text-white">Última</span>
                    }
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Vista Desktop: Tabla con Ecuación Visual (solo XL y mayores) -->
        <div class="hidden xl:block overflow-hidden rounded-3xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-200/50 border-b border-base-200">
              <tr>
                <th class="pl-6 w-1/4 text-xs font-bold uppercase tracking-widest text-base-content/60">Colaborador</th>
                <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums">Base (Ganado)</th>
                <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums">Garantizado</th>
                <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 w-40 font-mono tabular-nums">Ajuste / Bono</th>
                <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 bg-base-200 font-mono tabular-nums">A Pagar</th>
                <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 bg-base-200">Acción</th>
              </tr>
            </thead>
            <tbody>
              @if (liquidation().choferes.length === 0) {
                <!-- Skeleton cuando no hay datos (cargando o esperando datos) -->
                @for (i of [1,2,3,4,5,6]; track i) {
                  <tr class="border-b border-base-100 last:border-none">
                    <td class="pl-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-base-200 animate-pulse"></div>
                        <div class="flex flex-col gap-2">
                          <div class="h-4 w-32 bg-base-200 rounded animate-pulse"></div>
                          <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td class="text-left">
                      <div class="h-4 w-24 bg-base-200 rounded animate-pulse"></div>
                    </td>
                    <td class="text-left">
                      <div class="flex flex-col gap-2">
                        <div class="h-3 w-28 bg-base-200 rounded animate-pulse"></div>
                        <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                        <div class="h-4 w-16 bg-base-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                    <td class="text-left">
                      <div class="h-8 w-24 bg-base-200 rounded animate-pulse ml-auto"></div>
                    </td>
                    <td class="text-left bg-base-50/50">
                      <div class="h-5 w-28 bg-base-200 rounded animate-pulse"></div>
                    </td>
                    <td class="pr-6 bg-base-50/50 text-center">
                      <div class="h-8 w-24 bg-base-200 rounded animate-pulse mx-auto"></div>
                    </td>
                  </tr>
                }
              } @else {
                <!-- Overlay de carga cuando hay datos pero se están recargando -->
                @if (isLoading() && liquidation().choferes.length > 0) {
                  <tr>
                    <td colspan="6" class="relative">
                      <div class="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <div class="flex flex-col items-center gap-3">
                          <span class="loading loading-spinner loading-lg text-primary"></span>
                          <span class="text-sm text-base-content/60 font-medium">Cargando datos...</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
                @for (chofer of liquidation().choferes; track chofer.chofer_id) {
                <tr class="hover:bg-base-50 transition-colors border-b border-base-100 last:border-none group">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center p-2">
                        <app-driver-icon class="w-full h-full" />
                      </div>
                      <div class="flex flex-col">
                        <span class="font-bold text-base-content">{{ chofer.chofer_nombre }}</span>
                        <span class="text-[10px] text-base-content/50 uppercase tracking-wide" 
                              [class.text-success]="chofer.estado_pago === 'pagado'">
                          {{ chofer.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente' }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td class="text-left">
                    <div class="tabular-nums font-bold text-base-content/70 font-mono">
                      {{ chofer.total_ganado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                    </div>
                  </td>

                  <td class="text-left">
                    @if (liquidation().es_ultima_semana) {
                      <!-- Última semana: mostrar acumulado mensual -->
                      <div class="flex flex-col gap-2">
                        <div class="flex flex-col gap-1">
                          <span class="badge badge-xs sm:badge-sm badge-ghost tabular-nums text-[10px] sm:text-xs text-base-content/50 font-mono">
                            Acumulado mes: {{ chofer.acumulado_mensual || chofer.total_ganado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                          </span>
                          <span class="badge badge-xs sm:badge-sm badge-ghost tabular-nums text-[10px] sm:text-xs text-base-content/50 font-mono">
                            Min: {{ chofer.minimo_garantizado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                          </span>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            class="toggle toggle-sm toggle-primary"
                            [checked]="chofer.aplicar_garantizado"
                            [disabled]="liquidation().estado === 'cerrado' || chofer.estado_pago === 'pagado' || (chofer.acumulado_mensual || chofer.total_ganado) >= chofer.minimo_garantizado"
                            (change)="onAplicarGarantizadoChange(chofer.chofer_id, $event)">
                          <span class="text-xs text-base-content/60">Aplicar</span>
                        </label>
                      </div>
                    } @else {
                      <!-- Semanas normales: garantizado deshabilitado -->
                      <div class="flex flex-col gap-2">
                        <span class="badge badge-sm badge-ghost tabular-nums text-xs text-base-content/30 font-mono">
                          No aplica
                        </span>
                        <label class="flex items-center gap-2 cursor-not-allowed opacity-50">
                          <input
                            type="checkbox"
                            class="toggle toggle-sm toggle-primary"
                            [checked]="false"
                            disabled>
                          <span class="text-xs text-base-content/40">Aplicar</span>
                        </label>
                      </div>
                    }
                  </td>

                  <td class="text-left">
                    @if (liquidation().es_ultima_semana) {
                      <!-- Última semana: ajuste habilitado si aplica garantizado -->
                      @if (chofer.aplicar_garantizado) {
                        <div class="relative flex items-center justify-end">
                          <span class="absolute right-24 text-base-content/30 text-xs mr-2 group-hover:opacity-100 opacity-0 transition-opacity">+</span>
                          <input
                            type="number"
                            [value]="chofer.monto_a_completar"
                            [disabled]="(chofer.acumulado_mensual || chofer.total_ganado) >= chofer.minimo_garantizado || liquidation().estado === 'cerrado' || chofer.estado_pago === 'pagado'"
                            (input)="onMissingAmountChange(chofer.chofer_id, $event)"
                            class="input input-sm input-ghost w-24 text-right tabular-nums font-bold focus:bg-base-100 focus:border-primary border border-transparent hover:border-base-300 transition-all rounded-lg p-0 pr-2"
                            [class.text-base-content/30]="chofer.monto_a_completar === 0"
                            [class.text-primary]="chofer.monto_a_completar > 0"
                            min="0">
                        </div>
                      } @else {
                        <!-- Toggle desactivado: mostrar 0 deshabilitado -->
                        <div class="relative flex items-center justify-end">
                          <input
                            type="number"
                            value="0"
                            disabled
                            class="input input-sm input-ghost w-24 text-right tabular-nums font-bold text-base-content/30 border border-transparent rounded-lg p-0 pr-2">
                        </div>
                      }
                    } @else {
                      <!-- Semanas normales: mostrar badge "No aplica" -->
                      <div class="flex items-center justify-end">
                        <span class="badge badge-sm badge-ghost tabular-nums text-xs text-base-content/30 font-mono">No aplica</span>
                      </div>
                    }
                  </td>

                  <td class="text-left bg-base-50/50 font-bold text-base-content tabular-nums text-lg border-l border-base-200 font-mono">
                    {{ calculatePagoFinal(chofer) | currency:'CLP':'symbol-narrow':'1.0-0' }}
                  </td>

                  <td class="pr-6 bg-base-50/50 border-r border-base-200 text-center">
                    @if (chofer.estado_pago === 'pagado') {
                      <div class="flex items-center justify-center gap-1 text-success font-bold text-xs bg-success/10 px-3 py-1.5 rounded-full border border-success/10 cursor-default animate-in zoom-in duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        <span>Pagado</span>
                      </div>
                    } @else {
                      <button 
                        class="btn btn-sm btn-primary btn-outline hover:!text-white gap-2 font-bold transition-all shadow-sm hover:shadow-md"
                        (click)="onConfirmPayment(chofer)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Confirmar
                      </button>
                    }
                  </td>
                </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Vista Móvil y Tablet: Tarjetas de Nómina (hasta XL) -->
        <div class="xl:hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            @if (liquidation().choferes.length === 0) {
              <!-- Skeleton para móvil cuando no hay datos (cargando o esperando datos) -->
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="bg-base-100 border border-base-200 rounded-3xl p-4 shadow-sm">
                  <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-base-200 animate-pulse"></div>
                      <div class="flex flex-col gap-2">
                        <div class="h-5 w-32 bg-base-200 rounded animate-pulse"></div>
                        <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div class="h-6 w-16 bg-base-200 rounded animate-pulse"></div>
                  </div>
                  <div class="bg-base-50 rounded-lg p-3 space-y-2">
                    <div class="flex justify-between">
                      <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-4 w-20 bg-base-200 rounded animate-pulse"></div>
                    </div>
                    <div class="flex justify-between">
                      <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-4 w-16 bg-base-200 rounded animate-pulse"></div>
                    </div>
                    <div class="flex justify-between">
                      <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-4 w-20 bg-base-200 rounded animate-pulse"></div>
                    </div>
                    <div class="border-t border-base-200 my-2"></div>
                    <div class="flex justify-between">
                      <div class="h-4 w-16 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-6 w-24 bg-base-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div class="h-10 w-full bg-base-200 rounded-lg animate-pulse mt-4"></div>
                </div>
              }
            } @else {
              <!-- Overlay de carga cuando hay datos pero se están recargando -->
              @if (isLoading() && liquidation().choferes.length > 0) {
                <div class="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                  <div class="flex flex-col items-center gap-3">
                    <span class="loading loading-spinner loading-lg text-primary"></span>
                    <span class="text-sm text-base-content/60 font-medium">Cargando datos...</span>
                  </div>
                </div>
              }
              @for (chofer of liquidation().choferes; track chofer.chofer_id) {
              <div class="bg-base-100 border border-base-200 rounded-xl p-4 shadow-sm" 
                 [class.border-l-4]="chofer.estado_pago === 'pagado'" 
                 [class.border-l-success]="chofer.estado_pago === 'pagado'">
              
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center p-2.5">
                    <app-driver-icon class="w-full h-full" />
                  </div>
                  <div>
                    <div class="font-bold text-lg">{{ chofer.chofer_nombre }}</div>
                    <div class="text-xs text-base-content/50 uppercase tracking-wide">
                      Meta: {{ chofer.minimo_garantizado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                    </div>
                  </div>
                </div>
                @if (chofer.estado_pago === 'pagado') {
                  <div class="badge badge-success gap-1 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Pagado
                  </div>
                }
              </div>

              <div class="bg-base-50 rounded-lg p-3 space-y-2 mb-4 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Total Ganado</span>
                  <span class="tabular-nums font-medium">{{ chofer.total_ganado | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60">Garantizado</span>
                  <div class="flex items-center gap-2">
                    @if (liquidation().es_ultima_semana) {
                      <!-- Última semana: mostrar acumulado mensual -->
                      <div class="flex flex-col items-end gap-1">
                        <span class="badge badge-xxs sm:badge-xs badge-ghost tabular-nums text-[9px] sm:text-[10px] text-base-content/50 font-mono">
                          Acum: {{ chofer.acumulado_mensual || chofer.total_ganado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                        </span>
                        <span class="badge badge-xxs sm:badge-xs badge-ghost tabular-nums text-[9px] sm:text-[10px] text-base-content/50 font-mono">
                          Min: {{ chofer.minimo_garantizado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                        </span>
                        <label class="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            class="toggle toggle-sm toggle-primary"
                            [checked]="chofer.aplicar_garantizado"
                            [disabled]="liquidation().estado === 'cerrado' || chofer.estado_pago === 'pagado' || (chofer.acumulado_mensual || chofer.total_ganado) >= chofer.minimo_garantizado"
                            (change)="onAplicarGarantizadoChange(chofer.chofer_id, $event)">
                          <span class="text-xs text-base-content/60">Aplicar</span>
                        </label>
                      </div>
                    } @else {
                      <!-- Semanas normales: deshabilitado -->
                      <div class="flex flex-col items-end gap-1 opacity-50">
                        <span class="badge badge-sm badge-ghost tabular-nums text-xs text-base-content/30 font-mono">
                          No aplica
                        </span>
                        <label class="flex items-center gap-1 cursor-not-allowed">
                          <input
                            type="checkbox"
                            class="toggle toggle-sm toggle-primary"
                            [checked]="false"
                            disabled>
                          <span class="text-xs text-base-content/40">Aplicar</span>
                        </label>
                      </div>
                    }
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-base-content/60">Ajuste / Bono</span>
                  @if (liquidation().es_ultima_semana) {
                    @if (chofer.aplicar_garantizado) {
                      <input
                        type="number"
                        [value]="chofer.monto_a_completar"
                        [disabled]="(chofer.acumulado_mensual || chofer.total_ganado) >= chofer.minimo_garantizado || liquidation().estado === 'cerrado' || chofer.estado_pago === 'pagado'"
                        (input)="onMissingAmountChange(chofer.chofer_id, $event)"
                        class="input input-xs input-bordered w-24 text-right tabular-nums"
                        [class.input-primary]="chofer.monto_a_completar > 0"
                        [class.text-base-content/30]="chofer.monto_a_completar === 0"
                        min="0">
                    } @else {
                      <input
                        type="number"
                        value="0"
                        disabled
                        class="input input-xs input-bordered w-24 text-right tabular-nums text-base-content/30">
                    }
                  } @else {
                    <span class="badge badge-sm badge-ghost tabular-nums text-xs text-base-content/30 font-mono">No aplica</span>
                  }
                </div>
                <div class="border-t border-base-200 my-2"></div>
                <div class="flex justify-between items-center">
                  <span class="font-bold text-base-content">A Pagar</span>
                  <span class="font-black text-xl text-primary tabular-nums">{{ calculatePagoFinal(chofer) | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              </div>

              @if (chofer.estado_pago !== 'pagado') {
                <button 
                  class="btn btn-primary btn-block shadow-lg shadow-primary/20"
                  (click)="onConfirmPayment(chofer)">
                  Confirmar Pago
                </button>
              }
            </div>
            }
            }
          </div>
        </div>

        <!-- Footer: Acciones Globales -->
        @if (liquidation().es_ultima_semana && liquidation().estado === 'abierto') {
          <div class="border-t border-base-200 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            @if (!allChoferesPaid()) {
              <div class="text-xs text-base-content/50 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-warning">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>Todos los colaboradores deben estar pagados para finalizar el mes</span>
              </div>
            } @else {
              <div></div>
            }
            <button 
              class="btn btn-primary px-8"
              [class.btn-disabled]="!allChoferesPaid()"
              [disabled]="!allChoferesPaid()"
              (click)="onClosePeriod()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Finalizar Mes
            </button>
          </div>
        } @else if (liquidation().estado === 'cerrado') {
          <div class="border-t border-base-200 mt-6 pt-6">
            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
              </svg>
              <span>Este período fue cerrado y no puede ser modificado.</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiquidationTable {
  liquidation = input.required<LiquidationPeriod>();
  availableWeeks = input<number[]>([]); // Array de semanas disponibles (ej: [1,2,3,4] o [1,2,3,4,5])
  selectedWeek = input<number>(1);
  payrollPeriod = input<'current' | 'previous'>('current');
  isLoading = input<boolean>(false); // Estado de carga para mostrar skeleton
  
  confirmPayment = output<{ choferId: number; data: { metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string } }>();
  missingAmountChange = output<{ choferId: number; monto: number }>();
  aplicarGarantizadoChange = output<{ choferId: number; aplicar: boolean }>();
  closePeriod = output<void>();
  weekChange = output<number>(); // Emite cuando cambia la semana seleccionada
  payrollPeriodChange = output<'current' | 'previous'>(); // Emite cuando cambia el período

  // Signal para rastrear choferes en estado "confirmado" temporalmente
  confirmedChoferes = signal<Set<number>>(new Set());

  // Computed: Total de Nómina
  calculateTotalPayroll = computed(() => {
    return this.liquidation().choferes.reduce((acc, c) => acc + this.calculatePagoFinal(c), 0);
  });

  // Computed: Cantidad de Pendientes
  getPendingCount = computed(() => {
    return this.liquidation().choferes.filter(c => c.estado_pago !== 'pagado').length;
  });

  // Computed: Verificar si todos los choferes están pagados
  allChoferesPaid = computed(() => {
    return this.liquidation().choferes.every(c => c.estado_pago === 'pagado');
  });

  // Helper: Obtener Iniciales
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onMissingAmountChange(choferId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const monto = Math.max(0, Number(input.value) || 0);
    this.missingAmountChange.emit({ choferId, monto });
  }

  onAplicarGarantizadoChange(choferId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.aplicarGarantizadoChange.emit({ choferId, aplicar: checkbox.checked });
  }

  calculatePagoFinal(chofer: LiquidationDriver): number {
    // Si es última semana y se aplica garantizado
    if (this.liquidation().es_ultima_semana && chofer.aplicar_garantizado) {
      const acumulado = chofer.acumulado_mensual || chofer.total_ganado;
      if (acumulado < chofer.minimo_garantizado) {
        // El pago de la semana es lo ganado + el ajuste para completar el mínimo mensual
        return chofer.total_ganado + chofer.monto_a_completar;
      }
    }
    
    // En semanas normales o si no aplica garantizado, solo se paga lo ganado
    return chofer.total_ganado;
  }

  onWeekChange(week: number): void {
    this.weekChange.emit(week);
  }

  onPayrollPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.payrollPeriodChange.emit(select.value as 'current' | 'previous');
  }

  onConfirmPayment(chofer: LiquidationDriver): void {
    // Esto debería abrir un modal, pero por ahora emitimos el evento
    // En la página principal se manejará el modal
    this.confirmPayment.emit({
      choferId: chofer.chofer_id,
      data: {
        metodo_pago: 'transferencia',
        codigo_transferencia: ''
      }
    });
  }

  onClosePeriod(): void {
    if (confirm('¿Está seguro de que desea cerrar y finalizar este período de liquidación? Esta acción es irreversible.')) {
      this.closePeriod.emit();
    }
  }
}

