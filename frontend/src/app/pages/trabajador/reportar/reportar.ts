import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-reportar',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans pb-40">
      <header class="bg-gradient-to-br from-blue-600 to-indigo-800 pt-12 pb-24 px-6 relative overflow-hidden shadow-lg">
        <a
          routerLink="/trabajador"
          class="absolute top-12 left-4 btn btn-circle btn-ghost text-white hover:bg-white/20 z-20"
          aria-label="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </a>

        <div class="relative z-10 text-center">
          <p class="text-blue-200 text-xs font-bold uppercase tracking-[0.35em] mb-1">Nuevo registro</p>
          <h1 class="text-2xl font-bold text-white tracking-tight">Reporte diario</h1>
        </div>
        <div
          class="absolute top-0 left-0 w-full h-full opacity-10"
          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"
        ></div>
      </header>

      <form class="px-4 -mt-16 relative z-20 space-y-6" [formGroup]="reportForm" (ngSubmit)="enviarReporte()">
        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-1 overflow-hidden">
          <div class="flex items-center p-4 gap-4">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">
              🚛
            </div>
            <div class="flex-1">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Máquina asignada</label>
              <div class="relative">
                <select class="appearance-none bg-transparent font-bold text-slate-800 text-lg w-full focus:outline-none" formControlName="machine">
                  <option *ngFor="let machine of machines" [value]="machine">{{ machine === '05' ? 'Máquina 05 (Tuya)' : 'Máquina ' + machine }}</option>
                </select>
                <div class="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 border-l-4 border-emerald-500 relative overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
          <label class="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-[0.35em] mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.732 6.232a2.5 2.5 0 0 1 3.536 0 .75.75 0 1 0 1.06-1.06A4 4 0 0 0 6.5 8v.165c0 .364.034.709.13 1.04l.635 2.048a.75.75 0 0 1-1.428.442l-.636-2.047a5.507 5.507 0 0 1-.18-.762 3.996 3.996 0 0 1 .978-3.654Z" clip-rule="evenodd" />
              <path d="M6.25 8a2.5 2.5 0 0 1 2.5-2.5h2.5a2.5 2.5 0 0 1 2.5 2.5v.5a2.5 2.5 0 0 1-2.5 2.5h-2.5a2.5 2.5 0 0 1-2.5-2.5V8Z" />
            </svg>
            Total recaudado
          </label>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-black text-slate-300">$</span>
            <input
              type="number"
              placeholder="0"
              formControlName="amount"
              class="w-full text-4xl font-black text-slate-800 placeholder:text-slate-200 focus:outline-none border-none p-0 tabular-nums h-12 bg-transparent"
              aria-label="Total recaudado"
            />
          </div>
          <p class="text-xs text-slate-400 mt-2">Ingresa el monto final del día.</p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5">
          <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs">⛽</div>
            <span class="text-sm font-bold text-slate-700">Carga de combustible</span>
            <span class="ml-auto text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Opcional</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs text-slate-400 font-medium ml-1">Litros</label>
              <div class="relative">
                <input
                  type="number"
                  formControlName="fuelLiters"
                  placeholder="0"
                  class="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-center"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">L</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs text-slate-400 font-medium ml-1">Costo total</label>
              <div class="relative">
                <input
                  type="number"
                  formControlName="fuelCost"
                  placeholder="0"
                  class="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-center"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.35em] mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clip-rule="evenodd" />
            </svg>
            Foto del comprobante *
          </label>

          <label class="block w-full aspect-[3/1] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer relative overflow-hidden">
            <input type="file" class="hidden" accept="image/*" (change)="onEvidenceSelected($event)" />
            <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mb-1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm2.25-2.25h.008v.008h-.008V10.5Z" />
              </svg>
              <span class="text-xs font-bold uppercase" *ngIf="!evidenceName()">Tomar foto</span>
              <span class="text-xs font-bold uppercase text-blue-600" *ngIf="evidenceName()">Adjuntado: {{ evidenceName() }}</span>
            </div>
          </label>
        </div>

        <div class="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-5">
          <textarea
            placeholder="Observaciones o notas adicionales..."
            formControlName="notes"
            class="w-full bg-slate-50 rounded-xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
            rows="3"
          ></textarea>
        </div>

        <div class="bg-red-50 rounded-2xl border border-red-100 p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm">⚠️</div>
            <div>
              <p class="text-sm font-bold text-red-800">¿Hubo incidente?</p>
              <p class="text-[10px] text-red-600/70">Choque, falla mecánica, etc.</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" formControlName="incident" />
            <div class="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div
          class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-base-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[60]"
          style="padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 1rem);"
        >
          <button
            class="btn btn-primary btn-block h-14 rounded-xl shadow-lg shadow-blue-600/20 text-lg font-bold tracking-wide disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            type="submit"
            [disabled]="reportForm.invalid"
          >
            Enviar reporte
          </button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reportar {
  private fb = inject(FormBuilder);

  machines = ['05', '02', '07'];
  evidenceName = signal('');

  reportForm = this.fb.group({
    machine: ['05', Validators.required],
    amount: [null, Validators.required],
    fuelLiters: [null],
    fuelCost: [null],
    notes: [''],
    incident: [false],
  });

  private router = inject(Router);

  enviarReporte() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.router.navigate(['/trabajador/reporte-exito']);
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.evidenceName.set(file?.name ?? '');
  }
}
