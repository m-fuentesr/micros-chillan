import { Component, ChangeDetectionStrategy, input, output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiCardType = 'financial' | 'danger' | 'warning' | 'success' | 'info';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="group relative flex flex-col gap-3 md:gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] min-h-[150px] md:min-h-[170px]"
      [class.animate-card-enter]="animationDelay() === 0"
      [class.animate-card-enter-delay-1]="animationDelay() === 1"
      [class.animate-card-enter-delay-2]="animationDelay() === 2"
      [class.animate-card-enter-delay-3]="animationDelay() === 3">
      
      <!-- Background blur effect -->
      <div 
        class="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full opacity-50 blur-xl"
        [ngClass]="{
          'bg-primary/5': type() === 'financial' || type() === 'info',
          'bg-error/5': type() === 'danger',
          'bg-warning/5': type() === 'warning',
          'bg-success/5': type() === 'success'
        }">
      </div>
      
      <!-- Header: Icon + Title -->
      <div class="relative flex items-center gap-3">
        <div 
          class="flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0"
          [ngClass]="{
            'bg-primary/10 text-primary ring-primary/15': type() === 'financial' || type() === 'info',
            'bg-error/10 text-error ring-error/15': type() === 'danger',
            'bg-warning/10 text-warning ring-warning/15': type() === 'warning',
            'bg-success/10 text-success ring-success/15': type() === 'success'
          }">
          <ng-content select="[icon]"></ng-content>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xs font-bold uppercase tracking-wider text-base-content">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="text-[10px] font-medium text-zinc-400 mt-0.5">{{ subtitle() }}</p>
          }
        </div>
      </div>
      
      <!-- Body: Value -->
      <div class="relative flex flex-col">
        <div class="text-lg sm:text-2xl font-black tracking-tight text-zinc-900 pl-[52px]">
          {{ value() }}
        </div>
        
        <!-- Footer: Badge, Success Text, or Action -->
        <div class="mt-2 flex items-center min-h-[24px]" [ngClass]="{'pl-[52px]': badgeText() || successText()}">
          @if (badgeText()) {
            <span 
              class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset"
              [ngClass]="{
                'bg-primary/10 text-primary ring-primary/15': type() === 'financial' || type() === 'info',
                'bg-error/10 text-error ring-error/15': type() === 'danger',
                'bg-warning/10 text-warning ring-warning/15': type() === 'warning',
                'bg-success/10 text-success ring-success/15': type() === 'success'
              }">
              {{ badgeText() }}
            </span>
          }
          
          @if (successText()) {
            <span class="inline-flex items-center gap-1.5 rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success ring-1 ring-inset ring-success/15">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              {{ successText() }}
            </span>
          }
          
          @if (actionText() && !badgeText() && !successText()) {
            <button 
              type="button"
              class="group/btn inline-flex items-center gap-1 text-[11px] font-bold transition-colors"
              [ngClass]="{
                'text-primary hover:text-primary-focus': type() === 'financial' || type() === 'info',
                'text-error hover:text-error-focus': type() === 'danger',
                'text-warning hover:text-warning-focus': type() === 'warning',
                'text-success hover:text-success-focus': type() === 'success'
              }"
              (click)="onActionClick.emit()">
              {{ actionText() }}
              <svg 
                class="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
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
export class KpiCard {
  title = input.required<string>();
  subtitle = input<string>('');
  value = input.required<string>();
  type = input<KpiCardType>('financial');
  badgeText = input<string>('');
  successText = input<string>('');
  actionText = input<string>('');
  animationDelay = input<number>(0);
  
  onActionClick = output<void>();
}

