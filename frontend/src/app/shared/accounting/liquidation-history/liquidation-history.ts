import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClosedLiquidation } from '../../models/accounting.models';

@Component({
  selector: 'app-liquidation-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body p-4 sm:p-6">
        
        <div class="mb-6">
          <h2 class="text-lg sm:text-xl font-bold">Historial de Cierres</h2>
          <p class="text-xs sm:text-sm text-base-content/60">Registro inmutable de liquidaciones.</p>
        </div>

        <!-- Vista Desktop: Tabla (solo desde lg: 1024px) -->
        <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full table-fixed">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 w-1/4 text-xs font-bold uppercase tracking-widest text-base-content/60">Período</th>
                <th class="w-1/6 text-xs font-bold uppercase tracking-widest text-base-content/60">Fecha Cierre</th>
                <th class="w-1/4 text-xs font-bold uppercase tracking-widest text-base-content/60">Responsable</th>
                <th class="text-right text-xs font-bold uppercase tracking-widest text-base-content/60 pr-12">Total</th>
                <th class="w-16"></th>
              </tr>
            </thead>
            <tbody>
              @for (liquidation of liquidations(); track liquidation.id) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none cursor-pointer"
                  [class.bg-base-50]="expandedId() === liquidation.id"
                  (click)="toggleDetail(liquidation.id)">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </div>
                      <span class="font-bold text-base-content truncate">{{ liquidation.periodo }}</span>
                    </div>
                  </td>
                  <td class="tabular-nums text-sm text-base-content/70">{{ formatDate(liquidation.fecha_cierre) }}</td>
                  <td class="pr-4">
                    <div class="flex items-center gap-2 w-full">
                      <div class="avatar placeholder shrink-0">
                        <div class="bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center">
                          <span class="text-[10px] font-bold">{{ getInitials(liquidation.cerrado_por) }}</span>
                        </div>
                      </div>
                      <span class="text-sm text-base-content/80 truncate block w-full" [attr.title]="liquidation.cerrado_por">
                        {{ liquidation.cerrado_por }}
                      </span>
                    </div>
                  </td>
                  <td class="text-right pr-12">
                    <span class="font-black text-base-content tabular-nums tracking-tight">{{ formatCurrency(liquidation.total_pagado) }}</span>
                  </td>
                  <td class="pr-6 text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 text-base-content/40" 
                        [class.rotate-180]="expandedId() === liquidation.id" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </td>
                </tr>

                @if (expandedId() === liquidation.id) {
                  <tr>
                    <td colspan="5" class="p-0 border-b border-base-200">
                      <div class="bg-base-200/30 p-6 flex border-l-4 border-base-300 animate-in fade-in slide-in-from-top-1">
                        <ng-container *ngTemplateOutlet="receiptDetail; context: { $implicit: liquidation, isMobile: false }"></ng-container>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Vista Móvil y Tablet: Tarjetas (hasta lg: 1024px) -->
        <div class="lg:hidden space-y-4">
          @for (liquidation of liquidations(); track liquidation.id) {
            <div class="border border-base-200 rounded-xl overflow-hidden shadow-sm bg-base-100"
                 [class.ring-2]="expandedId() === liquidation.id"
                 [class.ring-base-200]="expandedId() === liquidation.id">
              
              <div class="p-4 flex justify-between items-center cursor-pointer" 
                   (click)="toggleDetail(liquidation.id)">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="bg-base-200/50 p-2.5 rounded-lg text-base-content/60 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div class="truncate">
                    <div class="font-bold text-base truncate">{{ liquidation.periodo }}</div>
                    <div class="text-xs text-base-content/50 flex items-center gap-1">
                      <span>{{ formatDate(liquidation.fecha_cierre) }}</span>
                      <span>•</span>
                      <span class="truncate max-w-[100px]">{{ liquidation.cerrado_por }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="font-black text-base tabular-nums">{{ formatCurrency(liquidation.total_pagado) }}</div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 text-base-content/40" 
                      [class.rotate-180]="expandedId() === liquidation.id" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              @if (expandedId() === liquidation.id) {
                <div class="bg-base-200/30 border-t border-base-200 p-3 animate-in fade-in">
                  <ng-container *ngTemplateOutlet="receiptDetail; context: { $implicit: liquidation, isMobile: true }"></ng-container>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>

    <!-- Template Reutilizable: Detalle del Recibo -->
    <ng-template #receiptDetail let-liquidation let-isMobile="isMobile">
      <div class="w-full bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        
        <div class="bg-base-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-base-200 flex justify-between items-center">
          <div class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-base-content/50">Comprobante de Nómina</div>
          <button class="btn btn-xs btn-ghost gap-1 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 py-4 border-b border-base-100">
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Total Liquidado</div>
            <div class="text-lg sm:text-xl font-black text-base-content tabular-nums">{{ formatCurrency(liquidation.total_pagado) }}</div>
          </div>
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Choferes</div>
            <div class="text-lg sm:text-xl font-bold text-base-content">{{ getChoferesCount(liquidation) }}</div>
          </div>
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Promedio</div>
            <div class="text-lg sm:text-xl font-bold text-base-content tabular-nums">{{ formatCurrency(getAveragePayment(liquidation)) }}</div>
          </div>
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Estado</div>
            <div class="badge badge-sm badge-success gap-1 pl-1.5 pr-3 text-white font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Finalizado
            </div>
          </div>
        </div>

        @if (!isMobile) {
          <!-- Vista Desktop: Tabla de Choferes -->
          <table class="table table-sm w-full">
            <thead class="text-base-content/40 border-b border-base-100">
              <tr>
                <th class="pl-6 font-normal">Beneficiario</th>
                <th class="text-right font-normal">Base</th>
                <th class="text-right font-normal">Ajuste</th>
                <th class="text-right font-normal">Total</th>
                <th class="pl-8 font-normal">Método</th>
                <th class="font-normal">Ref</th>
              </tr>
            </thead>
            <tbody>
              @for (chofer of getChoferes(liquidation); track chofer.chofer_id) {
                <tr class="hover:bg-base-50/50">
                  <td class="pl-6 font-medium py-2.5">{{ chofer.chofer_nombre }}</td>
                  <td class="text-right tabular-nums text-xs text-base-content/60">{{ formatCurrency(chofer.total_ganado) }}</td>
                  <td class="text-right tabular-nums text-xs text-base-content/60">{{ formatCurrency(chofer.pago_final - chofer.total_ganado) }}</td>
                  <td class="text-right tabular-nums text-sm font-bold text-base-content">{{ formatCurrency(chofer.pago_final) }}</td>
                  <td class="pl-8">
                    <div class="badge badge-xs badge-ghost uppercase">{{ chofer.metodo_pago || '—' }}</div>
                  </td>
                  <td class="font-mono text-[10px] text-base-content/50">{{ chofer.codigo_transferencia || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <!-- Vista Móvil: Lista Vertical de Choferes -->
          <div class="divide-y divide-base-100">
            @for (chofer of getChoferes(liquidation); track chofer.chofer_id) {
              <div class="p-4 flex justify-between items-center">
                <div>
                  <div class="font-bold text-sm">{{ chofer.chofer_nombre }}</div>
                  <div class="text-[10px] text-base-content/50 mt-1 flex gap-2">
                    <span class="uppercase badge badge-xs badge-ghost">{{ chofer.metodo_pago || '—' }}</span>
                    <span class="font-mono">{{ chofer.codigo_transferencia || '—' }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-base tabular-nums">{{ formatCurrency(chofer.pago_final) }}</div>
                  <div class="text-[10px] text-base-content/50">Base: {{ formatCurrency(chofer.total_ganado) }}</div>
                </div>
              </div>
            }
          </div>
        }
        
        <div class="bg-base-50/50 p-3 text-center border-t border-base-100 text-[10px] text-base-content/40 uppercase tracking-widest">
          Cerrado por: {{ liquidation.cerrado_por }}
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiquidationHistory {
  liquidations = input.required<ClosedLiquidation[]>();
  expandedId = signal<number | null>(null);

  toggleDetail(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getChoferesCount(liquidation: ClosedLiquidation): number {
    return liquidation.choferes?.length || 0;
  }

  getChoferes(liquidation: ClosedLiquidation): any[] {
    return liquidation.choferes || [];
  }

  getAveragePayment(liquidation: ClosedLiquidation): number {
    const choferes = this.getChoferes(liquidation);
    if (choferes.length === 0) return 0;
    return liquidation.total_pagado / choferes.length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return date;
    }
  }
}
