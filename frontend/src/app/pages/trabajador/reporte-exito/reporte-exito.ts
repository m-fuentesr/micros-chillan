import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporte-exito',
  imports: [RouterLink, CommonModule],
  template: `
    <div class="fixed inset-0 z-[60] bg-emerald-600 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-float-slow"></div>
        <div class="absolute top-3/4 right-1/3 w-3 h-3 bg-white/30 rounded-full animate-float-fast"></div>
      </div>

      <div class="w-full max-w-sm relative z-10">
        <div class="flex justify-center mb-8">
          <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/20 animate-bounce-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12 text-emerald-600">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div class="text-left text-white mb-8 pl-4 border-l-4 border-l-white/30">
          <h1 class="text-3xl font-black tracking-tight mb-2">¡Todo listo!</h1>
          <p class="text-emerald-100 text-sm italic">Tu reporte ha sido registrado y sincronizado.</p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl shadow-emerald-900/20 overflow-hidden relative">
          <div class="h-2 bg-emerald-400 w-full"></div>
          
          <div class="p-6">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left pl-4 border-l-4 border-l-primary">Resumen de Operación</h3>
            
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                <span class="text-sm text-slate-500">Recaudación</span>
                <span class="text-lg font-bold text-slate-800 tabular-nums">$123.123</span>
              </div>
              <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                <span class="text-sm text-slate-500">Combustible</span>
                <span class="text-base font-bold text-slate-800 tabular-nums">13.231 Lts</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-500">Fecha</span>
                <span class="text-base font-semibold text-slate-800">14 Nov, 2025</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 p-3 text-center border-t border-slate-100">
            <p class="text-[10px] font-mono text-slate-400">ID: #REF-2025-8839</p>
          </div>
        </div>

        <div class="mt-8">
          <a routerLink="/trabajador" class="btn bg-white text-emerald-700 hover:bg-emerald-50 btn-block font-bold h-14 rounded-xl shadow-lg border-none">
            Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    @keyframes float-fast {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }
    @keyframes bounce-subtle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-float-slow { 
      animation: float-slow 6s ease-in-out infinite; 
    }
    .animate-float-fast { 
      animation: float-fast 4s ease-in-out infinite; 
    }
    .animate-bounce-subtle { 
      animation: bounce-subtle 2s ease-in-out infinite; 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReporteExito {

}
