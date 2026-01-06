import { Injectable, signal } from '@angular/core';
import { getTodayStringInChile } from '../utils/date.utils';
import { LedgerSummary, MovementCreate } from '../models/accounting.models';

export interface LedgerMovementFormData {
  tipo: 'CARGO' | 'ABONO' | '';
  monto: number | null;
  descripcion: string;
  fecha_movimiento: string;
}

@Injectable({
  providedIn: 'root'
})
export class LedgerMovementModalService {
  private _isVisible = signal(false);
  private _chofer = signal<LedgerSummary | null>(null);
  private _formData = signal<LedgerMovementFormData>({
    tipo: '',
    monto: null,
    descripcion: '',
    fecha_movimiento: ''
  });
  private _resolveCallback = signal<((data: MovementCreate | null) => void) | null>(null);
  private _isSubmitting = signal(false);

  readonly isVisible = this._isVisible.asReadonly();
  readonly chofer = this._chofer.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();

  /**
   * Abre el modal de registro de movimiento y retorna una Promise que se resuelve cuando el usuario guarda o cancela
   */
  open(chofer: LedgerSummary): Promise<MovementCreate | null> {
    return new Promise((resolve) => {
      const today = getTodayStringInChile();
      this._chofer.set(chofer);
      this._formData.set({
        tipo: '',
        monto: null,
        descripcion: '',
        fecha_movimiento: today
      });
      this._resolveCallback.set(resolve);
      this._isVisible.set(true);
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    });
  }

  /**
   * Actualiza los datos del formulario
   */
  updateFormData(data: Partial<LedgerMovementFormData>): void {
    this._formData.update(current => ({ ...current, ...data }));
  }

  /**
   * Guarda el movimiento
   */
  save(): void {
    const data = this._formData();
    const chofer = this._chofer();
    const resolve = this._resolveCallback();

    if (!resolve || !chofer) {
      return;
    }

    // Validar formulario
    if (!data.tipo || data.monto === null || data.monto <= 0 || !data.descripcion.trim()) {
      return;
    }

    this._isSubmitting.set(true);

    const movement: MovementCreate = {
      chofer_id: chofer.chofer_id,
      tipo: data.tipo as 'CARGO' | 'ABONO',
      monto: data.monto,
      descripcion: data.descripcion.trim(),
      fecha_movimiento: data.fecha_movimiento || undefined
    };

    resolve(movement);
    // No cerramos aquí, se cerrará cuando se complete la operación
  }

  /**
   * Marca que la operación ha terminado (éxito o error)
   */
  finishSubmission(): void {
    this._isSubmitting.set(false);
    this.close();
  }

  /**
   * Cancela la acción
   */
  cancel(): void {
    const resolve = this._resolveCallback();
    if (resolve) {
      resolve(null);
    }
    this.close();
  }

  private close(): void {
    this._isVisible.set(false);
    const today = getTodayStringInChile();
    this._formData.set({
      tipo: '',
      monto: null,
      descripcion: '',
      fecha_movimiento: today
    });
    this._chofer.set(null);
    this._resolveCallback.set(null);
    this._isSubmitting.set(false);
    // Restaurar scroll del body cuando se cierra el modal
    document.body.style.overflow = '';
  }
}
