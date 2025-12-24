import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

/**
 * Servicio global para manejar errores de página completa
 * Permite mostrar un componente de error que reemplaza todo el contenido de la página
 * También detecta automáticamente cuando no hay conexión a internet
 */
@Injectable({
  providedIn: 'root'
})
export class GlobalErrorService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Signal para el mensaje de error (null = sin error)
  private _errorMessage = signal<string | null>(null);
  public readonly errorMessage = this._errorMessage.asReadonly();

  // Signal para el título del error (opcional)
  private _errorTitle = signal<string | null>(null);
  public readonly errorTitle = this._errorTitle.asReadonly();

  // Signal para estado de conexión
  private _isOnline = signal<boolean>(true);
  public readonly isOnline = this._isOnline.asReadonly();

  // Computed signal para indicar si hay un error activo
  public readonly hasError = computed(() => this._errorMessage() !== null);

  // Flag para evitar múltiples verificaciones simultáneas
  private isCheckingConnection = false;
  private connectionCheckInterval: any = null;
  private readonly CHECK_INTERVAL = 30000; // 30 segundos

  constructor() {
    if (typeof window !== 'undefined') {
      // Inicializar estado de conexión
      this._isOnline.set(navigator.onLine);

      // Si no hay conexión al iniciar, mostrar error
      if (!navigator.onLine) {
        this.handleOffline();
      }

      // Escuchar eventos de conexión/desconexión del navegador
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Verificar conexión periódicamente (para detectar problemas de conectividad real)
      this.startPeriodicCheck();
    }
  }

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

  /**
   * Maneja cuando se detecta conexión online
   */
  private handleOnline(): void {
    this._isOnline.set(true);
    // Verificar conectividad real antes de limpiar el error
    this.checkConnection();
  }

  /**
   * Maneja cuando se detecta conexión offline
   */
  private handleOffline(): void {
    this._isOnline.set(false);
    // Solo mostrar error si no hay uno ya activo o si el error actual es de conexión
    const currentTitle = this._errorTitle();
    if (!this.hasError() || currentTitle === 'Sin conexión' || currentTitle === 'Error de conexión') {
      this.showError(
        'No hay conexión a internet. Por favor, verifica tu conexión de red.',
        'Sin conexión'
      );
    }
  }

  /**
   * Inicia la verificación periódica de conexión
   */
  private startPeriodicCheck(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(() => {
      // Solo verificar si navigator.onLine indica que hay conexión
      // Si está offline, no tiene sentido hacer ping
      if (navigator.onLine) {
        this.checkConnection();
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * Verifica la conectividad real haciendo un ping al servidor
   */
  private async checkConnection(): Promise<void> {
    if (this.isCheckingConnection) return;
    
    this.isCheckingConnection = true;

    try {
      // Hacer una petición GET ligera al endpoint raíz del servidor
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos

      const response = await fetch(`${this.apiUrl}/`, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Si fetch se completa exitosamente (incluso con status 4xx/5xx), significa que hay conexión
      // Cualquier status code (200, 404, 405, 500, etc.) indica que el servidor está accesible
      this._isOnline.set(true);
      
      // Si había un error de conexión, limpiarlo
      const currentTitle = this._errorTitle();
      if (currentTitle === 'Sin conexión' || currentTitle === 'Error de conexión') {
        this.clearError();
      }
    } catch (error: any) {
      // Error de red (timeout, DNS, CORS, network error, etc.)
      // Solo estos errores indican falta de conexión real
      this._isOnline.set(false);
      
      // Solo mostrar error si no hay uno ya activo o si el error actual es de conexión
      const currentTitle = this._errorTitle();
      if (!this.hasError() || currentTitle === 'Sin conexión' || currentTitle === 'Error de conexión') {
        // No mostrar error si fue un abort manual (timeout controlado)
        // En ese caso, asumimos que sigue sin conexión pero no mostramos mensaje nuevo
        if (error.name !== 'AbortError') {
          this.showError(
            'No hay conexión a internet. Por favor, verifica tu conexión de red.',
            'Sin conexión'
          );
        }
      }
    } finally {
      this.isCheckingConnection = false;
    }
  }
}

