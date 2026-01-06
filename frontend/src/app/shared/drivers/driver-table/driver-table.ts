import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus, formatLicenseExpiredText, formatLicenseWarningText } from '../../utils/license.utils';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-driver-table',
  imports: [RouterLink, UiIconComponent],
  template: `
    <div class="overflow-x-auto rounded-lg border border-base-200 bg-base-100">
      <div class="inline-block min-w-full align-middle">
        <table class="table w-full min-w-[1100px]">
          <thead>
            <tr class="bg-base-200/50">
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Chofer</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">RUT</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Máquina Asignada</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Estado</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap">Licencia</th>
              <th class="text-xs font-semibold text-base-content/70 uppercase tracking-wider whitespace-nowrap text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (driver of drivers(); track driver.id) {
              <tr class="hover:bg-base-200/30 transition-colors duration-150">
                <td class="min-w-[170px] py-4">
                  <div class="flex gap-3 items-center">
                    <!-- Avatar del chofer -->
                    <div class="w-12 h-12 rounded-lg bg-base-200 shrink-0 overflow-hidden border border-base-300 flex items-center justify-center">
                      <ui-icon name="IdCard" size="lg" class="text-primary" />
                    </div>
                    <!-- Datos: Nombre y Correo -->
                    <div class="flex flex-col gap-1 grow min-w-0">
                      <span class="text-sm font-semibold text-base-content truncate tooltip" [attr.data-tip]="driver.nombre_completo">{{ driver.nombre_completo }}</span>
                      <span class="text-xs text-base-content/70 truncate tooltip" [attr.data-tip]="driver.correo">{{ driver.correo }}</span>
                    </div>
                  </div>
                </td>
                <td class="min-w-[110px] py-4">
                  <span class="text-sm text-base-content break-all tooltip" [attr.data-tip]="driver.rut">{{ driver.rut }}</span>
                </td>
                <td class="min-w-[110px] py-4">
                  <span class="text-sm text-base-content truncate block tooltip" [attr.data-tip]="driver.maquina_actual?.identificador || 'Sin asignar'">
                    {{ driver.maquina_actual?.identificador || 'Sin asignar' }}
                  </span>
                </td>
                <td class="whitespace-nowrap py-4">
                  <span class="badge badge-sm font-medium"
                    [class.badge-success]="driver.estado === 'activo'"
                    [class.badge-warning]="driver.estado === 'inactivo'">
                    {{ driver.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="min-w-[130px] py-4">
                  @if (getLicenseStatus(driver).estado === 'error') {
                    <span class="badge badge-sm badge-error whitespace-nowrap font-medium">{{ getLicenseStatus(driver).texto }}</span>
                  } @else if (getLicenseStatus(driver).estado === 'warning') {
                    <span class="badge badge-sm badge-warning whitespace-nowrap font-medium">{{ getLicenseStatus(driver).texto }}</span>
                  } @else {
                    <span class="badge badge-sm badge-success whitespace-nowrap font-medium">{{ getLicenseStatus(driver).texto }}</span>
                  }
                </td>
                <td class="whitespace-nowrap py-4 text-right">
                  <a 
                    [routerLink]="['/choferes', driver.id]" 
                    class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-focus text-primary-content px-2.5 py-1.5 rounded-lg shadow-sm border border-primary/20 transition-all text-xs font-medium active:scale-95">
                    <ui-icon name="Settings" size="xs" />
                    <span>Gestionar</span>
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="py-16 sm:py-20">
                  <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                      <ui-icon name="Users" size="lg" class="text-base-content/40" />
                    </div>
                    <div class="space-y-2">
                      <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay choferes coincidentes</h3>
                      <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                        Ajusta los filtros para ver más resultados o registra un nuevo chofer.
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
export class DriverTable {
  drivers = input.required<Driver[]>();

  getLicenseStatus(driver: Driver) {
    if (driver.licencia_estado) {
      const estado = driver.licencia_estado.estado === 'danger' ? 'error' : driver.licencia_estado.estado;
      const dias = driver.licencia_estado.dias_restantes;
      return {
        fecha: driver.licencia_estado.fecha_vencimiento,
        estado,
        dias_restantes: dias,
        texto: estado === 'error'
          ? formatLicenseExpiredText(dias)
          : estado === 'warning'
            ? formatLicenseWarningText(dias)
            : 'Al día'
      };
    }
    return calculateLicenseStatus(driver.fecha_venc_licencia);
  }
}






