import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal modal-open" [class.confirm-dialog-enter]="isOpen()">
        <div class="modal-box max-w-lg confirm-dialog-box">
          <!-- Icono de advertencia para acciones destructivas -->
          @if (type() === 'destructive') {
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-error">
                  <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          }
          
          <h3 class="font-bold text-xl mb-3 text-center">{{ title() }}</h3>
          
          <p class="text-sm text-base-content/70 mb-6 text-center leading-relaxed px-2">
            {{ message() }}
          </p>
          
          <div class="modal-action mt-6 pt-6 border-t border-base-200">
            <button 
              class="confirm-btn-cancel" 
              (click)="onCancel()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Cancelar
            </button>
            <button
              [class]="confirmButtonClass()"
              (click)="onConfirm()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" (click)="onCancel()"></form>
      </div>
    }
  `,
  styles: [
    `
    /* Animación de entrada suave */
    .confirm-dialog-enter .confirm-dialog-box {
      animation: confirmDialogEnter 300ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
    }

    @keyframes confirmDialogEnter {
      0% {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* ============================================
       BOTONES ELEGANTES - Diseño Sutil y Refinado
       ============================================ */

    /* Botón Cancelar - Estilo Sutil */
    .confirm-btn-cancel {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: hsl(var(--bc) / 0.65);
      background: transparent;
      border: 1px solid hsl(var(--bc) / 0.15);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .confirm-btn-cancel:hover {
      color: hsl(var(--bc));
      background: hsl(var(--bc) / 0.04);
      border-color: hsl(var(--bc) / 0.2);
    }

    .confirm-btn-cancel:active {
      transform: scale(0.97);
      background: hsl(var(--bc) / 0.06);
    }

    .confirm-btn-cancel svg {
      width: 0.875rem;
      height: 0.875rem;
      transition: transform 200ms ease;
    }

    .confirm-btn-cancel:hover svg {
      transform: scale(1.05);
    }

    /* Botón Confirmar - Primary - Estilo Refinado */
    .confirm-btn-primary {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: white;
      background: hsl(var(--p));
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .confirm-btn-primary:hover {
      background: hsl(var(--pf));
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .confirm-btn-primary:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .confirm-btn-primary svg {
      width: 0.875rem;
      height: 0.875rem;
      transition: transform 200ms ease;
    }

    .confirm-btn-primary:hover svg {
      transform: scale(1.05);
    }

    /* Botón Confirmar - Destructive - Estilo Refinado */
    .confirm-btn-error {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: white;
      background: #ef4444;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .confirm-btn-error:hover {
      background: #dc2626;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .confirm-btn-error:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .confirm-btn-error svg {
      width: 0.875rem;
      height: 0.875rem;
      transition: transform 200ms ease;
    }

    .confirm-btn-error:hover svg {
      transform: scale(1.05);
    }

    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .confirm-dialog-enter .confirm-dialog-box {
        animation: none;
      }

      .confirm-btn-cancel,
      .confirm-btn-primary,
      .confirm-btn-error {
        transition: none;
      }

      .confirm-btn-cancel svg,
      .confirm-btn-primary svg,
      .confirm-btn-error svg {
        transition: none;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialog {
  isOpen = input(false);
  title = input('Confirmar acción');
  message = input('¿Estás seguro de que deseas continuar?');
  confirmLabel = input('Confirmar');
  type = input<'default' | 'destructive'>('default');
  
  confirm = output<void>();
  cancel = output<void>();

  confirmButtonClass = computed(() => {
    return this.type() === 'destructive' 
      ? 'confirm-btn-error' 
      : 'confirm-btn-primary';
  });

  onConfirm(): void {
    this.confirm.emit();
    this.cancel.emit(); // Cerrar modal
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

