import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineService } from '../../../shared/services/machine.service';
import { DriverForm } from '../../../shared/drivers/driver-form/driver-form';
import { DriverCreateSummary } from '../../../shared/drivers/driver-create-summary/driver-create-summary';
import { Driver } from '../../../shared/models/driver.models';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-driver-create',
  imports: [DriverForm, DriverCreateSummary, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Registrar Nuevo Chofer</h1>
        <p class="text-sm md:text-base text-base-content/70">
          Completa la información para añadir un nuevo chofer al sistema.
        </p>
      </div>

      <!-- Layout: Formulario y Resumen -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Formulario Principal (3 columnas en desktop, full width en tablet y mobile) -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <app-driver-form
                [maquinas]="maquinas()"
                (formChange)="onFormChange($event)"
                (formValid)="onFormValid($event)" />
            </div>
            <div class="card-footer p-6 pt-4 mt-6 border-t border-base-300 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <a routerLink="/choferes" class="btn btn-secondary w-full sm:w-auto">Cancelar</a>
              <button
                class="btn btn-primary w-full sm:w-auto"
                [disabled]="!canSave()"
                (click)="onSave()">
                Guardar Chofer
              </button>
            </div>
          </div>
        </div>

        <!-- Resumen (solo visible en desktop, oculto en tablet y mobile) -->
        <div class="hidden lg:block lg:col-span-1">
          <app-driver-create-summary [summary]="summary()" />
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverCreate {
  private driverService = inject(DriverService);
  private machineService = inject(MachineService);
  private router = inject(Router);

  // Estado del formulario
  formData = signal<Partial<Driver>>({});
  formValid = signal(false);

  // Máquinas para el select
  maquinasData = toSignal(
    this.machineService.getMachines().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  maquinas = computed(() => {
    const machines = this.maquinasData() ?? [];
    return machines.map(m => ({
      id: m.id,
      identificador: `MÁQUINA ${m.numero}`
    }));
  });

  // Resumen
  summary = computed(() => {
    const data = this.formData();
    
    // Obtener máquina asignada
    let maquinaIdentificador = '— Sin asignar —';
    if (data.maquina_actual?.id) {
      const maquina = this.maquinas().find(m => m.id === data.maquina_actual!.id);
      maquinaIdentificador = maquina?.identificador || '— Sin asignar —';
    }
    
    // Construir nombre completo
    const nombre = [
      data.nombre,
      data.segundo_nombre,
      data.apellido,
      data.segundo_apellido
    ].filter(n => n).join(' ') || '--';

    // Retornar objeto con valores primitivos para evitar recreaciones innecesarias
    return {
      rut: data.rut || '--',
      nombre: nombre,
      telefono: data.telefono || '--',
      estado: data.estado === 'activo' ? 'Activo' : data.estado === 'inactivo' ? 'Inactivo' : '--',
      maquina: maquinaIdentificador
    };
  });

  // Validación para guardar
  canSave = computed(() => {
    return this.formValid();
  });

  onFormChange(data: Partial<Driver>): void {
    // Mapear maquina_id a maquina_actual si existe
    const currentData = this.formData();
    const updatedData: Partial<Driver> = { ...currentData, ...data };
    
    // Si viene maquina_id del formulario, mapearlo a maquina_actual
    if ('maquina_id' in data && data.maquina_id !== undefined) {
      const maquinaId = data.maquina_id as number | null;
      if (maquinaId) {
        const maquina = this.maquinas().find(m => m.id === maquinaId);
        if (maquina) {
          updatedData.maquina_actual = { id: maquina.id, identificador: maquina.identificador } as any;
        }
      } else {
        updatedData.maquina_actual = undefined;
      }
      // Eliminar maquina_id del objeto final ya que no es parte del modelo Driver
      delete (updatedData as any).maquina_id;
    }
    
    this.formData.set(updatedData);
  }

  onFormValid(valid: boolean): void {
    this.formValid.set(valid);
  }

  onSave(): void {
    if (!this.canSave()) {
      return;
    }

    const driverData: Partial<Driver> = {
      ...this.formData(),
      nombre_completo: [
        this.formData().nombre,
        this.formData().segundo_nombre,
        this.formData().apellido,
        this.formData().segundo_apellido
      ].filter(n => n).join(' ')
    };

    this.driverService.createDriver(driverData)
      .pipe(
        catchError((error) => {
          console.error('Error al crear chofer:', error);
          // Aquí podrías mostrar un toast o alert
          return of(null);
        })
      )
      .subscribe((driver) => {
        if (driver) {
          // Redirigir al detalle del chofer creado
          this.router.navigate(['/choferes', driver.id]);
        }
      });
  }
}

