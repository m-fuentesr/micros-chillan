import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
        return of(this.getMockMachines());
      })
    );
  }

  // GET /api/machines/{id} - Obtener detalle de máquina
  getMachineById(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.apiUrl}/api/machines/${id}`).pipe(
      catchError(() => {
        // Mock data para desarrollo
        const mockMachine = this.getMockMachineById(id);
        return mockMachine ? of(mockMachine) : of(null as any);
      })
    );
  }

  private getMockMachineById(id: number): Machine | null {
    const mockMachines = this.getMockMachines();
    return mockMachines.find(m => m.id === id) || null;
  }

  private getMockMachines(): Machine[] {
    return [
      {
        id: 1,
        numero: '05',
        marca: 'Mercedes-Benz',
        patente: 'ABCD-12',
        año: 2018,
        estado_operativo: 'Operativa',
        chofer_actual: {
          id: 1,
          nombre_completo: 'Juan Pérez'
        },
        documentos: {
          revision_tecnica: '2023-11-20',
          permiso_circulacion: '2024-03-31',
          seguro_obligatorio: '2024-01-15'
        }
      },
      {
        id: 2,
        numero: '02',
        marca: 'Caio',
        patente: 'EFGH-34',
        año: 2019,
        estado_operativo: 'Operativa',
        chofer_actual: {
          id: 2,
          nombre_completo: 'María Gómez'
        },
        documentos: {
          revision_tecnica: '2024-12-31',
          permiso_circulacion: '2024-12-31',
          seguro_obligatorio: '2024-12-31'
        }
      },
      {
        id: 3,
        numero: '07',
        marca: 'Mercedes-Benz',
        patente: 'IJKL-56',
        año: 2020,
        estado_operativo: 'En Taller',
        chofer_actual: {
          id: 3,
          nombre_completo: 'Pedro López'
        },
        documentos: {
          revision_tecnica: '2024-11-30',
          permiso_circulacion: '2024-11-30',
          seguro_obligatorio: '2024-11-30'
        }
      },
      {
        id: 4,
        numero: '03',
        marca: 'Marcopolo',
        patente: 'MNOP-78',
        año: 2017,
        estado_operativo: 'Inactiva',
        chofer_actual: null,
        documentos: {
          revision_tecnica: '2024-10-15',
          permiso_circulacion: '2024-10-15',
          seguro_obligatorio: '2024-10-15'
        }
      }
    ];
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
    const payload: BackendMachineCreate = {
      numero_interno: Number(machine.numero) || 0,
      patente: machine.patente || '',
      marca: machine.marca || '',
      anio_fabricacion: machine.año || new Date().getFullYear(),
      estado_operativo: estadoOperativo,
      chofer_id: machine.chofer_id || null,
      documentos: {
        fecha_venc_revision_tecnica: machine.documentos?.revision_tecnica || '',
        fecha_venc_permiso_circulacion: machine.documentos?.permiso_circulacion || '',
        fecha_venc_seguro_obligatorio: machine.documentos?.seguro_obligatorio || ''
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
    const payload: BackendMachineUpdate = {
      numero_interno: Number(machine.numero) || 0,
      patente: machine.patente || '',
      marca: machine.marca || '',
      anio_fabricacion: machine.año || new Date().getFullYear(),
      estado_operativo: estadoOperativo,
      chofer_id: machine.chofer_id || null,
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
}

