import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidationPeriod, LiquidationDriver } from '../../models/accounting.models';

@Component({
  selector: 'app-liquidation-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body p-4 sm:p-6">
        
        <!-- Header con Resumen Activo -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 class="text-xl font-bold">Procesar Liquidación</h2>
            <p class="text-sm text-base-content/60">Ajusta los montos garantizados y confirma los pagos.</p>
          </div>

          <div class="bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-4">
            <div class="flex flex-col">
              <span class="text-[10px] uppercase font-bold tracking-widest text-primary/70">Total Nómina</span>
              <span class="text-xl font-black text-primary tabular-nums tracking-tight">
                {{ calculateTotalPayroll() | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </span>
            </div>
            <div class="h-8 w-px bg-primary/20"></div>
            <div class="flex flex-col items-end">
              <span class="text-[10px] uppercase font-bold tracking-widest text-base-content/50">Pendientes</span>
              <span class="text-sm font-bold text-base-content">{{ getPendingCount() }} / {{ liquidation().choferes.length }}</span>
            </div>
          </div>
        </div>

        <!-- Vista Desktop: Tabla con Ecuación Visual -->
        <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
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
              @for (chofer of liquidation().choferes; track chofer.chofer_id) {
                <tr class="hover:bg-base-50 transition-colors border-b border-base-100 last:border-none group">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="avatar placeholder">
                        <div class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                          <span class="text-sm font-bold">{{ getInitials(chofer.chofer_nombre) }}</span>
                        </div>
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
                    <span class="badge badge-sm badge-ghost tabular-nums text-xs text-base-content/50 font-mono">
                      Min: {{ chofer.minimo_garantizado | currency:'CLP':'symbol-narrow':'1.0-0' }}
                    </span>
                  </td>

                  <td class="text-left">
                    <div class="relative flex items-center justify-end">
                      <span class="absolute right-24 text-base-content/30 text-xs mr-2 group-hover:opacity-100 opacity-0 transition-opacity">+</span>
                      <input
                        type="number"
                        [value]="chofer.monto_a_completar"
                        [disabled]="chofer.total_ganado >= chofer.minimo_garantizado || liquidation().estado === 'cerrado' || chofer.estado_pago === 'pagado'"
                        (input)="onMissingAmountChange(chofer.chofer_id, $event)"
                        class="input input-sm input-ghost w-24 text-right tabular-nums font-bold focus:bg-base-100 focus:border-primary border border-transparent hover:border-base-300 transition-all rounded-lg p-0 pr-2"
                        [class.text-base-content/30]="chofer.monto_a_completar === 0"
                        [class.text-primary]="chofer.monto_a_completar > 0"
                        min="0">
                    </div>
                  </td>

                  <td class="text-left bg-base-50/50 font-bold text-base-content tabular-nums text-lg border-l border-base-200 font-mono">
                    {{ chofer.pago_final | currency:'CLP':'symbol-narrow':'1.0-0' }}
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
            </tbody>
          </table>
        </div>

        <!-- Vista Móvil: Tarjetas de Nómina -->
        <div class="lg:hidden space-y-4">
          @for (chofer of liquidation().choferes; track chofer.chofer_id) {
            <div class="bg-base-100 border border-base-200 rounded-xl p-4 shadow-sm" 
                 [class.border-l-4]="chofer.estado_pago === 'pagado'" 
                 [class.border-l-success]="chofer.estado_pago === 'pagado'">
              
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                  <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                      <span class="text-base font-bold">{{ getInitials(chofer.chofer_nombre) }}</span>
                    </div>
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
                  <span class="text-base-content/60">Ajuste / Bono</span>
                  <input
                    type="number"
                    [value]="chofer.monto_a_completar"
                    [disabled]="chofer.total_ganado >= chofer.minimo_garantizado || liquidation().estado === 'cerrado' || chofer.estado_pago === 'pagado'"
                    (input)="onMissingAmountChange(chofer.chofer_id, $event)"
                    class="input input-xs input-bordered w-24 text-right tabular-nums"
                    [class.input-primary]="chofer.monto_a_completar > 0"
                    min="0">
                </div>
                <div class="border-t border-base-200 my-2"></div>
                <div class="flex justify-between items-center">
                  <span class="font-bold text-base-content">A Pagar</span>
                  <span class="font-black text-xl text-primary tabular-nums">{{ chofer.pago_final | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
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
        </div>

        <!-- Footer: Acciones Globales -->
        @if (liquidation().estado === 'abierto') {
          <div class="border-t border-base-200 mt-6 pt-6 flex justify-end">
            <button class="btn btn-primary px-8" (click)="onClosePeriod()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Cerrar y Finalizar Mes
            </button>
          </div>
        } @else {
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
  
  confirmPayment = output<{ choferId: number; data: { metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string } }>();
  missingAmountChange = output<{ choferId: number; monto: number }>();
  closePeriod = output<void>();

  // Computed: Total de Nómina
  calculateTotalPayroll = computed(() => {
    return this.liquidation().choferes.reduce((acc, c) => acc + c.pago_final, 0);
  });

  // Computed: Cantidad de Pendientes
  getPendingCount = computed(() => {
    return this.liquidation().choferes.filter(c => c.estado_pago !== 'pagado').length;
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

