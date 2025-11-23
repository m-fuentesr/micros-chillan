import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaintenanceRecord, MaintenanceFilters } from '../../models/machine-detail.models';

@Component({
  selector: 'app-machine-maintenance',
  imports: [FormsModule],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-header">
        <div>
          <h2 class="card-title text-2xl">Mantenimiento y Gastos</h2>
          <p class="text-sm text-base-content/70">
            Gestiona repuestos, mantenimientos y gastos asociados a esta máquina.
          </p>
        </div>
      </div>
      <div class="card-body">
        <!-- KPI de Gastos del Mes -->
        <div class="mb-6">
          <div class="card bg-base-200">
            <div class="card-body">
              <div class="text-sm text-base-content/70 mb-1">Gastos en Repuestos (Este Mes)</div>
              <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold">{{ formatCurrency(monthTotal()) }}</div>
              <div class="text-xs text-base-content/70 mt-1">Acumulado del mes actual</div>
            </div>
          </div>
        </div>

        <!-- Botón para Registrar Nueva Compra -->
        <div class="mb-6">
          <button class="btn btn-primary" (click)="openModal()">
            Registrar Nueva Compra
          </button>
        </div>

        <!-- Histórico con Filtros -->
        <div class="space-y-4">
          <h3 class="text-xl font-bold">Histórico de Repuestos</h3>
          
          <!-- Filtros -->
          <div class="flex flex-wrap gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Ítem</span>
              </label>
              <input
                type="text"
                class="input input-bordered input-sm w-48"
                placeholder="Buscar por ítem..."
                [value]="filters().item || ''"
                (input)="onFilterChange('item', $event)">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Categoría</span>
              </label>
              <select
                class="select select-bordered select-sm w-48"
                [value]="filters().categoria || 'all'"
                (change)="onFilterChange('categoria', $event)">
                <option value="all">Todas</option>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Desde</span>
              </label>
              <input
                type="date"
                class="input input-bordered input-sm w-48"
                [value]="filters().desde || ''"
                (change)="onFilterChange('desde', $event)">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Hasta</span>
              </label>
              <input
                type="date"
                class="input input-bordered input-sm w-48"
                [value]="filters().hasta || ''"
                (change)="onFilterChange('hasta', $event)">
            </div>
            <div class="form-control self-end">
              <button class="btn btn-ghost btn-sm" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          </div>

          <!-- Tabla de Histórico -->
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ítem/Repuesto</th>
                  <th class="text-right">Costo</th>
                  <th>Nº Factura/Boleta</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords(); track record.id) {
                  <tr>
                    <td class="font-mono text-sm">{{ formatDate(record.fecha) }}</td>
                    <td class="truncate tooltip" [attr.data-tip]="record.item">{{ record.item }}</td>
                    <td class="text-right font-semibold">{{ formatCurrency(record.costo) }}</td>
                    <td class="font-mono text-sm break-all">{{ record.numero_factura }}</td>
                    <td>
                      @if (record.categoria === 'preventivo') {
                        <span class="badge badge-success badge-sm">Preventivo</span>
                      } @else if (record.categoria === 'correctivo') {
                        <span class="badge badge-warning badge-sm">Correctivo</span>
                      } @else {
                        <span class="badge badge-ghost badge-sm">—</span>
                      }
                    </td>
                    <td>
                      <button class="btn btn-error btn-sm" (click)="onDelete(record.id)">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center text-base-content/50 py-8">
                      No hay registros que coincidan con los filtros
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Registro -->
    <dialog class="modal" [class.modal-open]="isModalOpen()">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Registrar Compra de Repuesto</h3>
        
        <form (ngSubmit)="onSubmit(); $event.preventDefault()" #form="ngForm">
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Ítem/Repuesto <span class="text-error">*</span></span>
                </label>
                <select
                  class="select select-bordered w-full"
                  [(ngModel)]="formData.item"
                  name="item"
                  required>
                  <option value="">Seleccione un ítem</option>
                  @for (item of availableItems(); track item) {
                    <option [value]="item">{{ item }}</option>
                  }
                </select>
                <label class="label">
                  <span class="label-text-alt">Ingrese el nombre del repuesto o ítem comprado</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Costo ($) <span class="text-error">*</span></span>
                </label>
                <input
                  type="number"
                  class="input input-bordered w-full"
                  [(ngModel)]="formData.costo"
                  name="costo"
                  min="0"
                  step="1"
                  placeholder="0"
                  required>
                <label class="label">
                  <span class="label-text-alt">Ingrese el costo en pesos chilenos</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Nº Factura/Boleta <span class="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  class="input input-bordered w-full"
                  [(ngModel)]="formData.numero_factura"
                  name="numero_factura"
                  placeholder="Ej: 001-00001234"
                  required>
                <label class="label">
                  <span class="label-text-alt">Número de factura o boleta para trazabilidad contable/SII</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Categoría</span>
                </label>
                <select
                  class="select select-bordered w-full"
                  [(ngModel)]="formData.categoria"
                  name="categoria">
                  <option value="">Seleccione una categoría</option>
                  <option value="preventivo">Preventivo</option>
                  <option value="correctivo">Correctivo</option>
                </select>
                <label class="label">
                  <span class="label-text-alt">Tipo de mantenimiento (opcional pero recomendado)</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Fecha de Compra <span class="text-error">*</span></span>
                </label>
                <input
                  type="date"
                  class="input input-bordered w-full"
                  [(ngModel)]="formData.fecha"
                  name="fecha"
                  required>
              </div>
            </div>

            <div class="modal-action">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="!form.valid">
                Guardar
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop" (click)="closeModal()">
          <button>close</button>
        </form>
      </dialog>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineMaintenance implements OnInit {
  machineId = input.required<number>();
  records = input.required<MaintenanceRecord[]>();
  availableItems = input<string[]>([]);
  filters = input<MaintenanceFilters>({});

  recordAdded = output<MaintenanceRecord>();
  recordDeleted = output<number>();
  filterChange = output<MaintenanceFilters>();

  isModalOpen = signal(false);
  formData = {
    item: '',
    costo: 0,
    numero_factura: '',
    categoria: null as 'preventivo' | 'correctivo' | null,
    fecha: new Date().toISOString().split('T')[0]
  };

  monthTotal = computed(() => {
    const records = this.records();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records
      .filter(r => {
        const recordDate = new Date(r.fecha);
        return recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.costo, 0);
  });

  filteredRecords = computed(() => {
    const records = this.records();
    const filters = this.filters();

    return records.filter(record => {
      if (filters.item && !record.item.toLowerCase().includes(filters.item.toLowerCase())) {
        return false;
      }
      if (filters.categoria && filters.categoria !== 'all' && record.categoria !== filters.categoria) {
        return false;
      }
      if (filters.desde && record.fecha < filters.desde) {
        return false;
      }
      if (filters.hasta && record.fecha > filters.hasta) {
        return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    // Cargar ítems disponibles del backend (mock por ahora)
    // En producción vendría de un servicio
  }

  openModal(): void {
    this.isModalOpen.set(true);
    this.formData = {
      item: '',
      costo: 0,
      numero_factura: '',
      categoria: null,
      fecha: new Date().toISOString().split('T')[0]
    };
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSubmit(): void {
    const data = this.formData;
    if (!data.item || !data.costo || !data.numero_factura || !data.fecha) {
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: Date.now(), // Temporal, en producción vendría del backend
      maquina_id: this.machineId(),
      item: data.item,
      costo: data.costo,
      numero_factura: data.numero_factura,
      categoria: data.categoria || null,
      fecha: data.fecha
    };

    this.recordAdded.emit(newRecord);
    this.closeModal();
  }

  onDelete(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      return;
    }
    this.recordDeleted.emit(id);
  }

  onFilterChange(key: keyof MaintenanceFilters, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const currentFilters = this.filters();
    const newFilters: MaintenanceFilters = {
      ...currentFilters,
      [key]: target.value || undefined
    };
    this.filterChange.emit(newFilters);
  }

  clearFilters(): void {
    this.filterChange.emit({});
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
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

