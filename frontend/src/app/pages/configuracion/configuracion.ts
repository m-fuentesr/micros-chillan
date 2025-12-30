import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../shared/services/settings.service';
import { AlertModalService } from '../../shared/services/alert-modal.service';
import { ConfirmModalService } from '../../shared/services/confirm-modal.service';
import { GlobalErrorService } from '../../shared/services/global-error.service';
import { AccountingService } from '../../shared/services/accounting.service';
import { GeneralSettings, UpdateSettingsRequest } from '../../shared/models/settings.models';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, UiIconComponent],
  template: `
    <div class="space-y-6 lg:space-y-8">
      <!-- Hero Section Premium -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4">
          <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
            Configuración General
          </h1>
          <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
            Administra parámetros globales del sistema: pagos, alertas y límites operacionales.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      @if (settingsService.isLoading() && !formData()) {
        <div class="flex justify-center items-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }

      <!-- Bento Grid: Configuración -->
      @if (formData()) {
        <div class="bento-grid-settings space-y-8 lg:space-y-10">
          
          <!-- Action Bar -->
          <div class="animate-card-stagger" [style.animation-delay]="'100ms'">
            <div class="bg-base-100 border border-base-200/50 rounded-3xl shadow-lg p-4 md:p-6">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <!-- Status Indicator -->
                <div class="flex items-center gap-3 text-sm">
                  @if (hasChanges()) {
                    <div class="flex items-center gap-2 text-warning">
                      <span class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                      </span>
                      <span class="font-semibold">Cambios sin guardar</span>
                    </div>
                  } @else {
                    <div class="flex items-center gap-2 text-success">
                      <ui-icon name="CheckCircle2" size="sm" />
                      <span class="font-semibold">Todo sincronizado</span>
                    </div>
                  }
                </div>

                <!-- Buttons -->
                <div class="flex gap-3 w-full sm:w-auto">
                  <button 
                    class="btn btn-ghost gap-2 flex-1 sm:flex-none"
                    (click)="onReset()"
                    [disabled]="!hasChanges()">
                    <ui-icon name="RotateCcw" size="sm" />
                    Descartar
                  </button>
                  
                  <button 
                    class="btn btn-primary gap-2 flex-1 sm:flex-none shadow-lg shadow-primary/30"
                    (click)="onSave()"
                    [disabled]="!hasChanges() || isSaving()">
                    @if (isSaving()) {
                      <span class="loading loading-spinner loading-sm"></span>
                    } @else {
                      <ui-icon name="Save" size="sm" />
                    }
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Row 1: Porcentaje (Destacado Grande) + Sueldo Mínimo -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            
            <!-- Card 1: Porcentaje Default - DESTACADO (2/3 width) -->
            <div class="lg:col-span-2 card-porcentaje group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 animate-card-stagger" [style.animation-delay]="'200ms'">
              <div class="p-6 md:p-8 space-y-6">
                <!-- Header con ícono grande -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/8 to-primary/3 ring-1 ring-primary/15 h-14 w-14 shrink-0">
                      <ui-icon name="Percent" size="lg" class="text-primary/80" />
                    </div>
                    <div>
                      <h3 class="font-bold text-xl md:text-2xl text-base-content">Porcentaje de Pago</h3>
                      <p class="text-sm text-base-content/60 mt-1">Comisión por defecto para choferes</p>
                    </div>
                  </div>
                  
                  <!-- Valor gigante -->
                  <div class="text-right">
                    <div class="text-4xl md:text-5xl font-black text-primary tabular-nums">
                      {{ Math.round(formData()!.porcentaje_display) }}<span class="text-3xl">%</span>
                    </div>
                  </div>
                </div>

                <!-- Slider Premium -->
                <div class="space-y-4">
                  <div class="relative w-full slider-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      [ngModel]="Math.round(formData()!.porcentaje_display)"
                      (ngModelChange)="formData()!.porcentaje_display = Math.round($event)"
                      class="range range-primary range-lg w-full" 
                      step="1" 
                    />
                    <!-- Marcas de escala alineadas con padding del range -->
                    <div class="flex justify-between w-full mt-2 px-1">
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">0%</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">25%</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">50%</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">75%</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">100%</span>
                    </div>
                  </div>
                </div>

                <!-- Alert Badge -->
                <div class="alert bg-amber-50/60 border-amber-200/50 text-amber-900/70 shadow-sm rounded-2xl py-3">
                  <ui-icon name="AlertTriangle" size="sm" class="shrink-0 text-amber-600/70" />
                  <div class="text-xs">
                    <p class="font-semibold text-amber-900/80">Cambio masivo automático</p>
                    <p class="opacity-80 text-amber-800/70">Actualiza el porcentaje de <strong>todos los choferes</strong> al guardar</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Sueldo Mínimo (1/3 width) -->
            <div class="lg:col-span-1 card-sueldo group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-green-50/50 to-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 animate-card-stagger" [style.animation-delay]="'300ms'">
              <div class="p-6 space-y-4 h-full flex flex-col">
                <!-- Header -->
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center rounded-xl bg-green-100 ring-1 ring-green-200 h-12 w-12 shrink-0">
                    <ui-icon name="DollarSign" size="md" class="text-green-600" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-lg text-base-content">Sueldo Mínimo</h3>
                    <p class="text-xs text-base-content/60">Garantizado mensual</p>
                  </div>
                </div>

                <!-- Valor -->
                <div class="flex-1 flex flex-col justify-center">
                  <div class="text-3xl md:text-4xl font-black text-green-600 tabular-nums leading-none mb-3">
                    {{ formatCurrency(formData()!.sueldo_minimo) }}
                  </div>
                  
                  <!-- Input -->
                  <input 
                    type="number" 
                    [(ngModel)]="formData()!.sueldo_minimo"
                    class="input input-bordered w-full bg-white/80 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    min="0"
                    step="10000"
                    placeholder="750000"
                  />
                  <p class="text-xs text-base-content/50 mt-2">
                    Monto mínimo garantizado por mes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Alertas (Grid 2x2) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mt-8 lg:mt-10">
            
            <!-- Card 3: Alerta Licencias -->
            <div class="card-alerta-licencias group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50/50 to-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 animate-card-stagger" [style.animation-delay]="'400ms'">
              <div class="p-6 space-y-5">
                <!-- Header -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1">
                    <div class="flex items-center justify-center rounded-xl bg-amber-50/80 ring-1 ring-amber-200/50 h-12 w-12 shrink-0">
                      <ui-icon name="IdCard" size="md" class="text-amber-600/70" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-lg text-base-content">Licencias de Conducir</h3>
                      <p class="text-xs text-base-content/60">Alerta previa al vencimiento</p>
                    </div>
                  </div>
                  
                  <!-- Badge de días -->
                  <div class="badge bg-amber-100/70 border-amber-300/50 text-amber-900/80 badge-lg gap-2 font-bold px-4 py-3">
                    <ui-icon name="Clock" size="xs" class="text-amber-700/70" />
                    {{ formData()!.dias_alerta_licencia_por_vencer }} días
                  </div>
                </div>

                <!-- Slider -->
                <div class="space-y-4">
                  <div class="relative w-full slider-container">
                    <input 
                      type="range" 
                      min="1" 
                      max="90" 
                      [(ngModel)]="formData()!.dias_alerta_licencia_por_vencer"
                      class="range range-warning range-md w-full" 
                      step="1" 
                    />
                    <!-- Marcas de escala alineadas con padding del range -->
                    <div class="flex justify-between w-full mt-2 px-1">
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">1 día</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">30 días</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">60 días</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">90 días</span>
                    </div>
                  </div>
                </div>

                <!-- Info Box -->
                <div class="bg-amber-50/80 border border-amber-100 rounded-xl p-3">
                  <p class="text-xs text-amber-900/70 leading-relaxed">
                    <span class="font-semibold">Zona de alerta:</span> Se generará automáticamente cuando falten <strong class="text-amber-700">{{ formData()!.dias_alerta_licencia_por_vencer }} días o menos</strong> para el vencimiento.
                  </p>
                </div>
              </div>
            </div>

            <!-- Card 4: Alerta Documentos -->
            <div class="card-alerta-documentos group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-blue-50/50 to-base-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 animate-card-stagger" [style.animation-delay]="'500ms'">
              <div class="p-6 space-y-5">
                <!-- Header -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1">
                    <div class="flex items-center justify-center rounded-xl bg-blue-50/80 ring-1 ring-blue-200/50 h-12 w-12 shrink-0">
                      <ui-icon name="FileText" size="md" class="text-blue-600/70" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-lg text-base-content">Documentos de Máquinas</h3>
                      <p class="text-xs text-base-content/60">RT, Permiso, Seguro Obligatorio</p>
                    </div>
                  </div>
                  
                  <!-- Badge de días -->
                  <div class="badge bg-blue-100/70 border-blue-300/50 text-blue-900/80 badge-lg gap-2 font-bold px-4 py-3">
                    <ui-icon name="Clock" size="xs" class="text-blue-700/70" />
                    {{ formData()!.dias_alerta_documento_por_vencer }} días
                  </div>
                </div>

                <!-- Slider -->
                <div class="space-y-4">
                  <div class="relative w-full slider-container">
                    <input 
                      type="range" 
                      min="1" 
                      max="90" 
                      [(ngModel)]="formData()!.dias_alerta_documento_por_vencer"
                      class="range range-info range-md w-full" 
                      step="1" 
                    />
                    <!-- Marcas de escala alineadas con padding del range -->
                    <div class="flex justify-between w-full mt-2 px-1">
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">1 día</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">30 días</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">60 días</span>
                      <span class="text-xs font-semibold text-base-content/40 flex-shrink-0">90 días</span>
                    </div>
                  </div>
                </div>

                <!-- Info Box -->
                <div class="bg-blue-50/80 border border-blue-100 rounded-xl p-3">
                  <p class="text-xs text-blue-900/70 leading-relaxed">
                    <span class="font-semibold">Zona de alerta:</span> Documentación vehicular con <strong class="text-blue-700">{{ formData()!.dias_alerta_documento_por_vencer }} días o menos</strong> de vigencia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Footer -->
          <div class="bg-primary/5 border border-primary/10 rounded-3xl p-6 mt-8 lg:mt-10 animate-card-stagger" [style.animation-delay]="'600ms'">
            <div class="flex gap-4">
              <div class="shrink-0">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ui-icon name="Info" size="sm" class="text-primary" />
                </div>
              </div>
              <div class="flex-1">
                <h4 class="font-bold text-base-content mb-2">Impacto de cambios</h4>
                <ul class="text-sm text-base-content/70 space-y-1.5">
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span><strong>Porcentaje:</strong> Actualiza todos los choferes inmediatamente</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span><strong>Sueldo mínimo:</strong> Se aplica en próximas liquidaciones</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span><strong>Días de alerta:</strong> Efecto inmediato en cálculo de alertas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Animaciones coordinadas */
    @keyframes fade-in-down {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes card-stagger {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .animate-fade-in-down {
      animation: fade-in-down 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .animate-card-stagger {
      animation: card-stagger 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    /* Custom range styling - Minimalista para evitar problemas */
    input[type="range"] {
      width: 100%;
    }

    /* Contenedor del slider */
    .slider-container {
      position: relative;
      width: 100%;
    }

    /* Asegurar que los sliders de DaisyUI funcionen correctamente */
    .range {
      width: 100%;
    }

    /* Ajuste fino para alineación perfecta de etiquetas */
    .range + div {
      margin-top: 0.5rem;
      width: 100%;
    }

    /* Asegurar que las etiquetas no se compriman */
    .range + div span {
      white-space: nowrap;
    }

    /* Card hover effects */
    .card-porcentaje:hover,
    .card-sueldo:hover,
    .card-alerta-licencias:hover,
    .card-alerta-documentos:hover {
      transform: translateY(-2px);
    }

    /* Asegurar que el thumb expandido no se corte */
    .slider-expandable::-webkit-slider-thumb {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .slider-expandable::-moz-range-thumb {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }


    /* Reduce motion para accesibilidad */
    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in-down,
      .animate-card-stagger {
        animation: none;
      }
      
      .card-porcentaje:hover,
      .card-sueldo:hover,
      .card-alerta-licencias:hover,
      .card-alerta-documentos:hover {
        transform: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Configuracion implements OnInit {
  readonly settingsService = inject(SettingsService);
  private readonly alertModalService = inject(AlertModalService);
  private readonly confirmModalService = inject(ConfirmModalService);
  private readonly globalErrorService = inject(GlobalErrorService);
  private readonly accountingService = inject(AccountingService);

  // Exponer Math para usar en el template
  readonly Math = Math;

  // Estado del formulario
  readonly formData = signal<{
    porcentaje_display: number;
    sueldo_minimo: number;
    dias_alerta_licencia_por_vencer: number;
    dias_alerta_documento_por_vencer: number;
  } | null>(null);

  // Estado de guardado (separado del loading inicial)
  private readonly _isSaving = signal(false);
  readonly isSaving = this._isSaving.asReadonly();

  // Valores originales para detectar cambios
  private originalData: GeneralSettings | null = null;

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      const settings = await this.settingsService.getSettings();
      this.originalData = { ...settings };
      
      // Convertir formato decimal a display (0-1 -> 0-100)
      // Usar Math.round para asegurar que siempre sea un entero
      const porcentajeDisplay = this.settingsService.toPercentageDisplay(settings.porcentaje_default);
      this.formData.set({
        porcentaje_display: Math.round(porcentajeDisplay),
        sueldo_minimo: settings.sueldo_minimo,
        dias_alerta_licencia_por_vencer: settings.dias_alerta_licencia_por_vencer,
        dias_alerta_documento_por_vencer: settings.dias_alerta_documento_por_vencer
      });
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Mostrar error global en lugar de error local
      this.globalErrorService.showError(
        'No se pudo cargar la configuración desde el servidor.',
        'Error al cargar configuración'
      );
    }
  }

  hasChanges(): boolean {
    if (!this.formData() || !this.originalData) return false;

    const form = this.formData()!;
    const original = this.originalData;

    return (
      this.settingsService.toPercentageDisplay(original.porcentaje_default) !== form.porcentaje_display ||
      original.sueldo_minimo !== form.sueldo_minimo ||
      original.dias_alerta_licencia_por_vencer !== form.dias_alerta_licencia_por_vencer ||
      original.dias_alerta_documento_por_vencer !== form.dias_alerta_documento_por_vencer
    );
  }

  async onSave() {
    if (!this.formData() || !this.hasChanges()) return;

    const form = this.formData()!;

    // Validaciones
    if (form.sueldo_minimo < 0) {
      this.alertModalService.show({
        title: 'Sueldo mínimo inválido',
        message: 'El sueldo mínimo debe ser mayor o igual a 0.',
        type: 'error',
        buttonText: 'Entendido'
      });
      return;
    }

    // Confirmar cambio de porcentaje si cambió
    const percentageChanged = this.settingsService.toPercentageDisplay(
      this.originalData!.porcentaje_default
    ) !== form.porcentaje_display;

    if (percentageChanged) {
      const confirmed = await this.confirmModalService.open({
        title: '¿Actualizar porcentaje de todos los choferes?',
        message: `Esta acción cambiará el porcentaje de pago de TODOS los choferes activos e inactivos al ${form.porcentaje_display}%. ¿Deseas continuar?`,
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
        confirmButtonClass: 'btn-warning'
      });

      if (!confirmed) return;
    }

    this._isSaving.set(true);
    try {
      // Construir objeto de actualización
      const updates: UpdateSettingsRequest = {};
      
      if (percentageChanged) {
        updates.porcentaje_default = this.settingsService.toPercentageDecimal(form.porcentaje_display);
      }
      
      if (this.originalData!.sueldo_minimo !== form.sueldo_minimo) {
        updates.sueldo_minimo = form.sueldo_minimo;
      }
      
      if (this.originalData!.dias_alerta_licencia_por_vencer !== form.dias_alerta_licencia_por_vencer) {
        updates.dias_alerta_licencia_por_vencer = form.dias_alerta_licencia_por_vencer;
      }
      
      if (this.originalData!.dias_alerta_documento_por_vencer !== form.dias_alerta_documento_por_vencer) {
        updates.dias_alerta_documento_por_vencer = form.dias_alerta_documento_por_vencer;
      }

      const response = await this.settingsService.updateSettings(updates);

      // Si se actualizó el sueldo mínimo, invalidar todo el caché de liquidaciones
      // porque el sueldo mínimo afecta a todas las liquidaciones (especialmente la última semana)
      if (updates.sueldo_minimo !== undefined) {
        this.accountingService.clearAllLiquidationCache();
      }

      // Actualizar estado local optimísticamente (sin recargar del servidor)
      const currentFormData = this.formData()!;
      this.formData.set({
        porcentaje_display: currentFormData.porcentaje_display,
        sueldo_minimo: currentFormData.sueldo_minimo,
        dias_alerta_licencia_por_vencer: currentFormData.dias_alerta_licencia_por_vencer,
        dias_alerta_documento_por_vencer: currentFormData.dias_alerta_documento_por_vencer
      });

      // Actualizar originalData con los nuevos valores guardados
      this.originalData = {
        porcentaje_default: percentageChanged 
          ? this.settingsService.toPercentageDecimal(currentFormData.porcentaje_display)
          : this.originalData!.porcentaje_default,
        sueldo_minimo: currentFormData.sueldo_minimo,
        dias_alerta_licencia_por_vencer: currentFormData.dias_alerta_licencia_por_vencer,
        dias_alerta_documento_por_vencer: currentFormData.dias_alerta_documento_por_vencer
      };

      // Construir mensaje de éxito con detalles
      let successMessage = 'Configuración actualizada correctamente.';
      const details: string[] = [];

      // Solo mostrar choferes actualizados si es un número válido (no null/undefined)
      if (response.choferes_actualizados !== undefined && response.choferes_actualizados !== null && typeof response.choferes_actualizados === 'number') {
        details.push(`✓ ${response.choferes_actualizados} choferes actualizados`);
      }
      if (updates.dias_alerta_licencia_por_vencer !== undefined) {
        details.push(`✓ Alertas de licencia: ${updates.dias_alerta_licencia_por_vencer} días`);
      }
      if (updates.dias_alerta_documento_por_vencer !== undefined) {
        details.push(`✓ Alertas de documentos: ${updates.dias_alerta_documento_por_vencer} días`);
      }

      if (details.length > 0) {
        successMessage += '\n\n' + details.join('\n');
      }

      this.alertModalService.show({
        title: 'Configuración guardada',
        message: successMessage,
        type: 'success',
        buttonText: 'Aceptar'
      });

    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      
      const errorMessage = error?.error?.detail || error?.message || 'Error desconocido';
      
      this.alertModalService.show({
        title: 'Error al guardar',
        message: `No se pudo guardar la configuración: ${errorMessage}`,
        type: 'error',
        buttonText: 'Entendido'
      });
    } finally {
      this._isSaving.set(false);
    }
  }

  onReset() {
    if (!this.originalData) return;
    
    // Restaurar valores originales
    this.formData.set({
      porcentaje_display: this.settingsService.toPercentageDisplay(this.originalData.porcentaje_default),
      sueldo_minimo: this.originalData.sueldo_minimo,
      dias_alerta_licencia_por_vencer: this.originalData.dias_alerta_licencia_por_vencer,
      dias_alerta_documento_por_vencer: this.originalData.dias_alerta_documento_por_vencer
    });
  }

  formatCurrency(amount: number): string {
    return this.settingsService.formatCurrency(amount);
  }

  formatDecimalDisplay(decimal: number): string {
    return decimal.toFixed(2);
  }
}
