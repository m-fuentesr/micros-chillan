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
}

