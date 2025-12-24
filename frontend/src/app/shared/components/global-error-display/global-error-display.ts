import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalErrorService } from '../../services/global-error.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

/**
 * Componente global de error que reemplaza el contenido del main
 * Se muestra cuando hay un error crítico que requiere recargar toda la aplicación
 * El sidebar/navbar permanece visible
 */
@Component({
  selector: 'app-global-error-display',
  standalone: true,
  imports: [CommonModule, UiIconComponent],
  template: `
    <div class="global-error-container">
      <div class="card bg-error/10 border border-error/20 rounded-3xl p-6 md:p-8 lg:p-10 max-w-2xl mx-auto">
        <div class="flex flex-col items-center gap-4 md:gap-6 text-center">
          <ui-icon name="AlertCircle" size="xl" class="text-error" />
          <div class="space-y-2">
            <h3 class="text-xl md:text-2xl font-semibold text-error mb-2">
              {{ errorTitle() || 'Error' }}
            </h3>
            <p class="text-sm md:text-base text-error/70 mb-6">
              {{ errorMessage() }}
            </p>
            <button 
              (click)="onRetry()" 
              class="btn btn-error btn-sm md:btn-md gap-2">
              <ui-icon name="RefreshCw" size="sm" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .global-error-container {
      width: 100%;
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      animation: fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .global-error-container {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalErrorDisplayComponent {
  private globalErrorService = inject(GlobalErrorService);

  errorMessage = this.globalErrorService.errorMessage;
  errorTitle = this.globalErrorService.errorTitle;

  onRetry(): void {
    this.globalErrorService.reloadPage();
  }
}

