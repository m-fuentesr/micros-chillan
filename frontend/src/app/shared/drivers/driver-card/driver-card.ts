import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';

@Component({
  selector: 'app-driver-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- La tarjeta completa es un enlace (CTA principal) que se eleva y escala en hover -->
    <a 
      [routerLink]="['/choferes', driver().id]"
      class="driver-card-link block h-full no-underline"
    >
      <div class="card bg-white border border-gray-100 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full">
        
        <!-- Background Accent: Barra de Estado (Activo/Inactivo) -->
        <div 
          class="h-2 w-full absolute top-0 left-0"
          [class.bg-success-accent]="driver().estado === 'activo'"
          [class.bg-warning-accent]="driver().estado === 'inactivo'"
        ></div>

        <div class="card-body p-6 pt-4 flex flex-col justify-between h-full">
          
          <!-- SECCIÓN SUPERIOR: Identidad y Estado de la Licencia (Reputación) -->
          <div class="flex justify-between items-start mb-4">
            
            <!-- Avatar Compacto y Nombre Principal -->
            <div class="flex items-center space-x-3 min-w-0">
              
              <!-- Avatar de Iniciales (Más pequeño y integrado) -->
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                <span class="text-lg font-bold text-primary">{{ getInitials() }}</span>
              </div>

              <div class="flex flex-col min-w-0">
                <!-- Nombre Completo - Título Principal (Mayor jerarquía) -->
                <h3 class="text-xl font-extrabold text-gray-900 truncate" [attr.title]="driver().nombre_completo">
                  {{ driver().nombre_completo }}
                </h3>
                <!-- RUT - Metadato Secundario -->
                <p class="text-xs text-gray-500 truncate font-mono" [attr.title]="driver().rut">
                  RUT: {{ driver().rut }}
                </p>
              </div>
            </div>

            <!-- Badge de Estado (Activo/Inactivo) -->
            <div class="flex-shrink-0 mt-1">
              <span class="badge badge-sm font-semibold uppercase text-xs tracking-wider"
                [class.badge-success]="driver().estado === 'activo'"
                [class.badge-warning]="driver().estado === 'inactivo'"
              >
                {{ driver().estado === 'activo' ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <!-- SECCIÓN CENTRAL: Afiliación y Contacto -->
          <div class="space-y-3 mb-4">
            
            <!-- Máquina Asignada (Afiliación) -->
            <div class="flex items-center text-sm">
              <span class="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M7.8 7.8c.412.181.84.288 1.282.328 1.45.13 2.584 1.4 2.584 2.923v1.897c0 1.24-.755 2.302-1.85 2.75l-.26.104c-.347.139-.718.21-1.092.21-.498 0-.98-.12-1.42-.358L7.488 15.65c-.27-.145-.52-.313-.75-.5.064-.097.108-.21.108-.337v-.004a.75.75 0 0 1 .472-.693.75.75 0 0 1 .773.34l.275.48c.28.49.882.684 1.45.503.353-.11.66-.367.873-.728.318-.544.119-1.25-.436-1.574l-.458-.262c-.93-.532-1.402-1.57-1.402-2.735v-1.92c0-1.785 1.464-3.235 3.254-3.235 1.51 0 2.804 1.05 3.178 2.5.034.135.05.275.05.415v1.897c0 1.24-.755 2.302-1.85 2.75l-.26.104c-.347.139-.718.21-1.092.21-.498 0-.98-.12-1.42-.358L7.488 15.65c-.27-.145-.52-.313-.75-.5l.024.036c.264-.403.415-.86.447-1.332.062-.924-.316-1.822-1.082-2.48l-.025-.022ZM3.75 6.75C3.75 5.517 4.517 4.75 5.75 4.75h12.5c1.233 0 2 .767 2 2v10.5c0 1.233-.767 2-2 2H5.75c-1.233 0-2-.767-2-2V6.75Z"/>
                </svg>
              </span>
              @if (driver().maquina_actual) {
                <p class="ml-2 text-gray-700 font-medium truncate" [attr.title]="driver().maquina_actual!.identificador">
                  Máquina: <span class="text-primary font-bold">{{ driver().maquina_actual!.identificador }}</span>
                </p>
              } @else {
                <p class="ml-2 text-gray-400 italic">
                  Máquina: Sin asignar
                </p>
              }
            </div>

            <!-- Correo (Contacto) -->
            <div class="flex items-center text-sm">
              <span class="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M1.5 8.67v8.586a2.25 2.25 0 0 0 2.25 2.25h16.5a2.25 2.25 0 0 0 2.25-2.25V8.67M1.5 8.67l10.5 5.25 10.5-5.25M3.75 6.75h16.5a2.25 2.25 0 0 1 2.25 2.25v.42M1.5 8.67V6.75a2.25 2.25 0 0 1 2.25-2.25h16.5a2.25 2.25 0 0 1 2.25 2.25v1.92"/>
                </svg>
              </span>
              <p class="ml-2 text-gray-600 truncate" [attr.title]="driver().correo">
                {{ driver().correo }}
              </p>
            </div>
            
             <!-- Teléfono (Contacto) -->
            <div class="flex items-center text-sm">
              <span class="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h15a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3v-15ZM8.25 18a.75.75 0 0 1-.75-.75V8.25a.75.75 0 0 1 1.5 0v8.25a.75.75 0 0 1-.75.75ZM12 18a.75.75 0 0 1-.75-.75V8.25a.75.75 0 0 1 1.5 0v8.25a.75.75 0 0 1-.75.75ZM15.75 18a.75.75 0 0 1-.75-.75V8.25a.75.75 0 0 1 1.5 0v8.25a.75.75 0 0 1-.75.75Z" clip-rule="evenodd" />
                </svg>
              </span>
              <p class="ml-2 text-gray-600 font-mono" [attr.title]="driver().telefono">
                {{ driver().telefono }}
              </p>
            </div>
          </div>
          
          <!-- SECCIÓN INFERIOR: Licencia (Reputación Crítica) -->
          <div>
            <div class="text-xs font-semibold text-gray-500 mb-2">Estado de Licencia</div>
            <div class="flex flex-wrap gap-2">
              
              <!-- Píldora de Licencia con color semántico y mensaje detallado -->
              <span class="badge badge-sm text-xs font-medium px-2 py-1 rounded-full"
                [class.bg-error-outline]="licenseStatus().estado === 'error'"
                [class.text-error-dark]="licenseStatus().estado === 'error'"
                [class.border-error-dark]="licenseStatus().estado === 'error'"

                [class.bg-warning-outline]="licenseStatus().estado === 'warning'"
                [class.text-warning-dark]="licenseStatus().estado === 'warning'"
                [class.border-warning-dark]="licenseStatus().estado === 'warning'"

                [class.bg-success-outline]="licenseStatus().estado === 'ok'"
                [class.text-success-dark]="licenseStatus().estado === 'ok'"
                [class.border-success-dark]="licenseStatus().estado === 'ok'"
              >
                @if (licenseStatus().estado === 'error') {
                  VENCIDA
                } @else if (licenseStatus().estado === 'warning') {
                  Vence en {{ licenseStatus().dias_restantes }} días
                } @else {
                  Vigente (OK)
                }
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </a>
  `,
  styles: [`
    /* Colores de acento para la barra superior, asumiendo variables de DaisyUI/Tailwind */
    .bg-success-accent { background-color: oklch(var(--su) / 0.8); }
    .bg-warning-accent { background-color: oklch(var(--wa) / 0.8); }
    .bg-error-accent { background-color: oklch(var(--er) / 0.8); }

    /* Definición de colores de Píldoras para mejor contraste y legibilidad */
    .badge {
      border: 1px solid transparent; /* Base para el estilo outline */
    }
    
    /* Estado ERROR: Vencida */
    .bg-error-outline { background-color: oklch(var(--er) / 0.1); }
    .text-error-dark { color: oklch(var(--er)); }
    .border-error-dark { border-color: oklch(var(--er)); }

    /* Estado WARNING: Por vencer */
    .bg-warning-outline { background-color: oklch(var(--wa) / 0.1); }
    .text-warning-dark { color: oklch(var(--wa)); }
    .border-warning-dark { border-color: oklch(var(--wa)); }

    /* Estado OK: Vigente */
    .bg-success-outline { background-color: oklch(var(--su) / 0.1); }
    .text-success-dark { color: oklch(var(--su)); }
    .border-success-dark { border-color: oklch(var(--su)); }

    /* Efecto hover en la tarjeta */
    .card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-xl */
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverCard {
  driver = input.required<Driver>();

  licenseStatus = computed(() => {
    // Se asume que el segundo parámetro es el umbral de días para WARNING
    return calculateLicenseStatus(this.driver().fecha_venc_licencia, 30);
  });

  getInitials(): string {
    const name = this.driver().nombre_completo;
    const parts = name.split(' ').filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      // Usa la primera letra del primer nombre y el primer apellido
      const firstNameInitial = parts[0].charAt(0);
      let lastNameInitial = '';
      
      // Busca el primer apellido (el último elemento si no es 'de', 'la', etc.)
      for (let i = parts.length - 1; i > 0; i--) {
        const part = parts[i].toLowerCase();
        if (!['de', 'la', 'del', 'y', 'e'].includes(part)) {
          lastNameInitial = parts[i].charAt(0);
          break;
        }
      }
      
      return (firstNameInitial + lastNameInitial).toUpperCase();
    }
    
    // Fallback: primeras dos letras del nombre
    return name.substring(0, 2).toUpperCase();
  }
}