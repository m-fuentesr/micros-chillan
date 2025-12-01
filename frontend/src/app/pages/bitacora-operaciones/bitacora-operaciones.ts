import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect, DestroyRef, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import type { DailyRecord as UnifiedDailyRecord, DailyRecordStatus, DailyRecordFilters } from '../../shared/models/daily-record.models';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { LoadingOverlay } from '../../shared/components/loading-overlay/loading-overlay';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LoadingSkeleton, LoadingSpinner, LoadingOverlay],
  template: `
    <div class="space-y-6 animate-page-enter relative">
        <app-loading-overlay [isLoading]="isLoading() && records().length === 0" message="Cargando bitácora..." />
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-b-base-300 pb-4 mb-6">
          <div class="animate-header-enter">
            <h1 class="text-4xl font-bold mb-3 tracking-tight text-base-content border-l-4 border-l-primary pl-4">Bitácora de Operaciones</h1>
            <p class="text-base-content/60 italic">Auditoría y gestión centralizada de reportes diarios.</p>
          </div>
          <button 
            (click)="openNewRecordModal()"
            class="btn btn-primary gap-2 shadow-lg shadow-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
            </svg>
            Nuevo Registro
          </button>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @if (isLoading()) {
            @for (i of [1,2,3]; track i) {
              <app-loading-skeleton type="kpi" />
            }
          } @else {
            <div class="card bg-base-100 shadow-sm border border-base-200 relative overflow-hidden hover-lift animate-card-enter group">
              <div class="card-body p-5 relative z-10">
                <span class="text-xs font-bold text-base-content/50 uppercase tracking-wider">Recaudación (Periodo)</span>
                <span class="text-2xl font-black text-base-content tabular-nums">{{ totalRevenue() | currency:'CLP':'symbol':'1.0-0' }}</span>
              </div>
              <div class="absolute -right-4 -bottom-4 text-base-content/5 group-hover:text-base-content/10 transition-colors duration-300 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-24 h-24">
                  <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                  <path fill-rule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clip-rule="evenodd" />
                  <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                </svg>
              </div>
            </div>

            <div class="card bg-base-100 shadow-sm border border-error/20 relative overflow-hidden hover-lift animate-card-enter-delay-1 group">
              <div class="card-body p-5 relative z-10">
                <span class="text-xs font-bold text-error uppercase tracking-wider">Registros Faltantes</span>
                <span class="text-2xl font-black text-error tabular-nums">{{ missingRecords() }}</span>
              </div>
              <div class="absolute -right-4 -bottom-4 text-error/10 group-hover:text-error/20 transition-colors duration-300 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-24 h-24">
                  <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <div class="card bg-base-100 shadow-sm border border-warning/20 relative overflow-hidden hover-lift animate-card-enter-delay-2 group">
              <div class="card-body p-5 relative z-10">
                <span class="text-xs font-bold text-warning uppercase tracking-wider">Con Incidentes</span>
                <span class="text-2xl font-black text-warning tabular-nums">{{ recordsWithIncidents() }}</span>
              </div>
              <div class="absolute -right-4 -bottom-4 text-warning/10 group-hover:text-warning/20 transition-colors duration-300 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-24 h-24">
                  <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          }
        </div>

        <!-- Filtros y Búsqueda -->
        <div class="card bg-base-100 shadow-xl border border-base-200 animate-card-enter">
          <!-- Barra de Búsqueda Principal (VIP - Zona Superior) -->
          <div class="p-4 sm:p-5 border-b border-base-200">
            <div class="relative w-full max-w-2xl">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Buscar por máquina, chofer o folio..." 
                [(ngModel)]="searchQuery"
                class="input input-bordered input-lg w-full pl-12 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            </div>
          </div>

          <!-- Filtros de Contexto y Acciones (Agrupados por Proximidad) -->
          <div class="p-4 sm:p-5 border-b border-base-200 bg-base-50/30">
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
              <!-- Grupo de Filtros (Estado + Fecha) - Agrupados por Semejanza -->
              <div class="join join-vertical sm:join-horizontal w-full sm:w-auto">
                <select [(ngModel)]="statusFilter" class="select select-bordered join-item w-full sm:w-auto text-sm">
                  <option value="all">Todos los Estados</option>
                  <option value="complete">Completos</option>
                  <option value="pending">Pendientes</option>
                  <option value="incident">Con Incidentes</option>
                </select>
                <input 
                  type="date" 
                  [(ngModel)]="dateFilter" 
                  class="input input-bordered join-item w-full sm:w-auto text-sm">
              </div>

              <!-- Acción Secundaria (Separada por Región Común) -->
              <button class="btn btn-outline btn-sm sm:btn-md gap-2 w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clip-rule="evenodd" />
                </svg>
                <span class="hidden sm:inline">Exportar</span>
                <span class="sm:hidden">Exportar</span>
              </button>
            </div>
          </div>

          <!-- Tabla Desktop -->
          <div class="hidden xl:block">
            @if (isLoadingPage()) {
              <div class="flex justify-center items-center py-12">
                <app-loading-spinner size="md" text="Cargando registros..." />
              </div>
            } @else if (isLoading() && paginatedRecords().length === 0) {
              <app-loading-skeleton type="table" [count]="10" />
            } @else {
              <table class="table w-full">
              <thead class="bg-base-200/50 text-xs uppercase text-base-content/60">
                <tr>
                  <th class="pl-4 xl:pl-6">Fecha</th>
                  <th class="min-w-[140px]">Máquina / Chofer</th>
                  <th class="min-w-[100px]">Estado</th>
                  <th class="text-right min-w-[110px]">Ingreso</th>
                  <th class="text-right min-w-[110px]">Gasto Diésel</th>
                  <th class="pr-4 xl:pr-6 text-right min-w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody class="text-sm">
                @for (record of paginatedRecords(); track record.id) {
                  <tr 
                    [class.bg-error/5]="record.status === 'incident'"
                    [class.bg-warning/5]="record.status === 'pending'"
                    [class.hover:bg-error/10]="record.status === 'incident'"
                    [class.hover:bg-warning/10]="record.status === 'pending'"
                    [class.border-l-4]="record.status === 'incident' || record.status === 'pending'"
                    [class.border-l-error]="record.status === 'incident'"
                    [class.border-l-warning]="record.status === 'pending'"
                    class="border-b border-base-100 group">
                    <td [class.pl-3]="record.status === 'incident' || record.status === 'pending'" [class.pl-4]="record.status === 'complete'" [class.xl:pl-5]="record.status === 'incident' || record.status === 'pending'" [class.xl:pl-6]="record.status === 'complete'" class="font-mono text-xs xl:text-sm text-base-content/70 whitespace-nowrap">{{ record.date }}</td>
                    <td class="min-w-0">
                      <div class="font-bold text-base-content truncate tooltip" [attr.data-tip]="record.machine">{{ record.machine }}</div>
                      <div class="text-xs text-base-content/50 truncate tooltip" [attr.data-tip]="record.driver">{{ record.driver }}</div>
                    </td>
                    <td>
                      @if (record.status === 'complete') {
                        <span class="badge badge-sm badge-success/10 text-success border-0 font-bold">Completo</span>
                      } @else if (record.status === 'incident') {
                        <span class="badge badge-sm badge-error text-white border-0 font-bold gap-1">⚠️ Incidente</span>
                      } @else {
                        <span class="badge badge-sm badge-warning text-warning-content border-0 font-bold">Pendiente</span>
                      }
                    </td>
                    <td class="text-right font-mono tabular-nums text-xs xl:text-sm whitespace-nowrap">{{ record.income | currency:'CLP':'symbol':'1.0-0' }}</td>
                    <td class="text-right font-mono tabular-nums text-xs xl:text-sm whitespace-nowrap" [class.text-error/80]="record.dieselExpense > 0" [class.text-base-content/30]="record.dieselExpense === 0">
                      {{ record.dieselExpense > 0 ? (record.dieselExpense | currency:'CLP':'symbol':'1.0-0') : '-' }}
                    </td>
                    <td class="pr-4 xl:pr-6 text-right">
                      @if (record.status === 'incident') {
                        <button 
                          (click)="resolveRecord(record.id)"
                          class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg border-0 bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-200 gap-1 xl:gap-1.5 shadow-sm"
                          [attr.aria-label]="'Resolver incidente de ' + record.driver">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                          </svg>
                          <span class="hidden 2xl:inline">Resolver</span>
                        </button>
                      } @else if (record.status === 'pending') {
                        <button 
                          (click)="resolveRecord(record.id)"
                          class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg border-0 bg-warning/15 text-warning-content hover:bg-warning hover:text-warning-content transition-all duration-200 gap-1 xl:gap-1.5 shadow-sm"
                          [attr.aria-label]="'Completar registro pendiente de ' + record.driver">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                          <span class="hidden 2xl:inline">Completar</span>
                        </button>
                      } @else {
                        <a 
                          [routerLink]="['/registro-diario', record.id]"
                          class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1 xl:gap-1.5 font-normal"
                          [attr.aria-label]="'Ver detalle del registro de ' + record.driver">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="hidden 2xl:inline">Ver detalle</span>
                        </a>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            }
          </div>

          <!-- Cards Mobile/Tablet -->
          <div class="xl:hidden space-y-4 p-4">
            @if (isLoadingPage()) {
              <div class="flex justify-start items-center py-12 pl-4 border-l-4 border-l-primary">
                <app-loading-spinner size="md" text="Cargando registros..." />
              </div>
            } @else if (isLoading() && paginatedRecords().length === 0) {
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
                    @if (record.status === 'incident') {
                      <button 
                        (click)="resolveRecord(record.id)"
                        class="btn btn-xs h-9 w-full rounded-lg border-0 bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-200 gap-1.5 shadow-sm"
                        [attr.aria-label]="'Resolver incidente de ' + record.driver">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                        Resolver
                      </button>
                    } @else if (record.status === 'pending') {
                      <button 
                        (click)="resolveRecord(record.id)"
                        class="btn btn-xs h-9 w-full rounded-lg border-0 bg-warning/15 text-warning-content hover:bg-warning hover:text-warning-content transition-all duration-200 gap-1.5 shadow-sm"
                        [attr.aria-label]="'Completar registro pendiente de ' + record.driver">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                        </svg>
                        Completar
                      </button>
                    } @else {
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
                    }
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

      <!-- Modal Nuevo Registro -->
      @if (showNewRecordModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300" (click)="closeNewRecordModal()">
          <div class="bg-base-100 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] min-h-[400px] border border-base-200 animate-scale-up" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-base-200 flex justify-between items-center bg-base-100 sticky top-0 z-10">
              <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 sm:w-5 sm:h-5">
                    <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-xl sm:text-2xl text-base-content leading-tight truncate border-l-4 border-l-primary pl-3">Nuevo Registro Diario</h3>
                  <p class="text-[10px] sm:text-xs text-base-content/50 italic hidden sm:block">Ingresa los datos operativos de la jornada.</p>
                </div>
              </div>
              <button class="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:bg-base-200 flex-shrink-0 ml-2" (click)="closeNewRecordModal()" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <form [formGroup]="newRecordForm" (ngSubmit)="onSubmitNewRecord()" class="flex flex-col min-h-0 flex-1">
              <div class="p-3 sm:p-4 lg:p-6 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 lg:space-y-6 flex-1 min-h-0">
                <!-- Toggle Día No Trabajado -->
                <div class="card bg-base-200/50 border border-base-200">
                  <div class="card-body p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div class="min-w-0 flex-1">
                      <span class="font-bold text-xs sm:text-sm block text-base-content">Estado de Operación</span>
                      <span class="text-[10px] sm:text-xs text-base-content/60 italic block mt-0.5">¿La máquina trabajó hoy?</span>
                    </div>
                    <label class="cursor-pointer flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span class="text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap" [class.text-base-content/40]="!newRecordForm.get('noWorkDay')?.value" [class.text-primary]="newRecordForm.get('noWorkDay')?.value">
                        {{ newRecordForm.get('noWorkDay')?.value ? 'No Trabajado' : 'Operativo' }}
                      </span>
                      <input type="checkbox" class="toggle toggle-sm sm:toggle-md toggle-primary" formControlName="noWorkDay" />
                    </label>
                  </div>
                  
                  @if (newRecordForm.get('noWorkDay')?.value) {
                    <div class="border-t border-base-200 p-3 sm:p-4">
                      <label class="form-control w-full">
                        <div class="label pt-0">
                          <span class="label-text font-normal text-[10px] sm:text-xs uppercase text-base-content/60">Motivo de Inactividad</span>
                        </div>
                        <select class="select select-bordered w-full bg-white focus:border-primary text-sm" formControlName="noWorkDayReason">
                          <option value="">Seleccione un motivo...</option>
                          <option value="Descanso Semanal">Descanso Semanal</option>
                          <option value="En Taller / Mantenimiento">En Taller / Mantenimiento</option>
                          <option value="Sin Chofer Asignado">Sin Chofer Asignado</option>
                          <option value="Licencia Médica">Licencia Médica</option>
                        </select>
                      </label>
                    </div>
                  }
                </div>

                @if (!newRecordForm.get('noWorkDay')?.value) {
                  <!-- Campos Financieros -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-bold text-sm sm:text-base">Ingreso del Día</span>
                      </label>
                      <div class="relative group">
                        <span class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold text-base sm:text-lg group-focus-within:text-primary transition-colors">$</span>
                        <input 
                          type="number" 
                          formControlName="income"
                          placeholder="0" 
                          class="input input-bordered w-full pl-7 sm:pl-8 font-mono text-base sm:text-lg font-bold tabular-nums focus:input-primary h-11 sm:h-12 bg-base-100" />
                      </div>
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text font-normal text-sm sm:text-base">Gasto en Diésel</span>
                        <span class="label-text-alt text-base-content/50 italic text-[10px] sm:text-xs">(Opcional)</span>
                      </label>
                      <div class="relative group">
                        <span class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-bold text-base sm:text-lg group-focus-within:text-primary transition-colors">$</span>
                        <input 
                          type="number" 
                          formControlName="dieselExpense"
                          placeholder="0" 
                          class="input input-bordered w-full pl-7 sm:pl-8 font-mono text-base sm:text-lg font-bold tabular-nums focus:input-primary h-11 sm:h-12 bg-base-100" />
                      </div>
                    </div>
                    <div class="form-control sm:col-span-2">
                      <label class="label">
                        <span class="label-text font-normal text-sm sm:text-base">Litros Cargados</span>
                        <span class="label-text-alt text-base-content/50 italic text-[10px] sm:text-xs">(Opcional)</span>
                      </label>
                      <label class="input input-bordered flex items-center gap-2 bg-base-100 focus-within:input-primary h-11 sm:h-12">
                        <input 
                          type="number" 
                          formControlName="dieselLiters"
                          step="0.1"
                          placeholder="0.0" 
                          class="grow font-mono font-bold text-sm sm:text-base" />
                        <span class="badge badge-sm badge-ghost font-mono text-[10px] sm:text-xs">LTS</span>
                      </label>
                    </div>
                  </div>
                }

                <!-- Campos de Contexto -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text text-[10px] sm:text-xs font-bold text-base-content/60 uppercase">Fecha</span>
                    </label>
                    <input 
                      type="date" 
                      formControlName="date"
                      class="input input-bordered w-full text-sm focus:input-primary" />
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text text-[10px] sm:text-xs font-bold text-base-content/60 uppercase">Máquina</span>
                    </label>
                    <select formControlName="machine" class="select select-bordered w-full text-sm focus:select-primary">
                      <option value="">Seleccionar máquina</option>
                      <option value="Máquina 01">Máquina 01</option>
                      <option value="Máquina 02">Máquina 02</option>
                      <option value="Máquina 03">Máquina 03</option>
                      <option value="Máquina 04">Máquina 04</option>
                      <option value="Máquina 05">Máquina 05</option>
                    </select>
                  </div>
                  <div class="form-control sm:col-span-2">
                    <label class="label">
                      <span class="label-text text-[10px] sm:text-xs font-bold text-base-content/60 uppercase">Chofer Asignado</span>
                    </label>
                    <select formControlName="driver" class="select select-bordered w-full text-sm focus:select-primary">
                      <option value="">Seleccionar chofer</option>
                      <option value="Juan Pérez">Juan Pérez</option>
                      <option value="Luis Martínez">Luis Martínez</option>
                      <option value="Ana Gómez">Ana Gómez</option>
                    </select>
                  </div>
                </div>

                <!-- Selector de Incidente Crítico -->
                <div class="card bg-red-50 border border-red-100 shadow-sm">
                  <div class="card-body p-4 sm:p-5">
                    <div class="flex items-center justify-between gap-2 sm:gap-3">
                      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 sm:w-5 sm:h-5">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs sm:text-sm font-bold text-red-800 truncate">¿Ocurrió un incidente crítico?</p>
                          <p class="text-[10px] sm:text-xs text-red-600/70 italic">Choque, falla mecánica, etc.</p>
                        </div>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                          type="checkbox" 
                          class="sr-only peer" 
                          formControlName="hasIncident" />
                        <div class="w-10 h-5 sm:w-11 sm:h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Observaciones -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-normal text-sm sm:text-base">Observaciones</span>
                  </label>
                  <textarea 
                    formControlName="observations"
                    class="textarea textarea-bordered h-20 sm:h-24 w-full focus:textarea-primary text-sm sm:text-base leading-relaxed" 
                    placeholder="Escribe aquí cualquier novedad, incidente o comentario sobre la jornada..."></textarea>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border-t border-base-200 bg-base-50/50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
                <button type="button" class="btn btn-ghost hover:bg-base-200 font-normal btn-xs sm:btn-sm lg:btn-md w-full sm:w-auto" (click)="closeNewRecordModal()">Cancelar</button>
                <button type="submit" [disabled]="newRecordForm.invalid" class="btn btn-primary px-3 sm:px-4 lg:px-6 shadow-lg shadow-primary/20 gap-1.5 sm:gap-2 btn-xs sm:btn-sm lg:btn-md w-full sm:w-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 sm:w-4 sm:h-4">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                  </svg>
                  <span class="hidden sm:inline">Guardar Registro</span>
                  <span class="sm:hidden">Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 20px; }
    @keyframes scale-up {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-scale-up {
      animation: scale-up 0.2s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BitacoraOperaciones implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dailyRecordService = inject(DailyRecordService);
  private destroyRef = inject(DestroyRef);

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
    this.dailyRecordService.getDailyRecordsKPIs(),
    { initialValue: null }
  );

  totalRevenue = computed(() => this.kpisResponse()?.recaudacion_periodo || 0);
  missingRecords = computed(() => this.kpisResponse()?.registros_faltantes || 0);
  recordsWithIncidents = computed(() => this.kpisResponse()?.registros_con_incidentes || 0);

  searchQuery = signal('');
  statusFilter = signal('all');
  dateFilter = signal('');
  currentPage = signal(1);
  itemsPerPage = 20; // Paginación real del backend
  showNewRecordModal = signal(false);
  isLoading = signal(true);
  isLoadingPage = signal(false);
  private isLoadingRecords = false; // Flag para evitar múltiples peticiones simultáneas
  
  // Cargar datos cuando cambian los filtros o la página
  private loadRecords(): void {
    // Evitar múltiples peticiones simultáneas
    if (this.isLoadingRecords) {
      return;
    }
    
    this.isLoadingRecords = true;
    
    const filters: DailyRecordFilters = {
      estado: this.statusFilter() === 'all' ? undefined : this.statusFilter() as DailyRecordStatus,
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
            this.recordsResponse.set(response);
            this.isLoading.set(false);
            this.isLoadingPage.set(false);
            this.isLoadingRecords = false;
          });
        },
        error: (error) => {
          console.error('Error al cargar registros:', error);
          untracked(() => {
            this.isLoading.set(false);
            this.isLoadingPage.set(false);
            this.isLoadingRecords = false;
          });
        }
      });
  }

  newRecordForm = this.fb.group({
    noWorkDay: [false],
    noWorkDayReason: [''],
    date: ['', Validators.required],
    machine: ['', Validators.required],
    driver: ['', Validators.required],
    income: [0],
    dieselExpense: [0],
    dieselLiters: [0],
    hasIncident: [false],
    observations: ['']
  });

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
    
    // Actualizar validación cuando cambia "Día No Trabajado"
    this.newRecordForm.get('noWorkDay')?.valueChanges.subscribe(noWorkDay => {
      const incomeControl = this.newRecordForm.get('income');
      const dieselControl = this.newRecordForm.get('dieselExpense');
      
      if (noWorkDay) {
        incomeControl?.clearValidators();
        dieselControl?.clearValidators();
      } else {
        incomeControl?.setValidators([Validators.required, Validators.min(0)]);
        dieselControl?.setValidators([Validators.required, Validators.min(0)]);
      }
      
      incomeControl?.updateValueAndValidity();
      dieselControl?.updateValueAndValidity();
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
    this.showNewRecordModal.set(true);
  }

  closeNewRecordModal(): void {
    this.showNewRecordModal.set(false);
    this.newRecordForm.reset({ 
      noWorkDay: false, 
      noWorkDayReason: '', 
      income: 0, 
      dieselExpense: 0, 
      dieselLiters: 0,
      hasIncident: false 
    });
  }

  ngOnInit(): void {
    // Los datos se cargan automáticamente mediante loadRecords() en constructor
  }

  onSubmitNewRecord(): void {
    if (this.newRecordForm.valid) {
      const formValue = this.newRecordForm.value;
      
      // Mapear formulario a DTO
      const createDto = {
        fecha: formValue.date || '',
        maquina_id: this.extractMachineId(formValue.machine || ''),
        chofer_id: this.extractDriverId(formValue.driver || ''),
        recaudado: formValue.noWorkDay ? undefined : (formValue.income ?? undefined),
        costo_diesel: formValue.noWorkDay ? undefined : (formValue.dieselExpense ?? undefined),
        litros_diesel: formValue.noWorkDay ? undefined : (formValue.dieselLiters ?? undefined),
        dia_no_trabajado: formValue.noWorkDay || false,
        motivo_inactividad: formValue.noWorkDay ? (formValue.noWorkDayReason as any) : undefined,
        es_emergencia: formValue.hasIncident || false,
        observaciones: formValue.observations || null
      };

      this.dailyRecordService.createDailyRecord(createDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (newRecord) => {
            // Recargar datos después de crear
            this.loadRecords();
            this.closeNewRecordModal();
          },
          error: (error) => {
            console.error('Error al crear registro:', error);
            // TODO: Mostrar mensaje de error al usuario
          }
        });
    }
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
}

