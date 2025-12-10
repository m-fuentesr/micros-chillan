import { Injectable, signal } from '@angular/core';

export interface NewRecordFormData {
  noWorkDay: boolean;
  noWorkDayReason: string;
  date: string;
  machine: string;
  driver: string;
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

  readonly isVisible = this._isVisible.asReadonly();
  readonly formData = this._formData.asReadonly();

  /**
   * Abre el modal de nuevo registro y retorna una Promise que se resuelve cuando el usuario guarda o cancela
   */
  open(): Promise<NewRecordFormData | null> {
    return new Promise((resolve) => {
      const today = new Date().toISOString().split('T')[0];
      this._formData.set({
        noWorkDay: false,
        noWorkDayReason: '',
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
   * Guarda el registro
   */
  save(): void {
    const resolve = this._resolveCallback();
    if (resolve) {
      resolve(this._formData());
    }
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
    this._formData.set({
      noWorkDay: false,
      noWorkDayReason: '',
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


