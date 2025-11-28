import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyRecord } from '../../models/dashboard.models';

@Component({
  selector: 'app-daily-records-table',
  imports: [RouterLink],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200/50 overflow-hidden animate-scale-up">
      <div class="card-header p-6 border-b border-base-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="card-title text-xl font-bold text-base-content">Registros de Operación</h2>
          <p class="text-xs text-base-content/50 mt-1">Visión general del rendimiento diario de la flota.</p>
        </div>
        
        <div class="flex gap-2 bg-base-200/50 p-1 rounded-lg">
          <button 
            class="btn btn-xs btn-ghost rounded-md transition-all"
            [class.bg-white]="!showOnlyPending()"
            [class.shadow-sm]="!showOnlyPending()"
            [class.text-base-content]="!showOnlyPending()"
            [class.text-base-content/60]="showOnlyPending()"
            (click)="onToggleFilter()"
            type="button"
            aria-label="Mostrar todos los registros">
            Todos
          </button>
          <button 
            class="btn btn-xs btn-ghost rounded-md transition-all"
            [class.bg-white]="showOnlyPending()"
            [class.shadow-sm]="showOnlyPending()"
            [class.text-base-content]="showOnlyPending()"
            [class.text-base-content/60]="!showOnlyPending()"
            (click)="onToggleFilter()"
            type="button"
            aria-label="Filtrar solo pendientes e incidentes">
            Pendientes
          </button>
        </div>
      </div>
      <div class="card-body p-6">
        <!-- Vista de Cards (cuando la tabla se rompe) -->
        <div class="block xl:hidden space-y-4">
          @for (record of filteredRecords(); track record.machineId + record.date; let i = $index) {
            <div 
              class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
              [class.border-l-4]="record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO'"
              [class.border-warning]="record.status === 'PENDIENTE_TRABAJADOR'"
              [class.border-error]="record.status === 'INCIDENTE_REPORTADO'"
              [class.bg-warning/5]="record.status === 'PENDIENTE_TRABAJADOR'"
              [class.bg-error/5]="record.status === 'INCIDENTE_REPORTADO'"
              [style.animation-delay.ms]="i * 50"
              [style.animation-fill-mode]="'both'">
              <div class="card-body p-5">
                <!-- Header: Avatares y Estado -->
                <div class="flex items-start gap-4 mb-4">
                  <!-- Avatar Máquina -->
                  <div class="avatar placeholder shrink-0">
                    <div 
                      class="rounded-lg w-12 h-12 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center"
                      [class.bg-error/10]="record.status === 'INCIDENTE_REPORTADO'"
                      [class.border]="record.status === 'INCIDENTE_REPORTADO'"
                      [class.border-error/20]="record.status === 'INCIDENTE_REPORTADO'"
                      [class.bg-gradient-to-br]="record.status !== 'INCIDENTE_REPORTADO'"
                      [class.from-primary/20]="record.status !== 'INCIDENTE_REPORTADO'"
                      [class.to-primary/10]="record.status !== 'INCIDENTE_REPORTADO'">
                      <svg 
                        class="w-7 h-7"
                        [class.text-error]="record.status === 'INCIDENTE_REPORTADO'"
                        [class.text-primary]="record.status !== 'INCIDENTE_REPORTADO'"
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
                        <h3 class="font-bold text-base text-base-content truncate tooltip" [attr.data-tip]="'Máquina ' + record.machineId">
                          Máquina {{ record.machineId }}
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
                        @switch (record.status) {
                          @case ('PENDIENTE_TRABAJADOR') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/10">
                              <span class="w-1.5 h-1.5 rounded-full bg-warning mr-1.5 animate-pulse"></span>
                              Pendiente
                            </div>
                          }
                          @case ('INCIDENTE_REPORTADO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/10">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 mr-1"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                              Incidente
                            </div>
                          }
                          @case ('COMPLETO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/10">
                              Completo
                            </div>
                          }
                          @case ('NO_TRABAJADO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                              No Trabajado
                            </div>
                          }
                          @case ('DIA_NO_TRABAJADO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                              No Trabajado
                            </div>
                          }
                          @default {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                              No Trabajado
                            </div>
                          }
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
                    <div class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Fecha</div>
                    <div class="font-mono text-sm text-base-content/80">{{ formatDate(record.date) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Recaudación</div>
                    <div class="font-mono font-bold text-base-content tabular-nums text-sm">
                      @if (record.recaudacion) {
                        {{ formatCurrency(record.recaudacion) }}
                      } @else {
                        <span class="text-base-content/50 font-normal">N/A</span>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- Botón de Acción -->
                <div class="mt-2">
                  @if (record.status === 'INCIDENTE_REPORTADO') {
                    <a 
                      [routerLink]="['/registro-diario']"
                      [queryParams]="{
                        maquina: record.machineId,
                        chofer: record.driver,
                        fecha: record.date,
                        estado: record.status.toLowerCase(),
                        mode: 'edit'
                      }"
                      class="btn btn-xs h-9 w-full rounded-lg border-0 bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-200 gap-1.5 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                      </svg>
                      Resolver
                    </a>
                  } @else if (record.status === 'PENDIENTE_TRABAJADOR') {
                    <a 
                      [routerLink]="['/registro-diario']"
                      [queryParams]="{
                        maquina: record.machineId,
                        chofer: record.driver,
                        fecha: record.date,
                        estado: record.status.toLowerCase(),
                        mode: 'edit'
                      }"
                      class="btn btn-xs h-9 w-full rounded-lg border-0 bg-warning/15 text-warning-content hover:bg-warning hover:text-warning-content transition-all duration-200 gap-1.5 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                      </svg>
                      Completar
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
                      class="btn btn-xs h-9 w-full rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1.5 font-normal">
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
          } @empty {
            <div class="text-center py-12 animate-fade-in">
              <p class="text-base-content/50">No hay registros que coincidan con los filtros</p>
            </div>
          }
        </div>

        <!-- Vista de Tabla (Desktop - responsive con ajuste de espacio) -->
        <div class="hidden xl:block animate-table-enter">
          <table class="table w-full">
            <thead class="bg-base-50 text-base-content/50 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th class="py-4 pl-4 xl:pl-6 min-w-[160px]">Máquina</th>
                <th class="py-4 min-w-[140px]">Conductor</th>
                <th class="py-4 text-center min-w-[90px]">Fecha</th>
                <th class="py-4 text-center min-w-[100px]">Estado</th>
                <th class="py-4 text-right min-w-[110px]">Recaudación</th>
                <th class="py-4 pr-4 xl:pr-6 text-right min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              @for (record of filteredRecords(); track record.machineId + record.date; let i = $index) {
                <tr 
                  [class.border-l-4]="record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO'"
                  [class.border-warning]="record.status === 'PENDIENTE_TRABAJADOR'"
                  [class.border-error]="record.status === 'INCIDENTE_REPORTADO'"
                  class="hover:bg-base-50/50 transition-colors group border-b border-base-100 last:border-0 animate-table-row-enter"
                  [style.animation-delay.ms]="i * 30"
                  [style.animation-fill-mode]="'both'">
                  <td class="pl-4 xl:pl-6 font-medium min-w-0">
                    <div class="flex items-center gap-2 xl:gap-3">
                      <div class="avatar placeholder shrink-0">
                        <div 
                          class="rounded-lg w-8 h-8 xl:w-10 xl:h-10 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center"
                          [class.bg-error/10]="record.status === 'INCIDENTE_REPORTADO'"
                          [class.border]="record.status === 'INCIDENTE_REPORTADO'"
                          [class.border-error/20]="record.status === 'INCIDENTE_REPORTADO'"
                          [class.bg-gradient-to-br]="record.status !== 'INCIDENTE_REPORTADO'"
                          [class.from-primary/20]="record.status !== 'INCIDENTE_REPORTADO'"
                          [class.to-primary/10]="record.status !== 'INCIDENTE_REPORTADO'">
                          <svg 
                            class="w-5 h-5 xl:w-6 xl:h-6"
                            [class.text-error]="record.status === 'INCIDENTE_REPORTADO'"
                            [class.text-primary]="record.status !== 'INCIDENTE_REPORTADO'"
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
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-base-content truncate tooltip" [attr.data-tip]="'Máquina ' + record.machineId">Máquina {{ record.machineId }}</span>
                        <span class="text-[10px] text-base-content/40">Bus</span>
                      </div>
                    </div>
                  </td>
                  <td class="min-w-0">
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder shrink-0">
                        <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-6 h-6 rounded-full text-primary flex items-center justify-center border border-base-200">
                          <span class="text-[9px] font-bold">{{ getInitials(record.driver) }}</span>
                        </div>
                      </div>
                      <span class="font-medium text-base-content/80 truncate tooltip" [attr.data-tip]="record.driver">{{ record.driver }}</span>
                    </div>
                  </td>
                  <td class="text-center font-mono text-xs text-base-content/60 whitespace-nowrap">{{ formatDate(record.date) }}</td>
                  <td class="text-center">
                    @switch (record.status) {
                      @case ('PENDIENTE_TRABAJADOR') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/10">
                          <span class="w-1.5 h-1.5 rounded-full bg-warning mr-1.5 animate-pulse"></span>
                          <span class="hidden 2xl:inline">Pendiente</span>
                          <span class="2xl:hidden">Pend.</span>
                        </div>
                      }
                      @case ('INCIDENTE_REPORTADO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 mr-1"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                          <span class="hidden 2xl:inline">Incidente</span>
                          <span class="2xl:hidden">Inc.</span>
                        </div>
                      }
                      @case ('COMPLETO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/10">
                          <span class="hidden 2xl:inline">Completo</span>
                          <span class="2xl:hidden">OK</span>
                        </div>
                      }
                      @case ('NO_TRABAJADO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                          <span class="hidden 2xl:inline">No Trabajado</span>
                          <span class="2xl:hidden">N/A</span>
                        </div>
                      }
                      @case ('DIA_NO_TRABAJADO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                          <span class="hidden 2xl:inline">No Trabajado</span>
                          <span class="2xl:hidden">N/A</span>
                        </div>
                      }
                      @default {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                          <span class="hidden 2xl:inline">No Trabajado</span>
                          <span class="2xl:hidden">N/A</span>
                        </div>
                      }
                    }
                  </td>
                  <td class="text-right font-mono font-bold text-base-content tabular-nums text-xs xl:text-sm whitespace-nowrap">
                    @if (record.recaudacion) {
                      {{ formatCurrency(record.recaudacion) }}
                    } @else {
                      <span class="text-base-content/50">N/A</span>
                    }
                  </td>
                  <td class="pr-4 xl:pr-6 text-right">
                    @if (record.status === 'INCIDENTE_REPORTADO') {
                      <a 
                        [routerLink]="['/registro-diario']"
                        [queryParams]="{
                          maquina: record.machineId,
                          chofer: record.driver,
                          fecha: record.date,
                          estado: record.status.toLowerCase(),
                          mode: 'edit'
                        }"
                        class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg border-0 bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-200 gap-1 xl:gap-1.5 shadow-sm"
                        [attr.aria-label]="'Resolver incidente de ' + record.driver">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                        <span class="hidden 2xl:inline">Resolver</span>
                      </a>
                    } @else if (record.status === 'PENDIENTE_TRABAJADOR') {
                      <a 
                        [routerLink]="['/registro-diario']"
                        [queryParams]="{
                          maquina: record.machineId,
                          chofer: record.driver,
                          fecha: record.date,
                          estado: record.status.toLowerCase(),
                          mode: 'edit'
                        }"
                        class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg border-0 bg-warning/15 text-warning-content hover:bg-warning hover:text-warning-content transition-all duration-200 gap-1 xl:gap-1.5 shadow-sm"
                        [attr.aria-label]="'Completar registro pendiente de ' + record.driver">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                        </svg>
                        <span class="hidden 2xl:inline">Completar</span>
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
        
        <p class="text-xs text-base-content/70 mt-6">
          Los registros "PENDIENTE_TRABAJADOR" e "INCIDENTE_REPORTADO" generan alertas en tiempo real (RF-038, RF-039).
        </p>
      </div>
    </div>
  `,
  styles: [],
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

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return `${day} ${month}`;
  }
}

