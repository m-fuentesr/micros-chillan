import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePicker } from '../date-picker/date-picker';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'number' | 'custom';
  icon?: string;
  placeholder?: string;
  options?: Array<{ value: string | number | null; label: string }>;
  minDate?: string | null;
  maxDate?: string | null;
}

@Component({
  selector: 'app-search-filters',
  imports: [CommonModule, DatePicker],
  template: `
    <div class="bg-base-50/50 p-5 sm:p-6 rounded-xl border border-base-200/50 mb-6">
      <!-- Header de Filtros -->
      <div class="flex items-center justify-between gap-4 mb-5">
        <div class="flex items-center gap-2">
          <div class="w-1 h-4 rounded-full bg-primary"></div>
          <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Filtros de Búsqueda
          </p>
        </div>
        @if (hasActiveFilters()) {
          <button 
            class="btn btn-ghost btn-xs sm:btn-sm gap-1.5 px-2 sm:px-3 rounded-lg hover:bg-base-200 transition-all active:scale-95 text-error/70 hover:text-error" 
            (click)="onClearFilters()"
            type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 sm:w-4 sm:h-4">
              <path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.972.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.591l-4.682 4.683a2.25 2.25 0 00-.659 1.591v4.242a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L4.659 8.591A2.25 2.25 0 014 7V4.341a.75.75 0 01.628-.74z" clip-rule="evenodd" />
            </svg>
            <span class="hidden sm:inline">Limpiar</span>
          </button>
        }
      </div>

      <!-- Grid de Filtros -->
      <div [class]="gridClasses()">
        @for (field of fields(); track field.key) {
          @switch (field.type) {
            @case ('select') {
              <div class="form-control">
                <label class="label py-1.5">
                  <span class="label-text text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                    @if (field.icon) {
                      <span [innerHTML]="field.icon" class="w-3.5 h-3.5 text-primary"></span>
                    }
                    {{ field.label }}
                  </span>
                </label>
                <div class="dropdown dropdown-bottom w-full">
                  <div 
                    tabindex="0" 
                    role="button" 
                    class="select select-bordered w-full bg-base-100 border-base-200 focus:border-primary transition-colors cursor-pointer">
                    <span class="truncate">
                      {{ getSelectDisplayValue(field.key) }}
                    </span>
                  </div>
                  <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[100] w-full shadow-lg border border-base-200 mt-1 max-h-[288px] overflow-y-auto overscroll-contain">
                    @if (field.options) {
                      @for (option of field.options; track option.value) {
                        <li>
                          <a 
                            (click)="onFilterChange(field.key, option.value)"
                            [class.active]="getFilterValue(field.key) === option.value"
                            class="cursor-pointer flex items-center justify-between gap-2">
                            <span>{{ option.label }}</span>
                            @if (getFilterValue(field.key) === option.value) {
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-primary shrink-0">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                              </svg>
                            }
                          </a>
                        </li>
                      }
                    }
                  </ul>
                </div>
              </div>
            }
            @case ('date') {
              <app-date-picker
                [label]="field.label"
                [placeholder]="field.placeholder || 'Seleccionar fecha'"
                [value]="getDateValue(field.key)"
                [minDate]="field.minDate || null"
                [maxDate]="field.maxDate || null"
                (valueChange)="onFilterChange(field.key, $event)" />
            }
            @case ('text') {
              <div class="form-control">
                <label class="label py-1.5">
                  <span class="label-text text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                    @if (field.icon) {
                      <span [innerHTML]="field.icon" class="w-3.5 h-3.5 text-primary"></span>
                    }
                    {{ field.label }}
                  </span>
                </label>
                <input
                  type="text"
                  [placeholder]="field.placeholder || ''"
                  class="input input-bordered w-full bg-base-100 border-base-200 focus:border-primary transition-colors"
                  [value]="getFilterValue(field.key) || ''"
                  (input)="onTextInput(field.key, $event)"
                  (blur)="onTextBlur(field.key, $event)">
              </div>
            }
            @case ('number') {
              <div class="form-control">
                <label class="label py-1.5">
                  <span class="label-text text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                    @if (field.icon) {
                      <span [innerHTML]="field.icon" class="w-3.5 h-3.5 text-primary"></span>
                    }
                    {{ field.label }}
                  </span>
                </label>
                <input
                  type="number"
                  [placeholder]="field.placeholder || ''"
                  class="input input-bordered w-full bg-base-100 border-base-200 focus:border-primary transition-colors"
                  [value]="getFilterValue(field.key) || ''"
                  (input)="onNumberInput(field.key, $event)"
                  (blur)="onNumberBlur(field.key, $event)">
              </div>
            }
            @case ('custom') {
              <ng-content [select]="'[' + field.key + ']'"></ng-content>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Scroll personalizado para el dropdown de filtros */
    .dropdown-content.menu {
      scrollbar-width: thin;
      scrollbar-color: hsl(var(--bc) / 0.2) transparent;
    }

    .dropdown-content.menu::-webkit-scrollbar {
      width: 6px;
    }

    .dropdown-content.menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .dropdown-content.menu::-webkit-scrollbar-thumb {
      background-color: hsl(var(--bc) / 0.2);
      border-radius: 3px;
    }

    .dropdown-content.menu::-webkit-scrollbar-thumb:hover {
      background-color: hsl(var(--bc) / 0.3);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFilters {
  fields = input.required<FilterField[]>();
  filters = input<Record<string, any>>({});
  columns = input<number>(4); // Número de columnas en el grid

  filterChange = output<Record<string, any>>();

  gridClasses = computed(() => {
    const cols = this.columns();
    if (cols === 1) return 'grid grid-cols-1 gap-4';
    if (cols === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    if (cols === 3) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
  });

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return Object.values(f).some(v => v !== null && v !== undefined && v !== '');
  });

  getFilterValue(key: string): any {
    return this.filters()[key] ?? null;
  }

  getDateValue(key: string): string | null {
    const value = this.getFilterValue(key);
    return typeof value === 'string' ? value : null;
  }

  getSelectDisplayValue(key: string): string {
    const field = this.fields().find(f => f.key === key);
    if (!field || !field.options) return 'Seleccionar...';
    
    const value = this.getFilterValue(key);
    if (value === null || value === undefined || value === '') {
      // Buscar la opción con valor vacío o la primera opción
      const emptyOption = field.options.find(opt => opt.value === '' || opt.value === null);
      return emptyOption?.label || field.options[0]?.label || 'Seleccionar...';
    }
    
    const option = field.options.find(opt => opt.value === value);
    return option?.label || 'Seleccionar...';
  }

  onTextInput(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onFilterChange(key, target.value);
  }

  onTextBlur(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onFilterChange(key, target.value || null);
  }

  onNumberInput(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? Number(target.value) : null;
    this.onFilterChange(key, value);
  }

  onNumberBlur(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? Number(target.value) : null;
    this.onFilterChange(key, value);
  }

  onFilterChange(key: string, value: any): void {
    const newFilters = {
      ...this.filters(),
      [key]: value
    };
    this.filterChange.emit(newFilters);
  }

  onClearFilters(): void {
    this.filterChange.emit({});
  }
}

