import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HelpMenuItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-help-menu',
  imports: [CommonModule],
  template: `
    <nav class="card bg-base-100 shadow-xl sticky top-6">
      <div class="card-body">
        <h2 class="text-sm uppercase tracking-wide text-base-content/70 mb-4">Índice</h2>
        <ul class="menu menu-vertical w-full p-0">
          @for (item of items(); track item.id) {
            <li>
              <a
                class="text-sm"
                [class.active]="activeSection() === item.id"
                (click)="onItemClick(item.id); $event.preventDefault()">
                {{ item.label }}
              </a>
            </li>
          }
        </ul>
      </div>
    </nav>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpMenu {
  items = input.required<HelpMenuItem[]>();
  activeSection = input<string>('introduccion');
  
  itemClick = output<string>();

  onItemClick(id: string): void {
    this.itemClick.emit(id);
  }
}

