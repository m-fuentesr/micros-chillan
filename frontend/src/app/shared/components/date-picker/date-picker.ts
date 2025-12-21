import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-date-picker',
  imports: [CommonModule, UiIconComponent],
  template: `
    <div class="form-control">
      <label class="label py-1.5">
        <span class="label-text text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
          <ui-icon name="Calendar" size="sm" class="text-primary" />
          {{ label() }}
        </span>
      </label>
      <div class="relative w-full">
        <div 
          #inputRef
          tabindex="0" 
          role="button" 
          class="input input-bordered w-full bg-base-100 border-base-200 focus:border-primary transition-colors cursor-pointer flex items-center justify-between"
          (click)="toggleCalendar()"
          (blur)="onBlur($event)">
          <span [class.text-base-content/50]="!displayValue()">
            {{ displayValue() || placeholder() }}
          </span>
          <ui-icon name="Calendar" size="sm" class="text-base-content/40" />
        </div>
        @if (isOpen()) {
          <div 
            #calendarRef
            class="absolute top-full left-0 w-full mt-1 bg-base-100 rounded-box z-[9999] shadow-2xl border border-base-200 p-4 calendar-container">
            @if (monthOnly()) {
              <!-- Vista de solo meses -->
              <!-- Header con año -->
              <div class="flex items-center justify-between mb-4">
                <button 
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  (click)="previousYear()">
                  <ui-icon name="ChevronLeft" size="sm" />
                </button>
                <div class="text-base font-semibold text-base-content">
                  {{ currentYear() }}
                </div>
                <button 
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  (click)="nextYear()">
                  <ui-icon name="ChevronRight" size="sm" />
                </button>
              </div>

              <!-- Grid de meses -->
              <div class="grid grid-cols-3 gap-2">
                @for (month of monthsList(); track month.value) {
                  <button
                    type="button"
                    class="btn btn-sm h-12 rounded-lg transition-all"
                    [class.btn-primary]="month.isSelected"
                    [class.btn-ghost]="!month.isSelected"
                    (click)="selectMonth(month.value)">
                    {{ month.label }}
                  </button>
                }
              </div>

              <!-- Botones de acción -->
              <div class="flex gap-2 mt-4 pt-4 border-t border-base-200">
                <button 
                  type="button"
                  class="btn btn-sm btn-ghost flex-1"
                  (click)="clearDate()">
                  Limpiar
                </button>
                <button 
                  type="button"
                  class="btn btn-sm btn-primary flex-1"
                  (click)="closeCalendar()">
                  Aceptar
                </button>
              </div>
            } @else {
              <!-- Vista normal de calendario con días -->
              <!-- Header del Calendario -->
              <div class="flex items-center justify-between mb-4">
                <button 
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  (click)="previousMonth()">
                  <ui-icon name="ChevronLeft" size="sm" />
                </button>
                <div class="text-sm font-semibold text-base-content">
                  {{ currentMonthYear() }}
                </div>
                <button 
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  (click)="nextMonth()">
                  <ui-icon name="ChevronRight" size="sm" />
                </button>
              </div>

              <!-- Días de la semana -->
              <div class="grid grid-cols-7 gap-1 mb-2">
                @for (day of weekDays(); track day) {
                  <div class="text-center text-xs font-semibold text-base-content/50 py-1">
                    {{ day }}
                  </div>
                }
              </div>

              <!-- Calendario -->
              <div class="grid grid-cols-7 gap-1">
                @for (day of calendarDays(); track day.date) {
                  <button
                    type="button"
                    class="btn btn-sm h-8 min-h-0 p-0 rounded-lg transition-all"
                    [class.btn-primary]="day.isSelected"
                    [class.btn-ghost]="!day.isSelected && day.isCurrentMonth"
                    [class.text-base-content/30]="!day.isCurrentMonth"
                    [class.bg-base-200]="day.isToday && !day.isSelected"
                    [class.font-bold]="day.isToday"
                    [disabled]="!day.isCurrentMonth"
                    (click)="selectDate(day.date)">
                    {{ day.day }}
                  </button>
                }
              </div>

              <!-- Botones de acción -->
              <div class="flex gap-2 mt-4 pt-4 border-t border-base-200">
                <button 
                  type="button"
                  class="btn btn-sm btn-ghost flex-1"
                  (click)="clearDate()">
                  Limpiar
                </button>
                <button 
                  type="button"
                  class="btn btn-sm btn-primary flex-1"
                  (click)="closeCalendar()">
                  Aceptar
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      width: 100%;
      min-width: 280px;
      animation: calendar-enter 200ms ease-out;
    }

    @keyframes calendar-enter {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePicker {
  label = input<string>('Fecha');
  placeholder = input<string>('Seleccionar fecha');
  value = input<string | null>(null);
  minDate = input<string | null>(null);
  maxDate = input<string | null>(null);
  monthOnly = input<boolean>(false); // Si es true, solo permite seleccionar mes/año

  valueChange = output<string | null>();

  isOpen = signal(false);
  currentDate = signal(new Date());
  currentYearView = signal(new Date().getFullYear());

  displayValue = computed(() => {
    const val = this.value();
    if (!val) return null;
    try {
      // Parsear fecha de forma segura para evitar problemas de zona horaria
      const parts = val.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-11
        const day = parseInt(parts[2], 10);
        
        // Crear fecha en zona horaria local explícitamente
        const d = new Date(year, month, day);
        
        if (this.monthOnly()) {
          // Solo mostrar mes y año
          return d.toLocaleDateString('es-CL', { 
            month: 'long',
            year: 'numeric'
          });
        }
        return d.toLocaleDateString('es-CL', { 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
        });
      } else {
        // Fallback para formatos no estándar
        const d = new Date(val);
        if (this.monthOnly()) {
          return d.toLocaleDateString('es-CL', { 
            month: 'long',
            year: 'numeric'
          });
        }
        return d.toLocaleDateString('es-CL', { 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      return val;
    }
  });

  currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('es-CL', { 
      month: 'long', 
      year: 'numeric' 
    });
  });

  currentYear = computed(() => {
    return this.currentYearView();
  });

  monthsList = computed(() => {
    const year = this.currentYearView();
    const selectedValue = this.value();
    let selectedMonth: number | null = null;
    let selectedYear: number | null = null;
    
    if (selectedValue) {
      // Parsear fecha de forma segura para evitar problemas de zona horaria
      const parts = selectedValue.split('-');
      if (parts.length === 3) {
        selectedYear = parseInt(parts[0], 10);
        selectedMonth = parseInt(parts[1], 10) - 1; // Convertir de 1-12 a 0-11
      } else {
        // Fallback al método anterior si el formato no es YYYY-MM-DD
        const d = new Date(selectedValue);
        selectedMonth = d.getMonth();
        selectedYear = d.getFullYear();
      }
    }

    const months = [
      { value: 0, label: 'Enero' },
      { value: 1, label: 'Febrero' },
      { value: 2, label: 'Marzo' },
      { value: 3, label: 'Abril' },
      { value: 4, label: 'Mayo' },
      { value: 5, label: 'Junio' },
      { value: 6, label: 'Julio' },
      { value: 7, label: 'Agosto' },
      { value: 8, label: 'Septiembre' },
      { value: 9, label: 'Octubre' },
      { value: 10, label: 'Noviembre' },
      { value: 11, label: 'Diciembre' }
    ];

    return months.map(month => ({
      ...month,
      isSelected: selectedMonth === month.value && selectedYear === year
    }));
  });

  weekDays = computed(() => {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  });

  calendarDays = computed(() => {
    const current = this.currentDate();
    const selectedValue = this.value();
    let selectedDateStr: string | null = null;
    
    if (selectedValue) {
      // Parsear fecha de forma segura
      const parts = selectedValue.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        selectedDateStr = this.formatDate(new Date(year, month, day));
      } else {
        selectedDateStr = this.formatDate(new Date(selectedValue));
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatDate(today);

    const year = current.getFullYear();
    const month = current.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const firstDayWeek = firstDay.getDay();

    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Días del mes anterior para completar la primera semana
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();

    const days: Array<{
      day: number;
      date: string;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Días del mes anterior
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      const dateStr = this.formatDate(date);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isSelected: selectedDateStr !== null && dateStr === selectedDateStr,
        isToday: dateStr === todayStr
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isSelected: selectedDateStr !== null && dateStr === selectedDateStr,
        isToday: dateStr === todayStr
      });
    }

    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = this.formatDate(date);
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isSelected: selectedDateStr !== null && dateStr === selectedDateStr,
        isToday: dateStr === todayStr
      });
    }

    return days;
  });

  toggleCalendar(): void {
    const wasOpen = this.isOpen();
    this.isOpen.update(v => !v);
    
    // Si se está abriendo y es monthOnly, inicializar el año desde el valor seleccionado
    if (!wasOpen && this.isOpen() && this.monthOnly()) {
      const selectedValue = this.value();
      if (selectedValue) {
        // Parsear fecha de forma segura
        const parts = selectedValue.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          this.currentYearView.set(year);
        } else {
          const d = new Date(selectedValue);
          this.currentYearView.set(d.getFullYear());
        }
      } else {
        this.currentYearView.set(new Date().getFullYear());
      }
    }
  }

  closeCalendar(): void {
    this.isOpen.set(false);
  }

  onBlur(event: FocusEvent): void {
    // Cerrar solo si el foco no se movió a un elemento dentro del calendario
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && this.isOpen() && !relatedTarget.closest('.calendar-container')) {
      // Pequeño delay para permitir que los clicks dentro del calendario funcionen
      setTimeout(() => {
        if (!document.activeElement?.closest('.calendar-container')) {
          this.closeCalendar();
        }
      }, 150);
    }
  }

  previousMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentDate.set(newDate);
  }

  nextMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentDate.set(newDate);
  }

  previousYear(): void {
    this.currentYearView.update(year => year - 1);
  }

  nextYear(): void {
    this.currentYearView.update(year => year + 1);
  }

  selectMonth(monthIndex: number): void {
    const year = this.currentYearView();
    const date = new Date(year, monthIndex, 1);
    const dateStr = this.formatDate(date);
    this.valueChange.emit(dateStr);
    setTimeout(() => {
      this.closeCalendar();
    }, 150);
  }

  selectDate(date: string): void {
    let finalDate = date;
    
    // Si es monthOnly, usar el primer día del mes seleccionado
    if (this.monthOnly()) {
      // Parsear fecha de forma segura
      const parts = date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        finalDate = this.formatDate(new Date(year, month, 1));
      } else {
        const d = new Date(date);
        finalDate = this.formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
    
    this.valueChange.emit(finalDate);
    // Cerrar después de un pequeño delay para mejor UX
    setTimeout(() => {
      this.closeCalendar();
    }, 150);
  }

  clearDate(): void {
    this.valueChange.emit(null);
    this.closeCalendar();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

