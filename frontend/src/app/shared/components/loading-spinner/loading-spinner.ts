import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de spinner moderno y estandarizado.
 * 
 * @example
 * ```html
 * <!-- Spinner básico -->
 * <app-loading-spinner />
 * 
 * <!-- Spinner con tamaño y color personalizados -->
 * <app-loading-spinner size="lg" color="primary" />
 * 
 * <!-- Spinner con texto -->
 * <app-loading-spinner size="md" text="Cargando datos..." />
 * 
 * <!-- Spinner fullscreen -->
 * <app-loading-spinner size="xl" fullScreen="true" />
 * ```
 */
@Component({
  selector: 'app-loading-spinner',
  imports: [CommonModule],
  template: `
    <div 
      [class]="containerClasses()"
      [class.fixed]="fullScreen()"
      [class.inset-0]="fullScreen()"
      [class.flex]="fullScreen()"
      [class.items-center]="fullScreen()"
      [class.justify-center]="fullScreen()"
      [class.bg-base-100/80]="fullScreen()"
      [class.backdrop-blur-sm]="fullScreen()"
      [class.z-40]="fullScreen()">
      <div class="flex flex-col items-center justify-center gap-3">
        <div 
          [class]="spinnerClasses()"
          [style.animation-duration]="'1s'"
          [style.animation-timing-function]="'var(--ease-out-quart)'">
          <svg 
            class="animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24">
            <circle 
              class="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              stroke-width="4">
            </circle>
            <path 
              class="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
        @if (text()) {
          <p [class]="textClasses()">{{ text() }}</p>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinner {
  /**
   * Tamaño del spinner: xs, sm, md, lg, xl
   * @default 'md'
   */
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /**
   * Color del spinner: primary, success, error, warning, base-content
   * @default 'primary'
   */
  color = input<'primary' | 'success' | 'error' | 'warning' | 'base-content'>('primary');

  /**
   * Texto opcional a mostrar debajo del spinner
   */
  text = input<string | undefined>(undefined);

  /**
   * Si es true, el spinner se muestra como overlay fullscreen
   * @default false
   */
  fullScreen = input<boolean>(false);

  /**
   * Clases del contenedor
   */
  containerClasses = () => {
    return 'inline-flex';
  };

  /**
   * Clases del spinner según tamaño y color
   */
  spinnerClasses = () => {
    const sizeClasses = {
      xs: 'w-4 h-4',
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };

    const colorClasses = {
      primary: 'text-primary',
      success: 'text-success',
      error: 'text-error',
      warning: 'text-warning',
      'base-content': 'text-base-content'
    };

    return `${sizeClasses[this.size()]} ${colorClasses[this.color()]} drop-shadow-sm`;
  };

  /**
   * Clases del texto según tamaño
   */
  textClasses = () => {
    const sizeTextClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    };

    return `${sizeTextClasses[this.size()]} text-base-content/70 font-normal`;
  };
}

