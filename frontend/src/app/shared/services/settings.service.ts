import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  GeneralSettings,
  UpdateSettingsRequest,
  UpdateSettingsResponse
} from '../models/settings.models';

const API_BASE_URL = environment.apiBaseUrl;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);

  // Signal para mantener configuración en memoria
  private readonly _settings = signal<GeneralSettings | null>(null);
  readonly settings = this._settings.asReadonly();

  // Signal para estado de carga
  private readonly _isLoading = signal(false);
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Obtiene la configuración general actual
   */
  async getSettings(): Promise<GeneralSettings> {
    this._isLoading.set(true);
    try {
      const settings = await firstValueFrom(
        this.http.get<GeneralSettings>(`${API_BASE_URL}/api/settings`)
      );
      this._settings.set(settings);
      return settings;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Actualiza uno o más campos de configuración general
   * @param updates Campos a actualizar
   * @returns Respuesta con valores anteriores, nuevos y métricas
   */
  async updateSettings(updates: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
    // No usar isLoading aquí para evitar que el contenido desaparezca
    // El componente manejará su propio estado de guardado
    const response = await firstValueFrom(
      this.http.put<UpdateSettingsResponse>(`${API_BASE_URL}/api/settings`, updates)
    );
    
    // Actualizar configuración local optimísticamente sin recargar
    const currentSettings = this._settings();
    if (currentSettings) {
      const updatedSettings: GeneralSettings = {
        ...currentSettings,
        ...(updates.porcentaje_default !== undefined && { porcentaje_default: updates.porcentaje_default }),
        ...(updates.sueldo_minimo !== undefined && { sueldo_minimo: updates.sueldo_minimo }),
        ...(updates.dias_alerta_licencia_por_vencer !== undefined && { dias_alerta_licencia_por_vencer: updates.dias_alerta_licencia_por_vencer }),
        ...(updates.dias_alerta_documento_por_vencer !== undefined && { dias_alerta_documento_por_vencer: updates.dias_alerta_documento_por_vencer }),
      };
      this._settings.set(updatedSettings);
    }
    
    return response;
  }

  /**
   * Convierte porcentaje de formato decimal (0-1) a formato display (0-100)
   * Usa Math.round para evitar errores de precisión de punto flotante
   */
  toPercentageDisplay(decimal: number | null): number {
    if (decimal === null || decimal === undefined) return 0;
    // Redondear para evitar errores de precisión (ej: 0.28 * 100 = 28.000000000000004)
    return Math.round(decimal * 100);
  }

  /**
   * Convierte porcentaje de formato display (0-100) a formato decimal (0-1)
   */
  toPercentageDecimal(percentage: number): number {
    return percentage / 100;
  }

  /**
   * Formatea el sueldo con separador de miles
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

