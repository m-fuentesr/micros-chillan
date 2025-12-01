import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { AuthService } from '../../../shared/services/auth.service';
import { DriverService } from '../../../shared/services/driver.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import type { DailyRecord } from '../../../shared/models/daily-record.models';

interface HistoryItem {
  date: string;
  revenue: number;
  dieselLiters: number;
  dieselCost: number;
  status: 'pending' | 'processed';
  observations?: string;
  machine: string;
}

interface WeekGroup {
  title: string;
  total: number;
  items: HistoryItem[];
}

@Component({
  selector: 'app-mi-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="mobile-content pb-24">
      <header class="card bg-primary text-primary-content shadow-lg mb-4">
        <div class="card-body p-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-xs uppercase tracking-widest opacity-80">Resumen general</p>
              <h1 class="text-2xl font-bold">Mi Historial</h1>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-80">Máquina 05</p>
              <p class="text-xl font-bold tabular-nums">{{ totalRevenue() | currency:'CLP':'symbol-narrow':'1.0-0' }}</p>
            </div>
          </div>
        </div>
      </header>

      <section class="bg-base-100 rounded-xl shadow border border-base-200 overflow-hidden mb-4">
        <div class="tabs bg-transparent p-0 mb-2 gap-2 px-4 pt-4 flex">
          <button 
            class="text-xs font-bold transition-all rounded-full px-4 py-2"
            [class.bg-white]="selectedPeriod() === 'week'"
            [class.shadow-sm]="selectedPeriod() === 'week'"
            [class.border]="selectedPeriod() === 'week'"
            [class.border-base-200]="selectedPeriod() === 'week'"
            [class.text-primary]="selectedPeriod() === 'week'"
            [class.text-base-content]="selectedPeriod() !== 'week'"
            [class.text-base-content/60]="selectedPeriod() !== 'week'"
            [class.hover:bg-base-200/50]="selectedPeriod() !== 'week'"
            (click)="selectedPeriod.set('week')">
            Esta Semana ({{ weekCount() }})
          </button>
          <button 
            class="text-xs transition-all rounded-full px-4 py-2"
            [class.bg-white]="selectedPeriod() === 'month'"
            [class.shadow-sm]="selectedPeriod() === 'month'"
            [class.border]="selectedPeriod() === 'month'"
            [class.border-base-200]="selectedPeriod() === 'month'"
            [class.text-primary]="selectedPeriod() === 'month'"
            [class.text-base-content]="selectedPeriod() !== 'month'"
            [class.text-base-content/60]="selectedPeriod() !== 'month'"
            [class.hover:bg-base-200/50]="selectedPeriod() !== 'month'"
            (click)="selectedPeriod.set('month')">
            Este Mes ({{ monthCount() }})
          </button>
          <button 
            class="text-xs transition-all rounded-full px-4 py-2"
            [class.bg-white]="selectedPeriod() === 'previous'"
            [class.shadow-sm]="selectedPeriod() === 'previous'"
            [class.border]="selectedPeriod() === 'previous'"
            [class.border-base-200]="selectedPeriod() === 'previous'"
            [class.text-primary]="selectedPeriod() === 'previous'"
            [class.text-base-content]="selectedPeriod() !== 'previous'"
            [class.text-base-content/60]="selectedPeriod() !== 'previous'"
            [class.hover:bg-base-200/50]="selectedPeriod() !== 'previous'"
            (click)="selectedPeriod.set('previous')">
            Mes Anterior ({{ previousCount() }})
          </button>
        </div>

        @if (filteredData().length === 0) {
          <div class="p-8 text-left pl-4 border-l-4 border-l-primary">
            <p class="text-base-content/60 italic">No hay reportes en este período</p>
          </div>
        } @else {
          <div class="history-container">
            @for (week of weekGroups(); track week.title) {
              <div class="week-group">
                <div class="week-header">
                  <span class="week-header__title font-bold text-sm">{{ week.title }}</span>
                  <span class="week-header__summary font-bold text-success tabular-nums">{{ week.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>

                @for (item of week.items; track item.date) {
                  <a class="history-item" [class.is-pending]="item.status === 'pending'">
                    <div class="history-item__date-block">
                      <span class="history-item__weekday">{{ getWeekDay(item.date) }}</span>
                      <span class="history-item__day">{{ getDay(item.date) }}</span>
                    </div>

                    <div class="history-item__details">
                      <span class="history-item__machine">{{ item.machine }}</span>
                      @if (item.dieselLiters > 0) {
                        <div class="history-item__diesel-badge text-error/80">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                          </svg>
                          <span class="font-normal">-{{ item.dieselCost | currency:'CLP':'symbol-narrow':'1.0-0' }} ({{ item.dieselLiters }}L)</span>
                        </div>
                      }
                      <div class="text-[11px] font-bold" [class.text-warning]="item.status === 'pending'" [class.text-success]="item.status === 'processed'">
                        @if (item.status === 'pending') {
                          ⚠️ Validación Pendiente
                        } @else {
                          ✓ Procesado
                        }
                      </div>
                    </div>

                    <div class="history-item__financials">
                      <span class="history-item__revenue-value">+{{ item.revenue | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                      <div class="history-item__status-dot" [class.pending]="item.status === 'pending'" [class.processed]="item.status === 'processed'"></div>
                    </div>

                    @if (item.observations) {
                      <div class="history-item__alert">
                        <span>💬</span>
                        <span>{{ item.observations }}</span>
                      </div>
                    }
                  </a>
                }
              </div>
            }
          </div>
        }
      </section>
    </main>
  `,
  styles: [`
    .week-group {
      margin-bottom: 0;
    }

    .week-header {
      position: sticky;
      top: 0;
      z-index: 20;
      margin: 0;
      border-radius: 0;
      background-color: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
    }

    .week-header__title {
      color: #1e293b;
    }

    .week-header__summary {
      color: #10b981;
    }

    .history-item {
      border-radius: 0;
      margin-bottom: 0;
      border-bottom: 1px solid #f3f4f6;
      box-shadow: none;
      padding: 16px;
      display: grid;
      grid-template-columns: 50px 1fr auto;
      gap: 16px;
      align-items: center;
      transition: background-color 0.2s;
    }

    .history-item:hover {
      background-color: #f8fafc;
    }

    .history-item:last-child {
      border-bottom: none;
    }

    .history-item.is-pending {
      background-color: #fffbf2;
      border-left: 4px solid #f59e0b;
    }

    .history-item.is-pending .history-item__date-block {
      border-color: #fcd34d;
      background-color: #fffbeb;
    }

    .history-item__date-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      border-radius: 8px;
      width: 50px;
      height: 50px;
      border: 1px solid #e2e8f0;
    }

    .history-item__weekday {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 2px;
    }

    .history-item__day {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      line-height: 1;
    }

    .history-item__details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .history-item__machine {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .history-item__diesel-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }

    .history-item__financials {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .history-item__revenue-value {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
      letter-spacing: -0.5px;
    }

    .history-item__status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #e5e7eb;
    }

    .history-item__status-dot.pending {
      background-color: #f59e0b;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }

    .history-item__status-dot.processed {
      background-color: #10b981;
    }

    .history-item__alert {
      grid-column: 2 / -1;
      background-color: #fffbeb;
      color: #b45309;
      font-size: 12px;
      padding: 8px;
      border-radius: 6px;
      margin-top: 4px;
      display: flex;
      gap: 6px;
      align-items: start;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiHistorial implements OnInit {
  private dailyRecordService = inject(DailyRecordService);
  private authService = inject(AuthService);
  private driverService = inject(DriverService);

  selectedPeriod = signal<'week' | 'month' | 'previous'>('week');
  isLoading = signal(true);

  // Obtener registros del trabajador actual
  private dailyRecordsResponse = toSignal(
    this.dailyRecordService.getDailyRecords().pipe(
      catchError(() => of({ datos: [], total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 }))
    ),
    { initialValue: { datos: [], total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 } }
  );

  // Mapear DailyRecord a HistoryItem
  private allData = computed((): HistoryItem[] => {
    const response = this.dailyRecordsResponse();
    const records = response.datos || [];
    const currentUser = this.authService.currentUser();
    
    if (!currentUser) {
      return [];
    }

    // Filtrar registros del chofer actual (por ahora usar chofer_id = 1 como mock)
    // TODO: Obtener chofer_id real desde el backend basado en currentUser.id
    const choferId = 1; // Mock
    
    return records
      .filter((record) => record.chofer_id === choferId)
      .map((record) => this.mapToHistoryItem(record));
  });

  private mapToHistoryItem(record: DailyRecord): HistoryItem {
    // Mapear estado: 'PENDIENTE_TRABAJADOR' o 'INCIDENTE_REPORTADO' -> 'pending', 'COMPLETO' -> 'processed'
    const status: 'pending' | 'processed' = 
      (record.estado === 'PENDIENTE_TRABAJADOR' || record.estado === 'INCIDENTE_REPORTADO') 
        ? 'pending' 
        : 'processed';

    return {
      date: record.fecha,
      revenue: record.recaudado || 0,
      dieselLiters: record.litros_diesel || 0,
      dieselCost: record.costo_diesel || 0,
      status,
      observations: record.observaciones || undefined,
      machine: record.maquina_identificador || `Máquina ${record.maquina_id}`
    };
  }

  ngOnInit(): void {
    // Los datos se cargan automáticamente a través de toSignal
    this.isLoading.set(false);
  }

  filteredData = computed(() => {
    const data = this.allData();
    const period = this.selectedPeriod();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter((item: HistoryItem) => {
      const itemDate = new Date(item.date);
      
      if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      } else if (period === 'month') {
        return itemDate.getMonth() === today.getMonth() && 
               itemDate.getFullYear() === today.getFullYear();
      } else {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return itemDate.getMonth() === lastMonth.getMonth() && 
               itemDate.getFullYear() === lastMonth.getFullYear();
      }
    });
  });

  weekGroups = computed(() => {
    const data = this.filteredData();
    const groups: WeekGroup[] = [];
    const weekMap = new Map<string, HistoryItem[]>();

    data.forEach((item: HistoryItem) => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      
      const weekKey = `Semana ${this.getWeekNumber(weekStart)} - ${this.getMonthName(weekStart)}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(item);
    });

    weekMap.forEach((items, title) => {
      const total = items.reduce((sum, item) => sum + item.revenue, 0);
      groups.push({ title, total, items: items.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ) });
    });

    return groups.sort((a, b) => {
      const dateA = new Date(a.items[0].date);
      const dateB = new Date(b.items[0].date);
      return dateB.getTime() - dateA.getTime();
    });
  });

  totalRevenue = computed(() => {
    return this.filteredData().reduce((sum: number, item: HistoryItem) => sum + item.revenue, 0);
  });

  weekCount = computed(() => this.filteredData().length);
  monthCount = computed(() => {
    const data = this.allData();
    const today = new Date();
    return data.filter((item: HistoryItem) => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === today.getMonth() && 
             itemDate.getFullYear() === today.getFullYear();
    }).length;
  });
  previousCount = computed(() => {
    const data = this.allData();
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return data.filter((item: HistoryItem) => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === lastMonth.getMonth() && 
             itemDate.getFullYear() === lastMonth.getFullYear();
    }).length;
  });

  getWeekDay(date: string): string {
    const d = new Date(date);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[d.getDay()];
  }

  getDay(date: string): string {
    return date.split('-')[2];
  }

  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  getMonthName(date: Date): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[date.getMonth()];
  }
}
