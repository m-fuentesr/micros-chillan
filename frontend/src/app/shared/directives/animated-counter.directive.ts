import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
  selector: '[appAnimatedCounter]',
  standalone: true
})
export class AnimatedCounterDirective implements OnChanges, OnInit, OnDestroy {
  @Input('appAnimatedCounter') targetValue: number = 0;
  @Input() duration: number = 1000; // Duración en milisegundos
  @Input() format: 'number' | 'currency' = 'number';
  @Input() currencyCode: string = 'CLP';
  @Input() currencyDisplay: 'symbol' | 'symbol-narrow' | 'code' | 'name' = 'symbol-narrow';
  @Input() minFractionDigits: number = 0;
  @Input() maxFractionDigits: number = 0;

  private currentValue: number = 0;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private startValue: number = 0;
  private isAnimating: boolean = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // Inicializar con 0
    this.currentValue = 0;
    this.updateDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['targetValue']) {
      const newValue = changes['targetValue'].currentValue;
      const oldValue = changes['targetValue'].previousValue ?? 0;
      
      // Validar que el nuevo valor sea un número válido (incluye 0 y valores negativos)
      if (typeof newValue === 'number' && !isNaN(newValue)) {
        if (changes['targetValue'].firstChange) {
          // En la primera carga, animar desde 0 (o desde el valor si es negativo)
          const startValue = newValue < 0 ? newValue : 0;
          if (newValue !== 0) {
            // Pequeño delay para que la página termine de renderizar
            setTimeout(() => {
              this.startAnimation(startValue, newValue);
            }, 100);
          } else {
            // Si es 0, solo actualizar sin animar
            this.currentValue = 0;
            this.updateDisplay();
          }
        } else {
          // En cambios posteriores, animar desde el valor anterior solo si cambió
          if (newValue !== oldValue) {
            this.startAnimation(oldValue, newValue);
          }
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  private startAnimation(from: number, to: number): void {
    this.cancelAnimation();
    this.startValue = from;
    this.currentValue = from;
    this.startTime = performance.now();
    this.isAnimating = true;
    this.animate();
  }

  private animate = (): void => {
    if (!this.isAnimating) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // Curva de easing suave (ease-out-cubic)
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    // Interpolación
    this.currentValue = this.startValue + (this.targetValue - this.startValue) * easedProgress;
    this.updateDisplay();

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      // Asegurar valor final exacto
      this.currentValue = this.targetValue;
      this.updateDisplay();
      this.isAnimating = false;
    }
  };

  private updateDisplay(): void {
    if (!this.el.nativeElement) return;

    let displayValue: string;

    if (this.format === 'currency') {
      // Formato que coincide con Angular currency pipe 'symbol-narrow'
      const roundedValue = Math.round(this.currentValue);
      // Intl.NumberFormat maneja automáticamente valores negativos
      const formatted = new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: this.minFractionDigits,
        maximumFractionDigits: this.maxFractionDigits
      }).format(roundedValue);
      
      // Para symbol-narrow, Angular usa solo el símbolo $ sin espacio
      // Intl.NumberFormat ya incluye el signo negativo si es necesario
      // Solo necesitamos agregar el $ al principio
      displayValue = formatted.startsWith('-') 
        ? `-$${formatted.substring(1).trim()}` 
        : `$${formatted.trim()}`;
    } else {
      displayValue = Math.round(this.currentValue).toString();
    }

    this.el.nativeElement.textContent = displayValue;
  }

  private cancelAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }
}

