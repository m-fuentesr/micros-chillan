import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-choferes',
  imports: [],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header -->
      <div class="animate-header-enter">
        <h1 class="text-4xl font-bold mb-2">Choferes</h1>
        <p class="text-base-content/70">
          Gestión integral de los operadores de la flota: credenciales, documentación y rendimiento.
        </p>
      </div>

      <!-- Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-100 shadow-xl animate-card-enter">
          <div class="card-body space-y-2">
            <h2 class="card-title text-2xl">Panel General</h2>
            <p class="text-base-content/70">
              Consolida la información clave de cada chofer y agiliza las tareas administrativas.
            </p>
            <ul class="text-sm text-base-content/80 space-y-1">
              <li>• Control de licencias y certificaciones.</li>
              <li>• Historial de asignaciones y desempeño.</li>
              <li>• Accesos al portal de reportes diarios.</li>
            </ul>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl animate-card-enter-delay-1">
          <div class="card-body space-y-2">
            <h2 class="card-title text-2xl">Próximas Secciones</h2>
            <p class="text-base-content/70">
              Este módulo pronto incluirá formularios dinámicos, filtros avanzados y evaluaciones.
            </p>
            <div class="badge badge-outline">En desarrollo</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Choferes {}
