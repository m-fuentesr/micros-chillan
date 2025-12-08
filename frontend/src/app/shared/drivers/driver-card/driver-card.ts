import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';
import { DriverIcon } from '../../components/driver-icon/driver-icon';

@Component({
  selector: 'app-driver-card',
  standalone: true,
  imports: [RouterLink, DriverIcon],
  template: `
    <!-- La tarjeta completa actúa como CTA principal -->
    <a 
      [routerLink]="['/choferes', driver().id]"
      class="block h-full no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 rounded-xl"
    >
      <div
        class="card bg-base-100 border border-base-200 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full flex group"
      >
        <!-- Banda lateral de estado (estilo carnet) -->
        <div
          class="w-2 flex-shrink-0 transition-all duration-300 carnet-strip"
          [class.bg-success-accent]="driver().estado === 'activo'"
          [class.bg-warning-accent]="driver().estado === 'inactivo'"
          aria-hidden="true"
        ></div>

        <div class="card-body p-4 flex flex-col justify-between flex-grow gap-3">
          <!-- Header: Nombre del conductor + Estado -->
          <div class="flex justify-between items-start border-b border-dashed border-base-300 pb-2">
            <div class="flex flex-col min-w-0 gap-1">
              <span class="text-[0.625rem] uppercase tracking-wider font-semibold text-base-content/60">
                CONDUCTOR
              </span>
              <span
                class="text-lg font-extrabold text-base-content leading-tight truncate"
                [attr.title]="driver().nombre_completo"
              >
                  {{ driver().nombre_completo }}
              </span>
              <!-- RUT como información secundaria discreta -->
              <span class="text-xs font-mono text-base-content/50" [attr.title]="driver().rut">
                  RUT: {{ driver().rut }}
              </span>
            </div>
            <span
              class="badge badge-sm font-semibold uppercase text-[0.65rem] tracking-wider flex-shrink-0"
                [class.badge-success]="driver().estado === 'activo'"
                [class.badge-warning]="driver().estado === 'inactivo'"
              >
                {{ driver().estado === 'activo' ? 'Activo' : 'Inactivo' }}
              </span>
          </div>

          <!-- Contenido principal: Avatar + Datos -->
          <div class="flex gap-4 flex-grow min-h-0">
            <!-- Avatar (80x80 = w-20 h-20) -->
            <div class="w-20 h-20 rounded-lg bg-base-200 flex-shrink-0 overflow-hidden border border-base-300 flex items-center justify-center group-hover:border-primary/30 transition-colors">
              <app-driver-icon class="w-full h-full p-2 text-primary" />
            </div>

            <!-- Datos: Especificaciones -->
            <div class="flex flex-col justify-between flex-grow min-w-0">
              <!-- Grilla de especificaciones -->
              <div class="grid grid-cols-2 gap-2">
                @if (driver().maquina_actual) {
                  <div class="flex flex-col min-w-0">
                    <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                      MÁQUINA
                    </span>
                    <span
                      class="text-xs font-medium text-base-content truncate"
                      [attr.title]="driver().maquina_actual!.identificador"
                    >
                      {{ driver().maquina_actual!.identificador }}
                    </span>
                  </div>
                }
                <div class="flex flex-col min-w-0">
                  <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                    CORREO
              </span>
                  <span
                    class="text-xs font-medium text-base-content truncate"
                    [attr.title]="driver().correo"
                  >
                {{ driver().correo }}
                  </span>
            </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-[0.5625rem] uppercase text-base-content/60 font-semibold">
                    TELÉFONO
              </span>
                  <span
                    class="text-xs font-medium text-base-content font-mono truncate"
                    [attr.title]="driver().telefono"
                  >
                {{ driver().telefono }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer: Estado de Licencia -->
          <div class="mt-auto pt-2 border-t border-base-300">
            <div class="text-[0.7rem] @xs:text-xs font-semibold text-base-content/60 mb-2">
              Estado de Licencia
            </div>
            <div class="flex flex-wrap gap-2 min-h-[1.75rem]">
              <span
                class="badge badge-outline badge-sm text-[0.7rem] font-medium px-2 py-1 rounded-full"
                [class.text-success]="licenseStatus().estado === 'ok'"
                [class.border-success-outline]="licenseStatus().estado === 'ok'"
                [class.text-warning]="licenseStatus().estado === 'warning'"
                [class.border-warning-outline]="licenseStatus().estado === 'warning'"
                [class.text-error]="licenseStatus().estado === 'error'"
                [class.border-error-outline]="licenseStatus().estado === 'error'"
              >
                @if (licenseStatus().estado === 'error') {
                  VENCIDA
                } @else if (licenseStatus().estado === 'warning') {
                  Vence en {{ licenseStatus().dias_restantes }} días
                } @else {
                  Vigente
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  `,
  styles: [
    `
      /* Colores de acento para la banda lateral usando tokens de DaisyUI */
      .bg-success-accent {
        background-color: oklch(var(--su) / 0.85);
      }
      .bg-warning-accent {
        background-color: oklch(var(--wa) / 0.85);
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverCard {
  driver = input.required<Driver>();

  licenseStatus = computed(() => {
    // Se asume que el segundo parámetro es el umbral de días para WARNING
    return calculateLicenseStatus(this.driver().fecha_venc_licencia, 30);
  });
}