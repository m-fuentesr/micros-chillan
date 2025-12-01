import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { DriverService } from '../../../shared/services/driver.service';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import type { DailyRecord } from '../../../shared/models/daily-record.models';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 pb-28 font-sans">
      <header class="relative bg-gradient-to-br from-blue-600 to-indigo-700 pb-24 pt-8 px-6 rounded-b-[2.5rem] shadow-lg">
        <div class="flex flex-col items-center text-white">
          <div class="avatar online mb-3">
            <div class="w-20 rounded-full ring ring-white ring-offset-base-100 ring-offset-2 bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
              {{ initials() }}
            </div>
          </div>
          
          <h1 class="text-2xl font-bold">{{ workerName() }}</h1>
          <div class="text-blue-100 text-sm flex flex-col items-center gap-1 mt-1">
            <span class="opacity-90">Chofer Profesional</span>
            
            @if (phoneNumber()) {
              <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full mt-1 backdrop-blur-md border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                  <path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clip-rule="evenodd" />
                </svg>
                <span class="font-mono text-xs tracking-wide">{{ phoneNumber() }}</span>
              </div>
            }
          </div>
        </div>
      </header>

      <div class="px-4 -mt-16 mb-6 relative z-10">
        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 flex justify-between items-center divide-x divide-slate-100">
          <div class="flex-1 text-center px-2">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Días Trab.</p>
            <p class="text-2xl font-black text-slate-800 tabular-nums">{{ daysWorked() }}</p>
          </div>

          <div class="flex-1 text-center px-2">
            <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Recaudado</p>
            <p class="text-2xl font-black text-emerald-600 tracking-tight tabular-nums">{{ totalRevenue() | currency:'CLP':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>
      </div>

      <div class="px-6 mt-6 space-y-6">
        <div>
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Gestión</h3>
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <a routerLink="/trabajador/mi-historial" class="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors active:bg-blue-50 group">
              <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-bold text-slate-700">Historial de Reportes</p>
                <p class="text-xs text-slate-400">Revisar tus envíos anteriores</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </a>
          </div>
        </div>

        <div>
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Información</h3>
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            @if (rut()) {
              <div class="flex justify-between border-b border-slate-50 pb-3">
                <span class="text-sm text-slate-400">RUT</span>
                <span class="text-sm font-semibold text-slate-700 font-mono">{{ rut() }}</span>
              </div>
            }
            @if (assignedMachine()) {
              <div class="flex justify-between border-b border-slate-50 pb-3">
                <span class="text-sm text-slate-400">Máquina</span>
                <span class="text-sm font-semibold text-slate-700">{{ assignedMachine() }}</span>
              </div>
            }
            @if (email()) {
              <div class="flex justify-between">
                <span class="text-sm text-slate-400">Email</span>
                <span class="text-sm font-semibold text-slate-700 truncate">{{ email() }}</span>
              </div>
            }
          </div>
        </div>

        <div class="pt-4">
          <button class="btn btn-outline btn-error btn-block border-red-200 hover:bg-red-50 hover:border-red-300 h-12 rounded-xl font-bold" (click)="onLogout()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
            Cerrar Sesión
          </button>
          <p class="text-center text-[10px] text-slate-300 mt-4">Versión 2.4.0</p>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Perfil {
  private readonly auth = inject(AuthService);
  private driverService = inject(DriverService);
  private dailyRecordService = inject(DailyRecordService);

  // Obtener usuario actual
  currentUser = this.auth.currentUser;

  // Obtener datos del chofer
  driverData = toSignal(
    this.driverService.getDrivers().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  // Obtener registros del trabajador
  private dailyRecordsResponse = toSignal(
    this.dailyRecordService.getDailyRecords().pipe(
      catchError(() => of({ datos: [], total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 }))
    ),
    { initialValue: { datos: [], total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 } }
  );

  // Computed: Obtener chofer actual
  currentDriver = computed(() => {
    const drivers = this.driverData();
    // TODO: Obtener chofer_id real desde backend basado en currentUser.id
    return drivers.find(d => d.id === 1) || null;
  });

  // Computed: Iniciales del nombre
  initials = computed(() => {
    const driver = this.currentDriver();
    if (driver?.nombre_completo) {
      const parts = driver.nombre_completo.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return driver.nombre_completo.substring(0, 2).toUpperCase();
    }
    const user = this.currentUser();
    if (user?.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return 'TP';
  });

  // Computed: Nombre del trabajador
  workerName = computed(() => {
    const driver = this.currentDriver();
    if (driver?.nombre_completo) {
      return driver.nombre_completo;
    }
    const user = this.currentUser();
    return user?.displayName || 'Trabajador';
  });

  // Computed: RUT
  rut = computed(() => {
    const driver = this.currentDriver();
    return driver?.rut || null;
  });

  // Computed: Teléfono
  phoneNumber = computed(() => {
    const driver = this.currentDriver();
    return driver?.telefono || null;
  });

  // Computed: Email
  email = computed(() => {
    const user = this.currentUser();
    return user?.email || null;
  });

  // Computed: Máquina asignada
  assignedMachine = computed(() => {
    const driver = this.currentDriver();
    return driver?.maquina_actual || null;
  });

  // Computed: Días trabajados (este mes)
  daysWorked = computed(() => {
    const response = this.dailyRecordsResponse();
    const records = response.datos || [];
    const choferId = 1; // TODO: Obtener chofer_id real desde backend
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthRecords = records.filter((r: DailyRecord) => {
      if (r.chofer_id !== choferId) return false;
      const recordDate = new Date(r.fecha);
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear &&
             !r.dia_no_trabajado;
    });

    return monthRecords.length;
  });

  // Computed: Recaudado total (este mes)
  totalRevenue = computed(() => {
    const response = this.dailyRecordsResponse();
    const records = response.datos || [];
    const choferId = 1; // TODO: Obtener chofer_id real desde backend
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthRecords = records.filter((r: DailyRecord) => {
      if (r.chofer_id !== choferId) return false;
      const recordDate = new Date(r.fecha);
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear &&
             !r.dia_no_trabajado;
    });

    return monthRecords.reduce((sum: number, r: DailyRecord) => sum + (r.recaudado || 0), 0);
  });

  onLogout(): void {
    this.auth.logout();
  }
}
