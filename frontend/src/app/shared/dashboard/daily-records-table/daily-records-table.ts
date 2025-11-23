import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyRecord } from '../../models/dashboard.models';

@Component({
  selector: 'app-daily-records-table',
  imports: [RouterLink],
  template: `
    <div class="card bg-base-100 shadow-xl animate-scale-up">
      <div class="card-header p-6">
        <div class="flex flex-col gap-4">
          <!-- Título y Subtítulo -->
          <div>
            <h2 class="card-title text-2xl mb-2">Estado de Registros Diarios</h2>
            <p class="text-sm text-base-content/70">
              Resumen de registros por estado para el último día de operación (RF-037).
            </p>
          </div>
          
          <!-- Resumen y Filtro en una fila -->
          <div class="flex flex-wrap items-center justify-between gap-4">
            <!-- Badges de Resumen -->
            <div class="flex flex-wrap gap-2">
              <div class="badge badge-warning gap-2 animate-card-enter">
                <span class="w-2 h-2 rounded-full bg-current"></span>
                {{ summary().pendientes }} pendientes
              </div>
              <div class="badge badge-error gap-2 animate-card-enter-delay-1">
                <span class="w-2 h-2 rounded-full bg-current"></span>
                {{ summary().incidentes }} incidente
              </div>
              <div class="badge badge-success gap-2 animate-card-enter-delay-2">
                <span class="w-2 h-2 rounded-full bg-current"></span>
                {{ summary().completos }} completos
              </div>
            </div>
            
            <!-- Botón de Filtro -->
            <button 
              class="btn btn-sm btn-ghost hover-scale"
              [class.btn-active]="showOnlyPending()"
              (click)="onToggleFilter()"
              type="button"
              aria-label="Filtrar solo pendientes e incidentes">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                fill="currentColor" 
                viewBox="0 0 16 16" 
                aria-hidden="true"
                class="transition-transform duration-200"
                [class.rotate-180]="showOnlyPending()">
                <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Solo Pendientes/Incidentes
            </button>
          </div>
        </div>
      </div>
      <div class="card-body p-6">
        <!-- Vista de Cards (cuando la tabla se rompe) -->
        <div class="block lg:hidden space-y-4">
          @for (record of filteredRecords(); track record.machineId + record.date; let i = $index) {
            <div 
              class="card bg-base-200 shadow-md hover-lift animate-slide-up"
              [class.border-l-4]="record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO'"
              [class.border-warning]="record.status === 'PENDIENTE_TRABAJADOR'"
              [class.border-error]="record.status === 'INCIDENTE_REPORTADO'"
              [style.animation-delay.ms]="i * 50"
              [style.animation-fill-mode]="'both'">
              <div class="card-body p-6">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm @xs:text-base truncate tooltip" [attr.data-tip]="record.machineId">
                      Máquina: {{ record.machineId }}
                    </div>
                    <div class="text-sm text-base-content/70 truncate tooltip mt-1" [attr.data-tip]="record.driver">
                      Chofer: {{ record.driver }}
                    </div>
                  </div>
                  <div>
                    @switch (record.status) {
                      @case ('PENDIENTE_TRABAJADOR') {
                        <span class="badge badge-warning badge-sm">Pendiente</span>
                      }
                      @case ('INCIDENTE_REPORTADO') {
                        <span class="badge badge-error badge-sm">Incidente</span>
                      }
                      @case ('COMPLETO') {
                        <span class="badge badge-success badge-sm">Completo</span>
                      }
                      @case ('NO_TRABAJADO') {
                        <span class="badge badge-ghost badge-sm">No Trabajado</span>
                      }
                      @case ('DIA_NO_TRABAJADO') {
                        <span class="badge badge-ghost badge-sm">No Trabajado</span>
                      }
                      @default {
                        <span class="badge badge-ghost badge-sm">No Trabajado</span>
                      }
                    }
                  </div>
                </div>
                
                <div class="divider my-2"></div>
                
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Fecha:</span>
                    <span class="font-mono">{{ record.date }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Recaudación:</span>
                    <span class="font-semibold">
                      @if (record.recaudacion) {
                        {{ formatCurrency(record.recaudacion) }}
                      } @else {
                        <span class="text-base-content/50">N/A</span>
                      }
                    </span>
                  </div>
                </div>
                
                <div class="mt-3">
                  @if (record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO') {
                    <a 
                      [routerLink]="['/registro-diario']"
                      [queryParams]="{
                        maquina: record.machineId,
                        chofer: record.driver,
                        fecha: record.date,
                        estado: record.status.toLowerCase(),
                        mode: 'edit'
                      }"
                      class="btn btn-primary btn-sm w-full">
                      {{ record.status === 'PENDIENTE_TRABAJADOR' ? 'Resolver' : 'Revisar' }}
                    </a>
                  } @else {
                    <a 
                      [routerLink]="['/registro-diario']"
                      [queryParams]="{
                        maquina: record.machineId,
                        chofer: record.driver,
                        fecha: record.date,
                        estado: record.status.toLowerCase(),
                        mode: 'view'
                      }"
                      class="btn btn-ghost btn-sm w-full hover-scale">
                      Ver detalle
                    </a>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12 animate-fade-in">
              <p class="text-base-content/50">No hay registros que coincidan con los filtros</p>
            </div>
          }
        </div>

        <!-- Vista de Tabla (Desktop - responsive con ajuste de espacio) -->
        <div class="hidden lg:block animate-table-enter">
          <div class="overflow-x-clip -mx-2 pr-1">
            <table class="table table-zebra w-full table-compact table-responsive">
              <thead>
                <tr>
                  <th class="w-[7%] min-w-[45px] text-xs px-1.5 lg:px-2 xl:px-3">Máquina</th>
                  <th class="w-[16%] min-w-[85px] text-xs px-1.5 lg:px-2 xl:px-3">Chofer</th>
                  <th class="w-[12%] min-w-[75px] text-xs px-1.5 lg:px-2 xl:px-3">Fecha</th>
                  <th class="w-[16%] min-w-[95px] text-xs px-1.5 lg:px-2 xl:px-3">Estado</th>
                  <th class="w-[20%] min-w-[100px] text-xs px-1.5 lg:px-2 xl:px-3">Recaudación</th>
                  <th class="w-[18%] min-w-[110px] text-xs px-1.5 lg:px-2 xl:px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords(); track record.machineId + record.date; let i = $index) {
                  <tr 
                    [class.border-l-4]="record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO'"
                    [class.border-warning]="record.status === 'PENDIENTE_TRABAJADOR'"
                    [class.border-error]="record.status === 'INCIDENTE_REPORTADO'"
                    class="hover transition-all duration-200 hover:translate-x-1 animate-table-row-enter"
                    [style.animation-delay.ms]="i * 30"
                    [style.animation-fill-mode]="'both'">
                    <td class="font-bold text-xs lg:text-sm px-1.5 lg:px-2 xl:px-3">
                      <span class="truncate block tooltip" [attr.data-tip]="record.machineId">
                        {{ record.machineId }}
                      </span>
                    </td>
                    <td class="text-xs lg:text-sm px-1.5 lg:px-2 xl:px-3">
                      <span class="truncate block tooltip" [attr.data-tip]="record.driver">
                        {{ record.driver }}
                      </span>
                    </td>
                    <td class="font-mono text-xs px-1.5 lg:px-2 xl:px-3">{{ record.date }}</td>
                    <td class="px-1.5 lg:px-2 xl:px-3">
                      @switch (record.status) {
                        @case ('PENDIENTE_TRABAJADOR') {
                          <span class="badge badge-warning badge-xs animate-card-enter">Pendiente</span>
                        }
                        @case ('INCIDENTE_REPORTADO') {
                          <span class="badge badge-error badge-xs animate-card-enter">Incidente</span>
                        }
                        @case ('COMPLETO') {
                          <span class="badge badge-success badge-xs animate-card-enter">Completo</span>
                        }
                        @case ('NO_TRABAJADO') {
                          <span class="badge badge-ghost badge-xs animate-card-enter">No Trabajado</span>
                        }
                        @case ('DIA_NO_TRABAJADO') {
                          <span class="badge badge-ghost badge-xs animate-card-enter">No Trabajado</span>
                        }
                        @default {
                          <span class="badge badge-ghost badge-xs animate-card-enter">No Trabajado</span>
                        }
                      }
                    </td>
                    <td class="text-xs lg:text-sm px-1.5 lg:px-2 xl:px-3">
                      @if (record.recaudacion) {
                        <span class="font-mono font-semibold">{{ formatCurrency(record.recaudacion) }}</span>
                      } @else {
                        <span class="text-base-content/50">N/A</span>
                      }
                    </td>
                    <td class="px-1.5 lg:px-2 xl:px-3">
                      <div class="flex items-center justify-end gap-1">
                        @if (record.status === 'PENDIENTE_TRABAJADOR') {
                          <a 
                            [routerLink]="['/registro-diario']"
                            [queryParams]="{
                              maquina: record.machineId,
                              chofer: record.driver,
                              fecha: record.date,
                              estado: record.status.toLowerCase(),
                              mode: 'edit'
                            }"
                            class="btn btn-warning btn-xs gap-1.5 whitespace-nowrap transition-all duration-200 hover:scale-105 focus:scale-105"
                            [attr.aria-label]="'Resolver registro pendiente de ' + record.driver">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="14" 
                              height="14" 
                              fill="currentColor" 
                              viewBox="0 0 16 16" 
                              aria-hidden="true">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
                            </svg>
                            Resolver
                          </a>
                        } @else if (record.status === 'INCIDENTE_REPORTADO') {
                          <a 
                            [routerLink]="['/registro-diario']"
                            [queryParams]="{
                              maquina: record.machineId,
                              chofer: record.driver,
                              fecha: record.date,
                              estado: record.status.toLowerCase(),
                              mode: 'edit'
                            }"
                            class="btn btn-error btn-xs gap-1.5 whitespace-nowrap transition-all duration-200 hover:scale-105 focus:scale-105"
                            [attr.aria-label]="'Revisar incidente de ' + record.driver">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="14" 
                              height="14" 
                              fill="currentColor" 
                              viewBox="0 0 16 16" 
                              aria-hidden="true">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                              <path d="m8.93 6.588-2.29.287-.082 38.35.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                            </svg>
                            Revisar
                          </a>
                        } @else {
                          <a 
                            [routerLink]="['/registro-diario']"
                            [queryParams]="{
                              maquina: record.machineId,
                              chofer: record.driver,
                              fecha: record.date,
                              estado: record.status.toLowerCase(),
                              mode: 'view'
                            }"
                            class="btn btn-ghost btn-xs gap-1.5 whitespace-nowrap transition-all duration-200 hover:scale-105 focus:scale-105"
                            [attr.aria-label]="'Ver detalle del registro de ' + record.driver">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="14" 
                              height="14" 
                              fill="currentColor" 
                              viewBox="0 0 16 16" 
                              aria-hidden="true">
                              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                            </svg>
                            Ver detalle
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center py-12 animate-fade-in">
                      <p class="text-base-content/50">No hay registros que coincidan con los filtros</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        
        <p class="text-xs text-base-content/70 mt-6">
          Los registros "PENDIENTE_TRABAJADOR" e "INCIDENTE_REPORTADO" generan alertas en tiempo real (RF-038, RF-039).
        </p>
      </div>
    </div>
  `,
  styles: [
    `
    /* Tabla compacta y responsive para optimizar espacio */
    :host ::ng-deep .table-compact th,
    :host ::ng-deep .table-compact td {
      padding: 0.25rem 0.375rem;
    }
    
    @media (min-width: 1024px) {
      :host ::ng-deep .table-compact th,
      :host ::ng-deep .table-compact td {
        padding: 0.375rem 0.5rem;
      }
    }
    
    @media (min-width: 1280px) {
      :host ::ng-deep .table-compact th,
      :host ::ng-deep .table-compact td {
        padding: 0.5rem 0.75rem;
      }
    }
    
    :host ::ng-deep .table-compact th {
      font-weight: 600;
    }
    
    /* Tabla responsive: distribución homogénea del espacio */
    :host ::ng-deep .table-responsive {
      table-layout: fixed;
    }
    
    /* Prevenir scroll horizontal causado por animaciones de hover */
    :host ::ng-deep .overflow-x-clip {
      overflow-x: clip;
    }
    
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyRecordsTable {
  records = input.required<DailyRecord[]>();
  showOnlyPending = input(false);
  toggleFilter = output<void>();

  summary = computed(() => {
    const recs = this.records();
    return {
      pendientes: recs.filter(r => r.status === 'PENDIENTE_TRABAJADOR').length,
      incidentes: recs.filter(r => r.status === 'INCIDENTE_REPORTADO').length,
      completos: recs.filter(r => r.status === 'COMPLETO').length
    };
  });

  filteredRecords = computed(() => {
    const recs = this.records();
    if (this.showOnlyPending()) {
      return recs.filter(r => 
        r.status === 'PENDIENTE_TRABAJADOR' || r.status === 'INCIDENTE_REPORTADO'
      );
    }
    return recs;
  });

  onToggleFilter(): void {
    this.toggleFilter.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }
}

