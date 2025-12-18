import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineAssignment } from '../../models/machine-detail.models';
import { DriverIcon } from '../../components/driver-icon/driver-icon';

@Component({
  selector: 'app-machine-assignment-history',
  imports: [CommonModule, DriverIcon],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
      <!-- Header -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex-1 min-w-0">
            <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
              Historial de Asignaciones
            </h2>
            <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
              Trazabilidad completa de choferes asignados a esta máquina.
            </p>
          </div>
          
          <!-- Badge de conteo -->
          <div class="flex items-center gap-3 shrink-0">
            <span class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              {{ filteredAssignments().length }} {{ filteredAssignments().length === 1 ? 'asignación' : 'asignaciones' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-4 sm:p-6">
        <!-- Filtros Mejorados -->
        <div class="bg-base-50/50 px-5 sm:px-6 py-1 sm:py-4 rounded-xl border border-base-200/50 mb-6">
          <div class="flex items-center gap-2 mb-2 sm:mb-3">
            <div class="w-1 h-4 rounded-full bg-primary"></div>
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
              Estado
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
              [class.bg-primary]="activeFilter() === 'all'"
              [class.text-primary-content]="activeFilter() === 'all'"
              [class.text-base-content]="activeFilter() === 'all'"
              [class.bg-base-200/60]="activeFilter() !== 'all'"
              [class.text-base-content/70]="activeFilter() !== 'all'"
              [class.hover:bg-base-200]="activeFilter() !== 'all'"
              (click)="onFilterChange('all')"
              type="button">
              Todas
            </button>
            <button
              class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
              [class.bg-success]="activeFilter() === 'activa'"
              [class.text-success-content]="activeFilter() === 'activa'"
              [class.text-base-content]="activeFilter() === 'activa'"
              [class.bg-base-200/60]="activeFilter() !== 'activa'"
              [class.text-base-content/70]="activeFilter() !== 'activa'"
              [class.hover:bg-base-200]="activeFilter() !== 'activa'"
              (click)="onFilterChange('activa')"
              type="button">
              Activas
            </button>
            <button
              class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent flex-shrink-0"
              [class.bg-base-content/60]="activeFilter() === 'cerrada'"
              [class.text-base-100]="activeFilter() === 'cerrada'"
              [class.text-base-content]="activeFilter() === 'cerrada'"
              [class.bg-base-200/60]="activeFilter() !== 'cerrada'"
              [class.text-base-content/70]="activeFilter() !== 'cerrada'"
              [class.hover:bg-base-200]="activeFilter() !== 'cerrada'"
              (click)="onFilterChange('cerrada')"
              type="button">
              Cerradas
            </button>
          </div>
        </div>

        <!-- Vista Móvil: Cards -->
        <div class="block xl:hidden space-y-4">
          @for (assignment of filteredAssignments(); track assignment.id; let i = $index) {
            <div 
              class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
              [class.border-l-4]="assignment.estado === 'activa'"
              [class.border-l-success]="assignment.estado === 'activa'"
              [class.bg-success/5]="assignment.estado === 'activa'"
              [style.animation-delay.ms]="i * 50"
              [style.animation-fill-mode]="'both'">
              <div class="card-body p-5">
                <!-- Header: Chofer y Estado -->
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 shrink-0 flex items-center justify-center">
                      <app-driver-icon class="w-full h-full p-2 text-primary"></app-driver-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-base text-base-content truncate tooltip" [attr.data-tip]="assignment.chofer.nombre_completo">
                        {{ assignment.chofer.nombre_completo }}
                      </h3>
                    </div>
                  </div>
                  
                  <!-- Badge Estado -->
                  <div class="shrink-0">
                    @if (assignment.estado === 'activa') {
                      <div class="badge badge-success gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        Activa
                      </div>
                    } @else {
                      <div class="badge badge-ghost gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                        Cerrada
                      </div>
                    }
                  </div>
                </div>

                <!-- Divider -->
                <div class="divider my-3 opacity-30"></div>

                <!-- Información de Fechas -->
                <div class="space-y-3">
                  <div class="flex items-center gap-3 p-3 bg-base-50 rounded-lg border border-base-200">
                    <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Fecha Inicio</div>
                      <div class="font-semibold text-base-content">{{ formatDate(assignment.fecha_inicio) }}</div>
                      <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(assignment.fecha_inicio) }}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 p-3 bg-base-50 rounded-lg border border-base-200">
                    <div class="bg-base-content/10 p-2 rounded-lg text-base-content/60 shrink-0">
                      @if (assignment.fecha_fin) {
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Fecha Fin</div>
                      @if (assignment.fecha_fin) {
                        <div class="font-semibold text-base-content">{{ formatDate(assignment.fecha_fin) }}</div>
                        <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(assignment.fecha_fin) }}</div>
                      } @else {
                        <div class="font-semibold text-success">En curso</div>
                        <div class="text-xs text-base-content/50">Asignación activa</div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Duración -->
                <div 
                  class="mt-4 p-3 rounded-lg"
                  [class.bg-primary/5]="assignment.estado === 'activa'"
                  [class.border]="assignment.estado === 'activa'"
                  [class.border-primary/20]="assignment.estado === 'activa'">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-primary">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
                      </svg>
                      <span class="text-xs font-bold text-base-content/60 uppercase tracking-wider">Duración</span>
                    </div>
                    <span class="font-bold text-lg text-primary tabular-nums">
                      {{ assignment.duracion_dias }} {{ assignment.duracion_dias === 1 ? 'día' : 'días' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="py-16 sm:py-20">
              <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div class="space-y-2">
                  <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay asignaciones que coincidan con el filtro</h3>
                  <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                    Intenta cambiar el filtro para ver más resultados.
                  </p>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[200px]">Conductor</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha Inicio</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha Fin</th>
                <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Duración</th>
                <th class="py-4 pr-6 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (assignment of filteredAssignments(); track assignment.id; let i = $index) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter"
                  [class.border-l-4]="assignment.estado === 'activa'"
                  [class.border-l-success]="assignment.estado === 'activa'"
                  [class.bg-success/5]="assignment.estado === 'activa'"
                  [style.animation-delay.ms]="i * 30"
                  [style.animation-fill-mode]="'both'">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="shrink-0">
                        <div class="bg-primary/10 w-8 h-8 rounded-full text-primary flex items-center justify-center border border-primary/20">
                          <app-driver-icon class="w-4 h-4 text-primary"></app-driver-icon>
                        </div>
                      </div>
                      <span class="font-medium text-base-content/80 truncate tooltip" [attr.data-tip]="assignment.chofer.nombre_completo">
                        {{ assignment.chofer.nombre_completo }}
                      </span>
                    </div>
                  </td>
                  
                  <td class="py-4">
                    <div class="flex items-center gap-2">
                      <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div>
                        <div class="font-semibold text-base-content">{{ formatDate(assignment.fecha_inicio) }}</div>
                        <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(assignment.fecha_inicio) }}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="py-4">
                    @if (assignment.fecha_fin) {
                      <div class="flex items-center gap-2">
                        <div class="bg-base-content/10 p-1.5 rounded text-base-content/60 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                        </div>
                        <div>
                          <div class="font-semibold text-base-content">{{ formatDate(assignment.fecha_fin) }}</div>
                          <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(assignment.fecha_fin) }}</div>
                        </div>
                      </div>
                    } @else {
                      <div class="flex items-center gap-2">
                        <div class="bg-success/10 p-1.5 rounded text-success shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div class="font-semibold text-success">En curso</div>
                          <div class="text-xs text-base-content/50">Asignación activa</div>
                        </div>
                      </div>
                    }
                  </td>
                  
                  <td class="text-center py-4">
                    <div 
                      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg tabular-nums"
                      [class.bg-primary/5]="assignment.estado === 'activa'"
                      [class.border]="assignment.estado === 'activa'"
                      [class.border-primary/20]="assignment.estado === 'activa'">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-primary">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
                      </svg>
                      <span class="font-bold text-primary">
                        {{ assignment.duracion_dias }} {{ assignment.duracion_dias === 1 ? 'día' : 'días' }}
                      </span>
                    </div>
                  </td>
                  
                  <td class="pr-6 text-center py-4">
                    @if (assignment.estado === 'activa') {
                      <div class="badge badge-success gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        Activa
                      </div>
                    } @else {
                      <div class="badge badge-ghost gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                        Cerrada
                      </div>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-16 sm:py-20">
                    <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                      <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      </div>
                      <div class="space-y-2">
                        <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay asignaciones que coincidan con el filtro</h3>
                        <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                          Intenta cambiar el filtro para ver más resultados.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes componentEnter {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-component-enter {
      animation: componentEnter 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes card-enter {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes table-row-enter {
      from {
        opacity: 0;
        transform: translateX(-8px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-card-enter {
      animation: card-enter 400ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    .animate-table-row-enter {
      animation: table-row-enter 300ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    .animate-fade-in {
      animation: fade-in 400ms ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-component-enter,
      .animate-card-enter,
      .animate-table-row-enter,
      .animate-fade-in {
        animation: none;
        transform: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineAssignmentHistory {
  assignments = input.required<MachineAssignment[]>();
  activeFilter = signal<'all' | 'activa' | 'cerrada'>('all');

  filteredAssignments = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') {
      return this.assignments();
    }
    return this.assignments().filter(a => a.estado === filter);
  });

  onFilterChange(filter: 'all' | 'activa' | 'cerrada'): void {
    this.activeFilter.set(filter);
  }

  getInitials(name: string): string {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  }

  formatDateFull(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short'
      });
    } catch {
      return '';
    }
  }
}
