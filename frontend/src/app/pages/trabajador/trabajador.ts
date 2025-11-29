import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { DriverService } from '../../shared/services/driver.service';
import { DailyRecordService } from '../../shared/services/daily-record.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import type { DailyRecord } from '../../shared/models/daily-record.models';

@Component({
  selector: 'app-trabajador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 pb-28 font-sans">
      <header class="relative pt-10 pb-20 px-6 rounded-b-[3rem] overflow-hidden z-0 shadow-2xl shadow-blue-900/20">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 z-0"></div>
        <div
          class="absolute inset-0 opacity-10 z-0"
          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
        ></div>
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none"></div>
        <div class="relative z-10 text-white flex justify-between items-start">
          <div>
            <p class="text-blue-100 text-xs font-bold uppercase tracking-[0.35em] mb-1 opacity-80">Bienvenido</p>
            <h1 class="text-3xl font-black tracking-tight drop-shadow-sm">{{ workerName() }}</h1>
            <div class="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
              <span class="text-lg drop-shadow-md">🚛</span>
              <span class="font-mono font-bold text-sm tracking-wide">{{ assignedMachine() }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-3xl font-black leading-none tracking-tighter">{{ currentDay() }}</div>
            <div class="text-xs font-bold uppercase text-blue-200 tracking-[0.3em]">{{ currentMonth() }}</div>
          </div>
        </div>
      </header>

      <div class="px-5 -mt-10 relative z-20">
        <div class="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden">
          <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center border-b border-orange-100/50">
            <p class="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] flex justify-center items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Acción requerida
            </p>
          </div>
          <div class="p-6">
            <div class="text-center mb-6">
              <h2 class="text-xl font-bold text-slate-800 mb-1 tracking-tight">Inicio de turno</h2>
              <p class="text-sm text-slate-500 leading-relaxed">Registra el estado inicial de tu unidad para comenzar la operación.</p>
            </div>
            <a
              routerLink="/trabajador/reportar"
              class="group relative w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-[0.98]"
            >
              <div class="absolute inset-x-0 top-0 h-[1px] bg-white/20"></div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 transition-transform group-hover:-rotate-12">
                <path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
              </svg>
              <span class="tracking-wide">Ingresar reporte</span>
            </a>
          </div>
        </div>
      </div>

      <div class="px-6 mt-10">
        <div class="flex justify-between items-end mb-6">
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.35em]">Actividad reciente</h3>
        </div>
        <div class="space-y-0 relative pl-2">
          <div class="absolute left-[19px] top-2 bottom-4 w-[2px] bg-slate-100"></div>
          @for (activity of recentActivity(); track activity.id; let i = $index) {
            <div class="relative pl-10 pb-8 group" [class.pb-0]="i === recentActivity().length - 1">
              <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
                <div class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-500]="activity.type === 'report'" [class.bg-blue-500]="activity.type === 'assignment'" [class.bg-amber-500]="activity.type === 'warning'"></div>
              </div>
              <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100" [class.border-l-4]="activity.type === 'warning'" [class.border-l-amber-400]="activity.type === 'warning'" [class.group-active:scale-[0.99]]="activity.type === 'report'" [class.transition-transform]="activity.type === 'report'">
                <div class="flex justify-between items-start mb-1">
                  <p class="font-bold text-sm text-slate-800">{{ activity.title }}</p>
                  <span class="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{{ activity.time }}</span>
                </div>
                <p class="text-xs text-slate-500">{{ activity.description }}</p>
              </div>
            </div>
          }
          @if (recentActivity().length === 0) {
            <div class="pl-10 pb-8">
              <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100">
                <p class="text-xs text-slate-500 text-center">No hay actividad reciente</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Trabajador {
  private authService = inject(AuthService);
  private driverService = inject(DriverService);
  private dailyRecordService = inject(DailyRecordService);

  // Obtener usuario actual
  currentUser = this.authService.currentUser;

  // Obtener datos del chofer
  driverData = toSignal(
    this.driverService.getDrivers().pipe(
      catchError(() => of([]))
    ),
    { initialValue: [] }
  );

  // Obtener registros recientes
  private dailyRecordsResponse = toSignal(
    this.dailyRecordService.getDailyRecords().pipe(
      catchError(() => of({ datos: [], total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 }))
    ),
    { initialValue: { datos: [], total: 0, pagina: 1, por_pagina: 10, total_paginas: 0 } }
  );

  // Computed: Nombre del trabajador
  workerName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Trabajador';
    
    // Intentar obtener nombre del chofer
    const drivers = this.driverData();
    const driver = drivers.find(d => d.id === 1); // TODO: Obtener chofer_id real desde backend
    return driver?.nombre_completo || user.displayName || 'Trabajador';
  });

  // Computed: Máquina asignada
  assignedMachine = computed(() => {
    const drivers = this.driverData();
    const driver = drivers.find(d => d.id === 1); // TODO: Obtener chofer_id real desde backend
    return driver?.maquina_actual || 'Máquina 05';
  });

  // Computed: Día actual
  currentDay = computed(() => {
    return new Date().getDate().toString();
  });

  // Computed: Mes actual
  currentMonth = computed(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[new Date().getMonth()];
  });

  // Computed: Actividad reciente
  recentActivity = computed(() => {
    const response = this.dailyRecordsResponse();
    const records = response.datos || [];
    const choferId = 1; // TODO: Obtener chofer_id real desde backend
    
    // Obtener últimos 3 registros del chofer
    const recentRecords = records
      .filter((r: DailyRecord) => r.chofer_id === choferId)
      .sort((a: DailyRecord, b: DailyRecord) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3);

    const activities: Array<{
      id: string;
      type: 'report' | 'assignment' | 'warning';
      title: string;
      description: string;
      time: string;
    }> = [];

    // Agregar registros recientes
    recentRecords.forEach((record: DailyRecord) => {
      const date = new Date(record.fecha);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let timeLabel = '';
      if (diffDays === 0) {
        timeLabel = 'Hoy';
      } else if (diffDays === 1) {
        timeLabel = 'Ayer';
      } else if (diffDays < 7) {
        timeLabel = `Hace ${diffDays} días`;
      } else {
        timeLabel = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
      }

      const statusText = record.estado === 'COMPLETO' 
        ? 'completado sin incidentes'
        : record.estado === 'INCIDENTE_REPORTADO'
        ? 'con incidente reportado'
        : 'pendiente de validación';

      activities.push({
        id: record.id,
        type: record.estado === 'INCIDENTE_REPORTADO' ? 'warning' : 'report',
        title: 'Reporte enviado',
        description: `Registro diario ${statusText}.`,
        time: timeLabel
      });
    });

    // Agregar actividad de asignación (mock por ahora)
    if (activities.length < 3) {
      activities.push({
        id: 'assignment-1',
        type: 'assignment',
        title: 'Nueva asignación',
        description: `Admin te asignó la ${this.assignedMachine()}.`,
        time: 'Ayer'
      });
    }

    return activities;
  });
}
