import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MachineService } from '../../../shared/services/machine.service';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineForm } from '../../../shared/machines/machine-form/machine-form';
import { MachineDocumentationForm } from '../../../shared/machines/machine-documentation-form/machine-documentation-form';
import { MachineCreateSummary } from '../../../shared/machines/machine-create-summary/machine-create-summary';
import { Machine } from '../../../shared/models/machine.models';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-machine-create',
  imports: [MachineForm, MachineDocumentationForm, MachineCreateSummary, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Registrar Nueva Máquina</h1>
        <p class="text-sm md:text-base text-base-content/70">
          Completa la información para añadir una nueva máquina al sistema.
        </p>
      </div>

      <!-- Layout: Formulario y Resumen -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Formulario Principal (3 columnas en desktop, full width en tablet y mobile) -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <!-- Datos de la Máquina -->
              <div>
                <h2 class="text-2xl font-bold mb-2">Datos de la Máquina</h2>
                <p class="text-sm text-base-content/70 mb-4">
                  Prioriza los campos requeridos; se reutilizan en reportes y asignaciones.
                </p>
                <app-machine-form
                  [showYear]="true"
                  [showDriver]="true"
                  [showStatus]="true"
                  [showInitialKm]="false"
                  [choferes]="choferes()"
                  (formChange)="onFormChange($event)"
                  (formValid)="onFormValid($event)" />
              </div>

              <!-- Separador -->
              <div class="divider"></div>

              <!-- Documentación Inicial -->
              <div>
                <h2 class="text-2xl font-bold mb-2">Documentación Inicial (RF-007)</h2>
                <p class="text-sm text-base-content/70 mb-4">
                  Debe estar vigente antes de liberar la máquina.
                </p>
                <app-machine-documentation-form
                  (formChange)="onDocumentationChange($event)"
                  (formValid)="onDocumentationValid($event)" />
              </div>
            </div>
            <div class="card-footer p-6 pt-4 mt-6 border-t border-base-300 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <a routerLink="/maquinas" class="btn btn-secondary w-full sm:w-auto">Cancelar</a>
              <button
                class="btn btn-primary w-full sm:w-auto"
                [disabled]="!canSave()"
                (click)="onSave()">
                Guardar Máquina
              </button>
            </div>
          </div>
        </div>

        <!-- Resumen (solo visible en desktop, oculto en tablet y mobile) -->
        <div class="hidden lg:block lg:col-span-1">
          <app-machine-create-summary [summary]="summary()" />
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineCreate {
  private machineService = inject(MachineService);
  private driverService = inject(DriverService);
  private router = inject(Router);

  // Estado del formulario
  formData = signal<Partial<Machine>>({});
  formValid = signal(false);
  documentationData = signal<{
    revision_tecnica?: string | null;
    permiso_circulacion?: string | null;
    seguro_obligatorio?: string | null;
  }>({});
  documentationValid = signal(false);

  // Choferes para el select
  choferesData = toSignal(
    this.driverService.getDrivers({ estado: 'activo' }).pipe(
      catchError(() => of<Array<{ id: number; nombre_completo: string }>>([]))
    ),
    { initialValue: [] }
  );

  choferes = computed(() => {
    const drivers = this.choferesData() ?? [];
    return drivers.map(d => ({
      id: d.id,
      nombre_completo: d.nombre_completo
    }));
  });

  // Resumen
  summary = computed(() => {
    const data = this.formData();
    const docs = this.documentationData();
    const choferId = data.chofer_id;
    const chofer = choferId ? this.choferes().find(c => c.id === Number(choferId)) : null;
    
    // Construir información de marca/modelo con año si está disponible
    let marcaModelo = data.marca || '--';
    if (data.año) {
      marcaModelo = `${marcaModelo} (${data.año})`;
    }
    
    return {
      numero: data.numero || '--',
      patente: data.patente || '--',
      marca: marcaModelo,
      chofer: chofer?.nombre_completo || '— Sin asignar —',
      estado: data.estado_operativo || '--',
      documentacion: {
        revision_tecnica: docs.revision_tecnica ? '✓' : '—',
        permiso_circulacion: docs.permiso_circulacion ? '✓' : '—',
        seguro_obligatorio: docs.seguro_obligatorio ? '✓' : '—'
      }
    };
  });

  // Validación para guardar
  canSave = computed(() => {
    return this.formValid() && this.documentationValid();
  });

  onFormChange(data: Partial<Machine>): void {
    this.formData.set({ ...this.formData(), ...data });
  }

  onFormValid(valid: boolean): void {
    this.formValid.set(valid);
  }

  onDocumentationChange(data: {
    revision_tecnica?: string | null;
    permiso_circulacion?: string | null;
    seguro_obligatorio?: string | null;
  }): void {
    this.documentationData.set(data);
  }

  onDocumentationValid(valid: boolean): void {
    this.documentationValid.set(valid);
  }

  onSave(): void {
    if (!this.canSave()) {
      return;
    }

    const machineData: Partial<Machine> = {
      ...this.formData(),
      documentos: {
        revision_tecnica: this.documentationData().revision_tecnica || undefined,
        permiso_circulacion: this.documentationData().permiso_circulacion || undefined,
        seguro_obligatorio: this.documentationData().seguro_obligatorio || undefined
      }
    };

    this.machineService.createMachine(machineData)
      .pipe(
        catchError((error) => {
          console.error('Error al crear máquina:', error);
          // Aquí podrías mostrar un toast o alert
          return of(null);
        })
      )
      .subscribe((machine) => {
        if (machine) {
          // Redirigir al detalle de la máquina creada
          this.router.navigate(['/maquinas', machine.id]);
        }
      });
  }
}

