import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Machine, DocumentStatus } from '../../models/machine.models';

@Component({
  selector: 'app-machine-card',
  imports: [RouterLink],
  template: `
    <!-- La tarjeta completa actúa como CTA principal -->
    <a
      [routerLink]="['/maquinas', machine().id]"
      class="block h-full no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 rounded-xl"
    >
      <div
        class="card bg-base-100 border border-base-200 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full"
      >
        <!-- Barra superior de estado operativo -->
        <div
          class="h-2 w-full absolute top-0 left-0"
          [class.bg-success-accent]="machine().estado_operativo === 'Operativa'"
          [class.bg-warning-accent]="machine().estado_operativo === 'En Taller'"
          [class.bg-error-accent]="machine().estado_operativo === 'Inactiva'"
        ></div>

        <div class="card-body p-6 pt-4 flex flex-col justify-between h-full">
          <!-- Sección superior: identidad + estado -->
          <div class="flex justify-between items-start mb-4 gap-3">
            <!-- Icono + títulos -->
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <svg
                  class="w-4 h-4 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <line x1="4" y1="10" x2="20" y2="10" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                </svg>
              </div>

              <div class="flex flex-col min-w-0">
                <h3
                  class="text-base @xs:text-lg font-extrabold text-base-content truncate"
                  [attr.title]="'Máquina ' + machine().numero"
                >
                  Máquina {{ machine().numero }}
                </h3>
                <p
                  class="text-xs text-base-content/70 truncate"
                  [attr.title]="machine().marca"
                >
                  {{ machine().marca }}
                </p>
              </div>
            </div>

            <!-- Badge de estado operativo -->
            <div class="flex-shrink-0 mt-1">
              <span
                class="badge badge-sm font-semibold uppercase text-[0.65rem] tracking-wider"
                [class.badge-success]="machine().estado_operativo === 'Operativa'"
                [class.badge-warning]="machine().estado_operativo === 'En Taller'"
                [class.badge-error]="machine().estado_operativo === 'Inactiva'"
              >
                {{ machine().estado_operativo }}
              </span>
            </div>
          </div>

          <!-- Sección central: patente + chofer -->
          <div class="space-y-3 mb-4">
            <!-- Patente -->
            <div class="flex items-center text-xs @xs:text-sm text-base-content/80">
              <span
                class="w-5 h-5 flex items-center justify-center text-base-content/50 flex-shrink-0"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.03c0 1.08.878 1.95 1.956 1.975h14.088A1.975 1.975 0 0 0 21 16.03V6.97c0-1.08-.878-1.95-1.956-1.975H4.956A1.975 1.975 0 0 0 3 6.97v9.06Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
              <p class="ml-2">
                Patente:
                <span class="font-mono font-bold text-base-content break-all">
                  {{ machine().patente }}
                </span>
              </p>
            </div>

            <!-- Chofer actual -->
            <div class="flex items-center text-xs @xs:text-sm">
              <span
                class="w-5 h-5 flex items-center justify-center text-base-content/50 flex-shrink-0"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.73 0-5.405-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>

              @if (machine().chofer_actual) {
                <p
                  class="ml-2 text-base-content/80 font-medium truncate"
                  [attr.title]="machine().chofer_actual!.nombre_completo"
                >
                  Chofer: {{ machine().chofer_actual!.nombre_completo }}
                </p>
              } @else {
                <p class="ml-2 text-base-content/50 italic">
                  Chofer: Sin asignar
                </p>
              }
            </div>
          </div>

          <!-- Sección inferior: documentación -->
          <div class="mt-auto">
            <div class="text-[0.7rem] @xs:text-xs font-semibold text-base-content/60 mb-2">
              Documentación
            </div>

            <div class="flex flex-wrap gap-2 min-h-[1.75rem]">
              @if (docStatus().revision_tecnica) {
                <span
                  class="badge badge-outline badge-sm text-[0.7rem] font-medium px-2 py-1 rounded-full"
                  [class.text-success]="docStatus().revision_tecnica!.estado === 'ok'"
                  [class.border-success-outline]="docStatus().revision_tecnica!.estado === 'ok'"
                  [class.text-warning]="docStatus().revision_tecnica!.estado === 'warning'"
                  [class.border-warning-outline]="docStatus().revision_tecnica!.estado === 'warning'"
                  [class.text-error]="docStatus().revision_tecnica!.estado === 'error'"
                  [class.border-error-outline]="docStatus().revision_tecnica!.estado === 'error'"
                >
                  Rev. Técnica
                </span>
              }

              @if (docStatus().permiso_circulacion) {
                <span
                  class="badge badge-outline badge-sm text-[0.7rem] font-medium px-2 py-1 rounded-full"
                  [class.text-success]="docStatus().permiso_circulacion!.estado === 'ok'"
                  [class.border-success-outline]="docStatus().permiso_circulacion!.estado === 'ok'"
                  [class.text-warning]="docStatus().permiso_circulacion!.estado === 'warning'"
                  [class.border-warning-outline]="docStatus().permiso_circulacion!.estado === 'warning'"
                  [class.text-error]="docStatus().permiso_circulacion!.estado === 'error'"
                  [class.border-error-outline]="docStatus().permiso_circulacion!.estado === 'error'"
                >
                  Permiso Circ.
                </span>
              }

              @if (docStatus().seguro_obligatorio) {
                <span
                  class="badge badge-outline badge-sm text-[0.7rem] font-medium px-2 py-1 rounded-full"
                  [class.text-success]="docStatus().seguro_obligatorio!.estado === 'ok'"
                  [class.border-success-outline]="docStatus().seguro_obligatorio!.estado === 'ok'"
                  [class.text-warning]="docStatus().seguro_obligatorio!.estado === 'warning'"
                  [class.border-warning-outline]="docStatus().seguro_obligatorio!.estado === 'warning'"
                  [class.text-error]="docStatus().seguro_obligatorio!.estado === 'error'"
                  [class.border-error-outline]="docStatus().seguro_obligatorio!.estado === 'error'"
                >
                  Seguro Obl.
                </span>
              }
            </div>
          </div>
        </div>
      </div>
    </a>
  `,
  styles: [
    `
      /* Colores de acento para la barra superior usando tokens de DaisyUI */
      .bg-success-accent {
        background-color: oklch(var(--su) / 0.85);
      }
      .bg-warning-accent {
        background-color: oklch(var(--wa) / 0.85);
      }
      .bg-error-accent {
        background-color: oklch(var(--er) / 0.85);
      }

      /* Píldoras outline con bordes semánticos */
      .badge.badge-outline {
        background-color: transparent;
        transition: background-color 0.1s ease-in-out;
      }

      .border-success-outline {
        border-color: oklch(var(--su) / 0.8);
      }
      .border-warning-outline {
        border-color: oklch(var(--wa) / 0.8);
      }
      .border-error-outline {
        border-color: oklch(var(--er) / 0.8);
      }

      .badge.badge-outline:hover {
        background-color: oklch(var(--b2));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MachineCard {
  machine = input.required<Machine>();
  docStatus = input.required<{
    revision_tecnica?: DocumentStatus;
    permiso_circulacion?: DocumentStatus;
    seguro_obligatorio?: DocumentStatus;
  }>();
}
