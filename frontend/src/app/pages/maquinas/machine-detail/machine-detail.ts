import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { catchError, of, switchMap, combineLatest } from 'rxjs';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { GlobalErrorService } from '../../../shared/services/global-error.service';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { getDaysDifferenceInChile } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-machine-detail',
  imports: [CommonModule, FormsModule, MachineDailyRecords, MachineAssignmentHistory, MachineMaintenance, UiIconComponent],
  template: `
    <div class="space-y-6 lg:space-y-8">
      @if (machine()) {
        <!-- Hero Section Premium -->
        <div class="hero-section bg-linear-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
          <div class="flex flex-col gap-6">
            <!-- Header con Botón Volver -->
            <div class="relative">
              <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 pr-12 sm:pr-0 mb-4">
                <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
                  Detalle de Máquina
                </h1>
                <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
                  Información general, registros diarios, historial de asignaciones y mantenimiento de la máquina.
                </p>
              </div>
              
              <!-- Botón Volver - Esquina superior derecha en mobile, normal en desktop -->
              <button
                type="button"
                class="absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto btn btn-ghost btn-sm gap-2 hover:bg-base-200/50 transition-all shrink-0 z-10"
                aria-label="Volver a la lista de máquinas"
                (click)="onBack()">
                <ui-icon name="ChevronLeft" size="sm" />
                <span class="hidden sm:inline">Volver</span>
              </button>
            </div>
            
            <!-- Información destacada de la máquina en el hero con botones -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <!-- Información de la máquina -->
              <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div class="flex items-center gap-3 shrink-0">
                  <div class="w-12 h-12 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ui-icon name="BusFront" size="md" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="text-xl md:text-2xl font-bold text-base-content">
                      Máquina {{ machine()!.numero || '--' }}
                    </h2>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-content/70 mt-0.5">
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
                <span 
                  class="badge gap-1.5 text-white font-medium shadow-sm px-3 py-2 shrink-0"
                  [class.badge-success]="machine()!.estado_operativo === 'Operativa'"
                  [class.badge-warning]="machine()!.estado_operativo === 'En Taller'"
                  [class.badge-error]="machine()!.estado_operativo === 'Inactiva'">
                  <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {{ machine()!.estado_operativo }}
                </span>
              </div>
              
              <!-- Botones de Acción Premium -->
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                @if (!isEditingGeneral()) {
                  <button 
                    type="button"
                    class="btn-action-delete group relative overflow-hidden rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-error border border-error/30 bg-error/5 hover:bg-error hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                    (click)="onDelete()">
                    <ui-icon name="Trash2" size="sm" class="transition-transform group-hover:scale-110 shrink-0" />
                    <span class="whitespace-nowrap">Eliminar</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-edit group relative overflow-hidden rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-focus shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2"
                    (click)="toggleEditGeneral()">
                    <ui-icon name="Pencil" size="sm" class="transition-transform group-hover:scale-110 shrink-0" />
                    <span class="whitespace-nowrap">Editar</span>
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn-action-cancel group relative overflow-hidden rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-base-content/70 border border-base-300 bg-base-100 hover:bg-base-200 hover:text-base-content transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2"
                    (click)="toggleEditGeneral()">
                    <span class="whitespace-nowrap">Cancelar</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-save group relative overflow-hidden rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-focus shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2"
                    (click)="onSaveGeneral()">
                    <ui-icon name="Check" size="sm" class="transition-transform group-hover:scale-110 shrink-0" />
                    <span class="whitespace-nowrap">Guardar</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Sección de Tabs (separada del card principal) -->
        <div class="bg-base-50/50 rounded-3xl p-4 border border-base-200/50 animate-fade-in-up" [style.animation-delay]="'200ms'">
          <div class="tabs tabs-boxed bg-base-100/50 p-1 gap-1">
            <button
              class="tab px-6 h-10 font-medium transition-all rounded-lg"
              [class.tab-active]="activeTab() === 'general'"
              [class.bg-primary]="activeTab() === 'general'"
              [class.text-primary-content]="activeTab() === 'general'"
              [class.btn-disabled]="isEditingGeneral() && activeTab() !== 'general'"
              [attr.disabled]="isEditingGeneral() && activeTab() !== 'general' ? '' : null"
              (click)="setActiveTab('general')">
              General
            </button>
            <button
              class="tab px-6 h-10 font-medium transition-all rounded-lg"
              [class.tab-active]="activeTab() === 'records'"
              [class.bg-primary]="activeTab() === 'records'"
              [class.text-primary-content]="activeTab() === 'records'"
              [class.btn-disabled]="isEditingGeneral()"
              [attr.disabled]="isEditingGeneral() ? '' : null"
              (click)="setActiveTab('records')">
              Registros Diarios
            </button>
            <button
              class="tab px-6 h-10 font-medium transition-all rounded-lg"
              [class.tab-active]="activeTab() === 'assignments'"
              [class.bg-primary]="activeTab() === 'assignments'"
              [class.text-primary-content]="activeTab() === 'assignments'"
              [class.btn-disabled]="isEditingGeneral()"
              [attr.disabled]="isEditingGeneral() ? '' : null"
              (click)="setActiveTab('assignments')">
              Historial
            </button>
            <button
              class="tab px-6 h-10 font-medium transition-all rounded-lg"
              [class.tab-active]="activeTab() === 'maintenance'"
              [class.bg-primary]="activeTab() === 'maintenance'"
              [class.text-primary-content]="activeTab() === 'maintenance'"
              [class.btn-disabled]="isEditingGeneral()"
              [attr.disabled]="isEditingGeneral() ? '' : null"
              (click)="setActiveTab('maintenance')">
              Mantenimiento
            </button>
          </div>
        </div>

        <!-- Contenido de Tabs con animaciones -->
        <div class="tab-content-wrapper">
          <!-- Contenido pestaña General -->
          @if (activeTab() === 'general') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-tab-enter">
              <!-- Ficha Técnica -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl h-full animate-card-stagger" [style.animation-delay]="'0ms'">
                <div class="card-body p-6">
                  <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                    <ui-icon name="Settings" size="sm" class="text-primary" />
                    Ficha Técnica
                  </h3>
                  <div class="grid grid-cols-1 gap-4">
                    <div class="bg-base-200/50 p-4 rounded-3xl border border-base-200">
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
                      <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                        <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                          Año
                        </span>
                        @if (isEditingGeneral()) {
                          <input
                            type="number"
                            class="input input-sm w-full mt-1 font-bold"
                            [value]="editAnio() ?? ''"
                            (input)="onAnioChange($any($event.target).value)"
                            placeholder="Año"
                            min="1900"
                            max="2100">
                        } @else {
                          <div class="font-bold text-base-content">
                            {{ machine()!['año'] || '--' }}
                          </div>
                        }
                      </div>
                      <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                        <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                          Patente
                        </span>
                        @if (isEditingGeneral()) {
                          <input
                            type="text"
                            class="input input-sm w-full mt-1 font-mono font-bold"
                            [value]="editPatente()"
                            (input)="onPatenteInput($event)"
                            placeholder="Patente">
                          <p class="text-[11px] text-base-content/60 mt-1">Formato: ABCD-12 (mayúsculas, 4 letras + guion + 2 números).</p>
                        } @else {
                          <div class="font-mono font-bold text-base-content">
                            {{ machine()?.patente || '--' }}
                          </div>
                        }
                      </div>
                    </div>
                    <div class="bg-base-200/50 p-4 rounded-3xl border border-base-200 flex justify-between items-center">
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

              <!-- Documentación -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl h-full animate-card-stagger" [style.animation-delay]="'100ms'">
                <div class="card-header px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-50 rounded-t-2xl">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <ui-icon name="FileText" size="sm" class="text-primary" />
                  Documentación
                </h3>
              </div>

              <div class="p-4 space-y-3">
                <!-- Revisión técnica -->
                <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-base-50/30">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    [class.bg-error/5]="docStatus().revision_tecnica?.estado === 'error'"
                    [class.text-error]="docStatus().revision_tecnica?.estado === 'error'"
                    [class.border-error/20]="docStatus().revision_tecnica?.estado === 'error'"
                    [class.bg-warning/5]="docStatus().revision_tecnica?.estado === 'warning'"
                    [class.text-warning]="docStatus().revision_tecnica?.estado === 'warning'"
                    [class.border-warning/20]="docStatus().revision_tecnica?.estado === 'warning'"
                    [class.bg-success/5]="docStatus().revision_tecnica?.estado === 'ok'"
                    [class.text-success]="docStatus().revision_tecnica?.estado === 'ok'"
                    [class.border-success/20]="docStatus().revision_tecnica?.estado === 'ok'">
                    <ui-icon name="CheckCircle2" size="sm" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Revisión Técnica
                      </p>
                      @if (!isEditingGeneral() && docStatus().revision_tecnica) {
                        <span
                          class="badge badge-xs badge-outline"
                          [class.badge-success]="docStatus().revision_tecnica?.estado === 'ok'"
                          [class.badge-warning]="docStatus().revision_tecnica?.estado === 'warning'"
                          [class.badge-error]="docStatus().revision_tecnica?.estado === 'error'">
                          {{ docStatus().revision_tecnica?.texto }}
                        </span>
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
                    [class.bg-error/5]="docStatus().permiso_circulacion?.estado === 'error'"
                    [class.text-error]="docStatus().permiso_circulacion?.estado === 'error'"
                    [class.border-error/20]="docStatus().permiso_circulacion?.estado === 'error'"
                    [class.bg-warning/5]="docStatus().permiso_circulacion?.estado === 'warning'"
                    [class.text-warning]="docStatus().permiso_circulacion?.estado === 'warning'"
                    [class.border-warning/20]="docStatus().permiso_circulacion?.estado === 'warning'"
                    [class.bg-success/5]="docStatus().permiso_circulacion?.estado === 'ok'"
                    [class.text-success]="docStatus().permiso_circulacion?.estado === 'ok'"
                    [class.border-success/20]="docStatus().permiso_circulacion?.estado === 'ok'">
                    <ui-icon name="FileText" size="sm" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Permiso Circulación
                      </p>
                      @if (!isEditingGeneral() && docStatus().permiso_circulacion) {
                        <span
                          class="badge badge-xs badge-outline"
                          [class.badge-success]="docStatus().permiso_circulacion?.estado === 'ok'"
                          [class.badge-warning]="docStatus().permiso_circulacion?.estado === 'warning'"
                          [class.badge-error]="docStatus().permiso_circulacion?.estado === 'error'">
                          {{ docStatus().permiso_circulacion?.texto }}
                        </span>
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
                    [class.bg-error/5]="docStatus().seguro_obligatorio?.estado === 'error'"
                    [class.text-error]="docStatus().seguro_obligatorio?.estado === 'error'"
                    [class.border-error/20]="docStatus().seguro_obligatorio?.estado === 'error'"
                    [class.bg-warning/5]="docStatus().seguro_obligatorio?.estado === 'warning'"
                    [class.text-warning]="docStatus().seguro_obligatorio?.estado === 'warning'"
                    [class.border-warning/20]="docStatus().seguro_obligatorio?.estado === 'warning'"
                    [class.bg-success/5]="docStatus().seguro_obligatorio?.estado === 'ok'"
                    [class.text-success]="docStatus().seguro_obligatorio?.estado === 'ok'"
                    [class.border-success/20]="docStatus().seguro_obligatorio?.estado === 'ok'">
                    <ui-icon name="CheckCircle2" size="sm" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Seguro SOAP
                      </p>
                      @if (!isEditingGeneral() && docStatus().seguro_obligatorio) {
                        <span
                          class="badge badge-xs badge-outline"
                          [class.badge-success]="docStatus().seguro_obligatorio?.estado === 'ok'"
                          [class.badge-warning]="docStatus().seguro_obligatorio?.estado === 'warning'"
                          [class.badge-error]="docStatus().seguro_obligatorio?.estado === 'error'">
                          {{ docStatus().seguro_obligatorio?.texto }}
                        </span>
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
              
              <!-- Conductor responsable -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden h-full animate-card-stagger" [style.animation-delay]="'200ms'">
                <div class="h-24 bg-linear-to-br from-primary/20 via-primary/5 to-transparent"></div>
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
                    @if (isEditingGeneral()) {
                      <div class="w-full max-w-xs mt-2">
                        <label class="label py-1">
                          <span class="label-text text-xs font-semibold text-base-content/60">
                            Cambiar conductor
                          </span>
                        </label>
                        <select
                          class="select select-sm w-full"
                          [ngModel]="choferSelectValueComputed()"
                          (ngModelChange)="handleChoferChangeFromNgModel($event)">
                          @if (choferSelectValueComputed() && choferSelectValueComputed() !== '') {
                            @for (c of choferesSelectOrdered(); track c.id) {
                              <option [value]="c.id.toString()">
                                {{ c.nombre_completo }}
                              </option>
                            }
                            <option value="">Sin asignar</option>
                          } @else {
                            <option value="">Sin asignar</option>
                            @for (c of choferesSelect(); track c.id) {
                              <option [value]="c.id.toString()">
                                {{ c.nombre_completo }}
                              </option>
                            }
                          }
                        </select>
                      </div>
                    }
                    <div class="w-full mt-auto"></div>
                  } @else {
                    <div class="avatar mb-4 placeholder">
                      <div class="w-24 rounded-full bg-base-200 ring ring-base-100 ring-offset-2 flex items-center justify-center text-base-content/20">
                        <ui-icon name="UserRound" size="lg" />
                      </div>
                    </div>
                    <h4 class="text-lg font-bold text-base-content/70">
                      Sin Asignar
                    </h4>
                    <p class="text-sm text-base-content/50 mb-4 px-4">
                      Esta máquina no tiene conductor responsable actualmente.
                    </p>
                    @if (isEditingGeneral()) {
                      <div class="w-full max-w-xs">
                        <label class="label py-1">
                          <span class="label-text text-xs font-semibold text-base-content/60">
                            Asignar conductor
                          </span>
                        </label>
                        <select
                          class="select select-sm w-full"
                          [ngModel]="choferSelectValueComputed()"
                          (ngModelChange)="handleChoferChangeFromNgModel($event)">
                          @if (choferSelectValueComputed() && choferSelectValueComputed() !== '') {
                            @for (c of choferesSelectOrdered(); track c.id) {
                              <option [value]="c.id.toString()">
                                {{ c.nombre_completo }}
                              </option>
                            }
                            <option value="">Sin asignar</option>
                          } @else {
                            <option value="">Sin asignar</option>
                            @for (c of choferesSelect(); track c.id) {
                              <option [value]="c.id.toString()">
                                {{ c.nombre_completo }}
                              </option>
                            }
                          }
                        </select>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          }

          <!-- Registros diarios -->
          @if (activeTab() === 'records' && loadedTabs().has('records')) {
            <div class="animate-tab-enter">
              <app-machine-daily-records
                [records]="dailyRecords()"
                [choferes]="choferes()"
                [filters]="recordFilters()"
                [totalRecords]="dailyRecordsTotal()"
                [currentPage]="dailyRecordsCurrentPage()"
                [totalPages]="dailyRecordsTotalPages()"
                [isLoading]="dailyRecordsLoading()"
                (filterChange)="onRecordFilterChange($event)"
                (pageChange)="onDailyRecordsPageChange($event)"
                (viewDetail)="onViewRecordDetail($event)">
              </app-machine-daily-records>
            </div>
          }

          <!-- Historial de asignaciones -->
          @if (activeTab() === 'assignments' && loadedTabs().has('assignments')) {
            <div class="animate-tab-enter">
              <app-machine-assignment-history
                [assignments]="assignments()"
                [totalAssignments]="assignmentsTotal()"
                [currentPage]="assignmentsCurrentPage()"
                [totalPages]="assignmentsTotalPages()"
                [isLoading]="assignmentsLoading()"
                [activeFilter]="assignmentsFilter()"
                (filterChange)="onAssignmentFilterChange($event)"
                (pageChange)="onAssignmentPageChange($event)">
              </app-machine-assignment-history>
            </div>
          }

          <!-- Mantenimiento -->
          @if (activeTab() === 'maintenance' && loadedTabs().has('maintenance')) {
            @if (machineId()) {
              <div class="animate-tab-enter">
                <app-machine-maintenance
                  [machineId]="machineId()!"
                  [records]="maintenanceRecords()"
                  [availableItems]="maintenanceItems()"
                  [filters]="maintenanceFilters()"
                  [totalRecords]="maintenanceTotal()"
                  [totalRecordsGlobal]="maintenanceTotalGlobal()"
                  [gastoMesActual]="maintenanceGastoMesActual()"
                  [currentPage]="maintenanceCurrentPage()"
                  [totalPages]="maintenanceTotalPages()"
                  [isLoading]="maintenanceLoading()"
                  (recordAdded)="onMaintenanceRecordAdded($event)"
                  (recordDeleted)="onMaintenanceRecordDeleted($event)"
                  (filterChange)="onMaintenanceFilterChange($event)"
                  (pageChange)="onMaintenancePageChange($event)">
                </app-machine-maintenance>
              </div>
            }
          }
        </div>
      } @else {
        @if (machineLoadingState.isLoading()) {
          <!-- Skeleton completo de la estructura de detalle de máquina -->
          <!-- Se muestra siempre que isLoading() es true, incluso antes del umbral de 200ms -->
          <div class="space-y-6 lg:space-y-8 animate-fade-in">
            <!-- Hero Section Skeleton -->
            <div class="hero-section bg-linear-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6">
              <div class="flex flex-col gap-6">
                <!-- Header con Botón Volver -->
                <div class="relative">
                  <div class="border-l-4 border-l-primary pl-3 md:pl-4 pr-12 sm:pr-0 mb-4">
                    <div class="h-8 w-64 skeleton-shimmer rounded mb-3"></div>
                    <div class="h-4 w-96 skeleton-shimmer rounded hidden sm:block"></div>
                  </div>
                  <div class="absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto">
                    <div class="h-9 w-20 skeleton-shimmer rounded"></div>
                  </div>
                </div>
                
                <!-- Información destacada de la máquina -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <!-- Información de la máquina -->
                  <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    <div class="flex items-center gap-3 shrink-0">
                      <div class="w-12 h-12 skeleton-shimmer rounded-xl"></div>
                      <div class="min-w-0">
                        <div class="h-7 w-48 skeleton-shimmer rounded mb-2"></div>
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                          <div class="w-1 h-1 skeleton-shimmer rounded-full"></div>
                          <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                          <div class="w-1 h-1 skeleton-shimmer rounded-full"></div>
                          <div class="h-4 w-16 skeleton-shimmer rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div class="h-8 w-24 skeleton-shimmer rounded-full"></div>
                  </div>
                  
                  <!-- Botones de Acción -->
                  <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <div class="h-10 w-24 skeleton-shimmer rounded-xl"></div>
                    <div class="h-10 w-20 skeleton-shimmer rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección de Tabs Skeleton -->
            <div class="bg-base-50/50 rounded-3xl p-4 border border-base-200/50">
              <div class="tabs tabs-boxed bg-base-100/50 p-1 gap-1">
                <div class="h-10 w-24 skeleton-shimmer rounded-lg"></div>
                <div class="h-10 w-36 skeleton-shimmer rounded-lg"></div>
                <div class="h-10 w-28 skeleton-shimmer rounded-lg"></div>
                <div class="h-10 w-32 skeleton-shimmer rounded-lg"></div>
              </div>
            </div>

            <!-- Contenido de Tabs Skeleton -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <!-- Ficha Técnica Skeleton -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl h-full">
                <div class="card-body p-6">
                  <div class="h-6 w-40 skeleton-shimmer rounded mb-4"></div>
                  <div class="grid grid-cols-1 gap-4">
                    <div class="bg-base-200/50 p-4 rounded-3xl border border-base-200">
                      <div class="h-3 w-32 skeleton-shimmer rounded mb-2"></div>
                      <div class="h-6 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                        <div class="h-3 w-16 skeleton-shimmer rounded mb-2"></div>
                        <div class="h-5 w-full skeleton-shimmer rounded"></div>
                      </div>
                      <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                        <div class="h-3 w-20 skeleton-shimmer rounded mb-2"></div>
                        <div class="h-5 w-full skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                    <div class="bg-base-200/50 p-4 rounded-3xl border border-base-200 flex justify-between items-center">
                      <div class="h-3 w-16 skeleton-shimmer rounded"></div>
                      <div class="h-6 w-24 skeleton-shimmer rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Documentación Skeleton -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl h-full">
                <div class="card-header px-6 py-4 border-b border-base-200 bg-base-50 rounded-t-2xl">
                  <div class="h-6 w-48 skeleton-shimmer rounded"></div>
                </div>
                <div class="p-4 space-y-3">
                  @for (i of [1,2,3]; track i) {
                    <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 bg-base-50/30">
                      <div class="w-10 h-10 skeleton-shimmer rounded-lg"></div>
                      <div class="flex-1 min-w-0">
                        <div class="h-3 w-40 skeleton-shimmer rounded mb-2"></div>
                        <div class="h-5 w-32 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
              
              <!-- Conductor responsable Skeleton -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden h-full">
                <div class="h-24 bg-linear-to-br from-primary/20 via-primary/5 to-transparent"></div>
                <div class="card-body p-6 pt-0 -mt-12 text-center flex flex-col items-center">
                  <div class="w-24 h-24 skeleton-shimmer rounded-full mb-4"></div>
                  <div class="h-6 w-40 skeleton-shimmer rounded mb-2"></div>
                  <div class="h-4 w-32 skeleton-shimmer rounded mb-6"></div>
                  <div class="h-10 w-full max-w-xs skeleton-shimmer rounded"></div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes tabEnter {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes cardStagger {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-down {
      animation: fadeInDown 600ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    
    .animate-fade-in-up {
      animation: fadeInUp 600ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    
    .animate-tab-enter {
      animation: tabEnter 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .animate-card-stagger {
      animation: cardStagger 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .animate-fade-in {
      animation: fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in-down,
      .animate-fade-in-up,
      .animate-tab-enter,
      .animate-card-stagger,
      .animate-fade-in {
        animation: none;
      }
      
      .skeleton-shimmer {
        animation: none;
      }
    }
    
    .hero-section {
      position: relative;
      overflow: hidden;
    }
    
    .hero-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(var(--p) / 0.03) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .tab-content-wrapper {
      min-height: 200px;
    }
    
    /* Botones Premium */
    .btn-action-edit,
    .btn-action-save {
      position: relative;
    }
    
    .btn-action-edit::before,
    .btn-action-save::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    
    .btn-action-edit:hover::before,
    .btn-action-save:hover::before {
      left: 100%;
    }
    
    .btn-action-delete {
      position: relative;
    }
    
    .btn-action-delete::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .btn-action-delete:hover::before {
      left: 100%;
    }
    
    .btn-action-cancel {
      position: relative;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private machineService = inject(MachineService);
  private driverService = inject(DriverService);
  private dailyRecordService = inject(DailyRecordService);
  private loadingStateService = inject(LoadingStateService);
  private confirmModalService = inject(ConfirmModalService);
  private alertModalService = inject(AlertModalService);
  private globalErrorService = inject(GlobalErrorService);

  // Estado de carga con umbral de 200ms
  machineLoadingState = this.loadingStateService.createLoadingState();

  isEditingGeneral = signal(false);
  activeTab = signal<'general' | 'records' | 'assignments' | 'maintenance'>('general');
  recordFilters = signal<MachineDailyRecordFilters>({});
  maintenanceFilters = signal<MaintenanceFilters>({});
  maintenanceRecords = signal<MaintenanceRecord[]>([]);
  maintenanceTotal = signal<number>(0);
  maintenanceTotalGlobal = signal<number>(0);
  maintenanceGastoMesActual = signal<number>(0);
  maintenanceCurrentPage = signal<number>(1);
  maintenanceTotalPages = signal<number>(0);
  maintenanceLoading = signal<boolean>(false);
  maintenanceItemsPerPage = 12;
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

  // Signal para el valor del select (para evitar problemas con el binding)
  choferSelectValue = signal<string>('');

  // Computed signal para el valor del select que siempre está sincronizado
  choferSelectValueComputed = computed(() => {
    if (this.isEditingGeneral()) {
      // En modo edición, primero verificar editChoferId (se establece en toggleEditGeneral)
      const editId = this.editChoferId();
      if (editId !== null && editId !== undefined) {
        return String(editId);
      }

      // Si no hay editChoferId, verificar choferSelectValue (puede haber sido cambiado por el usuario)
      const selectValue = this.choferSelectValue();
      if (selectValue !== '') {
        return selectValue;
      }

      // Si no hay valor en ninguno, usar el valor de la máquina como fallback
      const machineId = this.machine()?.chofer_actual?.id;
      return machineId ? String(machineId) : '';
    }

    // Si no estamos en modo edición, usar el valor de la máquina
    const machineId = this.machine()?.chofer_actual?.id;
    return machineId ? String(machineId) : '';
  });

  // Signal para forzar recarga de datos
  refreshTrigger = signal(0);

  // Cargar máquina - usando route.params para reactividad
  machineIdParam = toSignal(
    this.route.params.pipe(
      map(params => params['id'] ? Number(params['id']) : null)
    ),
    { initialValue: null }
  );

  machineId = computed(() => this.machineIdParam());

  // Cargar máquina desde backend (se recarga cuando cambia el ID o el refreshTrigger)
  machineData = toSignal(
    combineLatest([
      this.route.params.pipe(map(params => params['id'] ? Number(params['id']) : null)),
      toObservable(this.refreshTrigger),
      this.driverService.getActiveDrivers().pipe(catchError(() => of([])))
    ]).pipe(
      switchMap(([id, _, choferes]) => {
        if (!id) {
          return of<Machine | null>(null);
        }
        return this.machineService.getMachineById(id).pipe(
          map((machine) => {
            // Poblar chofer_actual si hay chofer_id y choferes disponibles
            if (machine && machine.chofer_id && choferes.length > 0) {
              const chofer = choferes.find(c => c.id === machine.chofer_id);
              if (chofer && chofer.nombre_completo) {
                return {
                  ...machine,
                  chofer_actual: {
                    id: chofer.id,
                    nombre_completo: chofer.nombre_completo
                  }
                };
              }
            }
            return machine;
          }),
          catchError((error) => {
            console.error('Error cargando máquina:', error);
            // Mostrar error global
            this.globalErrorService.showError(
              'No se pudo cargar la información de la máquina desde el servidor.',
              'Error al cargar máquina'
            );
            return of<Machine | null>(null);
          })
        );
      })
    ),
    { initialValue: null }
  );

  machine = computed(() => this.machineData());

  // Estados de documentos
  docStatus = computed(() => {
    const m = this.machine();
    return m?.documentos_estado ?? {};
  });


  // Cargar choferes activos sin máquina desde backend (para el select)
  choferesSelectData = toSignal(
    this.driverService.getActiveDriversWithoutMachine().pipe(
      catchError((error) => {
        console.error('Error cargando choferes activos sin máquina:', error);
        // Retornar array vacío si hay error
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  choferesSelect = computed(() => {
    const choferesDisponibles = this.choferesSelectData() ?? [];
    const choferActual = this.machine()?.chofer_actual;

    if (choferActual && !choferesDisponibles.some((c) => c.id === choferActual.id)) {
      return [choferActual, ...choferesDisponibles];
    }

    return choferesDisponibles;
  });

  // Choferes ordenados: el asignado primero, luego los demás
  choferesSelectOrdered = computed(() => {
    const choferes = this.choferesSelect();
    const currentChoferId = this.machine()?.chofer_actual?.id;

    if (!currentChoferId) {
      return choferes;
    }

    // Separar el conductor asignado del resto
    const assignedChofer = choferes.find(c => c.id === currentChoferId);
    const otherChoferes = choferes.filter(c => c.id !== currentChoferId);

    // Retornar el asignado primero, luego los demás
    return assignedChofer ? [assignedChofer, ...otherChoferes] : choferes;
  });

  // Cargar choferes completos para otros componentes (MachineDailyRecords)
  choferesData = toSignal(
    this.driverService.getDrivers({ estado: 'activos' }).pipe(
      map(response => response.datos),
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  choferes = computed(() => this.choferesData() ?? []);

  // Registros diarios
  dailyRecords = signal<MachineDailyRecord[]>([]);
  dailyRecordsTotal = signal<number>(0);
  dailyRecordsCurrentPage = signal<number>(1);
  dailyRecordsTotalPages = signal<number>(0);
  dailyRecordsLoading = signal<boolean>(false);
  itemsPerPage = 10;

  // Asignaciones
  assignments = signal<MachineAssignment[]>([]);
  assignmentsTotal = signal<number>(0);
  assignmentsCurrentPage = signal<number>(1);
  assignmentsTotalPages = signal<number>(0);
  assignmentsLoading = signal<boolean>(false);
  assignmentsFilter = signal<'todas' | 'actual' | 'cerradas'>('todas');

  // Rastrear qué tabs han sido cargados
  loadedTabs = signal<Set<string>>(new Set(['general'])); // 'general' siempre se carga

  // Effect para detectar cuando la máquina está cargada
  private machineEffect = effect(() => {
    const machine = this.machine();
    if (machine && this.machineLoadingState.isLoading()) {
      this.machineLoadingState.setDataLoaded();
    }
  });


  ngOnInit(): void {
    // Iniciar estado de carga
    this.machineLoadingState.setLoading(true);
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
        const choferId = m.chofer_actual?.id || null;
        this.editChoferId.set(choferId);
        // Actualizar también el valor del select - asegurarse de que sea string
        const selectValue = choferId ? String(choferId) : '';
        this.choferSelectValue.set(selectValue);
      }
    } else {
      // Al salir del modo edición, limpiar los valores temporales
      this.choferSelectValue.set('');
      this.editChoferId.set(null);
    }

    this.isEditingGeneral.set(isEditing);
  }

  onSaveGeneral(): void {
    const machineId = this.machineId();
    if (!machineId) return;

    const choferId = this.editChoferId();
    const estado = this.editEstadoOperativo() as 'Operativa' | 'En Taller' | 'Inactiva' | undefined;
    const currentMachine = this.machine();

    if (!currentMachine) return;

    const patenteRegex = /^[A-Z]{4}-\d{2}$/;

    if (!this.editPatente() || !patenteRegex.test(this.editPatente())) {
      this.alertModalService.show({
        title: 'Patente inválida',
        message: 'Usa el formato ABCD-12 (mayúsculas, 4 letras, guion y 2 números).',
        type: 'warning',
        buttonText: 'Entendido'
      });
      return;
    }

    // Validar que las fechas de documentación estén presentes
    if (!this.editRevisionTecnica() || !this.editPermisoCirculacion() || !this.editSeguroObligatorio()) {
      this.alertModalService.show({
        title: 'Documentación Incompleta',
        message: 'Todas las fechas de documentación (Revisión Técnica, Permiso de Circulación, Seguro Obligatorio) son obligatorias.',
        type: 'warning',
        buttonText: 'Entendido'
      });
      return;
    }

    // Asegurar que chofer_id sea un número o null
    const choferIdFinal = choferId !== null && choferId !== undefined ? Number(choferId) : null;

    const updateData: Partial<Machine> = {
      numero: currentMachine.numero,
      marca: this.editMarca(),
      'año': this.editAnio() ?? currentMachine.año,
      patente: this.editPatente(),
      estado_operativo: estado || currentMachine.estado_operativo,
      chofer_id: choferIdFinal,
      documentos: {
        revision_tecnica: this.editRevisionTecnica() || undefined,
        permiso_circulacion: this.editPermisoCirculacion() || undefined,
        seguro_obligatorio: this.editSeguroObligatorio() || undefined
      }
    };

    this.machineService.updateMachine(machineId, updateData)
      .pipe(
        catchError((error) => {
          console.error('Error al actualizar máquina:', error);
          const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
          this.alertModalService.show({
            title: 'Error al Guardar',
            message: `Hubo un error al guardar los cambios de la máquina: ${errorMessage} Por favor, intenta nuevamente.`,
            type: 'error',
            buttonText: 'Entendido'
          });
          return of(null);
        })
      )
      .subscribe((updatedMachine) => {
        if (updatedMachine) {
          this.isEditingGeneral.set(false);

          this.alertModalService.show({
            title: 'Cambios Guardados',
            message: 'La información de la máquina ha sido actualizada correctamente.',
            type: 'success',
            buttonText: 'Entendido'
          });

          // Esperar un momento para asegurar que el backend haya procesado
          setTimeout(() => {
            // Forzar recarga de datos actualizando el refreshTrigger
            this.refreshTrigger.set(this.refreshTrigger() + 1);

            // Verificar después de un momento si se cargó correctamente
            setTimeout(() => {
              const machine = this.machine();
              const choferes = this.choferes();

              if (machine && machine.chofer_id && !machine.chofer_actual && choferes.length > 0) {
                this.refreshTrigger.set(this.refreshTrigger() + 1);
              }
            }, 1000);
          }, 300);
        }
      });
  }

  onPatenteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value || '';
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7);

    if (sanitized !== raw) {
      input.value = sanitized;
    }

    this.editPatente.set(sanitized);
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

  async onDelete(): Promise<void> {
    const machine = this.machine();

    if (machine?.chofer_actual) {
      this.alertModalService.show({
        title: 'Eliminar Máquina',
        message: 'La máquina tiene una asignación activa, no puede ser eliminada.',
        type: 'warning',
        buttonText: 'Entendido'
      });
      return;
    }

    const confirmed = await this.confirmModalService.open({
      title: 'Eliminar Máquina',
      message: `¿Estás seguro de que deseas eliminar la máquina ${machine?.numero || 'esta máquina'}? Esta acción desactivará la máquina.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    const machineId = this.machineId();
    if (!machineId) {
      this.alertModalService.show({
        title: 'Error de Eliminación',
        message: 'No se pudo identificar la máquina a eliminar. Por favor, recarga la página e intenta nuevamente.',
        type: 'error',
        buttonText: 'Entendido'
      });
      return;
    }

    this.machineService.deleteMachine(machineId)
      .pipe(
        catchError((error) => {
          console.error('Error al eliminar máquina:', error);
          const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
          this.alertModalService.show({
            title: 'Error al Eliminar',
            message: `Hubo un error al eliminar la máquina: ${errorMessage}. Por favor, intenta nuevamente.`,
            type: 'error',
            buttonText: 'Entendido'
          });
          return of(null);
        })
      )
      .subscribe(() => {
        // Navegar a la lista de máquinas después de eliminar
        this.router.navigate(['/maquinas']);
      });
  }

  onRecordFilterChange(filters: MachineDailyRecordFilters): void {
    this.recordFilters.set(filters);
    // Resetear a página 1 cuando cambian los filtros
    this.dailyRecordsCurrentPage.set(1);
    // Recargar los registros con los nuevos filtros
    this.loadDailyRecords();
  }

  onDailyRecordsPageChange(page: number): void {
    this.dailyRecordsCurrentPage.set(page);
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
    const currentPage = this.dailyRecordsCurrentPage();

    this.dailyRecordsLoading.set(true);

    this.dailyRecordService.getDailyRecords({
      maquina_id: machine.id,
      chofer_id: filters.chofer_id || undefined,
      desde: filters.desde || undefined,
      hasta: filters.hasta || undefined,
      orden: filters.orden === 'mas_antiguo' ? 'mas_antiguo' : 'mas_reciente',
      pagina: currentPage,
      por_pagina: this.itemsPerPage
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
          pago_chofer: record.pago_chofer || 0,
          neto: record.neto,
          observaciones: record.observaciones || null,
          estado: record.estado
        }));

        this.dailyRecords.set(machineRecords);
        this.dailyRecordsTotal.set(response.total || 0);
        this.dailyRecordsTotalPages.set(response.total_paginas || 0);
        this.dailyRecordsLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar registros diarios:', error);
        this.dailyRecords.set([]);
        this.dailyRecordsTotal.set(0);
        this.dailyRecordsTotalPages.set(0);
        this.dailyRecordsLoading.set(false);
      }
    });
  }

  private loadAssignments(): void {
    const machineId = this.machineId();
    if (!machineId) return;

    this.assignmentsLoading.set(true);
    const currentPage = this.assignmentsCurrentPage();
    const filter = this.assignmentsFilter();

    this.machineService.getMachineAssignments(machineId, {
      filtro: filter,
      page: currentPage,
      per_page: 10
    }).subscribe({
      next: (response) => {
        this.assignments.set(response.items);
        this.assignmentsTotal.set(response.total);
        this.assignmentsTotalPages.set(Math.ceil(response.total / response.per_page));
        this.assignmentsLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar asignaciones:', error);
        this.assignments.set([]);
        this.assignmentsTotal.set(0);
        this.assignmentsTotalPages.set(0);
        this.assignmentsLoading.set(false);
      }
    });
  }

  onAssignmentFilterChange(filter: 'todas' | 'actual' | 'cerradas'): void {
    this.assignmentsFilter.set(filter);
    this.assignmentsCurrentPage.set(1);
    this.loadAssignments();
  }

  onAssignmentPageChange(page: number): void {
    this.assignmentsCurrentPage.set(page);
    this.loadAssignments();
  }

  private loadMaintenanceRecords(): void {
    const machineId = this.machineId();
    if (!machineId) {
      console.warn('No hay machineId para cargar mantenimientos');
      return;
    }

    const filters = this.maintenanceFilters();
    const currentPage = this.maintenanceCurrentPage();

    console.log('Cargando mantenimientos:', { machineId, filters, currentPage, per_page: this.maintenanceItemsPerPage });

    this.maintenanceLoading.set(true);

    this.machineService.getMachineMaintenances(machineId, {
      categoria: filters.categoria && filters.categoria !== 'all' ? filters.categoria : undefined,
      item: filters.item,
      desde: filters.desde,
      hasta: filters.hasta,
      page: currentPage,
      per_page: this.maintenanceItemsPerPage
    }).subscribe({
      next: (response) => {
        console.log('Respuesta de mantenimientos:', response);
        this.maintenanceRecords.set(response.items);
        this.maintenanceTotal.set(response.total_registros);
        this.maintenanceTotalGlobal.set(response.total_registros_global);
        this.maintenanceGastoMesActual.set(response.gasto_mes_actual);
        this.maintenanceTotalPages.set(response.total_paginas);
        this.maintenanceLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar mantenimientos:', error);
        this.maintenanceRecords.set([]);
        this.maintenanceTotal.set(0);
        this.maintenanceTotalGlobal.set(0);
        this.maintenanceGastoMesActual.set(0);
        this.maintenanceTotalPages.set(0);
        this.maintenanceLoading.set(false);
      }
    });
  }

  onMaintenanceRecordAdded(record: MaintenanceRecord): void {
    const machineId = this.machineId();
    if (!machineId) return;

    this.machineService.createMachineMaintenance(machineId, {
      item: record.item,
      costo: record.costo,
      numero_factura: record.numero_factura,
      categoria: record.categoria,
      fecha: record.fecha
    }).subscribe({
      next: (newRecord) => {
        // Recargar los registros para obtener la lista actualizada con paginación
        this.maintenanceCurrentPage.set(1);
        this.loadMaintenanceRecords();
        this.alertModalService.show({
          title: 'Mantenimiento registrado',
          message: 'El registro de mantenimiento de la máquina se guardó correctamente.',
          type: 'success',
          buttonText: 'Entendido'
        });
      },
      error: (error) => {
        console.error('Error al crear mantenimiento:', error);
        // Mostrar error al usuario
        const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
        this.alertModalService.show({
          title: 'No se pudo registrar el mantenimiento',
          message: `Ocurrió un error al guardar el registro de mantenimiento: ${errorMessage}. Por favor, intenta nuevamente.`,
          type: 'error',
          buttonText: 'Entendido'
        });
      }
    });
  }

  onMaintenanceRecordDeleted(id: number): void {
    this.machineService.deleteMaintenance(id).subscribe({
      next: () => {
        // Recargar los registros para obtener la lista actualizada con paginación
        this.loadMaintenanceRecords();
        this.alertModalService.show({
          title: 'Mantenimiento eliminado',
          message: 'El registro de mantenimiento se eliminó correctamente.',
          type: 'success',
          buttonText: 'Entendido'
        });
      },
      error: (error) => {
        console.error('Error al eliminar mantenimiento:', error);
        // Mostrar error al usuario
        const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';

        this.alertModalService.show({
          title: 'Error al Eliminar',
          message: `No se pudo eliminar el mantenimiento: ${errorMessage}. Por favor, intenta nuevamente.`,
          type: 'error',
          buttonText: 'Entendido'
        });
      }
    });
  }

  onMaintenanceFilterChange(filters: MaintenanceFilters): void {
    this.maintenanceFilters.set(filters);
    // Resetear a página 1 cuando cambian los filtros
    this.maintenanceCurrentPage.set(1);
    // Recargar los registros con los nuevos filtros
    this.loadMaintenanceRecords();
  }

  onMaintenancePageChange(page: number): void {
    this.maintenanceCurrentPage.set(page);
    this.loadMaintenanceRecords();
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
      // Normalizar a fecha local para evitar desfasajes por zona horaria
      const normalizedDate = date.split('T')[0];
      const [year, month, day] = normalizedDate.split('-').map(Number);

      if (!year || !month || !day) {
        return date;
      }

      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  }

  getDaysAgo(date: string | null): string {
    if (!date) return '';
    try {
      // Usar función helper que considera zona horaria de Chile
      const diffDays = getDaysDifferenceInChile(date);

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

  // Métodos auxiliares para conversiones en plantillas
  onAnioChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    this.editAnio.set(numValue && !isNaN(numValue) ? numValue : null);
  }

  getChoferSelectValue(): string {
    // Si estamos en modo edición, priorizar editChoferId sobre choferSelectValue
    // porque editChoferId se inicializa primero en toggleEditGeneral
    if (this.isEditingGeneral()) {
      const editId = this.editChoferId();
      if (editId !== null && editId !== undefined) {
        return String(editId);
      }

      // Si no hay editChoferId, usar choferSelectValue
      const selectValue = this.choferSelectValue();
      if (selectValue !== '') {
        return selectValue;
      }

      // Si no hay valor en ninguno, usar el valor de la máquina
      const machineId = this.machine()?.chofer_actual?.id;
      return machineId ? String(machineId) : '';
    }

    // Si no estamos en modo edición, usar el valor de la máquina
    const machineId = this.machine()?.chofer_actual?.id;
    return machineId ? String(machineId) : '';
  }

  handleChoferChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    // Actualizar el signal del select primero
    this.choferSelectValue.set(value);

    // Si el valor es una cadena vacía, establecer null inmediatamente
    if (value === '' || value === null || value === undefined) {
      this.editChoferId.set(null);
      this.choferSelectValue.set('');
      return;
    }

    // Llamar directamente a onChoferIdChange para valores no vacíos
    this.onChoferIdChange(value);
  }

  handleChoferChangeFromNgModel(value: string): void {
    // Actualizar el signal del select primero
    this.choferSelectValue.set(value);

    // Si el valor es una cadena vacía, establecer null inmediatamente
    if (value === '' || value === null || value === undefined) {
      this.editChoferId.set(null);
      this.choferSelectValue.set('');
      return;
    }

    // Llamar directamente a onChoferIdChange para valores no vacíos
    this.onChoferIdChange(value);
  }

  onChoferIdChange(value: string | number | null | undefined): void {
    // Convertir a string si es necesario
    const stringValue = value === null || value === undefined ? '' : String(value);

    // Si el valor es una cadena vacía, null, undefined, o el string "null", establecer null
    if (!stringValue || stringValue.trim() === '' || stringValue === 'null' || stringValue === 'undefined') {
      this.editChoferId.set(null);
      this.choferSelectValue.set('');
      return;
    }

    const numValue = parseInt(stringValue, 10);
    // Si es un número válido, establecerlo; de lo contrario, null
    if (!isNaN(numValue) && numValue > 0) {
      this.editChoferId.set(numValue);
      this.choferSelectValue.set(String(numValue));
    } else {
      this.editChoferId.set(null);
      this.choferSelectValue.set('');
    }
  }

  onAssignDriver(value: string): void {
    const machineId = this.machineId();
    if (!machineId) return;

    const choferId = value ? parseInt(value, 10) : null;
    const currentMachine = this.machine();

    if (!currentMachine) return;

    // Validar que las fechas de documentación estén presentes
    if (!currentMachine.documentos?.revision_tecnica ||
      !currentMachine.documentos?.permiso_circulacion ||
      !currentMachine.documentos?.seguro_obligatorio) {
      this.alertModalService.show({
        title: 'Documentación Pendiente',
        message: 'No se puede asignar un conductor a esta máquina porque faltan fechas de documentación. Por favor, edita la máquina y completa la documentación primero.',
        type: 'warning',
        buttonText: 'Entendido'
      });
      return;
    }

    const updateData: Partial<Machine> = {
      numero: currentMachine.numero,
      marca: currentMachine.marca,
      'año': currentMachine.año,
      patente: currentMachine.patente,
      estado_operativo: currentMachine.estado_operativo,
      chofer_id: choferId ?? undefined,
      documentos: {
        revision_tecnica: currentMachine.documentos.revision_tecnica,
        permiso_circulacion: currentMachine.documentos.permiso_circulacion,
        seguro_obligatorio: currentMachine.documentos.seguro_obligatorio
      }
    };

    this.machineService.updateMachine(machineId, updateData)
      .pipe(
        catchError((error) => {
          console.error('Error al asignar conductor:', error);
          const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
          this.alertModalService.show({
            title: 'Error al Asignar Conductor',
            message: `Hubo un error al asignar el conductor: ${errorMessage}. Por favor, intenta nuevamente.`,
            type: 'error',
            buttonText: 'Entendido'
          });
          return of(null);
        })
      )
      .subscribe((updatedMachine) => {
        if (updatedMachine) {
          // Forzar recarga de datos actualizando el refreshTrigger
          this.refreshTrigger.set(this.refreshTrigger() + 1);
        }
      });
  }

}

