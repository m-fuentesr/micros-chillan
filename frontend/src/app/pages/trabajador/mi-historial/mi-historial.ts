import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { WorkerService } from '../../../shared/services/worker.service';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { AnimatedCounterDirective } from '../../../shared/directives/animated-counter.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, forkJoin, tap } from 'rxjs';
import type { DailyRecordHistoryResponse } from '../../../shared/models/daily-record.models';

interface HistoryItem {
  date: string;
  revenue: number;
  dieselLiters: number;
  dieselCost: number;
  status: 'pending' | 'processed';
  observations?: string;
  machine: string;
  incidenteCritico: boolean;
}

interface WeekGroup {
  title: string;
  total: number;
  items: HistoryItem[];
}

@Component({
  selector: 'app-mi-historial',
  standalone: true,
  imports: [CommonModule, LoadingSkeleton, AnimatedCounterDirective],
  template: `
    <main class="historial-background-enter mobile-content pb-24">
      @if (loadingState.showSkeleton() && isLoading()) {
        <div class="card bg-slate-200 shadow-lg mb-4">
          <div class="card-body p-4">
            <div class="flex justify-between items-center">
              <div class="space-y-2">
                <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                <div class="h-6 w-32 skeleton-shimmer rounded"></div>
              </div>
              <div class="space-y-2 text-right">
                <div class="h-3 w-20 skeleton-shimmer rounded ml-auto"></div>
                <div class="h-6 w-24 skeleton-shimmer rounded ml-auto"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-base-100 rounded-xl shadow border border-base-200 overflow-hidden mb-4">
          <div class="flex gap-2 px-4 pt-4 pb-2">
            <div class="h-8 w-24 skeleton-shimmer rounded-full"></div>
            <div class="h-8 w-24 skeleton-shimmer rounded-full"></div>
            <div class="h-8 w-28 skeleton-shimmer rounded-full"></div>
          </div>
          <app-loading-skeleton type="list" [count]="5" />
          @if (loadingState.showFeedback()) {
            <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p class="text-sm text-blue-700">{{ loadingState.feedbackMessage() }}</p>
            </div>
          }
        </div>
      } @else {
      <header class="historial-header-enter card bg-primary text-primary-content shadow-lg mb-4">
        <div class="card-body p-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-xs uppercase tracking-widest opacity-80">Resumen general</p>
              <h1 class="text-2xl font-bold">Mi Historial</h1>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold tabular-nums" [appAnimatedCounter]="totalRevenue()" [duration]="1500" format="currency" currencyCode="CLP" currencyDisplay="symbol-narrow" [minFractionDigits]="0" [maxFractionDigits]="0"></p>
            </div>
          </div>
        </div>
      </header>

      <section class="historial-content-enter bg-base-100 rounded-xl shadow border border-base-200 overflow-hidden mb-4">
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
            @for (week of weekGroups(); track week.title; let weekIndex = $index) {
              <div class="week-group">
                <div class="week-header historial-week-header-enter" [style.animation-delay.ms]="200 + (weekIndex * 50)">
                  <span class="week-header__title font-bold text-sm">{{ week.title }}</span>
                  <span class="week-header__summary font-bold text-success tabular-nums">{{ week.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>

                @for (item of week.items; track item.date; let itemIndex = $index) {
                  <a class="history-item historial-item-enter" [class.has-incident]="item.incidenteCritico" [style.animation-delay.ms]="300 + (weekIndex * 50) + (itemIndex * 30)">
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
                      @if (item.incidenteCritico) {
                        <div class="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">
                          🚨 Incidente Crítico
                        </div>
                      }
                    </div>

                    <div class="history-item__financials">
                      <span class="history-item__revenue-value">+{{ item.revenue | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
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
      }
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


    .history-item.has-incident {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }

    .history-item.has-incident .history-item__date-block {
      border-color: #fca5a5;
      background-color: #fee2e2;
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

    /* ============================================
       ANIMACIONES DE ENTRADA ELEGANTES - HISTORIAL
       Transición slide desde la derecha (profundidad/hijo)
       ============================================ */
    
    /* Fondo: Fade-in suave */
    .historial-background-enter {
      animation: historialBackgroundEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      will-change: opacity;
    }
    
    @keyframes historialBackgroundEnter {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    
    /* Header: Slide desde la derecha con fade (más pronunciado que perfil) */
    .historial-header-enter {
      animation: historialHeaderEnter 700ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateX(50px);
      will-change: opacity, transform;
    }
    
    @keyframes historialHeaderEnter {
      0% {
        opacity: 0;
        transform: translateX(50px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Contenido principal: Slide desde la derecha con delay */
    .historial-content-enter {
      animation: historialContentEnter 700ms cubic-bezier(0.22, 0.61, 0.36, 1) 150ms forwards;
      opacity: 0;
      transform: translateX(50px);
      will-change: opacity, transform;
    }
    
    @keyframes historialContentEnter {
      0% {
        opacity: 0;
        transform: translateX(50px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Headers de semana: Fade-up con stagger */
    .historial-week-header-enter {
      animation: historialWeekHeaderEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateY(15px);
      will-change: opacity, transform;
    }
    
    @keyframes historialWeekHeaderEnter {
      0% {
        opacity: 0;
        transform: translateY(15px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Items de historial: Slide desde la derecha con stagger individual */
    .historial-item-enter {
      animation: historialItemEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateX(30px);
      will-change: opacity, transform;
    }
    
    @keyframes historialItemEnter {
      0% {
        opacity: 0;
        transform: translateX(30px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .historial-background-enter,
      .historial-header-enter,
      .historial-content-enter,
      .historial-week-header-enter,
      .historial-item-enter {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiHistorial implements OnInit {
  private dailyRecordService = inject(DailyRecordService);
  private workerService = inject(WorkerService);
  private loadingStateService = inject(LoadingStateService);

  selectedPeriod = signal<'week' | 'month' | 'previous'>('week');
  isLoading = signal(true);
  loadingState = this.loadingStateService.createLoadingState();
  
  // Obtener perfil del trabajador para mostrar la máquina asignada
  private workerProfile = toSignal(
    this.workerService.getProfile().pipe(
      catchError(() => of({
        nombre_completo: 'Trabajador',
        rut: '',
        telefono: '',
        email: '',
        maquina_detalle: null,
        fecha_ingreso: '--/--/----'
      }))
    ),
    { initialValue: null }
  );
  
  // Computed: Máquina asignada
  assignedMachine = computed(() => {
    const profile = this.workerProfile();
    return profile?.maquina_detalle || 'Sin asignar';
  });
  
  // Flag para trackear cuando el observable emite
  private historyEmitted = signal(false);

  // Mapear el período seleccionado al valor del backend
  private getRangoForBackend(period: 'week' | 'month' | 'previous'): string {
    switch (period) {
      case 'week':
        return 'esta_semana';
      case 'month':
        return 'este_mes';
      case 'previous':
        return 'mes_anterior';
      default:
        return 'este_mes';
    }
  }

  // Cargar todos los rangos de una vez usando forkJoin (optimización)
  private allHistoryData = toSignal(
    forkJoin({
      week: this.dailyRecordService.getMyHistory('esta_semana').pipe(
        catchError(() => of([]))
      ),
      month: this.dailyRecordService.getMyHistory('este_mes').pipe(
        catchError(() => of([]))
      ),
      previous: this.dailyRecordService.getMyHistory('mes_anterior').pipe(
        catchError(() => of([]))
      )
    }).pipe(
      tap(() => {
        // Cuando el observable emite (éxito), marcar que emitió
        this.historyEmitted.set(true);
      }),
      catchError(() => {
        // También marcar como emitido en caso de error
        this.historyEmitted.set(true);
        return of({ week: [], month: [], previous: [] });
      })
    ),
    { initialValue: { week: [], month: [], previous: [] } }
  );

  // Effect como inicializador de campo (contexto de inyección válido)
  private historyEffect = effect(() => {
    // Monitorear cuando el observable emite
    if (this.historyEmitted() && this.loadingState.isLoading()) {
      this.isLoading.set(false);
      this.loadingState.setDataLoaded();
    }
  });

  // Filtrar datos según el período seleccionado (filtrado local)
  private historyData = computed((): DailyRecordHistoryResponse[] => {
    const period = this.selectedPeriod();
    const allData = this.allHistoryData();
    
    switch (period) {
      case 'week':
        return allData.week || [];
      case 'month':
        return allData.month || [];
      case 'previous':
        return allData.previous || [];
      default:
        return allData.month || [];
    }
  });

  // Mapear DailyRecordHistoryResponse a HistoryItem (solo para el período seleccionado)
  private allData = computed((): HistoryItem[] => {
    const records = this.historyData();
    return records.map((record) => this.mapToHistoryItem(record));
  });

  // Todos los datos sin filtrar por período (para calcular conteos)
  private allUnfilteredData = computed((): HistoryItem[] => {
    const allData = this.allHistoryData();
    const allRecords: DailyRecordHistoryResponse[] = [
      ...(allData.week || []),
      ...(allData.month || []),
      ...(allData.previous || [])
    ];
    // Eliminar duplicados por fecha (puede haber solapamiento entre rangos)
    const uniqueRecords = new Map<string, DailyRecordHistoryResponse>();
    allRecords.forEach(record => {
      if (!uniqueRecords.has(record.fecha)) {
        uniqueRecords.set(record.fecha, record);
      }
    });
    return Array.from(uniqueRecords.values()).map((record) => this.mapToHistoryItem(record));
  });

  private mapToHistoryItem(record: DailyRecordHistoryResponse): HistoryItem {
    // Todos los registros se muestran como procesados (es solo historial, no hay validaciones)
    const status: 'pending' | 'processed' = 'processed';

    // Construir nombre de máquina desde el objeto anidado
    // El backend devuelve 'maquinas' (plural) como objeto anidado
    // Puede ser un objeto único o un array (Supabase puede devolver arrays en relaciones)
    let maquinaData = (record as any).maquinas || record.maquina;
    
    // Si es un array, tomar el primer elemento
    if (Array.isArray(maquinaData)) {
      maquinaData = maquinaData.length > 0 ? maquinaData[0] : null;
    }
    
    // Construir el nombre de la máquina
    const machineName = maquinaData && maquinaData.numero_interno && maquinaData.marca
      ? `${maquinaData.numero_interno} - ${maquinaData.marca}`
      : 'Sin máquina';

    return {
      date: record.fecha,
      revenue: record.monto_recaudado || 0,
      dieselLiters: record.litros_diesel || 0,
      dieselCost: record.costo_total_diesel || 0,
      status,
      observations: record.observaciones || undefined,
      machine: machineName,
      incidenteCritico: record.incidente_critico || false
    };
  }

  ngOnInit(): void {
    // Iniciar estado de carga
    this.loadingState.setLoading(true);
    this.isLoading.set(true);
  }

  // Los datos ya vienen filtrados del backend según el rango
  filteredData = computed(() => {
    return this.allData();
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

  // Helper para formatear conteos con "99+" si es mayor a 99
  private formatCount(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  weekCount = computed(() => {
    // Siempre calcular desde todos los datos sin filtrar
    const data = this.allUnfilteredData();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const count = data.filter((item: HistoryItem) => {
      const itemDate = new Date(item.date);
      return itemDate >= weekAgo;
    }).length;
    return this.formatCount(count);
  });

  monthCount = computed(() => {
    // Siempre calcular desde todos los datos sin filtrar
    const data = this.allUnfilteredData();
    const today = new Date();
    const count = data.filter((item: HistoryItem) => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === today.getMonth() && 
             itemDate.getFullYear() === today.getFullYear();
    }).length;
    return this.formatCount(count);
  });

  previousCount = computed(() => {
    // Siempre calcular desde todos los datos sin filtrar
    const data = this.allUnfilteredData();
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const count = data.filter((item: HistoryItem) => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === lastMonth.getMonth() && 
             itemDate.getFullYear() === lastMonth.getFullYear();
    }).length;
    return this.formatCount(count);
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
