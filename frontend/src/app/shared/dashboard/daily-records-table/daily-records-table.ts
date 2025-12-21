import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DailyRecord } from '../../models/dashboard.models';
import { UiIconComponent } from '../../components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-daily-records-table',
  imports: [RouterLink, UiIconComponent],
  template: `
    <div class="card bg-base-100 shadow-xl border border-base-200/60 rounded-3xl overflow-hidden animate-scale-up">
      <div class="card-header p-4 sm:p-6 lg:p-8 border-b border-base-200/60 bg-gradient-to-br from-primary/5 via-base-100 to-base-200/30">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="rounded-xl bg-primary/10 text-primary w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ring-1 ring-primary/10 shadow-sm">
              <ui-icon name="ClipboardList" size="lg" />
            </div>
            <div class="space-y-1">
              <h2 class="text-xl sm:text-2xl font-bold text-base-content leading-tight">Registros Diarios</h2>
              <p class="text-sm sm:text-base text-base-content/70">Gestión y auditoría centralizada de todos los reportes operativos diarios.</p>
            </div>
          </div>

          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/70 text-xs font-semibold text-base-content shadow-sm ring-1 ring-base-200/60">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {{ filteredRecords().length }} registros
          </div>
        </div>
      </div>
      <div class="card-body p-6">
        <!-- Vista de Cards (cuando la tabla se rompe) -->
        <div class="block xl:hidden space-y-4">
          @for (record of filteredRecords(); track record.id; let i = $index) {
            <div 
              class="card bg-base-100 shadow-sm border border-base-200/70 rounded-2xl hover:shadow-md transition-all duration-200 group animate-card-enter cursor-pointer"
              [class.border-l-4]="record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO'"
              [class.border-warning]="record.status === 'PENDIENTE_TRABAJADOR'"
              [class.border-error]="record.status === 'INCIDENTE_REPORTADO'"
              [class.bg-warning/5]="record.status === 'PENDIENTE_TRABAJADOR'"
              [class.bg-error/5]="record.status === 'INCIDENTE_REPORTADO'"
              [style.animation-delay.ms]="i * 50"
              [style.animation-fill-mode]="'both'"
              (click)="onRecordClick(record, $event)">
              <div class="card-body p-5">
                <!-- Header: Avatares y Estado -->
                <div class="flex items-start gap-4 mb-4">
                  <!-- Avatar Máquina -->
                  <div class="avatar placeholder shrink-0">
                    <div 
                      class="rounded-lg w-12 h-12 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center"
                      [class.bg-error/10]="record.status === 'INCIDENTE_REPORTADO'"
                      [class.border]="record.status === 'INCIDENTE_REPORTADO'"
                      [class.border-error/20]="record.status === 'INCIDENTE_REPORTADO'"
                      [class.bg-gradient-to-br]="record.status !== 'INCIDENTE_REPORTADO'"
                      [class.from-primary/20]="record.status !== 'INCIDENTE_REPORTADO'"
                      [class.to-primary/10]="record.status !== 'INCIDENTE_REPORTADO'">
                      <ui-icon 
                        name="BusFront" 
                        size="lg" 
                        [class]="record.status === 'INCIDENTE_REPORTADO' ? 'text-error' : 'text-primary'" />
                    </div>
                  </div>

                  <!-- Información Principal -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-base text-base-content truncate tooltip" [attr.data-tip]="'Máquina ' + record.machineId">
                          Máquina {{ record.machineId }}
                        </h3>
                        <div class="flex items-center gap-2 mt-1.5">
                          <div class="avatar placeholder shrink-0">
                            <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-6 h-6 rounded-full text-primary flex items-center justify-center border border-base-200 p-0.5">
                              <ui-icon name="IdCard" size="sm" />
                            </div>
                          </div>
                          <span 
                            class="text-sm truncate tooltip" 
                            [class.text-base-content/70]="record.driver !== 'Sin asignar'"
                            [class.text-base-content/40]="record.driver === 'Sin asignar'"
                            [class.italic]="record.driver === 'Sin asignar'"
                            [attr.data-tip]="record.driver">
                            {{ record.driver }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Badge Estado -->
                      <div class="shrink-0">
                        @switch (record.status) {
                          @case ('PENDIENTE_TRABAJADOR') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/10">
                              <span class="w-1.5 h-1.5 rounded-full bg-warning mr-1.5 animate-pulse"></span>
                              Pendiente
                            </div>
                          }
                          @case ('INCIDENTE_REPORTADO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/10">
                              <ui-icon name="OctagonAlert" size="xs" class="mr-1" />
                              Incidente
                            </div>
                          }
                          @case ('COMPLETO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/10">
                              Completo
                            </div>
                          }
                          @case ('EN_ESPERA') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info border border-info/10">
                              <span class="w-1.5 h-1.5 rounded-full bg-info mr-1.5"></span>
                              En espera
                            </div>
                          }
                          @case ('NO_TRABAJADO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                              No Trabajado
                            </div>
                          }
                          @case ('DIA_NO_TRABAJADO') {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                              No Trabajado
                            </div>
                          }
                          @default {
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info border border-info/10">
                              <span class="w-1.5 h-1.5 rounded-full bg-info mr-1.5"></span>
                              En espera
                            </div>
                          }
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Divider -->
                <div class="divider my-3 opacity-30"></div>
                
                <!-- Información Financiera y Fecha -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Fecha</div>
                    <div class="font-mono text-sm text-base-content/80">{{ formatDate(record.date) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Recaudación</div>
                    <div class="font-mono font-bold text-base-content tabular-nums text-sm">
                      @if (record.recaudacion) {
                        <span [class.animate-value-flash]="isValueUpdated()(record.id)">
                          {{ formatCurrency(record.recaudacion) }}
                        </span>
                      } @else {
                        <span class="text-base-content/50 font-normal">N/A</span>
                      }
                    </div>
                  </div>
                </div>
                
                <!-- Botón de Acción -->
                <div class="mt-2" (click)="$event.stopPropagation()">
                  @if (record.puedeVerDetalle && record.id && record.status !== 'EN_ESPERA') {
                    <a 
                      [routerLink]="['/registro-diario', record.id]"
                      class="btn btn-xs h-9 w-full rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1.5 font-normal">
                      <ui-icon name="Eye" size="sm" />
                      Ver detalle
                    </a>
                  } @else {
                    <button 
                      disabled
                      class="btn btn-xs h-9 w-full rounded-lg btn-ghost text-base-content/30 cursor-not-allowed opacity-50 transition-all duration-200 gap-1.5 font-normal"
                      title="No hay registro disponible aún">
                      <ui-icon name="AlertCircle" size="sm" />
                      Sin registro
                    </button>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12 animate-fade-in">
              <p class="text-base-content/50">No hay registros que coincidan con los filtros</p>
            </div>
          }
        </div>

        <!-- Vista de Tabla (Desktop - responsive con ajuste de espacio) -->
        <div class="hidden xl:block animate-table-enter">
          <table class="table w-full">
            <thead class="bg-base-50 text-base-content/50 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th class="py-4 pl-4 xl:pl-6 min-w-[160px]">Máquina</th>
                <th class="py-4 min-w-[140px]">Conductor</th>
                <th class="py-4 text-center min-w-[90px]">Fecha</th>
                <th class="py-4 text-center min-w-[100px]">Estado</th>
                <th class="py-4 text-right min-w-[110px]">Recaudación</th>
                <th class="py-4 pr-4 xl:pr-6 text-right min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              @for (record of filteredRecords(); track record.id; let i = $index) {
                <tr 
                  [class.border-l-4]="record.status === 'PENDIENTE_TRABAJADOR' || record.status === 'INCIDENTE_REPORTADO'"
                  [class.border-warning]="record.status === 'PENDIENTE_TRABAJADOR'"
                  [class.border-error]="record.status === 'INCIDENTE_REPORTADO'"
                  class="hover:bg-base-50/50 transition-colors group border-b border-base-100 last:border-0 animate-table-row-enter cursor-pointer"
                  [style.animation-delay.ms]="i * 30"
                  [style.animation-fill-mode]="'both'"
                  (click)="onRecordClick(record, $event)">
                  <td class="pl-4 xl:pl-6 font-medium min-w-0">
                    <div class="flex items-center gap-2 xl:gap-3">
                      <div class="avatar placeholder shrink-0">
                        <div 
                          class="rounded-lg w-8 h-8 xl:w-10 xl:h-10 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center"
                          [class.bg-error/10]="record.status === 'INCIDENTE_REPORTADO'"
                          [class.border]="record.status === 'INCIDENTE_REPORTADO'"
                          [class.border-error/20]="record.status === 'INCIDENTE_REPORTADO'"
                          [class.bg-gradient-to-br]="record.status !== 'INCIDENTE_REPORTADO'"
                          [class.from-primary/20]="record.status !== 'INCIDENTE_REPORTADO'"
                          [class.to-primary/10]="record.status !== 'INCIDENTE_REPORTADO'">
                          <ui-icon
                            name="BusFront" 
                            size="md" 
                            [class]="record.status === 'INCIDENTE_REPORTADO' ? 'text-error' : 'text-primary'" />
                        </div>
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-base-content truncate tooltip" [attr.data-tip]="'Máquina ' + record.machineId">Máquina {{ record.machineId }}</span>
                        <span class="text-[10px] text-base-content/40">Bus</span>
                      </div>
                    </div>
                  </td>
                  <td class="min-w-0">
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder shrink-0">
                        <div class="bg-gradient-to-br from-primary/20 to-primary/10 w-6 h-6 rounded-full text-primary flex items-center justify-center border border-base-200 p-0.5">
                          <ui-icon name="IdCard" size="sm" />
                        </div>
                      </div>
                      <span 
                        class="font-medium truncate tooltip" 
                        [class.text-base-content/80]="record.driver !== 'Sin asignar'"
                        [class.text-base-content/40]="record.driver === 'Sin asignar'"
                        [class.italic]="record.driver === 'Sin asignar'"
                        [attr.data-tip]="record.driver">
                        {{ record.driver }}
                      </span>
                    </div>
                  </td>
                  <td class="text-center font-mono text-xs text-base-content/60 whitespace-nowrap">{{ formatDate(record.date) }}</td>
                  <td class="text-center">
                    @switch (record.status) {
                      @case ('PENDIENTE_TRABAJADOR') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/10">
                          <span class="w-1.5 h-1.5 rounded-full bg-warning mr-1.5 animate-pulse"></span>
                          <span class="hidden 2xl:inline">Pendiente</span>
                          <span class="2xl:hidden">Pend.</span>
                        </div>
                      }
                      @case ('INCIDENTE_REPORTADO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/10">
                          <ui-icon name="OctagonAlert" size="xs" class="mr-1" />
                          <span class="hidden 2xl:inline">Incidente</span>
                          <span class="2xl:hidden">Inc.</span>
                        </div>
                      }
                      @case ('COMPLETO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/10">
                          <span class="hidden 2xl:inline">Completo</span>
                          <span class="2xl:hidden">OK</span>
                        </div>
                      }
                      @case ('EN_ESPERA') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info border border-info/10">
                          <span class="w-1.5 h-1.5 rounded-full bg-info mr-1.5"></span>
                          <span class="hidden 2xl:inline">En espera</span>
                          <span class="2xl:hidden">Espera</span>
                        </div>
                      }
                      @case ('NO_TRABAJADO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                          <span class="hidden 2xl:inline">No Trabajado</span>
                          <span class="2xl:hidden">N/A</span>
                        </div>
                      }
                      @case ('DIA_NO_TRABAJADO') {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200/50 text-base-content/60 border border-base-200">
                          <span class="hidden 2xl:inline">No Trabajado</span>
                          <span class="2xl:hidden">N/A</span>
                        </div>
                      }
                      @default {
                        <div class="inline-flex items-center px-2 xl:px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info border border-info/10">
                          <span class="w-1.5 h-1.5 rounded-full bg-info mr-1.5"></span>
                          <span class="hidden 2xl:inline">En espera</span>
                          <span class="2xl:hidden">Espera</span>
                        </div>
                      }
                    }
                  </td>
                  <td class="text-right font-mono font-bold text-base-content tabular-nums text-xs xl:text-sm whitespace-nowrap">
                    @if (record.recaudacion) {
                      <span [class.animate-value-flash]="isValueUpdated()(record.id)">
                        {{ formatCurrency(record.recaudacion) }}
                      </span>
                    } @else {
                      <span class="text-base-content/50">N/A</span>
                    }
                  </td>
                  <td class="pr-4 xl:pr-6 text-right" (click)="$event.stopPropagation()">
                    <div class="relative flex items-center justify-end min-h-[32px]">
                      <!-- Placeholder (se oculta al hover) -->
                      <div class="action-placeholder text-base-content/40 text-xs">
                        ···
                      </div>
                      
                      <!-- Acción real (aparece al hover) -->
                      <div class="absolute right-0 action-hover-reveal">
                        @if (record.puedeVerDetalle && record.id && record.status !== 'EN_ESPERA') {
                          <a 
                            [routerLink]="['/registro-diario', record.id]"
                            class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg btn-ghost text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 gap-1 xl:gap-1.5 font-normal"
                            [attr.aria-label]="'Ver detalle del registro de ' + record.driver">
                              <ui-icon name="Eye" size="sm" />
                              <span class="hidden 2xl:inline">Ver detalle</span>
                          </a>
                        } @else {
                          <button 
                            disabled
                            class="btn btn-xs h-8 px-2 xl:px-3 rounded-lg btn-ghost text-base-content/30 cursor-not-allowed opacity-50 transition-all duration-200 gap-1 xl:gap-1.5 font-normal"
                            [attr.aria-label]="'No hay registro disponible para ' + record.driver"
                            title="No hay registro disponible aún">
                              <ui-icon name="AlertCircle" size="sm" />
                              <span class="hidden 2xl:inline">Sin registro</span>
                          </button>
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-12 animate-fade-in">
                    <p class="text-base-content/50">No hay registros que coincidan con los filtros</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* 💰 VALUE FLASH: Cuando la recaudación cambia */
    @keyframes value-flash {
      0% {
        background-color: hsl(var(--su) / 0.4);
        transform: scale(1.08);
        box-shadow: 0 0 0 0 hsl(var(--su) / 0.6);
      }
      50% {
        background-color: hsl(var(--su) / 0.5);
        box-shadow: 0 0 0 8px hsl(var(--su) / 0);
      }
      100% {
        background-color: transparent;
        transform: scale(1);
        box-shadow: 0 0 0 0 hsl(var(--su) / 0);
      }
    }
    
    .animate-value-flash {
      animation: value-flash 800ms ease-out;
      border-radius: 6px;
      padding: 4px 8px;
      display: inline-block;
    }
    
    /* 👁️ HOVER REVEAL: Acciones aparecen al hover */
    .action-hover-reveal {
      opacity: 0;
      transform: translateX(8px);
      transition: opacity 200ms ease-out, transform 200ms ease-out;
    }
    
    .group:hover .action-hover-reveal {
      opacity: 1;
      transform: translateX(0);
    }
    
    .action-placeholder {
      opacity: 1;
      transition: opacity 200ms ease-out;
    }
    
    .group:hover .action-placeholder {
      opacity: 0;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .animate-value-flash {
        animation: none;
        background-color: hsl(var(--su) / 0.1);
      }
      .action-hover-reveal {
        opacity: 1;
        transform: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyRecordsTable {
  private router = inject(Router);
  
  records = input.required<DailyRecord[]>();
  showOnlyPending = input(false);
  toggleFilter = output<void>();
  
  // IDs de registros con valores actualizados para animación
  updatedValueIds = input<Set<number>>(new Set());
  
  // Computed para verificar si un valor fue actualizado
  isValueUpdated = computed(() => (recordId: string) => {
    const id = parseInt(recordId);
    return !isNaN(id) && this.updatedValueIds().has(id);
  });

  summary = computed(() => {
    const recs = this.records();
    return {
      pendientes: recs.filter(r => r.status === 'PENDIENTE_TRABAJADOR').length,
      incidentes: recs.filter(r => r.status === 'INCIDENTE_REPORTADO').length,
      completos: recs.filter(r => r.status === 'COMPLETO').length
    };
  });

  filteredRecords = computed(() => {
    const recs = this.records();
    if (this.showOnlyPending()) {
      return recs.filter(r => 
        r.status === 'PENDIENTE_TRABAJADOR' || r.status === 'INCIDENTE_REPORTADO'
      );
    }
    return recs;
  });

  onToggleFilter(): void {
    this.toggleFilter.emit();
  }

  onRecordClick(record: DailyRecord, event: Event): void {
    // Prevenir navegación si se hizo clic en un botón o enlace
    const target = event.target as HTMLElement;
    if (target.closest('a, button')) {
      return;
    }
    this.router.navigate(['/registro-diario', record.id]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('CLP', '$');
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateString: string): string {
    const date = this.parseLocalDate(dateString);
    if (!date) return dateString;
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return `${day} ${month}`;
  }

  private parseLocalDate(dateString: string): Date | null {
    if (!dateString) return null;
    const parts = dateString.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d); // Fecha local sin convertir a UTC
    }
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}

