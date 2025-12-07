import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DriverKPIs as DriverKPIsType } from '../../models/driver.models';

@Component({
  selector: 'app-driver-kpis',
  imports: [],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <!-- Card 1: Choferes Activos -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Activos</span>
          <div class="p-1.5 md:p-2 bg-success/10 rounded-md md:rounded-lg text-success flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().activos }}</span>
      </div>

      <!-- Card 2: Choferes Inactivos -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-1 h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Inactivos</span>
          <div class="p-1.5 md:p-2 bg-base-content/10 rounded-md md:rounded-lg text-base-content/50 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().inactivos }}</span>
      </div>

      <!-- Card 3: Máquinas Asignadas -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-2 h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Con Máquina</span>
          <div class="p-1.5 md:p-2 bg-primary/10 rounded-md md:rounded-lg text-primary flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().con_maquina }}</span>
      </div>

      <!-- Card 4: Licencias por Vencer -->
      <div class="bg-base-100 border border-base-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 animate-card-enter-delay-3 h-full">
        <div class="flex items-start justify-between mb-2">
          <span class="text-base-content/60 text-xs md:text-sm font-medium leading-tight">Lic. por Vencer</span>
          <div class="p-1.5 md:p-2 bg-error/10 rounded-md md:rounded-lg text-error flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <span class="text-2xl md:text-3xl font-bold text-base-content tracking-tight">{{ kpis().licencias_por_vencer }}</span>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverKPIs {
  kpis = input.required<DriverKPIsType>();
}

