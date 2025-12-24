import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineService } from '../../../shared/services/machine.service';
import { DriverForm } from '../../../shared/drivers/driver-form/driver-form';
import { DriverCreateSummary } from '../../../shared/drivers/driver-create-summary/driver-create-summary';
import { Driver } from '../../../shared/models/driver.models';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-driver-create',
  imports: [DriverForm, DriverCreateSummary, RouterLink, UiIconComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
      <!-- ZONA 1: HERO SECTION (Above the Fold) - Punto Focal Principal -->
      <section class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/60 rounded-3xl border border-base-200 shadow-sm p-5 sm:p-7 lg:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex-1 min-w-0 space-y-3">
            <div class="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
              <span class="text-primary">Conductores</span>
              <span class="h-3 w-px bg-primary/20"></span>
              <span class="text-base-content/60">Registro nuevo</span>
            </div>

            <div class="flex flex-wrap items-center gap-3 sm:gap-4">
              <a 
                routerLink="/choferes"
                class="btn btn-circle btn-ghost btn-sm text-base-content/70 hover:bg-base-200/80 flex-shrink-0" 
                aria-label="Volver">
                <ui-icon name="ChevronLeft" size="md" />
              </a>

              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content tracking-tight">
                  Registrar Nuevo Conductor
                </h1>
              </div>
            </div>

            <p class="text-xs sm:text-sm text-base-content/70 max-w-2xl">
              Completa la información para añadir un nuevo conductor al sistema. 
              Todos los campos marcados con <span class="text-error font-semibold">*</span> son obligatorios.
            </p>
          </div>
        </div>
      </section>

      <!-- ZONA 2: THE BODY - Contenido Principal con Ritmo Visual -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <!-- Formulario Principal (3 columnas en desktop) -->
        <div class="lg:col-span-3 space-y-0">
          <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl overflow-hidden">
            <div class="card-body p-6 sm:p-8">
              <app-driver-form
                [maquinas]="maquinas()"
                (formChange)="onFormChange($event)"
                (formValid)="onFormValid($event)" />
            </div>
          </div>
          
          <!-- Acciones Finales (Pegado al card) -->
          <div class="bg-base-200/30 border-t border-base-300/50 rounded-b-2xl -mt-px">
            <div class="px-6 sm:px-8 py-4 sm:py-6">
              <div class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <a 
                  routerLink="/choferes" 
                  class="btn btn-ghost w-full sm:w-auto order-2 sm:order-1">
                  Cancelar
                </a>
                <button
                  class="btn btn-primary w-full sm:w-auto order-1 sm:order-2 shadow-lg"
                  [disabled]="!canSave()"
                  (click)="onSave()">
                  <ui-icon name="Check" size="sm" class="mr-2" />
                  Guardar Conductor
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen (Solo visible en desktop) -->
        <div class="lg:col-span-1 hidden lg:block">
          <app-driver-create-summary [summary]="summary()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Animación de entrada suave para las secciones */
    .hero-section {
      animation: fadeInDown 600ms cubic-bezier(0.25, 1, 0.5, 1);
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Estilos para el details/summary en mobile */
    details[open] summary svg {
      transform: rotate(180deg);
    }
    
    /* Transiciones suaves para los cards */
    .card {
      transition: transform 200ms ease, box-shadow 200ms ease;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    /* Accesibilidad */
    @media (prefers-reduced-motion: reduce) {
      .hero-section,
      .card {
        animation: none;
        transition: none;
      }
    }
  `],
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
    this.machineService.getActiveMachines().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  maquinas = computed(() => {
    const machines = this.maquinasData() ?? [];
    return machines.map(m => ({
      id: m.id,
      identificador: m.display_name
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
      estado: 'Activo',
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
      const maquinaId =
        data.maquina_id !== null ? Number(data.maquina_id) : null;

      if (maquinaId) {
        const maquina = this.maquinas().find(m => m.id === maquinaId);
        if (maquina) {
          updatedData.maquina_actual = {
            id: maquina.id,
            identificador: maquina.identificador
          } as any;
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

    const data = this.formData();

    const payload = {
      rut: data.rut!,
      primer_nombre: data.nombre!,
      segundo_nombre: data.segundo_nombre ?? null,
      apellido_paterno: data.apellido!,
      apellido_materno: data.segundo_apellido!,
      telefono: data.telefono!,
      correo_electronico: data.correo!,
      estado: 'activo',
      fecha_venc_licencia: data.fecha_venc_licencia!,
      fecha_contrato: data.fecha_contrato ?? null,
      maquina_asignada: data.maquina_actual?.id ?? null,
    };

    this.driverService.createDriver(payload as any)
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

