import { Injectable, signal } from '@angular/core';

export interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string; // Para personalizar el botón (ej: 'btn-error')
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmModalService {
  private _isVisible = signal(false);
  private _config = signal<ConfirmModalConfig | null>(null);
  private _resolveCallback = signal<((confirmed: boolean) => void) | null>(null);

  readonly isVisible = this._isVisible.asReadonly();
  readonly config = this._config.asReadonly();

  /**
   * Abre el modal de confirmación y retorna una Promise que se resuelve cuando el usuario confirma o cancela
   */
  open(config: ConfirmModalConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this._config.set(config);
      this._resolveCallback.set(resolve);
      this._isVisible.set(true);
    });
  }

  /**
   * Confirma la acción
   */
  confirm(): void {
    const resolve = this._resolveCallback();
    if (resolve) {
      resolve(true);
    }
    this.close();
  }

  /**
   * Cancela la acción
   */
  cancel(): void {
    const resolve = this._resolveCallback();
    if (resolve) {
      resolve(false);
    }
    this.close();
  }

  private close(): void {
    this._isVisible.set(false);
    this._config.set(null);
    this._resolveCallback.set(null);
  }
}

































