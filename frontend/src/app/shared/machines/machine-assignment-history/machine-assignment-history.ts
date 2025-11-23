import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { MachineAssignment } from '../../models/machine-detail.models';

@Component({
  selector: 'app-machine-assignment-history',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header">
        <div>
          <h2 class="card-title text-2xl">Historial de Asignaciones</h2>
          <p class="text-sm text-base-content/70">
            Trazabilidad completa de choferes asignados a esta máquina.
          </p>
        </div>
        <div class="join">
          <button
            class="btn join-item btn-sm"
            [class.btn-active]="activeFilter() === 'all'"
            (click)="onFilterChange('all')">
            Todo
          </button>
          <button
            class="btn join-item btn-sm"
            [class.btn-active]="activeFilter() === 'activa'"
            (click)="onFilterChange('activa')">
            Activas
          </button>
          <button
            class="btn join-item btn-sm"
            [class.btn-active]="activeFilter() === 'cerrada'"
            (click)="onFilterChange('cerrada')">
            Cerradas
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>CHOFER</th>
                <th>FECHA INICIO</th>
                <th>FECHA FIN</th>
                <th>DURACIÓN</th>
              </tr>
            </thead>
            <tbody>
              @for (assignment of filteredAssignments(); track assignment.id) {
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <span>{{ assignment.chofer.nombre_completo }}</span>
                      @if (assignment.estado === 'activa') {
                        <span class="badge badge-success">ACTIVA</span>
                      }
                    </div>
                  </td>
                  <td class="font-mono text-sm">{{ formatDate(assignment.fecha_inicio) }}</td>
                  <td class="font-mono text-sm">
                    @if (assignment.fecha_fin) {
                      {{ formatDate(assignment.fecha_fin) }}
                    } @else {
                      <span class="text-base-content/50">En curso</span>
                    }
                  </td>
                  <td>{{ assignment.duracion_dias }} días</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="text-center text-base-content/50 py-8">
                    No hay asignaciones registradas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [],
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

  formatDate(date: string): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
    }
  }
}

