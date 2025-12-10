import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect, DestroyRef, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import type { DailyRecord as UnifiedDailyRecord, DailyRecordStatus, DailyRecordFilters } from '../../shared/models/daily-record.models';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { LoadingOverlay } from '../../shared/components/loading-overlay/loading-overlay';
import { LoadingStateService } from '../../shared/services/loading-state.service';
import { SearchFilters, FilterField } from '../../shared/components/search-filters/search-filters';
import { DriverIcon } from '../../shared/components/driver-icon/driver-icon';
import { NewRecordModalComponent } from '../../shared/components/new-record-modal/new-record-modal';
import { NewRecordModalService } from '../../shared/services/new-record-modal.service';

/**
 * Vista simplificada de DailyRecord para uso en Bitácora de Operaciones
 * Compatible con el template actual. Se mapeará desde el modelo unificado cuando se integre el servicio.
 */
interface DailyRecordView {
  id: string;
  date: string; // Formateado para display
  machine: string; // maquina_identificador o derivado
  driver: string; // chofer_nombre
  status: 'complete' | 'pending' | 'incident'; // Mapeo de DailyRecordStatus
  income: number; // recaudado
  dieselExpense: number; // costo_diesel
  hasIncident: boolean; // es_emergencia o estado === 'INCIDENTE_REPORTADO'
}

@Component({
  selector: 'app-bitacora-operaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LoadingSkeleton, LoadingSpinner, LoadingOverlay, SearchFilters, DriverIcon, NewRecordModalComponent],
  template: `
    <div class="space-y-6 relative">
        <app-loading-overlay [isLoading]="isLoading() && records().length === 0" message="Cargando bitácora..." />
        
        <!-- Hero Section Premium -->
        <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-2xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
              </svg>
              Nuevo Registro
            </button>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          @if (kpisLoading() && !sequentialState.kpisError()) {
            @for (i of [1,2,3]; track i) {
              <app-loading-skeleton type="kpi" />
            }
          } @else if (sequentialState.kpisError()) {
            <div class="col-span-full card bg-error/10 border border-error/20 rounded-xl p-4 mb-4">
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-sm font-semibold text-error">Error al cargar KPIs</p>
                  <p class="text-xs text-error/70">No se pudieron cargar los indicadores</p>
                </div>
              </div>
            </div>
            <div 
              class="col-span-full"
              [class.opacity-0]="!sequentialState.canShowKPIs()" 
              [class.animate-fade-in]="sequentialState.canShowKPIs()" 
              [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
              [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
              <!-- KPIs con error pero mostrando datos -->
            </div>
          } @else {
            <div 
              class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 col-span-full"
              [class.opacity-0]="!sequentialState.canShowKPIs()" 
              [class.animate-fade-in]="sequentialState.canShowKPIs()" 
              [style.transition]="sequentialState.canShowKPIs() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
              [style.transform]="sequentialState.canShowKPIs() ? 'translateY(0)' : 'translateY(12px)'">
            <!-- Card 1: Recaudación (Periodo) -->
            <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter h-full">
              <div class="flex items-start justify-between mb-2">
                <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Recaudación (Periodo)</span>
                <div class="p-1.5 md:p-2 bg-primary/10 rounded-md md:rounded-lg text-primary flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.818.182a2.25 2.25 0 002.364 0l.818-.182m-3-2.818h6m-6-2.25h6m-9 2.25v6.75a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V9.75a2.25 2.25 0 00-2.25-2.25h-9a2.25 2.25 0 00-2.25 2.25z" />
                  </svg>
                </div>
              </div>
              <span class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-base-content tracking-tight tabular-nums break-words min-w-0">{{ formatCurrency(totalRevenue()) }}</span>
            </div>

            <!-- Card 2: Registros Faltantes -->
            <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-1 h-full">
              <div class="flex items-start justify-between mb-2">
                <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Registros Faltantes</span>
                <div class="p-1.5 md:p-2 bg-error/10 rounded-md md:rounded-lg text-error flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
              <span class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-base-content tracking-tight tabular-nums">{{ missingRecords() }}</span>
            </div>

            <!-- Card 3: Con Incidentes -->
            <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-2 h-full">
              <div class="flex items-start justify-between mb-2">
                <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Con Incidentes</span>
                <div class="p-1.5 md:p-2 bg-warning/10 rounded-md md:rounded-lg text-warning flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
              <span class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-base-content tracking-tight tabular-nums">{{ recordsWithIncidents() }}</span>
            </div>
            </div>
          }
        </div>

        <!-- Filtros y Búsqueda -->
        @if (!sequentialState.canShowContent() && isLoading() && paginatedRecords().length === 0 && !sequentialState.contentError()) {
          <!-- Mostrar skeleton mientras esperamos que los KPIs aparezcan -->
          <div class="card bg-base-100 shadow-xl border border-base-200">
            <app-loading-skeleton type="table" [count]="10" />
          </div>
        } @else if (sequentialState.contentError() && paginatedRecords().length === 0) {
          <div class="card bg-error/10 border border-error/20 rounded-xl p-6">
            <div class="flex flex-col items-center gap-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 class="text-lg font-semibold text-error mb-2">Error al cargar registros</h3>
                <p class="text-sm text-error/70 mb-4">No se pudieron cargar los registros desde el servidor.</p>
                <button (click)="retryLoad()" class="btn btn-sm btn-error">
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        } @else {
          <!-- Solo renderizar el contenido cuando canShowContent es true -->
          <div 
            class="card bg-base-100 shadow-xl border border-base-200 animate-card-enter"
            [class.animate-fade-in]="sequentialState.canShowContent()" 
            [style.transition]="sequentialState.canShowContent() ? 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
            [style.transform]="sequentialState.canShowContent() ? 'translateY(0)' : 'translateY(12px)'"
            [style.opacity]="sequentialState.canShowContent() ? '1' : '0'">
            <!-- Header Premium con gradiente sutil -->
            <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30">
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
              <!-- Filtros usando componente reutilizable -->
              <app-search-filters
                [fields]="filterFields()"
                [filters]="recordFilters()"
                [columns]="4"
                (filterChange)="onRecordFilterChange($event)" />

              <!-- Vista Desktop: Tabla Completa (≥ 1024px) -->
              <div class="hidden lg:block overflow-hidden rounded-xl border border-base-200">
                @if (isLoadingPage()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando registros..." />
                  </div>
                } @else if (isLoading() && paginatedRecords().length === 0 && !sequentialState.contentError()) {
                  <app-loading-skeleton type="table" [count]="10" />
                } @else if (sequentialState.contentError() && paginatedRecords().length === 0) {
                  <div class="card bg-error/10 border border-error/20 rounded-xl p-6">
                    <div class="flex flex-col items-center gap-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 class="text-lg font-semibold text-error mb-2">Error al cargar registros</h3>
                        <p class="text-sm text-error/70 mb-4">No se pudieron cargar los registros desde el servidor.</p>
                        <button (click)="retryLoad()" class="btn btn-sm btn-error">
                          Reintentar
                        </button>
                      </div>
                    </div>
                  </div>
                } @else {
                  <table class="table w-full table-min-height">
                    <thead class="bg-base-50 border-b border-base-200">
                      <tr>
                        <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[200px]">Conductor</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Recaudado</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px] hidden xl:table-cell">Diésel</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px] hidden xl:table-cell">Neto</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[80px] hidden xl:table-cell">OBS.</th>
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
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                              </div>
                              <div>
                                <div class="font-bold text-base-content">{{ record.date }}</div>
                                <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.date) }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 text-center">
                            <div class="flex flex-col items-center gap-2">
                              <app-driver-icon class="w-5 h-5 text-primary"></app-driver-icon>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-primary group-hover:scale-110 transition-transform">
                                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              } @else {
                                <div class="w-8 h-8 rounded-full bg-base-200/50 flex items-center justify-center border border-base-200">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-base-content/30">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                                  </svg>
                                </div>
                              }
                            </div>
                          </td>
                          <td class="pr-6 text-right py-4" (click)="$event.stopPropagation()">
                            <a 
                              [routerLink]="['/registro-diario', record.id]"
                              class="btn btn-xs h-8 px-2 lg:px-3 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1 lg:gap-1.5 font-normal">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                              </svg>
                              <span>Ver</span>
                            </a>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="8" class="py-16 sm:py-20">
                            <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
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
              <div class="overflow-hidden rounded-xl border border-base-200">
                @if (isLoadingPage()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando registros..." />
                  </div>
                } @else if (isLoading() && paginatedRecords().length === 0 && !sequentialState.contentError()) {
                  <app-loading-skeleton type="table" [count]="10" />
                } @else if (sequentialState.contentError() && paginatedRecords().length === 0) {
                  <div class="card bg-error/10 border border-error/20 rounded-xl p-6">
                    <div class="flex flex-col items-center gap-4 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 class="text-lg font-semibold text-error mb-2">Error al cargar registros</h3>
                        <p class="text-sm text-error/70 mb-4">No se pudieron cargar los registros desde el servidor.</p>
                        <button (click)="retryLoad()" class="btn btn-sm btn-error">
                          Reintentar
                        </button>
                      </div>
                    </div>
                  </div>
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
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                              </div>
                              <div>
                                <div class="font-bold text-base-content">{{ record.date }}</div>
                                <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.date) }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 text-center">
                            <div class="flex flex-col items-center gap-2">
                              <app-driver-icon class="w-5 h-5 text-primary"></app-driver-icon>
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
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                              </svg>
                              <span>Ver</span>
                            </a>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="py-16 sm:py-20">
                            <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-10 sm:h-10 text-base-content/40">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
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
            } @else if (sequentialState.contentError() && paginatedRecords().length === 0) {
              <div class="card bg-error/10 border border-error/20 rounded-xl p-6">
                <div class="flex flex-col items-center gap-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 class="text-lg font-semibold text-error mb-2">Error al cargar registros</h3>
                    <p class="text-sm text-error/70 mb-4">No se pudieron cargar los registros desde el servidor.</p>
                    <button (click)="retryLoad()" class="btn btn-sm btn-error">
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              @for (record of paginatedRecords(); track record.id) {
              <div 
                class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
                [class.border-l-4]="record.status === 'incident' || record.status === 'pending'"
                [class.border-l-error]="record.status === 'incident'"
                [class.border-l-warning]="record.status === 'pending'"
                [class.bg-error/5]="record.status === 'incident'"
                [class.bg-warning/5]="record.status === 'pending'">
                <div class="card-body p-5">
                  <!-- Header: Avatares y Estado -->
                  <div class="flex items-start gap-4 mb-4">
                    <!-- Avatar Máquina -->
                    <div class="avatar placeholder shrink-0">
                      <div 
                        class="rounded-lg w-12 h-12 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center"
                        [class.bg-error/10]="record.status === 'incident'"
                        [class.border]="record.status === 'incident'"
                        [class.border-error/20]="record.status === 'incident'"
                        [class.bg-gradient-to-br]="record.status !== 'incident'"
                        [class.from-primary/20]="record.status !== 'incident'"
                        [class.to-primary/10]="record.status !== 'incident'">
                        <svg 
                          class="w-7 h-7"
                          [class.text-error]="record.status === 'incident'"
                          [class.text-primary]="record.status !== 'incident'"
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg">
                          <path 
                            d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V17C20 17.5523 19.5523 18 19 18H5C4.44772 18 4 17.5523 4 17V7Z" 
                            stroke="currentColor" 
                            stroke-width="1.5" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"/>
                          <path 
                            d="M4 10H20" 
                            stroke="currentColor" 
                            stroke-width="1.5" 
                            stroke-linecap="round"/>
                          <path 
                            d="M8 13H16" 
                            stroke="currentColor" 
                            stroke-width="1.5" 
                            stroke-linecap="round"/>
                        </svg>
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
                              <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-6 h-6 rounded-full text-primary flex items-center justify-center border border-base-200">
                                <span class="text-[9px] font-bold">{{ getInitials(record.driver) }}</span>
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
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 mr-1"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                              Incidente
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
                  <div class="grid grid-cols-2 gap-4 mb-4">
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
                      class="btn btn-xs h-9 w-full rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1.5 font-normal"
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

      <!-- Modal Nuevo Registro -->
      <app-new-record-modal></app-new-record-modal>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BitacoraOperaciones implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dailyRecordService = inject(DailyRecordService);
  private destroyRef = inject(DestroyRef);
  private loadingStateService = inject(LoadingStateService);
  private newRecordModalService = inject(NewRecordModalService);

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
  
  // Effect para detectar cuando los KPIs están listos
  private kpisEffect = effect(() => {
    const kpis = this.kpisResponse();
    if (kpis !== null) {
      // Los KPIs están listos (pueden ser mocks o datos reales)
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
  itemsPerPage = 20; // Paginación real del backend
  isLoading = signal(true);
  isLoadingPage = signal(false);
  private isLoadingRecords = false; // Flag para evitar múltiples peticiones simultáneas
  
  // Filtros usando SearchFilters
  recordFilters = signal<{ chofer?: string | null; desde?: string | null; hasta?: string | null; orden?: 'mas_reciente' | 'mas_antiguo' }>({});
  
  // Campos de filtro
  filterFields = computed((): FilterField[] => {
    return [
      {
        key: 'chofer',
        label: 'Chofer',
        type: 'select',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 9a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm-6 1a2 2 0 100 4 2 2 0 000-4zm-6 1a4 4 0 100 8 4 4 0 000-8zm12 0a4 4 0 100 8 4 4 0 000-8z" /></svg>',
        options: [
          { value: null, label: 'Todos los choferes' },
          { value: '1', label: 'Juan Pérez' },
          { value: '2', label: 'Luis Martínez' },
          { value: '3', label: 'Ana Gómez' }
        ]
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
    const filters = {
      chofer: newFilters['chofer'] || null,
      desde: newFilters['desde'] || null,
      hasta: newFilters['hasta'] || null,
      orden: (newFilters['orden'] || 'mas_reciente') as 'mas_reciente' | 'mas_antiguo'
    };
    this.recordFilters.set(filters);
    
    // Actualizar los filtros existentes para compatibilidad
    if (filters.desde) {
      this.dateFilter.set(filters.desde);
    } else {
      this.dateFilter.set('');
    }
    
    // Resetear a página 1 cuando cambian los filtros
    this.currentPage.set(1);
  }
  
  // Estado de carga secuencial coordinado
  sequentialState = this.loadingStateService.createSequentialLoadingState({
    kpisDelay: 100,
    contentDelay: 300,
    maxWaitTime: 2000
  });
  
  // Estado de carga para KPIs
  kpisLoading = signal(true);
  
  // Cargar datos cuando cambian los filtros o la página
  private loadRecords(): void {
    // Evitar múltiples peticiones simultáneas
    if (this.isLoadingRecords) {
      return;
    }
    
    this.isLoadingRecords = true;
    
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
      fecha: this.dateFilter() || undefined,
      busqueda: this.searchQuery() || undefined,
      pagina: this.currentPage(),
      por_pagina: this.itemsPerPage
    };
    
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
              setTimeout(() => {
                this.sequentialState.setContentReady(false);
              }, 100);
            }
          });
        },
        error: (error) => {
          console.error('Error al cargar registros:', error);
          untracked(() => {
            this.isLoading.set(false);
            this.isLoadingPage.set(false);
            this.isLoadingRecords = false;
            
            // Si es la primera carga y hay error, marcar error
            if (this.currentPage() === 1 && this.recordsResponse().datos.length === 0) {
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
      // Leer los signals para que el effect reaccione a sus cambios
      const query = this.searchQuery();
      const status = this.statusFilter();
      const date = this.dateFilter();
      const page = this.currentPage();
      
      // Usar untracked para evitar que las actualizaciones dentro de loadRecords() causen que el effect se vuelva a ejecutar
      untracked(() => {
        this.loadRecords();
      });
    });
  }

  // Helper para mapear desde el modelo unificado a la vista
  private mapToView(record: UnifiedDailyRecord): DailyRecordView {
    // Formatear fecha
    const date = new Date(record.fecha);
    const formattedDate = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Mapear estado
    let status: 'complete' | 'pending' | 'incident';
    if (record.estado === 'COMPLETO') {
      status = 'complete';
    } else if (record.estado === 'INCIDENTE_REPORTADO') {
      status = 'incident';
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
    }
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  openNewRecordModal(): void {
    this.newRecordModalService.open().then((formData) => {
      if (formData) {
        // Mapear formulario a DTO
        const createDto = {
          fecha: formData.date || '',
          maquina_id: this.extractMachineId(formData.machine || ''),
          chofer_id: this.extractDriverId(formData.driver || ''),
          recaudado: formData.noWorkDay ? undefined : (formData.income ?? undefined),
          costo_diesel: formData.noWorkDay ? undefined : (formData.dieselExpense ?? undefined),
          litros_diesel: formData.noWorkDay ? undefined : (formData.dieselLiters ?? undefined),
          dia_no_trabajado: formData.noWorkDay || false,
          motivo_inactividad: formData.noWorkDay ? (formData.noWorkDayReason as any) : undefined,
          es_emergencia: formData.hasIncident || false,
          observaciones: formData.observations || null
        };

        this.dailyRecordService.createDailyRecord(createDto)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (newRecord) => {
              // Recargar datos después de crear
              this.loadRecords();
            },
            error: (error) => {
              console.error('Error al crear registro:', error);
              // TODO: Mostrar mensaje de error al usuario
            }
          });
      }
    });
  }

  ngOnInit(): void {
    // Los datos se cargan automáticamente mediante loadRecords() en constructor
  }

  // Función para reintentar carga
  retryLoad(): void {
    this.sequentialState.resetErrors();
    this.sequentialState.reset();
    this.isLoading.set(true);
    this.currentPage.set(1);
    this.loadRecords();
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

  private extractDriverId(driverName: string): number {
    // Mapeo temporal - en producción esto vendría de un select con IDs
    const driverMap: Record<string, number> = {
      'Juan Pérez': 1,
      'Luis Martínez': 2,
      'Ana Gómez': 3
    };
    return driverMap[driverName] || 1;
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
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return ''; // Validar fecha inválida
      return d.toLocaleDateString('es-CL', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short'
      });
    } catch {
      return '';
    }
  }
  
  onViewRecordDetail(record: DailyRecordView): void {
    this.router.navigate(['/registro-diario', record.id]);
  }
}

