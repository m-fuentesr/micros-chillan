import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Machine, DocumentStatus } from '../../models/machine.models';
import { BusIcon } from '../../components/bus-icon/bus-icon';

@Component({
  selector: 'app-machine-card',
  imports: [RouterLink, CommonModule, BusIcon],
  template: `
    <!-- La tarjeta completa actúa como CTA principal -->
    <a
      [routerLink]="['/maquinas', machine().id]"
      class="block h-full no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 rounded-3xl"
    >
      <div
        class="card bg-base-100 border border-base-200 rounded-3xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full flex group"
      >
        <!-- Banda lateral de estado (estilo carnet) -->
        <div
          class="w-2 flex-shrink-0 transition-all duration-300 carnet-strip"
          [class.bg-success-accent]="machine().estado_operativo === 'Operativa'"
          [class.bg-warning-accent]="machine().estado_operativo === 'En Taller'"
          [class.bg-error-accent]="machine().estado_operativo === 'Inactiva'"
          aria-hidden="true"
        ></div>

        <div class="card-body p-4 flex flex-col justify-between flex-grow gap-3">
          <!-- Header: Número de máquina + Estado -->
          <div class="flex justify-between items-start border-b border-dashed border-base-300 pb-2">
            <div class="flex flex-col min-w-0">
              <span class="text-[0.625rem] uppercase tracking-wider font-semibold text-base-content/60">
                Nº MÁQUINA
              </span>
              <span
                class="text-lg font-extrabold text-base-content leading-tight truncate"
                [attr.title]="'Máquina ' + machine().numero"
              >
                {{ machine().numero }}
              </span>
            </div>
            <span
              class="badge badge-sm font-semibold uppercase text-[0.65rem] tracking-wider flex-shrink-0"
              [class.badge-success]="machine().estado_operativo === 'Operativa'"
              [class.badge-warning]="machine().estado_operativo === 'En Taller'"
              [class.badge-error]="machine().estado_operativo === 'Inactiva'"
            >
              {{ machine().estado_operativo }}
            </span>
          </div>

          <!-- Contenido principal: Avatar + Datos -->
          <div class="flex gap-4 flex-grow min-h-0">
            <!-- Avatar (80x80 = w-20 h-20) -->
            <div class="w-20 h-20 rounded-lg bg-base-200 flex-shrink-0 overflow-hidden border border-base-300 flex items-center justify-center group-hover:border-primary/30 transition-colors">
              <app-bus-icon class="w-full h-full p-2 text-primary" />
            </div>

            <!-- Datos: Patente + Especificaciones -->
            <div class="flex flex-col justify-between flex-grow min-w-0">
              <!-- PATENTE - El elemento estrella -->
              <div class="mb-3">
                <div class="inline-block bg-base-100 text-base-content font-mono font-bold text-xl px-2 py-1 rounded border-2 border-base-content tracking-wider shadow-sm">
                  {{ machine().patente | uppercase }}
                </div>
              </div>

              <!-- Grilla de especificaciones -->
              <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col min-w-0">
                  <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                    MARCA
                  </span>
                  <span
                    class="text-xs font-medium text-base-content truncate"
                    [attr.title]="machine().marca"
                  >
                    {{ machine().marca }}
                  </span>
                </div>
                @if (machine().modelo) {
                  <div class="flex flex-col min-w-0">
                    <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                      MODELO
                    </span>
                    <span
                      class="text-xs font-medium text-base-content truncate"
                      [attr.title]="machine().modelo"
                    >
                      {{ machine().modelo }}
                    </span>
                  </div>
                }
                @if (year()) {
                  <div class="flex flex-col">
                    <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                      AÑO
                    </span>
                    <span class="text-xs font-medium text-base-content">
                      {{ year() }}
                    </span>
                  </div>
                }
                @if (machine().chofer_actual) {
                  <div class="flex flex-col min-w-0">
                    <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                      CHOFER
                    </span>
                    <span
                      class="text-xs font-medium text-base-content truncate"
                      [attr.title]="machine().chofer_actual!.nombre_completo"
                    >
                      {{ machine().chofer_actual!.nombre_completo }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Footer: Documentación -->
          <div class="mt-auto pt-2 border-t border-base-300">
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

      /* Efecto hover en la banda lateral tipo carnet */
      .carnet-strip {
        filter: brightness(1);
        transition: filter 0.3s ease, box-shadow 0.3s ease;
      }
      .group:hover .carnet-strip.bg-success-accent {
        filter: brightness(1.15);
        box-shadow: 0 0 12px oklch(var(--su) / 0.6);
      }
      .group:hover .carnet-strip.bg-warning-accent {
        filter: brightness(1.15);
        box-shadow: 0 0 12px oklch(var(--wa) / 0.6);
      }
      .group:hover .carnet-strip.bg-error-accent {
        filter: brightness(1.15);
        box-shadow: 0 0 12px oklch(var(--er) / 0.6);
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

  // Computed signal para acceder al año sin problemas de parsing en el template
  year = computed(() => {
    return this.machine().año || null;
  });
}
