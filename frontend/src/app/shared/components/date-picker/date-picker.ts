import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-picker',
  imports: [CommonModule],
  template: `
    <div class="form-control">
      <label class="label py-1.5">
        <span class="label-text text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-primary">
            <path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25a2.75 2.75 0 012.75 2.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75A2.75 2.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" />
          </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-base-content/40">
            <path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25a2.75 2.75 0 012.75 2.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75A2.75 2.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" />
          </svg>
        </div>
        @if (isOpen()) {
          <div 
            #calendarRef
            class="absolute top-full left-0 w-full mt-1 bg-base-100 rounded-box z-[9999] shadow-2xl border border-base-200 p-4 calendar-container">
            <!-- Header del Calendario -->
            <div class="flex items-center justify-between mb-4">
              <button 
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                (click)="previousMonth()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div class="text-sm font-semibold text-base-content">
                {{ currentMonthYear() }}
              </div>
              <button 
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                (click)="nextMonth()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
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

  valueChange = output<string | null>();

  isOpen = signal(false);
  currentDate = signal(new Date());

  displayValue = computed(() => {
    const val = this.value();
    if (!val) return null;
    try {
      const d = new Date(val);
      return d.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
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

  weekDays = computed(() => {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  });

  calendarDays = computed(() => {
    const current = this.currentDate();
    const selectedValue = this.value();
    const selectedDateStr = selectedValue ? this.formatDate(new Date(selectedValue)) : null;
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
    this.isOpen.update(v => !v);
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

  selectDate(date: string): void {
    this.valueChange.emit(date);
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

