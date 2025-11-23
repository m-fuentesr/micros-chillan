import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { AlertCounts } from '../../models/dashboard.models';

@Component({
  selector: 'app-alert-summary',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔴</span>
              <span class="text-2xl font-bold">{{ counts().critical }}</span>
              <span class="text-sm text-base-content/70">críticas</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🟠</span>
              <span class="text-2xl font-bold">{{ counts().warning }}</span>
              <span class="text-sm text-base-content/70">advertencias</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🔵</span>
              <span class="text-2xl font-bold">{{ counts().info }}</span>
              <span class="text-sm text-base-content/70">informativas</span>
            </div>
          </div>
          <button 
            class="btn btn-ghost btn-sm"
            (click)="onToggle()"
            [attr.aria-expanded]="isExpanded()"
            aria-controls="alert-list-panel">
            <span>Ver todas las alertas</span>
            <svg 
              class="w-4 h-4 transition-transform"
              [class.rotate-180]="isExpanded()"
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertSummary {
  counts = input.required<AlertCounts>();
  isExpanded = input(false);
  toggleExpanded = output<void>();

  onToggle(): void {
    this.toggleExpanded.emit();
  }
}

