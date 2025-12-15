import { Injectable, signal } from '@angular/core';

export interface AlertModalConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {
  private _isVisible = signal(false);
  private _config = signal<AlertModalConfig | null>(null);

  readonly isVisible = this._isVisible.asReadonly();
  readonly config = this._config.asReadonly();

  /**
   * Muestra un modal de alerta con el mensaje especificado
   */
  show(config: AlertModalConfig): void {
    this._config.set(config);
    this._isVisible.set(true);
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this._isVisible.set(false);
    this._config.set(null);
  }
}

