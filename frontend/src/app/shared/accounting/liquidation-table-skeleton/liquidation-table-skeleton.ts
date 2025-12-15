import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton personalizado para la tabla de liquidación que coincide exactamente
 * con la estructura real de la tabla de liquidación.
 */
@Component({
  selector: 'app-liquidation-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200">
      <div class="card-body p-4 sm:p-6">
        
        <!-- Header con Resumen Activo (Skeleton) -->
        <div class="space-y-4 mb-6">
          <!-- Primera fila: Título, Selector de Período y Resumen de Nómina -->
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div class="flex-1">
              <div class="h-7 w-48 bg-base-200 rounded animate-pulse mb-2"></div>
              <div class="h-4 w-64 bg-base-200 rounded animate-pulse"></div>
            </div>
            
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <!-- Selector de Período (Skeleton) -->
              <div class="w-full sm:w-auto">
                <div class="h-10 w-40 bg-base-200 rounded-xl animate-pulse"></div>
              </div>

              <!-- Resumen Total Nómina (Skeleton) -->
              <div class="h-16 w-48 bg-base-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <!-- Segunda fila: Botones de Semanas (Skeleton) -->
          <div class="flex flex-col gap-2">
            <div class="h-3 w-32 bg-base-200 rounded animate-pulse"></div>
            <div class="h-10 w-full bg-base-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <!-- Vista Desktop: Tabla (solo XL y mayores) -->
        <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-200/50 border-b border-base-200">
              <tr>
                <th class="pl-6 w-1/4">
                  <div class="h-3 w-24 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left">
                  <div class="h-3 w-28 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left">
                  <div class="h-3 w-24 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left w-40">
                  <div class="h-3 w-32 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left bg-base-200">
                  <div class="h-3 w-20 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left bg-base-200">
                  <div class="h-3 w-16 bg-base-300 rounded animate-pulse"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (i of [1,2,3,4,5,6]; track i) {
                <tr class="border-b border-base-100 last:border-none">
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-base-200 animate-pulse"></div>
                      <div class="flex flex-col gap-2">
                        <div class="h-4 w-32 bg-base-200 rounded animate-pulse"></div>
                        <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td class="text-left">
                    <div class="h-4 w-24 bg-base-200 rounded animate-pulse"></div>
                  </td>
                  <td class="text-left">
                    <div class="flex flex-col gap-2">
                      <div class="h-3 w-28 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-6 w-16 bg-base-200 rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td class="text-left">
                    <div class="h-8 w-24 bg-base-200 rounded animate-pulse ml-auto"></div>
                  </td>
                  <td class="text-left bg-base-50/50">
                    <div class="h-5 w-28 bg-base-200 rounded animate-pulse"></div>
                  </td>
                  <td class="pr-6 bg-base-50/50 text-center">
                    <div class="h-8 w-24 bg-base-200 rounded animate-pulse mx-auto"></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Vista Móvil y Tablet: Tarjetas (hasta XL) -->
        <div class="xl:hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="bg-base-100 border border-base-200 rounded-xl p-4 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-base-200 animate-pulse"></div>
                    <div class="flex flex-col gap-2">
                      <div class="h-5 w-32 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div class="h-6 w-16 bg-base-200 rounded animate-pulse"></div>
                </div>
                <div class="bg-base-50 rounded-lg p-3 space-y-2">
                  <div class="flex justify-between">
                    <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
                    <div class="h-4 w-20 bg-base-200 rounded animate-pulse"></div>
                  </div>
                  <div class="flex justify-between">
                    <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                    <div class="h-4 w-16 bg-base-200 rounded animate-pulse"></div>
                  </div>
                  <div class="flex justify-between">
                    <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
                    <div class="h-4 w-20 bg-base-200 rounded animate-pulse"></div>
                  </div>
                  <div class="border-t border-base-200 my-2"></div>
                  <div class="flex justify-between">
                    <div class="h-4 w-16 bg-base-200 rounded animate-pulse"></div>
                    <div class="h-6 w-24 bg-base-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div class="h-10 w-full bg-base-200 rounded-lg animate-pulse mt-4"></div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiquidationTableSkeleton {
  isExiting = input<boolean>(false);
}

