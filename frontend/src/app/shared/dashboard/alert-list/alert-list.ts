import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert } from '../../models/dashboard.models';

@Component({
  selector: 'app-alert-list',
  imports: [RouterLink],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200 flex flex-col overflow-hidden animate-scale-up h-[424px]">
      <!-- Header con Controles -->
      <div class="card-header border-b border-base-200 bg-base-100 z-20">
        <div class="p-4 flex items-center justify-between gap-2 min-w-0">
          <!-- Título y Badge -->
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <h2 class="font-bold text-xl sm:text-2xl flex items-center gap-2 min-w-0 truncate border-l-4 border-l-primary pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 text-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span class="truncate">Centro de Alertas</span>
            </h2>
            @if (activeAlerts().length > 0) {
              <span class="badge badge-error badge-sm text-white font-mono flex-shrink-0" [class.animate-pulse]="hasCriticalAlerts()">
                {{ activeAlerts().length }}
              </span>
            }
          </div>

          <!-- Botón Eliminar Todas -->
          @if (activeAlerts().length > 0) {
            <button
              class="btn btn-ghost btn-xs text-base-content/50 hover:text-error tooltip tooltip-left flex-shrink-0"
              [attr.data-tip]="'Eliminar todas las alertas'"
              (click)="onDeleteAllAlerts()"
              type="button"
              aria-label="Eliminar todas las alertas">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          }
        </div>
      </div>

      <!-- Lista de Alertas -->
      <div class="card-body p-0 overflow-y-auto custom-scrollbar flex-1 relative bg-base-50/30 min-h-0">
        @if (displayedAlerts().length === 0) {
          <!-- Empty State -->
          <div class="flex flex-col items-start justify-start py-16 px-4 animate-fade-in pl-4 border-l-4 border-l-primary">
            <div class="text-6xl mb-4 animate-bounce-subtle">✅</div>
            <div class="text-xl font-bold mb-2">Todo al día</div>
            <p class="text-sm text-base-content/70 italic">No hay alertas pendientes</p>
          </div>
        } @else {
          @for (alert of displayedAlerts(); track alert.id; let i = $index) {
            <div
              role="alert"
              class="group relative p-4 border-b border-base-200 hover:bg-white transition-all duration-200"
              [class.animate-list-item-enter]="i === 0"
              [class.animate-list-item-enter-delay]="i > 0"
              [style.animation-delay.ms]="i > 0 ? i * 50 : 0"
              [style.animation-fill-mode]="'both'">
              
              <!-- Borde izquierdo siempre visible -->
              <div
                class="absolute left-0 top-0 bottom-0 w-1 transition-opacity duration-200"
                [class.opacity-70]="true"
                [class.group-hover:opacity-100]="true"
                [class.bg-error]="alert.severity === 'critical'"
                [class.bg-warning]="alert.severity === 'warning'"
                [class.bg-info]="alert.severity === 'info'"
                [class.bg-success]="alert.severity === 'success'">
              </div>

              <div class="flex flex-col sm:flex-row gap-4 items-start">
                <!-- Icono Semántico -->
                <div class="flex-shrink-0 mt-1">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center ring-1"
                    [class.bg-error/10]="alert.severity === 'critical'"
                    [class.bg-warning/10]="alert.severity === 'warning'"
                    [class.bg-info/10]="alert.severity === 'info'"
                    [class.bg-success/10]="alert.severity === 'success'"
                    [class.text-error]="alert.severity === 'critical'"
                    [class.text-warning]="alert.severity === 'warning'"
                    [class.text-info]="alert.severity === 'info'"
                    [class.text-success]="alert.severity === 'success'"
                    [class.ring-error/20]="alert.severity === 'critical'"
                    [class.ring-warning/20]="alert.severity === 'warning'"
                    [class.ring-info/20]="alert.severity === 'info'"
                    [class.ring-success/20]="alert.severity === 'success'">
                    @if (alert.severity === 'critical') {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    } @else if (alert.severity === 'warning') {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    } @else if (alert.severity === 'info') {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    }
                  </div>
                </div>

                <!-- Contenido Principal -->
                <div class="flex-1 min-w-0 w-full">
                  <!-- Título, Timestamp y Botón Eliminar -->
                  <div class="flex justify-between items-start gap-2 mb-1">
                    <h3 class="font-bold text-sm text-base-content truncate tooltip flex-1" [attr.data-tip]="alert.title">
                      {{ alert.title }}
                    </h3>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      @if (alert.date) {
                        <span class="text-[10px] font-mono text-base-content/50 bg-base-200 px-1.5 py-0.5 rounded">
                          {{ formatTime(alert.date) }}
                        </span>
                      }
                      <button
                        class="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error transition-colors"
                        (click)="onDeleteAlert(alert.id)"
                        type="button"
                        [attr.aria-label]="'Eliminar alerta: ' + alert.title"
                        title="Eliminar alerta">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Descripción -->
                  <p class="text-xs text-base-content/70 line-clamp-2 leading-relaxed">
                    @if (alert.machineId || alert.driverName) {
                      @if (alert.machineId) {
                        <span class="font-semibold text-base-content">Máquina {{ alert.machineId }}</span>
                      }
                      @if (alert.machineId && alert.driverName) {
                        <span> • </span>
                      }
                      @if (alert.driverName) {
                        <span>{{ alert.driverName }}</span>
                      }
                      @if (alert.description) {
                        <span> • </span>
                      }
                    }
                    @if (alert.description) {
                      <span>{{ alert.description }}</span>
                    }
                  </p>

                  <!-- Acciones -->
                  <div class="mt-3 flex items-center gap-2 flex-wrap">
                    <!-- Botón Principal -->
                    <a
                      [routerLink]="alert.actionHref"
                      class="btn btn-xs text-white gap-1 shadow-sm flex-1 sm:flex-none"
                      [class.btn-error]="alert.severity === 'critical'"
                      [class.btn-warning]="alert.severity === 'warning'"
                      [class.btn-info]="alert.severity === 'info'"
                      [class.btn-success]="alert.severity === 'success'"
                      [class.shadow-error/20]="alert.severity === 'critical'"
                      [class.shadow-warning/20]="alert.severity === 'warning'"
                      [class.shadow-info/20]="alert.severity === 'info'"
                      [class.shadow-success/20]="alert.severity === 'success'">
                      {{ alert.actionLabel }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
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
  
  // Outputs para eventos
  deleteAlert = output<string>();
  deleteAllAlerts = output<void>();

  // Filtrar alertas activas (no resueltas)
  activeAlerts = computed(() => {
    return this.alerts().filter(alert => !alert.resolved);
  });

  // Alertas a mostrar (ordenadas por severidad)
  displayedAlerts = computed(() => {
    return [...this.activeAlerts()].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  });

  // Verificar si hay alertas críticas
  hasCriticalAlerts = computed(() => {
    return this.activeAlerts().some(alert => alert.severity === 'critical');
  });

  onDeleteAlert(alertId: string): void {
    this.deleteAlert.emit(alertId);
  }

  onDeleteAllAlerts(): void {
    this.deleteAllAlerts.emit();
  }

  formatTime(date: string): string {
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
      } else if (diffDays < 7) {
        return `Hace ${diffDays}d`;
      } else {
        return alertDate.toLocaleDateString('es-CL', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      return date;
    }
  }
}
