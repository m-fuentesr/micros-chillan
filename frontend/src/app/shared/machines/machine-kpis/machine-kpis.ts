import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MachineKPIs as MachineKPIsType } from '../../models/machine.models';

@Component({
  selector: 'app-machine-kpis',
  imports: [],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <!-- Card 1: Máquinas Operativas -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Operativas</span>
          <div class="p-1.5 md:p-2 bg-success/10 rounded-md md:rounded-lg text-success flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().operativas }}</span>
      </div>

      <!-- Card 2: En Taller -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-1 h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">En Taller</span>
          <div class="p-1.5 md:p-2 bg-warning/10 rounded-md md:rounded-lg text-warning flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().en_taller }}</span>
      </div>

      <!-- Card 3: Inactivas -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-2 h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Inactivas</span>
          <div class="p-1.5 md:p-2 bg-base-content/10 rounded-md md:rounded-lg text-base-content/50 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().inactivas }}</span>
      </div>

      <!-- Card 4: Documentos por Vencer -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-3 h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Docs. por Vencer</span>
          <div class="p-1.5 md:p-2 bg-error/10 rounded-md md:rounded-lg text-error flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().documentos_por_vencer }}</span>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineKPIs {
  kpis = input.required<MachineKPIsType>();
}

