import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Machine, DocumentStatus } from '../../models/machine.models';

@Component({
  selector: 'app-machine-card',
  imports: [RouterLink],
  template: `
    <div class="card bg-base-100 shadow-xl hover-lift relative">
      <div class="card-body flex flex-col items-start text-left p-6 pl-4 border-l-4 border-l-primary">
        <!-- Estado/Número en esquina superior derecha -->
        <div class="absolute top-4 right-4">
          <span class="badge badge-sm font-bold"
            [class.badge-success]="machine().estado_operativo === 'Operativa'"
            [class.badge-warning]="machine().estado_operativo === 'En Taller'"
            [class.badge-error]="machine().estado_operativo === 'Inactiva'">
            {{ machine().numero }}
          </span>
        </div>

        <!-- Avatar circular grande centrado -->
        <div class="relative mb-4">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-base-200">
            <svg class="w-14 h-14 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V17C20 17.5523 19.5523 18 19 18H5C4.44772 18 4 17.5523 4 17V7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 10H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M8 13H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          
          <!-- Tag de disponibilidad (esquina superior izquierda del avatar) -->
          <div class="absolute -top-1 -left-1">
            <span class="badge badge-xs"
              [class.badge-success]="machine().estado_operativo === 'Operativa'"
              [class.badge-warning]="machine().estado_operativo === 'En Taller'"
              [class.badge-error]="machine().estado_operativo === 'Inactiva'">
              @if (machine().estado_operativo === 'Operativa') {
                Disponible
              } @else if (machine().estado_operativo === 'En Taller') {
                En Taller
              } @else {
                Inactiva
              }
            </span>
          </div>
        </div>

        <!-- Nombre (Número de Máquina) -->
        <h3 class="text-xl font-bold mb-1 truncate w-full" [attr.data-tip]="machine().numero">
          Máquina {{ machine().numero }}
        </h3>

        <!-- Título/Profesión (Marca) -->
        <p class="text-sm text-base-content/70 mb-2 truncate w-full" [attr.data-tip]="machine().marca">
          {{ machine().marca }}
        </p>

        <!-- Afiliación (Chofer) -->
        <p class="text-xs text-base-content/60 mb-4 truncate w-full" [attr.data-tip]="machine().chofer_actual?.nombre_completo || 'Sin asignar'">
          @if (machine().chofer_actual) {
            <span class="flex items-center justify-center gap-1">
              <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.5 14a.5.5 0 0 1-.5-.5v-1a2.5 2.5 0 0 0-5 0v1a.5.5 0 0 1-1 0v-1a3.5 3.5 0 1 1 7 0v1a.5.5 0 0 1-.5.5Z"/>
              </svg>
              {{ machine().chofer_actual!.nombre_completo }}
            </span>
          } @else {
            <span class="text-base-content/40">Sin chofer asignado</span>
          }
        </p>

        <!-- Skills/Tags (Documentos) -->
        <div class="flex flex-wrap gap-1.5 justify-center mb-4 min-h-[2rem]">
          @if (docStatus().revision_tecnica) {
            <span class="badge badge-sm"
              [class.badge-success]="docStatus().revision_tecnica!.estado === 'ok'"
              [class.badge-warning]="docStatus().revision_tecnica!.estado === 'warning'"
              [class.badge-error]="docStatus().revision_tecnica!.estado === 'error'">
              Rev. Técnica
            </span>
          }
          @if (docStatus().permiso_circulacion) {
            <span class="badge badge-sm"
              [class.badge-success]="docStatus().permiso_circulacion!.estado === 'ok'"
              [class.badge-warning]="docStatus().permiso_circulacion!.estado === 'warning'"
              [class.badge-error]="docStatus().permiso_circulacion!.estado === 'error'">
              Permiso
            </span>
          }
          @if (docStatus().seguro_obligatorio) {
            <span class="badge badge-sm"
              [class.badge-success]="docStatus().seguro_obligatorio!.estado === 'ok'"
              [class.badge-warning]="docStatus().seguro_obligatorio!.estado === 'warning'"
              [class.badge-error]="docStatus().seguro_obligatorio!.estado === 'error'">
              Seguro
            </span>
          }
        </div>

        <!-- Bio corta (Patente) -->
        <p class="text-xs text-base-content/50 mb-4 break-all">
          Patente: <span class="font-mono font-bold">{{ machine().patente }}</span>
        </p>

        <!-- Botón de acción -->
        <a 
          [routerLink]="['/maquinas', machine().id]" 
          class="btn btn-outline btn-primary btn-sm w-full hover-scale">
          Ver Detalle
        </a>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineCard {
  machine = input.required<Machine>();
  docStatus = input.required<{
    revision_tecnica?: DocumentStatus;
    permiso_circulacion?: DocumentStatus;
    seguro_obligatorio?: DocumentStatus;
  }>();
}

