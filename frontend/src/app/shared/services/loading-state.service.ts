import { Injectable, signal, Signal } from '@angular/core';

export interface LoadingState {
  isLoading: Signal<boolean>;
  showSkeleton: Signal<boolean>;
  isSkeletonExiting: Signal<boolean>;
  showFeedback: Signal<boolean>;
  feedbackMessage: Signal<string>;
  setLoading: (value: boolean) => void;
  setDataLoaded: () => void;
}

export interface SequentialLoadingConfig {
  kpisDelay?: number;        // Delay para mostrar KPIs (default: 0ms)
  contentDelay?: number;      // Delay para mostrar contenido principal (default: 150ms)
  maxWaitTime?: number;        // Tiempo máximo de espera antes de mostrar (default: 2000ms)
  onKPIsReady?: () => void;   // Callback cuando KPIs están listos
  onContentReady?: () => void; // Callback cuando contenido está listo
}

export interface SequentialLoadingState {
  canShowKPIs: Signal<boolean>;
  canShowContent: Signal<boolean>;
  kpisError: Signal<boolean>;
  contentError: Signal<boolean>;
  setKPIsReady: (hasError?: boolean) => void;
  setContentReady: (hasError?: boolean) => void;
  reset: () => void;
  resetErrors: () => void;
}

/**
 * Servicio para gestionar estados de carga con umbral de 200ms
 * Evita mostrar skeletons en cargas muy rápidas (< 200ms) para prevenir flicker
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingStateService {
  private readonly SKELETON_THRESHOLD = 200; // ms

  /**
   * Crea un estado de carga con umbral de 200ms para skeleton
   * @returns Objeto con signals y métodos para controlar el estado
   */
  createLoadingState(): LoadingState {
    const isLoading = signal(true);
    const showSkeleton = signal(false);
    const isSkeletonExiting = signal(false);
    const showFeedback = signal(false);
    const feedbackMessage = signal('');
    let skeletonTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let exitTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const startTime = Date.now();

    const clearAllTimeouts = () => {
      if (skeletonTimeoutId) {
        clearTimeout(skeletonTimeoutId);
        skeletonTimeoutId = null;
      }
      if (feedbackTimeoutId) {
        clearTimeout(feedbackTimeoutId);
        feedbackTimeoutId = null;
      }
      if (timeoutTimeoutId) {
        clearTimeout(timeoutTimeoutId);
        timeoutTimeoutId = null;
      }
      if (exitTimeoutId) {
        clearTimeout(exitTimeoutId);
        exitTimeoutId = null;
      }
    };

    // Iniciar timeout para mostrar skeleton después del umbral
    const startSkeletonTimeout = () => {
      if (skeletonTimeoutId) {
        clearTimeout(skeletonTimeoutId);
      }
      skeletonTimeoutId = setTimeout(() => {
        if (isLoading()) {
          showSkeleton.set(true);
        }
      }, this.SKELETON_THRESHOLD);
    };

    // Iniciar timeout para feedback después de 1s
    const startFeedbackTimeout = () => {
      if (feedbackTimeoutId) {
        clearTimeout(feedbackTimeoutId);
      }
      feedbackTimeoutId = setTimeout(() => {
        if (isLoading()) {
          showFeedback.set(true);
          feedbackMessage.set('Conectando con la flota...');
        }
      }, 1000);
    };

    // Iniciar timeout para mensaje de timeout después de 5s
    const startTimeoutTimeout = () => {
      if (timeoutTimeoutId) {
        clearTimeout(timeoutTimeoutId);
      }
      timeoutTimeoutId = setTimeout(() => {
        if (isLoading()) {
          feedbackMessage.set('La conexión está tardando más de lo esperado. Por favor, verifica tu conexión.');
        }
      }, 5000);
    };

    // Iniciar todos los timeouts cuando se crea el estado
    startSkeletonTimeout();
    startFeedbackTimeout();
    startTimeoutTimeout();

    return {
      isLoading,
      showSkeleton,
      isSkeletonExiting,
      showFeedback,
      feedbackMessage,
      setLoading: (value: boolean) => {
        isLoading.set(value);
        if (!value) {
          // Si los datos cargaron, cancelar todos los timeouts
          clearAllTimeouts();
          
          // Si el skeleton está visible, iniciar animación de salida
          if (showSkeleton()) {
            isSkeletonExiting.set(true);
            exitTimeoutId = setTimeout(() => {
              showSkeleton.set(false);
              isSkeletonExiting.set(false);
            }, 200);
          } else {
            showSkeleton.set(false);
            isSkeletonExiting.set(false);
          }
          
          showFeedback.set(false);
          feedbackMessage.set('');
        } else {
          // Si vuelve a cargar, reiniciar los timeouts
          clearAllTimeouts();
          showSkeleton.set(false);
          isSkeletonExiting.set(false);
          showFeedback.set(false);
          feedbackMessage.set('');
          startSkeletonTimeout();
          startFeedbackTimeout();
          startTimeoutTimeout();
        }
      },
      setDataLoaded: () => {
        isLoading.set(false);
        clearAllTimeouts();
        
        // Si el skeleton está visible, iniciar animación de salida
        if (showSkeleton()) {
          isSkeletonExiting.set(true);
          exitTimeoutId = setTimeout(() => {
            showSkeleton.set(false);
            isSkeletonExiting.set(false);
          }, 200); // Duración de la animación de salida
        } else {
          showSkeleton.set(false);
          isSkeletonExiting.set(false);
        }
        
        showFeedback.set(false);
        feedbackMessage.set('');
      }
    };
  }

  /**
   * Coordina múltiples cargas con stagger (delays escalonados)
   * @param loadings Array de estados de carga a coordinar
   * @param delays Array de delays en ms para cada carga (opcional, por defecto: 0, 200, 400)
   */
  coordinateLoadings(loadings: LoadingState[], delays?: number[]): void {
    const defaultDelays = [0, 200, 400, 600];
    const finalDelays = delays || defaultDelays.slice(0, loadings.length);

    loadings.forEach((loading, index) => {
      const delay = finalDelays[index] || 0;
      if (delay > 0) {
        setTimeout(() => {
          loading.setLoading(true);
        }, delay);
      } else {
        loading.setLoading(true);
      }
    });
  }

  /**
   * Crea un estado de carga secuencial coordinado para páginas con KPIs + Contenido
   * Garantiza que los componentes aparezcan de arriba hacia abajo
   * @param config Configuración opcional
   */
  createSequentialLoadingState(config?: SequentialLoadingConfig): SequentialLoadingState {
    const kpisDelay = config?.kpisDelay ?? 100;
    const contentDelay = config?.contentDelay ?? 300;
    const maxWaitTime = config?.maxWaitTime ?? 2000;

    const canShowKPIs = signal<boolean>(false);
    const canShowContent = signal<boolean>(false);
    const kpisError = signal<boolean>(false);
    const contentError = signal<boolean>(false);
    
    // Writable signals para poder resetear errores
    const kpisErrorWritable = signal<boolean>(false);
    const contentErrorWritable = signal<boolean>(false);
    
    const kpisReady = signal<boolean>(false);
    const contentReady = signal<boolean>(false);

    let kpisTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let contentTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let maxWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let checkIntervalId: ReturnType<typeof setInterval> | null = null;

    const clearAllTimeouts = () => {
      if (kpisTimeoutId) {
        clearTimeout(kpisTimeoutId);
        kpisTimeoutId = null;
      }
      if (contentTimeoutId) {
        clearTimeout(contentTimeoutId);
        contentTimeoutId = null;
      }
      if (maxWaitTimeoutId) {
        clearTimeout(maxWaitTimeoutId);
        maxWaitTimeoutId = null;
      }
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }
    };

    const checkAndShowKPIs = () => {
      if (kpisReady() && !canShowKPIs()) {
        kpisTimeoutId = setTimeout(() => {
          canShowKPIs.set(true);
          config?.onKPIsReady?.();
        }, kpisDelay);
      }
    };

    const checkAndShowContent = () => {
      if (contentReady() && !canShowContent()) {
        // CRÍTICO: Esperar a que los KPIs sean VISIBLES (canShowKPIs), no solo listos (kpisReady)
        // Esto garantiza que los KPIs aparezcan primero visualmente antes que el contenido
        const waitForKPIs = !canShowKPIs();
        
        if (waitForKPIs) {
          // Si los KPIs aún no son visibles, esperar hasta que lo sean
          // Limpiar cualquier interval previo para evitar duplicados
          if (checkIntervalId) {
            clearInterval(checkIntervalId);
            checkIntervalId = null;
          }
          
          checkIntervalId = setInterval(() => {
            if (canShowKPIs()) {
              if (checkIntervalId) {
                clearInterval(checkIntervalId);
                checkIntervalId = null;
              }
              // Limpiar timeout de seguridad si existe
              if (maxWaitTimeoutId) {
                clearTimeout(maxWaitTimeoutId);
                maxWaitTimeoutId = null;
              }
              // Mostrar contenido después de que los KPIs sean visibles
              if (contentTimeoutId) {
                clearTimeout(contentTimeoutId);
              }
              contentTimeoutId = setTimeout(() => {
                if (!canShowContent()) {
                  canShowContent.set(true);
                  config?.onContentReady?.();
                }
              }, contentDelay);
            }
          }, 50);
          
          // Timeout de seguridad: mostrar contenido después de maxWaitTime máximo
          // Solo crear si no existe ya
          if (!maxWaitTimeoutId) {
            maxWaitTimeoutId = setTimeout(() => {
              if (checkIntervalId) {
                clearInterval(checkIntervalId);
                checkIntervalId = null;
              }
              if (!canShowContent()) {
                canShowContent.set(true);
                config?.onContentReady?.();
              }
            }, maxWaitTime);
          }
        } else {
          // Si los KPIs ya son visibles, mostrar contenido con delay
          // Limpiar cualquier timeout previo para evitar duplicados
          if (contentTimeoutId) {
            clearTimeout(contentTimeoutId);
            contentTimeoutId = null;
          }
          contentTimeoutId = setTimeout(() => {
            if (!canShowContent()) {
              canShowContent.set(true);
              config?.onContentReady?.();
            }
          }, contentDelay);
        }
      }
    };

    return {
      canShowKPIs,
      canShowContent,
      kpisError: kpisErrorWritable,
      contentError: contentErrorWritable,
      setKPIsReady: (hasError = false) => {
        kpisErrorWritable.set(hasError);
        kpisReady.set(true);
        checkAndShowKPIs();
        // NO llamar checkAndShowContent aquí directamente
        // El interval en checkAndShowContent se encargará cuando canShowKPIs sea true
        // Esto evita llamadas duplicadas y garantiza el orden correcto
      },
      setContentReady: (hasError = false) => {
        contentErrorWritable.set(hasError);
        contentReady.set(true);
        checkAndShowContent();
      },
      reset: () => {
        clearAllTimeouts();
        canShowKPIs.set(false);
        canShowContent.set(false);
        kpisErrorWritable.set(false);
        contentErrorWritable.set(false);
        kpisReady.set(false);
        contentReady.set(false);
      },
      resetErrors: () => {
        kpisErrorWritable.set(false);
        contentErrorWritable.set(false);
      }
    };
  }
}

