import { Injectable, signal } from '@angular/core';

export interface ImageModalConfig {
  url: string;
  title: string;
  uploadedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageModalService {
  private _isVisible = signal(false);
  private _config = signal<ImageModalConfig | null>(null);

  readonly isVisible = this._isVisible.asReadonly();
  readonly config = this._config.asReadonly();

  /**
   * Muestra un modal con la imagen especificada
   */
  show(config: ImageModalConfig): void {
    this._config.set(config);
    this._isVisible.set(true);
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this._isVisible.set(false);
    this._config.set(null);
    // Restaurar scroll del body
    document.body.style.overflow = '';
  }
}




