import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MachineAssignment } from '../../models/machine-detail.models';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';
import { getDatePartsInChile } from '../../utils/date.utils';

@Component({
  selector: 'app-machine-assignment-history',
  imports: [CommonModule, UiIconComponent, LoadingSpinner],
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
              {{ totalAssignments() }} {{ totalAssignments() === 1 ? 'asignación' : 'asignaciones' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-4 sm:p-6">
        <!-- Filtros Mejorados -->
        <div class="bg-base-50/50 px-5 sm:px-6 py-1 sm:py-4 rounded-3xl border border-base-200/50 mb-6">
          <div class="flex items-center gap-2 mb-2 sm:mb-3">
            <div class="w-1 h-4 rounded-full bg-primary"></div>
            <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
              Estado
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent shrink-0"
              [class.bg-primary]="activeFilter() === 'todas'"
              [class.text-primary-content]="activeFilter() === 'todas'"
              [class.text-base-content]="activeFilter() === 'todas'"
              [class.bg-base-200/60]="activeFilter() !== 'todas'"
              [class.text-base-content/70]="activeFilter() !== 'todas'"
              [class.hover:bg-base-200]="activeFilter() !== 'todas'"
              (click)="onFilterChange('todas')"
              type="button">
              Todas
            </button>
            <button
              class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent shrink-0"
              [class.bg-success]="activeFilter() === 'actual'"
              [class.text-success-content]="activeFilter() === 'actual'"
              [class.text-base-content]="activeFilter() === 'actual'"
              [class.bg-base-200/60]="activeFilter() !== 'actual'"
              [class.text-base-content/70]="activeFilter() !== 'actual'"
              [class.hover:bg-base-200]="activeFilter() !== 'actual'"
              (click)="onFilterChange('actual')"
              type="button">
              Activas
            </button>
            <button
              class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent shrink-0"
              [class.bg-base-content/60]="activeFilter() === 'cerradas'"
              [class.text-base-100]="activeFilter() === 'cerradas'"
              [class.text-base-content]="activeFilter() === 'cerradas'"
              [class.bg-base-200/60]="activeFilter() !== 'cerradas'"
              [class.text-base-content/70]="activeFilter() !== 'cerradas'"
              [class.hover:bg-base-200]="activeFilter() !== 'cerradas'"
              (click)="onFilterChange('cerradas')"
              type="button">
              Cerradas
            </button>
          </div>
        </div>

        <!-- Vista Móvil: Cards -->
        <div class="block xl:hidden space-y-4">
          @if (isLoading()) {
            <div class="flex justify-center items-center py-12">
              <app-loading-spinner size="md" text="Cargando asignaciones..." />
            </div>
          } @else {
          @for (assignment of assignments(); track assignment.id; let i = $index) {
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
                  <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group" (click)="onViewDriverDetail(assignment.chofer.id, $event)">
                    <div class="w-10 h-10 shrink-0 flex items-center justify-center">
                      <ui-icon name="IdCard" size="md" class="text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-base text-base-content group-hover:text-primary transition-colors truncate tooltip" [attr.data-tip]="assignment.chofer.nombre_completo">
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
                        <ui-icon name="X" size="xs" />
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
                      <ui-icon name="Calendar" size="sm" />
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
                        <ui-icon name="CheckCircle2" size="sm" />
                      } @else {
                        <ui-icon name="Clock" size="sm" />
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
                      <ui-icon name="Clock" size="sm" class="text-primary" />
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
                  <ui-icon name="Users" size="lg" class="text-base-content/40" />
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
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="hidden xl:block overflow-hidden rounded-3xl border border-base-200">
          @if (isLoading()) {
            <div class="flex justify-center items-center py-12">
              <app-loading-spinner size="md" text="Cargando asignaciones..." />
            </div>
          } @else {
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
              @for (assignment of assignments(); track assignment.id; let i = $index) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter"
                  [class.border-l-4]="assignment.estado === 'activa'"
                  [class.border-l-success]="assignment.estado === 'activa'"
                  [class.bg-success/5]="assignment.estado === 'activa'"
                  [style.animation-delay.ms]="i * 30"
                  [style.animation-fill-mode]="'both'">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-2 cursor-pointer group" (click)="onViewDriverDetail(assignment.chofer.id, $event)">
                      <div class="shrink-0">
                        <div class="bg-primary/10 w-8 h-8 rounded-full text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                          <ui-icon name="IdCard" size="sm" class="text-primary" />
                        </div>
                      </div>
                      <span class="font-medium text-base-content/80 group-hover:text-primary transition-colors truncate tooltip" [attr.data-tip]="assignment.chofer.nombre_completo">
                        {{ assignment.chofer.nombre_completo }}
                      </span>
                    </div>
                  </td>
                  
                  <td class="py-4">
                    <div class="flex items-center gap-2">
                      <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                        <ui-icon name="Calendar" size="sm" />
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
                          <ui-icon name="CheckCircle2" size="sm" />
                        </div>
                        <div>
                          <div class="font-semibold text-base-content">{{ formatDate(assignment.fecha_fin) }}</div>
                          <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(assignment.fecha_fin) }}</div>
                        </div>
                      </div>
                    } @else {
                      <div class="flex items-center gap-2">
                        <div class="bg-success/10 p-1.5 rounded text-success shrink-0">
                          <ui-icon name="Clock" size="sm" />
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
                      <ui-icon name="Clock" size="sm" class="text-primary" />
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
                        <ui-icon name="X" size="xs" />
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
          }
        </div>
        
        <!-- Paginación -->
        @if (totalPages() > 0 && !isLoading()) {
          <div class="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
            <span>Mostrando {{ startRecord() }}-{{ endRecord() }} de {{ totalAssignments() }} asignaciones</span>
            <div class="join">
              <button 
                (click)="goToPreviousPage()" 
                [disabled]="currentPage() === 1 || isLoading()" 
                class="join-item btn btn-sm px-3" 
                [class.btn-disabled]="currentPage() === 1 || isLoading()">
                «
              </button>
              @for (page of pages(); track page) {
                <button 
                  (click)="goToPage(page)" 
                  [disabled]="isLoading()" 
                  [class.btn-active]="page === currentPage()" 
                  class="join-item btn btn-sm px-4">{{ page }}</button>
              }
              <button 
                (click)="goToNextPage()" 
                [disabled]="currentPage() === totalPages() || isLoading()" 
                class="join-item btn btn-sm px-3" 
                [class.btn-disabled]="currentPage() === totalPages() || isLoading()">
                »
              </button>
            </div>
          </div>
        }
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
  totalAssignments = input<number>(0);
  currentPage = input<number>(1);
  totalPages = input<number>(0);
  isLoading = input<boolean>(false);
  activeFilter = input<'todas' | 'actual' | 'cerradas'>('todas');

  filterChange = output<'todas' | 'actual' | 'cerradas'>();
  pageChange = output<number>();

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }

    return pages;
  });

  startRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = 10;
    return (page - 1) * pageSize + 1;
  });

  endRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = 10;
    const total = this.totalAssignments();
    return Math.min(page * pageSize, total);
  });

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) {
      return;
    }
    this.pageChange.emit(page);
  }

  private router = inject(Router);

  onFilterChange(filter: 'todas' | 'actual' | 'cerradas'): void {
    this.filterChange.emit(filter);
  }

  onViewDriverDetail(driverId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/choferes', driverId]);
  }

  getInitials(name: string): string {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private parseDateInChile(date: string): Date | null {
    if (!date) return null;

    const { year, month, day } = getDatePartsInChile(date);

    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  formatDate(date: string): string {
    const parsedDate = this.parseDateInChile(date);
    if (!parsedDate) return '';

    return parsedDate.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateFull(date: string): string {
    const parsedDate = this.parseDateInChile(date);
    if (!parsedDate) return '';

    return parsedDate.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }
}
