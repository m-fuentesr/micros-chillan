import { Injectable, signal } from '@angular/core';

/**
 * Servicio para controlar el spinner de transición
 * Usado para login, redirect, recarga, cambio de pestaña, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private _isVisible = signal(false);
  
  readonly isVisible = this._isVisible.asReadonly();
  
  /**
   * Mostrar el spinner
   */
  show(): void {
    this._isVisible.set(true);
  }
  
  /**
   * Ocultar el spinner
   */
  hide(): void {
    this._isVisible.set(false);
  }
}

