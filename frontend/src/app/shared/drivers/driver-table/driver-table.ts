import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';
import { DriverIcon } from '../../components/driver-icon/driver-icon';

@Component({
  selector: 'app-driver-table',
  imports: [RouterLink, DriverIcon],
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
                    <div class="w-12 h-12 rounded-lg bg-base-200 flex-shrink-0 overflow-hidden border border-base-300 flex items-center justify-center">
                      <app-driver-icon class="w-full h-full p-1.5 text-base-content/60" />
                    </div>
                    <!-- Datos: Nombre y Correo -->
                    <div class="flex flex-col gap-1 flex-grow min-w-0">
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
                <td colspan="6" class="py-16 sm:py-20">
                  <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
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
    return calculateLicenseStatus(driver.fecha_venc_licencia, 30);
  }
}






