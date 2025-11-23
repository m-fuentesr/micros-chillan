import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  imports: [],
  template: `
    <div class="space-y-6">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-3xl">Configuración</h2>
          <p>Gestiona la configuración general de la aplicación.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Configuración General -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Configuración General</h3>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nombre de la aplicación</span>
              </label>
              <input type="text" placeholder="Nombre de la App" class="input input-bordered w-full" />
            </div>
          </div>
        </div>

        <!-- Configuración de Notificaciones -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title">Notificaciones</h3>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Alertas por email</span>
                <input type="checkbox" class="toggle toggle-primary" checked />
              </label>
            </div>
            <div class="form-control mt-4">
              <label class="label cursor-pointer">
                <span class="label-text">Notificaciones push</span>
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
