import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../models/dashboard.models';

@Component({
  selector: 'app-alert-list',
  imports: [RouterLink],
  template: `
    <div class="card bg-white shadow-xl border border-zinc-200 flex flex-col overflow-hidden rounded-3xl h-[424px] animate-scale-up">
      <div class="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20 sticky top-0">
        <div class="flex items-center gap-3">
          <div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-inset ring-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
              <path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clip-rule="evenodd" />
            </svg>
            <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
            </span>
          </div>

          <div class="flex flex-col">
            <h2 class="text-sm font-bold text-zinc-900 leading-none">Centro de Alertas</h2>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] font-medium text-zinc-500">
                @if (latestActiveDate()) {
                  Última: {{ formatRelativeTime(latestActiveDate()!) }}
                } @else {
                  Sin nuevas
                }
              </span>
              <span class="h-0.5 w-0.5 rounded-full bg-zinc-300"></span>
              <span class="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                {{ activeAlerts().length }} Activas
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button
            class="btn btn-square btn-ghost btn-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 tooltip tooltip-left"
            data-tip="Marcar todo leído"
            type="button"
            (click)="onDeleteAllAlerts()"
            aria-label="Marcar todas las alertas como leídas">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <button class="btn btn-square btn-ghost btn-xs text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide bg-white p-2 space-y-1 min-h-0">
        @if (activeAlerts().length === 0) {
          <div class="flex flex-col gap-4 p-6 animate-fade-in rounded-2xl border border-zinc-100 bg-white/80 backdrop-blur-md text-left shadow-[0_20px_50px_-28px_rgba(0,0,0,0.25)]">
            <div class="flex items-center gap-3">
              <div class="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center ring-1 ring-inset ring-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <div class="text-base font-semibold text-zinc-900">Todo al día</div>
                <p class="text-sm text-zinc-500">Seguimos monitoreando. Te avisamos ante cualquier novedad.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-zinc-400">
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                En tiempo real
              </span>
              <span>Última actualización: {{ formatRelativeTime(lastUpdated) }}</span>
            </div>
          </div>
        } @else {
          @for (group of groupedAlerts(); track group.key) {
            <div class="bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-lg shadow-sm {{ group.index > 0 ? 'mt-3' : '' }} {{ group.index === 0 ? 'mb-2' : 'mb-2' }}">
              <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{{ group.label }}</span>
            </div>

            @for (alert of group.alerts; track alert.id) {
              <div class="group relative bg-white rounded-xl border border-transparent hover:border-zinc-200 hover:shadow-sm transition-all duration-300 overflow-hidden">
                <div
                  class="absolute left-0 top-0 bottom-0 w-1 rounded-r-full group-hover:w-1.5 transition-all duration-300"
                  [class.bg-red-500]="alert.severity === 'critical'"
                  [class.bg-amber-400]="alert.severity === 'warning'"
                  [class.bg-blue-400]="alert.severity === 'info'"
                  [class.bg-emerald-500]="alert.severity === 'success'">
                </div>

                <div class="p-3 pl-4">
                  <div class="flex gap-3 items-start">
                    <div
                      class="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ring-1 ring-inset"
                      [class.bg-red-50]="alert.severity === 'critical'"
                      [class.text-red-500]="alert.severity === 'critical'"
                      [class.ring-red-100/50]="alert.severity === 'critical'"
                      [class.bg-amber-50]="alert.severity === 'warning'"
                      [class.text-amber-600]="alert.severity === 'warning'"
                      [class.ring-amber-100/50]="alert.severity === 'warning'"
                      [class.bg-blue-50]="alert.severity === 'info'"
                      [class.text-blue-500]="alert.severity === 'info'"
                      [class.ring-blue-100/50]="alert.severity === 'info'"
                      [class.bg-emerald-50]="alert.severity === 'success'"
                      [class.text-emerald-600]="alert.severity === 'success'"
                      [class.ring-emerald-100/50]="alert.severity === 'success'">
                      @if (alert.severity === 'critical') {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                      } @else if (alert.severity === 'warning') {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                      } @else if (alert.severity === 'info') {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                      }
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center mb-0.5">
                        <h3 class="text-xs font-bold text-zinc-900 truncate" [attr.title]="alert.title">
                          {{ alert.title }}
                        </h3>
                        @if (alert.date) {
                          <span class="text-[10px] font-medium text-zinc-400 whitespace-nowrap bg-zinc-50 px-1.5 rounded">{{ formatRelativeTime(alert.date) }}</span>
                        }
                      </div>
                      <p class="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                        @if (alert.machineId) {
                          <span class="font-semibold text-zinc-700">Máquina {{ alert.machineId }}</span>
                        }
                        @if (alert.machineId && alert.driverName) {
                          <span class="text-zinc-400"> • </span>
                        }
                        @if (alert.driverName) {
                          <span class="text-zinc-600">{{ alert.driverName }}</span>
                        }
                        @if ((alert.machineId || alert.driverName) && alert.description) {
                          <span class="text-zinc-400"> • </span>
                        }
                        @if (alert.description) {
                          <span>{{ alert.description }}</span>
                        }
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                    <div class="overflow-hidden">
                      <div class="pt-3 pl-11 flex items-center gap-2">
                        <a
                          [routerLink]="alert.actionHref"
                          class="btn btn-xs h-7 min-h-0 font-medium border-none shadow-sm flex-1"
                          [class.btn-error]="alert.severity === 'critical'"
                          [class.btn-warning]="alert.severity === 'warning'"
                          [class.btn-ghost]="alert.severity === 'info'"
                          [class.bg-blue-50]="alert.severity === 'info'"
                          [class.text-blue-600]="alert.severity === 'info'"
                          [class.hover:bg-blue-100]="alert.severity === 'info'"
                          [class.btn-success]="alert.severity === 'success'">
                          {{ alert.actionLabel }}
                        </a>
                        <button
                          class="btn btn-xs btn-square btn-ghost text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                          type="button"
                          (click)="onDeleteAlert(alert.id)"
                          aria-label="Eliminar alerta">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Scrollbar personalizado */
    :host ::ng-deep .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: hsl(var(--bc) / 0.2) transparent;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: hsl(var(--bc) / 0.2);
      border-radius: 3px;
    }
    
    :host ::ng-deep .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: hsl(var(--bc) / 0.3);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertList {
  alerts = input.required<Alert[]>();
  isExpanded = input(false);
  lastUpdated = new Date().toISOString();
  
  // Outputs para eventos
  deleteAlert = output<string>();
  deleteAllAlerts = output<void>();

  // Filtrar alertas activas (no resueltas)
  activeAlerts = computed(() => {
    return this.alerts().filter(alert => !alert.resolved);
  });

  // Última alerta activa con fecha
  latestActiveDate = computed(() => {
    const dated = this.activeAlerts()
      .filter(a => a.date)
      .map(a => new Date(a.date as string).getTime());
    if (!dated.length) return null;
    return new Date(Math.max(...dated)).toISOString();
  });

  // Agrupar alertas por recencia (Hoy, Ayer, resto por fecha)
  groupedAlerts = computed(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const sortedAlerts = [...this.activeAlerts()].sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });

    const today: Alert[] = [];
    const yesterday: Alert[] = [];
    const olderByDay = new Map<string, { date: Date; alerts: Alert[] }>();

    for (const alert of sortedAlerts) {
      if (!alert.date) {
        const key = 'sin-fecha';
        if (!olderByDay.has(key)) olderByDay.set(key, { date: new Date(0), alerts: [] });
        olderByDay.get(key)!.alerts.push(alert);
        continue;
      }

      const alertDate = new Date(alert.date);
      if (alertDate >= startOfToday) {
        today.push(alert);
        continue;
      }

      if (alertDate >= startOfYesterday) {
        yesterday.push(alert);
        continue;
      }

      const dateKey = this.getDateKey(alertDate);
      if (!olderByDay.has(dateKey)) {
        olderByDay.set(dateKey, { date: alertDate, alerts: [] });
      }
      olderByDay.get(dateKey)!.alerts.push(alert);
    }

    const groups: { key: string; label: string; alerts: Alert[]; index: number }[] = [];
    let index = 0;

    if (today.length) {
      groups.push({ key: 'today', label: this.formatGroupLabel(startOfToday, 'Hoy'), alerts: today, index });
      index += 1;
    }

    if (yesterday.length) {
      groups.push({ key: 'yesterday', label: this.formatGroupLabel(startOfYesterday, 'Ayer'), alerts: yesterday, index });
      index += 1;
    }

    const orderedOlder = Array.from(olderByDay.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    for (const entry of orderedOlder) {
      const label = entry.date.getTime() === 0 ? 'Sin fecha' : this.formatGroupLabel(entry.date);
      groups.push({ key: `day-${label}`, label, alerts: entry.alerts, index });
      index += 1;
    }

    return groups;
  });

  onDeleteAlert(alertId: string): void {
    this.deleteAlert.emit(alertId);
  }

  onDeleteAllAlerts(): void {
    this.deleteAllAlerts.emit();
  }

  formatRelativeTime(date: string): string {
    try {
      const alertDate = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - alertDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Ahora';
      } else if (diffMins < 60) {
        return `Hace ${diffMins}m`;
      } else if (diffHours < 24) {
        return `Hace ${diffHours}h`;
      } else if (diffDays === 1) {
        return 'Ayer';
      } else if (diffDays < 7) {
        return `Hace ${diffDays}d`;
      }

      return alertDate.toLocaleDateString('es-CL', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private formatGroupLabel(date: Date, fallback?: string): string {
    if (fallback) {
      const formatted = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
      return `${fallback}, ${formatted}`;
    }

    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
