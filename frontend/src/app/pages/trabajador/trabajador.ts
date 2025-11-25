import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
            <h1 class="text-3xl font-black tracking-tight drop-shadow-sm">Juan Pérez</h1>
            <div class="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
              <span class="text-lg drop-shadow-md">🚛</span>
              <span class="font-mono font-bold text-sm tracking-wide">Máquina 05</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-3xl font-black leading-none tracking-tighter">14</div>
            <div class="text-xs font-bold uppercase text-blue-200 tracking-[0.3em]">Nov</div>
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
          <div class="relative pl-10 pb-8 group">
            <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
              <div class="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100 group-active:scale-[0.99] transition-transform">
              <div class="flex justify-between items-start mb-1">
                <p class="font-bold text-sm text-slate-800">Reporte enviado</p>
                <span class="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">18:30</span>
              </div>
              <p class="text-xs text-slate-500">Registro diario completado sin incidentes.</p>
            </div>
          </div>
          <div class="relative pl-10 pb-8">
            <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
              <div class="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100">
              <div class="flex justify-between items-start mb-1">
                <p class="font-bold text-sm text-slate-800">Nueva asignación</p>
                <span class="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Ayer</span>
              </div>
              <p class="text-xs text-slate-500">
                Admin te asignó la <span class="font-semibold text-slate-700">Máquina 05</span>.
              </p>
            </div>
          </div>
          <div class="relative pl-10">
            <div class="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-[3px] border-slate-50 shadow-sm z-10 flex items-center justify-center ring-1 ring-black/5">
              <div class="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-slate-100 border-l-4 border-l-amber-400">
              <div class="flex justify-between items-start mb-1">
                <p class="font-bold text-sm text-slate-800">Licencia por vencer</p>
                <span class="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Hace 5 días</span>
              </div>
              <p class="text-xs text-slate-500">Quedan 15 días. Gestionar renovación.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Trabajador {}
