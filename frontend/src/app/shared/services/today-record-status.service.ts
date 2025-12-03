import { Injectable, inject, signal, computed } from '@angular/core';
import { DailyRecordService } from './daily-record.service';
import { catchError, of } from 'rxjs';

export interface TodayRecordStatus {
  exists: boolean;
  record: any;
  can_create_new: boolean;
  message: string;
}

/**
 * Servicio centralizado para gestionar el estado del reporte de hoy
 * Evita duplicados y optimiza las llamadas al backend
 */
@Injectable({
  providedIn: 'root'
})
export class TodayRecordStatusService {
  private dailyRecordService = inject(DailyRecordService);
  
  // Signal para almacenar el estado del reporte
  private _status = signal<TodayRecordStatus | null>(null);
  public readonly status = this._status.asReadonly();
  
  // Computed: Determinar si puede crear reporte
  public readonly canCreateReport = computed(() => {
    const currentStatus = this._status();
    if (currentStatus === null) return true; // Mientras carga, permitir acceso
    return currentStatus.can_create_new;
  });
  
  // Computed: Determinar si ya tiene reporte hoy
  public readonly hasReportToday = computed(() => {
    const currentStatus = this._status();
    if (currentStatus === null) return false;
    return currentStatus.exists;
  });
  
  // Flag para prevenir múltiples llamadas simultáneas
  private isRefreshing = false;
  
  // Intervalo compartido (solo uno para toda la app)
  private statusCheckInterval: any = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
  private readonly STORAGE_KEY = 'lastStatusCheck';
  
  constructor() {
    // Inicializar el estado al crear el servicio
    this.refreshStatus();
    
    // Iniciar el intervalo compartido solo una vez
    this.startPeriodicCheck();
  }
  
  /**
   * Refrescar el estado del reporte desde el backend
   * Previene llamadas duplicadas
   */
  refreshStatus(): void {
    // Si ya hay una llamada en curso, no hacer otra
    if (this.isRefreshing) {
      return;
    }
    
    this.isRefreshing = true;
    
    this.dailyRecordService.getTodayStatus()
      .pipe(
        catchError(() => of({
          exists: false,
          record: null,
          can_create_new: true,
          message: 'Puede crear un nuevo reporte'
        }))
      )
      .subscribe({
        next: (status) => {
          this._status.set(status);
          this.isRefreshing = false;
        },
        error: () => {
          // En caso de error, permitir crear reporte por defecto
          this._status.set({
            exists: false,
            record: null,
            can_create_new: true,
            message: 'Puede crear un nuevo reporte'
          });
          this.isRefreshing = false;
        }
      });
  }
  
  /**
   * Iniciar verificación periódica para detectar cambio de día
   * Optimizado: solo hace llamada HTTP si detecta cambio de día
   */
  private startPeriodicCheck(): void {
    const checkIfNeeded = () => {
      const now = new Date();
      const lastCheck = localStorage.getItem(this.STORAGE_KEY);
      
      if (lastCheck) {
        const lastCheckDate = new Date(lastCheck);
        const dayChanged = 
          now.getDate() !== lastCheckDate.getDate() ||
          now.getMonth() !== lastCheckDate.getMonth() ||
          now.getFullYear() !== lastCheckDate.getFullYear();
        
        if (dayChanged) {
          // Día cambió, refrescar estado (solo aquí se hace la llamada HTTP)
          this.refreshStatus();
        }
      }
      
      // Actualizar timestamp de última verificación
      localStorage.setItem(this.STORAGE_KEY, now.toISOString());
    };
    
    // Ejecutar inmediatamente
    checkIfNeeded();
    
    // Luego ejecutar cada 5 minutos
    // Nota: Esta verificación es muy ligera (solo compara fechas en memoria)
    // La llamada HTTP solo se hace cuando detecta cambio de día
    this.statusCheckInterval = setInterval(checkIfNeeded, this.CHECK_INTERVAL);
  }
  
  /**
   * Limpiar recursos (útil para testing o si se necesita reiniciar)
   */
  cleanup(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }
}

