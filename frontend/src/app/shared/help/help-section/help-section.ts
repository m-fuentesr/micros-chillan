import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { HelpStep } from '../help-step/help-step';
import { HelpTip } from '../help-tip/help-tip';
import { HelpWarning } from '../help-warning/help-warning';

@Component({
  selector: 'app-help-section',
  imports: [HelpStep, HelpTip, HelpWarning],
  template: `
    <section [id]="id()" class="mb-8 pb-8 border-b border-base-300 last:border-b-0">
      <h2 class="text-2xl font-bold mb-4">{{ title() }}</h2>
      
      @if (text()) {
        <p class="text-base text-base-content/70 mb-4 leading-relaxed">{{ text() }}</p>
      }

      @if (subtitle()) {
        <h3 class="text-xl font-bold mt-6 mb-4 border-l-4 border-l-primary pl-3">{{ subtitle() }}</h3>
      }

      @if (listItems().length > 0) {
        <ul class="list-disc list-inside space-y-2 mb-4 text-base text-base-content/70">
          @for (item of listItems(); track $index) {
            <li [innerHTML]="item"></li>
          }
        </ul>
      }

      @if (subtitle2()) {
        <h3 class="text-xl font-bold mt-6 mb-4 border-l-4 border-l-primary pl-3">{{ subtitle2() }}</h3>
      }

      @if (listItems2().length > 0) {
        <ul class="list-disc list-inside space-y-2 mb-4 text-base text-base-content/70">
          @for (item of listItems2(); track $index) {
            <li>{{ item }}</li>
          }
        </ul>
      }

      @if (text2()) {
        <p class="text-base text-base-content/70 mb-4 leading-relaxed">{{ text2() }}</p>
      }

      @if (steps().length > 0) {
        <div class="space-y-4 mb-4">
          @for (step of steps(); track step.number) {
            <app-help-step
              [number]="step.number"
              [title]="step.title"
              [text]="step.text" />
          }
        </div>
      }

      @if (tip()) {
        <app-help-tip
          [title]="tip()!.title"
          [text]="tip()!.text" />
      }

      @if (warning()) {
        <app-help-warning
          [title]="warning()!.title"
          [text]="warning()!.text" />
      }

      <ng-content />
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpSection {
  id = input.required<string>();
  title = input.required<string>();
  text = input<string>('');
  subtitle = input<string>('');
  subtitle2 = input<string>('');
  text2 = input<string>('');
  listItems = input<string[]>([]);
  listItems2 = input<string[]>([]);
  steps = input<Array<{ number: number; title: string; text: string }>>([]);
  tip = input<{ title: string; text: string } | null>(null);
  warning = input<{ title: string; text: string } | null>(null);
}

