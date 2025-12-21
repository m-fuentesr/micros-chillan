import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../models/dashboard.models';
import { getTodayInChile, getYesterdayInChile, getDateInChileTime, getDaysDifferenceInChile } from '../../utils/date.utils';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-alert-list',
  imports: [RouterLink, UiIconComponent],
  template: `
    <div class="card bg-white shadow-xl border border-zinc-200 flex flex-col overflow-hidden rounded-3xl h-[424px] animate-scale-up">
      <div class="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20 sticky top-0">
        <div class="flex items-center gap-3">
          <div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-inset ring-red-100">
            <ui-icon name="Siren" size="md" />
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
            <ui-icon name="X" size="sm" />
          </button>
          <button class="btn btn-square btn-ghost btn-xs text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100" type="button">
            <ui-icon name="Settings" size="sm" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide bg-white p-2 space-y-1 min-h-0">
        @if (activeAlerts().length === 0) {
          <div class="flex flex-col gap-4 p-6 animate-fade-in rounded-3xl border border-zinc-100 bg-white/80 backdrop-blur-md text-left shadow-[0_20px_50px_-28px_rgba(0,0,0,0.25)]">
            <div class="flex items-center gap-3">
              <div class="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center ring-1 ring-inset ring-emerald-100">
                <ui-icon name="CheckCircle2" size="lg" />
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
              <div class="group relative bg-white rounded-3xl border border-transparent hover:border-zinc-200 hover:shadow-sm transition-all duration-300 overflow-hidden">
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
                        <ui-icon name="OctagonAlert" size="sm" />
                      } @else if (alert.severity === 'warning') {
                        <ui-icon name="TriangleAlert" size="sm" />
                      } @else if (alert.severity === 'info') {
                        <ui-icon name="Info" size="sm" />
                      } @else {
                        <ui-icon name="CheckCircle2" size="sm" />
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
                          <ui-icon name="X" size="xs" />
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
    // Usar fechas en zona horaria de Chile
    const todayParts = getTodayInChile();
    const yesterdayParts = getYesterdayInChile();
    const startOfToday = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));
    const startOfYesterday = new Date(Date.UTC(yesterdayParts.year, yesterdayParts.month - 1, yesterdayParts.day));

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

      // Convertir fecha de alerta a zona horaria de Chile para comparación
      const alertDateChile = getDateInChileTime(alert.date);
      
      // Comparar solo la parte de la fecha (sin hora)
      if (alertDateChile.getTime() === startOfToday.getTime()) {
        today.push(alert);
        continue;
      }

      if (alertDateChile.getTime() === startOfYesterday.getTime()) {
        yesterday.push(alert);
        continue;
      }

      const dateKey = this.getDateKey(alertDateChile);
      if (!olderByDay.has(dateKey)) {
        olderByDay.set(dateKey, { date: alertDateChile, alerts: [] });
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
      const alertDate = getDateInChileTime(date);
      const now = getDateInChileTime(new Date().toISOString());
      const diffMs = now.getTime() - alertDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      // Para días, usar la función que compara solo fechas (sin horas)
      const diffDays = getDaysDifferenceInChile(date);

      if (diffMins < 1) {
        return 'Ahora';
      } else if (diffMins < 60) {
        return `Hace ${diffMins}m`;
      } else if (diffHours < 24 && diffDays === 0) {
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
