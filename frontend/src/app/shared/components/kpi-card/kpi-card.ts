import { Component, ChangeDetectionStrategy, input, output, EventEmitter, signal, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

export type KpiCardType = 'financial' | 'danger' | 'warning' | 'success' | 'info';
export type KpiCardSize = 'default' | 'compact' | 'medium';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
      [ngClass]="{
        'gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]': effectiveSize() === 'default',
        'gap-2 md:gap-3 p-3 md:p-4 min-h-[112px] md:min-h-[128px]': effectiveSize() === 'medium',
        'gap-1.5 md:gap-2 p-2 md:p-2.5 min-h-[75px] md:min-h-[85px]': effectiveSize() === 'compact'
      }"
      [class.animate-card-enter]="animationDelay() === 0"
      [class.animate-card-enter-delay-1]="animationDelay() === 1"
      [class.animate-card-enter-delay-2]="animationDelay() === 2"
      [class.animate-card-enter-delay-3]="animationDelay() === 3">
      
      <!-- Background blur effect -->
      <div 
        class="absolute right-0 top-0 rounded-full opacity-50 blur-xl"
        [ngClass]="{
          '-mt-4 -mr-4 h-24 w-24': effectiveSize() === 'default',
          '-mt-3 -mr-3 h-20 w-20': effectiveSize() === 'medium',
          '-mt-2 -mr-2 h-12 w-12': effectiveSize() === 'compact',
          'bg-primary/5': type() === 'financial' || type() === 'info',
          'bg-error/5': type() === 'danger',
          'bg-warning/5': type() === 'warning',
          'bg-success/5': type() === 'success'
        }">
      </div>
      
      <!-- Header: Icon + Title -->
      <div class="relative flex items-center"
        [ngClass]="{
          'gap-3': effectiveSize() === 'default',
          'gap-2.5': effectiveSize() === 'medium',
          'gap-2': effectiveSize() === 'compact'
        }">
        <div 
          class="flex items-center justify-center rounded-xl ring-1 shrink-0"
          [ngClass]="{
            'h-10 w-10': effectiveSize() === 'default',
            'h-8 w-8': effectiveSize() === 'medium',
            'h-5 w-5': effectiveSize() === 'compact',
            'bg-primary/10 text-primary ring-primary/15': type() === 'financial' || type() === 'info',
            'bg-error/10 text-error ring-error/15': type() === 'danger',
            'bg-warning/10 text-warning ring-warning/15': type() === 'warning',
            'bg-success/10 text-success ring-success/15': type() === 'success'
          }">
          <ng-content select="[icon]"></ng-content>
        </div>
        <div class="flex-1 min-w-0">
          <h3 
            class="font-bold uppercase tracking-wider text-base-content"
            [ngClass]="{
              'text-xs': effectiveSize() === 'default',
              'text-[10px]': effectiveSize() === 'medium' || effectiveSize() === 'compact'
            }">
            {{ title() }}
          </h3>
          @if (subtitle()) {
            <p 
              class="font-medium text-zinc-400"
              [ngClass]="{
                'text-[10px] mt-0.5': effectiveSize() === 'default',
                'text-[9px] mt-0.5': effectiveSize() === 'medium',
                'text-[8px] mt-0.5': effectiveSize() === 'compact'
              }">
              {{ subtitle() }}
            </p>
          }
        </div>
      </div>
      
      <!-- Body: Value -->
      <div class="relative flex flex-col">
        <div 
          class="font-black tracking-tight text-zinc-900 break-words overflow-hidden leading-tight"
          [ngClass]="{
            'text-base sm:text-lg md:text-xl lg:text-2xl pl-[52px]': effectiveSize() === 'default',
            'text-[10px] sm:text-xs md:text-sm lg:text-base pl-[39px]': effectiveSize() === 'medium',
            'text-[9px] sm:text-[10px] md:text-xs lg:text-sm pl-[28px]': effectiveSize() === 'compact'
          }">
          {{ value() }}
        </div>
        
        <!-- Footer: Badge, Success Text, or Action -->
        <div 
          class="flex items-center"
          [ngClass]="{
            'mt-2 min-h-[24px]': effectiveSize() === 'default',
            'mt-1.5 min-h-[20px]': effectiveSize() === 'medium',
            'mt-1 min-h-[16px]': effectiveSize() === 'compact',
            'pl-[52px]': (badgeText() || successText()) && effectiveSize() === 'default',
            'pl-[39px]': (badgeText() || successText()) && effectiveSize() === 'medium',
            'pl-[28px]': (badgeText() || successText()) && effectiveSize() === 'compact'
          }">
          @if (badgeText()) {
            <span 
              class="inline-flex items-center rounded ring-1 ring-inset"
              [ngClass]="{
                'px-1.5 py-0.5 text-[10px]': effectiveSize() === 'default',
                'px-1 py-0.5 text-[9px]': effectiveSize() === 'medium',
                'px-1 py-0.5 text-[8px]': effectiveSize() === 'compact',
                'bg-primary/10 text-primary ring-primary/15': type() === 'financial' || type() === 'info',
                'bg-error/10 text-error ring-error/15': type() === 'danger',
                'bg-warning/10 text-warning ring-warning/15': type() === 'warning',
                'bg-success/10 text-success ring-success/15': type() === 'success'
              }">
              {{ badgeText() }}
            </span>
          }
          
          @if (successText()) {
            <span 
              class="inline-flex items-center gap-1.5 rounded bg-success/10 text-success ring-1 ring-inset ring-success/15"
              [ngClass]="{
                'px-1.5 py-0.5 text-[10px]': effectiveSize() === 'default',
                'px-1 py-0.5 text-[9px]': effectiveSize() === 'medium',
                'px-1 py-0.5 text-[8px]': effectiveSize() === 'compact'
              }">
              <svg 
                class="fill-none stroke-current"
                [ngClass]="{
                  'h-3 w-3': effectiveSize() === 'default',
                  'h-2.5 w-2.5': effectiveSize() === 'medium',
                  'h-2 w-2': effectiveSize() === 'compact'
                }"
                viewBox="0 0 24 24" 
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              {{ successText() }}
            </span>
          }
          
          @if (actionText() && !badgeText() && !successText()) {
            <button 
              type="button"
              class="group/btn inline-flex items-center gap-1 font-bold transition-colors"
              [ngClass]="{
                'text-[11px]': effectiveSize() === 'default',
                'text-[10px]': effectiveSize() === 'medium',
                'text-[9px]': effectiveSize() === 'compact',
                'text-primary hover:text-primary-focus': type() === 'financial' || type() === 'info',
                'text-error hover:text-error-focus': type() === 'danger',
                'text-warning hover:text-warning-focus': type() === 'warning',
                'text-success hover:text-success-focus': type() === 'success'
              }"
              (click)="onActionClick.emit()">
              {{ actionText() }}
              <svg 
                class="transition-transform group-hover/btn:translate-x-0.5 fill-none stroke-current" 
                [ngClass]="{
                  'w-3 h-3': effectiveSize() === 'default',
                  'w-2.5 h-2.5': effectiveSize() === 'medium',
                  'w-2 h-2': effectiveSize() === 'compact'
                }"
                viewBox="0 0 24 24" 
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCard implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isMobile = signal<boolean>(false);
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  title = input.required<string>();
  subtitle = input<string>('');
  value = input.required<string>();
  type = input<KpiCardType>('financial');
  size = input<KpiCardSize>('default');
  responsive = input<boolean>(false);
  badgeText = input<string>('');
  successText = input<string>('');
  actionText = input<string>('');
  animationDelay = input<number>(0);
  
  onActionClick = output<void>();

  // Computed size que considera el modo responsive
  // Inicializar con 'default', se actualizará en ngOnInit
  effectiveSize = signal<KpiCardSize>('default');

  ngOnInit(): void {
    // Inicializar con el tamaño actual
    this.effectiveSize.set(this.size());
    
    if (this.responsive() && isPlatformBrowser(this.platformId)) {
      // Detectar viewport móvil (menor a md breakpoint de Tailwind: 768px)
      this.mediaQuery = window.matchMedia('(max-width: 767px)');
      this.isMobile.set(this.mediaQuery.matches);
      
      this.updateEffectiveSize();
      
      this.mediaQueryHandler = (e: MediaQueryListEvent) => {
        this.isMobile.set(e.matches);
        this.updateEffectiveSize();
      };
      
      this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
    }
  }

  private updateEffectiveSize(): void {
    if (this.responsive()) {
      this.effectiveSize.set(this.isMobile() ? 'compact' : 'default');
    } else {
      // Si el tamaño es 'medium', mantenerlo siempre (no cambia con responsive)
      this.effectiveSize.set(this.size());
    }
  }
}

