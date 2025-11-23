import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Driver } from '../../models/driver.models';

@Component({
  selector: 'app-driver-header',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex items-start gap-6">
          <!-- Avatar -->
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-24 h-24">
              <span class="text-3xl font-bold">{{ initials() }}</span>
            </div>
          </div>

          <!-- Información -->
          <div class="flex-1 min-w-0">
            <h1 class="text-sm @xs:text-base @lg:text-xl font-bold mb-2 truncate tooltip" [attr.data-tip]="driver().nombre_completo">{{ driver().nombre_completo }}</h1>
            <div class="space-y-1 text-sm text-base-content/70">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20" class="flex-shrink-0">
                  <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0015.5 2h-11zm4.5 8a1 1 0 100-2 1 1 0 000 2zm2.5-1a1 1 0 11-2 0 1 1 0 012 0zm1.5 1a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <span class="break-all">{{ driver().rut }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20" class="flex-shrink-0">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span class="truncate tooltip" [attr.data-tip]="driver().correo">{{ driver().correo }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20" class="flex-shrink-0">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span class="break-all">{{ driver().telefono }}</span>
              </div>
            </div>
            <div class="mt-3">
              <span class="badge" [class.badge-success]="driver().estado === 'activo'" [class.badge-warning]="driver().estado === 'inactivo'">
                {{ driver().estado === 'activo' ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" (click)="onEdit()">
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverHeader {
  driver = input.required<Driver>();
  edit = output<void>();

  initials = computed(() => {
    const parts = this.driver().nombre_completo.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return this.driver().nombre_completo.substring(0, 2).toUpperCase();
  });

  onEdit(): void {
    this.edit.emit();
  }
}

