import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Driver } from '../../models/driver.models';

@Component({
  selector: 'app-driver-personal-info',
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header flex justify-between items-center">
        <h2 class="card-title text-2xl">Información Personal</h2>
        <div class="flex gap-2">
          @if (!isEditing()) {
            <button class="btn btn-secondary btn-sm" (click)="startEdit()">Editar</button>
          } @else {
            <button class="btn btn-secondary btn-sm" (click)="cancelEdit()">Cancelar</button>
            <button class="btn btn-primary btn-sm" (click)="saveEdit()" [disabled]="!form.valid">Guardar</button>
          }
        </div>
      </div>
      <div class="card-body">
        @if (!isEditing()) {
          <!-- Vista -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Primer Nombre</label>
              <div class="font-bold">{{ driver().nombre || '--' }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Segundo Nombre</label>
              <div class="font-bold">{{ driver().segundo_nombre || '--' }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Apellido Paterno</label>
              <div class="font-bold">{{ driver().apellido || '--' }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Apellido Materno</label>
              <div class="font-bold">{{ driver().segundo_apellido || '--' }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">RUT</label>
              <div class="font-bold break-all">{{ driver().rut }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Teléfono</label>
              <div class="font-bold break-all">{{ driver().telefono }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Email</label>
              <div class="font-bold truncate tooltip" [attr.data-tip]="driver().correo">{{ driver().correo }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Estado</label>
              <div class="font-bold">{{ driver().estado === 'activo' ? 'Activo' : 'Inactivo' }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Máquina Asignada</label>
              <div class="font-bold truncate tooltip" [attr.data-tip]="driver().maquina_actual?.identificador || 'Sin asignar'">{{ driver().maquina_actual?.identificador || 'Sin asignar' }}</div>
            </div>
            <div>
              <label class="text-xs uppercase tracking-wide text-base-content/70">Porcentaje</label>
              <div class="font-semibold">{{ formatPorcentajeForDisplay(driver().porcentaje_pago) }}%</div>
            </div>
          </div>
        } @else {
          <!-- Edición -->
          <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Primer Nombre <span class="text-error">*</span></span>
              </label>
              <input type="text" formControlName="nombre" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Segundo Nombre</span>
              </label>
              <input type="text" formControlName="segundo_nombre" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Apellido Paterno <span class="text-error">*</span></span>
              </label>
              <input type="text" formControlName="apellido" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Apellido Materno <span class="text-error">*</span></span>
              </label>
              <input type="text" formControlName="segundo_apellido" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">RUT <span class="text-error">*</span></span>
              </label>
              <input type="text" formControlName="rut" class="input input-bordered w-full" maxlength="12">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Teléfono <span class="text-error">*</span></span>
              </label>
              <input type="tel" formControlName="telefono" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Email <span class="text-error">*</span></span>
              </label>
              <input type="email" formControlName="correo" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Estado <span class="text-error">*</span></span>
              </label>
              <select formControlName="estado" class="select select-bordered w-full">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Máquina Asignada</span>
              </label>
              <select formControlName="maquina_id" class="select select-bordered w-full">
                <option value="">Sin asignar</option>
                @for (maquina of maquinas(); track maquina.id) {
                  <option [value]="maquina.id">{{ maquina.identificador }}</option>
                }
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Porcentaje Individual</span>
              </label>
              <div class="flex items-center gap-2">
                <input type="number" formControlName="porcentaje_pago" class="input input-bordered w-full" min="0" max="100" step="0.5">
                <span>%</span>
              </div>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverPersonalInfo {
  private fb = new FormBuilder();

  driver = input.required<Driver>();
  maquinas = input<Array<{ id: number; identificador: string }>>([]);
  
  save = output<Partial<Driver>>();

  isEditing = signal(false);
  form = this.fb.group({
    nombre: ['', Validators.required],
    segundo_nombre: [''],
    apellido: ['', Validators.required],
    segundo_apellido: ['', Validators.required],
    rut: ['', Validators.required],
    telefono: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    estado: ['activo', Validators.required],
    maquina_id: [null as number | null],
    porcentaje_pago: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  startEdit(): void {
    const driver = this.driver();
    this.form.patchValue({
      nombre: driver.nombre || '',
      segundo_nombre: driver.segundo_nombre || '',
      apellido: driver.apellido || '',
      segundo_apellido: driver.segundo_apellido || '',
      rut: driver.rut || '',
      telefono: driver.telefono || '',
      correo: driver.correo || '',
      estado: driver.estado || 'activo',
      maquina_id: driver.maquina_actual?.id || null,
      // Convertir de decimal (0.3) a porcentaje (30) para mostrar en el input
      porcentaje_pago: this.convertDecimalToPorcentaje(driver.porcentaje_pago || 0)
    });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveEdit(): void {
    if (this.form.valid) {
      const value = this.form.value;
      this.save.emit({
        nombre: value.nombre || undefined,
        segundo_nombre: value.segundo_nombre || undefined,
        apellido: value.apellido || undefined,
        segundo_apellido: value.segundo_apellido || undefined,
        rut: value.rut || undefined,
        telefono: value.telefono || undefined,
        correo: value.correo || undefined,
        estado: value.estado as 'activo' | 'inactivo' || 'activo',
        // Convertir de porcentaje (30) a decimal (0.3) para guardar en el backend
        porcentaje_pago: this.convertPorcentajeToDecimal(value.porcentaje_pago || 0)
      });
      this.isEditing.set(false);
    }
  }

  /**
   * Convierte de decimal (0.3) a porcentaje (30) para mostrar en el frontend
   */
  formatPorcentajeForDisplay(decimalValue: number): number {
    return decimalValue * 100;
  }

  /**
   * Convierte de decimal (0.3) a porcentaje (30) para el input
   */
  convertDecimalToPorcentaje(decimalValue: number): number {
    return decimalValue * 100;
  }

  /**
   * Convierte de porcentaje (30) a decimal (0.3) para guardar en el backend
   */
  convertPorcentajeToDecimal(porcentajeValue: number): number {
    return porcentajeValue / 100;
  }
}

