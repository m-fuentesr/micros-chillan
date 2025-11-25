import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-mi-historial',
  standalone: true,
  template: `
    <main class="mobile-content pb-20 space-y-4">
      <header class="card bg-primary text-primary-content shadow-lg">
        <div class="card-body p-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-xs uppercase tracking-widest opacity-80">Resumen general</p>
              <h1 class="text-2xl font-bold">Mi Historial</h1>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-80">Máquina 05</p>
              <p class="text-xl font-bold">$1.375.000</p>
            </div>
          </div>
        </div>
      </header>

      <section class="bg-base-100 rounded-xl shadow border border-base-200 overflow-hidden">
        <div class="tabs tabs-boxed bg-base-200 p-1">
          <a class="tab tab-active text-xs font-bold">Esta Semana (3)</a>
          <a class="tab text-xs">Este Mes (9)</a>
          <a class="tab text-xs">Mes Anterior (3)</a>
        </div>
        <div class="p-4 space-y-3">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="font-bold text-base">Mar 18 Nov</h3>
                  <p class="text-xs text-base-content/60">Recaudado $475.000</p>
                </div>
                <span class="badge badge-success badge-sm">Procesado</span>
              </div>
              <p class="text-sm text-base-content/70">Diésel 42 Lts • $29.400</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="font-bold text-base">Lun 17 Nov</h3>
                  <p class="text-xs text-base-content/60">Recaudado $450.000</p>
                </div>
                <span class="badge badge-success badge-sm">Procesado</span>
              </div>
              <p class="text-sm text-base-content/70">Diésel sin carga</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="font-bold text-base">Dom 16 Nov</h3>
                  <p class="text-xs text-base-content/60">Recaudado $450.000</p>
                </div>
                <span class="badge badge-success badge-sm">Procesado</span>
              </div>
              <p class="text-sm text-base-content/70">Diésel registrado</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiHistorial {}
