import { Injectable, signal } from '@angular/core';
import { getTodayStringInChile } from '../utils/date.utils';
import { MaintenanceRecord } from '../models/machine-detail.models';

export interface MaintenanceFormData {
  item: string;
  costo: number | null;
  numero_factura: string;
  categoria: 'preventivo' | 'correctivo' | '';
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceFormModalService {
  private _isVisible = signal(false);
  private _formData = signal<MaintenanceFormData>({
    item: '',
    costo: null,
    numero_factura: '',
    categoria: '',
    fecha: ''
  });
  private _resolveCallback = signal<((record: MaintenanceRecord | null) => void) | null>(null);
  private _machineId = signal<number | null>(null);
  private _availableItems = signal<string[]>([]);

  readonly isVisible = this._isVisible.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly machineId = this._machineId.asReadonly();
  readonly availableItems = this._availableItems.asReadonly();

  /**
   * Abre el modal de registro y retorna una Promise que se resuelve cuando el usuario guarda o cancela
   */
  open(machineId: number, availableItems: string[] = []): Promise<MaintenanceRecord | null> {
    return new Promise((resolve) => {
      // Usar función que respeta la zona horaria de Chile para evitar problemas de fecha
      const today = getTodayStringInChile();
      this._machineId.set(machineId);
      this._availableItems.set(availableItems);
      this._formData.set({
        item: '',
        costo: null,
        numero_factura: '',
        categoria: '',
        fecha: today
      });
      this._resolveCallback.set(resolve);
      this._isVisible.set(true);
    });
  }

  /**
   * Actualiza los datos del formulario
   */
  updateFormData(data: Partial<MaintenanceFormData>): void {
    this._formData.update(current => ({ ...current, ...data }));
  }

  /**
   * Guarda el registro
   */
  save(): void {
    const data = this._formData();
    const machineId = this._machineId();
    const resolve = this._resolveCallback();

    if (!machineId || !resolve) {
      return;
    }

    // Validar que los campos requeridos estén completos
    if (!data.item || data.costo === null || !data.numero_factura || !data.fecha) {
      return;
    }

    // Crear el registro
    const newRecord: MaintenanceRecord = {
      id: 0, // Se asignará en el backend
      maquina_id: machineId,
      item: data.item,
      costo: data.costo,
      numero_factura: data.numero_factura,
      categoria: data.categoria === '' ? null : (data.categoria as 'preventivo' | 'correctivo'),
      fecha: data.fecha
    };

    resolve(newRecord);
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
      item: '',
      costo: null,
      numero_factura: '',
      categoria: '',
      fecha: today
    });
    this._machineId.set(null);
    this._availableItems.set([]);
    this._resolveCallback.set(null);
  }
}

