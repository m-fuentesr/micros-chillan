import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-perfil',
  imports: [],
  template: `
    <main class="mobile-content pb-20">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-4">Mi Perfil</h1>
        
        <!-- Avatar y nombre -->
        <div class="flex items-center gap-4 mb-6">
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-16">
              <span class="text-2xl font-bold">JP</span>
            </div>
          </div>
          <div>
            <h2 class="text-xl font-bold">Juan Pérez</h2>
            <p class="text-base-content/70">Chofer</p>
          </div>
        </div>
      </div>

      <!-- Información Personal -->
      <div class="card bg-base-100 shadow-md mb-4">
        <div class="card-body">
          <h3 class="card-title mb-4">INFORMACIÓN PERSONAL</h3>
          
          <div class="space-y-4">
            <div>
              <label class="label">
                <span class="label-text font-semibold">RUT</span>
              </label>
              <p class="text-base-content">12.345.678-9</p>
            </div>

            <div>
              <label class="label">
                <span class="label-text font-semibold">Teléfono</span>
              </label>
              <p class="text-base-content">+56 9 1234 5678</p>
            </div>

            <div>
              <label class="label">
                <span class="label-text font-semibold">Email</span>
              </label>
              <p class="text-base-content">juan.perez@example.com</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Información Laboral -->
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h3 class="card-title mb-4">INFORMACIÓN LABORAL</h3>
          
          <div class="space-y-4">
            <div>
              <label class="label">
                <span class="label-text font-semibold">Máquina Asignada</span>
              </label>
              <p class="text-base-content">05 - Mercedes-Benz</p>
            </div>

            <div>
              <label class="label">
                <span class="label-text font-semibold">Fecha de Ingreso</span>
              </label>
              <p class="text-base-content">15 de Enero de 2024</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Perfil {

}
