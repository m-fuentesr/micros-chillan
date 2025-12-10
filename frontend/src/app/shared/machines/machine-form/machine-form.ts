import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Machine } from '../../models/machine.models';

@Component({
  selector: 'app-machine-form',
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Número de Máquina -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">
              Número de Máquina <span class="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            formControlName="numero"
            class="input input-bordered w-full"
            placeholder="Ej: 05"
            inputmode="numeric"
            autocomplete="off"
            (input)="onNumeroInput($event)"
            [disabled]="disabled()"
            [class.input-error]="form.get('numero')?.invalid && form.get('numero')?.touched">
          <p class="text-xs text-base-content/60 mt-1">Solo números (1-4 dígitos). Usa ceros a la izquierda si aplica.</p>
          @if (form.get('numero')?.invalid && form.get('numero')?.touched) {
            <label class="label">
              <span class="label-text-alt text-error">
                @if (form.get('numero')?.errors?.['required']) { Este campo es obligatorio }
                @else if (form.get('numero')?.errors?.['minlength']) { Mínimo 1 dígito }
                @else if (form.get('numero')?.errors?.['maxlength']) { Máximo 4 dígitos }
                @else if (form.get('numero')?.errors?.['pattern']) { Solo números (0-9) }
              </span>
            </label>
          }
        </div>

        <!-- Marca -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">
              Marca <span class="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            formControlName="marca"
            class="input input-bordered w-full"
            placeholder="Ej: Mercedes-Benz"
            [disabled]="disabled()"
            [class.input-error]="form.get('marca')?.invalid && form.get('marca')?.touched">
          <p class="text-xs text-base-content/60 mt-1">Al menos 2 caracteres. Evita abreviaturas ambiguas.</p>
          @if (form.get('marca')?.invalid && form.get('marca')?.touched) {
            <label class="label">
              <span class="label-text-alt text-error">
                @if (form.get('marca')?.errors?.['required']) { Este campo es obligatorio }
                @else if (form.get('marca')?.errors?.['minlength']) { Mínimo 2 caracteres }
              </span>
            </label>
          }
        </div>

        <!-- Patente -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">
              Patente <span class="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            formControlName="patente"
            class="input input-bordered w-full"
            placeholder="Ej: ABCD-12"
            autocomplete="off"
            (input)="onPatenteInput($event)"
            [disabled]="disabled()"
            [class.input-error]="form.get('patente')?.invalid && form.get('patente')?.touched">
          <p class="text-xs text-base-content/60 mt-1">Formato esperado: ABCD-12 (mayúsculas, 4 letras + guion + 2 números).</p>
          @if (form.get('patente')?.invalid && form.get('patente')?.touched) {
            <label class="label">
              <span class="label-text-alt text-error">
                @if (form.get('patente')?.errors?.['required']) { Este campo es obligatorio }
                @else if (form.get('patente')?.errors?.['pattern']) { Usa el formato ABCD-12 }
              </span>
            </label>
          }
        </div>

        <!-- Año de Fabricación -->
        @if (showYear()) {
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Año de Fabricación</span>
            </label>
            <select
              class="select select-bordered w-full"
              [value]="form.get('año')?.value ?? ''"
              [disabled]="disabled()"
              (change)="onYearSelect($event)"
            >
              <option value="">-- Seleccionar año --</option>
              @for (year of recentYears; track year) {
                <option [value]="year">{{ year }}</option>
              }
              <option value="manual">Ingresar otro año...</option>
            </select>

            @if (showManualYear()) {
              <div class="mt-3">
                <input
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Ej: 1995"
                  min="1900"
                  [max]="currentYear()"
                  [disabled]="disabled()"
                  [value]="form.get('año')?.value ?? ''"
                  (input)="onManualYear($event)"
                >
                <p class="text-xs text-base-content/70 mt-1">
                  Ingresa un año entre 1900 y {{ currentYear() }}.
                </p>
              </div>
            }
          </div>
        }

        <!-- Chofer Asignado -->
        @if (showDriver()) {
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Chofer Asignado (Opcional)</span>
            </label>
            <select
              formControlName="chofer_id"
              class="select select-bordered w-full"
              [disabled]="disabled()"
              [attr.size]="choferes().length > 10 ? 10 : null"
              style="max-height: 16rem; overflow-y: auto;"
            >
              <option value="">-- Seleccionar Chofer --</option>
              @for (chofer of choferes(); track chofer.id) {
                <option [value]="chofer.id">{{ chofer.nombre_completo }}</option>
              }
            </select>
          </div>
        }

        <!-- Estado Operativo -->
        @if (showStatus()) {
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Estado Operativo <span class="text-error">*</span>
              </span>
            </label>
            <select formControlName="estado_operativo" class="select select-bordered w-full">
              <option value="Operativa">Operativa</option>
              <option value="En Taller">En Taller</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </div>
        }

      </div>
    </form>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineForm {
  private fb = new FormBuilder();

  showYear = input(true);
  showDriver = input(true);
  showStatus = input(true);
  choferes = input<Array<{ id: number; nombre_completo: string }>>([]);
  initialData = input<Partial<Machine> | null>(null);
  disabled = input(false);
  recentYears = Array.from({ length: 31 }, (_, idx) => new Date().getFullYear() - idx); // Últimos 30 años + año actual
  showManualYear = signal(false);
  
  formChange = output<Partial<Machine>>();
  formValid = output<boolean>();

  form = this.fb.group({
    numero: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(4), Validators.pattern(/^\d{1,4}$/)]],
    marca: ['', [Validators.required, Validators.minLength(2)]],
    patente: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}-\d{2}$/i)]],
    año: [null as number | null, [Validators.min(1900), Validators.max(new Date().getFullYear())]],
    chofer_id: [null as number | null],
    estado_operativo: ['Operativa', Validators.required]
  });

  currentYear = computed(() => new Date().getFullYear());

  constructor() {
    // Emitir cambios del formulario
    this.form.valueChanges.subscribe(() => {
      const value = this.form.value;
      const yearVal = value.año;
      const parsedYear = yearVal !== null && yearVal !== undefined ? Number(yearVal) : undefined;
      this.formChange.emit({
        numero: value.numero || undefined,
        marca: value.marca || undefined,
        patente: value.patente || undefined,
        año: Number.isFinite(parsedYear) ? parsedYear : undefined,
        estado_operativo: value.estado_operativo as 'Operativa' | 'En Taller' | 'Inactiva' || 'Operativa',
        chofer_id: value.chofer_id !== null && value.chofer_id !== undefined
          ? Number(value.chofer_id)
          : undefined
      });
      this.formValid.emit(this.form.valid);
    });

    // Cargar datos iniciales si existen
    const initial = this.initialData();
    if (initial) {
      this.form.patchValue({
        numero: initial.numero || '',
        marca: initial.marca || '',
        patente: initial.patente || '',
        año: initial.año || null,
        estado_operativo: initial.estado_operativo || 'Operativa',
        chofer_id: initial.chofer_id ?? null
      });
    }
  }

  getFormValue(): Partial<Machine> {
    return this.form.value as Partial<Machine>;
  }

  isValid(): boolean {
    return this.form.valid;
  }

  onYearSelect(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    if (selected === 'manual') {
      this.showManualYear.set(true);
      this.form.patchValue({ año: null });
      return;
    }

    this.showManualYear.set(false);
    const year = selected ? Number(selected) : null;
    this.form.patchValue({ año: year }, { emitEvent: true });
  }

  onManualYear(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const year = raw ? Number(raw) : null;
    this.form.patchValue({ año: year }, { emitEvent: true });
  }

  onNumeroInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = (input.value || '').replace(/\D+/g, '').slice(0, 4);
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    this.form.patchValue({ numero: sanitized }, { emitEvent: true });
  }

  onPatenteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value || '';
    // Permitir letras, números y guion, forzar mayúsculas y longitud máxima 7 (ABCD-12)
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7);
    if (sanitized !== raw) {
      input.value = sanitized;
    }
    this.form.patchValue({ patente: sanitized }, { emitEvent: true });
  }
}

