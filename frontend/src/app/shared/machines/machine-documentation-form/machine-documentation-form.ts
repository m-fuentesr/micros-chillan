import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-machine-documentation-form',
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Revisión Técnica -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-bold">
            Fecha Vencimiento Revisión Técnica <span class="text-error">*</span>
          </span>
        </label>
        <input
          type="date"
          formControlName="revision_tecnica"
          class="input input-bordered w-full"
          [class.input-error]="form.get('revision_tecnica')?.invalid && form.get('revision_tecnica')?.touched">
        <label class="label">
          <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
        </label>
        @if (form.get('revision_tecnica')?.invalid && form.get('revision_tecnica')?.touched) {
          <label class="label">
            <span class="label-text-alt text-error">Este campo es obligatorio</span>
          </label>
        }
      </div>

      <!-- Permiso de Circulación -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-bold">
            Fecha Vencimiento Permiso de Circulación <span class="text-error">*</span>
          </span>
        </label>
        <input
          type="date"
          formControlName="permiso_circulacion"
          class="input input-bordered w-full"
          [class.input-error]="form.get('permiso_circulacion')?.invalid && form.get('permiso_circulacion')?.touched">
        <label class="label">
          <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
        </label>
        @if (form.get('permiso_circulacion')?.invalid && form.get('permiso_circulacion')?.touched) {
          <label class="label">
            <span class="label-text-alt text-error">Este campo es obligatorio</span>
          </label>
        }
      </div>

      <!-- Seguro Obligatorio -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-bold">
            Fecha Vencimiento Seguro Obligatorio <span class="text-error">*</span>
          </span>
        </label>
        <input
          type="date"
          formControlName="seguro_obligatorio"
          class="input input-bordered w-full"
          [class.input-error]="form.get('seguro_obligatorio')?.invalid && form.get('seguro_obligatorio')?.touched">
        <label class="label">
          <span class="label-text-alt">Campo obligatorio para el registro inicial.</span>
        </label>
        @if (form.get('seguro_obligatorio')?.invalid && form.get('seguro_obligatorio')?.touched) {
          <label class="label">
            <span class="label-text-alt text-error">Este campo es obligatorio</span>
          </label>
        }
      </div>
    </form>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineDocumentationForm {
  private fb = new FormBuilder();
  
  initialData = input<{
    revision_tecnica?: string | null;
    permiso_circulacion?: string | null;
    seguro_obligatorio?: string | null;
  } | null>(null);
  
  formChange = output<{
    revision_tecnica?: string | null;
    permiso_circulacion?: string | null;
    seguro_obligatorio?: string | null;
  }>();
  formValid = output<boolean>();

  form = this.fb.group({
    revision_tecnica: ['', Validators.required],
    permiso_circulacion: ['', Validators.required],
    seguro_obligatorio: ['', Validators.required]
  });

  constructor() {
    // Emitir cambios del formulario
    this.form.valueChanges.subscribe(() => {
      this.formChange.emit({
        revision_tecnica: this.form.value.revision_tecnica || null,
        permiso_circulacion: this.form.value.permiso_circulacion || null,
        seguro_obligatorio: this.form.value.seguro_obligatorio || null
      });
      this.formValid.emit(this.form.valid);
    });

    // Cargar datos iniciales si existen
    const initial = this.initialData();
    if (initial) {
      this.form.patchValue({
        revision_tecnica: initial.revision_tecnica || '',
        permiso_circulacion: initial.permiso_circulacion || '',
        seguro_obligatorio: initial.seguro_obligatorio || ''
      });
    }
  }

  getFormValue() {
    return {
      revision_tecnica: this.form.value.revision_tecnica || null,
      permiso_circulacion: this.form.value.permiso_circulacion || null,
      seguro_obligatorio: this.form.value.seguro_obligatorio || null
    };
  }

  isValid(): boolean {
    return this.form.valid;
  }
}

