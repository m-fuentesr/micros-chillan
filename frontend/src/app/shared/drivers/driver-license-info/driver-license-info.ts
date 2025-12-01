import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Driver } from '../../models/driver.models';
import { calculateLicenseStatus } from '../../utils/license.utils';

@Component({
  selector: 'app-driver-license-info',
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header flex justify-between items-center">
        <h2 class="card-title text-2xl">Detalles de Licencia</h2>
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
          <div>
            <label class="text-xs uppercase tracking-wide text-base-content/70">Fecha de Vencimiento</label>
            <div class="font-bold mb-4">{{ formatDate(driver().fecha_venc_licencia) }}</div>
            @if (licenseStatus().estado === 'error') {
              <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong>Licencia vencida</strong>
                  <div>La licencia venció hace {{ licenseStatus().dias_restantes }} días. Se debe renovar de inmediato.</div>
                </div>
              </div>
            } @else if (licenseStatus().estado === 'warning') {
              <div class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div>
                  <strong>Licencia por vencer</strong>
                  <div>La licencia vence en {{ licenseStatus().dias_restantes }} días. Se recomienda renovar pronto.</div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Edición -->
          <form [formGroup]="form">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-bold">Fecha de Vencimiento de Licencia</span>
              </label>
              <input type="date" formControlName="fecha_venc_licencia" class="input input-bordered w-full">
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverLicenseInfo {
  private fb = new FormBuilder();

  driver = input.required<Driver>();
  save = output<Partial<Driver>>();

  isEditing = signal(false);
  form = this.fb.group({
    fecha_venc_licencia: ['', Validators.required]
  });

  licenseStatus = computed(() => {
    return calculateLicenseStatus(this.driver().fecha_venc_licencia, 30);
  });

  startEdit(): void {
    this.form.patchValue({
      fecha_venc_licencia: this.driver().fecha_venc_licencia || ''
    });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveEdit(): void {
    if (this.form.valid) {
      this.save.emit({
        fecha_venc_licencia: this.form.value.fecha_venc_licencia || undefined
      });
      this.isEditing.set(false);
    }
  }

  formatDate(date: string): string {
    if (!date) return '--';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
    }
  }
}

