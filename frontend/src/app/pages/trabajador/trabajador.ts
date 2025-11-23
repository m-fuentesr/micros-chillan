import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trabajador',
  imports: [RouterLink],
  template: `
    <main class="mobile-content pb-20">
      <!-- Bienvenida -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">BIENVENIDO DE VUELTA</h1>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl font-semibold">Juan Pérez</span>
          <span class="text-2xl">🚛</span>
        </div>
        <div class="flex items-center gap-2 text-base-content/70">
          <span class="font-medium">Máquina 05</span>
          <span class="text-lg">📅</span>
          <span>Vie, 14 Nov</span>
        </div>
      </div>

      <!-- Actividad Reciente -->
      <div class="space-y-4 mb-6">
        <h2 class="text-xl font-bold">ACTIVIDAD RECIENTE</h2>
        
        <!-- Reporte de ayer enviado -->
        <div role="alert" class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold">Reporte de ayer enviado</h3>
            <div class="text-xs">Hace 2 horas</div>
          </div>
        </div>

        <!-- Nueva asignación -->
        <div role="alert" class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold">Nueva asignación: Máquina 05</h3>
            <div class="text-xs">Hace 1 día</div>
          </div>
        </div>

        <!-- Alerta de licencia -->
        <div role="alert" class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold">Alerta: Tu licencia vence en 15 días</h3>
            <div class="text-xs">Renueva tu licencia antes del vencimiento</div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="cta-section card bg-primary text-primary-content shadow-lg">
        <div class="card-body p-4 text-center">
          <p class="mb-3 font-medium">Tu reporte de hoy está pendiente.</p>
          <a routerLink="/trabajador/reportar" class="btn btn-secondary w-full">INGRESAR REPORTE DE HOY</a>
        </div>
      </div>
    </main>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Trabajador {

}
