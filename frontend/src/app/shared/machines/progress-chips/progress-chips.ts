import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-progress-chips',
  imports: [],
  template: `
    <div class="flex flex-wrap gap-2">
      <span class="badge badge-lg gap-2"
        [class.badge-primary]="activeStep() === 'general'"
        [class.badge-outline]="activeStep() !== 'general'">
        @if (completedSteps().includes('general')) {
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.35 2.35 4.47-6.705a.75.75 0 0 1 1.04-.208Z" clip-rule="evenodd" />
          </svg>
        }
        Datos generales
      </span>
      <span class="badge badge-lg gap-2"
        [class.badge-primary]="activeStep() === 'docs'"
        [class.badge-outline]="activeStep() !== 'docs'">
        @if (completedSteps().includes('docs')) {
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.35 2.35 4.47-6.705a.75.75 0 0 1 1.04-.208Z" clip-rule="evenodd" />
          </svg>
        }
        Documentación
      </span>
      <span class="badge badge-lg gap-2"
        [class.badge-primary]="activeStep() === 'confirm'"
        [class.badge-outline]="activeStep() !== 'confirm'">
        @if (completedSteps().includes('confirm')) {
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.35 2.35 4.47-6.705a.75.75 0 0 1 1.04-.208Z" clip-rule="evenodd" />
          </svg>
        }
        Confirmación
      </span>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressChips {
  activeStep = input<'general' | 'docs' | 'confirm'>('general');
  completedSteps = input<Array<'general' | 'docs' | 'confirm'>>([]);
}

