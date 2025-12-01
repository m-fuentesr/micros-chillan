import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MachineService } from '../../../shared/services/machine.service';
import { DriverService } from '../../../shared/services/driver.service';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import type { DailyRecord } from '../../../shared/models/daily-record.models';
import { MachineGeneralInfo } from '../../../shared/machines/machine-general-info/machine-general-info';
import { MachineDailyRecords } from '../../../shared/machines/machine-daily-records/machine-daily-records';
import { MachineAssignmentHistory } from '../../../shared/machines/machine-assignment-history/machine-assignment-history';
import { MachineMaintenance } from '../../../shared/machines/machine-maintenance/machine-maintenance';
import { Machine } from '../../../shared/models/machine.models';
import { MachineDailyRecord, MachineDailyRecordFilters, MachineAssignment, MaintenanceRecord, MaintenanceFilters } from '../../../shared/models/machine-detail.models';
import { catchError, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { calculateMachineDocumentStatus } from '../../../shared/utils/document.utils';

@Component({
  selector: 'app-machine-detail',
  imports: [CommonModule, MachineDailyRecords, MachineAssignmentHistory, MachineMaintenance, RouterLink],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header principal -->
      <div class="flex justify-between items-start flex-wrap gap-4 animate-header-enter">
        <div>
          <h1 class="text-4xl font-bold mb-2 border-l-4 border-l-primary pl-4">
            Detalle de Máquina
          </h1>
          <p class="text-base-content/70">
            Información general, registros diarios, historial de asignaciones y mantenimiento de la máquina.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-circle btn-ghost"
          aria-label="Volver a la lista de máquinas"
          (click)="onBack()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>

      @if (machine()) {
        <!-- Tarjeta principal con info de máquina y acciones -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body flex flex-col gap-4">
            <div class="flex flex-col lg:flex-row gap-4 justify-between items-start">
              <div class="flex items-start gap-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-9 h-9">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <div class="space-y-1">
                  <div class="flex items-center gap-3 flex-wrap">
                    <h2 class="text-2xl font-bold text-base-content">
                      Máquina {{ machine()!.numero || '--' }}
                    </h2>
                    <span 
                      class="badge gap-1 text-white font-medium shadow-sm"
                      [class.badge-success]="machine()!.estado_operativo === 'Operativa'"
                      [class.badge-warning]="machine()!.estado_operativo === 'En Taller'"
                      [class.badge-error]="machine()!.estado_operativo === 'Inactiva'">
                      <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                      {{ machine()!.estado_operativo }}
                    </span>
                </div>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/70">
                    <span>{{ machine()!.marca || '--' }}</span>
                  <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span class="font-mono font-semibold">{{ machine()!.patente || '--' }}</span>
                    @if (machine()!['año']) {
                    <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span>{{ machine()!['año'] }}</span>
                  }
                </div>
              </div>
            </div>

              <div class="flex gap-2 w-full lg:w-auto">
                @if (!isEditingGeneral()) {
                  <button 
                    class="btn btn-outline btn-error btn-sm flex-1 lg:flex-none gap-2 hover:text-white"
                    (click)="onDelete()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
                    </svg>
                    Eliminar
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm flex-1 lg:flex-none gap-2 shadow-lg shadow-primary/20"
                    (click)="toggleEditGeneral()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                    </svg>
                    Editar Máquina
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn btn-outline btn-sm flex-1 lg:flex-none gap-2"
                    (click)="toggleEditGeneral()">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm flex-1 lg:flex-none gap-2 shadow-lg shadow-primary/20"
                    (click)="onSaveGeneral()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5ZM10.75 15.25a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5ZM3.5 10a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 3.5 10ZM16.5 10a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM2.22 7.22a.75.75 0 0 1 1.06 0l1.25 1.25a.75.75 0 0 1-1.06 1.06L2.22 8.28a.75.75 0 0 1 0-1.06ZM18.47 7.22a.75.75 0 0 1 0 1.06l-1.25 1.25a.75.75 0 1 1-1.06-1.06l1.25-1.25a.75.75 0 0 1 1.06 0ZM2.22 12.78a.75.75 0 0 1 0-1.06l1.25-1.25a.75.75 0 0 1 1.06 1.06L3.28 13.84a.75.75 0 0 1-1.06 0ZM18.47 12.78a.75.75 0 0 1-1.06 0l-1.25-1.25a.75.75 0 0 1 1.06-1.06l1.25 1.25a.75.75 0 0 1 0 1.06Z" />
                    </svg>
                    Guardar Cambios
                  </button>
                }
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-t border-base-200 pt-3">
              <div class="tabs -mb-[1px]">
                <button
                  class="tab tab-bordered px-6 h-10 font-medium"
                  [class.tab-active]="activeTab() === 'general'"
                  [class.btn-disabled]="isEditingGeneral() && activeTab() !== 'general'"
                  [attr.disabled]="isEditingGeneral() && activeTab() !== 'general' ? '' : null"
                  (click)="setActiveTab('general')">
                  General
                </button>
                <button
                  class="tab tab-bordered px-6 h-10 font-medium"
                  [class.tab-active]="activeTab() === 'records'"
                  [class.btn-disabled]="isEditingGeneral()"
                  [attr.disabled]="isEditingGeneral() ? '' : null"
                  (click)="setActiveTab('records')">
                  Registros Diarios
                </button>
                <button
                  class="tab tab-bordered px-6 h-10 font-medium"
                  [class.tab-active]="activeTab() === 'assignments'"
                  [class.btn-disabled]="isEditingGeneral()"
                  [attr.disabled]="isEditingGeneral() ? '' : null"
                  (click)="setActiveTab('assignments')">
                  Historial
                </button>
                <button
                  class="tab tab-bordered px-6 h-10 font-medium"
                  [class.tab-active]="activeTab() === 'maintenance'"
                  [class.btn-disabled]="isEditingGeneral()"
                  [attr.disabled]="isEditingGeneral() ? '' : null"
                  (click)="setActiveTab('maintenance')">
                  Mantenimiento
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido pestaña General -->
        @if (activeTab() === 'general') {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">

            <!-- Documentación -->
            <div class="card bg-base-100 shadow-sm border border-base-200 md:col-span-2 xl:col-span-1 order-2 xl:order-3 h-full">
              <div class="card-header px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-50 rounded-t-2xl">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z" clip-rule="evenodd" />
                  </svg>
                  Documentación
                </h3>
                <a
                  [routerLink]="['/maquinas', machine()?.id, 'editar']"
                  [queryParams]="{ section: 'docs' }" 
                  class="btn btn-xs btn-ghost text-base-content/50 hover:text-primary">
                  Editar
                </a>
              </div>

              <div class="p-4 space-y-3">
                <!-- Revisión técnica -->
                <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-base-50/30">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    [ngClass]="{
                      'bg-error/5 text-error border-error/20': docStatus().revision_tecnica?.estado === 'error',
                      'bg-warning/5 text-warning border-warning/20': docStatus().revision_tecnica?.estado === 'warning',
                      'bg-success/5 text-success border-success/20': docStatus().revision_tecnica?.estado === 'ok'
                    }">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Revisión Técnica
                      </p>
                      @if (!isEditingGeneral() && docStatus().revision_tecnica?.estado === 'error') {
                        <span class="badge badge-xs badge-error badge-outline">Vencida</span>
                      }
                    </div>
                    @if (isEditingGeneral()) {
                      <input
                        type="date"
                        class="input input-sm w-full mt-1"
                        [value]="editRevisionTecnica()"
                        (input)="editRevisionTecnica.set($any($event.target).value)">
                    } @else {
                      <p class="font-semibold text-base-content">
                        {{ formatDocumentDate(docStatus().revision_tecnica?.fecha ?? null) }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Permiso de circulación -->
                <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-base-50/30">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    [ngClass]="{
                      'bg-error/5 text-error border-error/20': docStatus().permiso_circulacion?.estado === 'error',
                      'bg-warning/5 text-warning border-warning/20': docStatus().permiso_circulacion?.estado === 'warning',
                      'bg-success/5 text-success border-success/20': docStatus().permiso_circulacion?.estado === 'ok'
                    }">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Permiso Circulación
                      </p>
                      @if (!isEditingGeneral() && docStatus().permiso_circulacion?.estado === 'error') {
                        <span class="badge badge-xs badge-error badge-outline">Vencido</span>
                      }
                    </div>
                    @if (isEditingGeneral()) {
                      <input
                        type="date"
                        class="input input-sm w-full mt-1"
                        [value]="editPermisoCirculacion()"
                        (input)="editPermisoCirculacion.set($any($event.target).value)">
                    } @else {
                      <p class="font-semibold text-base-content">
                        {{ formatDocumentDate(docStatus().permiso_circulacion?.fecha ?? null) }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Seguro obligatorio -->
                <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-base-50/30">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    [ngClass]="{
                      'bg-error/5 text-error border-error/20': docStatus().seguro_obligatorio?.estado === 'error',
                      'bg-warning/5 text-warning border-warning/20': docStatus().seguro_obligatorio?.estado === 'warning',
                      'bg-success/5 text-success border-success/20': docStatus().seguro_obligatorio?.estado === 'ok'
                    }">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Seguro SOAP
                      </p>
                      @if (!isEditingGeneral() && docStatus().seguro_obligatorio?.estado === 'ok') {
                        <span class="badge badge-xs badge-success badge-outline">Vigente</span>
                      }
                    </div>
                    @if (isEditingGeneral()) {
                      <input
                        type="date"
                        class="input input-sm w-full mt-1"
                        [value]="editSeguroObligatorio()"
                        (input)="editSeguroObligatorio.set($any($event.target).value)">
                    } @else {
                      <p class="font-semibold text-base-content">
                        {{ formatDocumentDate(docStatus().seguro_obligatorio?.fecha ?? null) }}
                      </p>
                    }
                  </div>
                </div>
            </div>
                </div>
                
            <!-- Ficha técnica -->
            <div class="card bg-base-100 shadow-sm border border-base-200 md:col-span-1 h-full order-1">
                <div class="card-body p-6">
                <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Ficha Técnica
                </h3>

                <div class="grid grid-cols-1 gap-4">
                  <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                    <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                      Marca / Modelo
                    </span>
                    @if (isEditingGeneral()) {
                      <input
                        type="text"
                        class="input input-sm w-full mt-1 font-bold"
                        [value]="editMarca()"
                        (input)="editMarca.set($any($event.target).value)"
                        placeholder="Marca / Modelo">
                    } @else {
                      <div class="font-bold text-lg text-base-content">
                        {{ machine()?.marca || '--' }}
                      </div>
                    }
                  </div>
                    
                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-base-200/50 p-3 rounded-xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        Año
                      </span>
                      @if (isEditingGeneral()) {
                        <input
                          type="number"
                          class="input input-sm w-full mt-1 font-bold"
                          [value]="editAnio() ?? ''"
                          (input)="editAnio.set($any($event.target).value ? Number($any($event.target).value) : null)"
                          placeholder="Año"
                          min="1900"
                          max="2100">
                      } @else {
                        <div class="font-bold text-base-content">
                          {{ machine()!['año'] || '--' }}
                        </div>
                      }
                    </div>
                    <div class="bg-base-200/50 p-3 rounded-xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        Patente
                      </span>
                      @if (isEditingGeneral()) {
                        <input
                          type="text"
                          class="input input-sm w-full mt-1 font-mono font-bold"
                          [value]="editPatente()"
                          (input)="editPatente.set($any($event.target).value)"
                          placeholder="Patente">
                      } @else {
                        <div class="font-mono font-bold text-base-content">
                          {{ machine()?.patente || '--' }}
                        </div>
                      }
                    </div>
                  </div>
                    
                  <div class="bg-base-200/50 p-4 rounded-xl border border-base-200 flex justify-between items-center">
                    <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
                      Estado
                    </span>
                    @if (isEditingGeneral()) {
                      <select
                        class="select select-sm"
                        [value]="editEstadoOperativo()"
                        (change)="editEstadoOperativo.set($any($event.target).value)">
                        <option value="Operativa">Operativa</option>
                        <option value="En Taller">En Taller</option>
                        <option value="Inactiva">Inactiva</option>
                      </select>
                    } @else {
                      <span
                        class="badge font-bold border-0 py-3"
                        [class.bg-success/20]="machine()?.estado_operativo === 'Operativa'"
                        [class.text-success]="machine()?.estado_operativo === 'Operativa'"
                        [class.bg-warning/20]="machine()?.estado_operativo === 'En Taller'"
                        [class.text-warning]="machine()?.estado_operativo === 'En Taller'">
                        {{ machine()?.estado_operativo }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Conductor responsable -->
            <div class="card bg-base-100 shadow-sm border border-base-200 md:col-span-1 h-full order-3 xl:order-2 overflow-hidden">
              <div class="h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"></div>

              <div class="card-body p-6 pt-0 -mt-12 text-center flex flex-col items-center">
                @if (machine()!.chofer_actual) {
                  <div class="avatar mb-4">
                    <div class="w-24 rounded-full ring ring-base-100 ring-offset-base-100 ring-offset-2 shadow-xl bg-neutral text-neutral-content flex items-center justify-center text-3xl font-bold">
                            {{ getInitials(machine()!.chofer_actual!.nombre_completo) }}
                          </div>
                        </div>

                  <h4 class="text-xl font-bold text-base-content">
                    {{ machine()!.chofer_actual!.nombre_completo }}
                  </h4>
                  <p class="text-sm font-medium text-primary mb-1">
                    Conductor Responsable
                  </p>
                  <p class="text-xs text-base-content/50 mb-6">
                    Asignado el 01 Oct 2025
                  </p>

                  @if (isEditingGeneral()) {
                    <div class="w-full mt-2 text-left">
                      <label class="label py-1">
                        <span class="label-text text-xs font-semibold text-base-content/60">
                          Cambiar conductor responsable
                        </span>
                      </label>
                      <select
                        class="select select-sm w-full max-w-xs"
                        [value]="editChoferId() ?? ''"
                        (change)="editChoferId.set($any($event.target).value ? Number($any($event.target).value) : null)">
                        <option value="">Sin asignar</option>
                        @for (c of choferes(); track c.id) {
                          <option [value]="c.id">
                            {{ c.nombre_completo }}
                          </option>
                        }
                      </select>
                    </div>
                  }

                  <div class="w-full mt-auto"></div>
                  } @else {
                  <div class="avatar mb-4 placeholder">
                    <div class="w-24 rounded-full bg-base-200 ring ring-base-100 ring-offset-2 flex items-center justify-center text-base-content/20">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          </div>
                        </div>
                  <h4 class="text-lg font-bold text-base-content/70">
                    Sin Asignar
                  </h4>
                  <p class="text-sm text-base-content/50 mb-6 px-4">
                    Esta máquina no tiene conductor responsable actualmente.
                  </p>
                  <button
                    class="btn btn-primary w-full shadow-lg shadow-primary/20"
                    [routerLink]="['/maquinas', machine()?.id, 'editar']">
                    Asignar Conductor
                  </button>
                }
              </div>
            </div>
          </div>
      }

        <!-- Registros diarios -->
      @if (activeTab() === 'records' && loadedTabs().has('records')) {
        <app-machine-daily-records
          [records]="dailyRecords()"
          [choferes]="choferes()"
          [filters]="recordFilters()"
          (filterChange)="onRecordFilterChange($event)"
          (viewDetail)="onViewRecordDetail($event)">
        </app-machine-daily-records>
      }

        <!-- Historial de asignaciones -->
      @if (activeTab() === 'assignments' && loadedTabs().has('assignments')) {
        <app-machine-assignment-history
          [assignments]="assignments()">
        </app-machine-assignment-history>
      }

        <!-- Mantenimiento -->
      @if (activeTab() === 'maintenance' && loadedTabs().has('maintenance')) {
        @if (machineId()) {
          <app-machine-maintenance
            [machineId]="machineId()!"
            [records]="maintenanceRecords()"
            [availableItems]="maintenanceItems()"
            [filters]="maintenanceFilters()"
            (recordAdded)="onMaintenanceRecordAdded($event)"
            (recordDeleted)="onMaintenanceRecordDeleted($event)"
            (filterChange)="onMaintenanceFilterChange($event)">
          </app-machine-maintenance>
        }
        }
      } @else {
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <span class="loading loading-spinner loading-sm mr-2"></span>
            Cargando información de la máquina...
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private machineService = inject(MachineService);
  private driverService = inject(DriverService);
  private dailyRecordService = inject(DailyRecordService);

  isEditingGeneral = signal(false);
  activeTab = signal<'general' | 'records' | 'assignments' | 'maintenance'>('general');
  recordFilters = signal<MachineDailyRecordFilters>({});
  maintenanceFilters = signal<MaintenanceFilters>({});
  maintenanceRecords = signal<MaintenanceRecord[]>([]);
  maintenanceItems = signal<string[]>(['Neumáticos', 'Aceite Motor', 'Filtros', 'Reparación Frenos']);

  // Valores editables temporales
  editMarca = signal<string>('');
  editAnio = signal<number | null>(null);
  editPatente = signal<string>('');
  editEstadoOperativo = signal<string>('');
  editRevisionTecnica = signal<string>('');
  editPermisoCirculacion = signal<string>('');
  editSeguroObligatorio = signal<string>('');
  editChoferId = signal<number | null>(null);

  // Cargar máquina - usando route.params para reactividad
  machineIdParam = toSignal(
    this.route.params.pipe(
      map(params => params['id'] ? Number(params['id']) : null)
    ),
    { initialValue: null }
  );

  machineId = computed(() => this.machineIdParam());

  machineData = toSignal(
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'] ? Number(params['id']) : null;
        if (!id) {
          return of<Machine | null>(null);
        }
        return this.machineService.getMachineById(id).pipe(
          catchError(() => of<Machine | null>(null))
        );
      })
    ),
    { initialValue: null }
  );

  machine = computed(() => this.machineData());

  // Estados de documentos
  docStatus = computed(() => {
    const m = this.machine();
    if (!m) {
      return {
        revision_tecnica: undefined,
        permiso_circulacion: undefined,
        seguro_obligatorio: undefined
      };
    }
    return calculateMachineDocumentStatus(m, 30);
  });

  // Cargar choferes
  choferesData = toSignal(
    this.driverService.getDrivers({ estado: 'activo' }).pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  choferes = computed(() => this.choferesData() ?? []);

  // Registros diarios (mock por ahora)
  dailyRecords = signal<MachineDailyRecord[]>([]);

  // Asignaciones (mock por ahora)
  assignments = signal<MachineAssignment[]>([]);
  
  // Rastrear qué tabs han sido cargados
  loadedTabs = signal<Set<string>>(new Set(['general'])); // 'general' siempre se carga

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
  }

  toggleEditGeneral(): void {
    const isEditing = !this.isEditingGeneral();
    
    if (isEditing) {
      // Cambiar a la tab 'general' antes de activar el modo edición
      this.activeTab.set('general');
      
      // Inicializar valores editables con los valores actuales
      const m = this.machine();
      if (m) {
        this.editMarca.set(m.marca || '');
        this.editAnio.set(m['año'] || null);
        this.editPatente.set(m.patente || '');
        this.editEstadoOperativo.set(m.estado_operativo || '');
        this.editRevisionTecnica.set(m.documentos?.revision_tecnica || '');
        this.editPermisoCirculacion.set(m.documentos?.permiso_circulacion || '');
        this.editSeguroObligatorio.set(m.documentos?.seguro_obligatorio || '');
        this.editChoferId.set(m.chofer_actual?.id || null);
      }
    }
    
    this.isEditingGeneral.set(isEditing);
  }

  onSaveGeneral(): void {
    const machineId = this.machineId();
    if (!machineId) return;

    const choferId = this.editChoferId();
    const estado = this.editEstadoOperativo() as 'Operativa' | 'En Taller' | 'Inactiva' | undefined;
    
    const updateData: Partial<Machine> = {
      marca: this.editMarca(),
      'año': this.editAnio() ?? undefined,
      patente: this.editPatente(),
      estado_operativo: estado,
      documentos: {
        revision_tecnica: this.editRevisionTecnica() || undefined,
        permiso_circulacion: this.editPermisoCirculacion() || undefined,
        seguro_obligatorio: this.editSeguroObligatorio() || undefined
      }
    };

    // Agregar chofer_actual_id solo si existe (el backend puede esperar este campo)
    if (choferId !== null) {
      (updateData as any).chofer_actual_id = choferId;
    }

    this.machineService.updateMachine(machineId, updateData)
      .pipe(
        catchError((error) => {
          console.error('Error al actualizar máquina:', error);
          alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
          return of(null);
        })
      )
      .subscribe((updatedMachine) => {
        if (updatedMachine) {
          // Recargar la máquina actualizada
          this.machineService.getMachineById(machineId).subscribe((machine) => {
            // El signal se actualizará automáticamente a través de machineData
          });
          this.isEditingGeneral.set(false);
          alert('Cambios guardados correctamente.');
        }
      });
  }

  setActiveTab(tab: 'general' | 'records' | 'assignments' | 'maintenance'): void {
    // No permitir cambiar de tab si se está editando
    if (this.isEditingGeneral()) {
      return;
    }
    
    this.activeTab.set(tab);
    
    // Cargar datos solo si el tab no ha sido cargado antes
    const loaded = this.loadedTabs();
    if (!loaded.has(tab)) {
      loaded.add(tab);
      this.loadedTabs.set(new Set(loaded));
      
      // Cargar datos según el tab
      switch (tab) {
        case 'records':
          this.loadDailyRecords();
          break;
        case 'assignments':
          this.loadAssignments();
          break;
        case 'maintenance':
          this.loadMaintenanceRecords();
          break;
      }
    }
  }

  onEditDocs(): void {
    // Navegar a edición de documentación
    this.router.navigate(['/maquinas', this.machineId(), 'editar'], {
      queryParams: { section: 'documentation' }
    });
  }

  onDelete(): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta máquina?')) {
      return;
    }

    if (this.machineId()) {
      this.machineService.deleteMachine(this.machineId()!)
        .pipe(
          catchError((error) => {
            console.error('Error al eliminar máquina:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          this.router.navigate(['/maquinas']);
        });
    }
  }

  onRecordFilterChange(filters: MachineDailyRecordFilters): void {
    this.recordFilters.set(filters);
    // Aquí podrías recargar los registros con los nuevos filtros
    this.loadDailyRecords();
  }

  onViewRecordDetail(record: MachineDailyRecord): void {
    // Navegar al detalle del registro
    this.router.navigate(['/registro-diario', record.id]);
  }

  private loadDailyRecords(): void {
    const machine = this.machine();
    if (!machine) return;

    const filters = this.recordFilters();
    
    // Obtener registros de la máquina
    this.dailyRecordService.getDailyRecords({
      maquina_id: machine.id,
      chofer_id: filters.chofer_id || undefined,
      desde: filters.desde || undefined,
      hasta: filters.hasta || undefined
    }).subscribe({
      next: (response) => {
        const records = response.datos || [];
        
        // Mapear DailyRecord a MachineDailyRecord
        const machineRecords: MachineDailyRecord[] = records.map((record: DailyRecord) => ({
          id: parseInt(record.id),
          fecha: record.fecha,
          chofer: record.chofer_nombre || '',
          chofer_id: record.chofer_id,
          recaudado: record.recaudado || 0,
          diesel: record.costo_diesel || 0,
          observaciones: record.observaciones || null,
          estado: record.estado
        }));

        // Ordenar según filtro
        if (filters.orden === 'mas_antiguo') {
          machineRecords.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        } else {
          // Por defecto: más reciente primero
          machineRecords.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        }

        this.dailyRecords.set(machineRecords);
      },
      error: (error) => {
        console.error('Error al cargar registros diarios:', error);
        this.dailyRecords.set([]);
      }
    });
  }

  private loadAssignments(): void {
    // Mock data - en producción vendría del servicio
    const machine = this.machine();
    if (!machine) return;

    this.assignments.set([
      {
        id: 1,
        chofer: {
          id: 1,
          nombre_completo: 'Juan Pérez'
        },
        fecha_inicio: '2025-10-01',
        fecha_fin: null,
        duracion_dias: 51,
        estado: 'activa'
      },
      {
        id: 2,
        chofer: {
          id: 2,
          nombre_completo: 'Laura Diaz'
        },
        fecha_inicio: '2025-08-01',
        fecha_fin: '2025-09-30',
        duracion_dias: 60,
        estado: 'cerrada'
      },
      {
        id: 3,
        chofer: {
          id: 3,
          nombre_completo: 'Pedro López'
        },
        fecha_inicio: '2025-05-01',
        fecha_fin: '2025-07-31',
        duracion_dias: 91,
        estado: 'cerrada'
      }
    ]);
  }

  private loadMaintenanceRecords(): void {
    // Mock data - en producción vendría del servicio
    const machine = this.machine();
    if (!machine) return;

    this.maintenanceRecords.set([
      {
        id: 1,
        maquina_id: machine.id,
        item: 'Neumáticos',
        costo: 450000,
        numero_factura: '001-00001234',
        categoria: 'preventivo',
        fecha: '2025-11-10'
      },
      {
        id: 2,
        maquina_id: machine.id,
        item: 'Aceite Motor',
        costo: 85000,
        numero_factura: '001-00001233',
        categoria: 'preventivo',
        fecha: '2025-11-05'
      },
      {
        id: 3,
        maquina_id: machine.id,
        item: 'Filtros',
        costo: 120000,
        numero_factura: '001-00001232',
        categoria: 'preventivo',
        fecha: '2025-10-28'
      },
      {
        id: 4,
        maquina_id: machine.id,
        item: 'Reparación Frenos',
        costo: 280000,
        numero_factura: '001-00001231',
        categoria: 'correctivo',
        fecha: '2025-10-15'
      }
    ]);
  }

  onMaintenanceRecordAdded(record: MaintenanceRecord): void {
    const current = this.maintenanceRecords();
    this.maintenanceRecords.set([...current, record]);
    // En producción, aquí se enviaría al backend
  }

  onMaintenanceRecordDeleted(id: number): void {
    const current = this.maintenanceRecords();
    this.maintenanceRecords.set(current.filter(r => r.id !== id));
    // En producción, aquí se enviaría al backend
  }

  onMaintenanceFilterChange(filters: MaintenanceFilters): void {
    this.maintenanceFilters.set(filters);
  }

  // Métodos auxiliares para el template
  getInitials(name: string): string {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDocumentDate(date: string | null): string {
    if (!date) return 'Sin fecha';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  }

  getDaysAgo(date: string | null): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - d.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Hace 1 día';
      return `Hace ${diffDays} días`;
    } catch {
      return '';
    }
  }

  onBack(): void {
    this.router.navigate(['/maquinas']);
  }
}

