import { Injectable, signal } from '@angular/core';

/**
 * Estados del orquestador de transiciones
 * - idle: Sin transición activa
 * - login-exiting: Login está saliendo (animación de salida)
 * - dashboard-entering: Dashboard está entrando (animación de entrada)
 * - dashboard-ready: Dashboard listo, animaciones completadas
 */
export type TransitionState = 'idle' | 'login-exiting' | 'dashboard-entering' | 'dashboard-ready';

/**
 * Servicio centralizado que orquesta todas las transiciones entre login y dashboard
 * Elimina race conditions y coordina animaciones de forma secuencial
 */
@Injectable({
  providedIn: 'root'
})
export class TransitionOrchestratorService {
  private _state = signal<TransitionState>('idle');
  
  readonly state = this._state.asReadonly();
  
  /**
   * Timeline centralizado para todas las animaciones
   * Todos los delays y duraciones están aquí como fuente única de verdad
   */
  readonly TIMELINE = {
    // Login exit
    loginLeaving: 120,           // Fade-out del panel azul y formulario
    loginRootFadeOut: 280,       // Fade-out del contenedor raíz
    loginOverlayExpand: 900,     // Expansión del overlay blanco
    loginTotalExit: 1200,        // Tiempo total de salida del login
    
    // Dashboard entry
    dashboardFadeIn: 300,        // Fade-in del dashboard desde overlay
    sidebarDuration: 600,        // Duración animación sidebar
    sidebarDelay: 0,             // Delay animación sidebar
    mainDuration: 500,           // Duración animación main content
    mainDelay: 100,             // Delay animación main content
    headerDuration: 500,         // Duración animación header
    headerDelay: 300,            // Delay animación header
    contentDuration: 600,        // Duración animación content
    contentDelay: 450,           // Delay animación content
    contentDelay1: 550,          // Delay animación content delay-1
    contentDelay2: 650,          // Delay animación content delay-2
    
    // Total
    dashboardTotalEntry: 1300,   // Tiempo total de entrada del dashboard
  } as const;
  
  /**
   * Transición desde login a dashboard (admin)
   * Coordina la salida del login y la entrada del dashboard de forma fluida
   */
  async transitionFromLoginToDashboard(): Promise<void> {
    // Fase 1: Login está saliendo
    this._state.set('login-exiting');
    
    // Esperar a que el login termine completamente su animación de salida
    // Esto asegura que no haya solapamiento con el dashboard
    await this.wait(this.TIMELINE.loginTotalExit);
    
    // Fase 2: Dashboard está entrando
    // El dashboard se renderiza oculto y comienza su animación
    this._state.set('dashboard-entering');
    
    // Esperar a que todas las animaciones de entrada del dashboard terminen
    await this.wait(this.TIMELINE.dashboardTotalEntry);
    
    // Fase 3: Dashboard listo
    this._state.set('dashboard-ready');
  }
  
  /**
   * Transición desde login a trabajador (más simple)
   */
  async transitionFromLoginToWorker(): Promise<void> {
    this._state.set('login-exiting');
    await this.wait(500); // Fade-out simple para trabajador
    this._state.set('dashboard-ready'); // Saltamos dashboard-entering para trabajador
  }
  
  /**
   * Resetear el estado (útil para recargas de página)
   */
  reset(): void {
    this._state.set('idle');
  }
  
  /**
   * Verificar si estamos en una transición activa
   */
  isTransitioning(): boolean {
    const currentState = this._state();
    return currentState === 'login-exiting' || currentState === 'dashboard-entering';
  }
  
  /**
   * Verificar si el dashboard está listo para mostrar contenido
   */
  isDashboardReady(): boolean {
    return this._state() === 'dashboard-ready';
  }
  
  /**
   * Verificar si el dashboard está entrando (para ocultar navbar inicialmente)
   */
  isDashboardEntering(): boolean {
    return this._state() === 'dashboard-entering';
  }
  
  /**
   * Activar estado de entrada del dashboard manualmente (para recargas de página)
   * Esto permite que app.ts active la animación de entrada sin pasar por login
   */
  activateDashboardEntry(): void {
    this._state.set('dashboard-entering');
    // Auto-completar después del tiempo total de entrada
    setTimeout(() => {
      this._state.set('dashboard-ready');
    }, this.TIMELINE.dashboardTotalEntry);
  }
  
  /**
   * Helper para esperar un tiempo
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

