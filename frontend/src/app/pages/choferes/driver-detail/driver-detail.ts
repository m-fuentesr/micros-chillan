import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DriverService } from '../../../shared/services/driver.service';
import { MachineService } from '../../../shared/services/machine.service';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { AccountingService } from '../../../shared/services/accounting.service';
import type { DailyRecord, DailyRecordStatus } from '../../../shared/models/daily-record.models';
import { Driver, DriverDailyRecord, DriverLiquidation } from '../../../shared/models/driver.models';
import type { Machine } from '../../../shared/models/machine.models';
import { catchError, of, switchMap, combineLatest } from 'rxjs';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { calculateLicenseStatus, formatLicenseExpiredText, formatLicenseWarningText } from '../../../shared/utils/license.utils';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { GlobalErrorService } from '../../../shared/services/global-error.service';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { SearchFilters, FilterField } from '../../../shared/components/search-filters/search-filters';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-driver-detail',
  imports: [CommonModule, RouterLink, FormsModule, UiIconComponent, SearchFilters, LoadingSpinner],
  template: `
    <div class="space-y-6 lg:space-y-8">
      @if (driver()) {
      <!-- Hero Section Premium -->
      <div class="hero-section bg-linear-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
          <div class="flex flex-col gap-6">
            <!-- Header con Botón Volver -->
        <div class="relative">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4 pr-12 sm:pr-0 mb-4">
            <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
              Detalle del Chofer
            </h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
              Información general, registros diarios e historial de liquidaciones del chofer.
            </p>
          </div>
          
          <!-- Botón Volver - Esquina superior derecha en mobile, normal en desktop -->
          <button
            type="button"
            class="absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto btn btn-ghost btn-sm gap-2 hover:bg-base-200/50 transition-all shrink-0 z-10"
            aria-label="Volver a la lista de choferes"
            (click)="onBack()">
            <ui-icon name="ChevronLeft" size="sm" />
            <span class="hidden sm:inline">Volver</span>
          </button>
      </div>

            <!-- Información destacada del chofer en el hero con botones -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <!-- Información del chofer -->
              <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                <div class="flex items-center gap-3 shrink-0">
                  <div class="w-12 h-12 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ui-icon name="IdCard" size="md" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="text-xl md:text-2xl font-bold text-base-content">
                      {{ driver()!.nombre_completo }}
                    </h2>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-content/70 mt-0.5">
                    <span class="font-mono font-semibold">{{ driver()!.rut }}</span>
                    <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span class="truncate tooltip" [attr.data-tip]="driver()!.correo">{{ driver()!.correo }}</span>
                    <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span>{{ driver()!.telefono }}</span>
                  </div>
                </div>
                </div>
                <span 
                  class="badge gap-1.5 text-white font-medium shadow-sm px-3 py-2 shrink-0"
                  [class.badge-success]="driver()!.estado === 'activo'"
                  [class.badge-error]="driver()!.estado === 'inactivo'">
                  <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {{ driver()!.estado === 'activo' ? 'Activo' : 'Inactivo' }}
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
                    class="btn-action-edit group relative overflow-hidden rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary-focus shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
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
                  [class.tab-active]="activeTab() === 'liquidations'"
              [class.bg-primary]="activeTab() === 'liquidations'"
              [class.text-primary-content]="activeTab() === 'liquidations'"
                  [class.btn-disabled]="isEditingGeneral()"
                  [attr.disabled]="isEditingGeneral() ? '' : null"
                  (click)="setActiveTab('liquidations')">
                  Liquidaciones
                </button>
          </div>
        </div>

        <!-- Contenido de Tabs con animaciones -->
        <div class="tab-content-wrapper">

        <!-- Contenido pestaña General -->
        @if (activeTab() === 'general') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-tab-enter">
            
            <!-- Información Personal -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-3xl h-full animate-card-stagger" [style.animation-delay]="'0ms'">
              <div class="card-body p-6">
                <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                  <ui-icon name="User" size="sm" class="text-primary" />
                  Información Personal
                </h3>

                <div class="grid grid-cols-1 gap-4">
                  <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                    <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                      Nombre Completo
                    </span>
                    @if (isEditingGeneral()) {
                      <div class="grid grid-cols-2 gap-2 mt-1">
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-semibold text-base-content/60">
                            Primer nombre <span class="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            class="input input-sm w-full"
                            [value]="editNombre()"
                            (input)="editNombre.set($any($event.target).value)"
                            placeholder="Primer nombre">
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-semibold text-base-content/60">
                            Segundo nombre
                          </label>
                          <input
                            type="text"
                            class="input input-sm w-full"
                            [value]="editSegundoNombre()"
                            (input)="editSegundoNombre.set($any($event.target).value)"
                            placeholder="Segundo nombre">
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2 mt-2">
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-semibold text-base-content/60">
                            Apellido paterno <span class="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            class="input input-sm w-full"
                            [value]="editApellido()"
                            (input)="editApellido.set($any($event.target).value)"
                            placeholder="Apellido paterno">
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-semibold text-base-content/60">
                            Apellido materno <span class="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            class="input input-sm w-full"
                            [value]="editSegundoApellido()"
                            (input)="editSegundoApellido.set($any($event.target).value)"
                            placeholder="Apellido materno">
                        </div>
                      </div>
                    } @else {
                      <div class="font-bold text-lg text-base-content">
                        {{ driver()!.nombre_completo }}
                      </div>
                    }
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        RUT <span class="text-error">*</span>
                      </span>
                      @if (isEditingGeneral()) {
                        <input
                          type="text"
                          class="input input-sm w-full mt-1 font-mono font-bold"
                          [value]="editRut()"
                          (input)="editRut.set($any($event.target).value)"
                          placeholder="RUT">
                      } @else {
                        <div class="font-mono font-bold text-base-content">
                          {{ driver()!.rut }}
                        </div>
                      }
                    </div>
                    <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        Estado
                      </span>
                      @if (isEditingGeneral()) {
                        <select
                          class="select select-sm w-full"
                          [value]="editEstado()"
                          (change)="editEstado.set($any($event.target).value)">
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                      } @else {
                        <span
                          class="badge font-bold border-0 py-3"
                          [class.bg-success/20]="driver()!.estado === 'activo'"
                          [class.text-success]="driver()!.estado === 'activo'"
                          [class.bg-error/20]="driver()!.estado === 'inactivo'"
                          [class.text-error]="driver()!.estado === 'inactivo'">
                          {{ driver()!.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                    <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-3">
                      CONTACTO
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                          Teléfono <span class="text-error">*</span>
                        </span>
                        @if (isEditingGeneral()) {
                          <input
                            type="tel"
                            class="input input-sm w-full"
                            [value]="editTelefono()"
                            (input)="editTelefono.set($any($event.target).value)"
                            placeholder="Teléfono">
                        } @else {
                          <div class="font-semibold text-base-content font-mono">{{ driver()!.telefono }}</div>
                        }
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                          Correo <span class="text-error">*</span>
                        </span>
                        @if (isEditingGeneral()) {
                          <input
                            type="email"
                            class="input input-sm w-full"
                            [value]="editCorreo()"
                            (input)="editCorreo.set($any($event.target).value)"
                            placeholder="Correo electrónico">
                        } @else {
                          <div class="font-semibold text-base-content truncate tooltip" [attr.data-tip]="driver()!.correo">
                            {{ driver()!.correo }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        Porcentaje de Pago
                      </span>
                      @if (isEditingGeneral()) {
                        <div class="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            class="input input-sm w-full"
                            [value]="editPorcentajePago()"
                            (input)="onPorcentajePagoChange($any($event.target).value)"
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.5">
                          <span class="text-sm font-bold">%</span>
                        </div>
                      } @else {
                        <div class="font-bold text-lg text-primary">
                          {{ formatPorcentajeForDisplay(driver()!.porcentaje_pago) }}%
                        </div>
                      }
                    </div>

                    <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        Fecha de Contrato
                      </span>
                      @if (isEditingGeneral()) {
                        <input
                          type="date"
                          class="input input-sm w-full mt-1"
                          [value]="editFechaContrato()"
                          (input)="editFechaContrato.set($any($event.target).value)">
                      } @else {
                        <div class="font-semibold text-base-content">
                          {{ driver()!.fecha_contrato ? formatDate(driver()!.fecha_contrato || null) : '— Sin fecha —' }}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <!-- Contenedor Bento Grid: Licencia y Máquina Asignada -->
              <div class="flex flex-col gap-6 lg:gap-8 animate-card-stagger" [style.animation-delay]="'100ms'">
            <!-- Licencia -->
                <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl">
              <div class="card-header px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-50 rounded-t-2xl">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <ui-icon name="IdCard" size="sm" class="text-primary" />
                  Licencia de Conducir
                </h3>
              </div>

                  <div class="p-4">
                <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-base-50/30"
                  [class.border-error/50]="licenseStatus().estado === 'error'"
                  [class.bg-error/5]="licenseStatus().estado === 'error'"
                  [class.border-warning/50]="licenseStatus().estado === 'warning'"
                  [class.bg-warning/5]="licenseStatus().estado === 'warning'"
                  [class.border-success/50]="licenseStatus().estado === 'ok'"
                  [class.bg-success/5]="licenseStatus().estado === 'ok'">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    [class.bg-error/5]="licenseStatus().estado === 'error'"
                    [class.text-error]="licenseStatus().estado === 'error'"
                    [class.border-error/20]="licenseStatus().estado === 'error'"
                    [class.bg-warning/5]="licenseStatus().estado === 'warning'"
                    [class.text-warning]="licenseStatus().estado === 'warning'"
                    [class.border-warning/20]="licenseStatus().estado === 'warning'"
                    [class.bg-success/5]="licenseStatus().estado === 'ok'"
                    [class.text-success]="licenseStatus().estado === 'ok'"
                    [class.border-success/20]="licenseStatus().estado === 'ok'">
                    <ui-icon name="IdCard" size="sm" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="text-xs font-bold uppercase tracking-wider text-base-content/60">
                        Fecha de Vencimiento
                      </p>
                      @if (!isEditingGeneral()) {
                        @if (licenseStatus().estado === 'error') {
                          <span class="badge badge-xs badge-error badge-outline">Vencida</span>
                        } @else if (licenseStatus().estado === 'warning') {
                          <span class="badge badge-xs badge-warning badge-outline">Por vencer</span>
                        }
                      }
                    </div>
                    @if (isEditingGeneral()) {
                      <input
                        type="date"
                        class="input input-sm w-full mt-1"
                        [value]="editFechaVencLicencia()"
                        (input)="editFechaVencLicencia.set($any($event.target).value)">
                    } @else {
                      <p class="font-semibold text-base-content">
                        {{ formatDate(licenseStatus().fecha) }}
                      </p>
                      @if (licenseStatus().dias_restantes !== undefined) {
                        <p class="text-xs text-base-content/50 mt-1">
                          {{ licenseStatus().texto }}
                        </p>
                      }
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Máquina Asignada -->
                <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden">
              <div class="h-24 bg-linear-to-br from-primary/20 via-primary/5 to-transparent"></div>

              <div class="card-body p-6 pt-0 -mt-12 text-center flex flex-col items-center">
                @if (driver()!.maquina_actual) {
                  <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-4">
                    <ui-icon name="BusFront" size="lg" />
                  </div>

                  <h4 class="text-xl font-bold text-base-content">
                    {{ driver()!.maquina_actual?.identificador }}
                  </h4>
                  <p class="text-sm font-medium text-primary mb-1">
                    Máquina Asignada
                  </p>

                  @if (isEditingGeneral()) {
                    <div class="w-full mt-2 text-left">
                      <label class="label py-1">
                        <span class="label-text text-xs font-semibold text-base-content/60">
                          Cambiar máquina asignada
                        </span>
                      </label>
                      <select
                        class="select select-sm w-full max-w-xs"
                        [ngModel]="maquinaSelectValueComputed()"
                        (ngModelChange)="handleMaquinaChangeFromNgModel($event)">
                        @if (maquinaSelectValueComputed() && maquinaSelectValueComputed() !== '') {
                          @for (m of maquinasSelectOrdered(); track m.id) {
                            <option [value]="m.id.toString()">
                              {{ m.identificador }}
                            </option>
                          }
                          <option value="">Sin asignar</option>
                        } @else {
                          <option value="">Sin asignar</option>
                          @for (m of maquinas(); track m.id) {
                            <option [value]="m.id.toString()">
                              {{ m.identificador }}
                            </option>
                          }
                        }
                      </select>
                    </div>
                  }

                  <div class="w-full mt-auto"></div>
                } @else {
                  <div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-primary mb-4">
                    <ui-icon name="BusFront" size="lg" />
                  </div>
                  <h4 class="text-lg font-bold text-base-content/70">
                    Sin Asignar
                  </h4>
                  <p class="text-sm text-base-content/50 mb-6 px-4">
                    Este chofer no tiene máquina asignada actualmente.
                  </p>
                  @if (isEditingGeneral()) {
                    <div class="w-full mt-2 text-left">
                      <label class="label py-1">
                        <span class="label-text text-xs font-semibold text-base-content/60">
                          Asignar máquina
                        </span>
                      </label>
                      <select
                        class="select select-sm w-full max-w-xs"
                        [ngModel]="maquinaSelectValueComputed()"
                        (ngModelChange)="handleMaquinaChangeFromNgModel($event)">
                        @if (maquinaSelectValueComputed() && maquinaSelectValueComputed() !== '') {
                          @for (m of maquinasSelectOrdered(); track m.id) {
                            <option [value]="m.id.toString()">
                              {{ m.identificador }}
                            </option>
                          }
                          <option value="">Sin asignar</option>
                        } @else {
                          <option value="">Sin asignar</option>
                          @for (m of maquinas(); track m.id) {
                            <option [value]="m.id.toString()">
                              {{ m.identificador }}
                            </option>
                          }
                        }
                      </select>
                    </div>
                  } @else {
                    <button
                      class="btn btn-primary w-full shadow-lg shadow-primary/20"
                      [routerLink]="['/choferes', driver()?.id, 'editar']">
                      Asignar Máquina
                    </button>
                  }
                }
                  </div>
              </div>
            </div>
          </div>
        }

          <!-- Registros diarios -->
        @if (activeTab() === 'records' && loadedTabs().has('records')) {
            <div class="animate-tab-enter">
              <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
                <!-- Header -->
                <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex-1 min-w-0">
                      <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
                    Registros Diarios
                  </h2>
                      <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
                    Historial de operaciones y rendimiento por jornada.
                  </p>
                </div>
                    
                    <!-- Badge de conteo mejorado -->
                    <div class="flex items-center gap-3 shrink-0">
                      <span class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
                        <span class="w-2 h-2 rounded-full bg-primary"></span>
                        {{ recordsTotalGlobal() }} {{ recordsTotalGlobal() === 1 ? 'registro' : 'registros' }}
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
                        class="btn btn-sm w-full justify-between rounded-lg border border-base-200 bg-base-100 shadow-sm min-h-11"
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
                            (click)="showFiltersMobile.set(false)">
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
                      [columns]="3"
                      (filterChange)="onRecordFilterChange($event)" />
                  </div>

              <!-- Vista Móvil: Cards -->
              <div class="block xl:hidden space-y-4">
                @if (recordsLoading()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando registros..." />
                  </div>
                } @else {
                  @for (record of dailyRecords(); track record.id; let i = $index) {
                  <div 
                    class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
                    [style.animation-delay.ms]="i * 50"
                    [style.animation-fill-mode]="'both'">
                    <div class="card-body p-5">
                          <!-- Header: Fecha y Estado -->
                      <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3">
                          <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                            <ui-icon name="Calendar" size="sm" />
                          </div>
                          <div>
                            <h3 class="font-bold text-base text-base-content">{{ formatDate(record.fecha) }}</h3>
                            <p class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</p>
                          </div>
                        </div>
                            
                        <div class="badge badge-sm gap-1"
                          [class.badge-success]="record.estado === 'completo'"
                          [class.badge-warning]="record.estado === 'pendiente_trabajador'"
                          [class.badge-error]="record.estado === 'incidente_reportado'"
                          [class.badge-ghost]="record.estado === 'no_trabajado'">
                          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {{ formatEstado(record.estado) }}
                        </div>
                      </div>

                          <!-- Divider -->
                          <div class="divider my-2 opacity-30"></div>

                          <!-- Máquina -->
                          @if (record.maquina_id && record.maquina_identificador) {
                            <div class="mb-3">
                              <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Máquina</div>
                              <div class="flex items-center gap-2 cursor-pointer group" (click)="onViewMachineDetail(record.maquina_id, $event)">
                                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                                  <ui-icon name="BusFront" size="xs" class="text-primary" />
                                </div>
                                <span class="font-bold text-base-content group-hover:text-primary transition-colors">
                                  {{ record.maquina_identificador }}
                                </span>
                              </div>
                            </div>
                          }

                          <!-- Información Financiera -->
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Recaudado</div>
                          <div class="font-bold text-base tabular-nums text-success">
                            {{ formatCurrency(record.recaudado) }}
                          </div>
                        </div>
                        <div>
                          <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Diésel</div>
                          <div class="font-bold text-base tabular-nums text-error">
                            {{ formatCurrency(record.diesel) }}
                          </div>
                        </div>
                      </div>

                          <!-- Observaciones -->
                          @if (record.tiene_observaciones) {
                            <div class="mt-3 p-2 bg-info/10 rounded border border-info/20">
                              <div class="flex items-start gap-2">
                                <ui-icon name="Info" size="xs" class="text-info shrink-0 mt-0.5" />
                                <p class="text-xs text-base-content/70 flex-1">Este registro tiene observaciones</p>
                              </div>
                            </div>
                          }

                          <!-- Botón de Acción -->
                      <div class="mt-4">
                        <a 
                          [routerLink]="['/registro-diario', record.id]"
                          class="btn btn-sm w-full btn-outline gap-2 hover:btn-primary transition-all">
                          <ui-icon name="Eye" size="xs" />
                          Ver Detalle
                        </a>
                      </div>
                    </div>
                  </div>
                  } @empty {
                    <div class="py-16 sm:py-20">
                      <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                          <ui-icon name="Calendar" size="lg" class="text-base-content/40" />
                        </div>
                        <div class="space-y-2">
                          <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay registros que coincidan con los filtros</h3>
                          <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                            Ajusta los filtros para ver más resultados.
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Vista Desktop: Tabla -->
              <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
                @if (recordsLoading()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando registros..." />
                  </div>
                } @else {
                  <table class="table w-full table-min-height">
                    <thead class="bg-base-50 border-b border-base-200">
                      <tr>
                        <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[150px]">Máquina</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Recaudado</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Diésel</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Neto</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                        <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-20">OBS.</th>
                        <th class="py-4 pr-6 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (record of dailyRecords(); track record.id; let i = $index) {
                      <tr 
                            class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter cursor-pointer"
                        [style.animation-delay.ms]="i * 30"
                            [style.animation-fill-mode]="'both'"
                            (click)="onViewRecordDetail(record)">
                            
                        <td class="pl-6 py-4">
                              <div class="flex items-center gap-3">
                                <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                              <ui-icon name="Calendar" size="xs" />
                            </div>
                            <div>
                                  <div class="font-bold text-base-content">{{ formatDate(record.fecha) }}</div>
                              <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</div>
                            </div>
                          </div>
                        </td>
                            
                        <td class="text-center py-4" (click)="$event.stopPropagation()">
                          @if (record.maquina_id && record.maquina_identificador) {
                            <div class="flex items-center justify-center gap-2 cursor-pointer group" (click)="onViewMachineDetail(record.maquina_id, $event)">
                              <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                                <ui-icon name="BusFront" size="xs" class="text-primary" />
                              </div>
                              <span class="font-bold text-base-content group-hover:text-primary transition-colors tooltip" [attr.data-tip]="record.maquina_identificador">
                                {{ record.maquina_identificador }}
                              </span>
                            </div>
                          } @else {
                            <span class="text-base-content/30 italic">—</span>
                          }
                        </td>
                            
                            <td class="text-right py-4 font-mono font-bold text-success tabular-nums text-sm">
                              {{ formatCurrency(record.recaudado) }}
                            </td>
                            
                            <td class="text-right py-4 font-mono font-bold text-error tabular-nums text-sm">
                              {{ formatCurrency(record.diesel) }}
                            </td>
                            
                            <td class="text-right py-4 font-mono font-bold text-base-content tabular-nums text-sm">
                              {{ formatCurrency(record.recaudado - record.diesel) }}
                            </td>
                            
                        <td class="text-center py-4">
                          <div class="badge badge-sm gap-1"
                            [class.badge-success]="record.estado === 'completo'"
                            [class.badge-warning]="record.estado === 'pendiente_trabajador'"
                            [class.badge-error]="record.estado === 'incidente_reportado'"
                            [class.badge-ghost]="record.estado === 'no_trabajado'">
                            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {{ formatEstado(record.estado) }}
                          </div>
                        </td>
                            
                            <td class="text-center py-4" (click)="$event.stopPropagation()">
                              <div class="flex items-center justify-center">
                                @if (record.tiene_observaciones) {
                                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer group">
                                    <ui-icon name="Info" size="xs" class="text-primary group-hover:scale-110 transition-transform" />
                                  </div>
                                } @else {
                                  <div class="w-8 h-8 rounded-full bg-base-200/50 flex items-center justify-center border border-base-200">
                                    <ui-icon name="Info" size="xs" class="text-base-content/30" />
                                  </div>
                                }
                              </div>
                            </td>
                            
                            <td class="pr-6 text-right py-4" (click)="$event.stopPropagation()">
                            <a 
                              [routerLink]="['/registro-diario', record.id]"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-base-content/70 hover:text-primary bg-base-100 hover:bg-primary/5 border border-base-200 hover:border-primary/30 transition-all duration-200 group">
                                <ui-icon name="Eye" size="xs" class="group-hover:scale-110 transition-transform" />
                                <span>Ver</span>
                            </a>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                            <td colspan="8" class="py-16 sm:py-20">
                              <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                                  <ui-icon name="Calendar" size="lg" class="text-base-content/40" />
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
                      <!-- Filas vacías para mantener altura mínima en desktop -->
                      @if (dailyRecords().length > 0 && dailyRecords().length < 5) {
                        @for (i of getEmptyRows(); track i) {
                          <tr class="empty-row-spacer">
                            <td colspan="8" class="h-20"></td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                }
              </div>

              <!-- Paginación -->
              @if (recordsTotalPages() > 0 && !recordsLoading()) {
                <div class="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
                  <span>Mostrando {{ getStartRecord() }}-{{ getEndRecord() }} de {{ recordsTotal() }} registros</span>
                  <div class="join">
                    <button 
                      (click)="onRecordsPageChange(recordsCurrentPage() - 1)" 
                      [disabled]="recordsCurrentPage() === 1 || recordsLoading()" 
                      class="join-item btn btn-sm px-3" 
                      [class.btn-disabled]="recordsCurrentPage() === 1 || recordsLoading()">
                      «
                    </button>
                    @for (page of getRecordsPages(); track page) {
                      <button 
                        (click)="onRecordsPageChange(page)" 
                        [disabled]="recordsLoading()" 
                        [class.btn-active]="page === recordsCurrentPage()" 
                        class="join-item btn btn-sm px-4">{{ page }}</button>
                    }
                    <button 
                      (click)="onRecordsPageChange(recordsCurrentPage() + 1)" 
                      [disabled]="recordsCurrentPage() === recordsTotalPages() || recordsLoading()" 
                      class="join-item btn btn-sm px-3" 
                      [class.btn-disabled]="recordsCurrentPage() === recordsTotalPages() || recordsLoading()">
                      »
                    </button>
                  </div>
                </div>
              }
                </div>
            </div>
          </div>
        }

        <!-- Liquidaciones -->
        @if (activeTab() === 'liquidations' && loadedTabs().has('liquidations')) {
            <div class="animate-tab-enter">
              <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
                <!-- Header -->
                <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex-1 min-w-0">
                      <h2 class="card-title text-xl sm:text-2xl lg:text-3xl font-bold border-l-4 border-l-primary pl-3 sm:pl-4 mb-2">
                    Liquidaciones
                  </h2>
                      <p class="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-2xl">
                        Historial de pagos y liquidaciones mensuales del chofer.
                  </p>
                </div>
                    
                    <!-- Badge de conteo mejorado -->
                    <div class="flex items-center gap-3 shrink-0">
                      <span class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-base-content border border-primary/30 text-sm font-semibold shadow-sm whitespace-nowrap">
                        <span class="w-2 h-2 rounded-full bg-primary"></span>
                  {{ liquidationsTotalGlobal() }} {{ liquidationsTotalGlobal() === 1 ? 'liquidación' : 'liquidaciones' }}
                </span>
              </div>
            </div>
                </div>

                <div class="card-body p-1 sm:p-6 lg:p-8 pt-2 sm:pt-4 lg:pt-6 pb-12 sm:pb-16 lg:pb-20">
                  <!-- Filtros -->
                  <div class="mb-6">
                    <app-search-filters
                      [fields]="[
                        {
                          key: 'fecha_desde',
                          label: 'Período Desde',
                          type: 'date',
                          placeholder: 'Seleccionar mes',
                          monthOnly: true
                        },
                        {
                          key: 'fecha_hasta',
                          label: 'Período Hasta',
                          type: 'date',
                          placeholder: 'Seleccionar mes',
                          monthOnly: true
                        },
                        {
                          key: 'estado',
                          label: 'Estado',
                          type: 'select',
                          options: [
                            { value: 'all', label: 'Todos' },
                            { value: 'pagado', label: 'Pagado' },
                            { value: 'pendiente', label: 'Pendiente' }
                          ]
                        }
                      ]"
                      [columns]="3"
                      [filters]="{
                        fecha_desde: liquidationFilters().fecha_desde || null,
                        fecha_hasta: liquidationFilters().fecha_hasta || null,
                        estado: liquidationFilters().estado || 'all'
                      }"
                      (filterChange)="onLiquidationFilterChange($event)"
                    />
                  </div>

              <!-- Vista Móvil: Cards -->
              <div class="block xl:hidden space-y-4">
                @if (liquidationsLoading()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando liquidaciones..." />
                  </div>
                } @else {
                  @for (liquidation of liquidations(); track liquidation.id; let i = $index) {
                  <div 
                    class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
                    [style.animation-delay.ms]="i * 50"
                    [style.animation-fill-mode]="'both'">
                    <div class="card-body p-5">
                          <!-- Header: Período y Estado -->
                      <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3">
                          <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                            <ui-icon name="Calendar" size="sm" />
                          </div>
                          <div>
                            <h3 class="font-bold text-base text-base-content">Período {{ liquidation.fecha }}</h3>
                                <p class="text-xs text-base-content/50 font-mono">Liquidación mensual</p>
                          </div>
                        </div>
                        <div class="badge badge-sm gap-1"
                          [class.badge-success]="liquidation.estado_pago === 'pagado'"
                          [class.badge-warning]="liquidation.estado_pago === 'pendiente'">
                          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {{ liquidation.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente' }}
                        </div>
                      </div>

                          <!-- Divider -->
                          <div class="divider my-2 opacity-30"></div>

                          <!-- Información Financiera -->
                          <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Total Ganado</div>
                          <div class="font-bold text-base tabular-nums text-base-content">
                            {{ formatCurrency(liquidation.total_ganado) }}
                          </div>
                        </div>
                        <div>
                          <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Pago Final</div>
                          <div class="font-bold text-lg tabular-nums text-success">
                            {{ formatCurrency(liquidation.pago_final) }}
                          </div>
                        </div>
                      </div>

                          <!-- Detalles -->
                          <div class="p-3 bg-base-50 rounded-lg border border-base-200">
                        <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Detalles</div>
                            <div class="space-y-2 text-xs">
                              <div class="flex justify-between items-center">
                            <span class="text-base-content/60">Mínimo Garantizado:</span>
                                <span class="font-semibold tabular-nums">{{ formatCurrency(liquidation.minimo_garantizado) }}</span>
                          </div>
                              <div class="flex justify-between items-center">
                                <span class="text-base-content/60">Método de Pago:</span>
                                <span class="badge badge-xs badge-ghost uppercase">
                                  {{ liquidation.metodo_pago || '—' }}
                                </span>
                          </div>
                          @if (liquidation.codigo_transferencia) {
                                <div class="flex justify-between items-center">
                                  <span class="text-base-content/60">Código/Ref.:</span>
                                  <span class="font-mono font-semibold text-xs">{{ liquidation.codigo_transferencia }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  } @empty {
                    <div class="py-16 sm:py-20">
                      <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                          <ui-icon name="HandCoins" size="lg" class="text-base-content/40" />
                        </div>
                        <div class="space-y-2">
                          <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay liquidaciones disponibles</h3>
                          <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                            El chofer aún no tiene liquidaciones registradas.
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Vista Desktop: Tabla -->
              <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
                @if (liquidationsLoading()) {
                  <div class="flex justify-center items-center py-12">
                    <app-loading-spinner size="md" text="Cargando liquidaciones..." />
                  </div>
                } @else {
                  <table class="table w-full table-min-height">
                    <thead class="bg-base-50 border-b border-base-200">
                      <tr>
                        <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Período</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[140px]">Total Ganado</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[140px]">Mínimo Garantizado</th>
                        <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[140px]">Pago Final</th>
                        <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Método</th>
                        <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Código/Ref.</th>
                        <th class="py-4 pr-6 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (liquidation of liquidations(); track liquidation.id; let i = $index) {
                      <tr 
                        class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter"
                        [style.animation-delay.ms]="i * 30"
                        [style.animation-fill-mode]="'both'">
                        <td class="pl-6 py-4">
                              <div class="flex items-center gap-3">
                                <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                              <ui-icon name="Calendar" size="xs" />
                            </div>
                            <div>
                                  <div class="font-bold text-base-content">{{ liquidation.fecha }}</div>
                                  <div class="text-xs text-base-content/50 font-mono">Liquidación mensual</div>
                            </div>
                          </div>
                        </td>
                        <td class="text-right py-4 font-mono font-bold text-base-content tabular-nums text-sm">
                          {{ formatCurrency(liquidation.total_ganado) }}
                        </td>
                        <td class="text-right py-4 font-mono font-bold text-base-content/70 tabular-nums text-sm">
                          {{ formatCurrency(liquidation.minimo_garantizado) }}
                        </td>
                        <td class="text-right py-4 font-mono font-bold text-success tabular-nums text-sm">
                          {{ formatCurrency(liquidation.pago_final) }}
                        </td>
                        <td class="py-4">
                          <div class="badge badge-xs badge-ghost uppercase">
                            {{ liquidation.metodo_pago || '—' }}
                          </div>
                        </td>
                        <td class="py-4">
                          <div class="font-mono text-sm text-base-content/70">
                            {{ liquidation.codigo_transferencia || '—' }}
                          </div>
                        </td>
                        <td class="pr-6 text-center py-4">
                          <div class="badge badge-sm gap-1"
                            [class.badge-success]="liquidation.estado_pago === 'pagado'"
                            [class.badge-warning]="liquidation.estado_pago === 'pendiente'">
                            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {{ liquidation.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente' }}
                          </div>
                        </td>
                      </tr>
                      } @empty {
                        <tr>
                          <td colspan="7" class="py-16 sm:py-20">
                            <div class="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center">
                              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-base-200/60 flex items-center justify-center">
                                <ui-icon name="HandCoins" size="lg" class="text-base-content/40" />
                              </div>
                              <div class="space-y-2">
                                <h3 class="text-lg sm:text-xl font-semibold text-base-content">No hay liquidaciones disponibles</h3>
                                <p class="text-sm sm:text-base text-base-content/60 leading-relaxed">
                                  El chofer aún no tiene liquidaciones registradas.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      }
                      <!-- Filas vacías para mantener altura mínima en desktop -->
                      @if (liquidations().length > 0 && liquidations().length < 5) {
                        @for (i of getEmptyLiquidationRows(); track i) {
                          <tr class="empty-row-spacer">
                            <td colspan="7" class="h-20"></td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                }
              </div>

              <!-- Paginación -->
              @if (liquidationsTotalPages() > 1 && !liquidationsLoading()) {
                <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div class="text-sm text-base-content/60">
                    Mostrando {{ getStartLiquidationRecord() }} - {{ getEndLiquidationRecord() }} de {{ liquidationsTotal() }} liquidaciones
                  </div>
                  <div class="join">
                    <button
                      class="join-item btn btn-sm btn-outline"
                      [disabled]="liquidationsCurrentPage() === 1"
                      (click)="onLiquidationPageChange(liquidationsCurrentPage() - 1)">
                      «
                    </button>
                    @for (page of getLiquidationPages(); track page) {
                      <button
                        class="join-item btn btn-sm"
                        [class.btn-active]="page === liquidationsCurrentPage()"
                        (click)="onLiquidationPageChange(page)">
                        {{ page }}
                      </button>
                    }
                    <button
                      class="join-item btn btn-sm btn-outline"
                      [disabled]="liquidationsCurrentPage() === liquidationsTotalPages()"
                      (click)="onLiquidationPageChange(liquidationsCurrentPage() + 1)">
                      »
                    </button>
                  </div>
                </div>
              }
              </div>
            </div>
          </div>
        }
        </div>
      } @else {
        @if (driverLoadingState.isLoading()) {
          <!-- Skeleton completo de la estructura de detalle del chofer -->
          <!-- Se muestra siempre que isLoading() es true, incluso antes del umbral de 200ms -->
          <div class="space-y-6 lg:space-y-8 animate-fade-in">
            <!-- Hero Section Skeleton -->
            <div class="hero-section bg-linear-to-br from-primary/5 via-base-100 to-base-200/50 rounded-2xl p-6 md:p-8 lg:p-10 mb-6">
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
                
                <!-- Información destacada del chofer -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <!-- Información del chofer -->
                  <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    <div class="flex items-center gap-3 shrink-0">
                      <div class="w-12 h-12 skeleton-shimmer rounded-xl"></div>
                      <div class="min-w-0">
                        <div class="h-7 w-48 skeleton-shimmer rounded mb-2"></div>
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                          <div class="w-1 h-1 skeleton-shimmer rounded-full"></div>
                          <div class="h-4 w-40 skeleton-shimmer rounded"></div>
                          <div class="w-1 h-1 skeleton-shimmer rounded-full"></div>
                          <div class="h-4 w-24 skeleton-shimmer rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div class="h-8 w-20 skeleton-shimmer rounded-full"></div>
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
            <div class="bg-base-50/50 rounded-2xl p-4 border border-base-200/50">
              <div class="tabs tabs-boxed bg-base-100/50 p-1 gap-1">
                <div class="h-10 w-24 skeleton-shimmer rounded-lg"></div>
                <div class="h-10 w-32 skeleton-shimmer rounded-lg"></div>
                <div class="h-10 w-28 skeleton-shimmer rounded-lg"></div>
              </div>
            </div>

            <!-- Contenido de Tabs Skeleton -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <!-- Información Personal Skeleton -->
              <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl h-full">
                <div class="card-body p-6">
                  <div class="h-6 w-40 skeleton-shimmer rounded mb-4"></div>
                  <div class="grid grid-cols-1 gap-4">
                    <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                      <div class="h-3 w-32 skeleton-shimmer rounded mb-2"></div>
                      <div class="h-6 w-full skeleton-shimmer rounded"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                        <div class="h-3 w-16 skeleton-shimmer rounded mb-2"></div>
                        <div class="h-5 w-full skeleton-shimmer rounded"></div>
                      </div>
                      <div class="bg-base-200/50 p-3 rounded-3xl border border-base-200">
                        <div class="h-3 w-16 skeleton-shimmer rounded mb-2"></div>
                        <div class="h-5 w-full skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                    <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                      <div class="h-3 w-24 skeleton-shimmer rounded mb-2"></div>
                      <div class="space-y-2">
                        <div class="h-4 w-20 skeleton-shimmer rounded"></div>
                        <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                    <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                      <div class="h-3 w-36 skeleton-shimmer rounded mb-2"></div>
                      <div class="h-6 w-20 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contenedor Bento Grid: Licencia y Máquina Asignada Skeleton -->
              <div class="flex flex-col gap-6 lg:gap-8">
                <!-- Licencia Skeleton -->
                <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl">
                  <div class="card-header px-6 py-4 border-b border-base-200 bg-base-50 rounded-t-2xl">
                    <div class="h-6 w-48 skeleton-shimmer rounded"></div>
                  </div>
                  <div class="p-4">
                    <div class="p-3 border border-base-200 rounded-xl flex items-center gap-4 bg-base-50/30">
                      <div class="w-10 h-10 skeleton-shimmer rounded-lg"></div>
                      <div class="flex-1 min-w-0">
                        <div class="h-3 w-40 skeleton-shimmer rounded mb-2"></div>
                        <div class="h-5 w-32 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Máquina Asignada Skeleton -->
                <div class="card bg-base-100 shadow-lg border border-base-200/50 rounded-2xl overflow-hidden">
                  <div class="h-24 bg-linear-to-br from-primary/20 via-primary/5 to-transparent"></div>
                  <div class="card-body p-6 pt-0 -mt-12 text-center flex flex-col items-center">
                    <div class="w-16 h-16 skeleton-shimmer rounded-2xl mb-4"></div>
                    <div class="h-6 w-32 skeleton-shimmer rounded mb-2"></div>
                    <div class="h-4 w-40 skeleton-shimmer rounded mb-6"></div>
                    <div class="h-10 w-full max-w-xs skeleton-shimmer rounded"></div>
                  </div>
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
    
    @keyframes componentEnter {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-component-enter {
      animation: componentEnter 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
      .animate-fade-in-down,
      .animate-fade-in-up,
      .animate-tab-enter,
      .animate-card-stagger,
      .animate-component-enter,
      .animate-card-enter,
      .animate-table-row-enter,
      .animate-fade-in {
        animation: none;
        transform: none;
      }
    }
    
    /* Filas vacías invisibles para mantener altura mínima en desktop */
    @media (min-width: 1280px) {
      .empty-row-spacer {
        visibility: hidden;
        pointer-events: none;
      }

      .empty-row-spacer td {
        border: none;
        padding: 0;
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
    
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
      background-size: 2000px 100%;
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
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
    
    .animate-fade-in {
      animation: fade-in 400ms ease-out both;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .skeleton-shimmer {
        animation: none;
      }
      .animate-fade-in {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private driverService = inject(DriverService);
  private machineService = inject(MachineService);
  private dailyRecordService = inject(DailyRecordService);
  private accountingService = inject(AccountingService);
  private loadingStateService = inject(LoadingStateService);
  private confirmModalService = inject(ConfirmModalService);
  private alertModalService = inject(AlertModalService);
  private globalErrorService = inject(GlobalErrorService);
  
  // Estado de carga con umbral de 200ms
  driverLoadingState = this.loadingStateService.createLoadingState();

  isEditingGeneral = signal(false);
  activeTab = signal<'general' | 'records' | 'liquidations'>('general');
  showFiltersMobile = signal(false);
  
  // Valores editables temporales
  editNombre = signal<string>('');
  editSegundoNombre = signal<string>('');
  editApellido = signal<string>('');
  editSegundoApellido = signal<string>('');
  editRut = signal<string>('');
  editTelefono = signal<string>('');
  editCorreo = signal<string>('');
  editEstado = signal<'activo' | 'inactivo'>('activo');
  editPorcentajePago = signal<number>(0);
  editFechaVencLicencia = signal<string>('');
  editFechaContrato = signal<string>('');
  editMaquinaId = signal<number | null>(null);

  // Signal para el valor del select de máquina (para evitar problemas con el binding)
  maquinaSelectValue = signal<string>('');

  // Computed signal para el valor del select que siempre está sincronizado
  maquinaSelectValueComputed = computed(() => {
    if (this.isEditingGeneral()) {
      // En modo edición, primero verificar editMaquinaId (se establece en toggleEditGeneral)
      const editId = this.editMaquinaId();
      if (editId !== null && editId !== undefined) {
        return String(editId);
      }
      
      // Si no hay editMaquinaId, verificar maquinaSelectValue (puede haber sido cambiado por el usuario)
      const selectValue = this.maquinaSelectValue();
      if (selectValue !== '') {
        return selectValue;
      }
      
      // Si no hay valor en ninguno, usar el valor del chofer como fallback
      const maquinaId = this.driver()?.maquina_actual?.id;
      return maquinaId ? String(maquinaId) : '';
    }
    
    // Si no estamos en modo edición, usar el valor del chofer
    const maquinaId = this.driver()?.maquina_actual?.id;
    return maquinaId ? String(maquinaId) : '';
  });

  // Cargar chofer
  driverIdParam = toSignal(
    this.route.params.pipe(
      map(params => params['id'] ? Number(params['id']) : null)
    ),
    { initialValue: null }
  );

  driverId = computed(() => this.driverIdParam());

  // Signal para forzar recarga de datos
  refreshTrigger = signal(0);

  driverData = toSignal(
    combineLatest([
      this.route.params,
      toObservable(this.refreshTrigger)
    ]).pipe(
      switchMap(([params]) => {
        const id = params['id'] ? Number(params['id']) : null;
        if (!id) {
          return of<Driver | null>(null);
        }
        return this.driverService.getDriverById(id).pipe(
          catchError((error) => {
            console.error('Error cargando chofer:', error);
            // Mostrar error global
            this.globalErrorService.showError(
              'No se pudo cargar la información del chofer desde el servidor.',
              'Error al cargar chofer'
            );
            return of<Driver | null>(null);
          })
        );
      })
    ),
    { initialValue: null }
  );

  driver = computed(() => this.driverData());

  // Estado de licencia
  licenseStatus = computed(() => {
    const d = this.driver();
    if (!d) {
      return {
        fecha: null,
        estado: 'ok' as const,
        dias_restantes: undefined,
        texto: ''
      };
    }
    // Usar estado provisto por backend si existe
    if (d.licencia_estado) {
      const estado = d.licencia_estado.estado;
      const dias = d.licencia_estado.dias_restantes;
      const fecha = d.licencia_estado.fecha_vencimiento || d.fecha_venc_licencia || null;

      if (estado === 'danger') {
        return {
          fecha,
          estado: 'error' as const,
          dias_restantes: dias,
          texto: formatLicenseExpiredText(dias)
        };
      }

      if (estado === 'warning') {
        return {
          fecha,
          estado: 'warning' as const,
          dias_restantes: dias,
          texto: formatLicenseWarningText(dias)
        };
      }

      return {
        fecha,
        estado: 'ok' as const,
        dias_restantes: dias,
        texto: 'Al día'
      };
    }

    // Fallback a cálculo local con umbral por defecto (30) solo si no viene estado
    return calculateLicenseStatus(d.fecha_venc_licencia);
  });

  // Cargar máquinas para el select
  maquinasData = toSignal(
    this.machineService.getMachines().pipe(
      map(response => response.datos),
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  maquinas = computed(() => {
    const machines = this.maquinasData() ?? [];
    return machines.map((m: Machine) => ({
      id: m.id,
      identificador: `MÁQUINA ${m.numero || m.id}`
    }));
  });

  // Máquinas ordenadas: la asignada primero, luego las demás
  maquinasSelectOrdered = computed(() => {
    const maquinas = this.maquinas();
    const currentMaquinaId = this.driver()?.maquina_actual?.id;
    
    if (!currentMaquinaId) {
      return maquinas;
    }
    
    // Separar la máquina asignada del resto
    const assignedMaquina = maquinas.find((m: { id: number }) => m.id === currentMaquinaId);
    const otherMaquinas = maquinas.filter((m: { id: number }) => m.id !== currentMaquinaId);
    
    // Retornar la asignada primero, luego las demás
    return assignedMaquina ? [assignedMaquina, ...otherMaquinas] : maquinas;
  });

  // Registros diarios
  dailyRecords = signal<DriverDailyRecord[]>([]);
  recordFilters = signal<{ desde?: string | null; hasta?: string | null; orden?: 'mas_reciente' | 'mas_antiguo' }>({
    orden: 'mas_reciente'
  });
  
  // Paginación y estado
  recordsTotal = signal<number>(0);
  recordsTotalGlobal = signal<number>(0);
  recordsCurrentPage = signal<number>(1);
  recordsTotalPages = signal<number>(0);
  recordsLoading = signal<boolean>(false);
  recordsPerPage = 10;
  
  // Campos de filtro
  filterFields = computed((): FilterField[] => {
    return [
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
    const filters: { desde?: string | null; hasta?: string | null; orden?: 'mas_reciente' | 'mas_antiguo' } = {
      desde: newFilters['desde'] || null,
      hasta: newFilters['hasta'] || null,
      orden: (newFilters['orden'] || 'mas_reciente') as 'mas_reciente' | 'mas_antiguo'
    };
    this.recordFilters.set(filters);
    
    // Resetear a página 1 cuando cambian los filtros
    this.recordsCurrentPage.set(1);
    
    // Recargar datos del backend con los nuevos filtros
    this.loadDailyRecords();
  }

  onRecordsPageChange(page: number): void {
    this.recordsCurrentPage.set(page);
    this.loadDailyRecords();
  }
  
  getEmptyRows(): number[] {
    const count = this.dailyRecords().length;
    if (count === 0) return [];
    const needed = 5 - count;
    return needed > 0 ? Array.from({ length: needed }, (_, i) => i) : [];
  }

  getEmptyLiquidationRows(): number[] {
    const count = this.liquidations().length;
    if (count === 0) return [];
    const needed = 5 - count;
    return needed > 0 ? Array.from({ length: needed }, (_, i) => i) : [];
  }

  getRecordsPages(): number[] {
    const total = this.recordsTotalPages();
    const current = this.recordsCurrentPage();
    const pages: number[] = [];
    
    // Mostrar máximo 5 páginas
    const maxPages = 5;
    let start = Math.max(1, current - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);
    
    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getStartRecord(): number {
    return ((this.recordsCurrentPage() - 1) * this.recordsPerPage) + 1;
  }

  getEndRecord(): number {
    const page = this.recordsCurrentPage();
    const total = this.recordsTotal();
    return Math.min(page * this.recordsPerPage, total);
  }

  // Liquidaciones
  liquidations = signal<DriverLiquidation[]>([]);
  liquidationFilters = signal<{ 
    fecha_desde?: string | null; 
    fecha_hasta?: string | null; 
    estado?: 'all' | 'pagado' | 'pendiente' 
  }>({});
  liquidationsTotal = signal<number>(0);
  liquidationsTotalGlobal = signal<number>(0);
  liquidationsCurrentPage = signal<number>(1);
  liquidationsTotalPages = signal<number>(0);
  liquidationsLoading = signal<boolean>(false);
  liquidationsPerPage = 10;
  
  // Rastrear qué tabs han sido cargados
  loadedTabs = signal<Set<string>>(new Set(['general']));

  // Effect para detectar cuando el chofer está cargado
  private driverEffect = effect(() => {
    const driver = this.driver();
    if (driver && this.driverLoadingState.isLoading()) {
      this.driverLoadingState.setDataLoaded();
    }
  });

  ngOnInit(): void {
    // Iniciar estado de carga
    // Esto debe ejecutarse después de que el efecto esté definido
    // para que el skeleton pueda mostrarse antes de que el efecto detecte el driver
    this.driverLoadingState.setLoading(true);
  }
    
    // Efecto para cargar datos cuando el chofer cambia
  private driverDataEffect = effect(() => {
      const driver = this.driver();
      const driverId = this.driverId();
      
      if (!driverId) {
        this.router.navigate(['/choferes']);
        return;
      }

      if (driver) {
        // Cargar registros diarios del chofer
        this.loadDailyRecords();
        
        // Cargar liquidaciones
        this.loadLiquidations();
      }
    });

  toggleEditGeneral(): void {
    const isEditing = !this.isEditingGeneral();
    
    if (isEditing) {
      // Cambiar a la tab 'general' antes de activar el modo edición
      this.activeTab.set('general');
      
      // Inicializar valores editables con los valores actuales
      const d = this.driver();
      if (d) {
        // Si no hay campos individuales, intentar extraer del nombre_completo
        if (!d.nombre && d.nombre_completo) {
          const parts = d.nombre_completo.trim().split(/\s+/);
          this.editNombre.set(parts[0] || '');
          this.editSegundoNombre.set(parts[1] || '');
          this.editApellido.set(parts[2] || '');
          this.editSegundoApellido.set(parts[3] || '');
        } else {
          this.editNombre.set(d.nombre || '');
          this.editSegundoNombre.set(d.segundo_nombre || '');
          this.editApellido.set(d.apellido || '');
          this.editSegundoApellido.set(d.segundo_apellido || '');
        }
        this.editRut.set(d.rut || '');
        this.editTelefono.set(d.telefono || '');
        this.editCorreo.set(d.correo || '');
        // Mapear 'eliminado' a 'inactivo' por ahora hasta que se resuelva la lógica
        const estadoEdit = d.estado === 'eliminado' ? 'inactivo' : (d.estado || 'activo');
        this.editEstado.set(estadoEdit as 'activo' | 'inactivo');
        // Convertir de decimal (0.3) a porcentaje (30) para mostrar en el input
        this.editPorcentajePago.set(this.convertDecimalToPorcentaje(d.porcentaje_pago || 0));
        this.editFechaVencLicencia.set(d.fecha_venc_licencia || '');
        this.editFechaContrato.set(d.fecha_contrato || '');
        const maquinaId = d.maquina_actual?.id || null;
        this.editMaquinaId.set(maquinaId);
        // Actualizar también el valor del select - asegurarse de que sea string
        const selectValue = maquinaId ? String(maquinaId) : '';
        this.maquinaSelectValue.set(selectValue);
      }
    } else {
      // Al salir del modo edición, limpiar los valores temporales
      this.maquinaSelectValue.set('');
      this.editMaquinaId.set(null);
    }
    
    this.isEditingGeneral.set(isEditing);
  }

  onSaveGeneral(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    // Validar campos requeridos
    if (!this.editNombre() || !this.editApellido() || !this.editSegundoApellido() || !this.editRut() || !this.editTelefono() || !this.editCorreo()) {
      this.alertModalService.show({
        title: 'Campos incompletos',
        message: 'Por favor, completa todos los campos requeridos antes de guardar.',
        type: 'warning',
        buttonText: 'Entendido'
      });
      return;
    }

    // Convertir fecha de string a Date
    let fechaVencLicencia: Date;
    try {
      fechaVencLicencia = new Date(this.editFechaVencLicencia());
      if (isNaN(fechaVencLicencia.getTime())) {
        throw new Error('Fecha inválida');
      }
    } catch (error) {
      this.alertModalService.show({
        title: 'Fecha inválida',
        message: 'Por favor, ingresa una fecha de vencimiento de licencia válida.',
        type: 'error',
        buttonText: 'Entendido'
      });
      return;
    }

    // Mapear campos del frontend al formato que espera el backend (DriverUpdate)
    const updateData: any = {
      primer_nombre: this.editNombre(),
      segundo_nombre: this.editSegundoNombre() || null,
      apellido_paterno: this.editApellido(),
      apellido_materno: this.editSegundoApellido(),
      rut: this.editRut(),
      telefono: this.editTelefono(),
      correo_electronico: this.editCorreo(),
      estado: this.editEstado(),
      // Convertir de porcentaje (30) a decimal (0.3) para guardar en el backend
      porcentaje_pago: this.convertPorcentajeToDecimal(this.editPorcentajePago()),
      fecha_venc_licencia: fechaVencLicencia.toISOString().split('T')[0], // Formato YYYY-MM-DD
      fecha_contrato: this.editFechaContrato() || null,
      maquina_id: this.editMaquinaId()
    };

    this.driverService.updateDriver(driverId, updateData)
      .pipe(
        catchError((error) => {
          console.error('Error al actualizar chofer:', error);
          const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
          this.alertModalService.show({
            title: 'Error al Guardar',
            message: `Hubo un error al guardar los cambios: ${errorMessage}. Por favor, intenta nuevamente.`,
            type: 'error',
            buttonText: 'Entendido'
          });
          return of(null);
        })
      )
      .subscribe((updatedDriver) => {
        if (updatedDriver) {
          // Forzar recarga de datos incrementando el refreshTrigger
          this.refreshTrigger.set(this.refreshTrigger() + 1);
          this.isEditingGeneral.set(false);
          this.alertModalService.show({
            title: 'Cambios Guardados',
            message: 'La información del chofer ha sido actualizada correctamente.',
            type: 'success',
            buttonText: 'Entendido'
          });
        }
      });
  }

  toggleFiltersMobile(): void {
    this.showFiltersMobile.update(open => !open);
  }

  setActiveTab(tab: 'general' | 'records' | 'liquidations'): void {
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
        case 'liquidations':
          this.loadLiquidations();
          break;
      }
    }
  }

  async onDelete(): Promise<void> {
    const confirmed = await this.confirmModalService.open({
      title: 'Eliminar Chofer',
      message: `¿Estás seguro de que deseas eliminar a ${this.driver()?.nombre_completo || 'este chofer'}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    const driverId = this.driverId();
    if (!driverId) {
      this.alertModalService.show({
        title: 'Error de Eliminación',
        message: 'No se pudo identificar el chofer a eliminar. Por favor, recarga la página e intenta nuevamente.',
        type: 'error',
        buttonText: 'Entendido'
      });
      return;
    }

    this.driverService.deleteDriver(driverId)
      .pipe(
        catchError((error) => {
          console.error('Error al eliminar chofer:', error);
          const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
          this.alertModalService.show({
            title: 'Error al Eliminar',
            message: `Hubo un error al eliminar el chofer: ${errorMessage}. Por favor, intenta nuevamente.`,
            type: 'error',
            buttonText: 'Entendido'
          });
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result !== null) {
          // Navegar a la lista de choferes después de eliminar
          this.router.navigate(['/choferes']);
        }
      });
  }

  getInitials(name: string): string {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(date: string | null): string {
    if (!date) return 'Sin fecha';
    const d = this.parseLocalDate(date);
    if (!d) return date;
    return d.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateFull(date: string): string {
    if (!date) return '';
    const d = this.parseLocalDate(date);
    if (!d) return '';
    return d.toLocaleDateString('es-CL', { 
      weekday: 'short',
      day: '2-digit', 
      month: 'short'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  formatEstado(estado: string): string {
    const estados: Record<string, string> = {
      'completo': 'Completo',
      'pendiente_trabajador': 'Pendiente',
      'incidente_reportado': 'Incidente',
      'no_trabajado': 'No Trabajado'
    };
    return estados[estado] || estado;
  }

  onViewRecordDetail(record: DriverDailyRecord): void {
    // Navegar al detalle del registro
    this.router.navigate(['/registro-diario', record.id]);
  }

  onViewMachineDetail(machineId: number | undefined, event: Event): void {
    if (!machineId) return;
    event.stopPropagation();
    this.router.navigate(['/maquinas', machineId]);
  }

  private parseLocalDate(value: string | null): Date | null {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private loadDailyRecords(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    const filters = this.recordFilters();
    const currentPage = this.recordsCurrentPage();
    
    this.recordsLoading.set(true);
    
    this.dailyRecordService.getDailyRecords({
      chofer_id: driverId,
      desde: filters.desde || undefined,
      hasta: filters.hasta || undefined,
      orden: filters.orden === 'mas_antiguo' ? 'mas_antiguo' : 'mas_reciente',
      pagina: currentPage,
      por_pagina: this.recordsPerPage
    }).subscribe({
      next: (response) => {
        const records = response.datos || [];
        
        // Mapear DailyRecord a DriverDailyRecord
        const driverRecords: DriverDailyRecord[] = records.map((record: DailyRecord) => {
          // Mapear estado
          let estado: 'completo' | 'pendiente_trabajador' | 'incidente_reportado' | 'no_trabajado';
          switch (record.estado) {
            case 'COMPLETO':
              estado = 'completo';
              break;
            case 'PENDIENTE_TRABAJADOR':
              estado = 'pendiente_trabajador';
              break;
            case 'INCIDENTE_REPORTADO':
              estado = 'incidente_reportado';
              break;
            case 'NO_TRABAJADO':
            case 'DIA_NO_TRABAJADO':
              estado = 'no_trabajado';
              break;
            default:
              estado = 'completo';
          }

          return {
            id: parseInt(record.id),
            fecha: record.fecha,
            estado,
            recaudado: record.recaudado || 0,
            diesel: record.costo_diesel || 0,
            tiene_observaciones: record.tiene_observaciones || false,
            maquina_id: record.maquina_id,
            maquina_identificador: record.maquina_identificador || `Máquina ${record.maquina_id || 'N/A'}`
          };
        });

        this.dailyRecords.set(driverRecords);
        this.recordsTotal.set(response.total);
        this.recordsTotalGlobal.set(response.total_registros_global ?? response.total);
        this.recordsTotalPages.set(response.total_paginas);
        this.recordsLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar registros diarios:', error);
        this.dailyRecords.set([]);
        this.recordsTotal.set(0);
        this.recordsTotalGlobal.set(0);
        this.recordsTotalPages.set(0);
        this.recordsLoading.set(false);
      }
    });
  }

  private loadLiquidations(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    const filters = this.liquidationFilters();
    const currentPage = this.liquidationsCurrentPage();

    this.liquidationsLoading.set(true);

    // Convertir fechas a mes/año para el backend
    // Las liquidaciones son mensuales, así que solo necesitamos mes y año
    let mes_desde: number | undefined;
    let anio_desde: number | undefined;
    let mes_hasta: number | undefined;
    let anio_hasta: number | undefined;

    if (filters.fecha_desde) {
      // Parsear fecha en formato YYYY-MM-DD de forma segura
      const parts = filters.fecha_desde.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        // Crear fecha directamente sin problemas de zona horaria
        mes_desde = month; // Ya viene como 1-12 del formato YYYY-MM-DD
        anio_desde = year;
      }
    }

    if (filters.fecha_hasta) {
      // Parsear fecha en formato YYYY-MM-DD de forma segura
      const parts = filters.fecha_hasta.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        // Crear fecha directamente sin problemas de zona horaria
        mes_hasta = month; // Ya viene como 1-12 del formato YYYY-MM-DD
        anio_hasta = year;
      }
    }

    this.driverService.getDriverLiquidations(driverId, {
      mes_desde: mes_desde,
      anio_desde: anio_desde,
      mes_hasta: mes_hasta,
      anio_hasta: anio_hasta,
      estado_pago: filters.estado && filters.estado !== 'all' ? filters.estado : undefined,
      page: currentPage,
      per_page: this.liquidationsPerPage
    }).subscribe({
      next: (response) => {
        this.liquidations.set(response.items);
        this.liquidationsTotal.set(response.total);
        this.liquidationsTotalGlobal.set(response.total_global);
        this.liquidationsTotalPages.set(Math.ceil(response.total / response.per_page));
        this.liquidationsLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar liquidaciones:', error);
        this.liquidations.set([]);
        this.liquidationsTotal.set(0);
        this.liquidationsTotalGlobal.set(0);
        this.liquidationsTotalPages.set(0);
        this.liquidationsLoading.set(false);
      }
    });
  }

  onLiquidationFilterChange(filters: Record<string, any>): void {
    // Si el objeto está vacío, limpiar todos los filtros
    if (Object.keys(filters).length === 0) {
      this.liquidationFilters.set({});
      this.liquidationsCurrentPage.set(1);
      this.loadLiquidations();
      return;
    }
    
    // Procesar filtros: las fechas vienen como strings en formato YYYY-MM-DD
    const processedFilters: { 
      fecha_desde?: string | null; 
      fecha_hasta?: string | null; 
      estado?: 'all' | 'pagado' | 'pendiente' 
    } = {
      fecha_desde: filters['fecha_desde'] || null,
      fecha_hasta: filters['fecha_hasta'] || null,
      estado: filters['estado'] || 'all'
    };
    
    this.liquidationFilters.set(processedFilters);
    this.liquidationsCurrentPage.set(1);
    this.loadLiquidations();
  }

  onLiquidationPageChange(page: number): void {
    this.liquidationsCurrentPage.set(page);
    this.loadLiquidations();
  }

  getLiquidationPages(): number[] {
    const totalPages = this.liquidationsTotalPages();
    if (totalPages <= 1) return [];
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  getStartLiquidationRecord(): number {
    const page = this.liquidationsCurrentPage();
    return (page - 1) * this.liquidationsPerPage + 1;
  }

  getEndLiquidationRecord(): number {
    const page = this.liquidationsCurrentPage();
    const total = this.liquidationsTotal();
    return Math.min(page * this.liquidationsPerPage, total);
  }

  onBack(): void {
    this.router.navigate(['/choferes']);
  }

  // Métodos auxiliares para conversiones de porcentaje
  /**
   * Convierte de decimal (0.3) a porcentaje (30) para mostrar en el frontend
   */
  formatPorcentajeForDisplay(decimalValue: number): number {
    return decimalValue * 100;
  }

  /**
   * Convierte de decimal (0.3) a porcentaje (30) para el input
   */
  convertDecimalToPorcentaje(decimalValue: number): number {
    return decimalValue * 100;
  }

  /**
   * Convierte de porcentaje (30) a decimal (0.3) para guardar en el backend
   */
  convertPorcentajeToDecimal(porcentajeValue: number): number {
    return porcentajeValue / 100;
  }

  // Métodos auxiliares para conversiones en plantillas
  onPorcentajePagoChange(value: string): void {
    const numValue = value ? parseFloat(value) : 0;
    this.editPorcentajePago.set(isNaN(numValue) ? 0 : numValue);
  }

  onMaquinaIdChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    this.editMaquinaId.set(numValue && !isNaN(numValue) ? numValue : null);
    // Actualizar también el valor del select
    this.maquinaSelectValue.set(value || '');
  }

  // Método para manejar cambios desde ngModel (similar a machine-detail)
  handleMaquinaChangeFromNgModel(value: string): void {
    this.maquinaSelectValue.set(value || '');
    const numValue = value ? parseInt(value, 10) : null;
    this.editMaquinaId.set(numValue && !isNaN(numValue) ? numValue : null);
  }
}

