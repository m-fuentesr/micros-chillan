import { Component, ChangeDetectionStrategy, inject, signal, effect, ViewChild, ElementRef, AfterViewInit, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriverLedgerHistory } from '../../models/accounting.models';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';
import { AccountingService } from '../../services/accounting.service';
import { DriverLedgerHistoryModalService } from '../../services/driver-ledger-history-modal.service';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { formatDateShort } from '../../utils/date.utils';

// Log global para verificar si el módulo se carga
console.log('🔴 DriverLedgerHistoryComponent - Módulo cargado');

@Component({
  selector: 'app-driver-ledger-history',
  standalone: true,
  imports: [CommonModule, UiIconComponent],
  template: `
    <!-- DEBUG: Template renderizado -->
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="driver-ledger-history-modal">
      <div class="modal-box max-w-2xl w-full max-h-[88vh] sm:max-h-[90vh] overflow-hidden flex flex-col bg-base-100 text-base-content rounded-3xl border border-base-200 shadow-2xl px-4 py-5 sm:px-6 sm:py-6 gap-4 sm:gap-5">
        @if (modalService.choferId()) {
          <!-- Header -->
          <div class="flex items-center justify-between gap-4 flex-shrink-0 pb-3 border-b border-base-200">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0 border border-primary/20 shadow-sm">
                <ui-icon name="FileText" size="sm" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-lg sm:text-xl font-bold leading-tight text-base-content truncate">
                  {{ modalService.driverName() || 'Historial' }}
                </h3>
                <p class="text-xs text-base-content/60 mt-0.5">Cuenta Corriente</p>
              </div>
            </div>
            <button 
              type="button"
              class="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:bg-base-200 hover:text-base-content flex-shrink-0"
              (click)="modalService.close()">
              <ui-icon name="X" size="xs" />
            </button>
          </div>

          <!-- Body con scroll -->
          <div class="overflow-y-auto overscroll-contain flex-1 min-h-0 pr-1 custom-scrollbar">
            @if (modalService.isLoading()) {
              <div class="flex justify-center items-center py-12">
                <div class="flex flex-col items-center gap-3">
                  <span class="loading loading-spinner loading-lg text-primary"></span>
                  <span class="text-sm text-base-content/60 font-medium">Cargando historial...</span>
                </div>
              </div>
            } @else if (modalService.history()) {
              <!-- Saldo Actual -->
              <div class="rounded-3xl border border-base-200 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30 shadow-sm p-4 sm:p-5 mb-6">
                <div class="text-xs uppercase tracking-wider text-base-content/50 mb-2">Saldo Actual</div>
                <div class="font-black text-3xl sm:text-4xl font-mono tabular-nums mb-1"
                     [class.text-error]="modalService.history()!.saldo_actual < 0"
                     [class.text-success]="modalService.history()!.saldo_actual > 0"
                     [class.text-base-content]="modalService.history()!.saldo_actual === 0">
                  {{ formatCurrency(modalService.history()!.saldo_actual) }}
                </div>
                <div class="text-sm mt-2"
                     [class.text-error]="modalService.history()!.saldo_actual < 0"
                     [class.text-success]="modalService.history()!.saldo_actual > 0"
                     [class.text-base-content/50]="modalService.history()!.saldo_actual === 0">
                  @if (modalService.history()!.saldo_actual < 0) {
                    🔴 El chofer debe a la empresa
                  } @else if (modalService.history()!.saldo_actual > 0) {
                    🟢 La empresa debe al chofer
                  } @else {
                    ⚪ Cuenta al día
                  }
                </div>
              </div>

              <!-- Lista de Movimientos -->
              <div class="space-y-3">
                <div class="flex items-center justify-between mb-3">
                  <div class="text-xs uppercase tracking-wider text-base-content/50 font-bold">
                    Movimientos ({{ modalService.history()!.total }})
                  </div>
                  @if (modalService.history()!.total_pages > 1) {
                    <div class="text-xs text-base-content/60">
                      Página {{ modalService.history()!.page }} de {{ modalService.history()!.total_pages }}
                    </div>
                  }
                </div>
                
                @if (modalService.history()!.movimientos.length === 0) {
                  <div class="text-center py-8">
                    <ui-icon name="FileText" size="lg" class="text-base-content/40 mb-2" />
                    <p class="text-sm text-base-content/60">No hay movimientos registrados</p>
                  </div>
                } @else {
                  @for (movement of modalService.history()!.movimientos; track movement.id) {
                    <div class="border border-base-200 rounded-xl p-4 bg-base-100 hover:bg-base-50 transition-colors"
                         [class.bg-error/5]="movement.tipo === 'CARGO'"
                         [class.bg-success/5]="movement.tipo === 'ABONO'">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-3 flex-1 min-w-0">
                          <div class="p-2 rounded-lg shrink-0"
                               [class.bg-error/10]="movement.tipo === 'CARGO'"
                               [class.text-error]="movement.tipo === 'CARGO'"
                               [class.bg-success/10]="movement.tipo === 'ABONO'"
                               [class.text-success]="movement.tipo === 'ABONO'">
                            @if (movement.tipo === 'CARGO') {
                              <ui-icon name="TrendingDown" size="sm" />
                            } @else {
                              <ui-icon name="TrendingUp" size="sm" />
                            }
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="font-bold text-base-content">{{ movement.descripcion }}</span>
                              <span class="badge badge-sm"
                                    [class.badge-error]="movement.tipo === 'CARGO'"
                                    [class.badge-success]="movement.tipo === 'ABONO'">
                                {{ movement.tipo === 'CARGO' ? 'Cargo' : 'Abono' }}
                              </span>
                            </div>
                            <div class="text-xs text-base-content/50">
                              {{ formatDate(movement.fecha_movimiento) }}
                            </div>
                          </div>
                        </div>
                        <div class="text-right shrink-0">
                          <div class="font-black text-lg font-mono tabular-nums"
                               [class.text-error]="movement.tipo === 'CARGO'"
                               [class.text-success]="movement.tipo === 'ABONO'">
                            {{ movement.tipo === 'CARGO' ? '-' : '+' }}{{ formatCurrency(movement.monto) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  
                  <!-- Controles de Paginación -->
                  @if (modalService.history()!.total_pages > 1) {
                    <div class="flex items-center justify-center gap-2 pt-4 border-t border-base-200">
                      <button
                        type="button"
                        class="btn btn-sm btn-ghost"
                        [disabled]="modalService.history()!.page === 1 || modalService.isLoading()"
                        (click)="goToPage(modalService.history()!.page - 1)"
                        title="Página anterior">
                        <ui-icon name="ChevronLeft" size="xs" />
                      </button>
                      
                      @for (pageNum of getPageNumbers(); track pageNum) {
                        <button
                          type="button"
                          class="btn btn-sm"
                          [class.btn-primary]="pageNum === modalService.history()!.page"
                          [class.btn-ghost]="pageNum !== modalService.history()!.page"
                          [disabled]="modalService.isLoading()"
                          (click)="goToPage(pageNum)">
                          {{ pageNum }}
                        </button>
                      }
                      
                      <button
                        type="button"
                        class="btn btn-sm btn-ghost"
                        [disabled]="modalService.history()!.page === modalService.history()!.total_pages || modalService.isLoading()"
                        (click)="goToPage(modalService.history()!.page + 1)"
                        title="Página siguiente">
                        <ui-icon name="ChevronRight" size="xs" />
                      </button>
                    </div>
                  }
                }
              </div>
            } @else {
              <div class="text-center py-12">
                <ui-icon name="AlertCircle" size="lg" class="text-base-content/40 mb-4" />
                <h3 class="text-lg font-semibold text-base-content mb-2">Error al cargar historial</h3>
                <p class="text-sm text-base-content/70 mb-4">No se pudo cargar el historial del chofer.</p>
                <button class="btn btn-sm btn-primary" (click)="loadHistory()">Reintentar</button>
              </div>
            }
          </div>
        }
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

    /* Scrollbar personalizado */
    .custom-scrollbar::-webkit-scrollbar { 
      width: 6px; 
    }
    .custom-scrollbar::-webkit-scrollbar-track { 
      background: transparent; 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background-color: rgba(0, 0, 0, 0.1); 
      border-radius: 20px; 
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DriverLedgerHistoryComponent implements OnInit, AfterViewInit {
  modalService = inject(DriverLedgerHistoryModalService);
  private accountingService = inject(AccountingService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('dialogRef', { static: false }) dialogRef!: ElementRef<HTMLDialogElement>;

  // Signal para indicar que la vista está inicializada
  private viewReady = signal(false);

  // Effect para manejar el dialog y cargar el historial
  private dialogEffect = effect(() => {
    const isVisible = this.modalService.isVisible();
    const choferId = this.modalService.choferId();
    // Suscribirse a viewReady para re-ejecutar el efecto cuando la vista esté lista
    const isViewReady = this.viewReady();

    console.log('🔵 dialogEffect: isVisible =', isVisible, 'choferId =', choferId, 'viewReady =', isViewReady);

    // Esperar a que la vista esté lista y el dialogRef exista
    if (isViewReady && this.dialogRef?.nativeElement) {
      const dialog = this.dialogRef.nativeElement;

      if (isVisible) {
        if (!dialog.open) {
          console.log('🔵 Abriendo dialog con showModal()');
          dialog.showModal();
        }

        // Cargar historial cuando se abre el modal y hay un choferId
        if (choferId !== null) {
          console.log('🔵 choferId disponible, cargando historial');
          // Usar untracked para evitar ciclos infinitos si loadHistory modifica señales (no debería, modifica servicio)
          // pero es buena práctica
          this.loadHistory();
        }
      } else {
        if (dialog.open) {
          console.log('🔵 Cerrando dialog');
          dialog.close();
        }
      }
    } else {
      console.log('🔵 Esperando a que viewReady sea true');
    }
  });

  constructor() {
    console.log('🔵 DriverLedgerHistoryComponent constructor() llamado');
  }

  ngOnInit(): void {
    console.log('🔵 DriverLedgerHistoryComponent ngOnInit() llamado');
  }

  ngAfterViewInit(): void {
    console.log('🔵 DriverLedgerHistoryComponent.ngAfterViewInit() llamado');
    const dialog = this.dialogRef?.nativeElement;

    if (!dialog) {
      console.error('❌ dialogRef no está disponible en ngAfterViewInit');
      return;
    }

    console.log('✅ dialogRef disponible, marcando viewReady = true');
    this.viewReady.set(true);
    this.cdr.markForCheck();
  }

  loadHistory(page: number = 1): void {
    console.log('🔵 loadHistory() llamado con página:', page);
    const choferId = this.modalService.choferId();
    console.log('🔵 choferId obtenido:', choferId);

    if (choferId === null) {
      console.warn('⚠️ choferId es null, abortando loadHistory()');
      return;
    }

    console.log('✅ Iniciando carga de historial para choferId:', choferId, 'página:', page);
    this.modalService.setIsLoading(true);

    console.log('🔵 Llamando a accountingService.getDriverLedgerHistory()');
    this.accountingService.getDriverLedgerHistory(choferId, page, 5).subscribe({
      next: (data) => {
        console.log('✅ Historial cargado exitosamente:', data);
        this.modalService.setHistory(data);
        this.modalService.setIsLoading(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar historial:', error);
        this.modalService.setHistory(null);
        this.modalService.setIsLoading(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.modalService.history() && page > this.modalService.history()!.total_pages)) {
      return;
    }
    this.loadHistory(page);
  }

  getPageNumbers(): number[] {
    const history = this.modalService.history();
    if (!history || history.total_pages <= 1) {
      return [];
    }

    const currentPage = history.page;
    const totalPages = history.total_pages;
    const pages: number[] = [];

    // Mostrar máximo 5 páginas alrededor de la actual
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Ajustar si estamos cerca del inicio o del final
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  formatDate(dateString: string): string {
    return formatDateShort(dateString);
  }
}
