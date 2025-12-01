import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceRecord, MaintenanceFilters } from '../../models/machine-detail.models';

@Component({
  selector: 'app-machine-maintenance',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
      <!-- Header -->
      <div class="card-header p-6 border-b border-base-200 bg-base-50">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="card-title text-2xl font-bold border-l-4 border-l-primary pl-3">
              Mantenimiento y Gastos
            </h2>
            <p class="text-xs sm:text-sm text-base-content/60 mt-1">
              Gestiona repuestos, mantenimientos y gastos asociados a esta máquina.
            </p>
          </div>
          
          <!-- Badge de conteo -->
          <div class="flex items-center gap-3">
            <span class="badge badge-lg badge-outline font-bold">
              {{ filteredRecords().length }} {{ filteredRecords().length === 1 ? 'registro' : 'registros' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-4 sm:p-6">
        <!-- KPI de Gastos del Mes -->
        <div class="mb-6">
          <div class="p-4 sm:p-6 rounded-xl border border-error/20 bg-gradient-to-br from-error/10 via-error/5 to-transparent">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Gastos en Repuestos</div>
                <div class="text-2xl sm:text-3xl font-black text-error tabular-nums tracking-tight mb-1">
                  {{ formatCurrency(monthTotal()) }}
                </div>
                <div class="text-xs text-base-content/60">Acumulado del mes actual</div>
              </div>
              <div class="p-3 bg-error/20 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-error" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.457-.899c-1.252.81-1.272 2.596-.546 4.717.37.957.983 1.93 1.745 2.825A9 9 0 0010 18a9 9 0 006.326-15.485c-.328-.15-.698-.277-1.09-.38l-1.434-.374a1.001 1.001 0 00-1.407 1.192z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón para Registrar Nueva Compra -->
        <div class="mb-6">
          <button 
            class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
            (click)="openModal()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Registrar Nueva Compra
          </button>
        </div>

        <!-- Filtros Mejorados -->
        <div class="bg-base-50/50 p-4 rounded-xl border border-base-200 mb-6">
          <div class="flex flex-wrap items-end gap-3">
            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Ítem/Repuesto</span>
              </label>
              <input
                type="text"
                class="input input-bordered input-sm w-full"
                placeholder="Buscar por ítem..."
                [value]="filters().item || ''"
                (input)="onFilterChange('item', $event)">
            </div>
            
            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Categoría</span>
              </label>
              <select
                class="select select-bordered select-sm w-full"
                [value]="filters().categoria || 'all'"
                (change)="onFilterChange('categoria', $event)">
                <option value="all">Todas las categorías</option>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
            </div>
            
            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Desde</span>
              </label>
              <input
                type="date"
                class="input input-bordered input-sm w-full"
                [value]="filters().desde || ''"
                (change)="onFilterChange('desde', $event)">
            </div>
            
            <div class="form-control flex-1 min-w-[140px]">
              <label class="label py-1">
                <span class="label-text text-xs font-semibold text-base-content/60">Hasta</span>
              </label>
              <input
                type="date"
                class="input input-bordered input-sm w-full"
                [value]="filters().hasta || ''"
                (change)="onFilterChange('hasta', $event)">
            </div>
            
            <div class="form-control">
              <button 
                class="btn btn-ghost btn-sm gap-2" 
                (click)="clearFilters()"
                [class.btn-disabled]="!hasActiveFilters()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.972.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.591l-4.682 4.683a2.25 2.25 0 00-.659 1.591v4.242a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L4.659 8.591A2.25 2.25 0 014 7V4.341a.75.75 0 01.628-.74z" clip-rule="evenodd" />
                </svg>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <!-- Vista Móvil: Cards -->
        <div class="block xl:hidden space-y-4">
          @for (record of filteredRecords(); track record.id; let i = $index) {
            <div 
              class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
              [style.animation-delay.ms]="i * 50"
              [style.animation-fill-mode]="'both'">
              <div class="card-body p-5">
                <!-- Header: Fecha y Categoría -->
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-bold text-base text-base-content">{{ formatDate(record.fecha) }}</h3>
                      <p class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</p>
                    </div>
                  </div>
                  
                  <!-- Badge Categoría -->
                  <div class="shrink-0">
                    @if (record.categoria === 'preventivo') {
                      <div class="badge badge-success gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                        </svg>
                        Preventivo
                      </div>
                    } @else if (record.categoria === 'correctivo') {
                      <div class="badge badge-warning gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                        </svg>
                        Correctivo
                      </div>
                    } @else {
                      <div class="badge badge-ghost">—</div>
                    }
                  </div>
                </div>

                <!-- Divider -->
                <div class="divider my-3 opacity-30"></div>

                <!-- Información del Repuesto -->
                <div class="space-y-3">
                  <div class="p-3 bg-base-50 rounded-lg border border-base-200">
                    <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Ítem/Repuesto</div>
                    <div class="font-bold text-base text-base-content truncate tooltip" [attr.data-tip]="record.item">
                      {{ record.item }}
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 bg-error/5 rounded-lg border border-error/20">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Costo</div>
                      <div class="font-bold text-lg text-error tabular-nums">
                        {{ formatCurrency(record.costo) }}
                      </div>
                    </div>
                    <div class="p-3 bg-base-50 rounded-lg border border-base-200">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Nº Factura</div>
                      <div class="font-mono text-sm text-base-content break-all">
                        {{ record.numero_factura }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botón Eliminar -->
                <div class="mt-4">
                  <button 
                    class="btn btn-error btn-sm w-full gap-2"
                    (click)="onDelete(record.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 100 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
                    </svg>
                    Eliminar Registro
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12 animate-fade-in">
              <div class="text-4xl opacity-50 mb-3">🔧</div>
              <p class="text-base-content/50 font-medium">No hay registros que coincidan con los filtros</p>
              <p class="text-sm text-base-content/40 mt-1">Intenta ajustar los filtros para ver más resultados</p>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[200px]">Ítem/Repuesto</th>
                <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Costo</th>
                <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[150px]">Nº Factura/Boleta</th>
                <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Categoría</th>
                <th class="py-4 pr-6 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (record of filteredRecords(); track record.id; let i = $index) {
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter"
                  [style.animation-delay.ms]="i * 30"
                  [style.animation-fill-mode]="'both'">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div>
                        <div class="font-semibold text-base-content">{{ formatDate(record.fecha) }}</div>
                        <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="py-4">
                    <div class="font-bold text-base-content truncate tooltip" [attr.data-tip]="record.item">
                      {{ record.item }}
                    </div>
                  </td>
                  
                  <td class="text-right py-4 font-mono font-bold text-error tabular-nums text-sm">
                    {{ formatCurrency(record.costo) }}
                  </td>
                  
                  <td class="py-4">
                    <div class="font-mono text-sm text-base-content break-all">
                      {{ record.numero_factura }}
                    </div>
                  </td>
                  
                  <td class="text-center py-4">
                    @if (record.categoria === 'preventivo') {
                      <div class="badge badge-success gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                        </svg>
                        Preventivo
                      </div>
                    } @else if (record.categoria === 'correctivo') {
                      <div class="badge badge-warning gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                        </svg>
                        Correctivo
                      </div>
                    } @else {
                      <span class="text-base-content/30">—</span>
                    }
                  </td>
                  
                  <td class="pr-6 text-center py-4">
                    <button 
                      class="btn btn-error btn-xs gap-1.5"
                      (click)="onDelete(record.id)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                        <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 100 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
                      </svg>
                      Eliminar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-12 animate-fade-in">
                    <div class="text-4xl opacity-50 mb-3">🔧</div>
                    <p class="text-base-content/50 font-medium">No hay registros que coincidan con los filtros</p>
                    <p class="text-sm text-base-content/40 mt-1">Intenta ajustar los filtros para ver más resultados</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Registro Mejorado -->
    <dialog class="modal" [class.modal-open]="isModalOpen()">
      <div class="modal-box max-w-2xl">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-base-200">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-xl text-base-content">Registrar Compra de Repuesto</h3>
            <p class="text-xs text-base-content/60">Completa los datos para registrar un nuevo gasto de mantenimiento</p>
          </div>
        </div>
        
        <form (ngSubmit)="onSubmit(); $event.preventDefault()" #form="ngForm">
          <div class="space-y-5">
            <!-- Ítem/Repuesto -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Ítem/Repuesto 
                  <span class="text-error">*</span>
                </span>
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
                <span class="label-text-alt text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Ingrese el nombre del repuesto o ítem comprado
                </span>
              </label>
            </div>

            <!-- Costo -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Costo ($) 
                  <span class="text-error">*</span>
                </span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 font-mono">$</span>
                <input
                  type="number"
                  class="input input-bordered w-full pl-8 font-mono"
                  [(ngModel)]="formData.costo"
                  name="costo"
                  min="0"
                  step="1"
                  placeholder="0"
                  required>
              </div>
              <label class="label">
                <span class="label-text-alt text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Ingrese el costo en pesos chilenos
                </span>
              </label>
            </div>

            <!-- Nº Factura/Boleta -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Nº Factura/Boleta 
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                class="input input-bordered w-full font-mono"
                [(ngModel)]="formData.numero_factura"
                name="numero_factura"
                placeholder="Ej: 001-00001234"
                required>
              <label class="label">
                <span class="label-text-alt text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Número de factura o boleta para trazabilidad contable/SII
                </span>
              </label>
            </div>

            <!-- Categoría -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Categoría</span>
              </label>
              <select
                class="select select-bordered w-full"
                [(ngModel)]="formData.categoria"
                name="categoria">
                <option value="">Seleccione una categoría (opcional)</option>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
              <label class="label">
                <span class="label-text-alt text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Tipo de mantenimiento (opcional pero recomendado)
                </span>
              </label>
            </div>

            <!-- Fecha de Compra -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">
                  Fecha de Compra 
                  <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                class="input input-bordered w-full"
                [(ngModel)]="formData.fecha"
                name="fecha"
                required>
              <label class="label">
                <span class="label-text-alt text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 inline mr-1">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                  </svg>
                  Fecha en que se realizó la compra
                </span>
              </label>
            </div>
          </div>

          <!-- Acciones del Modal -->
          <div class="modal-action mt-6 pt-6 border-t border-base-200">
            <button 
              type="button" 
              class="btn btn-ghost gap-2"
              (click)="closeModal()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary gap-2 shadow-lg shadow-primary/20"
              [disabled]="!form.valid">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" (click)="closeModal()">
        <button>close</button>
      </form>
    </dialog>
  `,
  styles: [`
    @keyframes card-enter {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes table-row-enter {
      from {
        opacity: 0;
        transform: translateX(-8px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-card-enter {
      animation: card-enter 400ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    .animate-table-row-enter {
      animation: table-row-enter 300ms cubic-bezier(0.22, 0.8, 0.35, 1) both;
    }

    .animate-fade-in {
      animation: fade-in 400ms ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-card-enter,
      .animate-table-row-enter,
      .animate-fade-in {
        animation: none;
        transform: none;
      }
    }
  `],
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

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.item || f.categoria || f.desde || f.hasta);
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
      return d.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  }

  formatDateFull(date: string): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short'
      });
    } catch {
      return '';
    }
  }
}
