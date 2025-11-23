import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Machine, MachineKPIs, MachineDocumentAlerts } from '../models/machine.models';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  // GET /api/machines - Listar máquinas
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
    
    return this.http.get<Machine[]>(`${this.apiUrl}/machines`, { params });
  }

  // GET /api/machines/{id} - Obtener detalle de máquina
  getMachineById(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.apiUrl}/machines/${id}`).pipe(
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
  createMachine(machine: Partial<Machine>): Observable<Machine> {
    return this.http.post<Machine>(`${this.apiUrl}/machines`, machine);
  }

  // PUT /api/machines/{id} - Actualizar máquina
  updateMachine(id: number, machine: Partial<Machine>): Observable<Machine> {
    return this.http.put<Machine>(`${this.apiUrl}/machines/${id}`, machine);
  }

  // DELETE /api/machines/{id} - Eliminar máquina (soft delete)
  deleteMachine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/machines/${id}`);
  }

  // GET /api/machines/kpis - Obtener KPIs de máquinas
  getKPIs(): Observable<MachineKPIs> {
    return this.http.get<MachineKPIs>(`${this.apiUrl}/machines/kpis`);
  }

  // GET /api/machines/document-alerts - Obtener alertas de documentación
  getDocumentAlerts(filters?: { estado?: string }): Observable<MachineDocumentAlerts> {
    let params = new HttpParams();
    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }
    return this.http.get<MachineDocumentAlerts>(`${this.apiUrl}/machines/document-alerts`, { params });
  }
}

