import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-help-step',
  imports: [],
  template: `
    <div class="bg-base-200 border-l-4 border-primary p-4 rounded-lg mb-4">
      <div class="flex items-start gap-3">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content rounded-full w-6 h-6">
            <span class="text-xs font-bold">{{ number() }}</span>
          </div>
        </div>
        <div class="flex-1">
          <div class="font-bold text-base mb-1">{{ title() }}</div>
          <p class="text-sm text-base-content/70 leading-relaxed">{{ text() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpStep {
  number = input.required<number>();
  title = input.required<string>();
  text = input.required<string>();
}

