import { Component, ChangeDetectionStrategy, input, output, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, DatePicker],
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
                    class="select select-bordered w-full bg-base-100 border-base-200 focus:border-primary">
                    <span class="truncate">
                      {{ getSelectDisplayValue(field.key) }}
                    </span>
                  </div>
                  <ul class="dropdown-content menu bg-base-100 rounded-box z-[100] shadow-xl border border-base-200 mt-1 max-h-[240px] overflow-y-auto" 
                      style="min-width: 100%; width: 100%;">
                    @if (field.options) {
                      @for (option of field.options; track option.value) {
                        <li class="w-full">
                          <a 
                            (click)="onOptionClick($event, field.key, option.value)"
                            [class.active]="getFilterValue(field.key) === option.value"
                            class="w-full block">
                            {{ option.label }}
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
    /* Asegurar que el dropdown tenga el ancho correcto */
    .dropdown {
      position: relative;
    }
    
    .dropdown-content.menu {
      display: block !important;
      flex-direction: column !important;
      min-width: 100% !important;
      width: 100% !important;
      left: 0 !important;
      right: 0 !important;
    }
    
    .dropdown-content.menu li {
      display: block !important;
      width: 100% !important;
      min-width: 100% !important;
      float: none !important;
    }
    
    .dropdown-content.menu li > a {
      display: block !important;
      width: 100% !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      padding: 0.75rem 1rem !important;
      line-height: 1.5 !important;
      text-align: left !important;
      overflow: visible !important;
      text-overflow: unset !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFilters implements OnDestroy {
  fields = input.required<FilterField[]>();
  filters = input<Record<string, any>>({});
  columns = input<number>(4); // Número de columnas en el grid

  filterChange = output<Record<string, any>>();

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

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

  onOptionClick(event: Event, key: string, value: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.onFilterChange(key, value);
    // Cerrar el dropdown después de seleccionar
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown');
    if (dropdown) {
      const button = dropdown.querySelector('[tabindex="0"]') as HTMLElement;
      if (button) {
        button.blur();
      }
    }
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

