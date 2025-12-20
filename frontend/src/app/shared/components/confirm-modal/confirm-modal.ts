import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="confirm-modal">
      <div class="modal-box max-w-lg">
        <!-- Header con icono y título -->
        <div class="flex items-start gap-4 mb-8 pb-6 border-b border-base-200">
          <div class="p-3 bg-error/10 rounded-xl text-error shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0 pt-0.5">
            @if (modalService.config()) {
              <h3 class="font-bold text-2xl text-base-content mb-2 leading-tight">
                {{ modalService.config()!.title }}
              </h3>
              <p class="text-sm text-base-content/70 leading-relaxed">
                {{ modalService.config()!.message }}
              </p>
            }
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-8">
          <button 
            type="button"
            class="btn btn-ghost w-full sm:w-auto rounded-xl border border-base-300 hover:border-base-content/20 font-semibold order-2 sm:order-1 cursor-pointer"
            (click)="modalService.cancel()">
            {{ modalService.config()?.cancelText || 'Cancelar' }}
          </button>
          <button 
            type="button"
            class="btn btn-error text-white w-full sm:w-auto shadow-error/20 rounded-xl border border-error/30 font-semibold order-1 sm:order-2 cursor-pointer"
            (click)="modalService.confirm()">
            {{ modalService.config()?.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" (click)="modalService.cancel()">
        <button>close</button>
      </form>
    </dialog>
  `,
  styles: [`
    /* Asegurar que el modal esté fijo en el viewport */
    dialog.modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
    }

    /* Backdrop con fondo semitransparente */
    .modal-backdrop {
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent implements AfterViewInit {
  modalService = inject(ConfirmModalService);
  @ViewChild('dialogRef', { static: false }) dialogRef!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    // Efecto para abrir/cerrar el dialog HTML5 cuando cambia isVisible
    effect(() => {
      const isVisible = this.modalService.isVisible();
      const dialog = this.dialogRef?.nativeElement;
      
      if (dialog) {
        if (isVisible) {
          dialog.showModal();
        } else {
          dialog.close();
        }
      }
    });
  }
}

