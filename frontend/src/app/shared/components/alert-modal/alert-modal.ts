import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModalService } from '../../services/alert-modal.service';

@Component({
  selector: 'app-alert-modal',
  imports: [CommonModule],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="alert-modal">
      <div class="modal-box max-w-md">
        <!-- Header con icono y título -->
        <div class="flex items-start gap-4 mb-6 pb-6 border-b border-base-200">
          <div class="p-3 rounded-xl shrink-0"
            [class.bg-error/10]="modalService.config()?.type === 'error'"
            [class.text-error]="modalService.config()?.type === 'error'"
            [class.bg-warning/10]="modalService.config()?.type === 'warning'"
            [class.text-warning]="modalService.config()?.type === 'warning'"
            [class.bg-success/10]="modalService.config()?.type === 'success'"
            [class.text-success]="modalService.config()?.type === 'success'"
            [class.bg-info/10]="modalService.config()?.type === 'info' || !modalService.config()?.type"
            [class.text-info]="modalService.config()?.type === 'info' || !modalService.config()?.type">
            @if (modalService.config()?.type === 'error') {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            } @else if (modalService.config()?.type === 'warning') {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            } @else if (modalService.config()?.type === 'success') {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            }
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

        <!-- Botón de acción -->
        <div class="flex justify-end mt-6">
          <button 
            type="button"
            class="btn btn-primary gap-2 font-semibold"
            (click)="modalService.close()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
            </svg>
            {{ modalService.config()?.buttonText || 'Entendido' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" (click)="modalService.close()">
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
export class AlertModalComponent implements AfterViewInit {
  modalService = inject(AlertModalService);
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

