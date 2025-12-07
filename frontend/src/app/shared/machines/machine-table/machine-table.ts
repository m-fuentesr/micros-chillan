import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Machine, DocumentStatus } from '../../models/machine.models';
import { BusIcon } from '../../components/bus-icon/bus-icon';

@Component({
  selector: 'app-machine-table',
  imports: [RouterLink, BusIcon],
  template: `
    <div class="overflow-x-auto rounded-lg border border-base-200 bg-base-100">
      <div class="inline-block min-w-full align-middle">
        <table class="table w-full min-w-[800px]">
          <thead>
            <tr class="bg-base-200/50">
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Nº Máquina</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Chofer Asignado</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Estado Operativo</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Estado de Documentos</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (machine of machines(); track machine.id) {
              <tr class="hover:bg-base-200/30 transition-colors duration-150">
                <td class="min-w-[200px] py-4">
                  <div class="flex gap-3 items-center">
                    <!-- Avatar del bus -->
                    <div class="w-12 h-12 rounded-lg bg-base-200 flex-shrink-0 overflow-hidden border border-base-300 flex items-center justify-center">
                      <app-bus-icon class="w-full h-full p-1.5 text-base-content/60" />
                    </div>
                    <!-- Datos: Patente y Marca -->
                    <div class="flex flex-col gap-1 flex-grow min-w-0">
                      <span class="text-sm font-semibold text-base-content">{{ machine.patente.toUpperCase() }}</span>
                      <strong class="text-base font-bold text-base-content">{{ machine.numero }}</strong>
                      <span class="text-xs text-base-content/70 truncate tooltip" [attr.data-tip]="machine.marca">{{ machine.marca }}</span>
                    </div>
                  </div>
                </td>
                <td class="min-w-[120px] py-4">
                  <span class="text-sm text-base-content truncate block tooltip" [attr.data-tip]="machine.chofer_actual?.nombre_completo || '(Sin Asignar)'">
                    {{ machine.chofer_actual?.nombre_completo || '(Sin Asignar)' }}
                  </span>
                </td>
                <td class="whitespace-nowrap py-4">
                  <span class="badge badge-sm font-medium"
                    [class.badge-success]="machine.estado_operativo === 'Operativa'"
                    [class.badge-warning]="machine.estado_operativo === 'En Taller'"
                    [class.badge-error]="machine.estado_operativo === 'Inactiva'">
                    {{ machine.estado_operativo }}
                  </span>
                </td>
                <td class="min-w-[200px] py-4">
                  <div class="flex gap-1.5 flex-wrap">
                    @if (getDocStatus(machine.id)?.revision_tecnica) {
                      <span class="badge badge-sm whitespace-nowrap text-xs"
                        [class.badge-success]="getDocStatus(machine.id)!.revision_tecnica!.estado === 'ok'"
                        [class.badge-warning]="getDocStatus(machine.id)!.revision_tecnica!.estado === 'warning'"
                        [class.badge-error]="getDocStatus(machine.id)!.revision_tecnica!.estado === 'error'">
                        Rev. Técnica
                      </span>
                    }
                    @if (getDocStatus(machine.id)?.permiso_circulacion) {
                      <span class="badge badge-sm whitespace-nowrap text-xs"
                        [class.badge-success]="getDocStatus(machine.id)!.permiso_circulacion!.estado === 'ok'"
                        [class.badge-warning]="getDocStatus(machine.id)!.permiso_circulacion!.estado === 'warning'"
                        [class.badge-error]="getDocStatus(machine.id)!.permiso_circulacion!.estado === 'error'">
                        Permiso
                      </span>
                    }
                    @if (getDocStatus(machine.id)?.seguro_obligatorio) {
                      <span class="badge badge-sm whitespace-nowrap text-xs"
                        [class.badge-success]="getDocStatus(machine.id)!.seguro_obligatorio!.estado === 'ok'"
                        [class.badge-warning]="getDocStatus(machine.id)!.seguro_obligatorio!.estado === 'warning'"
                        [class.badge-error]="getDocStatus(machine.id)!.seguro_obligatorio!.estado === 'error'">
                        Seguro
                      </span>
                    }
                  </div>
                </td>
                <td class="whitespace-nowrap py-4 text-right">
                  <a 
                    [routerLink]="['/maquinas', machine.id]" 
                    class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-focus text-primary-content px-3 py-1.5 rounded-lg shadow-sm border border-primary/20 transition-all text-xs font-medium active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Gestionar</span>
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="py-16 sm:py-20">
                  <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <div class="space-y-2">
                      <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay máquinas disponibles</h3>
                      <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                        Ajusta los filtros para ver más resultados o registra una nueva máquina.
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

