import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { AccountingService } from '../../shared/services/accounting.service';
import { AccountingKPIs } from '../../shared/accounting/accounting-kpis/accounting-kpis';
import { AccountingChart } from '../../shared/accounting/accounting-chart/accounting-chart';
import { WeeklySummaryTable } from '../../shared/accounting/weekly-summary-table/weekly-summary-table';
import { LiquidationTable } from '../../shared/accounting/liquidation-table/liquidation-table';
import { LiquidationHistory } from '../../shared/accounting/liquidation-history/liquidation-history';
import { PaymentModal } from '../../shared/accounting/payment-modal/payment-modal';
import { AccountingTab, AccountingSummary, DailyProfitabilityData, WeeklySummary, LiquidationPeriod, ClosedLiquidation, LiquidationDriver } from '../../shared/models/accounting.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-contabilidad',
  imports: [AccountingKPIs, AccountingChart, WeeklySummaryTable, LiquidationTable, LiquidationHistory, PaymentModal],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold mb-2">Contabilidad y Liquidación</h1>
        <p class="text-base-content/70">
          Revisa resúmenes financieros y procesa la nómina de choferes.
        </p>
      </div>

      <!-- Tabs -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-header">
          <div class="tabs tabs-bordered w-full">
            <button
              class="tab tab-lg"
              [class.tab-active]="activeTab() === 'summary'"
              (click)="setActiveTab('summary')">
              Resumen General (RF-019)
            </button>
            <button
              class="tab tab-lg"
              [class.tab-active]="activeTab() === 'weekly'"
              (click)="setActiveTab('weekly')">
              Resumen Semanal
            </button>
            <button
              class="tab tab-lg"
              [class.tab-active]="activeTab() === 'payroll'"
              (click)="setActiveTab('payroll')">
              Liquidación de Choferes (RF-022)
            </button>
            <button
              class="tab tab-lg"
              [class.tab-active]="activeTab() === 'history'"
              (click)="setActiveTab('history')">
              Historial de Liquidaciones
            </button>
          </div>
        </div>

        <div class="card-body">
          <!-- Tab: Resumen General -->
          @if (activeTab() === 'summary') {
            <div class="space-y-6">
              <!-- Filtros de Período -->
              <div class="flex justify-end items-center gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Mes</span>
                  </label>
                  <select class="select select-bordered" [value]="selectedMonth()" (change)="onMonthChange($event)">
                    @for (month of months(); track month.value) {
                      <option [value]="month.value">{{ month.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Año</span>
                  </label>
                  <select class="select select-bordered" [value]="selectedYear()" (change)="onYearChange($event)">
                    @for (year of years(); track year) {
                      <option [value]="year">{{ year }}</option>
                    }
                  </select>
                </div>
                <button class="btn btn-secondary" (click)="applyFilters()">Aplicar</button>
              </div>

              <!-- KPIs -->
              @if (summary()) {
                <app-accounting-kpis [summary]="summary()!" />
              }

              <!-- Gráfico -->
              @if (dailyData().length > 0) {
                <app-accounting-chart [dailyData]="dailyData()" />
              }
            </div>
          }

          <!-- Tab: Resumen Semanal -->
          @if (activeTab() === 'weekly') {
            <div class="space-y-6">
              <!-- Filtros de Período -->
              <div class="flex justify-end items-center gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Mes</span>
                  </label>
                  <select class="select select-bordered" [value]="selectedMonth()" (change)="onMonthChange($event)">
                    @for (month of months(); track month.value) {
                      <option [value]="month.value">{{ month.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Año</span>
                  </label>
                  <select class="select select-bordered" [value]="selectedYear()" (change)="onYearChange($event)">
                    @for (year of years(); track year) {
                      <option [value]="year">{{ year }}</option>
                    }
                  </select>
                </div>
                <button class="btn btn-secondary" (click)="applyFilters()">Aplicar</button>
              </div>

              <!-- Tabla de Resumen Semanal -->
              @if (weeklySummaries().length > 0) {
                <app-weekly-summary-table [summaries]="weeklySummaries()" />
              }
            </div>
          }

          <!-- Tab: Liquidación de Choferes -->
          @if (activeTab() === 'payroll') {
            <div class="space-y-6">
              <!-- Filtros de Período -->
              <div class="flex justify-end items-center gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Mes</span>
                  </label>
                  <select class="select select-bordered" [value]="selectedMonth()" (change)="onMonthChange($event)">
                    @for (month of months(); track month.value) {
                      <option [value]="month.value">{{ month.label }}</option>
                    }
                  </select>
                </div>
                <button class="btn btn-secondary" (click)="loadLiquidation()">Cargar Mes</button>
              </div>

              <!-- Tabla de Liquidación -->
              @if (liquidation()) {
                <app-liquidation-table
                  [liquidation]="liquidation()!"
                  (confirmPayment)="onConfirmPayment($event)"
                  (missingAmountChange)="onMissingAmountChange($event)"
                  (saveDraft)="onSaveDraft()"
                  (closePeriod)="onClosePeriod()" />
              }
            </div>
          }

          <!-- Tab: Historial de Liquidaciones -->
          @if (activeTab() === 'history') {
            @if (liquidationHistory().length > 0) {
              <app-liquidation-history [liquidations]="liquidationHistory()" />
            }
          }
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Pago -->
    <app-payment-modal
      [isOpen]="paymentModalOpen()"
      [driver]="selectedDriver()"
      (confirm)="onPaymentConfirm($event)"
      (cancel)="onPaymentCancel()" />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contabilidad implements OnInit {
  private accountingService = inject(AccountingService);

  activeTab = signal<AccountingTab>('summary');
  
  selectedMonth = signal(11); // Noviembre por defecto
  selectedYear = signal(2025);

  // Datos
  summaryData = signal<AccountingSummary | null>(null);
  dailyData = signal<DailyProfitabilityData[]>([]);
  weeklySummaries = signal<WeeklySummary[]>([]);
  liquidationData = signal<LiquidationPeriod | null>(null);
  liquidationHistoryData = signal<ClosedLiquidation[]>([]);

  // Modal de pago
  paymentModalOpen = signal(false);
  selectedDriver = signal<LiquidationDriver | null>(null);
  pendingPaymentChoferId = signal<number | null>(null);

  months = computed(() => {
    const monthNames = [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
    return monthNames;
  });

  years = computed(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  });

  summary = computed(() => this.summaryData());
  liquidation = computed(() => this.liquidationData());
  liquidationHistory = computed(() => this.liquidationHistoryData());

  ngOnInit(): void {
    this.loadSummary();
    this.loadDailyData();
    this.loadWeeklySummaries();
    this.loadLiquidation();
    this.loadLiquidationHistory();
  }

  setActiveTab(tab: AccountingTab): void {
    this.activeTab.set(tab);
  }

  onMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedMonth.set(Number(select.value));
  }

  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedYear.set(Number(select.value));
  }

  applyFilters(): void {
    this.loadSummary();
    this.loadDailyData();
    this.loadWeeklySummaries();
  }

  loadSummary(): void {
    this.accountingService.getSummary(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of(null)))
      .subscribe(summary => {
        if (summary) {
          this.summaryData.set(summary);
        }
      });
  }

  loadDailyData(): void {
    this.accountingService.getDailyProfitability(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dailyData.set(data);
      });
  }

  loadWeeklySummaries(): void {
    this.accountingService.getWeeklySummary(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of([])))
      .subscribe(summaries => {
        this.weeklySummaries.set(summaries);
      });
  }

  loadLiquidation(): void {
    this.accountingService.getLiquidation(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of(null)))
      .subscribe(liquidation => {
        if (liquidation) {
          this.liquidationData.set(liquidation);
        }
      });
  }

  loadLiquidationHistory(): void {
    this.accountingService.getLiquidationHistory()
      .pipe(catchError(() => of([])))
      .subscribe(history => {
        this.liquidationHistoryData.set(history);
      });
  }

  onConfirmPayment(event: { choferId: number; data: { metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string } }): void {
    const liquidation = this.liquidation();
    if (!liquidation) return;

    const chofer = liquidation.choferes.find(c => c.chofer_id === event.choferId);
    if (chofer) {
      this.selectedDriver.set(chofer);
      this.pendingPaymentChoferId.set(event.choferId);
      this.paymentModalOpen.set(true);
    }
  }

  onPaymentConfirm(data: { metodo_pago: 'transferencia' | 'efectivo'; codigo_transferencia?: string }): void {
    const choferId = this.pendingPaymentChoferId();
    if (!choferId) return;

    this.accountingService.confirmPayment(choferId, this.selectedMonth(), this.selectedYear(), data)
      .pipe(catchError(() => of(void 0)))
      .subscribe(() => {
        // Recargar liquidación
        this.loadLiquidation();
        this.paymentModalOpen.set(false);
        this.selectedDriver.set(null);
        this.pendingPaymentChoferId.set(null);
      });
  }

  onPaymentCancel(): void {
    this.paymentModalOpen.set(false);
    this.selectedDriver.set(null);
    this.pendingPaymentChoferId.set(null);
  }

  onMissingAmountChange(event: { choferId: number; monto: number }): void {
    const liquidation = this.liquidation();
    if (!liquidation) return;

    const chofer = liquidation.choferes.find(c => c.chofer_id === event.choferId);
    if (chofer) {
      chofer.monto_a_completar = event.monto;
      const minGuaranteed = chofer.minimo_garantizado;
      const totalEarned = chofer.total_ganado;
      
      if (totalEarned >= minGuaranteed) {
        chofer.pago_final = totalEarned;
      } else {
        chofer.pago_final = totalEarned + event.monto;
      }
      
      this.liquidationData.set({ ...liquidation });
    }
  }

  onSaveDraft(): void {
    // Guardar borrador (en producción se enviaría al backend)
    alert('Borrador de liquidaciones guardado. (simulado)');
  }

  onClosePeriod(): void {
    this.accountingService.closePeriod(this.selectedMonth(), this.selectedYear())
      .pipe(catchError(() => of(void 0)))
      .subscribe(() => {
        // Recargar liquidación
        this.loadLiquidation();
        alert('Período cerrado y finalizado exitosamente.');
      });
  }
}
