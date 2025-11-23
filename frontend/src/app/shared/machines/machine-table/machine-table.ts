import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Machine, DocumentStatus } from '../../models/machine.models';

@Component({
  selector: 'app-machine-table',
  imports: [RouterLink],
  template: `
    <div class="overflow-x-auto -mx-4 sm:mx-0">
      <div class="inline-block min-w-full align-middle px-4 sm:px-0">
        <table class="table table-zebra w-full min-w-[800px]">
          <thead>
            <tr>
              <th class="whitespace-nowrap">Nº Máquina</th>
              <th class="whitespace-nowrap">Chofer Asignado</th>
              <th class="whitespace-nowrap">Estado Operativo</th>
              <th class="whitespace-nowrap">Estado de Documentos</th>
              <th class="whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (machine of machines(); track machine.id) {
              <tr>
                <td class="min-w-[150px]">
                  <strong class="truncate block tooltip" [attr.data-tip]="machine.numero">{{ machine.numero }}</strong>
                  <span class="text-sm text-base-content/70 truncate block tooltip" [attr.data-tip]="machine.marca + ' - ' + machine.patente">{{ machine.marca }} - {{ machine.patente }}</span>
                </td>
                <td class="min-w-[120px]">
                  <span class="truncate block tooltip" [attr.data-tip]="machine.chofer_actual?.nombre_completo || '(Sin Asignar)'">{{ machine.chofer_actual?.nombre_completo || '(Sin Asignar)' }}</span>
                </td>
                <td class="whitespace-nowrap">
                  <span class="badge"
                    [class.badge-success]="machine.estado_operativo === 'Operativa'"
                    [class.badge-warning]="machine.estado_operativo === 'En Taller'"
                    [class.badge-error]="machine.estado_operativo === 'Inactiva'">
                    {{ machine.estado_operativo }}
                  </span>
                </td>
                <td class="min-w-[200px]">
                  <div class="flex gap-1 flex-wrap">
                    @if (getDocStatus(machine.id)?.revision_tecnica) {
                      <span class="badge badge-sm whitespace-nowrap"
                        [class.badge-success]="getDocStatus(machine.id)!.revision_tecnica!.estado === 'ok'"
                        [class.badge-warning]="getDocStatus(machine.id)!.revision_tecnica!.estado === 'warning'"
                        [class.badge-error]="getDocStatus(machine.id)!.revision_tecnica!.estado === 'error'">
                        Rev. Técnica
                      </span>
                    }
                    @if (getDocStatus(machine.id)?.permiso_circulacion) {
                      <span class="badge badge-sm whitespace-nowrap"
                        [class.badge-success]="getDocStatus(machine.id)!.permiso_circulacion!.estado === 'ok'"
                        [class.badge-warning]="getDocStatus(machine.id)!.permiso_circulacion!.estado === 'warning'"
                        [class.badge-error]="getDocStatus(machine.id)!.permiso_circulacion!.estado === 'error'">
                        Permiso
                      </span>
                    }
                    @if (getDocStatus(machine.id)?.seguro_obligatorio) {
                      <span class="badge badge-sm whitespace-nowrap"
                        [class.badge-success]="getDocStatus(machine.id)!.seguro_obligatorio!.estado === 'ok'"
                        [class.badge-warning]="getDocStatus(machine.id)!.seguro_obligatorio!.estado === 'warning'"
                        [class.badge-error]="getDocStatus(machine.id)!.seguro_obligatorio!.estado === 'error'">
                        Seguro
                      </span>
                    }
                  </div>
                </td>
                <td class="whitespace-nowrap">
                  <a [routerLink]="['/maquinas', machine.id]" class="btn btn-secondary btn-sm">
                    Gestionar
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center py-8">
                  <div class="flex flex-col items-center gap-2">
                    <div class="text-4xl opacity-50">🚛</div>
                    <h3 class="font-semibold">No hay máquinas coincidentes</h3>
                    <p class="text-sm text-base-content/70">
                      Ajusta los filtros o registra una nueva máquina.
                    </p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineTable {
  machines = input.required<Machine[]>();
  docStatusMap = input.required<Map<number, {
    revision_tecnica?: DocumentStatus;
    permiso_circulacion?: DocumentStatus;
    seguro_obligatorio?: DocumentStatus;
  }>>();

  getDocStatus(machineId: number) {
    return this.docStatusMap().get(machineId);
  }
}

