import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';

@Component({
  selector: 'app-driver-table',
  imports: [RouterLink],
  template: `
    <div class="overflow-x-auto">
      <div class="inline-block min-w-full align-middle">
        <table class="table table-zebra w-full min-w-[800px]">
          <thead>
            <tr>
              <th class="whitespace-nowrap">Chofer</th>
              <th class="whitespace-nowrap">RUT</th>
              <th class="whitespace-nowrap">Máquina Asignada</th>
              <th class="whitespace-nowrap">Estado</th>
              <th class="whitespace-nowrap">Licencia</th>
              <th class="whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (driver of drivers(); track driver.id) {
              <tr>
                <td class="min-w-[150px]">
                  <div class="font-bold truncate block tooltip" [attr.data-tip]="driver.nombre_completo">{{ driver.nombre_completo }}</div>
                  <div class="text-sm text-base-content/70 truncate block tooltip" [attr.data-tip]="driver.correo">{{ driver.correo }}</div>
                </td>
                <td class="min-w-[120px] break-all">
                  <span class="tooltip" [attr.data-tip]="driver.rut">{{ driver.rut }}</span>
                </td>
                <td class="min-w-[120px]">
                  <span class="truncate block tooltip" [attr.data-tip]="driver.maquina_actual?.identificador || 'Sin asignar'">{{ driver.maquina_actual?.identificador || 'Sin asignar' }}</span>
                </td>
                <td class="whitespace-nowrap">
                  <span class="badge"
                    [class.badge-success]="driver.estado === 'activo'"
                    [class.badge-warning]="driver.estado === 'inactivo'">
                    {{ driver.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="min-w-[150px]">
                  @if (getLicenseStatus(driver).estado === 'error') {
                    <span class="badge badge-error whitespace-nowrap">{{ getLicenseStatus(driver).texto }}</span>
                  } @else if (getLicenseStatus(driver).estado === 'warning') {
                    <span class="badge badge-warning whitespace-nowrap">{{ getLicenseStatus(driver).texto }}</span>
                  } @else {
                    <span class="badge badge-success whitespace-nowrap">{{ getLicenseStatus(driver).texto }}</span>
                  }
                </td>
                <td class="whitespace-nowrap">
                  <a [routerLink]="['/choferes', driver.id]" class="btn btn-secondary btn-sm">
                    Gestionar
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-left py-8 pl-4 border-l-4 border-l-primary">
                  <div class="flex flex-col items-start gap-2">
                    <div class="text-4xl opacity-50">👤</div>
                    <h3 class="font-bold">No hay choferes coincidentes</h3>
                    <p class="text-sm text-base-content/70 italic">
                      Ajusta los filtros o registra un nuevo chofer.
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
export class DriverTable {
  drivers = input.required<Driver[]>();

  getLicenseStatus(driver: Driver) {
    return calculateLicenseStatus(driver.fecha_venc_licencia, 30);
  }
}






