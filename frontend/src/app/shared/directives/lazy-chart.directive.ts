import { Directive, ElementRef, signal, OnDestroy, afterNextRender, inject } from '@angular/core';

/**
 * Directiva para lazy loading de gráficos Chart.js usando IntersectionObserver.
 * Solo carga el gráfico cuando entra en el viewport, reduciendo el bundle inicial.
 */
@Directive({
  selector: '[appLazyChart]',
  standalone: true,
  exportAs: 'lazyChart'
})
export class LazyChartDirective implements OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  
  isVisible = signal(false);

  constructor() {
    afterNextRender(() => {
      if (typeof IntersectionObserver !== 'undefined') {
        this.setupObserver();
      } else {
        // Fallback para navegadores sin soporte
        this.isVisible.set(true);
      }
    });
  }

  private setupObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px', // Cargar 50px antes de que sea visible
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible.set(true);
          // Desconectar después de la primera intersección
          this.observer?.disconnect();
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

