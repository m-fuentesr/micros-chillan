import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MachineKPIs as MachineKPIsType } from '../../models/machine.models';

@Component({
  selector: 'app-machine-kpis',
  imports: [],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Card 1: Máquinas Operativas -->
      <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter group overflow-hidden relative">
        <div class="absolute -right-4 -bottom-4 text-success/10 group-hover:text-success/20 transition-colors duration-300 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="card-body text-left relative z-10 pl-4 border-l-4 border-l-primary">
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-success mb-2">{{ kpis().operativas }}</div>
          <div class="text-sm text-base-content/70">Máquinas Operativas</div>
        </div>
      </div>

      <!-- Card 2: En Taller -->
      <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter-delay-1 group overflow-hidden relative">
        <div class="absolute -right-4 -bottom-4 text-warning/10 group-hover:text-warning/20 transition-colors duration-300 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="card-body text-left relative z-10 pl-4 border-l-4 border-l-primary">
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-warning mb-2">{{ kpis().en_taller }}</div>
          <div class="text-sm text-base-content/70">En Taller</div>
        </div>
      </div>

      <!-- Card 3: Inactivas -->
      <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter-delay-2 group overflow-hidden relative">
        <div class="absolute -right-4 -bottom-4 text-base-content/10 group-hover:text-base-content/20 transition-colors duration-300 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div class="card-body text-left relative z-10 pl-4 border-l-4 border-l-primary">
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-base-content/50 mb-2">{{ kpis().inactivas }}</div>
          <div class="text-sm text-base-content/70">Inactivas</div>
        </div>
      </div>

      <!-- Card 4: Documentos por Vencer -->
      <div class="card bg-base-100 shadow-xl hover-lift animate-card-enter-delay-3 group overflow-hidden relative">
        <div class="absolute -right-4 -bottom-4 text-error/10 group-hover:text-error/20 transition-colors duration-300 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="card-body text-left relative z-10 pl-4 border-l-4 border-l-primary">
          <div class="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-error mb-2">{{ kpis().documentos_por_vencer }}</div>
          <div class="text-sm text-base-content/70">Documentos por Vencer</div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineKPIs {
  kpis = input.required<MachineKPIsType>();
}

