import { Injectable, signal } from '@angular/core';
import { DriverLedgerHistory } from '../models/accounting.models';

@Injectable({
  providedIn: 'root'
})
export class DriverLedgerHistoryModalService {
  private _isVisible = signal(false);
  private _choferId = signal<number | null>(null);
  private _driverName = signal<string>('');
  private _history = signal<DriverLedgerHistory | null>(null);
  private _isLoading = signal<boolean>(false);

  readonly isVisible = this._isVisible.asReadonly();
  readonly choferId = this._choferId.asReadonly();
  readonly driverName = this._driverName.asReadonly();
  readonly history = this._history.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Abre el modal de historial del chofer
   */
  open(choferId: number, driverName: string): void {
    console.log('🔵 DriverLedgerHistoryModalService.open() llamado con:', { choferId, driverName });
    // Limpiar datos previos
    this._history.set(null);
    this._isLoading.set(true); // Iniciar en loading para evitar mostrar error
    // Establecer nuevos datos
    this._choferId.set(choferId);
    this._driverName.set(driverName);
    console.log('🔵 Signals establecidos: choferId =', this._choferId(), 'driverName =', this._driverName());
    this._isVisible.set(true);
    console.log('🔵 isVisible establecido a true');
    // Bloquear scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    console.log('✅ Modal abierto');
    
    // Verificar si el componente está en el DOM
    setTimeout(() => {
      const component = document.querySelector('app-driver-ledger-history');
      const dialog = document.querySelector('#driver-ledger-history-modal');
      console.log('🔵 Verificación DOM - component:', component, 'dialog:', dialog);
      if (!component) {
        console.error('❌ Componente app-driver-ledger-history NO encontrado en el DOM');
      }
      if (!dialog) {
        console.error('❌ Dialog #driver-ledger-history-modal NO encontrado en el DOM');
      }
    }, 100);
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this._isVisible.set(false);
    this._choferId.set(null);
    this._driverName.set('');
    this._history.set(null);
    this._isLoading.set(false);
    // Restaurar scroll del body cuando se cierra el modal
    document.body.style.overflow = '';
  }

  /**
   * Actualiza el historial cargado
   */
  setHistory(history: DriverLedgerHistory | null): void {
    this._history.set(history);
  }

  /**
   * Actualiza el estado de carga
   */
  setIsLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }
}
