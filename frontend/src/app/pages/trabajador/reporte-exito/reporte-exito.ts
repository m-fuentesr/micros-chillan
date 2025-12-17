import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { TransitionService } from '../../../shared/services/transition.service';

interface ReportData {
  amount: number;
  fuelLiters?: number;
  fuelCost?: number;
  fecha: string;
}

@Component({
  selector: 'app-reporte-exito',
  imports: [RouterLink, CommonModule, CurrencyPipe],
  template: `
    <div 
      class="exito-overlay-enter fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 overflow-y-auto"
      [style.--button-x]="buttonX + 'px'"
      [style.--button-y]="buttonY + 'px'"
    >
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-float-slow"></div>
        <div class="absolute top-3/4 right-1/3 w-3 h-3 bg-white/30 rounded-full animate-float-fast"></div>
      </div>

      <div class="w-full max-w-sm relative z-10">
        <div class="flex justify-center mb-8">
          <div class="exito-check-enter w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12 text-emerald-600">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div class="exito-title-enter text-left text-white mb-8 pl-4 border-l-4 border-l-white/30">
          <h1 class="text-3xl font-black tracking-tight mb-2">¡Todo listo!</h1>
          <p class="text-emerald-100 text-sm italic">Tu reporte ha sido registrado y sincronizado.</p>
        </div>

        <div class="exito-card-enter bg-white rounded-2xl shadow-xl shadow-emerald-900/20 overflow-hidden relative">
          <div class="exito-bar-enter h-2 bg-emerald-400 w-full"></div>
          
          <div class="p-6">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-left pl-4 border-l-4 border-l-primary">Resumen de Operación</h3>
            
            <div class="space-y-4">
              @if (reportData(); as data) {
                <div class="exito-resumen-item flex justify-between items-center border-b border-slate-100 pb-3">
                  <span class="text-sm text-slate-500">Recaudación</span>
                  <span class="text-lg font-bold text-slate-800 tabular-nums">
                    {{ data.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}
                  </span>
                </div>
                @if (data.fuelLiters && data.fuelLiters > 0) {
                  <div class="exito-resumen-item flex justify-between items-center border-b border-slate-100 pb-3">
                    <span class="text-sm text-slate-500">Combustible</span>
                    <span class="text-base font-bold text-slate-800 tabular-nums">
                      {{ data.fuelLiters | number:'1.0-3' }} Lts
                    </span>
                  </div>
                }
                <div class="exito-resumen-item flex justify-between items-center">
                  <span class="text-sm text-slate-500">Fecha</span>
                  <span class="text-base font-semibold text-slate-800">{{ formattedDate() }}</span>
                </div>
              } @else {
                <!-- Fallback si no hay datos -->
                <div class="exito-resumen-item flex justify-between items-center border-b border-slate-100 pb-3">
                  <span class="text-sm text-slate-500">Recaudación</span>
                  <span class="text-lg font-bold text-slate-800 tabular-nums">—</span>
                </div>
                <div class="exito-resumen-item flex justify-between items-center">
                  <span class="text-sm text-slate-500">Fecha</span>
                  <span class="text-base font-semibold text-slate-800">{{ formattedDate() }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="exito-button-enter mt-8">
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
    .animate-float-slow { 
      animation: float-slow 6s ease-in-out infinite; 
    }
    .animate-float-fast { 
      animation: float-fast 4s ease-in-out infinite; 
    }

    /* ============================================
       TRANSICIÓN PREMIUM: HERO EXPANSION
       Reportar → Reporte-Éxito
       ============================================ */

    /* Overlay inicial: Expansión desde el botón */
    .exito-overlay-enter {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      animation: exitoOverlayExpand 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      clip-path: circle(0% at var(--button-x, 50%) var(--button-y, 100%));
      opacity: 0;
    }

    @keyframes exitoOverlayExpand {
      0% {
        clip-path: circle(0% at var(--button-x, 50%) var(--button-y, 100%));
        opacity: 0;
      }
      30% {
        opacity: 1;
      }
      100% {
        clip-path: circle(150% at var(--button-x, 50%) var(--button-y, 100%));
        opacity: 1;
      }
    }

    /* Check: Bounce con rotación */
    .exito-check-enter {
      animation: exitoCheckBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 400ms forwards;
      opacity: 0;
      transform: scale(0) rotate(-180deg);
    }

    @keyframes exitoCheckBounce {
      0% {
        opacity: 0;
        transform: scale(0) rotate(-180deg);
      }
      50% {
        transform: scale(1.3) rotate(10deg);
      }
      100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    /* Título: Fade-up elegante */
    .exito-title-enter {
      animation: exitoTitleEnter 700ms cubic-bezier(0.22, 0.61, 0.36, 1) 600ms forwards;
      opacity: 0;
      transform: translateY(30px);
    }

    @keyframes exitoTitleEnter {
      0% {
        opacity: 0;
        transform: translateY(30px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Card de resumen: Scale-up con fade */
    .exito-card-enter {
      animation: exitoCardEnter 800ms cubic-bezier(0.22, 0.61, 0.36, 1) 700ms forwards;
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }

    @keyframes exitoCardEnter {
      0% {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Barra superior verde: Slide-down */
    .exito-bar-enter {
      animation: exitoBarEnter 500ms cubic-bezier(0.22, 0.61, 0.36, 1) 500ms forwards;
      transform: translateY(-100%);
    }

    @keyframes exitoBarEnter {
      0% {
        transform: translateY(-100%);
      }
      100% {
        transform: translateY(0);
      }
    }

    /* Items del resumen: Stagger fade-up */
    .exito-resumen-item {
      animation: exitoResumenItemEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
      opacity: 0;
      transform: translateX(-20px);
    }

    .exito-resumen-item:nth-child(1) { 
      animation-delay: 900ms; 
    }
    .exito-resumen-item:nth-child(2) { 
      animation-delay: 950ms; 
    }
    .exito-resumen-item:nth-child(3) { 
      animation-delay: 1000ms; 
    }

    @keyframes exitoResumenItemEnter {
      0% {
        opacity: 0;
        transform: translateX(-20px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Botón volver: Slide-up desde abajo */
    .exito-button-enter {
      animation: exitoButtonEnter 600ms cubic-bezier(0.22, 0.61, 0.36, 1) 1100ms forwards;
      opacity: 0;
      transform: translateY(40px);
    }

    @keyframes exitoButtonEnter {
      0% {
        opacity: 0;
        transform: translateY(40px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Respetar preferencias de movimiento reducido */
    @media (prefers-reduced-motion: reduce) {
      .exito-overlay-enter,
      .exito-check-enter,
      .exito-title-enter,
      .exito-card-enter,
      .exito-bar-enter,
      .exito-resumen-item,
      .exito-button-enter {
        animation: none;
        opacity: 1;
        transform: none;
        clip-path: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReporteExito implements OnInit {
  private transitionService = inject(TransitionService);
  private router = inject(Router);
  
  buttonX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  buttonY = typeof window !== 'undefined' ? window.innerHeight - 100 : 0;
  
  // Datos del reporte desde el state del router
  reportData = signal<ReportData | null>(null);
  reportId = signal<string | null>(null);

  // Computed para formatear la fecha (formateo manual sin DatePipe)
  formattedDate = computed(() => {
    const data = this.reportData();
    const dateToFormat = this.parseLocalDate(data?.fecha) || new Date();

    // Formatear manualmente: "d MMM, y" (ej: "14 Nov, 2025")
    const day = dateToFormat.getDate();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[dateToFormat.getMonth()];
    const year = dateToFormat.getFullYear();
    
    return `${day} ${month}, ${year}`;
  });

  // Computed para año actual (para ID fallback)
  currentYear = computed(() => {
    return new Date().getFullYear();
  });

  // Computed para ID fallback (número aleatorio de 4 dígitos)
  reportIdFallback = computed(() => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  });

  ngOnInit(): void {
    // Obtener datos de transición del servicio
    const transitionData = this.transitionService.reportTransitionData();
    
    if (transitionData) {
      this.buttonX = transitionData.buttonX;
      this.buttonY = transitionData.buttonY;
      
      // Limpiar datos después de usarlos
      setTimeout(() => {
        this.transitionService.clearReportTransitionData();
      }, 100);
    } else {
      // Fallback: usar posición del botón fijo (bottom center)
      if (typeof window !== 'undefined') {
        this.buttonX = window.innerWidth / 2;
        this.buttonY = window.innerHeight - 100;
      }
    }

    // Obtener datos del reporte desde el state del router
    // Usar getCurrentNavigation() primero (disponible durante navegación)
    // Si no está disponible, usar history.state como fallback
    const navigation = this.router.getCurrentNavigation();
    let state: any = null;
    
    if (navigation?.extras?.state) {
      state = navigation.extras.state;
    } else if (history.state && history.state.reportData) {
      // Fallback: usar history.state si getCurrentNavigation no está disponible
      state = history.state;
    }
    
    if (state) {
      if (state.reportData) {
        this.reportData.set(state.reportData);
      }
      
      // Intentar obtener el ID del registro si está disponible
      if (state.recordId) {
        this.reportId.set(state.recordId);
      }
    }
  }

  private parseLocalDate(value?: string | null): Date | null {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
