import { Component, ChangeDetectionStrategy, input, output, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePicker } from '../date-picker/date-picker';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'number' | 'month-year' | 'custom';
  icon?: string;
  placeholder?: string;
  options?: Array<{ value: string | number | null; label: string }>;
  minDate?: string | null;
  maxDate?: string | null;
  monthOnly?: boolean; // Si es true, el date picker solo permite seleccionar mes/año
  // Para month-year: keys para mes y año
  monthKey?: string;
  yearKey?: string;
}

@Component({
  selector: 'app-search-filters',
  imports: [CommonModule, FormsModule, DatePicker, UiIconComponent],
  template: `
    <div class="bg-base-50/50 p-5 sm:p-6 rounded-3xl border border-base-200/50 mb-6">
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
            <ui-icon name="Filter" size="sm" />
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
                <select
                  class="select select-bordered w-full bg-base-100 border-base-200 focus:border-primary transition-colors"
                  [value]="getFilterValue(field.key) || ''"
                  (change)="onSelectChange($event, field.key)">
                  @if (field.options) {
                    @for (option of field.options; track option.value) {
                      <option [value]="option.value ?? ''">
                        {{ option.label }}
                      </option>
                    }
                  }
                </select>
              </div>
            }
            @case ('date') {
              <app-date-picker
                [label]="field.label"
                [placeholder]="field.placeholder || 'Seleccionar fecha'"
                [value]="getDateValue(field.key)"
                [minDate]="field.minDate || null"
                [maxDate]="field.maxDate || null"
                [monthOnly]="field.monthOnly || false"
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
            @case ('month-year') {
              <div class="form-control">
                <label class="label py-1.5">
                  <span class="label-text text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                    @if (field.icon) {
                      <span [innerHTML]="field.icon" class="w-3.5 h-3.5 text-primary"></span>
                    }
                    {{ field.label }}
                  </span>
                </label>
                <div class="flex gap-2">
                  <select
                    class="select select-bordered flex-1 bg-base-100 border-base-200 focus:border-primary transition-colors"
                    [value]="getFilterValue(field.monthKey || '') || ''"
                    (change)="onMonthYearChange(field.monthKey || '', $event, 'month')">
                    <option value="">Mes</option>
                    @for (month of getMonths(); track month.value) {
                      <option [value]="month.value">{{ month.label }}</option>
                    }
                  </select>
                  <select
                    class="select select-bordered flex-1 bg-base-100 border-base-200 focus:border-primary transition-colors"
                    [value]="getFilterValue(field.yearKey || '') || ''"
                    (change)="onMonthYearChange(field.yearKey || '', $event, 'year')">
                    <option value="">Año</option>
                    @for (year of getYears(); track year) {
                      <option [value]="year">{{ year }}</option>
                    }
                  </select>
                </div>
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
  styles: [],
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

  onSelectChange(event: Event, key: string): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value === '' ? null : target.value;
    this.onFilterChange(key, value);
  }

  onMonthYearChange(key: string, event: Event, type: 'month' | 'year'): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value === '' ? null : (type === 'month' ? Number(target.value) : Number(target.value));
    this.onFilterChange(key, value);
  }

  getMonths(): Array<{ value: number; label: string }> {
    return [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
  }

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    // Años desde 2020 hasta el año actual + 1
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse(); // Más recientes primero
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

