import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { LedgerSummary } from '../../models/accounting.models';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';
import { LedgerMovementModalService } from '../../services/ledger-movement-modal.service';
import { DriverLedgerHistoryModalService } from '../../services/driver-ledger-history-modal.service';
import { AccountingService } from '../../services/accounting.service';
import { AlertModalService } from '../../services/alert-modal.service';

@Component({
  selector: 'app-ledger-table',
  standalone: true,
  imports: [CommonModule, UiIconComponent],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200 rounded-3xl overflow-hidden">
      <!-- Header -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
          <div class="flex-1 min-w-0">
            <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
              Cuentas Corrientes Choferes
            </h2>
            <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
              Bitácora de préstamos y pagos. Registra movimientos manuales de dinero.
            </p>
          </div>
          
          <!-- Badge de conteo -->
          <div class="shrink-0">
            <span class="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              {{ summaries().length }} {{ summaries().length === 1 ? 'chofer' : 'choferes' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
        @if (isLoading()) {
          <!-- Skeleton se mostrará desde el componente padre -->
        } @else if (summaries().length > 0) {
          <!-- Vista Desktop: Tabla (solo desde lg: 1024px) -->
          <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
            <table class="table w-full">
              <thead class="bg-base-50 border-b border-base-200">
                <tr>
                  <th class="pl-6 w-1/3 text-xs font-bold uppercase tracking-widest text-base-content/60">Chofer</th>
                  <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60">Estado</th>
                  <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums">Saldo Actual</th>
                  <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60">Último Movimiento</th>
                  <th class="text-center text-xs font-bold uppercase tracking-widest text-base-content/60 w-48">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (summary of summaries(); track summary.chofer_id) {
                  <tr 
                    class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none"
                    [class.bg-error/5]="summary.estado_cuenta === 'DEUDOR'"
                    [class.bg-success/5]="summary.estado_cuenta === 'A_FAVOR'">
                    
                    <!-- Chofer -->
                    <td class="pl-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="avatar placeholder shrink-0">
                          <div class="bg-base-200 text-base-content rounded-full w-10 h-10 flex items-center justify-center">
                            <ui-icon name="Users" size="sm" />
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-bold text-base-content truncate">{{ summary.nombre_completo }}</div>
                          <div class="text-xs text-base-content/50">ID: {{ summary.chofer_id }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Estado -->
                    <td class="text-left">
                      @switch (summary.estado_cuenta) {
                        @case ('DEUDOR') {
                          <span class="badge badge-error gap-1.5 px-3 py-1.5 text-white font-semibold">
                            <ui-icon name="AlertCircle" size="xs" />
                            Deudor
                          </span>
                        }
                        @case ('A_FAVOR') {
                          <span class="badge badge-success gap-1.5 px-3 py-1.5 text-white font-semibold">
                            <ui-icon name="CheckCircle2" size="xs" />
                            A Favor
                          </span>
                        }
                        @case ('AL_DIA') {
                          <span class="badge badge-ghost gap-1.5 px-3 py-1.5 font-semibold">
                            <ui-icon name="CheckCircle2" size="xs" />
                            Al Día
                          </span>
                        }
                      }
                    </td>

                    <!-- Saldo Actual -->
                    <td class="text-left font-mono tabular-nums">
                      <span class="font-black text-lg"
                            [class.text-error]="summary.saldo_actual < 0"
                            [class.text-success]="summary.saldo_actual > 0"
                            [class.text-base-content]="summary.saldo_actual === 0">
                        {{ formatCurrency(summary.saldo_actual) }}
                      </span>
                    </td>

                    <!-- Último Movimiento -->
                    <td class="text-left">
                      @if (summary.ultimo_movimiento) {
                        <div class="text-sm text-base-content/70">
                          {{ formatDate(summary.ultimo_movimiento) }}
                        </div>
                      } @else {
                        <span class="text-sm text-base-content/30">Sin movimientos</span>
                      }
                    </td>

                    <!-- Acciones -->
                    <td class="pr-6 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          class="btn btn-sm btn-primary gap-2 font-semibold shadow-sm hover:shadow-md"
                          (click)="openMovementModal(summary)"
                          title="Registrar Movimiento">
                          <ui-icon name="DollarSign" size="xs" />
                          <span class="hidden xl:inline">Movimiento</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-ghost gap-2 font-semibold"
                          (click)="viewHistory(summary)"
                          title="Ver Historial">
                          <ui-icon name="Eye" size="xs" />
                          <span class="hidden xl:inline">Historial</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Vista Móvil y Tablet: Tarjetas (hasta lg: 1024px) -->
          <div class="lg:hidden space-y-4">
            @for (summary of summaries(); track summary.chofer_id) {
              <div class="border border-base-200 rounded-xl overflow-hidden shadow-sm bg-base-100"
                   [class.ring-2]="summary.estado_cuenta === 'DEUDOR'"
                   [class.ring-error/20]="summary.estado_cuenta === 'DEUDOR'"
                   [class.bg-error/5]="summary.estado_cuenta === 'DEUDOR'"
                   [class.bg-success/5]="summary.estado_cuenta === 'A_FAVOR'">
                
                <div class="p-4 flex flex-col gap-3">
                  <!-- Header de la tarjeta -->
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div class="avatar placeholder shrink-0">
                        <div class="bg-base-200 text-base-content rounded-full w-12 h-12 flex items-center justify-center">
                          <ui-icon name="Users" size="sm" />
                        </div>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-bold text-base sm:text-lg text-base-content truncate">{{ summary.nombre_completo }}</div>
                        <div class="text-xs text-base-content/50">ID: {{ summary.chofer_id }}</div>
                      </div>
                    </div>
                    <!-- Estado badge -->
                    <div class="shrink-0">
                      @switch (summary.estado_cuenta) {
                        @case ('DEUDOR') {
                          <span class="badge badge-error gap-1 px-2 py-1 text-xs text-white font-semibold">
                            <ui-icon name="AlertCircle" size="xs" />
                            Deudor
                          </span>
                        }
                        @case ('A_FAVOR') {
                          <span class="badge badge-success gap-1 px-2 py-1 text-xs text-white font-semibold">
                            <ui-icon name="CheckCircle2" size="xs" />
                            A Favor
                          </span>
                        }
                        @case ('AL_DIA') {
                          <span class="badge badge-ghost gap-1 px-2 py-1 text-xs font-semibold">
                            <ui-icon name="CheckCircle2" size="xs" />
                            Al Día
                          </span>
                        }
                      }
                    </div>
                  </div>

                  <!-- Saldo y último movimiento -->
                  <div class="bg-base-50 rounded-lg p-3 border border-base-200">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-xs uppercase tracking-wider text-base-content/50">Saldo Actual</span>
                      <span class="font-black text-lg font-mono tabular-nums"
                            [class.text-error]="summary.saldo_actual < 0"
                            [class.text-success]="summary.saldo_actual > 0"
                            [class.text-base-content]="summary.saldo_actual === 0">
                        {{ formatCurrency(summary.saldo_actual) }}
                      </span>
                    </div>
                    @if (summary.ultimo_movimiento) {
                      <div class="text-xs text-base-content/50">
                        Último: {{ formatDate(summary.ultimo_movimiento) }}
                      </div>
                    } @else {
                      <div class="text-xs text-base-content/30">Sin movimientos</div>
                    }
                  </div>

                  <!-- Botones de acción -->
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-primary flex-1 gap-2 font-semibold"
                      (click)="openMovementModal(summary)">
                      <ui-icon name="DollarSign" size="xs" />
                      Movimiento
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost flex-1 gap-2 font-semibold"
                      (click)="viewHistory(summary)">
                      <ui-icon name="Eye" size="xs" />
                      Historial
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Mensaje cuando no hay datos -->
          <div class="flex flex-col items-center justify-center py-12">
            <ui-icon name="FileText" size="lg" class="text-base-content/40 mb-4" />
            <h3 class="text-lg font-semibold text-base-content mb-2">No hay choferes disponibles</h3>
            <p class="text-sm text-base-content/70 text-center max-w-md">
              No se encontraron choferes activos con cuentas corrientes.
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LedgerTable {
  summaries = input.required<LedgerSummary[]>();
  isLoading = input<boolean>(false);
  refreshRequested = output<void>();

  private movementModalService = inject(LedgerMovementModalService);
  private historyModalService = inject(DriverLedgerHistoryModalService);
  private accountingService = inject(AccountingService);
  private alertService = inject(AlertModalService);

  openMovementModal(summary: LedgerSummary): void {
    this.movementModalService.open(summary).then(async (movement) => {
      if (movement) {
        try {
          await firstValueFrom(this.accountingService.createLedgerMovement(movement));
          this.alertService.show({
            type: 'success',
            title: 'Movimiento registrado',
            message: 'El movimiento se ha registrado correctamente.'
          });
          this.movementModalService.finishSubmission();
          this.refreshRequested.emit();
        } catch (error: any) {
          this.alertService.show({
            type: 'error',
            title: 'Error al registrar movimiento',
            message: error?.error?.detail || error?.message || 'No se pudo registrar el movimiento. Intenta nuevamente.'
          });
          this.movementModalService.finishSubmission();
        }
      }
    });
  }

  viewHistory(summary: LedgerSummary): void {
    this.historyModalService.open(summary.chofer_id, summary.nombre_completo);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateString;
    }
  }
}
