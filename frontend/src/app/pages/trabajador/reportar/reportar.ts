import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reportar',
  imports: [],
  template: `
    <main class="mobile-content pb-20">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Reporte de Hoy</h1>
        <div class="text-base-content/70 space-y-1">
          <p>Máquina Asignada: <span class="font-semibold">05</span></p>
          <p>Fecha: <span class="font-semibold">Viernes, 14 de Noviembre</span></p>
        </div>
        <div class="mt-3">
          <div role="alert" class="alert alert-warning py-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-sm">0 de 2 campos obligatorios completados</span>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h2 class="card-title mb-4">MÁQUINA DE REPORTE</h2>
          
          <div class="form-control space-y-4">
            <!-- Selección de máquina -->
            <div class="space-y-2">
              <label class="label">
                <span class="label-text font-semibold">Selecciona la máquina</span>
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button class="btn btn-primary">05<br><span class="text-xs">(Mi máquina asignada)</span></button>
                <button class="btn btn-outline">02</button>
                <button class="btn btn-outline">07</button>
              </div>
              <label class="label">
                <span class="label-text-alt text-base-content/70">Selecciona otra máquina solo si hoy no trabajaste con tu máquina asignada</span>
              </label>
            </div>

            <!-- Campos obligatorios -->
            <div class="divider">Campos Obligatorios</div>

            <div>
              <label class="label">
                <span class="label-text font-semibold">Monto Recaudado <span class="text-error">*</span></span>
              </label>
              <input type="number" placeholder="$0" class="input input-bordered w-full" />
            </div>

            <div>
              <label class="label">
                <span class="label-text font-semibold">Diésel Cargado (Litros) <span class="text-error">*</span></span>
              </label>
              <input type="number" placeholder="0 Lts" class="input input-bordered w-full" />
            </div>

            <!-- Campos opcionales -->
            <div class="divider">Campos Opcionales</div>

            <div>
              <label class="label">
                <span class="label-text font-semibold">Observaciones</span>
              </label>
              <textarea class="textarea textarea-bordered h-24" placeholder="Escribe tus observaciones aquí..."></textarea>
            </div>

            <button class="btn btn-primary w-full mt-4" (click)="enviarReporte()">Enviar Reporte</button>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reportar {
  private router = inject(Router);

  enviarReporte() {
    // Aquí iría la lógica para enviar el reporte
    // Por ahora, redirigimos a la página de éxito
    this.router.navigate(['/trabajador/reporte-exito']);
  }
}
