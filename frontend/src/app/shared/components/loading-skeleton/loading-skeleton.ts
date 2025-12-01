import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de skeleton reutilizable para mostrar placeholders de carga.
 * 
 * @example
 * ```html
 * <!-- Skeleton de KPI -->
 * <app-loading-skeleton type="kpi" />
 * 
 * <!-- Skeleton de tabla con 5 filas -->
 * <app-loading-skeleton type="table" [count]="5" />
 * 
 * <!-- Skeleton de card -->
 * <app-loading-skeleton type="card" />
 * 
 * <!-- Skeleton personalizado -->
 * <app-loading-skeleton type="custom" [width]="'200px'" [height]="'100px'" />
 * ```
 */
@Component({
  selector: 'app-loading-skeleton',
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()">
      @switch (type()) {
        @case ('kpi') {
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5">
              <div class="h-4 w-24 bg-base-200 rounded mb-3 animate-pulse"></div>
              <div class="h-8 w-32 bg-base-200 rounded mb-2 animate-pulse"></div>
              <div class="h-3 w-20 bg-base-200 rounded animate-pulse"></div>
            </div>
          </div>
        }
        @case ('table') {
          <div class="space-y-2">
            <!-- Header -->
            <div class="flex gap-4 pb-2 border-b border-base-200">
              @for (col of tableColumns(); track $index) {
                <div [class]="col" class="h-4 bg-base-200 rounded animate-pulse"></div>
              }
            </div>
            <!-- Rows -->
            @for (row of rows(); track $index) {
              <div class="flex gap-4 py-3">
                @for (col of tableColumns(); track $index) {
                  <div [class]="col" class="h-4 bg-base-200 rounded animate-pulse"></div>
                }
              </div>
            }
          </div>
        }
        @case ('card') {
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5">
              <div class="h-6 w-3/4 bg-base-200 rounded mb-4 animate-pulse"></div>
              <div class="space-y-2">
                <div class="h-4 w-full bg-base-200 rounded animate-pulse"></div>
                <div class="h-4 w-5/6 bg-base-200 rounded animate-pulse"></div>
                <div class="h-4 w-4/6 bg-base-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        }
        @case ('list') {
          <div class="space-y-3">
            @for (item of rows(); track $index) {
              <div class="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-200">
                <div class="w-10 h-10 bg-base-200 rounded-full animate-pulse flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-3/4 bg-base-200 rounded animate-pulse"></div>
                  <div class="h-3 w-1/2 bg-base-200 rounded animate-pulse"></div>
                </div>
              </div>
            }
          </div>
        }
        @case ('text') {
          <div class="space-y-2">
            @for (line of textLines(); track $index) {
              <div [class]="line" class="h-4 bg-base-200 rounded animate-pulse"></div>
            }
          </div>
        }
        @case ('avatar') {
          <div class="w-12 h-12 bg-base-200 rounded-full animate-pulse"></div>
        }
        @case ('custom') {
          <div 
            [style.width]="width() || '100%'"
            [style.height]="height() || '100px'"
            class="bg-base-200 rounded-lg animate-pulse">
          </div>
        }
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSkeleton {
  /**
   * Tipo de skeleton: kpi, table, card, list, text, avatar, custom
   * @default 'card'
   */
  type = input<'kpi' | 'table' | 'card' | 'list' | 'text' | 'avatar' | 'custom'>('card');

  /**
   * Cantidad de elementos a mostrar (para table, list, text)
   * @default 3
   */
  count = input<number>(3);

  /**
   * Ancho personalizado (solo para type="custom")
   */
  width = input<string | undefined>(undefined);

  /**
   * Alto personalizado (solo para type="custom")
   */
  height = input<string | undefined>(undefined);

  /**
   * Clases del contenedor
   */
  containerClasses = () => {
    return 'w-full';
  };

  /**
   * Genera las filas según el count
   */
  rows = computed(() => {
    return Array(this.count()).fill(0);
  });

  /**
   * Columnas para skeleton de tabla
   */
  tableColumns = () => {
    return [
      'flex-1',
      'flex-1',
      'w-24',
      'w-32',
      'w-20'
    ];
  };

  /**
   * Líneas de texto para skeleton de texto
   */
  textLines = () => {
    const lines = [];
    for (let i = 0; i < this.count(); i++) {
      if (i === this.count() - 1) {
        lines.push('w-3/4'); // Última línea más corta
      } else {
        lines.push('w-full');
      }
    }
    return lines;
  };
}

