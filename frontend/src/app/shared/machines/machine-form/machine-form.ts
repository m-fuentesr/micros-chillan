import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
            [class.input-error]="form.get('numero')?.invalid && form.get('numero')?.touched">
          @if (form.get('numero')?.invalid && form.get('numero')?.touched) {
            <label class="label">
              <span class="label-text-alt text-error">Este campo es obligatorio</span>
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
            [class.input-error]="form.get('marca')?.invalid && form.get('marca')?.touched">
          @if (form.get('marca')?.invalid && form.get('marca')?.touched) {
            <label class="label">
              <span class="label-text-alt text-error">Este campo es obligatorio</span>
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
            [class.input-error]="form.get('patente')?.invalid && form.get('patente')?.touched">
          @if (form.get('patente')?.invalid && form.get('patente')?.touched) {
            <label class="label">
              <span class="label-text-alt text-error">Este campo es obligatorio</span>
            </label>
          }
        </div>

        <!-- Año de Fabricación -->
        @if (showYear()) {
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Año de Fabricación</span>
            </label>
            <input
              type="number"
              formControlName="año"
              class="input input-bordered w-full"
              placeholder="Ej: 2018"
              min="1900"
              [max]="currentYear()">
          </div>
        }

        <!-- Chofer Asignado -->
        @if (showDriver()) {
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Chofer Asignado (Opcional)</span>
            </label>
            <select formControlName="chofer_id" class="select select-bordered w-full">
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

        <!-- Kilometraje Inicial -->
        @if (showInitialKm()) {
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Kilometraje Inicial</span>
            </label>
            <input
              type="number"
              formControlName="kilometraje_inicial"
              class="input input-bordered w-full"
              placeholder="Ej: 125000"
              min="0">
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
  showInitialKm = input(true);
  choferes = input<Array<{ id: number; nombre_completo: string }>>([]);
  initialData = input<Partial<Machine> | null>(null);
  
  formChange = output<Partial<Machine>>();
  formValid = output<boolean>();

  form = this.fb.group({
    numero: ['', Validators.required],
    marca: ['', Validators.required],
    patente: ['', Validators.required],
    año: [null as number | null],
    chofer_id: [null as number | null],
    estado_operativo: ['Operativa', Validators.required],
    kilometraje_inicial: [null as number | null]
  });

  currentYear = computed(() => new Date().getFullYear());

  constructor() {
    // Emitir cambios del formulario
    this.form.valueChanges.subscribe(() => {
      const value = this.form.value;
      this.formChange.emit({
        numero: value.numero || undefined,
        marca: value.marca || undefined,
        patente: value.patente || undefined,
        año: value.año || undefined,
        estado_operativo: value.estado_operativo as 'Operativa' | 'En Taller' | 'Inactiva' || 'Operativa'
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
        kilometraje_inicial: initial.kilometraje_inicial || null
      });
    }
  }

  getFormValue(): Partial<Machine> {
    return this.form.value as Partial<Machine>;
  }

  isValid(): boolean {
    return this.form.valid;
  }
}

