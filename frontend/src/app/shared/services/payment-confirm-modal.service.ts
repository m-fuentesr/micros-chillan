import { Injectable, signal } from '@angular/core';
import { getTodayStringInChile } from '../utils/date.utils';
import { LiquidationDriver } from '../models/accounting.models';

export interface PaymentConfirmFormData {
  metodo_pago: 'transferencia' | 'efectivo' | '';
  fecha_pago: string;
  codigo_transferencia: string;
  observaciones: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentConfirmModalService {
  private _isVisible = signal(false);
  private _formData = signal<PaymentConfirmFormData>({
    metodo_pago: '',
    fecha_pago: '',
    codigo_transferencia: '',
    observaciones: ''
  });
  private _resolveCallback = signal<((data: PaymentConfirmFormData | null) => void) | null>(null);
  private _chofer = signal<LiquidationDriver | null>(null);
  private _mes = signal<number | null>(null);
  private _anio = signal<number | null>(null);
  private _semana = signal<number | null>(null);
  private _isSubmitting = signal(false);

  readonly isVisible = this._isVisible.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly chofer = this._chofer.asReadonly();
  readonly mes = this._mes.asReadonly();
  readonly anio = this._anio.asReadonly();
  readonly semana = this._semana.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();

  /**
   * Abre el modal de confirmación de pago y retorna una Promise que se resuelve cuando el usuario guarda o cancela
   */
  open(chofer: LiquidationDriver, mes: number, anio: number, semana: number): Promise<PaymentConfirmFormData | null> {
    return new Promise((resolve) => {
      // Usar función que respeta la zona horaria de Chile para evitar problemas de fecha
      const today = getTodayStringInChile();
      this._chofer.set(chofer);
      this._mes.set(mes);
      this._anio.set(anio);
      this._semana.set(semana);
      this._formData.set({
        metodo_pago: '',
        fecha_pago: today,
        codigo_transferencia: '',
        observaciones: ''
      });
      this._resolveCallback.set(resolve);
      this._isVisible.set(true);
    });
  }

  /**
   * Actualiza los datos del formulario
   */
  updateFormData(data: Partial<PaymentConfirmFormData>): void {
    this._formData.update(current => ({ ...current, ...data }));
  }

  /**
   * Guarda la confirmación
   */
  save(): void {
    const data = this._formData();
    const resolve = this._resolveCallback();

    if (!resolve) {
      return;
    }

    // Validar que el método de pago esté seleccionado
    if (!data.metodo_pago || !data.fecha_pago) {
      return;
    }

    // Si es transferencia, validar código
    if (data.metodo_pago === 'transferencia' && (!data.codigo_transferencia || !data.codigo_transferencia.trim())) {
      return;
    }

    this._isSubmitting.set(true);
    resolve(data);
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
    // Usar función que respeta la zona horaria de Chile para evitar problemas de fecha
    const today = getTodayStringInChile();
    this._formData.set({
      metodo_pago: '',
      fecha_pago: today,
      codigo_transferencia: '',
      observaciones: ''
    });
    this._chofer.set(null);
    this._mes.set(null);
    this._anio.set(null);
    this._semana.set(null);
    this._resolveCallback.set(null);
    this._isSubmitting.set(false);
  }
}

