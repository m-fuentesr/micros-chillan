import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClosedLiquidation, ClosedLiquidationWeek, LiquidationDriver } from '../../models/accounting.models';
import { AccountingService } from '../../services/accounting.service';
import { SearchFilters, FilterField } from '../../components/search-filters/search-filters';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-liquidation-history',
  standalone: true,
  imports: [CommonModule, SearchFilters, UiIconComponent],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden">
      <!-- Header -->
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
          <div class="flex-1 min-w-0">
            <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
              Historial de Cierres
            </h2>
            <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
              Registro inmutable de liquidaciones.
            </p>
          </div>
          
          <!-- Badge de conteo -->
          <div class="shrink-0">
            <span class="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              {{ totalGlobal() }} {{ totalGlobal() === 1 ? 'período' : 'períodos' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6 pb-32 sm:pb-40 lg:pb-48">
        <!-- Filtros -->
        <div class="mb-6">
          <app-search-filters
            [fields]="filterFields()"
            [filters]="filters()"
            (filterChange)="onFilterChange($event)"
          />
        </div>
        
        <!-- Contenido: Tabla o mensaje de vacío -->
        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <div class="flex flex-col items-center gap-3">
              <span class="loading loading-spinner loading-lg text-primary"></span>
              <span class="text-sm text-base-content/60 font-medium">Cargando períodos...</span>
            </div>
          </div>
        } @else if (liquidations().length > 0) {
          <!-- Vista Desktop: Tabla (solo desde lg: 1024px) -->
          <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
          <table class="table w-full table-fixed">
            <thead class="bg-base-50 border-b border-base-200">
              <tr>
                <th class="pl-6 w-2/5 text-xs font-bold uppercase tracking-widest text-base-content/60">Período</th>
                <th class="w-1/5 text-xs font-bold uppercase tracking-widest text-base-content/60">Fecha Cierre</th>
                <th class="text-left text-xs font-bold uppercase tracking-widest text-base-content/60 pr-12 font-mono tabular-nums">Total</th>
                <th class="w-16"></th>
              </tr>
            </thead>
            <tbody>
              @for (liquidation of liquidations(); track liquidation.id) {
                @let liquidationWithDetails = getLiquidationWithDetails(liquidation.id);
                @let isLoading = isLoadingDetails(liquidation.id);
                <tr 
                  class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none cursor-pointer"
                  [class.bg-base-50]="expandedIds().has(liquidation.id)"
                  (click)="toggleDetail(liquidation.id)">
                  
                  <td class="pl-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </div>
                      <span class="font-bold text-base-content truncate">{{ liquidation.periodo }}</span>
                    </div>
                  </td>
                  <td class="tabular-nums text-sm text-base-content/70">{{ formatDate(liquidation.fecha_cierre) }}</td>
                  <td class="text-left pr-12 font-mono tabular-nums">
                    <span class="font-black text-base-content tabular-nums tracking-tight">{{ formatCurrency(liquidation.total_pagado) }}</span>
                  </td>
                  <td class="pr-6 text-left font-mono tabular-nums">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 text-base-content/40" 
                        [class.rotate-180]="expandedIds().has(liquidation.id)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td colspan="4" class="p-0 border-b border-base-200">
                    <div class="collapse-anim" [class.collapse-expanded]="expandedIds().has(liquidation.id)">
                      <div class="bg-base-200/30 p-6 flex border-l-4 border-base-300 motion-panel"
                           [attr.id]="'history-detail-' + liquidation.id">
                        @if (isLoading) {
                          <div class="w-full flex items-center justify-center py-8">
                            <div class="flex flex-col items-center gap-3">
                              <span class="loading loading-spinner loading-lg text-primary"></span>
                              <span class="text-sm text-base-content/60 font-medium">Cargando detalles...</span>
                            </div>
                          </div>
                        } @else if (liquidationWithDetails) {
                          <ng-container *ngTemplateOutlet="receiptDetail; context: { $implicit: liquidationWithDetails, isMobile: false }"></ng-container>
                        } @else {
                          <ng-container *ngTemplateOutlet="receiptDetail; context: { $implicit: liquidation, isMobile: false }"></ng-container>
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>

          <!-- Vista Móvil y Tablet: Tarjetas (hasta lg: 1024px) -->
          <div class="lg:hidden space-y-4">
            @for (liquidation of liquidations(); track liquidation.id) {
            @let liquidationWithDetails = getLiquidationWithDetails(liquidation.id);
            @let isLoading = isLoadingDetails(liquidation.id);
            <div class="border border-base-200 rounded-xl overflow-hidden shadow-sm bg-base-100"
                 [class.ring-2]="expandedIds().has(liquidation.id)"
                 [class.ring-base-200]="expandedIds().has(liquidation.id)">
              
              <div class="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between cursor-pointer" 
                   (click)="toggleDetail(liquidation.id)">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="bg-base-200/50 p-2.5 rounded-lg text-base-content/60 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div class="truncate">
                    <div class="font-bold text-sm sm:text-base truncate">{{ liquidation.periodo }}</div>
                    <div class="text-[11px] sm:text-xs text-base-content/50">
                      <span>{{ formatDate(liquidation.fecha_cierre) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
                  <div class="font-black text-sm sm:text-base md:text-lg tabular-nums">{{ formatCurrency(liquidation.total_pagado) }}</div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 text-base-content/40" 
                      [class.rotate-180]="expandedIds().has(liquidation.id)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div class="collapse-anim-mobile bg-base-200/30 border-t border-base-200 p-3 motion-panel"
                   [class.collapse-expanded]="expandedIds().has(liquidation.id)"
                   [attr.id]="'history-detail-' + liquidation.id">
                @if (isLoading) {
                  <div class="w-full flex items-center justify-center py-8">
                    <div class="flex flex-col items-center gap-3">
                      <span class="loading loading-spinner loading-lg text-primary"></span>
                      <span class="text-sm text-base-content/60 font-medium">Cargando detalles...</span>
                    </div>
                  </div>
                } @else if (liquidationWithDetails) {
                  <ng-container *ngTemplateOutlet="receiptDetail; context: { $implicit: liquidationWithDetails, isMobile: true }"></ng-container>
                } @else {
                  <ng-container *ngTemplateOutlet="receiptDetail; context: { $implicit: liquidation, isMobile: true }"></ng-container>
                }
              </div>
            </div>
            }
          </div>
        } @else {
          <!-- Mensaje cuando no hay datos -->
          <div class="flex flex-col items-center justify-center py-12">
            <ui-icon name="FileText" size="lg" class="text-base-content/40 mb-4" />
            <h3 class="text-lg font-semibold text-base-content mb-2">No hay períodos disponibles</h3>
            <p class="text-sm text-base-content/70 text-center max-w-md">
              No se encontraron períodos con los filtros aplicados.
            </p>
          </div>
        }

      </div>
    </div>

    <!-- Template Reutilizable: Detalle del Recibo -->
    <ng-template #receiptDetail let-liquidation let-isMobile="isMobile">
      <div class="w-full bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        
        <div class="bg-base-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-base-200 flex justify-between items-center">
          <div class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-base-content/50">Comprobante de Nómina - {{ liquidation.periodo }}</div>
          <button class="btn btn-xs btn-ghost gap-1 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
        </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 py-4 border-b border-base-100">
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Total Liquidado</div>
            <div class="text-base sm:text-lg md:text-xl font-black text-base-content tabular-nums">{{ formatCurrency(liquidation.total_pagado) }}</div>
          </div>
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Choferes</div>
            <div class="text-base sm:text-lg md:text-xl font-bold text-base-content">{{ getChoferesCount(liquidation) }}</div>
          </div>
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Promedio</div>
            <div class="text-base sm:text-lg md:text-xl font-bold text-base-content tabular-nums">{{ formatCurrency(getAveragePayment(liquidation)) }}</div>
          </div>
          <div>
            <div class="text-[10px] sm:text-xs text-base-content/50 uppercase mb-1">Estado</div>
            <div class="badge badge-xs badge-success gap-1 pl-1.5 pr-3 text-white font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2 h-2 sm:w-2.5 sm:h-2.5">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Finalizado
            </div>
          </div>
        </div>

        <!-- Lista de Semanas -->
        <div class="px-4 py-4">
          <div class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-base-content/50 mb-3">Desglose por Semanas</div>
          
          <div class="weeks-container space-y-3">
            @for (week of liquidation.semanas || []; track week.semana) {
              <div class="border border-base-200 rounded-lg overflow-hidden bg-base-50/30">
              <!-- Header de Semana -->
              <div 
                class="p-3 flex justify-between items-center cursor-pointer hover:bg-base-100/50 transition-colors"
                (click)="toggleWeek(liquidation.id, week.semana)">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 p-1.5 rounded text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-base-content">Semana {{ week.semana }}</span>
                      @if (week.es_ultima_semana) {
                        <span class="badge badge-xs badge-warning text-white">Última</span>
                      }
                    </div>
                    <div class="text-xs text-base-content/50">{{ formatDateRange(week.fecha_inicio, week.fecha_fin) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <div class="text-xs text-base-content/50">Total</div>
                    <div class="font-bold tabular-nums">{{ formatCurrency(week.total_pagado) }}</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-300 text-base-content/40" 
                      [class.rotate-180]="isWeekExpanded(liquidation.id, week.semana)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Detalle de Choferes (expandible) -->
              @if (isWeekExpanded(liquidation.id, week.semana)) {
                <div class="border-t border-base-200 bg-base-100">
                  @if (!isMobile) {
                    <!-- Vista Desktop: Tabla de Choferes -->
                    <table class="table table-sm w-full">
                      <thead class="text-base-content/40 border-b border-base-100 bg-base-50">
                        <tr>
                          <th class="pl-6 font-normal">Beneficiario</th>
                          <th class="text-left font-bold font-mono tabular-nums">Base</th>
                          <th class="text-left font-bold font-mono tabular-nums">Ajuste</th>
                          <th class="text-right font-normal">Total</th>
                          <th class="pl-8 font-normal">Método</th>
                          <th class="font-normal">Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (chofer of week.choferes; track chofer.chofer_id) {
                          <tr class="hover:bg-base-50/50">
                            <td class="pl-6 font-medium py-2.5">{{ chofer.chofer_nombre }}</td>
                            <td class="text-right tabular-nums text-xs text-base-content/60">{{ formatCurrency(chofer.total_ganado) }}</td>
                            <td class="text-right tabular-nums text-xs" 
                                [class.text-primary]="chofer.monto_a_completar > 0"
                                [class.text-base-content/60]="chofer.monto_a_completar === 0">
                              {{ formatCurrency(chofer.pago_final - chofer.total_ganado) }}
                            </td>
                            <td class="text-right tabular-nums text-sm font-bold text-base-content">{{ formatCurrency(chofer.pago_final) }}</td>
                            <td class="pl-8">
                              <div class="badge badge-xs badge-ghost uppercase">{{ chofer.metodo_pago || '—' }}</div>
                            </td>
                            <td class="font-mono text-[10px] text-base-content/50">{{ chofer.codigo_transferencia || '—' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  } @else {
                    <!-- Vista Móvil: Lista Vertical de Choferes -->
                    <div class="p-3 space-y-0">
                      @for (chofer of week.choferes; track chofer.chofer_id) {
                        <div class="p-3 border-b border-base-300 last:border-b-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div class="min-w-0">
                            <div class="font-bold text-sm">{{ chofer.chofer_nombre }}</div>
                            <div class="text-[10px] text-base-content/50 mt-1 flex flex-wrap gap-1.5 items-center">
                              <span class="uppercase badge badge-ghost badge-xxs sm:badge-xs">{{ chofer.metodo_pago || '—' }}</span>
                              <span class="font-mono truncate max-w-[160px] sm:max-w-[200px]">{{ chofer.codigo_transferencia || '—' }}</span>
                            </div>
                          </div>
                          <div class="text-left sm:text-right">
                            <div class="font-bold text-sm sm:text-base tabular-nums">{{ formatCurrency(chofer.pago_final) }}</div>
                            <div class="text-[10px] text-base-content/50">Base: {{ formatCurrency(chofer.total_ganado) }}</div>
                            @if (chofer.monto_a_completar > 0) {
                              <div class="text-[10px] text-primary">Ajuste: {{ formatCurrency(chofer.monto_a_completar) }}</div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
              </div>
            }
          </div>
        </div>
        
        <div class="bg-base-50/50 p-3 text-center border-t border-base-100 text-[10px] text-base-content/40 uppercase tracking-widest">
          Cerrado por: {{ liquidation.cerrado_por }}
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    /* Micro-animación optimizada para paneles de detalle de historial */
    @keyframes motionFadeInUp {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .motion-panel {
      animation: motionFadeInUp 260ms cubic-bezier(0.25, 1, 0.5, 1) both;
      will-change: transform, opacity;
      transform-origin: top;
    }

    /* Animación de crecimiento/colapso de contenedor (altura) */
    .collapse-anim,
    .collapse-anim-mobile {
      max-height: 0;
      overflow: hidden;
      transition: max-height 800ms cubic-bezier(0.22, 0.8, 0.35, 1);
    }

    .collapse-anim.collapse-expanded,
    .collapse-anim-mobile.collapse-expanded {
      max-height: 9999px; /* permitir que crezca sin recortar contenido */
    }
    
    /* Scroll interno para el contenedor de semanas solo cuando sea necesario */
    .weeks-container {
      overflow-x: hidden;
      overflow-y: visible;
    }
    
    .weeks-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .weeks-container::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .weeks-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    
    .weeks-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    @media (prefers-reduced-motion: reduce) {
      .motion-panel {
        animation: none;
        transform: none;
      }
      .collapse-anim,
      .collapse-anim-mobile {
        transition: none;
        max-height: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiquidationHistory {
  liquidations = input.required<ClosedLiquidation[]>();
  totalGlobal = input<number>(0);
  isLoading = input<boolean>(false);
  filters = input<{ fecha_desde?: string | null; fecha_hasta?: string | null }>({});
  filterChange = output<Record<string, any>>();
  private accountingService = inject(AccountingService);
  
  filterFields = computed<FilterField[]>(() => [
    { key: 'fecha_desde', label: 'Mes Desde', type: 'date', monthOnly: true },
    { key: 'fecha_hasta', label: 'Mes Hasta', type: 'date', monthOnly: true }
  ]);
  
  onFilterChange(filters: Record<string, any>): void {
    this.filterChange.emit(filters);
  }
  
  /**
   * Cache de detalles cargados para evitar recargas innecesarias
   */
  private loadedDetails = signal<Map<number, ClosedLiquidation>>(new Map());
  
  /**
   * Estados de carga por período
   */
  private loadingDetails = signal<Set<number>>(new Set());
  
  /**
   * Permite múltiples períodos abiertos en paralelo para comparar cierres.
   */
  expandedIds = signal<Set<number>>(new Set());
  /**
   * Permite múltiples semanas expandidas dentro de un mes.
   * Key: "liquidationId-weekNumber"
   */
  expandedWeeks = signal<Set<string>>(new Set());

  /**
   * Obtiene la liquidación con detalles cargados
   */
  getLiquidationWithDetails(id: number): ClosedLiquidation | null {
    const loaded = this.loadedDetails().get(id);
    if (loaded) return loaded;
    
    // Buscar en la lista original
    return this.liquidations().find(l => l.id === id) || null;
  }

  /**
   * Verifica si un período está cargando detalles
   */
  isLoadingDetails(id: number): boolean {
    return this.loadingDetails().has(id);
  }

  toggleDetail(id: number): void {
    const current = this.expandedIds();
    const isExpanded = current.has(id);

    const next = new Set(current);
    if (isExpanded) {
      next.delete(id);
    } else {
      next.add(id);
      // Cargar detalles si no están cargados
      this.loadDetailsIfNeeded(id);
    }

    this.expandedIds.set(next);
  }

  /**
   * Carga los detalles del mes si no están en caché
   */
  private loadDetailsIfNeeded(id: number): void {
    // Verificar si ya está cargado
    if (this.loadedDetails().has(id)) {
      return;
    }

    // Verificar si ya está cargando
    if (this.loadingDetails().has(id)) {
      return;
    }

    // Buscar el período en la lista
    const liquidation = this.liquidations().find(l => l.id === id);
    if (!liquidation) {
      return;
    }

    // Si ya tiene semanas cargadas, no necesita recargar
    if (liquidation.semanas && liquidation.semanas.length > 0) {
      return;
    }

    // Marcar como cargando
    this.loadingDetails.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });

    // Cargar detalles del mes
    this.accountingService.getLiquidationMonthDetail(liquidation.mes, liquidation.anio)
      .subscribe({
        next: (detail: ClosedLiquidation) => {
          // Guardar en caché
          this.loadedDetails.update(map => {
            const newMap = new Map(map);
            newMap.set(id, detail);
            return newMap;
          });

          // Remover de loading
          this.loadingDetails.update(set => {
            const newSet = new Set(set);
            newSet.delete(id);
            return newSet;
          });
        },
        error: (error) => {
          console.error('Error cargando detalles del período:', error);
          // Remover de loading
          this.loadingDetails.update(set => {
            const newSet = new Set(set);
            newSet.delete(id);
            return newSet;
          });
        }
      });
  }

  toggleWeek(liquidationId: number, weekNumber: number): void {
    const key = `${liquidationId}-${weekNumber}`;
    const current = this.expandedWeeks();
    const isExpanded = current.has(key);

    const next = new Set(current);
    if (isExpanded) {
      next.delete(key);
    } else {
      next.add(key);
    }

    this.expandedWeeks.set(next);
  }

  isWeekExpanded(liquidationId: number, weekNumber: number): boolean {
    return this.expandedWeeks().has(`${liquidationId}-${weekNumber}`);
  }

  formatDateRange(start: string, end: string): string {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startStr = startDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      const endStr = endDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } catch {
      return `${start} - ${end}`;
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getChoferesCount(liquidation: ClosedLiquidation): number {
    // Contar choferes únicos de todas las semanas
    if (liquidation.semanas && liquidation.semanas.length > 0) {
      const choferIds = new Set<number>();
      liquidation.semanas.forEach(week => {
        if (week.choferes) {
          week.choferes.forEach(chofer => {
            choferIds.add(chofer.chofer_id);
          });
        }
      });
      return choferIds.size;
    }
    // Fallback a choferes legacy
    return liquidation.choferes?.length || 0;
  }

  getChoferes(liquidation: ClosedLiquidation): LiquidationDriver[] {
    // Retornar choferes consolidados de todas las semanas
    if (liquidation.semanas && liquidation.semanas.length > 0) {
      const choferMap = new Map<number, LiquidationDriver>();
      liquidation.semanas.forEach(week => {
        if (week.choferes) {
          week.choferes.forEach(chofer => {
            // Si el chofer ya existe, sumar los pagos
            if (choferMap.has(chofer.chofer_id)) {
              const existing = choferMap.get(chofer.chofer_id)!;
              existing.total_ganado += chofer.total_ganado;
              existing.pago_final += chofer.pago_final;
            } else {
              choferMap.set(chofer.chofer_id, { ...chofer });
            }
          });
        }
      });
      return Array.from(choferMap.values());
    }
    // Fallback a choferes legacy
    return liquidation.choferes || [];
  }

  getAveragePayment(liquidation: ClosedLiquidation): number {
    const choferes = this.getChoferes(liquidation);
    if (choferes.length === 0) return 0;
    return liquidation.total_pagado / choferes.length;
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
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return date;
    }
  }
}
