import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Machine } from '../../models/machine.models';

@Component({
  selector: 'app-machine-general-info',
  imports: [],
  template: `
    <div class="space-y-6">
      <!-- Información General -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-header">
          <h2 class="card-title text-2xl">Información General</h2>
        </div>
        <div class="card-body">
          <div class="flex items-start gap-6">
            <!-- Icono de Máquina -->
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-24 h-24">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5.5-1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5.5-1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm3.5 2a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"/>
                </svg>
              </div>
            </div>

            <!-- Detalles -->
            <div class="flex-1 space-y-4">
              <div>
                <span class="text-xs uppercase tracking-wide text-base-content/70">IDENTIFICACIÓN</span>
                <div class="font-bold text-lg">NÚMERO: {{ machine().numero }}</div>
              </div>
              <div>
                <span class="text-xs uppercase tracking-wide text-base-content/70">MARCA</span>
                <div class="font-bold truncate tooltip" [attr.data-tip]="machine().marca">{{ machine().marca }}</div>
              </div>
              <div>
                <span class="text-xs uppercase tracking-wide text-base-content/70">PATENTE</span>
                <div class="font-bold break-all">{{ machine().patente }}</div>
              </div>
              <div>
                <span class="text-xs uppercase tracking-wide text-base-content/70">ESTADO Y ASIGNACIÓN</span>
                <div class="space-y-2 mt-2">
                  @if (year()) {
                    <div><span class="font-bold">AÑO:</span> {{ year() }}</div>
                  }
                  <div>
                    <span class="font-bold">ESTADO OPERATIVO:</span>
                    <span class="badge badge-success ml-2">{{ machine().estado_operativo }}</span>
                  </div>
                  <div>
                    <span class="font-bold">CHOFER ASIGNADO:</span>
                    @if (machine().chofer_actual) {
                      <span class="ml-2 truncate tooltip" [attr.data-tip]="machine().chofer_actual!.nombre_completo">{{ machine().chofer_actual!.nombre_completo }}</span>
                    } @else {
                      <span class="ml-2 text-base-content/50">Sin asignar</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Documentación Obligatoria -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-header">
          <div>
            <h2 class="card-title text-2xl">Documentación Obligatoria</h2>
            <p class="text-sm text-base-content/70">
              Control de fechas de Revisión Técnica, Permiso de Circulación y Seguro (RF-031).
            </p>
          </div>
          <button class="btn btn-primary btn-sm" (click)="onEditDocs()">
            Editar
          </button>
        </div>
        <div class="card-body">
          <div class="space-y-4">
            <!-- Revisión Técnica -->
            <div class="flex items-center justify-between border-b border-base-300 pb-4">
              <div class="flex-1">
                <div class="font-bold mb-1">Revisión Técnica</div>
                @if (docStatus().revision_tecnica) {
                  <div class="text-sm text-base-content/70">
                    {{ formatDate(docStatus().revision_tecnica!.fecha || '') }}
                  </div>
                } @else {
                  <div class="text-sm text-base-content/50">Sin fecha registrada</div>
                }
              </div>
              <div class="text-left">
                @if (docStatus().revision_tecnica) {
                  <span 
                    class="badge"
                    [class.badge-error]="docStatus().revision_tecnica!.estado === 'error'"
                    [class.badge-warning]="docStatus().revision_tecnica!.estado === 'warning'"
                    [class.badge-success]="docStatus().revision_tecnica!.estado === 'ok'">
                    {{ docStatus().revision_tecnica!.texto }}
                  </span>
                }
              </div>
            </div>

            <!-- Permiso de Circulación -->
            <div class="flex items-center justify-between border-b border-base-300 pb-4">
              <div class="flex-1">
                <div class="font-bold mb-1">Permiso de Circulación</div>
                @if (docStatus().permiso_circulacion) {
                  <div class="text-sm text-base-content/70">
                    {{ formatDate(docStatus().permiso_circulacion!.fecha || '') }}
                  </div>
                } @else {
                  <div class="text-sm text-base-content/50">Sin fecha registrada</div>
                }
              </div>
              <div class="text-left">
                @if (docStatus().permiso_circulacion) {
                  <span 
                    class="badge"
                    [class.badge-error]="docStatus().permiso_circulacion!.estado === 'error'"
                    [class.badge-warning]="docStatus().permiso_circulacion!.estado === 'warning'"
                    [class.badge-success]="docStatus().permiso_circulacion!.estado === 'ok'">
                    {{ docStatus().permiso_circulacion!.texto }}
                  </span>
                }
              </div>
            </div>

            <!-- Seguro Obligatorio -->
            <div class="flex items-center justify-between pb-4">
              <div class="flex-1">
                <div class="font-semibold mb-1">Seguro Obligatorio (SOAP)</div>
                @if (docStatus().seguro_obligatorio) {
                  <div class="text-sm text-base-content/70">
                    {{ formatDate(docStatus().seguro_obligatorio!.fecha || '') }}
                  </div>
                } @else {
                  <div class="text-sm text-base-content/50">Sin fecha registrada</div>
                }
              </div>
              <div class="text-left">
                @if (docStatus().seguro_obligatorio) {
                  <span 
                    class="badge"
                    [class.badge-error]="docStatus().seguro_obligatorio!.estado === 'error'"
                    [class.badge-warning]="docStatus().seguro_obligatorio!.estado === 'warning'"
                    [class.badge-success]="docStatus().seguro_obligatorio!.estado === 'ok'">
                    {{ docStatus().seguro_obligatorio!.texto }}
                  </span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineGeneralInfo {
  machine = input.required<Machine>();
  editDocs = output<void>();

  docStatus = computed(() => {
    return this.machine().documentos_estado ?? {};
  });


  year = computed(() => {
    return this.machine().año || null;
  });

  onEditDocs(): void {
    this.editDocs.emit();
  }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return date;
    }
  }
}

