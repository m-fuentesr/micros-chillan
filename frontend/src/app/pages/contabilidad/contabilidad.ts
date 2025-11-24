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
        <h1 class="text-4xl font-bold mb-2 tracking-tight text-base-content">Contabilidad</h1>
        <p class="text-base-content/60 font-medium">Gestión financiera y nómina de conductores.</p>
      </div>

      <!-- Barra de Comandos: Tabs + Filtros Globales -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-base-200 pb-6 mb-6">
        <!-- Segmented Control (Tabs) - Edge-to-edge en móvil -->
        <div class="w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          <div class="inline-flex bg-base-200/50 p-1 rounded-xl gap-1 min-w-full lg:min-w-0">
            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap"
              [class.bg-white]="activeTab() === 'summary'"
              [class.shadow-sm]="activeTab() === 'summary'"
              [class.text-primary]="activeTab() === 'summary'"
              [class.text-base-content/60]="activeTab() !== 'summary'"
              [class.hover:bg-base-200]="activeTab() !== 'summary'"
              [class.bg-transparent]="activeTab() !== 'summary'"
              (click)="setActiveTab('summary')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              <span class="text-xs lg:text-sm">Resumen</span>
            </button>

            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap"
              [class.bg-white]="activeTab() === 'weekly'"
              [class.shadow-sm]="activeTab() === 'weekly'"
              [class.text-primary]="activeTab() === 'weekly'"
              [class.text-base-content/60]="activeTab() !== 'weekly'"
              [class.hover:bg-base-200]="activeTab() !== 'weekly'"
              [class.bg-transparent]="activeTab() !== 'weekly'"
              (click)="setActiveTab('weekly')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span class="text-xs lg:text-sm">Semanal</span>
            </button>

            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap"
              [class.bg-white]="activeTab() === 'payroll'"
              [class.shadow-sm]="activeTab() === 'payroll'"
              [class.text-primary]="activeTab() === 'payroll'"
              [class.text-base-content/60]="activeTab() !== 'payroll'"
              [class.hover:bg-base-200]="activeTab() !== 'payroll'"
              [class.bg-transparent]="activeTab() !== 'payroll'"
              (click)="setActiveTab('payroll')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
              <span class="text-xs lg:text-sm">Liquidación</span>
            </button>

            <button
              class="btn btn-sm h-9 px-3 lg:px-4 rounded-lg border-none transition-all font-medium gap-2 flex-nowrap whitespace-nowrap"
              [class.bg-white]="activeTab() === 'history'"
              [class.shadow-sm]="activeTab() === 'history'"
              [class.text-primary]="activeTab() === 'history'"
              [class.text-base-content/60]="activeTab() !== 'history'"
              [class.hover:bg-base-200]="activeTab() !== 'history'"
              [class.bg-transparent]="activeTab() !== 'history'"
              (click)="setActiveTab('history')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span class="text-xs lg:text-sm">Historial Liquidaciones</span>
            </button>
          </div>
        </div>

        <!-- Filtros Globales (solo para Resumen General y Resumen Semanal) -->
        @if (activeTab() === 'summary' || activeTab() === 'weekly') {
          <div class="grid grid-cols-[2fr_1fr_auto] lg:flex lg:items-center gap-2 w-full lg:w-auto bg-white p-1.5 rounded-xl border border-base-200 shadow-sm">
            <div class="relative w-full">
              <select 
                class="appearance-none w-full bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none truncate" 
                [value]="selectedMonth()" 
                (change)="onMonthChange($event)">
                @for (month of months(); track month.value) {
                  <option [value]="month.value">{{ month.label }}</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>

            <div class="w-px h-4 bg-base-200 hidden lg:block"></div>

            <div class="relative w-full">
              <select 
                class="appearance-none w-full bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-base-content hover:bg-base-50 rounded-lg cursor-pointer focus:outline-none" 
                [value]="selectedYear()" 
                (change)="onYearChange($event)">
                @for (year of years(); track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-base-content/50">
                <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>

            <button class="btn btn-square btn-sm btn-ghost text-primary shrink-0" (click)="applyFilters()" title="Actualizar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        }
      </div>

      <!-- Contenido de Tabs -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <!-- Tab: Resumen General -->
          @if (activeTab() === 'summary') {
            <div class="space-y-8">
              <!-- KPIs: Contenedor independiente -->
              @if (summary()) {
                <app-accounting-kpis [summary]="summary()!" />
              }

              <!-- Separador Visual y Gráfico: Contexto independiente -->
              @if (dailyData().length > 0) {
                <div class="divider text-base-content/30 text-xs uppercase tracking-widest my-8">Análisis de Tendencia</div>
                <app-accounting-chart [dailyData]="dailyData()" />
              }
            </div>
          }

          <!-- Tab: Resumen Semanal -->
          @if (activeTab() === 'weekly') {
            @if (weeklySummaries().length > 0) {
              <app-weekly-summary-table [summaries]="weeklySummaries()" />
            }
          }

          <!-- Tab: Liquidación de Choferes -->
          @if (activeTab() === 'payroll') {
            @if (liquidation()) {
              <app-liquidation-table
                [liquidation]="liquidation()!"
                (confirmPayment)="onConfirmPayment($event)"
                (missingAmountChange)="onMissingAmountChange($event)"
                (closePeriod)="onClosePeriod()" />
            }
          }

          <!-- Tab: Historial de Liquidaciones -->
          @if (activeTab() === 'history') {
            @if (liquidationHistory().length > 0) {
              <app-liquidation-history [liquidations]="liquidationHistory()" />
            }
          }
        </div>
      </div>

      <!-- Modal de Confirmación de Pago -->
      <app-payment-modal
        [isOpen]="paymentModalOpen()"
        [driver]="selectedDriver()"
        (confirm)="onPaymentConfirm($event)"
        (cancel)="onPaymentCancel()" />
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
  `],
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
