import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from '../ui-icon/ui-icon.component';
import { AlertModalService } from '../../services/alert-modal.service';

@Component({
  selector: 'app-alert-modal',
  imports: [CommonModule, UiIconComponent],
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
              <ui-icon name="TriangleAlert" size="xl" />
            } @else if (modalService.config()?.type === 'warning') {
              <ui-icon name="TriangleAlert" size="xl" />
            } @else if (modalService.config()?.type === 'success') {
              <ui-icon name="CheckCircle2" size="xl" />
            } @else {
              <ui-icon name="Info" size="xl" />
            }
          </div>
          <div class="flex-1 min-w-0 pt-0.5">
            @if (modalService.config()) {
              <h3 class="font-bold text-2xl text-base-content mb-2 leading-tight">
                {{ modalService.config()!.title }}
              </h3>
              <p class="text-sm text-base-content/70 leading-relaxed whitespace-pre-line">
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
            <ui-icon name="Check" size="sm" />
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

  constructor() {
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

  ngAfterViewInit(): void {
    if (this.modalService.isVisible() && this.dialogRef?.nativeElement) {
      this.dialogRef.nativeElement.showModal();
    }
  }
}

