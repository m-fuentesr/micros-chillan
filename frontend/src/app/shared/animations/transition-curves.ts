/**
 * Curvas de transición cubic-bezier separadas por dispositivo
 * Optimizadas para diferentes tipos de navegación y viewports
 */

export const TRANSITION_CURVES = {
  entry: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  
  lateral: {
    desktop: 'cubic-bezier(0.4, 0, 0.2, 1)', // slide horizontal suave
    mobile: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // slide más rápido para touch
  },
  
  depthForward: {
    desktop: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // expansión dramática
    mobile: 'cubic-bezier(0.25, 0.1, 0.25, 1)' // expansión más sutil
  },
  
  depthBackward: {
    desktop: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    mobile: 'cubic-bezier(0.4, 0, 1, 1)' // contracción más rápida
  },
  
  modal: {
    desktop: 'cubic-bezier(0.16, 1, 0.3, 1)', // ease-out-cubic
    mobile: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // ease-in-out-quad
  }
} as const;

/**
 * Duraciones de transición en milisegundos
 */
export const TRANSITION_DURATIONS = {
  entry: 1100,
  entryExit: 650,
  lateral: {
    desktop: 400,
    mobile: 300
  },
  depthForward: {
    desktop: 500,
    mobile: 350
  },
  depthBackward: {
    desktop: 450,
    mobile: 300
  },
  modal: {
    desktop: 350,
    mobile: 250
  }
} as const;

