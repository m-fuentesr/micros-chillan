import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton personalizado para la tabla de cuentas corrientes que coincide exactamente
 * con la estructura real de la tabla del ledger.
 */
@Component({
  selector: 'app-ledger-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200 rounded-3xl overflow-hidden">
      <!-- Header Skeleton -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
          <div class="flex-1 min-w-0">
            <div class="h-7 sm:h-8 lg:h-9 w-64 bg-base-200 rounded animate-pulse mb-2"></div>
            <div class="h-4 w-96 bg-base-200 rounded animate-pulse"></div>
          </div>
          <div class="h-10 w-32 bg-base-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
        <!-- Vista Desktop: Tabla (solo desde lg: 1024px) -->
        <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 w-1/3">
                  <div class="h-3 w-20 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left">
                  <div class="h-3 w-16 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left">
                  <div class="h-3 w-24 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-left">
                  <div class="h-3 w-32 bg-base-300 rounded animate-pulse"></div>
                </th>
                <th class="text-center">
                  <div class="h-3 w-20 bg-base-300 rounded animate-pulse mx-auto"></div>
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
                    <div class="h-6 w-20 bg-base-200 rounded-full animate-pulse"></div>
                  </td>
                  <td class="text-left">
                    <div class="h-5 w-24 bg-base-200 rounded animate-pulse"></div>
                  </td>
                  <td class="text-left">
                    <div class="h-4 w-28 bg-base-200 rounded animate-pulse"></div>
                  </td>
                  <td class="pr-6 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <div class="h-8 w-24 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-8 w-20 bg-base-200 rounded animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Vista Móvil y Tablet: Tarjetas (hasta lg: 1024px) -->
        <div class="lg:hidden space-y-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="border border-base-200 rounded-xl overflow-hidden shadow-sm bg-base-100">
              <div class="p-4 flex flex-col gap-3">
                <!-- Header de la tarjeta -->
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-12 h-12 rounded-full bg-base-200 animate-pulse"></div>
                    <div class="flex flex-col gap-2 flex-1">
                      <div class="h-5 w-32 bg-base-200 rounded animate-pulse"></div>
                      <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div class="h-6 w-16 bg-base-200 rounded-full animate-pulse"></div>
                </div>

                <!-- Saldo y último movimiento -->
                <div class="bg-base-50 rounded-lg p-3 border border-base-200">
                  <div class="h-4 w-24 bg-base-200 rounded animate-pulse mb-2"></div>
                  <div class="h-6 w-32 bg-base-200 rounded animate-pulse mb-2"></div>
                  <div class="h-3 w-28 bg-base-200 rounded animate-pulse"></div>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-2">
                  <div class="h-9 flex-1 bg-base-200 rounded-lg animate-pulse"></div>
                  <div class="h-9 flex-1 bg-base-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LedgerTableSkeleton {
  isExiting = input<boolean>(false);
}
