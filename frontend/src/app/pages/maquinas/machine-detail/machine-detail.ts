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
    <div class="min-h-screen bg-base-200 pb-12 animate-page-enter">
      <!-- Breadcrumbs -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div class="text-sm breadcrumbs text-base-content/60">
          <ul>
            <li><a routerLink="/dashboard">Inicio</a></li>
            <li><a routerLink="/maquinas">Máquinas</a></li>
            <li class="font-medium text-base-content">Máquina {{ machine()?.numero || '--' }}</li>
          </ul>
        </div>
      </div>

      <!-- Hero Card Unificada -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div class="card bg-base-100 shadow-sm border border-base-200 overflow-visible">
          <div class="card-body p-0">
            <!-- Header de la Hero Card -->
            <div class="p-6 lg:p-8 flex flex-col lg:flex-row gap-6 justify-between items-start">
              <!-- Información Principal -->
              <div class="flex items-start gap-5">
                <!-- Icono de Máquina -->
                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>

                <!-- Título y Metadatos -->
                <div class="space-y-1">
                  <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-base-content">Máquina {{ machine()?.numero || '--' }}</h1>
                    @if (machine()) {
                      <span 
                        class="badge gap-1 text-white font-medium shadow-sm"
                        [class.badge-success]="machine()!.estado_operativo === 'Operativa'"
                        [class.badge-warning]="machine()!.estado_operativo === 'En Taller'"
                        [class.badge-error]="machine()!.estado_operativo === 'Inactiva'">
                        <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                        {{ machine()!.estado_operativo }}
                      </span>
                    }
                  </div>

                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70">
                    <span class="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 opacity-70">
                        <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 6.75a.75.75 0 0 1 1.5 0v2.546l.943-1.048a.75.75 0 1 1 1.114 1.004l-2.25 2.5a.75.75 0 0 1-1.114 0l-2.25-2.5a.75.75 0 1 1 1.114-1.004l.943 1.048V8.75Z" clip-rule="evenodd" />
                      </svg>
                      {{ machine()?.marca || '--' }}
                    </span>
                    <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span class="font-mono font-semibold">{{ machine()?.patente || '--' }}</span>
                    @if (machine()?.['año']) {
                      <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                      <span>{{ machine()!['año'] }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Botones de Acción -->
              <div class="flex gap-2 w-full lg:w-auto">
                <button 
                  class="btn btn-outline btn-error btn-sm flex-1 lg:flex-none gap-2 hover:text-white"
                  (click)="onDelete()">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
                  </svg>
                  Eliminar
                </button>
          <a 
            [routerLink]="['/maquinas', machine()?.id, 'editar']"
                  class="btn btn-primary btn-sm flex-1 lg:flex-none gap-2 shadow-lg shadow-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                  </svg>
                  Editar Máquina
                </a>
        </div>
      </div>

            <!-- Tabs Integrados -->
            <div class="px-6 border-t border-base-200">
              <div class="tabs -mb-[1px]">
        <button
                  class="tab tab-bordered px-6 h-12 font-medium"
          [class.tab-active]="activeTab() === 'general'"
                  [class.border-primary]="activeTab() === 'general'"
                  [class.text-primary]="activeTab() === 'general'"
                  [class.text-base-content/60]="activeTab() !== 'general'"
                  [class.hover:text-base-content]="activeTab() !== 'general'"
          (click)="setActiveTab('general')">
                  General
        </button>
        <button
                  class="tab tab-bordered px-6 h-12 font-medium text-base-content/60 hover:text-base-content"
          [class.tab-active]="activeTab() === 'records'"
                  [class.border-primary]="activeTab() === 'records'"
                  [class.text-primary]="activeTab() === 'records'"
          (click)="setActiveTab('records')">
          Registros Diarios
        </button>
        <button
                  class="tab tab-bordered px-6 h-12 font-medium text-base-content/60 hover:text-base-content"
          [class.tab-active]="activeTab() === 'assignments'"
                  [class.border-primary]="activeTab() === 'assignments'"
                  [class.text-primary]="activeTab() === 'assignments'"
          (click)="setActiveTab('assignments')">
                  Historial
        </button>
        <button
                  class="tab tab-bordered px-6 h-12 font-medium text-base-content/60 hover:text-base-content"
          [class.tab-active]="activeTab() === 'maintenance'"
                  [class.border-primary]="activeTab() === 'maintenance'"
                  [class.text-primary]="activeTab() === 'maintenance'"
          (click)="setActiveTab('maintenance')">
                  Mantenimiento
        </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido de Tabs -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        @if (activeTab() === 'general' && machine()) {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Columna Izquierda (2/3) -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Tarjeta de Ficha Técnica -->
                <div class="card bg-base-100 shadow-sm border border-base-200">
                  <div class="card-header p-6 border-b border-base-200 flex justify-between items-center">
                    <h2 class="card-title text-lg">Ficha Técnica</h2>
                  </div>
                  
                  <div class="card-body p-6">
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 content-start">
                      <!-- Marca -->
                      <div>
                        <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">Marca</span>
                        <div class="font-semibold text-base-content truncate tooltip" [attr.data-tip]="machine()!.marca">
                          {{ machine()!.marca || '--' }}
                        </div>
                      </div>
                      
                      <!-- Año -->
                      <div>
                        <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">Año</span>
                        <div class="font-semibold text-base-content">
                          {{ machine()!['año'] || '--' }}
                        </div>
                      </div>
                      
                      <!-- Patente (Estilo Placa) -->
                      <div>
                        <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">Patente</span>
                        <div
                          class="font-mono font-bold text-lg text-base-content tracking-wide bg-base-200/50 px-2 py-0.5 rounded inline-block border border-base-300 break-all">
                          {{ machine()!.patente || '--' }}
                        </div>
                      </div>
                      
                      <!-- Estado Operativo -->
                      <div>
                        <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">Estado Operativo</span>
                        <span
                          class="badge text-xs"
                          [class.badge-success]="machine()!.estado_operativo === 'Operativa'"
                          [class.badge-warning]="machine()!.estado_operativo === 'En Taller'"
                          [class.badge-error]="machine()!.estado_operativo === 'Inactiva'">
                          {{ machine()!.estado_operativo }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tarjeta de Conductor Responsable -->
                <div class="card bg-base-100 shadow-sm border border-base-200">
                  <div class="card-body p-6">
                    <h3 class="text-sm font-bold text-base-content/40 uppercase tracking-widest mb-4">Conductor Responsable</h3>
                    @if (machine()!.chofer_actual) {
                      <div class="flex items-center gap-4 p-4 bg-base-200/50 rounded-xl border border-base-200">
                        <div class="avatar">
                          <div class="w-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <div class="bg-neutral text-neutral-content w-full h-full flex items-center justify-center font-bold text-xl">
                              {{ getInitials(machine()!.chofer_actual!.nombre_completo) }}
                            </div>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-lg font-bold text-base-content truncate">{{ machine()!.chofer_actual!.nombre_completo }}</h4>
                          <p class="text-sm text-base-content/60">Asignado actualmente</p>
                        </div>
                      </div>
                    } @else {
                      <div class="flex items-center gap-4 p-4 bg-base-200/50 rounded-xl border border-base-200">
                        <div class="avatar">
                          <div class="w-14 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-2">
                            <div class="bg-base-300 text-base-content/50 w-full h-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div class="flex-1">
                          <h4 class="text-lg font-bold text-base-content/50">Sin asignar</h4>
                          <p class="text-sm text-base-content/40">No hay conductor asignado</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Columna Derecha (1/3) - Documentación -->
              <div class="lg:col-span-1">
                <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
                  <div class="card-header p-6 border-b border-base-200 flex justify-between items-center">
                    <div>
                      <h3 class="font-bold text-lg">Documentación</h3>
                      <p class="text-xs text-base-content/60 mt-1">
                        Control de fechas de Revisión Técnica, Permiso de Circulación y Seguro (RF-031).
                      </p>
                    </div>
                  </div>
                  <div class="card-body p-0">
                    <!-- Revisión Técnica -->
                    @if (docStatus().revision_tecnica) {
                      <div class="p-4 border-b border-base-200 flex gap-4 items-start group hover:bg-base-50 transition-colors relative overflow-hidden"
                           [class.border-b-base-200]="docStatus().permiso_circulacion || docStatus().seguro_obligatorio">
                        <div 
                          class="absolute left-0 top-0 bottom-0 w-1"
                          [class.bg-error]="docStatus().revision_tecnica!.estado === 'error'"
                          [class.bg-warning]="docStatus().revision_tecnica!.estado === 'warning'"
                          [class.bg-success]="docStatus().revision_tecnica!.estado === 'ok'">
                        </div>
                        <div 
                          class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          [class.bg-error/10]="docStatus().revision_tecnica!.estado === 'error'"
                          [class.text-error]="docStatus().revision_tecnica!.estado === 'error'"
                          [class.bg-warning/10]="docStatus().revision_tecnica!.estado === 'warning'"
                          [class.text-warning]="docStatus().revision_tecnica!.estado === 'warning'"
                          [class.bg-success/10]="docStatus().revision_tecnica!.estado === 'ok'"
                          [class.text-success]="docStatus().revision_tecnica!.estado === 'ok'">
                          @if (docStatus().revision_tecnica!.estado === 'error') {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                            </svg>
                          } @else if (docStatus().revision_tecnica!.estado === 'warning') {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                            </svg>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
                            </svg>
                          }
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm text-base-content truncate">Revisión Técnica</h4>
                          @if (docStatus().revision_tecnica!.estado === 'error') {
                            <p class="text-xs text-error font-medium">{{ formatDocumentDate(docStatus().revision_tecnica!.fecha) }}</p>
                            <p class="text-[10px] text-base-content/50 mt-0.5">{{ getDaysAgo(docStatus().revision_tecnica!.fecha) }}</p>
                          } @else if (docStatus().revision_tecnica!.estado === 'warning') {
                            <p class="text-xs text-warning font-medium">{{ formatDocumentDate(docStatus().revision_tecnica!.fecha) }}</p>
                            <p class="text-[10px] text-base-content/50 mt-0.5">{{ docStatus().revision_tecnica!.dias_restantes }} días restantes</p>
                          } @else {
                            <p class="text-xs text-success font-medium">{{ formatDocumentDate(docStatus().revision_tecnica!.fecha) }}</p>
                          }
                        </div>
                      </div>
                    }

                    <!-- Permiso de Circulación -->
                    @if (docStatus().permiso_circulacion) {
                      <div class="p-4 border-b border-base-200 flex gap-4 items-start group hover:bg-base-50 transition-colors relative overflow-hidden"
                           [class.border-b-base-200]="docStatus().seguro_obligatorio">
                        <div 
                          class="absolute left-0 top-0 bottom-0 w-1"
                          [class.bg-error]="docStatus().permiso_circulacion!.estado === 'error'"
                          [class.bg-warning]="docStatus().permiso_circulacion!.estado === 'warning'"
                          [class.bg-success]="docStatus().permiso_circulacion!.estado === 'ok'">
                        </div>
                        <div 
                          class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          [class.bg-error/10]="docStatus().permiso_circulacion!.estado === 'error'"
                          [class.text-error]="docStatus().permiso_circulacion!.estado === 'error'"
                          [class.bg-warning/10]="docStatus().permiso_circulacion!.estado === 'warning'"
                          [class.text-warning]="docStatus().permiso_circulacion!.estado === 'warning'"
                          [class.bg-success/10]="docStatus().permiso_circulacion!.estado === 'ok'"
                          [class.text-success]="docStatus().permiso_circulacion!.estado === 'ok'">
                          @if (docStatus().permiso_circulacion!.estado === 'error') {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" />
                            </svg>
                          } @else if (docStatus().permiso_circulacion!.estado === 'warning') {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                            </svg>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
                            </svg>
                          }
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm text-base-content truncate">Permiso Circulación</h4>
                          @if (docStatus().permiso_circulacion!.estado === 'error') {
                            <p class="text-xs text-error font-medium">{{ formatDocumentDate(docStatus().permiso_circulacion!.fecha) }}</p>
                            <p class="text-[10px] text-base-content/50 mt-0.5">{{ getDaysAgo(docStatus().permiso_circulacion!.fecha) }}</p>
                          } @else if (docStatus().permiso_circulacion!.estado === 'warning') {
                            <p class="text-xs text-warning font-medium">{{ formatDocumentDate(docStatus().permiso_circulacion!.fecha) }}</p>
                            <p class="text-[10px] text-base-content/50 mt-0.5">{{ docStatus().permiso_circulacion!.dias_restantes }} días restantes</p>
                          } @else {
                            <p class="text-xs text-success font-medium">{{ formatDocumentDate(docStatus().permiso_circulacion!.fecha) }}</p>
                          }
                        </div>
                      </div>
                    }

                    <!-- Seguro Obligatorio -->
                    @if (docStatus().seguro_obligatorio) {
                      <div class="p-4 flex gap-4 items-start group hover:bg-base-50 transition-colors relative overflow-hidden">
                        <div 
                          class="absolute left-0 top-0 bottom-0 w-1"
                          [class.bg-error]="docStatus().seguro_obligatorio!.estado === 'error'"
                          [class.bg-warning]="docStatus().seguro_obligatorio!.estado === 'warning'"
                          [class.bg-success]="docStatus().seguro_obligatorio!.estado === 'ok'">
                        </div>
                        <div 
                          class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          [class.bg-error/10]="docStatus().seguro_obligatorio!.estado === 'error'"
                          [class.text-error]="docStatus().seguro_obligatorio!.estado === 'error'"
                          [class.bg-warning/10]="docStatus().seguro_obligatorio!.estado === 'warning'"
                          [class.text-warning]="docStatus().seguro_obligatorio!.estado === 'warning'"
                          [class.bg-success/10]="docStatus().seguro_obligatorio!.estado === 'ok'"
                          [class.text-success]="docStatus().seguro_obligatorio!.estado === 'ok'">
                          @if (docStatus().seguro_obligatorio!.estado === 'error') {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                            </svg>
                          } @else if (docStatus().seguro_obligatorio!.estado === 'warning') {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
                            </svg>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
                            </svg>
                          }
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-sm text-base-content truncate">Seguro SOAP</h4>
                          @if (docStatus().seguro_obligatorio!.estado === 'error') {
                            <p class="text-xs text-error font-medium">{{ formatDocumentDate(docStatus().seguro_obligatorio!.fecha) }}</p>
                            <p class="text-[10px] text-base-content/50 mt-0.5">{{ getDaysAgo(docStatus().seguro_obligatorio!.fecha) }}</p>
                          } @else if (docStatus().seguro_obligatorio!.estado === 'warning') {
                            <p class="text-xs text-warning font-medium">{{ formatDocumentDate(docStatus().seguro_obligatorio!.fecha) }}</p>
                            <p class="text-[10px] text-base-content/50 mt-0.5">{{ docStatus().seguro_obligatorio!.dias_restantes }} días restantes</p>
                          } @else {
                            <p class="text-xs text-success font-medium">Vigente hasta {{ formatDocumentDate(docStatus().seguro_obligatorio!.fecha) }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
        }

        @if (activeTab() === 'records' && loadedTabs().has('records')) {
          <app-machine-daily-records
            [records]="dailyRecords()"
            [choferes]="choferes()"
            [filters]="recordFilters()"
            (filterChange)="onRecordFilterChange($event)"
            (viewDetail)="onViewRecordDetail($event)">
          </app-machine-daily-records>
        }

        @if (activeTab() === 'assignments' && loadedTabs().has('assignments')) {
          <app-machine-assignment-history
            [assignments]="assignments()">
          </app-machine-assignment-history>
        }

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
      </div>
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

  activeTab = signal<'general' | 'records' | 'assignments' | 'maintenance'>('general');
  recordFilters = signal<MachineDailyRecordFilters>({});
  maintenanceFilters = signal<MaintenanceFilters>({});
  maintenanceRecords = signal<MaintenanceRecord[]>([]);
  maintenanceItems = signal<string[]>(['Neumáticos', 'Aceite Motor', 'Filtros', 'Reparación Frenos']);

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

  setActiveTab(tab: 'general' | 'records' | 'assignments' | 'maintenance'): void {
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
}

