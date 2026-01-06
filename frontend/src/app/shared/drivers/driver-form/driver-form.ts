import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Driver } from '../../models/driver.models';
import { distinctUntilChanged, debounceTime, Subscription } from 'rxjs';
import { formatRut, isValidRut } from '../../utils/rut.utils';

@Component({
  selector: 'app-driver-form',
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="form" class="space-y-6">
      <!-- Datos del Chofer -->
      <div>
        <h2 class="text-2xl font-bold mb-2">Datos del Chofer</h2>
        <p class="text-sm text-base-content/70 mb-4">
          Prioriza los campos requeridos; se reutilizan en reportes y asignaciones.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                RUT <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              formControlName="rut"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: 12.345.678-9"
              maxlength="12"
              (input)="onRutInput($event)"
              [class.input-error]="form.get('rut')?.invalid && form.get('rut')?.touched">
            @if (form.get('rut')?.touched && form.get('rut')?.errors) {
              <label class="label">
                @if (form.get('rut')?.errors?.['required']) {
                  <span class="label-text-alt text-error">El RUT es obligatorio</span>
                }
                @if (form.get('rut')?.errors?.['rutInvalid']) {
                  <span class="label-text-alt text-error">RUT inválido</span>
                }
              </label>
            }
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Primer Nombre <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              formControlName="primer_nombre"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: Juan"
              [class.input-error]="form.get('primer_nombre')?.invalid && form.get('primer_nombre')?.touched">
            <label class="label">
              <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
            </label>
            @if (form.get('primer_nombre')?.invalid && form.get('primer_nombre')?.touched) {
              <label class="label">
                <span class="label-text-alt text-error">Este campo es obligatorio</span>
              </label>
            }
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Segundo Nombre</span>
            </label>
            <input
              type="text"
              formControlName="segundo_nombre"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: Carlos">
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Apellido Paterno <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              formControlName="apellido_paterno"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: Pérez"
              [class.input-error]="form.get('apellido_paterno')?.invalid && form.get('apellido_paterno')?.touched">
            <label class="label">
              <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
            </label>
            @if (form.get('apellido_paterno')?.invalid && form.get('apellido_paterno')?.touched) {
              <label class="label">
                <span class="label-text-alt text-error">Este campo es obligatorio</span>
              </label>
            }
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Apellido Materno <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              formControlName="apellido_materno"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: González"
              [class.input-error]="form.get('apellido_materno')?.invalid && form.get('apellido_materno')?.touched">
            <label class="label">
              <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
            </label>
            @if (form.get('apellido_materno')?.invalid && form.get('apellido_materno')?.touched) {
              <label class="label">
                <span class="label-text-alt text-error">Este campo es obligatorio</span>
              </label>
            }
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Teléfono <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="tel"
              formControlName="telefono"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: +56 9 1234 5678"
              (input)="onPhoneInput($event)"
              [class.input-error]="form.get('telefono')?.invalid && form.get('telefono')?.touched">
            <label class="label">
              <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
            </label>
            @if (form.get('telefono')?.invalid && form.get('telefono')?.touched) {
              <label class="label">
                <span class="label-text-alt text-error">Este campo es obligatorio</span>
              </label>
            }
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Correo Electrónico <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="email"
              formControlName="correo"
              class="input input-bordered w-full placeholder-gray-400"
              placeholder="ej: ejemplo@correo.cl"
              [class.input-error]="form.get('correo')?.invalid && form.get('correo')?.touched">
            <label class="label">
              <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
            </label>
            @if (form.get('correo')?.invalid && form.get('correo')?.touched) {
              <label class="label">
                <span class="label-text-alt text-error">Este campo es obligatorio</span>
              </label>
            }
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">Máquina Asignada</span>
            </label>
            <select formControlName="maquina_id" class="select select-bordered w-full" [class.placeholder-selected]="!form.get('maquina_id')?.value || form.get('maquina_id')?.value === '' || form.get('maquina_id')?.value === 'placeholder'">
              <option value="placeholder" selected disabled>-- Seleccionar máquina --</option>
              <option value="">Sin asignar</option>
              @for (maquina of maquinas(); track maquina.id) {
                <option [value]="maquina.id">{{ maquina.identificador }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Licencia de Conducir -->
      <div>
        <h2 class="text-2xl font-bold mb-2">Licencia de Conducir</h2>
        <p class="text-sm text-base-content/70 mb-4">
          Ingresa la información de la licencia del chofer.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Fecha Vencimiento Licencia <span class="text-error">*</span>
              </span>
            </label>
            <input
              type="date"
              formControlName="fecha_venc_licencia"
              class="input input-bordered w-full"
              [class.input-error]="form.get('fecha_venc_licencia')?.invalid && form.get('fecha_venc_licencia')?.touched">
            <label class="label">
              <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
            </label>
            @if (form.get('fecha_venc_licencia')?.invalid && form.get('fecha_venc_licencia')?.touched) {
              <label class="label">
                <span class="label-text-alt text-error">La fecha de vencimiento es obligatoria</span>
              </label>
            }
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Contrato -->
      <div>
        <h2 class="text-2xl font-bold mb-2">Contrato</h2>
        <p class="text-sm text-base-content/70 mb-4">
          Ingresa la fecha de contrato del chofer.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-bold">
                Fecha de Contrato
              </span>
            </label>
            <input
              type="date"
              formControlName="fecha_contrato"
              class="input input-bordered w-full">
          </div>
        </div>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverForm implements OnDestroy {
  private fb = new FormBuilder();
  private formSubscription?: Subscription;

  maquinas = input<Array<{ id: number; identificador: string }>>([]);
  initialData = input<Partial<Driver> | null>(null);

  formChange = output<Partial<Driver & { maquina_id?: number | null }>>();
  formValid = output<boolean>();

  form = this.fb.group({
    rut: ['', [Validators.required, this.rutValidator.bind(this)]],
    primer_nombre: ['', Validators.required],
    segundo_nombre: [''],
    apellido_paterno: ['', Validators.required],
    apellido_materno: ['', Validators.required],
    telefono: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    maquina_id: ['placeholder' as string | number | null],
    fecha_venc_licencia: [''],
    fecha_contrato: ['']
  });

  constructor() {
    // Emitir cambios del formulario con debounce y distinctUntilChanged para evitar emisiones innecesarias
    this.formSubscription = this.form.valueChanges.pipe(
      debounceTime(100), // Pequeño debounce para agrupar cambios rápidos
      distinctUntilChanged((prev, curr) => {
        // Comparación profunda para evitar emisiones cuando los valores no cambian realmente
        return JSON.stringify(prev) === JSON.stringify(curr);
      })
    ).subscribe(() => {
      const value = this.form.value;
      this.formChange.emit({
        rut: value.rut || undefined,
        nombre: value.primer_nombre || undefined,
        segundo_nombre: value.segundo_nombre || undefined,
        apellido: value.apellido_paterno || undefined,
        segundo_apellido: value.apellido_materno || undefined,
        telefono: value.telefono || undefined,
        correo: value.correo || undefined,
        estado: 'activo',
        maquina_id: (value.maquina_id === null || value.maquina_id === undefined || value.maquina_id === '' || value.maquina_id === 'placeholder' || value.maquina_id === 'null') ? undefined : (typeof value.maquina_id === 'number' ? value.maquina_id : Number(value.maquina_id) || undefined),
        fecha_venc_licencia: value.fecha_venc_licencia || undefined,
        fecha_contrato: value.fecha_contrato || undefined
      });
      this.formValid.emit(this.form.valid);
    });

    // Cargar datos iniciales si existen
    const initial = this.initialData();
    if (initial) {
      this.form.patchValue({
        rut: initial.rut || '',
        primer_nombre: initial.nombre || '',
        segundo_nombre: initial.segundo_nombre || '',
        apellido_paterno: initial.apellido || '',
        apellido_materno: initial.segundo_apellido || '',
        telefono: initial.telefono || '',
        correo: initial.correo || '',
        fecha_venc_licencia: initial.fecha_venc_licencia || '',
        fecha_contrato: initial.fecha_contrato || ''
      }, { emitEvent: false }); // No emitir eventos al cargar datos iniciales
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  rutValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return isValidRut(value) ? null : { rutInvalid: true };
  }

  onRutInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatRut(input.value);

    // Evitar ciclos infinitos
    if (formatted !== input.value) {
      input.value = formatted;
      this.form.get('rut')?.setValue(formatted, { emitEvent: false });
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    // Permitir solo números y el signo +
    const formatted = value.replace(/[^0-9+]/g, '');

    if (formatted !== value) {
      input.value = formatted;
      this.form.get('telefono')?.setValue(formatted, { emitEvent: false });
    }
  }

  getFormValue(): Partial<Driver> {
    const value = this.form.value;
    return {
      rut: value.rut || undefined,
      nombre: value.primer_nombre || undefined,
      segundo_nombre: value.segundo_nombre || undefined,
      apellido: value.apellido_paterno || undefined,
      segundo_apellido: value.apellido_materno || undefined,
      telefono: value.telefono || undefined,
      correo: value.correo || undefined,
      estado: 'activo',
      fecha_venc_licencia: value.fecha_venc_licencia || undefined,
      fecha_contrato: value.fecha_contrato || undefined
    };
  }

  isValid(): boolean {
    return this.form.valid;
  }
}

