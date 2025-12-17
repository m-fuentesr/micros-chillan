import { Injectable, signal } from '@angular/core';

export interface NewRecordFormData {
  noWorkDay: boolean;
  noWorkDayReason: string;
  noWorkDayReasonOther: string; // Campo de texto cuando se selecciona "Otro"
  date: string;
  machine: number | string; // ID de la máquina (número) o string para compatibilidad
  driver: number | string; // ID del chofer (número) o string para compatibilidad
  income: number;
  dieselExpense: number;
  dieselLiters: number;
  hasIncident: boolean;
  observations: string;
  receiptPhoto: File | null;
  fuelReceiptPhoto: File | null;
}

@Injectable({
  providedIn: 'root'
})
export class NewRecordModalService {
  private _isVisible = signal(false);
  private _formData = signal<NewRecordFormData>({
    noWorkDay: false,
    noWorkDayReason: '',
    noWorkDayReasonOther: '',
    date: '',
    machine: '',
    driver: '',
    income: 0,
    dieselExpense: 0,
    dieselLiters: 0,
    hasIncident: false,
    observations: '',
    receiptPhoto: null,
    fuelReceiptPhoto: null
  });
  private _resolveCallback = signal<((record: NewRecordFormData | null) => void) | null>(null);
  private _isSubmitting = signal(false);

  readonly isVisible = this._isVisible.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();

  /**
   * Abre el modal de nuevo registro y retorna una Promise que se resuelve cuando el usuario guarda o cancela
   */
  open(): Promise<NewRecordFormData | null> {
    return new Promise((resolve) => {
      const today = new Date().toISOString().split('T')[0];
      this._formData.set({
        noWorkDay: false,
        noWorkDayReason: '',
        noWorkDayReasonOther: '',
        date: today,
        machine: '',
        driver: '',
        income: 0,
        dieselExpense: 0,
        dieselLiters: 0,
        hasIncident: false,
        observations: '',
        receiptPhoto: null,
        fuelReceiptPhoto: null
      });
      this._resolveCallback.set(resolve);
      this._isVisible.set(true);
    });
  }

  /**
   * Actualiza los datos del formulario
   */
  updateFormData(data: Partial<NewRecordFormData>): void {
    this._formData.update(current => ({ ...current, ...data }));
  }

  /**
   * Guarda el registro (pero no cierra el modal, se cerrará cuando se complete la operación)
   */
  save(): void {
    const resolve = this._resolveCallback();
    if (resolve) {
      this._isSubmitting.set(true);
      resolve(this._formData());
      // No cerramos aquí, se cerrará cuando se complete la operación
    }
  }

  /**
   * Marca que la operación ha terminado (éxito o error) y cierra el modal
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
    this._isSubmitting.set(false);
    this._formData.set({
      noWorkDay: false,
      noWorkDayReason: '',
      noWorkDayReasonOther: '',
      date: '',
      machine: '',
      driver: '',
      income: 0,
      dieselExpense: 0,
      dieselLiters: 0,
      hasIncident: false,
      observations: '',
      receiptPhoto: null,
      fuelReceiptPhoto: null
    });
    this._resolveCallback.set(null);
  }
}


