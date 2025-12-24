import { Injectable, signal, computed } from '@angular/core';

/**
 * Servicio global para manejar errores de página completa
 * Permite mostrar un componente de error que reemplaza todo el contenido de la página
 */
@Injectable({
  providedIn: 'root'
})
export class GlobalErrorService {
  // Signal para el mensaje de error (null = sin error)
  private _errorMessage = signal<string | null>(null);
  public readonly errorMessage = this._errorMessage.asReadonly();

  // Signal para el título del error (opcional)
  private _errorTitle = signal<string | null>(null);
  public readonly errorTitle = this._errorTitle.asReadonly();

  // Computed signal para indicar si hay un error activo
  public readonly hasError = computed(() => this._errorMessage() !== null);

  /**
   * Muestra un error global en toda la página
   * @param message Mensaje de error a mostrar
   * @param title Título opcional del error (por defecto: "Error")
   */
  showError(message: string, title: string = 'Error'): void {
    this._errorMessage.set(message);
    this._errorTitle.set(title);
  }

  /**
   * Limpia el error global y oculta el componente de error
   */
  clearError(): void {
    this._errorMessage.set(null);
    this._errorTitle.set(null);
  }

  /**
   * Recarga toda la página
   */
  reloadPage(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

