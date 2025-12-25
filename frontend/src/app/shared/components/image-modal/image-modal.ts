import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageModalService } from '../../services/image-modal.service';

@Component({
  selector: 'app-image-modal',
  imports: [CommonModule],
  template: `
    <dialog 
      #dialogRef
      [class.modal-open]="modalService.isVisible()"
      class="modal"
      id="image-modal">
      <!-- Backdrop que cubre toda la pantalla -->
      <form method="dialog" class="modal-backdrop" (click)="modalService.close()">
        <button type="button" aria-label="Cerrar modal">close</button>
      </form>
      <!-- Contenido del modal centrado - Solo se muestra cuando hay config -->
      @if (modalService.isVisible() && modalService.config()) {
        <div class="modal-content-wrapper">
          <div class="bg-base-100 rounded-3xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden" (click)="$event.stopPropagation()">
            <!-- Header del modal -->
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-base-200 flex-shrink-0">
              <div class="flex-1 min-w-0 pr-4">
                <h3 id="modal-title" class="font-bold text-lg sm:text-xl text-base-content truncate">
                  {{ modalService.config()!.title }}
                </h3>
                @if (modalService.config()!.uploadedAt) {
                  <p class="text-sm text-base-content/60 mt-1">Subido: {{ modalService.config()!.uploadedAt }}</p>
                }
              </div>
              <button 
                class="btn btn-sm btn-circle btn-ghost flex-shrink-0 hover:bg-base-200"
                (click)="modalService.close()"
                type="button"
                aria-label="Cerrar modal">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <!-- Contenido del modal -->
            <div class="modal-image-container">
              @if (modalService.config()!.url) {
                <img 
                  #imageRef
                  [src]="modalService.config()!.url" 
                  [alt]="modalService.config()!.title"
                  class="modal-image"
                  [class.zoomed]="zoomLevel() > 1"
                  [style.transform]="getImageTransform()"
                  [style.transform-origin]="transformOrigin()"
                  (click)="onImageClick($event)"
                  (wheel)="onWheel($event)"
                  (mousedown)="onMouseDown($event)"
                  (mousemove)="onMouseMove($event)"
                  (mouseup)="onMouseUp($event)"
                  (mouseleave)="onMouseUp($event)"
                  (touchstart)="onTouchStart($event)"
                  (touchmove)="onTouchMove($event)"
                  (touchend)="onTouchEnd($event)"
                  loading="eager" />
              }
            </div>
          </div>
        </div>
      }
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
      padding: 0;
      margin: 0;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Animación de entrada del backdrop */
    dialog.modal::backdrop {
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
      animation: backdropFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Animación de salida del backdrop - suave y sincronizada con el contenido */
    dialog.modal[closing]::backdrop {
      animation: backdropFadeOut 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    @keyframes backdropFadeIn {
      from {
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
      }
      to {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
    }

    @keyframes backdropFadeOut {
      0% {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      50% {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      100% {
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
      }
    }

    /* Backdrop adicional para compatibilidad y control de clicks */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
      z-index: -1;
      border: none;
      padding: 0;
      margin: 0;
      animation: backdropFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    dialog.modal[closing] .modal-backdrop {
      animation: backdropFadeOut 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    .modal-backdrop button {
      display: none;
    }

    /* Wrapper para centrar el contenido del modal */
    .modal-content-wrapper {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      pointer-events: none;
      will-change: transform, opacity;
      opacity: 1;
      visibility: visible;
    }

    /* Ocultar el wrapper cuando está cerrando para evitar el div blanco */
    /* Sincronizado con la animación del contenido (300ms) */
    dialog.modal[closing] .modal-content-wrapper {
      opacity: 0;
      visibility: hidden;
      transition: opacity 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms,
                  visibility 0ms linear 300ms;
    }

    /* Animación de entrada del contenido del modal */
    .modal-content-wrapper > div {
      pointer-events: auto;
      opacity: 0;
      transform: scale3d(0.9, 0.9, 1) translate3d(0, 20px, 0);
      animation: modalContentEnter 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }

    /* Animación de salida del contenido del modal - sincronizada con el backdrop */
    dialog.modal[closing] .modal-content-wrapper > div {
      animation: modalContentExit 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      /* Asegurar que el fondo blanco también desaparezca durante la animación */
      background-color: transparent !important;
      transition: background-color 300ms ease-out 0ms;
    }

    @keyframes modalContentEnter {
      from {
        opacity: 0;
        transform: scale3d(0.9, 0.9, 1) translate3d(0, 20px, 0);
      }
      to {
        opacity: 1;
        transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
      }
    }

    @keyframes modalContentExit {
      0% {
        opacity: 1;
        transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
      }
      50% {
        opacity: 0.5;
        transform: scale3d(0.97, 0.97, 1) translate3d(0, 5px, 0);
      }
      100% {
        opacity: 0;
        transform: scale3d(0.95, 0.95, 1) translate3d(0, 10px, 0);
      }
    }

    /* Contenedor de imagen con soporte para zoom */
    .modal-image-container {
      padding: 1rem 1.5rem;
      background: rgb(var(--b2));
      flex: 1;
      overflow: auto;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .modal-image {
      max-width: 100%;
      max-height: calc(90vh - 180px);
      object-fit: contain;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      cursor: zoom-in;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      touch-action: pan-x pan-y;
    }

    .modal-image.zoomed {
      cursor: grab;
      transition: transform 0.1s ease-out;
    }

    .modal-image.zoomed:active {
      cursor: grabbing;
    }

    /* Optimización para móviles - Fullscreen y animaciones más rápidas */
    @media (max-width: 768px) {
      /* Fullscreen en móvil */
      .modal-content-wrapper > div {
        max-width: 100vw !important;
        max-height: 100vh !important;
        margin: 0 !important;
        border-radius: 0 !important;
        height: 100vh;
        width: 100vw;
      }

      /* Header flotante en móvil */
      .modal-content-wrapper > div > div:first-child {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: none;
        padding: 1rem;
        pointer-events: auto;
      }

      /* Asegurar que el texto del header sea visible en móvil */
      .modal-content-wrapper > div > div:first-child h3,
      .modal-content-wrapper > div > div:first-child p {
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }

      /* Contenedor de imagen fullscreen en móvil */
      .modal-image-container {
        padding: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        position: relative;
        touch-action: pan-x pan-y pinch-zoom;
      }

      /* Imagen fullscreen en móvil */
      .modal-image {
        max-width: 100vw !important;
        max-height: 100vh !important;
        width: 100vw;
        height: 100vh;
        object-fit: contain;
        border-radius: 0;
        box-shadow: none;
        cursor: zoom-in;
      }

      .modal-image.zoomed {
        cursor: grab;
      }
      dialog.modal::backdrop {
        animation-duration: 250ms;
      }

      dialog.modal[closing]::backdrop {
        animation-duration: 250ms;
      }

      .modal-backdrop {
        animation-duration: 250ms;
      }

      dialog.modal[closing] .modal-backdrop {
        animation-duration: 250ms;
      }

      .modal-content-wrapper > div {
        animation-duration: 300ms;
        transform: scale3d(0.95, 0.95, 1) translate3d(0, 15px, 0);
      }

      dialog.modal[closing] .modal-content-wrapper > div {
        animation-duration: 250ms;
      }

      dialog.modal[closing] .modal-content-wrapper {
        transition: opacity 50ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms,
                    visibility 0ms linear 50ms;
      }

      dialog.modal[closing] .modal-content-wrapper > div {
        transition: background-color 250ms ease-out 0ms;
      }

      @keyframes modalContentEnter {
        from {
          opacity: 0;
          transform: scale3d(0.95, 0.95, 1) translate3d(0, 15px, 0);
        }
        to {
          opacity: 1;
          transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
        }
      }
    }

    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      dialog.modal::backdrop,
      .modal-backdrop,
      .modal-content-wrapper > div {
        animation: none !important;
      }

      dialog.modal::backdrop {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .modal-backdrop {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .modal-content-wrapper > div {
        opacity: 1;
        transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageModalComponent implements AfterViewInit, OnDestroy {
  modalService = inject(ImageModalService);
  @ViewChild('dialogRef', { static: false }) dialogRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('imageRef', { static: false }) imageRef!: ElementRef<HTMLImageElement>;

  // Control de zoom
  zoomLevel = signal(1); // 1 = tamaño normal, 2 = zoom 2x
  transformOrigin = signal('center center');
  currentX = signal(0);
  currentY = signal(0);
  private lastTap = 0;
  private lastClick = 0;
  private lastClickX = 0;
  private lastClickY = 0;
  private tapTimeout: any;
  private isDragging = false;
  private isMouseDragging = false;
  private wasDragging = false; // Flag para prevenir click después de arrastrar
  private startX = 0;
  private startY = 0;
  private initialDistance = 0;
  private minZoom = 1;
  private maxZoom = 5;
  private mouseDownTime = 0;
  private mouseDownX = 0;
  private mouseDownY = 0;
  private baseImageWidth = 0;
  private baseImageHeight = 0;

  // Computed para transformación de la imagen
  getImageTransform = computed(() => {
    const zoom = this.zoomLevel();
    const x = this.currentX();
    const y = this.currentY();
    if (zoom === 1) {
      return 'scale(1) translate3d(0, 0, 0)';
    }
    return `scale(${zoom}) translate3d(${x}px, ${y}px, 0)`;
  });

  ngAfterViewInit(): void {
    const dialog = this.dialogRef?.nativeElement;
    
    if (dialog) {
      // Escuchar el evento close del dialog para limpiar el atributo closing
      dialog.addEventListener('close', () => {
        dialog.removeAttribute('closing');
      });

      // Escuchar el evento cancel del dialog (cuando se presiona ESC)
      dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.modalService.close();
      });
    }

    // Efecto para abrir/cerrar el dialog HTML5 cuando cambia isVisible
    effect(() => {
      const isVisible = this.modalService.isVisible();
      const dialog = this.dialogRef?.nativeElement;
      
      if (dialog) {
        if (isVisible) {
          // Remover atributo closing si existe
          dialog.removeAttribute('closing');
          dialog.showModal();
          // Resetear zoom cuando se abre el modal
          this.resetZoom();
        } else if (dialog.open) {
          // Solo cerrar si el dialog está abierto
          // Agregar atributo closing para animación de salida
          dialog.setAttribute('closing', '');
          // Esperar a que termine la animación antes de cerrar
          setTimeout(() => {
            if (dialog.hasAttribute('closing')) {
              dialog.close();
            }
          }, 300); // Duración de la animación de salida (sincronizada con CSS)
        }
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    if (this.modalService.isVisible()) {
      this.modalService.close();
    }
  }

  // Listeners globales para arrastre con mouse (cuando el mouse sale de la imagen)
  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (this.isMouseDragging && this.zoomLevel() > 1) {
      event.preventDefault();
      event.stopPropagation();
      
      // Calcular distancia movida para detectar si es arrastre
      const deltaX = Math.abs(event.clientX - this.mouseDownX);
      const deltaY = Math.abs(event.clientY - this.mouseDownY);
      
      // Si se movió más de 3px, es un arrastre
      if (deltaX > 3 || deltaY > 3) {
        this.wasDragging = true;
      }
      
      // Calcular nueva posición inmediatamente
      const newX = event.clientX - this.startX;
      const newY = event.clientY - this.startY;
      
      // Aplicar movimiento usando signals para que el computed se actualice
      this.currentX.set(newX);
      this.currentY.set(newY);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent): void {
    if (this.isMouseDragging) {
      // Si fue arrastre, prevenir el click
      if (this.wasDragging) {
        // Prevenir el click después de arrastrar con un delay
        setTimeout(() => {
          this.isMouseDragging = false;
          this.wasDragging = false;
        }, 100);
      } else {
        // Fue un click, permitir que se dispare el evento click
        this.isMouseDragging = false;
        this.wasDragging = false;
      }
    }
  }

  ngOnDestroy(): void {
    // Asegurar que el scroll del body se restaure al destruir el componente
    document.body.style.overflow = '';
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }
  }

  // Click para zoom en desktop, doble tap en móvil
  onImageClick(event: MouseEvent): void {
    // Prevenir que el click cierre el modal
    event.stopPropagation();
    
    // En desktop
    if (window.innerWidth > 768) {
      // No hacer zoom si estamos arrastrando
      if (this.isMouseDragging || this.wasDragging) {
        // Resetear wasDragging después de un tiempo para permitir clicks futuros
        setTimeout(() => {
          this.wasDragging = false;
        }, 200);
        return;
      }
      
      const image = this.imageRef?.nativeElement;
      if (!image) return;
      
      const currentTime = new Date().getTime();
      const clickLength = currentTime - this.lastClick;
      const deltaX = Math.abs(event.clientX - this.lastClickX);
      const deltaY = Math.abs(event.clientY - this.lastClickY);
      
      // Detectar doble click (dentro de 300ms y en la misma área)
      if (clickLength < 300 && clickLength > 0 && deltaX < 10 && deltaY < 10) {
        // Doble click detectado
        const rect = image.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        
        // Establecer origen de transformación en el punto del click
        this.transformOrigin.set(`${relativeX * 100}% ${relativeY * 100}%`);
        
        if (this.zoomLevel() === 1) {
          // Si NO está en zoom: hacer zoom in
          this.baseImageWidth = rect.width;
          this.baseImageHeight = rect.height;
          this.zoomLevel.set(2);
          this.currentX.set(0);
          this.currentY.set(0);
        } else {
          // Si SÍ está en zoom: hacer zoom out
          this.zoomLevel.set(1);
          this.currentX.set(0);
          this.currentY.set(0);
          this.baseImageWidth = 0;
          this.baseImageHeight = 0;
        }
        this.lastClick = 0;
        return;
      }
      
      // Click simple - no hacer nada (solo el doble click hace zoom)
      // Guardar información del click para detectar doble click
      this.lastClick = currentTime;
      this.lastClickX = event.clientX;
      this.lastClickY = event.clientY;
    }
    // En móvil, el doble tap se maneja en onTouchStart
  }

  // Manejar eventos táctiles para doble tap
  onTouchStart(event: TouchEvent): void {
    // Solo procesar en móvil
    if (window.innerWidth > 768) return;

    if (event.touches.length === 1) {
      // Un solo dedo - preparar para doble tap o drag
      const touch = event.touches[0];
      const currentTime = new Date().getTime();
      const tapLength = currentTime - this.lastTap;

      if (tapLength < 300 && tapLength > 0 && tapLength < 500) {
        // Doble tap detectado (entre 0 y 500ms)
        event.preventDefault();
        event.stopPropagation();
        this.handleDoubleTap(touch.clientX, touch.clientY);
        this.lastTap = 0;
      } else {
        // Primer tap o preparar para drag si está zoomed
        this.lastTap = currentTime;
        if (this.zoomLevel() > 1) {
          this.isDragging = true;
          this.startX = touch.clientX - this.currentX();
          this.startY = touch.clientY - this.currentY();
        }
      }
    } else if (event.touches.length === 2) {
      // Pinch gesture - calcular distancia inicial
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      this.isDragging = false; // Cancelar drag si hay pinch
    }
  }

  // Manejar movimiento táctil para drag cuando está zoomed
  onTouchMove(event: TouchEvent): void {
    if (this.isDragging && event.touches.length === 1 && this.zoomLevel() > 1) {
      event.preventDefault();
      const touch = event.touches[0];
      
      // Calcular nueva posición
      const newX = touch.clientX - this.startX;
      const newY = touch.clientY - this.startY;
      
      // Aplicar movimiento directamente primero
      this.currentX.set(newX);
      this.currentY.set(newY);
      
      // Luego aplicar límites si tenemos las dimensiones base
      if (this.baseImageWidth > 0 && this.baseImageHeight > 0) {
        const image = this.imageRef?.nativeElement;
        if (image) {
          const container = image.parentElement;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const zoom = this.zoomLevel();
            
            // Calcular dimensiones escaladas
            const scaledWidth = this.baseImageWidth * zoom;
            const scaledHeight = this.baseImageHeight * zoom;
            
            // Calcular límites
            if (scaledWidth > containerRect.width) {
              const maxX = (scaledWidth - containerRect.width) / 2;
              this.currentX.set(Math.max(-maxX, Math.min(maxX, this.currentX())));
            } else {
              this.currentX.set(0);
            }
            
            if (scaledHeight > containerRect.height) {
              const maxY = (scaledHeight - containerRect.height) / 2;
              this.currentY.set(Math.max(-maxY, Math.min(maxY, this.currentY())));
            } else {
              this.currentY.set(0);
            }
          }
        }
      }
    }
  }

  // Finalizar interacción táctil
  onTouchEnd(event: TouchEvent): void {
    this.isDragging = false;
    this.initialDistance = 0;
  }

  // Manejar rueda del mouse para zoom en desktop
  onWheel(event: WheelEvent): void {
    // Solo en desktop
    if (window.innerWidth <= 768) return;
    
    // Prevenir scroll de la página
    event.preventDefault();
    event.stopPropagation();
    
    const image = this.imageRef?.nativeElement;
    if (!image) return;
    
    // Guardar dimensiones base si no están guardadas y estamos en zoom 1
    if (this.zoomLevel() === 1 && (this.baseImageWidth === 0 || this.baseImageHeight === 0)) {
      const rect = image.getBoundingClientRect();
      this.baseImageWidth = rect.width;
      this.baseImageHeight = rect.height;
    }
    
    // Calcular punto del mouse relativo a la imagen
    const rect = image.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    
    // Establecer origen de transformación en el punto del mouse
    this.transformOrigin.set(`${relativeX * 100}% ${relativeY * 100}%`);
    
    // Calcular nuevo nivel de zoom
    const zoomDelta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel() + zoomDelta));
    
    // Si el zoom cambia significativamente, actualizar
    if (Math.abs(newZoom - this.zoomLevel()) > 0.05) {
      this.zoomLevel.set(newZoom);
      
      // Si vuelve a 1x, resetear posición y dimensiones base
      if (newZoom <= 1) {
        this.currentX.set(0);
        this.currentY.set(0);
        this.zoomLevel.set(1);
        this.baseImageWidth = 0;
        this.baseImageHeight = 0;
      }
    }
  }

  // Iniciar arrastre con mouse en desktop
  onMouseDown(event: MouseEvent): void {
    // Solo en desktop y cuando está zoomed
    if (window.innerWidth <= 768 || this.zoomLevel() <= 1) return;
    
    // Solo botón izquierdo
    if (event.button !== 0) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Guardar posición y tiempo inicial para detectar si es arrastre o click
    this.mouseDownTime = new Date().getTime();
    this.mouseDownX = event.clientX;
    this.mouseDownY = event.clientY;
    this.wasDragging = false; // Resetear flag de arrastre
    
    // Marcar que estamos arrastrando
    this.isMouseDragging = true;
    this.startX = event.clientX - this.currentX();
    this.startY = event.clientY - this.currentY();
  }

  // Manejar movimiento del mouse para arrastre en desktop (cuando está sobre la imagen)
  onMouseMove(event: MouseEvent): void {
    // La lógica está en onDocumentMouseMove para capturar movimiento global
    // Este método se mantiene por compatibilidad pero la lógica principal está en el listener global
    if (this.isMouseDragging && this.zoomLevel() > 1) {
      event.preventDefault();
      // La lógica real está en onDocumentMouseMove
    }
  }

  // Finalizar arrastre con mouse (cuando está sobre la imagen)
  onMouseUp(event: MouseEvent): void {
    // La lógica está en onDocumentMouseUp para capturar el release global
    this.isMouseDragging = false;
  }

  // Manejar doble tap para zoom
  private handleDoubleTap(x: number, y: number): void {
    const image = this.imageRef?.nativeElement;
    if (!image) return;

    // Calcular punto de toque relativo a la imagen
    const rect = image.getBoundingClientRect();
    const relativeX = (x - rect.left) / rect.width;
    const relativeY = (y - rect.top) / rect.height;

    // Establecer origen de transformación
    this.transformOrigin.set(`${relativeX * 100}% ${relativeY * 100}%`);

    // Comportamiento consistente con desktop: doble tap hace zoom in si no está zoomed, zoom out si está zoomed
    if (this.zoomLevel() === 1) {
      // Si NO está en zoom: hacer zoom in
      this.baseImageWidth = rect.width;
      this.baseImageHeight = rect.height;
      this.zoomLevel.set(2);
      this.currentX.set(0);
      this.currentY.set(0);
    } else {
      // Si SÍ está en zoom: hacer zoom out
      this.zoomLevel.set(1);
      this.currentX.set(0);
      this.currentY.set(0);
      this.baseImageWidth = 0;
      this.baseImageHeight = 0;
    }
  }

  // Resetear zoom cuando se cierra el modal
  private resetZoom(): void {
    this.zoomLevel.set(1);
    this.currentX.set(0);
    this.currentY.set(0);
    this.isDragging = false;
    this.isMouseDragging = false;
    this.wasDragging = false;
    this.mouseDownTime = 0;
    this.mouseDownX = 0;
    this.mouseDownY = 0;
    this.transformOrigin.set('center center');
  }
}

