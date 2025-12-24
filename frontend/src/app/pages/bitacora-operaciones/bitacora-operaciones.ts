import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect, DestroyRef, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, firstValueFrom } from 'rxjs';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import { DriverService } from '../../shared/services/driver.service';
import { StorageService } from '../../shared/services/storage.service';
import type { DailyRecord as UnifiedDailyRecord, DailyRecordStatus, DailyRecordFilters, CreateDailyRecordAdminDto } from '../../shared/models/daily-record.models';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { LoadingOverlay } from '../../shared/components/loading-overlay/loading-overlay';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { SearchFilters, FilterField } from '../../shared/components/search-filters/search-filters';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { NewRecordModalService } from '../../shared/services/new-record-modal.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';
import { GlobalErrorService } from '../../shared/services/global-error.service';
import { KpiCard } from '../../shared/components/kpi-card/kpi-card';

/**
 * Vista simplificada de DailyRecord para uso en Bitácora de Operaciones
 * Compatible con el template actual. Se mapeará desde el modelo unificado cuando se integre el servicio.
 */
interface DailyRecordView {
  id: string;
  date: string; // Formateado para display
  machine: string; // maquina_identificador o derivado
  driver: string; // chofer_nombre
  status: 'complete' | 'pending' | 'incident' | 'no_worked'; // Mapeo de DailyRecordStatus
  income: number; // recaudado
  dieselExpense: number; // costo_diesel
  hasIncident: boolean; // es_emergencia o estado === 'INCIDENTE_REPORTADO'
}

@Component({
  selector: 'app-bitacora-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LoadingSkeleton, LoadingSpinner, SearchFilters, UiIconComponent, KpiCard],
  template: `
    <div class="space-y-6 relative">
        <!-- Hero Section Premium - Siempre visible primero -->
        <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 flex-1 min-w-0">
              <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
                Registros Diarios
              </h1>
              <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
                Gestión y auditoría centralizada de todos los reportes operativos diarios.
              </p>
            </div>
            <button 
              (click)="openNewRecordModal()"
              class="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-primary-content px-4 py-2.5 rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-sm font-medium shrink-0">
              <ui-icon name="CirclePlus" size="md" />
              Nuevo Registro
            </button>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          @if (kpisLoading() && !sequentialState.kpisError()) {
            @for (i of [1,2,3]; track i) {
              <!-- 🎭 GhostWire Skeleton: KpiCard default - Replica exacta del componente real -->
              <div class="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] skeleton-entering gap-3 md:gap-4 p-4 md:p-5 min-h-[150px] md:min-h-[170px]"
                   [style.animation-delay.ms]="i * 50">
                
                <!-- Header: Icon + Title - Mismas clases exactas del componente default -->
                <div class="relative flex items-center gap-3">
                  <!-- Icono: h-10 w-10 para default -->
                  <div class="skeleton-shimmer rounded-xl shrink-0 ring-1 ring-base-200 h-10 w-10"></div>
                  <div class="flex-1 min-w-0">
                    <!-- Título: text-xs (12px) para default -->
                    <div class="skeleton-shimmer h-3 w-40 rounded"></div>
                    <!-- Subtítulo: text-[10px] para default -->
                    <div class="skeleton-shimmer h-2.5 w-32 rounded mt-0.5"></div>
                  </div>
                </div>
                
                <!-- Body: Value - Mismas clases exactas del componente default -->
                <div class="relative flex flex-col">
                  <!-- Valor: text-base sm:text-lg md:text-xl lg:text-2xl pl-[52px] para default -->
                  <div class="skeleton-shimmer rounded leading-tight h-6 sm:h-7 md:h-8 lg:h-9 pl-[52px] w-32 sm:w-36 md:w-40 lg:w-44"></div>
                  
                  <!-- Footer: Badge - Mismas clases exactas del componente default -->
                  <div class="flex items-center mt-2 min-h-[24px] pl-[52px]">
                    <!-- Badge: text-[10px] para default -->
                    <div class="skeleton-shimmer rounded-full h-2.5 w-24 sm:w-28"></div>
                  </div>
                </div>
              </div>
            }
          } @else {
            <div 
              class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 col-span-full"
              [class.opacity-0]="!sequentialState.canShowKPIs()" 
              [class.animate-fade-in]="sequentialState.canShowKPIs()" 
              [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
              [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <!-- Card 1: Recaudación (Periodo) -->
            <app-kpi-card
              title="Recaudación (Periodo)"
              [subtitle]="'Total del período'"
              [value]="formatCurrency(totalRevenue())"
              type="financial"
              [badgeText]="currentMonthName()"
              [animationDelay]="0">
              <ui-icon name="Wallet" size="md" icon />
            </app-kpi-card>

            <!-- Card 2: Registros Faltantes -->
            <app-kpi-card
              title="Registros Faltantes"
              [subtitle]="'Pendientes de completar'"
              [value]="missingRecords().toString()"
              type="warning"
              [successText]="missingRecords() === 0 ? 'Bitácora al día' : ''"
              [badgeText]="missingRecords() === 0 ? '' : 'Pendientes de completar'"
              [animationDelay]="1">
              <ui-icon name="AlertCircle" size="md" icon />
            </app-kpi-card>

            <!-- Card 3: Con Incidentes -->
            <app-kpi-card
              title="Con Incidentes"
              [subtitle]="'Requieren atención'"
              [value]="recordsWithIncidents().toString()"
              type="danger"
              [successText]="recordsWithIncidents() === 0 ? 'Operación normal' : ''"
              [actionText]="recordsWithIncidents() === 0 ? '' : 'Requieren gestión'"
              [animationDelay]="2">
              <ui-icon name="TriangleAlert" size="md" icon />
            </app-kpi-card>
            </div>
          }
        </div>

        <!-- Filtros y Búsqueda -->
        @if (!sequentialState.canShowContent() && !sequentialState.contentError()) {
          <!-- Skeleton personalizado del Card con Header y Filtros -->
          <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
            <!-- Skeleton del Card Header -->
            <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-primary border-l-4 border-l-primary"></div>
                    <div class="h-8 sm:h-10 lg:h-12 w-48 skeleton-shimmer rounded"></div>
                  </div>
                  <div class="h-4 w-96 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-8 w-32 skeleton-shimmer rounded-full"></div>
              </div>
            </div>

            <!-- Skeleton del Card Body con Filtros -->
            <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
              <!-- Skeleton: Header de Filtros -->
              <div class="bg-base-50/50 p-5 sm:p-6 rounded-3xl border border-base-200/50 mb-6">
                <div class="flex items-center justify-between gap-4 mb-5">
                  <div class="flex items-center gap-2">
                    <div class="w-1 h-4 rounded-full bg-primary"></div>
                    <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                  </div>
                </div>

                <!-- Skeleton: Grid de Filtros (4 columnas en desktop) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- Skeleton: Filtro Chofer -->
                  <div class="form-control">
                    <div class="label py-1.5">
                      <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="h-12 w-full skeleton-shimmer rounded-lg"></div>
                  </div>
                  
                  <!-- Skeleton: Filtro Desde -->
                  <div class="form-control">
                    <div class="label py-1.5">
                      <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="h-12 w-full skeleton-shimmer rounded-lg"></div>
                  </div>
                  
                  <!-- Skeleton: Filtro Hasta -->
                  <div class="form-control">
                    <div class="label py-1.5">
                      <div class="h-3 w-20 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="h-12 w-full skeleton-shimmer rounded-lg"></div>
                  </div>
                  
                  <!-- Skeleton: Filtro Orden -->
                  <div class="form-control">
                    <div class="label py-1.5">
                      <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                    </div>
                    <div class="h-12 w-full skeleton-shimmer rounded-lg"></div>
                  </div>
                </div>
              </div>

              <!-- Skeleton: Tabla -->
              <app-loading-skeleton type="table" [count]="10" />
            </div>
          </div>
        } @else {
          <!-- Solo renderizar el contenido cuando canShowContent es true -->
          @if (sequentialState.canShowContent()) {
            <div 
              class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up"
              [class.animate-fade-in]="sequentialState.canShowContent()" 
              [style.transition]="sequentialState.canShowContent() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
              [style.transform]="sequentialState.canShowContent() ? 'translateY(0)' : 'translateY(12px)'"
              [style.opacity]="sequentialState.canShowContent() ? '1' : '0'">
            <!-- Header -->
            <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex-1 min-w-0">
                  <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
                    Registros Diarios
                  </h2>
                  <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
                    Gestión y auditoría centralizada de todos los reportes operativos diarios.
                  </p>
                </div>
                
                <!-- Badge de conteo mejorado -->
                <div class="flex items-center gap-3 shrink-0">
                  <span class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
                    <span class="w-2 h-2 rounded-full bg-primary"></span>
                    {{ totalRecords() }} {{ totalRecords() === 1 ? 'registro' : 'registros' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
              <!-- Filtros: mobile en panel plegable, desktop siempre visible -->
              <div class="md:hidden mb-4">
                <div class="sticky top-2 z-20">
                  <button
                    type="button"
                    class="btn btn-sm w-full justify-between rounded-lg border border-base-200 bg-base-100 shadow-sm min-h-[44px]"
                    (click)="toggleFiltersMobile()"
                    [attr.aria-expanded]="showFiltersMobile()">
                    <div class="flex items-center gap-2">
                      <span class="w-1 h-4 rounded-full bg-primary"></span>
                      <span class="text-xs font-semibold uppercase tracking-wider">Filtros</span>
                    </div>
                    <ui-icon name="ChevronDown" size="sm" [class]="'transition-transform duration-200' + (showFiltersMobile() ? ' rotate-180' : '')" />
                  </button>
                </div>
                @if (showFiltersMobile()) {
                  <div class="mt-3 bg-base-50/70 rounded-3xl border border-base-200/70 shadow-sm" (click)="$event.stopPropagation()">
                    <app-search-filters
                      [fields]="filterFields()"
                      [filters]="recordFilters()"
                      [columns]="1"
                      (filterChange)="onRecordFilterChange($event)" />
                    <!-- Botón para cerrar el panel manualmente -->
                    <div class="p-4 pt-0 border-t border-base-200/50">
                      <button
                        type="button"
                        class="btn btn-sm btn-primary w-full"
                        (click)="toggleFiltersMobile()">
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                }
              </div>

              <div class="hidden md:block">
                <app-search-filters
                  [fields]="filterFields()"
                  [filters]="recordFilters()"
                  [columns]="4"
                  (filterChange)="onRecordFilterChange($event)" />
              </div>

              <!-- Vista Desktop: Tabla Completa (≥ 1024px) con scroll horizontal seguro -->
              <div class="hidden lg:block overflow-x-auto rounded-3xl border border-base-200">
                @if (isLoadingPage()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando registros..." />
                  </div>
                } @else if (isLoading() && paginatedRecords().length === 0 && !sequentialState.contentError()) {
                  <app-loading-skeleton type="table" [count]="10" />
                } @else {
                  <table class="table w-full table-min-height min-w-[960px]">
                    <thead class="bg-base-50 border-b border-base-200">
                      <tr>
                        <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[180px]">Conductor</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[110px]">Recaudado</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[110px] hidden xl:table-cell">Diésel</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[110px] hidden xl:table-cell">Neto</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[90px] hidden xl:table-cell">OBS.</th>
                        <th class="py-4 pr-4 lg:pr-6 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[96px] lg:min-w-[120px] whitespace-normal leading-4">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (record of paginatedRecords(); track record.id; let i = $index) {
                        <tr 
                          class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter cursor-pointer"
                          [style.animation-delay.ms]="i * 30"
                          [style.animation-fill-mode]="'both'"
                          (click)="onViewRecordDetail(record)">
                          <td class="pl-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <ui-icon name="Calendar" size="sm" />
                              </div>
                              <div>
                                <div class="font-bold text-base-content">{{ record.date }}</div>
                                <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.date) }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 text-center">
                            <div class="flex flex-col items-center gap-2">
                              <ui-icon name="IdCard" size="md" class="text-primary" />
                              <div class="font-bold text-base-content truncate max-w-[150px] tooltip" [attr.data-tip]="record.driver">
                                {{ record.driver }}
                              </div>
                              <div class="text-xs text-base-content/50 truncate max-w-[150px] tooltip" [attr.data-tip]="record.machine">
                                {{ record.machine }}
                              </div>
                            </div>
                          </td>
                          <td class="text-right py-4 font-mono font-bold text-success tabular-nums text-sm">
                            {{ formatCurrency(record.income) }}
                          </td>
                          <td class="text-right py-4 font-mono font-bold text-error tabular-nums text-sm hidden xl:table-cell">
                            {{ record.dieselExpense > 0 ? formatCurrency(record.dieselExpense) : '-' }}
                          </td>
                          <td class="text-right py-4 font-mono font-bold text-base-content tabular-nums text-sm hidden xl:table-cell">
                            {{ formatCurrency(record.income - record.dieselExpense) }}
                          </td>
                          <td class="text-center py-4">
                            @if (record.status === 'complete') {
                              <div class="badge badge-sm gap-1"
                                [class.badge-success]="record.status === 'complete'">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Completo
                              </div>
                            } @else if (record.status === 'incident') {
                              <div class="badge badge-sm gap-1 badge-error">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Incidente
                              </div>
                            } @else if (record.status === 'no_worked') {
                              <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-300/40 text-base-content/70 border border-base-300/60 shadow-sm">
                                <ui-icon name="Ban" size="xs" class="mr-1.5" />
                                No Trabajado
                              </div>
                            } @else {
                              <div class="badge badge-sm gap-1 badge-warning">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Pendiente
                              </div>
                            }
                          </td>
                          <td class="text-center py-4 hidden xl:table-cell" (click)="$event.stopPropagation()">
                            <div class="flex items-center justify-center">
                              @if (record.hasIncident) {
                                <div class="tooltip tooltip-top" data-tip="Tiene observaciones">
                                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer group">
                                    <ui-icon name="Info" size="sm" class="text-primary group-hover:scale-110 transition-transform" />
                                  </div>
                                </div>
                              } @else {
                                <div class="w-8 h-8 rounded-full bg-base-200/50 flex items-center justify-center border border-base-200">
                                  <ui-icon name="Info" size="sm" class="text-base-content/30" />
                                </div>
                              }
                            </div>
                          </td>
                          <td class="pr-4 lg:pr-6 text-right py-4" (click)="$event.stopPropagation()">
                            <a 
                              [routerLink]="['/registro-diario', record.id]"
                              class="btn btn-xs h-8 px-2 lg:px-3 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1 lg:gap-1.5 font-normal justify-center min-w-[44px]">
                              <ui-icon name="Eye" size="sm" />
                              <span class="hidden lg:inline">Ver</span>
                            </a>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="8" class="py-16 sm:py-20">
                            <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                                <ui-icon name="Calendar" size="xl" class="text-base-content/40" />
                              </div>
                              <div class="space-y-2">
                                <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay registros que coincidan con los filtros</h3>
                                <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                                  Ajusta los filtros para ver más resultados.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>

          <!-- Vista Tablet: Tabla Simplificada (768px - 1023px) -->
          <div class="hidden md:block lg:hidden overflow-x-auto -mx-4 px-4">
            <div class="min-w-[800px]">
              <div class="overflow-hidden rounded-3xl border border-base-200">
                @if (isLoadingPage()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando registros..." />
                  </div>
                } @else if (isLoading() && paginatedRecords().length === 0 && !sequentialState.contentError()) {
                  <app-loading-skeleton type="table" [count]="10" />
                } @else {
                  <table class="table w-full table-min-height">
                    <thead class="bg-base-50 border-b border-base-200">
                      <tr>
                        <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[200px]">Conductor</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Recaudado</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                        <th class="py-4 pr-6 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (record of paginatedRecords(); track record.id; let i = $index) {
                        <tr 
                          class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter cursor-pointer"
                          [style.animation-delay.ms]="i * 30"
                          [style.animation-fill-mode]="'both'"
                          (click)="onViewRecordDetail(record)">
                          <td class="pl-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <ui-icon name="Calendar" size="sm" />
                              </div>
                              <div>
                                <div class="font-bold text-base-content">{{ record.date }}</div>
                                <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.date) }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 text-center">
                            <div class="flex flex-col items-center gap-2">
                              <ui-icon name="IdCard" size="md" class="text-primary" />
                              <div class="font-bold text-base-content truncate max-w-[150px] tooltip" [attr.data-tip]="record.driver">
                                {{ record.driver }}
                              </div>
                              <div class="text-xs text-base-content/50 truncate max-w-[150px] tooltip" [attr.data-tip]="record.machine">
                                {{ record.machine }}
                              </div>
                            </div>
                          </td>
                          <td class="text-right py-4 font-mono font-bold text-success tabular-nums text-sm">
                            {{ formatCurrency(record.income) }}
                          </td>
                          <td class="text-center py-4">
                            @if (record.status === 'complete') {
                              <div class="badge badge-sm gap-1"
                                [class.badge-success]="record.status === 'complete'">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Completo
                              </div>
                            } @else if (record.status === 'incident') {
                              <div class="badge badge-sm gap-1 badge-error">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Incidente
                              </div>
                            } @else if (record.status === 'no_worked') {
                              <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-300/40 text-base-content/70 border border-base-300/60 shadow-sm">
                                <ui-icon name="Ban" size="xs" class="mr-1.5" />
                                No Trabajado
                              </div>
                            } @else {
                              <div class="badge badge-sm gap-1 badge-warning">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                Pendiente
                              </div>
                            }
                          </td>
                          <td class="pr-6 text-right py-4" (click)="$event.stopPropagation()">
                            <a 
                              [routerLink]="['/registro-diario', record.id]"
                              class="btn btn-xs h-8 px-2 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1 font-normal">
                              <ui-icon name="Eye" size="sm" />
                              <span>Ver</span>
                            </a>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="py-16 sm:py-20">
                            <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                                <ui-icon name="Calendar" size="xl" class="text-base-content/40" />
                              </div>
                              <div class="space-y-2">
                                <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay registros que coincidan con los filtros</h3>
                                <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                                  Ajusta los filtros para ver más resultados.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </div>
          </div>

          <!-- Cards Mobile (< 768px) -->
          <div class="md:hidden space-y-4 p-4">
            @if (isLoadingPage()) {
              <div class="flex justify-start items-center py-12 pl-4 border-l-4 border-l-primary">
                <app-loading-spinner size="md" text="Cargando registros..." />
              </div>
            } @else if (isLoading() && paginatedRecords().length === 0 && !sequentialState.contentError()) {
              @for (i of [1,2,3,4,5]; track i) {
                <app-loading-skeleton type="card" />
              }
            } @else {
              @for (record of paginatedRecords(); track record.id) {
              <div 
                class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
                [class.border-l-4]="record.status === 'incident' || record.status === 'pending'"
                [class.border-l-error]="record.status === 'incident'"
                [class.border-l-warning]="record.status === 'pending'"
                [class.bg-error/5]="record.status === 'incident'"
                [class.bg-warning/5]="record.status === 'pending'"
                [class.bg-base-200/30]="record.status === 'no_worked'">
                <div class="card-body p-5">
                  <!-- Header: Avatares y Estado -->
                  <div class="flex items-start gap-4 mb-4">
                    <!-- Avatar Máquina -->
                    <div class="avatar placeholder shrink-0">
                      <div 
                        class="rounded-lg w-12 h-12 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center p-2"
                        [class.bg-error/10]="record.status === 'incident'"
                        [class.border]="record.status === 'incident'"
                        [class.border-error/20]="record.status === 'incident'"
                        [class.bg-gradient-to-br]="record.status !== 'incident'"
                        [class.from-primary/20]="record.status !== 'incident'"
                        [class.to-primary/10]="record.status !== 'incident'">
                        <ui-icon 
                          name="BusFront" 
                          size="lg" 
                          [class]="record.status === 'incident' ? 'text-error' : 'text-primary'" />
                      </div>
                    </div>

                    <!-- Información Principal -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-base text-base-content truncate tooltip" [attr.data-tip]="record.machine">
                            {{ record.machine }}
                          </h3>
                          <div class="flex items-center gap-2 mt-1.5">
                            <div class="avatar placeholder shrink-0">
                              <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-6 h-6 rounded-full text-primary flex items-center justify-center border border-base-200 p-0.5">
                                <ui-icon name="IdCard" size="sm" />
                              </div>
                            </div>
                            <span class="text-sm text-base-content/70 truncate tooltip" [attr.data-tip]="record.driver">
                              {{ record.driver }}
                            </span>
                          </div>
                        </div>
                        
                        <!-- Badge Estado -->
                        <div class="shrink-0">
                          @if (record.status === 'complete') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/10">
                              Completo
                            </div>
                          } @else if (record.status === 'incident') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/10">
                              <ui-icon name="OctagonAlert" size="xs" class="mr-1" />
                              Incidente
                            </div>
                          } @else if (record.status === 'no_worked') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-300/40 text-base-content/70 border border-base-300/60 shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 mr-1.5">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                              </svg>
                              No Trabajado
                            </div>
                          } @else {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/10">
                              <span class="w-1.5 h-1.5 rounded-full bg-warning mr-1.5 animate-pulse"></span>
                              Pendiente
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Divider -->
                  <div class="divider my-3 opacity-30"></div>
                  
                  <!-- Información Financiera y Fecha -->
                  <div class="grid grid-cols-1 min-[380px]:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Fecha</div>
                      <div class="font-mono text-sm text-base-content/80">{{ record.date }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Ingreso</div>
                      <div class="font-mono font-black text-base-content tabular-nums text-sm">
                        {{ record.income | currency:'CLP':'symbol':'1.0-0' }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="mb-4">
                    <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Gasto Diésel</div>
                    <div class="font-mono tabular-nums text-sm" [class.text-error/80]="record.dieselExpense > 0" [class.text-base-content/30]="record.dieselExpense === 0">
                      {{ record.dieselExpense > 0 ? (record.dieselExpense | currency:'CLP':'symbol':'1.0-0') : '-' }}
                    </div>
                  </div>
                  
                  <!-- Botón de Acción -->
                  <div class="mt-2">
                    <a 
                      [routerLink]="['/registro-diario', record.id]"
                      class="btn btn-sm h-11 min-h-[44px] w-full rounded-lg btn-ghost text-base-content/70 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1.5 font-medium"
                      [attr.aria-label]="'Ver detalle del registro de ' + record.driver">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                      </svg>
                      Ver detalle
                    </a>
                  </div>
                </div>
              </div>
              }
            }
          </div>

              <!-- Paginación -->
              <div class="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
                <span>Mostrando {{ startRecord() }}-{{ endRecord() }} de {{ totalRecords() }} registros</span>
                <div class="join">
                  <button (click)="goToPreviousPage()" [disabled]="currentPage() === 1 || isLoadingPage()" class="join-item btn btn-sm px-3" [class.btn-disabled]="currentPage() === 1 || isLoadingPage()">
                    @if (isLoadingPage()) {
                      <app-loading-spinner size="xs" />
                    } @else {
                      «
                    }
                  </button>
                  @for (page of pages(); track page) {
                    <button (click)="goToPage(page)" [disabled]="isLoadingPage()" [class.btn-active]="page === currentPage()" class="join-item btn btn-sm px-4">{{ page }}</button>
                  }
                  <button (click)="goToNextPage()" [disabled]="currentPage() === totalPages() || isLoadingPage()" class="join-item btn btn-sm px-3" [class.btn-disabled]="currentPage() === totalPages() || isLoadingPage()">
                    @if (isLoadingPage()) {
                      <app-loading-spinner size="xs" />
                    } @else {
                      »
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
          }
        }

      <!-- Modal Nuevo Registro (renderizado de forma global en app.ts) -->
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in {
      animation: fade-in 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    
    @keyframes skeletonFadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
    
    .skeleton-entering {
      animation: skeletonFadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BitacoraOperaciones implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dailyRecordService = inject(DailyRecordService);
  private alertModalService = inject(AlertModalService);
  private driverService = inject(DriverService);
  private destroyRef = inject(DestroyRef);
  private loadingStateService = inject(LoadingStateService);
  private newRecordModalService = inject(NewRecordModalService);
  private storageService = inject(StorageService);
  private globalErrorService = inject(GlobalErrorService);

  // Cargar datos del servicio con paginación real
  private recordsResponse = signal<{ datos: UnifiedDailyRecord[]; total: number; pagina: number; por_pagina: number; total_paginas: number }>({
    datos: [],
    total: 0,
    pagina: 1,
    por_pagina: 20,
    total_paginas: 0
  });

  // Mapear a formato de vista
  records = computed(() => {
    const response = this.recordsResponse();
    return response.datos.map(r => this.mapToView(r));
  });
  
  // Paginación desde el backend
  totalRecords = computed(() => this.recordsResponse().total);
  totalPages = computed(() => this.recordsResponse().total_paginas);
  currentPageSize = computed(() => this.recordsResponse().por_pagina);

  // KPIs del servicio
  private kpisResponse = toSignal(
    this.dailyRecordService.getDailyRecordsKPIs().pipe(
      catchError((error) => {
        console.error('Error cargando KPIs:', error);
        // Mostrar error global en lugar de error local
        this.globalErrorService.showError(
          'No se pudieron cargar los datos desde el servidor.',
          'Error al cargar registros diarios'
        );
        this.sequentialState.setKPIsReady(true); // Marcar error
        setTimeout(() => {
          this.kpisLoading.set(false);
        }, 100);
        return of(null);
      })
    ),
    { initialValue: null }
  );

  totalRevenue = computed(() => this.kpisResponse()?.recaudacion_periodo || 0);
  missingRecords = computed(() => this.kpisResponse()?.registros_faltantes || 0);
  recordsWithIncidents = computed(() => this.kpisResponse()?.registros_con_incidentes || 0);
  
  // Nombre del mes actual en español con primera letra mayúscula
  currentMonthName = computed(() => {
    const hoy = new Date();
    const monthName = hoy.toLocaleDateString('es-CL', { month: 'long' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  });
  
  // Effect para detectar cuando los KPIs están listos
  private kpisEffect = effect(() => {
    const kpis = this.kpisResponse();
    if (kpis !== null) {
      // Los KPIs están listos
      if (this.kpisLoading()) {
        this.kpisLoading.set(false);
      }
      if (!this.sequentialState.kpisError()) {
        // Marcar KPIs como listos solo si no hay error
        setTimeout(() => {
          this.sequentialState.setKPIsReady(false);
        }, 50);
      }
    } else if (this.sequentialState.kpisError() && this.kpisLoading()) {
      this.kpisLoading.set(false);
    }
  });

  searchQuery = signal('');
  statusFilter = signal('all');
  dateFilter = signal('');
  currentPage = signal(1);
  itemsPerPage = 15; // Paginación real del backend
  isLoading = signal(true);
  isLoadingPage = signal(false);
  private isLoadingRecords = false; // Flag para evitar múltiples peticiones simultáneas
  private isManualReload = false; // Flag para indicar que estamos recargando manualmente (evita que el effect interfiera)
  private isInitialLoad = true; // Flag para evitar que el effect se ejecute en la carga inicial
  showFiltersMobile = signal(false);
  
  // Función helper para obtener fechas del mes actual
  private getCurrentMonthDates(): { desde: string; hasta: string } {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth(); // 0-11
    
    // Primer día del mes actual
    const primerDia = new Date(año, mes, 1);
    const desde = primerDia.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Último día del mes actual
    const ultimoDia = new Date(año, mes + 1, 0);
    const hasta = ultimoDia.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return { desde, hasta };
  }
  
  // Filtros usando SearchFilters - Inicializados vacíos, se configuran en ngOnInit
  recordFilters = signal<{ chofer?: string | null; desde?: string | null; hasta?: string | null; orden?: 'mas_reciente' | 'mas_antiguo' }>({});
  
  // Choferes cargados dinámicamente
  private drivers = signal<Array<{ id: number; nombre_completo: string }>>([]);
  
  // Campos de filtro
  filterFields = computed((): FilterField[] => {
    const choferes = this.drivers();
    const choferOptions = [
      { value: null, label: 'Todos los choferes' },
      ...choferes.map(driver => ({
        value: driver.id.toString(),
        label: driver.nombre_completo
      }))
    ];
    
    return [
      {
        key: 'chofer',
        label: 'Chofer',
        type: 'select',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 9a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm-6 1a2 2 0 100 4 2 2 0 000-4zm-6 1a4 4 0 100 8 4 4 0 000-8zm12 0a4 4 0 100 8 4 4 0 000-8z" /></svg>',
        options: choferOptions
      },
      {
        key: 'desde',
        label: 'Desde',
        type: 'date',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25a2.75 2.75 0 012.75 2.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75A2.75 2.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" /></svg>',
        placeholder: 'Seleccionar fecha'
      },
      {
        key: 'hasta',
        label: 'Hasta',
        type: 'date',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25a2.75 2.75 0 012.75 2.75v10.5A2.75 2.75 0 0116.25 20H3.75A2.75 2.75 0 011 17.25V6.75A2.75 2.75 0 013.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" /></svg>',
        placeholder: 'Seleccionar fecha'
      },
      {
        key: 'orden',
        label: 'Orden',
        type: 'select',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z" clip-rule="evenodd" /></svg>',
        options: [
          { value: 'mas_reciente', label: 'Más reciente' },
          { value: 'mas_antiguo', label: 'Más antiguo' }
        ]
      }
    ];
  });
  
  onRecordFilterChange(newFilters: Record<string, any>): void {
    // Si se recibe un objeto vacío (al limpiar filtros), restaurar valores por defecto del mes actual
    const isClearing = Object.keys(newFilters).length === 0;
    
    let filters: { chofer?: string | null; desde?: string | null; hasta?: string | null; orden?: 'mas_reciente' | 'mas_antiguo' };
    
    if (isClearing) {
      // Restaurar filtros por defecto (mes actual)
      const { desde, hasta } = this.getCurrentMonthDates();
      filters = {
        chofer: null,
        desde,
        hasta,
        orden: 'mas_reciente'
      };
    } else {
      // Aplicar los nuevos filtros
      filters = {
        chofer: newFilters['chofer'] || null,
        desde: newFilters['desde'] || null,
        hasta: newFilters['hasta'] || null,
        orden: (newFilters['orden'] || 'mas_reciente') as 'mas_reciente' | 'mas_antiguo'
      };
    }
    
    this.recordFilters.set(filters);
    // NO cerrar automáticamente el panel móvil - dejar que el usuario lo cierre manualmente
    // Esto permite seleccionar múltiples filtros sin que el panel se cierre
    
    // Actualizar los filtros existentes para compatibilidad
    if (filters.desde) {
      this.dateFilter.set(filters.desde);
    } else {
      this.dateFilter.set('');
    }
    
    // Resetear a página 1 cuando cambian los filtros
    this.currentPage.set(1);
    
    // Asegurar que se carguen los registros con los nuevos filtros
    // El effect debería ejecutarse, pero lo llamamos explícitamente para garantizar
    untracked(() => {
      this.loadRecords();
    });
  }

  toggleFiltersMobile(): void {
    this.showFiltersMobile.update(open => !open);
  }
  
  // Estado de carga secuencial coordinado
  sequentialState = this.loadingStateService.createSequentialLoadingState({
    kpisDelay: 100,
    contentDelay: 300,
    maxWaitTime: 2000
  });
  
  // Estado de carga para KPIs
  kpisLoading = signal(true);
  
  /**
   * Recargar registros y mostrar mensaje de éxito después de crear un nuevo registro
   */
  private async reloadRecordsAndShowSuccess(choferId: number, fecha: string): Promise<void> {
    // Marcar que estamos haciendo una recarga manual
    this.isManualReload = true;
    
    // Obtener filtros actuales
    const recordFilters = this.recordFilters();
    
    // Mapear el filtro de estado del select a los estados del modelo
    let estadoFilter: DailyRecordStatus | undefined = undefined;
    if (this.statusFilter() !== 'all') {
      const statusMap: Record<string, DailyRecordStatus> = {
        'complete': 'COMPLETO',
        'pending': 'PENDIENTE_TRABAJADOR',
        'incident': 'INCIDENTE_REPORTADO'
      };
      estadoFilter = statusMap[this.statusFilter()];
    }
    
    const filters: DailyRecordFilters = {
      estado: estadoFilter,
      fecha: this.dateFilter() || recordFilters.desde || undefined,
      desde: recordFilters.desde || undefined,
      hasta: recordFilters.hasta || undefined,
      chofer_id: recordFilters.chofer ? parseInt(recordFilters.chofer, 10) : undefined,
      busqueda: this.searchQuery() || undefined,
      orden: recordFilters.orden || 'mas_reciente',
      pagina: this.currentPage(),
      por_pagina: this.itemsPerPage
    };
    
    try {
      // Esperar un momento para asegurar que el backend haya procesado el nuevo registro
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Esperar a que se carguen los registros
      const response = await firstValueFrom(
        this.dailyRecordService.getDailyRecords(filters)
      );
      
      // Actualizar los registros usando untracked para evitar que el effect se ejecute
      untracked(() => {
        this.recordsResponse.set(response);
        this.isLoading.set(false);
        this.isLoadingPage.set(false);
        this.isLoadingRecords = false;
      });
      
      // Esperar un momento más para asegurar que la UI se haya actualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mostrar mensaje de éxito después de que la tabla se haya actualizado
      const choferNombre = this.drivers().find(d => d.id === choferId)?.nombre_completo || 'el chofer';
      this.alertModalService.show({
        type: 'success',
        title: 'Registro Creado Exitosamente',
        message: `El registro diario para ${choferNombre} del ${fecha} ha sido creado correctamente.`,
        buttonText: 'Entendido'
      });
      
      // Mantener la bandera activa por un tiempo suficiente para evitar que el effect recargue
      // La desactivaremos después de un tiempo razonable (3 segundos)
      // Esto da tiempo suficiente para que el usuario vea y acepte el modal
      setTimeout(() => {
        this.isManualReload = false;
      }, 3000);
    } catch (error) {
      console.error('Error al recargar registros:', error);
      this.isManualReload = false;
      
      // Mostrar mensaje de éxito de todas formas
      const choferNombre = this.drivers().find(d => d.id === choferId)?.nombre_completo || 'el chofer';
      this.alertModalService.show({
        type: 'success',
        title: 'Registro Creado Exitosamente',
        message: `El registro diario para ${choferNombre} del ${fecha} ha sido creado correctamente.`,
        buttonText: 'Entendido'
      });
    }
  }

  // Cargar datos cuando cambian los filtros o la página
  private loadRecords(): void {
    // Evitar múltiples peticiones simultáneas
    if (this.isLoadingRecords) {
      return;
    }
    
    this.isLoadingRecords = true;
    
    // Obtener filtros de recordFilters (usado por SearchFilters)
    const recordFilters = this.recordFilters();
    
    // Mapear el filtro de estado del select a los estados del modelo
    let estadoFilter: DailyRecordStatus | undefined = undefined;
    if (this.statusFilter() !== 'all') {
      const statusMap: Record<string, DailyRecordStatus> = {
        'complete': 'COMPLETO',
        'pending': 'PENDIENTE_TRABAJADOR',
        'incident': 'INCIDENTE_REPORTADO'
      };
      estadoFilter = statusMap[this.statusFilter()];
    }
    
    const filters: DailyRecordFilters = {
      estado: estadoFilter,
      fecha: this.dateFilter() || recordFilters.desde || undefined,
      desde: recordFilters.desde || undefined,
      hasta: recordFilters.hasta || undefined,
      chofer_id: recordFilters.chofer ? parseInt(recordFilters.chofer, 10) : undefined,
      busqueda: this.searchQuery() || undefined,
      orden: recordFilters.orden || 'mas_reciente',
      pagina: this.currentPage(),
      por_pagina: this.itemsPerPage
    };
    
    // Debug: Log para verificar filtros aplicados
    console.log('🔍 Filtros aplicados:', {
      recordFilters,
      filters,
      currentPage: this.currentPage(),
      itemsPerPage: this.itemsPerPage
    });
    
    // Si es la primera carga, usar isLoading, si es cambio de página, usar isLoadingPage
    if (this.currentPage() === 1 && this.recordsResponse().datos.length === 0) {
      this.isLoading.set(true);
    } else {
      this.isLoadingPage.set(true);
    }
    
    this.dailyRecordService.getDailyRecords(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          untracked(() => {
            const isFirstLoad = this.currentPage() === 1 && this.recordsResponse().datos.length === 0;
            
            // Debug: Log para verificar respuesta
            console.log('📋 Daily Records Response recibida:', {
              total: response.total,
              datos: response.datos.length,
              pagina: response.pagina,
              total_paginas: response.total_paginas
            });
            
            this.recordsResponse.set(response);
            this.isLoading.set(false);
            this.isLoadingPage.set(false);
            this.isLoadingRecords = false;
            
            // Debug: Log después de mapear
            console.log('📋 Records mapeados:', {
              total: this.records().length,
              records: this.records()
            });
            
            // Si es la primera carga, marcar contenido como listo (incluso si está vacío)
            if (isFirstLoad && !this.sequentialState.contentError()) {
              // Llamar inmediatamente, sin setTimeout para evitar pestañeo
              this.sequentialState.setContentReady(false);
            }
          });
        },
        error: (error) => {
          console.error('Error al cargar registros:', error);
          untracked(() => {
            this.isLoading.set(false);
            this.isLoadingPage.set(false);
            this.isLoadingRecords = false;
            
            // Si es la primera carga y hay error, mostrar error global
            if (this.currentPage() === 1 && this.recordsResponse().datos.length === 0) {
              this.globalErrorService.showError(
                'No se pudieron cargar los registros diarios desde el servidor.',
                'Error al cargar registros diarios'
              );
              this.sequentialState.setContentReady(true);
            }
          });
        }
      });
  }

  constructor() {
    // Recargar cuando cambian los filtros o la página
    // El effect se ejecutará automáticamente al inicializar, así que no necesitamos llamar loadRecords() directamente
    effect(() => {
      // Si estamos haciendo una recarga manual, no ejecutar el effect
      if (this.isManualReload) {
        return;
      }
      
      // En la carga inicial, no ejecutar el effect (se carga manualmente en ngOnInit)
      // Esto evita que el effect se ejecute cuando recordsResponse se actualiza por primera vez
      if (this.isInitialLoad) {
        this.isInitialLoad = false;
        return;
      }
      
      // Leer los signals para que el effect reaccione a sus cambios
      const query = this.searchQuery();
      const status = this.statusFilter();
      const date = this.dateFilter();
      const page = this.currentPage();
      const filters = this.recordFilters(); // También reaccionar a cambios en recordFilters
      
      // Usar untracked para evitar que las actualizaciones dentro de loadRecords() causen que el effect se vuelva a ejecutar
      untracked(() => {
        this.loadRecords();
      });
    });
  }

  // Helper para mapear desde el modelo unificado a la vista
  private mapToView(record: UnifiedDailyRecord): DailyRecordView {
    // Formatear fecha usando zona local (evitar desfase UTC)
    const date = this.parseLocalDate(record.fecha);
    const formattedDate = date
      ? date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
      : record.fecha;
    
    // Mapear estado
    let status: 'complete' | 'pending' | 'incident' | 'no_worked';
    if (record.estado === 'COMPLETO') {
      status = 'complete';
    } else if (record.estado === 'INCIDENTE_REPORTADO') {
      status = 'incident';
    } else if (record.estado === 'DIA_NO_TRABAJADO' || record.estado === 'NO_TRABAJADO') {
      status = 'no_worked';
    } else {
      status = 'pending';
    }

    return {
      id: record.id,
      date: formattedDate,
      machine: record.maquina_identificador || `Máquina ${record.maquina_id}`,
      driver: record.chofer_nombre || '',
      status,
      income: record.recaudado,
      dieselExpense: record.costo_diesel,
      hasIncident: record.es_emergencia || record.estado === 'INCIDENTE_REPORTADO'
    };
  }

  // Los registros ya vienen paginados del backend
  paginatedRecords = computed(() => this.records());

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    return pages;
  });

  startRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = this.itemsPerPage;
    return (page - 1) * pageSize + 1;
  });

  endRecord = computed(() => {
    const page = this.currentPage();
    const pageSize = this.itemsPerPage;
    const total = this.totalRecords();
    return Math.min(page * pageSize, total);
  });

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      // Asegurar que se carguen los registros de la nueva página
      untracked(() => {
        this.loadRecords();
      });
    }
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      // Asegurar que se carguen los registros de la nueva página
      untracked(() => {
        this.loadRecords();
      });
    }
  }

  goToPage(page: number): void {
    if (page === this.currentPage()) {
      return; // Ya estamos en esa página
    }
    this.currentPage.set(page);
    // Asegurar que se carguen los registros de la nueva página
    // El effect debería ejecutarse, pero lo llamamos explícitamente para garantizar
    untracked(() => {
      this.loadRecords();
    });
  }

  openNewRecordModal(): void {
    this.newRecordModalService.open().then(async (formData) => {
      if (!formData) return;

      try {
        // 1. Extraer IDs de máquina y chofer (ahora vienen como números del modal)
        const maquinaId = typeof formData.machine === 'number' ? formData.machine : this.extractMachineId(String(formData.machine || ''));
        const choferId = typeof formData.driver === 'number' ? formData.driver : this.extractDriverId(formData.driver || '');

        // 2. Subir imágenes primero (solo si es día trabajado)
        let imagenUrl: string | null = null;
        let imagenDieselUrl: string | null = null;

        if (!formData.noWorkDay) {
          // Solo subir imágenes si NO es día no trabajado
          if (formData.receiptPhoto) {
            const uploadResult = await firstValueFrom(
              this.storageService.uploadDailyRecordImageAdmin(
                formData.receiptPhoto,
                choferId,
                formData.date
              )
            );
            imagenUrl = uploadResult.url;
          }

          if (formData.fuelReceiptPhoto) {
            const uploadResult = await firstValueFrom(
              this.storageService.uploadDailyRecordImageAdmin(
                formData.fuelReceiptPhoto,
                choferId,
                formData.date
              )
            );
            imagenDieselUrl = uploadResult.url;
          }
        }

        // 3. Preparar payload para admin
        const adminPayload: CreateDailyRecordAdminDto = {
          chofer_id: choferId,
          maquina_id: maquinaId,
          fecha: formData.date,
          es_dia_no_trabajado: formData.noWorkDay,
          motivo_no_trabajado: formData.noWorkDay ? (formData.noWorkDayReason === 'Otro' ? 'otro' : formData.noWorkDayReason) : null,
          motivo_no_trabajado_otro: formData.noWorkDay && formData.noWorkDayReason === 'Otro' 
            ? formData.noWorkDayReasonOther 
            : null,
          monto_recaudado: formData.noWorkDay ? null : (formData.income || null),
          litros_diesel: formData.noWorkDay ? null : (formData.dieselLiters || null),
          costo_total_diesel: formData.noWorkDay ? null : (formData.dieselExpense || null),
          imagen_url: imagenUrl,
          imagen_comprobante_diesel_url: imagenDieselUrl,
          observaciones: formData.noWorkDay ? null : (formData.observations || null),
          incidente_critico: formData.noWorkDay ? false : (formData.hasIncident || false)
        };

        // 4. Crear registro como admin
        this.dailyRecordService.createDailyRecordAdmin(adminPayload)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
              console.error('Error al crear registro:', error);
              
              // Determinar el mensaje de error según el tipo
              let errorMessage = 'No se pudo crear el registro. Por favor, verifica los datos e intenta nuevamente.';
              let errorTitle = 'Error al Crear Registro';
              
              // Verificar si es un error de registro duplicado
              const errorDetail = error?.error?.detail || error?.message || '';
              const choferNombre = this.drivers().find(d => d.id === choferId)?.nombre_completo || 'el chofer';
              
              if (errorDetail.includes('Ya existe un registro diario') || 
                  errorDetail.includes('registro diario para este chofer y fecha') ||
                  errorDetail.toLowerCase().includes('duplicado')) {
                errorTitle = 'Registro Duplicado';
                errorMessage = `Ya existe un registro diario para ${choferNombre} en la fecha ${formData.date}. No se puede crear un registro duplicado.`;
              } else if (errorDetail) {
                errorMessage = errorDetail;
              }
              
              // Cerrar el modal de creación en caso de error
              this.newRecordModalService.finishSubmission();
              
              // Mostrar modal de error
              this.alertModalService.show({
                type: 'error',
                title: errorTitle,
                message: errorMessage,
                buttonText: 'Entendido'
              });
              
              return of(null);
            })
          )
          .subscribe(async (response: any) => {
            if (response) {
              // Cerrar el modal de creación primero
              this.newRecordModalService.finishSubmission();
              
              // Recargar datos después de crear exitosamente y esperar a que termine
              await this.reloadRecordsAndShowSuccess(choferId, formData.date);
            }
          });

      } catch (error) {
        console.error('Error al subir imágenes o crear registro:', error);
        
        // Cerrar el modal de creación en caso de error
        this.newRecordModalService.finishSubmission();
        
        // Mostrar mensaje de error genérico
        this.alertModalService.show({
          type: 'error',
          title: 'Error al Crear Registro',
          message: 'Ocurrió un error al procesar las imágenes o crear el registro. Por favor, intenta nuevamente.',
          buttonText: 'Entendido'
        });
      }
    });
  }

  ngOnInit(): void {
    // Inicializar filtros con el mes actual por defecto
    const { desde, hasta } = this.getCurrentMonthDates();
    this.recordFilters.set({
      desde,
      hasta,
      orden: 'mas_reciente'
    });
    
    // Cargar datos iniciales manualmente (el effect no se ejecuta en la carga inicial)
    this.loadRecords();
    // Cargar choferes activos para el filtro
    this.loadDrivers();
  }

  private loadDrivers(): void {
    this.driverService.getActiveDrivers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
        },
        error: (error) => {
          console.error('Error cargando choferes:', error);
          // Mantener array vacío en caso de error
          this.drivers.set([]);
        }
      });
  }

  // Función para reintentar carga (ya no se usa, pero se mantiene por compatibilidad)
  retryLoad(): void {
    // Limpiar error global y recargar página
    this.globalErrorService.clearError();
    this.globalErrorService.reloadPage();
  }


  resolveRecord(id: string): void {
    // Si es un incidente, resolverlo primero
    const record = this.records().find(r => r.id === id);
    if (record?.status === 'incident') {
      this.dailyRecordService.resolveIncident(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Recargar datos después de resolver
            this.loadRecords();
            this.router.navigate(['/registro-diario', id]);
          },
          error: (error) => {
            console.error('Error al resolver incidente:', error);
            // Navegar de todas formas
            this.router.navigate(['/registro-diario', id]);
          }
        });
    } else {
      this.router.navigate(['/registro-diario', id]);
    }
  }

  // Helpers temporales para extraer IDs (en producción vendrían del backend)
  private extractMachineId(machineName: string): number {
    const match = machineName.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  private extractDriverId(driverIdOrName: string | number): number {
    // Si ya es un número, retornarlo directamente
    if (typeof driverIdOrName === 'number') {
      return driverIdOrName;
    }
    // Si es string y es un número, parsearlo
    const parsed = parseInt(driverIdOrName, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
    // Si es un nombre, buscar en la lista de choferes cargados
    const driver = this.drivers().find(d => d.nombre_completo === driverIdOrName);
    return driver ? driver.id : 1;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', 'CLP ');
  }
  
  formatDateFull(date: string): string {
    const d = this.parseLocalDate(date);
    if (!d) return '';
    return d.toLocaleDateString('es-CL', { 
      weekday: 'short',
      day: '2-digit', 
      month: 'short'
    });
  }
  
  private parseLocalDate(value: string): Date | null {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  onViewRecordDetail(record: DailyRecordView): void {
    this.router.navigate(['/registro-diario', record.id]);
  }
}

