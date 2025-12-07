import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  imports: [],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="card bg-base-100 shadow-xl page-entry-header">
        <div class="card-body">
          <h1 class="card-title text-3xl lg:text-4xl">Configuración</h1>
          <p class="text-base-content/70">
            Administra la identidad de la aplicación, notificaciones y parámetros globales.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Configuración General -->
        <div class="card bg-base-100 shadow-lg animate-card-enter">
          <div class="card-body space-y-4">
            <div>
              <h3 class="card-title">Configuración General</h3>
              <p class="text-sm text-base-content/70">
                Define los datos principales visibles para toda la organización.
              </p>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nombre de la aplicación</span>
              </label>
              <input type="text" placeholder="Nombre de la App" class="input input-bordered w-full" />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Correo de soporte</span>
              </label>
              <input type="email" placeholder="soporte@empresa.com" class="input input-bordered w-full" />
            </div>
          </div>
        </div>

        <!-- Configuración de Notificaciones -->
        <div class="card bg-base-100 shadow-lg animate-card-enter-delay-1">
          <div class="card-body space-y-4">
            <div>
              <h3 class="card-title">Notificaciones</h3>
              <p class="text-sm text-base-content/70">
                Activa los canales de alertas para documentos, mantenimientos y KPIs críticos.
              </p>
            </div>
            <div class="form-control">
              <label class="label cursor-pointer justify-between gap-4">
                <span class="label-text">Alertas por email</span>
                <input type="checkbox" class="toggle toggle-primary" checked />
              </label>
            </div>
            <div class="form-control">
              <label class="label cursor-pointer justify-between gap-4">
                <span class="label-text">Notificaciones push</span>
                <input type="checkbox" class="toggle toggle-primary" />
              </label>
            </div>
            <div class="form-control">
              <label class="label cursor-pointer justify-between gap-4">
                <span class="label-text">Alertas SMS</span>
                <input type="checkbox" class="toggle toggle-primary" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Configuracion {

}
