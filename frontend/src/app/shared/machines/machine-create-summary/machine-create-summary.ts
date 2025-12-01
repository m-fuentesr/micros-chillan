import { Component, ChangeDetectionStrategy, input, effect, signal, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-machine-create-summary',
  imports: [],
  template: `
    <div class="summary-card card bg-base-100 shadow-xl lg:sticky lg:top-6" [class.is-loaded]="isLoaded()">
      <div class="card-body">
        <h3 class="card-title text-base mb-4">Resumen en vivo</h3>
        
        <div class="summary-fields space-y-4">
          <!-- Identificación -->
          <div class="summary-section">
            <div class="summary-field" [class.is-updating]="updatingFields().numero">
              <span class="summary-label text-xs uppercase tracking-wide text-base-content/70">Número de Máquina</span>
              <div class="summary-value font-bold mt-1 truncate" [attr.aria-label]="'Número de Máquina: ' + (summary().numero || 'No ingresado')">
                {{ summary().numero || '--' }}
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <div class="summary-field" [class.is-updating]="updatingFields().patente">
              <span class="summary-label text-xs uppercase tracking-wide text-base-content/70">Patente</span>
              <div class="summary-value font-semibold mt-1 truncate font-mono" [attr.aria-label]="'Patente: ' + (summary().patente || 'No ingresado')">
                {{ summary().patente || '--' }}
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <div class="summary-field" [class.is-updating]="updatingFields().marca">
              <span class="summary-label text-xs uppercase tracking-wide text-base-content/70">Marca / Modelo</span>
              <div class="summary-value font-bold mt-1 truncate" [attr.aria-label]="'Marca / Modelo: ' + (summary().marca || 'No ingresado')">
                {{ summary().marca || '--' }}
              </div>
            </div>
          </div>
          
          <!-- Asignación y Estado -->
          <div class="summary-section">
            <div class="summary-field" [class.is-updating]="updatingFields().chofer">
              <span class="summary-label text-xs uppercase tracking-wide text-base-content/70">Chofer asignado</span>
              <div class="summary-value font-bold mt-1 truncate" [attr.aria-label]="'Chofer asignado: ' + (summary().chofer || 'Sin asignar')">
                {{ summary().chofer || '— Sin asignar —' }}
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <div class="summary-field" [class.is-updating]="updatingFields().estado">
              <span class="summary-label text-xs uppercase tracking-wide text-base-content/70">Estado operativo</span>
              <div class="summary-value font-bold mt-1 truncate" [attr.aria-label]="'Estado operativo: ' + (summary().estado || 'No seleccionado')">
                {{ summary().estado || '--' }}
              </div>
            </div>
          </div>
          
          <!-- Documentación -->
          <div class="summary-section">
            <div class="summary-field" [class.is-updating]="updatingFields().documentacion">
              <span class="summary-label text-xs uppercase tracking-wide text-base-content/70 mb-2">Documentación</span>
              <div class="flex flex-col gap-1.5 mt-1">
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-4 h-4 flex items-center justify-center font-mono" [class.text-success]="summary().documentacion?.revision_tecnica === '✓'" [class.text-base-content/40]="summary().documentacion?.revision_tecnica === '—'">
                    {{ summary().documentacion?.revision_tecnica || '—' }}
                  </span>
                  <span class="text-base-content/70">Revisión Técnica</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-4 h-4 flex items-center justify-center font-mono" [class.text-success]="summary().documentacion?.permiso_circulacion === '✓'" [class.text-base-content/40]="summary().documentacion?.permiso_circulacion === '—'">
                    {{ summary().documentacion?.permiso_circulacion || '—' }}
                  </span>
                  <span class="text-base-content/70">Permiso Circulación</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-4 h-4 flex items-center justify-center font-mono" [class.text-success]="summary().documentacion?.seguro_obligatorio === '✓'" [class.text-base-content/40]="summary().documentacion?.seguro_obligatorio === '—'">
                    {{ summary().documentacion?.seguro_obligatorio || '—' }}
                  </span>
                  <span class="text-base-content/70">Seguro Obligatorio</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="text-xs text-base-content/70 mt-6" role="note">
          Se actualiza a medida que completes el formulario. Revisa antes de guardar.
        </p>

        <div class="divider" aria-hidden="true"></div>

        <h3 class="card-title text-base mb-4">Checklist rápido</h3>
        <ul class="space-y-2 text-sm text-base-content/70" role="list">
          <li>• Campos con * son obligatorios.</li>
          <li>• Documentación vigente = 30 días.</li>
          <li>• Patente única en el sistema.</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    /* Animación de entrada del card */
    .summary-card {
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 400ms cubic-bezier(0.25, 1, 0.5, 1),
                  transform 400ms cubic-bezier(0.25, 1, 0.5, 1);
    }

    .summary-card.is-loaded {
      opacity: 1;
      transform: translateY(0);
    }

    /* Animación de entrada de los campos (staggering) */
    .summary-field {
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: var(--field-delay, 0ms);
    }

    .summary-card.is-loaded .summary-field {
      opacity: 1;
      transform: translateY(0);
    }

    /* Staggering incremental para cada campo */
    .summary-card.is-loaded .summary-field:nth-child(1) {
      transition-delay: 50ms;
    }

    .summary-card.is-loaded .summary-field:nth-child(2) {
      transition-delay: 100ms;
    }

    .summary-card.is-loaded .summary-field:nth-child(3) {
      transition-delay: 150ms;
    }

    .summary-card.is-loaded .summary-field:nth-child(4) {
      transition-delay: 200ms;
    }

    .summary-card.is-loaded .summary-field:nth-child(5) {
      transition-delay: 250ms;
    }

    .summary-card.is-loaded .summary-field:nth-child(6) {
      transition-delay: 300ms;
    }

    /* Animación de actualización del resumen (flash de opacidad) */
    .summary-field.is-updating {
      opacity: 0.2;
      transition: opacity 150ms cubic-bezier(0.77, 0, 0.175, 1);
    }

    .summary-field {
      transition: opacity 150ms cubic-bezier(0.77, 0, 0.175, 1);
    }

    /* Separadores visuales mejorados */
    .summary-section {
      border-bottom: 1px solid hsl(var(--b3));
      padding-bottom: 0.5rem;
    }

    .summary-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    /* Mejora de contraste y legibilidad */
    .summary-label {
      color: hsl(var(--bc) / 0.7);
      font-weight: 500;
    }

    .summary-value {
      color: hsl(var(--bc));
      min-height: 1.5rem;
    }

    /* Respeto a prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .summary-card,
      .summary-field {
        transition: opacity 100ms linear;
        transform: none;
      }

      .summary-field.is-updating {
        transition: opacity 100ms linear;
      }
    }

    /* Focus visible para accesibilidad */
    .summary-card:focus-within {
      outline: 2px solid hsl(var(--p));
      outline-offset: 2px;
    }

    /* Responsividad: Estilos más compactos en pantallas pequeñas */
    @media (max-width: 1023px) {
      .summary-card {
        position: relative;
        top: auto;
      }

      .summary-fields {
        gap: 0.75rem;
      }

      .summary-section {
        padding-bottom: 0.375rem;
      }

      .summary-label {
        font-size: 0.625rem;
      }

      .summary-value {
        font-size: 0.875rem;
        min-height: 1.25rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineCreateSummary {
  summary = input.required<{
    numero?: string;
    patente?: string;
    marca?: string;
    chofer?: string;
    estado?: string;
    documentacion?: {
      revision_tecnica?: string;
      permiso_circulacion?: string;
      seguro_obligatorio?: string;
    };
  }>();

  // Estado para controlar la animación de entrada
  isLoaded = signal(false);

  // Estado para rastrear qué campos se están actualizando
  updatingFields = signal<{
    numero: boolean;
    patente: boolean;
    marca: boolean;
    chofer: boolean;
    estado: boolean;
    documentacion: boolean;
  }>({
    numero: false,
    patente: false,
    marca: false,
    chofer: false,
    estado: false,
    documentacion: false
  });

  // Valores previos para detectar cambios
  private previousValues = signal<{
    numero?: string;
    patente?: string;
    marca?: string;
    chofer?: string;
    estado?: string;
    documentacion?: {
      revision_tecnica?: string;
      permiso_circulacion?: string;
      seguro_obligatorio?: string;
    };
  }>({});

  // Flag para evitar ejecutar el effect en la primera carga
  private isInitialized = signal(false);

  constructor() {
    // Animación de entrada después de que el componente se renderice
    afterNextRender(() => {
      // Pequeño delay para permitir que el navegador procese el render inicial
      requestAnimationFrame(() => {
        this.isLoaded.set(true);
        // Inicializar valores previos después del primer render
        this.previousValues.set({ ...this.summary() });
        this.isInitialized.set(true);
      });
    });

    // Efecto para detectar cambios y aplicar animación de actualización
    effect(() => {
      // Solo procesar cambios después de la inicialización
      if (!this.isInitialized()) {
        return;
      }

      const current = this.summary();
      const previous = this.previousValues();

      // Detectar cambios en cada campo
      const fields: Array<keyof typeof current> = ['numero', 'patente', 'marca', 'chofer', 'estado'];
      
      fields.forEach(field => {
        // Solo animar si el valor realmente cambió (comparación estricta)
        if (current[field] !== previous[field] && previous[field] !== undefined) {
          // Marcar el campo como actualizándose
          this.updatingFields.update(updating => ({
            ...updating,
            [field]: true
          }));

          // Remover el estado después de la animación
          setTimeout(() => {
            this.updatingFields.update(updating => ({
              ...updating,
              [field]: false
            }));
          }, 150);
        }
      });
      
      // Detectar cambios en documentación
      const currentDocs = current.documentacion;
      const previousDocs = previous.documentacion;
      if (currentDocs && previousDocs) {
        const docsChanged = 
          currentDocs.revision_tecnica !== previousDocs.revision_tecnica ||
          currentDocs.permiso_circulacion !== previousDocs.permiso_circulacion ||
          currentDocs.seguro_obligatorio !== previousDocs.seguro_obligatorio;
        
        if (docsChanged && (previousDocs.revision_tecnica !== undefined || previousDocs.permiso_circulacion !== undefined || previousDocs.seguro_obligatorio !== undefined)) {
          this.updatingFields.update(updating => ({
            ...updating,
            documentacion: true
          }));

          setTimeout(() => {
            this.updatingFields.update(updating => ({
              ...updating,
              documentacion: false
            }));
          }, 150);
        }
      } else if (currentDocs && !previousDocs) {
        // Si se agrega documentación por primera vez, no animar
      }

      // Actualizar valores previos solo si hubo cambios reales
      // Usar JSON.stringify para comparación profunda y evitar actualizaciones innecesarias
      const currentStr = JSON.stringify(current);
      const previousStr = JSON.stringify(previous);
      
      if (currentStr !== previousStr) {
        this.previousValues.set({ ...current });
      }
    });
  }
}
