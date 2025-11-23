import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';

@Component({
  selector: 'app-driver-card',
  imports: [RouterLink],
  template: `
    <div class="card bg-base-100 shadow-xl hover-lift relative">
      <div class="card-body flex flex-col items-center text-center p-6">
        <!-- Estado/RUT en esquina superior derecha -->
        <div class="absolute top-4 right-4">
          <span class="badge badge-sm font-semibold break-all max-w-[80px] truncate" [attr.data-tip]="driver().rut">
            {{ driver().rut }}
          </span>
        </div>

        <!-- Avatar circular grande centrado -->
        <div class="relative mb-4">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-base-200">
            <span class="text-3xl font-bold text-primary">{{ getInitials() }}</span>
          </div>
          
          <!-- Tag de disponibilidad (esquina superior izquierda del avatar) -->
          <div class="absolute -top-1 -left-1">
            <span class="badge badge-xs"
              [class.badge-success]="driver().estado === 'activo'"
              [class.badge-warning]="driver().estado === 'inactivo'">
              @if (driver().estado === 'activo') {
                Activo
              } @else {
                Inactivo
              }
            </span>
          </div>
        </div>

        <!-- Nombre -->
        <h3 class="text-xl font-bold mb-1 truncate w-full" [attr.data-tip]="driver().nombre_completo">
          {{ driver().nombre_completo }}
        </h3>

        <!-- Título/Profesión (Correo) -->
        <p class="text-sm text-base-content/70 mb-2 truncate w-full" [attr.data-tip]="driver().correo">
          {{ driver().correo }}
        </p>

        <!-- Afiliación (Máquina) -->
        <p class="text-xs text-base-content/60 mb-4 truncate w-full" [attr.data-tip]="driver().maquina_actual?.identificador || 'Sin asignar'">
          @if (driver().maquina_actual) {
            <span class="flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V17C20 17.5523 19.5523 18 19 18H5C4.44772 18 4 17.5523 4 17V7Z"/>
                <path d="M4 10H20"/>
              </svg>
              {{ driver().maquina_actual?.identificador }}
            </span>
          } @else {
            <span class="text-base-content/40">Sin máquina asignada</span>
          }
        </p>

        <!-- Skills/Tags (Licencia) -->
        <div class="flex flex-wrap gap-1.5 justify-center mb-4 min-h-[2rem]">
          @if (licenseStatus().estado === 'error') {
            <span class="badge badge-sm badge-error">
              Licencia Vencida
            </span>
          } @else if (licenseStatus().estado === 'warning') {
            <span class="badge badge-sm badge-warning">
              Licencia por Vencer
            </span>
          } @else {
            <span class="badge badge-sm badge-success">
              Licencia al Día
            </span>
          }
        </div>

        <!-- Bio corta (Teléfono) -->
        <p class="text-xs text-base-content/50 mb-4 break-all">
          <span class="font-mono font-semibold">{{ driver().telefono }}</span>
        </p>

        <!-- Botón de acción -->
        <a 
          [routerLink]="['/choferes', driver().id]" 
          class="btn btn-outline btn-primary btn-sm w-full hover-scale">
          Ver Detalle
        </a>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverCard {
  driver = input.required<Driver>();

  licenseStatus = computed(() => {
    return calculateLicenseStatus(this.driver().fecha_venc_licencia, 30);
  });

  getInitials(): string {
    const parts = this.driver().nombre_completo.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return this.driver().nombre_completo.substring(0, 2).toUpperCase();
  }
}

