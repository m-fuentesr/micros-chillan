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
import { BusIcon } from '../../../shared/components/bus-icon/bus-icon';

@Component({
  selector: 'app-machine-create',
  imports: [MachineForm, MachineDocumentationForm, MachineCreateSummary, RouterLink, BusIcon],
  template: `
    <!-- ZONA 1: HERO SECTION (Above the Fold) - Punto Focal Principal -->
    <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 border-b-2 border-b-primary/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <!-- Header con borde izquierdo (estilo referencia) -->
        <div class="page-entry-header border-l-4 border-l-primary pl-4 md:pl-6 mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
                Registrar Nueva Máquina
              </h1>
              <p class="text-base-content/70 text-sm md:text-base mt-2 max-w-2xl">
                Completa la información para añadir una nueva máquina a la flota. 
                Todos los campos marcados con <span class="text-error font-semibold">*</span> son obligatorios.
              </p>
            </div>
            <!-- Botón de acción secundaria -->
            <a 
              routerLink="/maquinas" 
              class="flex items-center gap-2 text-base-content/60 hover:text-base-content transition-colors text-sm font-medium group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:-translate-x-1 transition-transform">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Volver a Flota</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ZONA 2: THE BODY - Contenido Principal con Ritmo Visual -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <!-- Formulario Principal (3 columnas en desktop) -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Sección 1: Datos de la Máquina (Fondo blanco) -->
          <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden">
            <div class="card-body p-6 sm:p-8">
              <!-- Header de sección con icono -->
              <div class="flex items-center gap-3 mb-6 pb-4 border-b border-base-200">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <app-bus-icon class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl font-bold text-base-content">Datos de la Máquina</h2>
                  <p class="text-sm text-base-content/60 mt-0.5">
                    Información básica e identificación del vehículo
                  </p>
                </div>
              </div>
              
              <app-machine-form
                [showYear]="true"
                [showDriver]="true"
                [showStatus]="true"
                [showInitialKm]="false"
                [choferes]="choferes()"
                (formChange)="onFormChange($event)"
                (formValid)="onFormValid($event)" />
            </div>
          </div>

          <!-- Sección 2: Documentación (Fondo base-200 para crear "capítulo" visual) -->
          <div class="card bg-base-200/30 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden">
            <div class="card-body p-6 sm:p-8">
              <!-- Header de sección con icono -->
              <div class="flex items-center gap-3 mb-6 pb-4 border-b border-base-300/50">
                <div class="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-warning">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl font-bold text-base-content">Documentación Inicial</h2>
                  <p class="text-sm text-base-content/60 mt-0.5">
                    RF-007: Debe estar vigente antes de liberar la máquina
                  </p>
                </div>
              </div>
              
              <app-machine-documentation-form
                (formChange)="onDocumentationChange($event)"
                (formValid)="onDocumentationValid($event)" />
            </div>
          </div>
          
          <!-- Acciones Finales (Pegado al último card) -->
          <div class="bg-base-200/30 border-t border-base-300/50 rounded-2xl -mt-6">
            <div class="px-6 sm:px-8 py-4 sm:py-6">
              <div class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <a 
                  routerLink="/maquinas" 
                  class="btn btn-ghost w-full sm:w-auto order-2 sm:order-1">
                  Cancelar
                </a>
                <button
                  class="btn btn-primary w-full sm:w-auto order-1 sm:order-2 shadow-lg"
                  [disabled]="!canSave()"
                  (click)="onSave()">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Guardar Máquina
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen (Solo visible en desktop) -->
        <div class="lg:col-span-1 hidden lg:block">
          <app-machine-create-summary [summary]="summary()" />
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

    // Validación adicional antes de enviar
    const formData = this.formData();
    const docs = this.documentationData();

    // Validar que los campos básicos estén presentes
    if (!formData.numero || !formData.patente || !formData.marca) {
      alert('Por favor complete todos los campos obligatorios de la máquina');
      return;
    }

    // Validar que todas las fechas de documentación estén presentes
    if (!docs.revision_tecnica || !docs.permiso_circulacion || !docs.seguro_obligatorio) {
      alert('Por favor complete todas las fechas de documentación');
      return;
    }

    // Validar formato de fechas
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(docs.revision_tecnica) ||
        !fechaRegex.test(docs.permiso_circulacion) ||
        !fechaRegex.test(docs.seguro_obligatorio)) {
      alert('Las fechas deben estar en formato válido (YYYY-MM-DD)');
      return;
    }

    const machineData: Partial<Machine> = {
      ...formData,
      documentos: {
        revision_tecnica: docs.revision_tecnica,
        permiso_circulacion: docs.permiso_circulacion,
        seguro_obligatorio: docs.seguro_obligatorio
      }
    };

    this.machineService.createMachine(machineData)
      .pipe(
        catchError((error) => {
          console.error('Error al crear máquina:', error);
          
          // Extraer mensaje de error del backend
          let errorMessage = 'Error al crear la máquina. Por favor, intente nuevamente.';
          
          if (error.error) {
            // Error de validación de FastAPI/Pydantic
            if (error.error.detail) {
              if (Array.isArray(error.error.detail)) {
                // Errores de validación múltiples
                const validationErrors = error.error.detail
                  .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
                  .join('\n');
                errorMessage = `Error de validación:\n${validationErrors}`;
              } else if (typeof error.error.detail === 'string') {
                errorMessage = error.error.detail;
              } else {
                errorMessage = JSON.stringify(error.error.detail);
              }
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          } else if (error.message) {
            // Error del cliente (validación previa)
            errorMessage = error.message;
          }
          
          // Mostrar error al usuario
          alert(errorMessage);
          return of(null);
        })
      )
      .subscribe((machine) => {
        if (machine) {
          // Mostrar mensaje de éxito
          alert('Máquina creada exitosamente');
          // Redirigir al detalle de la máquina creada
          this.router.navigate(['/maquinas', machine.id]);
        }
      });
  }
}

