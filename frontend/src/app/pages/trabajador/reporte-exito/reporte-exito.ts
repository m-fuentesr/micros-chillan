import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reporte-exito',
  imports: [RouterLink],
  template: `
    <main class="mobile-content pb-20 flex flex-col items-center justify-center text-center min-h-[60dvh]">
      <div class="card bg-base-100 shadow-xl max-w-md w-full">
        <div class="card-body items-center text-center">
          <!-- Icono de éxito -->
          <div class="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 class="text-2xl font-bold mb-2">¡Reporte Enviado!</h1>
          <p class="text-base-content/70 mb-6">Tu reporte de hoy ha sido enviado exitosamente.</p>

          <!-- Resumen del reporte -->
          <div class="card bg-base-200 w-full mb-6">
            <div class="card-body p-4">
              <h2 class="card-title text-lg mb-4">RESUMEN DE TU REPORTE</h2>
              
              <div class="space-y-3 text-left">
                <div class="flex justify-between">
                  <span class="text-base-content/70">Monto Recaudado</span>
                  <span class="font-semibold">$123.123</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Diésel Cargado</span>
                  <span class="font-semibold">13231 Lts</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Fecha</span>
                  <span class="font-semibold">Viernes, 14 Nov</span>
                </div>
              </div>
            </div>
          </div>

          <a routerLink="/trabajador" class="btn btn-primary w-full">Volver al Inicio</a>
        </div>
      </div>
    </main>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReporteExito {

}
