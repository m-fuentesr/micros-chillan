import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, shareReplay, map } from 'rxjs/operators';
import { Machine, MachineKPIs, MachineDocumentAlerts, MachineSelect } from '../models/machine.models';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Sistema de caché para máquinas activas
  private activeMachinesCache: MachineSelect[] | null = null;
  private activeMachinesCacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // GET /api/machines/active - Listar máquinas operativas (para selector de choferes)
  getActiveMachines(forceRefresh = false): Observable<MachineSelect[]> {
    const now = Date.now();

    // Verificar caché válido
    if (!forceRefresh && this.activeMachinesCache && (now - this.activeMachinesCacheTimestamp) < this.CACHE_TTL) {
      return of(this.activeMachinesCache);
    }

    return this.http.get<MachineSelect[]>(`${this.apiUrl}/api/machines/active`)
      .pipe(
        tap((machines) => {
          // Guardar en caché después de respuesta exitosa
          this.activeMachinesCache = machines;
          this.activeMachinesCacheTimestamp = now;
        }),
        shareReplay(1), // Compartir el observable entre múltiples suscriptores
        catchError((error) => {
          console.error('Error obteniendo máquinas activas:', error);
          // Si hay caché, retornarlo aunque esté expirado
          if (this.activeMachinesCache) {
            return of(this.activeMachinesCache);
          }
          return of([]);
        })
      );
  }

  // GET /api/machines - Listar máquinas
  // El backend retorna: { id, numero_interno, marca, patente, estado_operativo, chofer_asignado, documentos }
  // Transformamos a: { id, numero, marca, patente, estado_operativo, chofer_actual, documentos }
  getMachines(filters?: {
    estado?: string;
    search?: string;
  }): Observable<Machine[]> {
    let params = new HttpParams();
    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    
    // Tipo de respuesta del backend
    interface BackendMachine {
      id: number;
      numero_interno: number;
      marca: string;
      patente: string;
      estado_operativo: string; // "operativa", "en_taller", "inactiva"
      chofer_asignado: {
        id: number;
        nombre_completo: string;
      } | null;
      documentos: {
        [key: string]: {
          fecha_vencimiento: string; // ISO date string
          estado: "ok" | "por_vencer" | "vencido";
        };
      };
    }

    return this.http.get<BackendMachine[]>(`${this.apiUrl}/api/machines`, { params }).pipe(
      map((machines) => 
        machines.map((m): Machine => {
          // Transformar estado_operativo
          const estadoMap: Record<string, 'Operativa' | 'En Taller' | 'Inactiva'> = {
            'operativa': 'Operativa',
            'en_taller': 'En Taller',
            'inactiva': 'Inactiva'
          };
          const estadoOperativo = estadoMap[m.estado_operativo.toLowerCase()] || 'Operativa';

          // Transformar documentos
          const documentos: Machine['documentos'] = {};
          if (m.documentos['revision_tecnica']) {
            documentos.revision_tecnica = m.documentos['revision_tecnica'].fecha_vencimiento.split('T')[0];
          }
          if (m.documentos['permiso_circulacion']) {
            documentos.permiso_circulacion = m.documentos['permiso_circulacion'].fecha_vencimiento.split('T')[0];
          }
          if (m.documentos['seguro_obligatorio']) {
            documentos.seguro_obligatorio = m.documentos['seguro_obligatorio'].fecha_vencimiento.split('T')[0];
          }

          return {
            id: m.id,
            numero: String(m.numero_interno),
            marca: m.marca,
            patente: m.patente || '',
            estado_operativo: estadoOperativo,
            chofer_actual: m.chofer_asignado,
            documentos: documentos
          };
        })
      ),
      catchError((error) => {
        console.error('Error obteniendo máquinas:', error);
        return throwError(() => error);
      })
    );
  }

  // GET /api/machines/{id} - Obtener detalle de máquina
  getMachineById(id: number): Observable<Machine> {
    interface BackendMachineDetail {
      id: number;
      numero_interno: number;
      patente: string;
      marca: string;
      anio_fabricacion: number;
      estado_operativo: 'operativa' | 'en_taller' | 'inactiva';
      chofer_actual_id: number | null;
      documentos: {
        fecha_venc_revision_tecnica: string | null;
        fecha_venc_permiso_circulacion: string | null;
        fecha_venc_seguro_obligatorio: string | null;
      };
    }

    const estadoMap: Record<string, 'Operativa' | 'En Taller' | 'Inactiva'> = {
      operativa: 'Operativa',
      en_taller: 'En Taller',
      inactiva: 'Inactiva'
    };

    return this.http.get<BackendMachineDetail>(`${this.apiUrl}/api/machines/${id}`).pipe(
      map((m): Machine => {
        const machine: Machine = {
          id: m.id,
          numero: String(m.numero_interno),
          marca: m.marca,
          patente: m.patente || '',
          año: m.anio_fabricacion,
          estado_operativo: estadoMap[m.estado_operativo] || 'Operativa',
          chofer_id: m.chofer_actual_id,
          // El backend no retorna nombre del chofer; dejamos null para que se pueble después
          chofer_actual: null,
          documentos: {
            revision_tecnica: m.documentos?.fecha_venc_revision_tecnica || undefined,
            permiso_circulacion: m.documentos?.fecha_venc_permiso_circulacion || undefined,
            seguro_obligatorio: m.documentos?.fecha_venc_seguro_obligatorio || undefined
          }
        };
        return machine;
      }),
      catchError((error) => {
        console.error('Error obteniendo detalle de máquina:', error);
        return throwError(() => error);
      })
    );
  }


  // POST /api/machines - Crear nueva máquina
  // Transformamos los datos del frontend al formato que espera el backend
  createMachine(machine: Partial<Machine>): Observable<Machine> {
    // Tipo de payload que espera el backend
    interface BackendMachineCreate {
      numero_interno: number;
      patente: string;
      marca: string;
      anio_fabricacion: number;
      estado_operativo: string; // "operativa", "en_taller", "inactiva"
      chofer_id?: number | null;
      documentos: {
        fecha_venc_revision_tecnica: string; // ISO date string (YYYY-MM-DD)
        fecha_venc_permiso_circulacion: string; // ISO date string (YYYY-MM-DD)
        fecha_venc_seguro_obligatorio: string; // ISO date string (YYYY-MM-DD)
      };
    }

    // Validar campos obligatorios
    if (!machine.numero || !machine.patente || !machine.marca) {
      return throwError(() => new Error('Faltan campos obligatorios: número, patente o marca'));
    }

    // Validar que las fechas de documentación estén presentes
    if (!machine.documentos?.revision_tecnica || 
        !machine.documentos?.permiso_circulacion || 
        !machine.documentos?.seguro_obligatorio) {
      return throwError(() => new Error('Todas las fechas de documentación son obligatorias'));
    }

    // Validar formato de fechas (deben ser strings ISO YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    const revisionTecnica = machine.documentos.revision_tecnica.trim();
    const permisoCirculacion = machine.documentos.permiso_circulacion.trim();
    const seguroObligatorio = machine.documentos.seguro_obligatorio.trim();

    if (!fechaRegex.test(revisionTecnica) ||
        !fechaRegex.test(permisoCirculacion) ||
        !fechaRegex.test(seguroObligatorio)) {
      return throwError(() => new Error('Las fechas deben estar en formato YYYY-MM-DD'));
    }

    // Validar que las fechas sean válidas
    const revisionDate = new Date(revisionTecnica);
    const permisoDate = new Date(permisoCirculacion);
    const seguroDate = new Date(seguroObligatorio);

    if (isNaN(revisionDate.getTime()) || 
        isNaN(permisoDate.getTime()) || 
        isNaN(seguroDate.getTime())) {
      return throwError(() => new Error('Una o más fechas no son válidas'));
    }

    // Transformar estado_operativo
    const estadoMap: Record<string, string> = {
      'Operativa': 'operativa',
      'En Taller': 'en_taller',
      'Inactiva': 'inactiva'
    };
    const estadoOperativo = estadoMap[machine.estado_operativo || 'Operativa'] || 'operativa';

    // Manejar chofer_id correctamente (puede ser null, undefined, o un número)
    let choferId: number | null = null;
    if (machine.chofer_id !== undefined && machine.chofer_id !== null) {
      choferId = Number(machine.chofer_id);
      if (isNaN(choferId)) {
        choferId = null;
      }
    }

    // Construir payload para el backend
    const payload: BackendMachineCreate = {
      numero_interno: Number(machine.numero),
      patente: machine.patente.trim(),
      marca: machine.marca.trim(),
      anio_fabricacion: machine.año || new Date().getFullYear(),
      estado_operativo: estadoOperativo,
      chofer_id: choferId,
      documentos: {
        fecha_venc_revision_tecnica: revisionTecnica,
        fecha_venc_permiso_circulacion: permisoCirculacion,
        fecha_venc_seguro_obligatorio: seguroObligatorio
      }
    };

    return this.http.post<{ id: number; message: string }>(`${this.apiUrl}/api/machines`, payload).pipe(
      map((response) => {
        // Transformar la respuesta del backend al formato del frontend
        return {
          id: response.id,
          numero: String(payload.numero_interno),
          marca: payload.marca,
          patente: payload.patente,
          año: payload.anio_fabricacion,
          estado_operativo: machine.estado_operativo || 'Operativa',
          chofer_id: payload.chofer_id,
          documentos: {
            revision_tecnica: payload.documentos.fecha_venc_revision_tecnica,
            permiso_circulacion: payload.documentos.fecha_venc_permiso_circulacion,
            seguro_obligatorio: payload.documentos.fecha_venc_seguro_obligatorio
          }
        } as Machine;
      }),
      catchError((error) => {
        console.error('Error al crear máquina:', error);
        throw error;
      })
    );
  }

  // PUT /api/machines/{id} - Actualizar máquina
  // Transformamos los datos del frontend al formato que espera el backend
  updateMachine(id: number, machine: Partial<Machine>): Observable<Machine> {
    // Tipo de payload que espera el backend
    interface BackendMachineUpdate {
      numero_interno: number;
      patente: string;
      marca: string;
      anio_fabricacion: number;
      estado_operativo: string; // "operativa", "en_taller", "inactiva"
      chofer_id?: number | null;
      documentos: {
        fecha_venc_revision_tecnica: string; // ISO date string
        fecha_venc_permiso_circulacion: string; // ISO date string
        fecha_venc_seguro_obligatorio: string; // ISO date string
      };
    }

    // Transformar estado_operativo
    const estadoMap: Record<string, string> = {
      'Operativa': 'operativa',
      'En Taller': 'en_taller',
      'Inactiva': 'inactiva'
    };
    const estadoOperativo = estadoMap[machine.estado_operativo || 'Operativa'] || 'operativa';

    // Construir payload para el backend
    // Asegurar que chofer_id sea explícitamente null si no hay valor
    const choferIdValue = machine.chofer_id !== undefined && machine.chofer_id !== null 
      ? Number(machine.chofer_id) 
      : null;
    
    const payload: BackendMachineUpdate = {
      numero_interno: Number(machine.numero) || 0,
      patente: machine.patente || '',
      marca: machine.marca || '',
      anio_fabricacion: machine.año || new Date().getFullYear(),
      estado_operativo: estadoOperativo,
      chofer_id: choferIdValue,
      documentos: {
        fecha_venc_revision_tecnica: machine.documentos?.revision_tecnica || '',
        fecha_venc_permiso_circulacion: machine.documentos?.permiso_circulacion || '',
        fecha_venc_seguro_obligatorio: machine.documentos?.seguro_obligatorio || ''
      }
    };

    return this.http.put<{ message: string }>(`${this.apiUrl}/api/machines/${id}`, payload).pipe(
      map(() => {
        // Transformar la respuesta al formato del frontend
        return {
          id: id,
          numero: String(payload.numero_interno),
          marca: payload.marca,
          patente: payload.patente,
          año: payload.anio_fabricacion,
          estado_operativo: machine.estado_operativo || 'Operativa',
          chofer_id: payload.chofer_id,
          documentos: {
            revision_tecnica: payload.documentos.fecha_venc_revision_tecnica,
            permiso_circulacion: payload.documentos.fecha_venc_permiso_circulacion,
            seguro_obligatorio: payload.documentos.fecha_venc_seguro_obligatorio
          }
        } as Machine;
      }),
      catchError((error) => {
        console.error('Error al actualizar máquina:', error);
        throw error;
      })
    );
  }

  // DELETE /api/machines/{id} - Eliminar máquina (soft delete)
  deleteMachine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/machines/${id}`);
  }

  // GET /api/machines/summary - Obtener KPIs de máquinas
  // El backend retorna: { estados: { operativas, en_taller, inactivas }, documentos: { total_con_alertas } }
  // Transformamos a: { operativas, en_taller, inactivas, documentos_por_vencer }
  getKPIs(): Observable<MachineKPIs> {
    return this.http.get<{
      estados: {
        operativas: number;
        en_taller: number;
        inactivas: number;
      };
      documentos: {
        total_con_alertas: number;
      };
    }>(`${this.apiUrl}/api/machines/summary`).pipe(
      map((response) => ({
        operativas: response.estados.operativas,
        en_taller: response.estados.en_taller,
        inactivas: response.estados.inactivas,
        documentos_por_vencer: response.documentos.total_con_alertas
      })),
      catchError((error) => {
        console.error('Error obteniendo KPIs de máquinas:', error);
        return of({
          operativas: 0,
          en_taller: 0,
          inactivas: 0,
          documentos_por_vencer: 0
        });
      })
    );
  }

  // GET /api/machines/document-alerts - Obtener alertas de documentación
  getDocumentAlerts(filters?: { estado?: string }): Observable<MachineDocumentAlerts> {
    let params = new HttpParams();
    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }
    return this.http.get<MachineDocumentAlerts>(`${this.apiUrl}/api/machines/document-alerts`, { params });
  }

  // GET /api/machines/{id}/assignments - Obtener historial de asignaciones de una máquina
  getMachineAssignments(machineId: number, filtro?: 'todas' | 'actual' | 'cerradas'): Observable<any[]> {
    let params = new HttpParams();
    if (filtro && filtro !== 'todas') {
      params = params.set('filtro', filtro);
    }

    // Tipo de respuesta del backend
    interface BackendAssignment {
      id: number;
      chofer_id: number;
      chofer_nombre: string;
      fecha_inicio: string; // ISO date string
      fecha_fin: string | null; // ISO date string o null
      estado: "Activa" | "Cerrada";
      dias_asignado: number;
    }

    return this.http.get<BackendAssignment[]>(`${this.apiUrl}/api/machines/${machineId}/assignments`, { params }).pipe(
      map((assignments) => 
        assignments.map((a) => ({
          id: a.id,
          chofer: {
            id: a.chofer_id,
            nombre_completo: a.chofer_nombre
          },
          fecha_inicio: a.fecha_inicio,
          fecha_fin: a.fecha_fin,
          duracion_dias: a.dias_asignado,
          estado: a.estado.toLowerCase() as 'activa' | 'cerrada'
        }))
      ),
      catchError((error) => {
        console.error('Error obteniendo asignaciones:', error);
        return of([]);
      })
    );
  }

  // GET /api/machines/{id}/maintenances - Obtener mantenimientos de una máquina
  getMachineMaintenances(
    machineId: number, 
    filters?: { categoria?: string; item?: string; desde?: string; hasta?: string }
  ): Observable<{ items: any[]; total_registros: number; gasto_mes_actual: number }> {
    let params = new HttpParams();
    if (filters?.categoria) {
      params = params.set('categoria', filters.categoria);
    }
    if (filters?.item) {
      params = params.set('item', filters.item);
    }
    if (filters?.desde) {
      params = params.set('desde', filters.desde);
    }
    if (filters?.hasta) {
      params = params.set('hasta', filters.hasta);
    }

    // Tipo de respuesta del backend
    interface BackendMaintenanceResponse {
      total_registros: number;
      gasto_mes_actual: number;
      items: Array<{
        id: number;
        fecha: string; // ISO date string
        item: string;
        categoria: string | null;
        costo: number;
        numero_documento: string | null;
      }>;
    }

    return this.http.get<BackendMaintenanceResponse>(`${this.apiUrl}/api/machines/${machineId}/maintenances`, { params }).pipe(
      map((response) => ({
        total_registros: response.total_registros,
        gasto_mes_actual: response.gasto_mes_actual,
        items: response.items.map((item) => ({
          id: item.id,
          maquina_id: machineId,
          item: item.item,
          costo: item.costo,
          numero_factura: item.numero_documento || '',
          categoria: item.categoria as 'preventivo' | 'correctivo' | null,
          fecha: item.fecha
        }))
      })),
      catchError((error) => {
        console.error('Error obteniendo mantenimientos:', error);
        return of({ items: [], total_registros: 0, gasto_mes_actual: 0 });
      })
    );
  }

  // POST /api/machines/{id}/maintenances - Crear mantenimiento
  createMachineMaintenance(machineId: number, maintenance: {
    item: string;
    costo: number;
    numero_factura: string;
    categoria?: 'preventivo' | 'correctivo' | null;
    fecha: string;
  }): Observable<any> {
    // El backend espera item_personalizado (string) o item_repuesto_id (number)
    // Por ahora, usamos item_personalizado con el nombre del item
    const payload = {
      item_personalizado: maintenance.item,
      costo: maintenance.costo,
      numero_documento: maintenance.numero_factura,
      categoria: maintenance.categoria || null,
      fecha_compra: maintenance.fecha
    };

    return this.http.post<{ id: number; maquina_id: number; message: string }>(
      `${this.apiUrl}/api/machines/${machineId}/maintenances`, 
      payload
    ).pipe(
      map((response) => ({
        id: response.id,
        maquina_id: response.maquina_id,
        item: maintenance.item,
        costo: maintenance.costo,
        numero_factura: maintenance.numero_factura,
        categoria: maintenance.categoria || null,
        fecha: maintenance.fecha
      })),
      catchError((error) => {
        console.error('Error creando mantenimiento:', error);
        throw error;
      })
    );
  }

  // DELETE /api/maintenances/{id} - Eliminar mantenimiento
  deleteMaintenance(maintenanceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/maintenances/${maintenanceId}`).pipe(
      catchError((error) => {
        console.error('Error eliminando mantenimiento:', error);
        throw error;
      })
    );
  }
}

