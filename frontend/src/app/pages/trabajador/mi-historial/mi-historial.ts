import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-mi-historial',
  imports: [],
  template: `
    <header class="history-header bg-primary text-primary-content p-4 mb-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Mi Historial</h1>
        <div class="text-right">
          <p class="text-sm opacity-80">Máquina 05</p>
          <p class="text-xl font-bold">$1.375.000</p>
        </div>
      </div>
    </header>

    <nav class="filter-tabs bg-base-100 border-b border-base-300" role="tablist">
      <div class="flex overflow-x-auto">
        <button class="tab tab-bordered tab-active flex-shrink-0 px-4 py-3">Esta Semana (3)</button>
        <button class="tab tab-bordered flex-shrink-0 px-4 py-3">Este Mes (9)</button>
        <button class="tab tab-bordered flex-shrink-0 px-4 py-3">Mes Anterior (3)</button>
        <button class="tab tab-bordered flex-shrink-0 px-4 py-3">Todo (12)</button>
      </div>
    </nav>

    <main class="mobile-content pb-20 pt-2 relative">
      <div class="space-y-4">
        <!-- Semana 47 -->
        <div class="card bg-base-100 shadow-md">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="text-2xl">⟳</span>
                <div>
                  <h3 class="font-bold text-lg">SEMANA 47 - NOVIEMBRE</h3>
                  <p class="text-sm text-base-content/70">Total: $1.375.000</p>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <!-- Reporte Mar 18 Nov -->
              <div role="alert" class="alert alert-success border-l-4 border-success pl-3 py-2">
                <div class="flex-1">
                  <div class="flex justify-between items-start mb-1">
                    <div>
                      <p class="font-semibold">Mar 18 Nov</p>
                      <span class="badge badge-success badge-sm">PROCESADO</span>
                    </div>
                  </div>
                  <p class="text-sm text-base-content/70">Recaudado $475.000</p>
                  <p class="text-sm text-base-content/70">Diésel 42 Lts • $29.400</p>
                </div>
              </div>

              <!-- Reporte Lun 17 Nov -->
              <div role="alert" class="alert alert-success border-l-4 border-success pl-3 py-2">
                <div class="flex-1">
                  <div class="flex justify-between items-start mb-1">
                    <div>
                      <p class="font-semibold">Lun 17 Nov</p>
                      <span class="badge badge-success badge-sm">PROCESADO</span>
                    </div>
                  </div>
                  <p class="text-sm text-base-content/70">Recaudado $450.000</p>
                  <p class="text-sm text-base-content/70">Diésel Sin carga</p>
                </div>
              </div>

              <!-- Reporte Dom 16 Nov -->
              <div role="alert" class="alert alert-success border-l-4 border-success pl-3 py-2">
                <div class="flex-1">
                  <div class="flex justify-between items-start mb-1">
                    <div>
                      <p class="font-semibold">Dom 16 Nov</p>
                      <span class="badge badge-success badge-sm">PROCESADO</span>
                    </div>
                  </div>
                  <p class="text-sm text-base-content/70">Recaudado $450.000</p>
                  <p class="text-sm text-base-content/70">Diésel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiHistorial {

}
