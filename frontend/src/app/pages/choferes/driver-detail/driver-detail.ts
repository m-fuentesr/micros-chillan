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
import { catchError, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { calculateLicenseStatus } from '../../../shared/utils/license.utils';
import { LoadingStateService } from '../../../shared/services/loading-state.service';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-driver-detail',
  imports: [CommonModule, RouterLink, FormsModule, LoadingSkeleton],
  template: `
    <div class="space-y-6 animate-page-enter">
      <!-- Header principal -->
      <div class="flex justify-between items-start flex-wrap gap-4 animate-header-enter">
        <div>
          <h1 class="text-4xl font-bold mb-2 border-l-4 border-l-primary pl-4">
            Detalle del Chofer
          </h1>
          <p class="text-base-content/70">
            Información general, registros diarios e historial de liquidaciones del chofer.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-circle btn-ghost"
          aria-label="Volver a la lista de choferes"
          (click)="onBack()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>

      @if (driver()) {
        <!-- Tarjeta principal con info de chofer y acciones -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body flex flex-col gap-4">
            <div class="flex flex-col lg:flex-row gap-4 justify-between items-start">
              <div class="flex items-start gap-4">
                <div class="avatar shrink-0">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/10 flex items-center justify-center text-primary">
                    <span class="text-2xl font-bold">{{ getInitials(driver()!.nombre_completo) }}</span>
                  </div>
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-3 flex-wrap">
                    <h2 class="text-2xl font-bold text-base-content">
                      {{ driver()!.nombre_completo }}
                    </h2>
                    <span 
                      class="badge gap-1 text-white font-medium shadow-sm"
                      [class.badge-success]="driver()!.estado === 'activo'"
                      [class.badge-error]="driver()!.estado === 'inactivo'">
                      <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                      {{ driver()!.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/70">
                    <span class="font-mono font-semibold">{{ driver()!.rut }}</span>
                    <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span class="truncate tooltip" [attr.data-tip]="driver()!.correo">{{ driver()!.correo }}</span>
                    <span class="w-1 h-1 bg-base-content/30 rounded-full"></span>
                    <span>{{ driver()!.telefono }}</span>
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
                    Editar Chofer
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
                  [class.tab-active]="activeTab() === 'liquidations'"
                  [class.btn-disabled]="isEditingGeneral()"
                  [attr.disabled]="isEditingGeneral() ? '' : null"
                  (click)="setActiveTab('liquidations')">
                  Liquidaciones
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenido pestaña General -->
        @if (activeTab() === 'general') {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
            
            <!-- Información Personal -->
            <div class="card bg-base-100 shadow-sm border border-base-200 md:col-span-1 h-full order-1">
              <div class="card-body p-6">
                <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información Personal
                </h3>

                <div class="grid grid-cols-1 gap-4">
                  <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
                    <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                      Nombre Completo
                    </span>
                    @if (isEditingGeneral()) {
                      <div class="grid grid-cols-2 gap-2 mt-1">
                        <input
                          type="text"
                          class="input input-sm w-full"
                          [value]="editNombre()"
                          (input)="editNombre.set($any($event.target).value)"
                          placeholder="Primer nombre">
                        <input
                          type="text"
                          class="input input-sm w-full"
                          [value]="editSegundoNombre()"
                          (input)="editSegundoNombre.set($any($event.target).value)"
                          placeholder="Segundo nombre">
                      </div>
                      <div class="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="text"
                          class="input input-sm w-full"
                          [value]="editApellido()"
                          (input)="editApellido.set($any($event.target).value)"
                          placeholder="Apellido paterno">
                        <input
                          type="text"
                          class="input input-sm w-full"
                          [value]="editSegundoApellido()"
                          (input)="editSegundoApellido.set($any($event.target).value)"
                          placeholder="Apellido materno">
                      </div>
                    } @else {
                      <div class="font-bold text-lg text-base-content">
                        {{ driver()!.nombre_completo }}
                      </div>
                    }
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="bg-base-200/50 p-3 rounded-xl border border-base-200">
                      <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                        RUT
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
                    <div class="bg-base-200/50 p-3 rounded-xl border border-base-200">
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
                    <span class="text-xs font-bold text-base-content/40 uppercase tracking-widest block mb-1">
                      Contacto
                    </span>
                    <div class="space-y-2">
                      <div>
                        <span class="text-xs text-base-content/50">Teléfono</span>
                        @if (isEditingGeneral()) {
                          <input
                            type="tel"
                            class="input input-sm w-full mt-1"
                            [value]="editTelefono()"
                            (input)="editTelefono.set($any($event.target).value)"
                            placeholder="Teléfono">
                        } @else {
                          <div class="font-semibold text-base-content">{{ driver()!.telefono }}</div>
                        }
                      </div>
                      <div>
                        <span class="text-xs text-base-content/50">Correo</span>
                        @if (isEditingGeneral()) {
                          <input
                            type="email"
                            class="input input-sm w-full mt-1"
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

                  <div class="bg-base-200/50 p-4 rounded-xl border border-base-200">
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
                        {{ driver()!.porcentaje_pago }}%
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Licencia -->
            <div class="card bg-base-100 shadow-sm border border-base-200 md:col-span-2 xl:col-span-1 order-2 xl:order-3 h-full">
              <div class="card-header px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-50 rounded-t-2xl">
                <h3 class="font-bold text-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm3 2.75A.75.75 0 015.75 8h1.5a.75.75 0 01.75.75v2.5a.75.75 0 01-.75.75h-1.5A.75.75 0 015 11.25v-2.5zm7-1.5A.75.75 0 0112.75 7h2.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75v-4.5z" clip-rule="evenodd" />
                  </svg>
                  Licencia de Conducir
                </h3>
              </div>

              <div class="p-4 space-y-3">
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5z" />
                    </svg>
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
            <div class="card bg-base-100 shadow-sm border border-base-200 md:col-span-1 h-full order-3 xl:order-2 overflow-hidden">
              <div class="h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"></div>

              <div class="card-body p-6 pt-0 -mt-12 text-center flex flex-col items-center">
                @if (driver()!.maquina_actual) {
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
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
                        [value]="editMaquinaId() ?? ''"
                        (change)="onMaquinaIdChange($any($event.target).value)">
                        <option value="">Sin asignar</option>
                        @if (driver()!.maquina_actual) {
                          <option [value]="driver()!.maquina_actual!.id">
                            {{ driver()!.maquina_actual!.identificador }} (actual)
                          </option>
                        }
                        @for (m of maquinas(); track m.id) {
                          @if (m.id !== driver()!.maquina_actual?.id) {
                            <option [value]="m.id">
                              {{ m.identificador }}
                            </option>
                          }
                        }
                      </select>
                    </div>
                  }

                  <div class="w-full mt-auto"></div>
                } @else {
                  <div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/20 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
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
                        [value]="editMaquinaId() ?? ''"
                        (change)="onMaquinaIdChange($any($event.target).value)">
                        <option value="">Sin asignar</option>
                        @for (m of maquinas(); track m.id) {
                          <option [value]="m.id">
                            {{ m.identificador }}
                          </option>
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
        }

        <!-- Registros Diarios -->
        @if (activeTab() === 'records' && loadedTabs().has('records')) {
          <div class="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
            <div class="card-header p-6 border-b border-base-200 bg-base-50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 class="card-title text-2xl font-bold border-l-4 border-l-primary pl-3">
                    Registros Diarios
                  </h2>
                  <p class="text-xs sm:text-sm text-base-content/60 mt-1">
                    Historial de operaciones y rendimiento por jornada.
                  </p>
                </div>
                <span class="badge badge-lg badge-outline font-bold">
                  {{ dailyRecords().length }} {{ dailyRecords().length === 1 ? 'registro' : 'registros' }}
                </span>
              </div>
            </div>
            <div class="card-body p-4 sm:p-6">
              <!-- Vista Móvil: Cards -->
              <div class="block xl:hidden space-y-4">
                @for (record of dailyRecords(); track record.id; let i = $index) {
                  <div 
                    class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
                    [style.animation-delay.ms]="i * 50"
                    [style.animation-fill-mode]="'both'">
                    <div class="card-body p-5">
                      <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3">
                          <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
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
                      <div class="divider my-3 opacity-30"></div>
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
                      @if (record.observaciones) {
                        <div class="mt-3 p-2 bg-info/10 rounded border border-info/20">
                          <div class="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-info shrink-0 mt-0.5">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-xs text-base-content/70 flex-1">{{ record.observaciones }}</p>
                          </div>
                        </div>
                      }
                      <div class="mt-4">
                        <a 
                          [routerLink]="['/registro-diario', record.id]"
                          class="btn btn-sm w-full btn-outline gap-2 hover:btn-primary transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
                          Ver Detalle
                        </a>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12 animate-fade-in">
                    <div class="text-4xl opacity-50 mb-3">📋</div>
                    <p class="text-base-content/50 font-medium">No hay registros disponibles</p>
                  </div>
                }
              </div>

              <!-- Vista Desktop: Tabla -->
              <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
                <table class="table w-full">
                  <thead class="bg-base-50 border-b border-base-200">
                    <tr>
                      <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[140px]">Fecha</th>
                      <th class="py-4 text-center text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[100px]">Estado</th>
                      <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Recaudado</th>
                      <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Diésel</th>
                      <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[120px]">Neto</th>
                      <th class="py-4 pr-6 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (record of dailyRecords(); track record.id; let i = $index) {
                      <tr 
                        class="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-none animate-table-row-enter"
                        [style.animation-delay.ms]="i * 30"
                        [style.animation-fill-mode]="'both'">
                        <td class="pl-6 py-4">
                          <div class="flex items-center gap-2">
                            <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                              </svg>
                            </div>
                            <div>
                              <div class="font-semibold text-base-content">{{ formatDate(record.fecha) }}</div>
                              <div class="text-xs text-base-content/50 font-mono">{{ formatDateFull(record.fecha) }}</div>
                            </div>
                          </div>
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
                        <td class="text-right py-4 font-mono font-bold text-success tabular-nums text-sm">
                          {{ formatCurrency(record.recaudado) }}
                        </td>
                        <td class="text-right py-4 font-mono font-bold text-error tabular-nums text-sm">
                          {{ formatCurrency(record.diesel) }}
                        </td>
                        <td class="text-right py-4 font-mono font-bold text-base-content tabular-nums text-sm">
                          {{ formatCurrency(record.recaudado - record.diesel) }}
                        </td>
                        <td class="pr-6 text-right py-4">
                          <div class="flex items-center justify-end gap-2">
                            @if (record.observaciones) {
                              <div class="tooltip" [attr.data-tip]="record.observaciones">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-info">
                                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                                </svg>
                              </div>
                            }
                            <a 
                              [routerLink]="['/registro-diario', record.id]"
                              class="btn btn-xs h-8 px-3 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                              </svg>
                              Ver
                            </a>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-12 animate-fade-in">
                          <div class="text-4xl opacity-50 mb-3">📋</div>
                          <p class="text-base-content/50 font-medium">No hay registros disponibles</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- Liquidaciones -->
        @if (activeTab() === 'liquidations' && loadedTabs().has('liquidations')) {
          <div class="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
            <div class="card-header p-6 border-b border-base-200 bg-base-50">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 class="card-title text-2xl font-bold border-l-4 border-l-primary pl-3">
                    Liquidaciones
                  </h2>
                  <p class="text-xs sm:text-sm text-base-content/60 mt-1">
                    Historial de pagos y liquidaciones mensuales.
                  </p>
                </div>
                <span class="badge badge-lg badge-outline font-bold">
                  {{ liquidations().length }} {{ liquidations().length === 1 ? 'liquidación' : 'liquidaciones' }}
                </span>
              </div>
            </div>
            <div class="card-body p-4 sm:p-6">
              <!-- Vista Móvil: Cards -->
              <div class="block xl:hidden space-y-4">
                @for (liquidation of liquidations(); track liquidation.id; let i = $index) {
                  <div 
                    class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200 group animate-card-enter"
                    [style.animation-delay.ms]="i * 50"
                    [style.animation-fill-mode]="'both'">
                    <div class="card-body p-5">
                      <div class="flex items-start justify-between gap-4 mb-4">
                        <div class="flex items-center gap-3">
                          <div class="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                          </div>
                          <div>
                            <h3 class="font-bold text-base text-base-content">Período {{ liquidation.fecha }}</h3>
                            <p class="text-xs text-base-content/50">Liquidación mensual</p>
                          </div>
                        </div>
                        <div class="badge badge-sm gap-1"
                          [class.badge-success]="liquidation.estado_pago === 'pagado'"
                          [class.badge-warning]="liquidation.estado_pago === 'pendiente'">
                          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {{ liquidation.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente' }}
                        </div>
                      </div>
                      <div class="divider my-3 opacity-30"></div>
                      <div class="grid grid-cols-2 gap-4">
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
                      <div class="mt-3 p-3 bg-base-50 rounded-lg border border-base-200">
                        <div class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2">Detalles</div>
                        <div class="space-y-1 text-xs">
                          <div class="flex justify-between">
                            <span class="text-base-content/60">Mínimo Garantizado:</span>
                            <span class="font-semibold">{{ formatCurrency(liquidation.minimo_garantizado) }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-base-content/60">Método:</span>
                            <span class="font-semibold uppercase">{{ liquidation.metodo_pago || '—' }}</span>
                          </div>
                          @if (liquidation.codigo_transferencia) {
                            <div class="flex justify-between">
                              <span class="text-base-content/60">Código:</span>
                              <span class="font-mono font-semibold">{{ liquidation.codigo_transferencia }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12 animate-fade-in">
                    <div class="text-4xl opacity-50 mb-3">💰</div>
                    <p class="text-base-content/50 font-medium">No hay liquidaciones disponibles</p>
                  </div>
                }
              </div>

              <!-- Vista Desktop: Tabla -->
              <div class="hidden xl:block overflow-hidden rounded-xl border border-base-200">
                <table class="table w-full">
                  <thead class="bg-base-50 border-b border-base-200">
                    <tr>
                      <th class="pl-6 py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Período</th>
                      <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[140px]">Total Ganado</th>
                      <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[140px]">Mínimo Garantizado</th>
                      <th class="py-4 text-right text-xs font-bold uppercase tracking-widest text-base-content/60 font-mono tabular-nums min-w-[140px]">Pago Final</th>
                      <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Método</th>
                      <th class="py-4 text-xs font-bold uppercase tracking-widest text-base-content/60 min-w-[120px]">Código/Ref.</th>
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
                          <div class="flex items-center gap-2">
                            <div class="bg-primary/10 p-1.5 rounded text-primary shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                              </svg>
                            </div>
                            <div>
                              <div class="font-semibold text-base-content">{{ liquidation.fecha }}</div>
                              <div class="text-xs text-base-content/50">Liquidación mensual</div>
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
                        <td colspan="7" class="text-center py-12 animate-fade-in">
                          <div class="text-4xl opacity-50 mb-3">💰</div>
                          <p class="text-base-content/50 font-medium">No hay liquidaciones disponibles</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      } @else {
        @if (driverLoadingState.showSkeleton() && driverLoadingState.isLoading()) {
          <app-loading-skeleton 
            type="card" 
            [isExiting]="driverLoadingState.isSkeletonExiting()" />
        } @else {
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Cargando información del chofer...
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
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
      .animate-card-enter,
      .animate-table-row-enter,
      .animate-fade-in {
        animation: none;
        transform: none;
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
  
  // Estado de carga con umbral de 200ms
  driverLoadingState = this.loadingStateService.createLoadingState();

  isEditingGeneral = signal(false);
  activeTab = signal<'general' | 'records' | 'liquidations'>('general');
  
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
  editMaquinaId = signal<number | null>(null);

  // Cargar chofer
  driverIdParam = toSignal(
    this.route.params.pipe(
      map(params => params['id'] ? Number(params['id']) : null)
    ),
    { initialValue: null }
  );

  driverId = computed(() => this.driverIdParam());

  driverData = toSignal(
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'] ? Number(params['id']) : null;
        if (!id) {
          return of<Driver | null>(null);
        }
        return this.driverService.getDriverById(id).pipe(
          catchError(() => of<Driver | null>(null))
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
    return calculateLicenseStatus(d.fecha_venc_licencia, 30);
  });

  // Cargar máquinas para el select
  maquinasData = toSignal(
    this.machineService.getMachines().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  maquinas = computed(() => {
    const machines = this.maquinasData() ?? [];
    return machines.map(m => ({
      id: m.id,
      identificador: `Máquina ${m.numero || m.id}`
    }));
  });

  // Registros diarios
  dailyRecords = signal<DriverDailyRecord[]>([]);

  // Liquidaciones
  liquidations = signal<DriverLiquidation[]>([]);
  
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
    this.driverLoadingState.setLoading(true);
    
    // Efecto para cargar datos cuando el chofer cambia
    effect(() => {
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
  }

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
        this.editEstado.set(d.estado || 'activo');
        this.editPorcentajePago.set(d.porcentaje_pago || 0);
        this.editFechaVencLicencia.set(d.fecha_venc_licencia || '');
        this.editMaquinaId.set(d.maquina_actual?.id || null);
      }
    }
    
    this.isEditingGeneral.set(isEditing);
  }

  onSaveGeneral(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    // Construir nombre_completo desde los campos individuales
    const nombreParts = [
      this.editNombre(),
      this.editSegundoNombre(),
      this.editApellido(),
      this.editSegundoApellido()
    ].filter(p => p && p.trim() !== '');
    const nombreCompleto = nombreParts.join(' ');

    const updateData: Partial<Driver> = {
      nombre: this.editNombre(),
      segundo_nombre: this.editSegundoNombre() || undefined,
      apellido: this.editApellido(),
      segundo_apellido: this.editSegundoApellido(),
      nombre_completo: nombreCompleto,
      rut: this.editRut(),
      telefono: this.editTelefono(),
      correo: this.editCorreo(),
      estado: this.editEstado(),
      porcentaje_pago: this.editPorcentajePago(),
      fecha_venc_licencia: this.editFechaVencLicencia(),
    };

    // Agregar maquina_id solo si existe
    if (this.editMaquinaId() !== null) {
      (updateData as any).maquina_id = this.editMaquinaId();
    }

    this.driverService.updateDriver(driverId, updateData)
      .pipe(
        catchError((error) => {
          console.error('Error al actualizar chofer:', error);
          alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
          return of(null);
        })
      )
      .subscribe((updatedDriver) => {
        if (updatedDriver) {
          // Recargar el chofer actualizado
          this.driverService.getDriverById(driverId).subscribe((driver) => {
            // El signal se actualizará automáticamente a través de driverData
          });
          this.isEditingGeneral.set(false);
          alert('Cambios guardados correctamente.');
        }
      });
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

  onDelete(): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este chofer?')) {
      return;
    }

    if (this.driverId()) {
      this.driverService.deleteDriver(this.driverId()!)
        .pipe(
          catchError((error) => {
            console.error('Error al eliminar chofer:', error);
            return of(null);
          })
        )
        .subscribe(() => {
          this.router.navigate(['/choferes']);
        });
    }
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
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  }

  formatDateFull(date: string): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-CL', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short'
      });
    } catch {
      return '';
    }
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

  private loadDailyRecords(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    this.dailyRecordService.getDailyRecords({
      chofer_id: driverId
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
            observaciones: record.observaciones || null
          };
        });

        // Ordenar por fecha (más reciente primero)
        driverRecords.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.dailyRecords.set(driverRecords);
      },
      error: (error) => {
        console.error('Error al cargar registros diarios:', error);
        this.dailyRecords.set([]);
      }
    });
  }

  private loadLiquidations(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    // Obtener liquidaciones del chofer
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    this.accountingService.getLiquidation(currentMonth, currentYear).subscribe({
      next: (liquidation) => {
        const liquidations: DriverLiquidation[] = [];

        // Buscar el chofer en la liquidación
        const driverLiquidation = liquidation.choferes.find(c => c.chofer_id === driverId);
        
        if (driverLiquidation) {
          liquidations.push({
            id: driverLiquidation.chofer_id,
            fecha: `${String(currentMonth).padStart(2, '0')}/${currentYear}`,
            total_ganado: driverLiquidation.total_ganado,
            minimo_garantizado: driverLiquidation.minimo_garantizado || 0,
            pago_final: driverLiquidation.pago_final,
            metodo_pago: driverLiquidation.metodo_pago || 'transferencia',
            codigo_transferencia: driverLiquidation.codigo_transferencia || null,
            estado_pago: driverLiquidation.estado_pago === 'pagado' ? 'pagado' : 'pendiente'
          });
        }

        // Obtener historial de liquidaciones
        this.accountingService.getLiquidationHistory().subscribe({
          next: (history) => {
            // Filtrar liquidaciones del chofer
            history.forEach((item) => {
              const driverItem = item.choferes.find(c => c.chofer_id === driverId);
              if (driverItem) {
                liquidations.push({
                  id: driverItem.chofer_id,
                  fecha: `${String(item.mes).padStart(2, '0')}/${item.anio}`,
                  total_ganado: driverItem.total_ganado,
                  minimo_garantizado: driverItem.minimo_garantizado || 0,
                  pago_final: driverItem.pago_final,
                  metodo_pago: driverItem.metodo_pago || 'transferencia',
                  codigo_transferencia: driverItem.codigo_transferencia || null,
                  estado_pago: driverItem.estado_pago === 'pagado' ? 'pagado' : 'pendiente'
                });
              }
            });

            // Ordenar por fecha (más reciente primero)
            liquidations.sort((a, b) => {
              const [monthA, yearA] = a.fecha.split('/').map(Number);
              const [monthB, yearB] = b.fecha.split('/').map(Number);
              if (yearA !== yearB) return yearB - yearA;
              return monthB - monthA;
            });

            this.liquidations.set(liquidations);
          },
          error: (error) => {
            console.error('Error al cargar historial de liquidaciones:', error);
            this.liquidations.set(liquidations);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar liquidaciones:', error);
        this.liquidations.set([]);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/choferes']);
  }

  // Métodos auxiliares para conversiones en plantillas
  onPorcentajePagoChange(value: string): void {
    const numValue = value ? parseFloat(value) : 0;
    this.editPorcentajePago.set(isNaN(numValue) ? 0 : numValue);
  }

  onMaquinaIdChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    this.editMaquinaId.set(numValue && !isNaN(numValue) ? numValue : null);
  }
}

