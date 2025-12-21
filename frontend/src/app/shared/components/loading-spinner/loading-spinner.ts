import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

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
  imports: [CommonModule, UiIconComponent],
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
        <div [class]="spinnerClasses()">
          <ui-icon name="Loader2" [size]="size()" [class]="'animate-spin ' + getColorClass()" />
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
   * Color classes for ui-icon
   */
  colorClasses: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    'base-content': 'text-base-content'
  };

  /**
   * Obtener clase de color
   */
  getColorClass = () => {
    return this.colorClasses[this.color()] || 'text-primary';
  };

  /**
   * Clases del spinner según tamaño y color
   */
  spinnerClasses = () => {
    return 'drop-shadow-sm';
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

