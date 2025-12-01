import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';

/**
 * Componente de overlay de carga con spinner centrado.
 * 
 * @example
 * ```html
 * <!-- Overlay básico -->
 * <app-loading-overlay [isLoading]="isLoading()" />
 * 
 * <!-- Overlay con mensaje -->
 * <app-loading-overlay [isLoading]="isLoading()" message="Cargando datos..." />
 * 
 * <!-- Overlay con blur -->
 * <app-loading-overlay [isLoading]="isLoading()" [backdrop]="true" />
 * ```
 */
@Component({
  selector: 'app-loading-overlay',
  imports: [CommonModule, LoadingSpinner],
  template: `
    @if (isLoading()) {
      <div 
        [class]="overlayClasses()"
        [class.backdrop-blur-sm]="backdrop()">
        <app-loading-spinner 
          [size]="spinnerSize()"
          [color]="spinnerColor()"
          [text]="message()" />
      </div>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingOverlay {
  /**
   * Controla si el overlay está visible
   */
  isLoading = input<boolean>(false);

  /**
   * Mensaje opcional a mostrar debajo del spinner
   */
  message = input<string | undefined>(undefined);

  /**
   * Si es true, aplica blur al fondo
   * @default true
   */
  backdrop = input<boolean>(true);

  /**
   * Tamaño del spinner
   * @default 'lg'
   */
  spinnerSize = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');

  /**
   * Color del spinner
   * @default 'primary'
   */
  spinnerColor = input<'primary' | 'success' | 'error' | 'warning' | 'base-content'>('primary');

  /**
   * Clases del overlay
   * z-40 para que quede debajo del navbar (z-50) pero encima del contenido del main
   */
  overlayClasses = () => {
    return 'fixed inset-0 z-40 flex items-center justify-center bg-base-100/80 transition-opacity duration-300';
  };
}

