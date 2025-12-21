import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Driver, DriverKPIs } from '../models/driver.models';
import { environment } from '../../../environments/environment.development';
import { calculateLicenseStatus } from '../utils/license.utils';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // GET /api/drivers - Listar choferes con paginación
  getDrivers(filters?: {
    search?: string;
    estado?: 'todos' | 'activos' | 'inactivos';
    licencia_estado?: 'vencidas' | 'por_vencer' | 'vigentes';
    page?: number;
    per_page?: number;
  }): Observable<{
    datos: Driver[];
    total: number;
    pagina: number;
    por_pagina: number;
    total_paginas: number;
  }> {
    let params = new HttpParams();
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.estado && filters.estado !== 'todos') {
      params = params.set('estado', filters.estado);
    }
    if (filters?.licencia_estado) {
      params = params.set('licencia_estado', filters.licencia_estado);
    }
    
    // Paginación por defecto: 12 registros por página
    const pagina = filters?.page || 1;
    const porPagina = filters?.per_page || 12;
    
    params = params.set('page', pagina.toString());
    params = params.set('per_page', porPagina.toString());
    
    // El backend retorna DriverListItem[] con el formato:
    // { id, nombre_completo, rut, telefono, correo_electronico, estado, maquina_actual, licencia_estado }
    interface BackendDriver {
      id: number;
      nombre_completo: string;
      rut: string;
      telefono: string;
      correo_electronico: string;
      estado: 'activo' | 'inactivo' | 'eliminado';
      maquina_actual?: {
        id: number;
        identificador: string;
      } | null;
      licencia_estado: {
        fecha_vencimiento: string; // ISO date string
        estado: 'ok' | 'warning' | 'danger';
        dias_restantes: number;
      };
    }

    interface BackendPaginatedResponse {
      total: number;
      page: number;
      per_page: number;
      items: BackendDriver[];
    }
    
    return this.http.get<BackendPaginatedResponse>(`${this.apiUrl}/api/drivers`, { params }).pipe(
      map((response) => ({
        datos: response.items.map((backendDriver): Driver => {
          // Calcular alerta de licencia desde el estado que viene del backend
          const alertaLicencia = backendDriver.licencia_estado.estado === 'danger' || backendDriver.licencia_estado.estado === 'warning';
          
          return {
            id: backendDriver.id,
            nombre_completo: backendDriver.nombre_completo,
            rut: backendDriver.rut,
            telefono: backendDriver.telefono,
            correo: backendDriver.correo_electronico,
            porcentaje_pago: 0, // No viene en el listado, se obtiene en el detalle
            fecha_venc_licencia: backendDriver.licencia_estado.fecha_vencimiento,
            alerta_licencia: alertaLicencia,
            estado: backendDriver.estado,
            maquina_actual: backendDriver.maquina_actual || null
          };
        }),
        total: response.total,
        pagina: response.page,
        por_pagina: response.per_page,
        total_paginas: Math.ceil(response.total / response.per_page)
      })),
      catchError((error) => {
        console.error('Error obteniendo choferes:', error);
        return throwError(() => error);
      })
    );
  }

  // GET /api/drivers/summary - Obtener KPIs de conductores
  getKPIs(): Observable<DriverKPIs> {
    return this.http.get<{
      estados: {
        activos: number;
        inactivos: number;
      };
      operatividad: {
        con_maquina_asignada: number;
        sin_asignar: number;
      };
      documentos: {
        licencias_con_alerta: number;
      };
    }>(`${this.apiUrl}/api/drivers/summary`).pipe(
      map((response) => ({
        activos: response.estados.activos,
        inactivos: response.estados.inactivos,
        con_maquina: response.operatividad.con_maquina_asignada,
        licencias_por_vencer: response.documentos.licencias_con_alerta
      })),
      catchError((error) => {
        console.error('Error obteniendo KPIs de conductores:', error);
        return of({
          activos: 0,
          inactivos: 0,
          con_maquina: 0,
          licencias_por_vencer: 0
        });
      })
    );
  }

  // GET /api/drivers/license-alerts - Obtener alertas de licencia
  getLicenseAlerts(filters?: {
    estado?: 'todos' | 'activos' | 'inactivos';
  }): Observable<{
    vencidas: number;
    por_vencer: number;
    vigentes: number;
  }> {
    let params = new HttpParams();
    if (filters?.estado && filters.estado !== 'todos') {
      params = params.set('estado', filters.estado);
    }
    return this.http.get<{
      vencidas: number;
      por_vencer: number;
      vigentes: number;
    }>(`${this.apiUrl}/api/drivers/license-alerts`, { params });
  }

  // GET /api/drivers/active - Lista choferes activos para selects
  getActiveDrivers(): Observable<Array<{ id: number; nombre_completo: string }>> {
    return this.http.get<Array<{ id: number; nombre_completo: string }>>(
      `${this.apiUrl}/api/drivers/active`
    ).pipe(
      map((response) => {
        // Asegurar que la respuesta sea un array
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error obteniendo choferes activos:', error);
        return throwError(() => error);
      })
    );
  }

  // GET /api/drivers/{id} - Obtener detalle de chofer
  getDriverById(id: number): Observable<Driver> {
    interface BackendDriverDetail {
      id: number;
      nombre_completo: string;
      primer_nombre?: string;
      segundo_nombre?: string | null;
      apellido_paterno?: string;
      apellido_materno?: string;
      rut: string;
      estado: 'activo' | 'inactivo' | 'eliminado';
      telefono: string;
      correo_electronico: string;
      porcentaje_pago: number;
      maquina_actual: { id: number; identificador: string } | null;
      licencia: {
        fecha_vencimiento: string;
        dias_restantes: number;
        estado: 'ok' | 'warning' | 'danger';
      };
    }

    return this.http.get<BackendDriverDetail>(`${this.apiUrl}/api/drivers/${id}`).pipe(
      map((backendDriver): Driver => {
        // Usar los campos individuales si están disponibles, sino extraer del nombre_completo
        const nombre = backendDriver.primer_nombre || '';
        const segundoNombre = backendDriver.segundo_nombre || undefined;
        const apellido = backendDriver.apellido_paterno || '';
        const segundoApellido = backendDriver.apellido_materno || '';

        return {
          id: backendDriver.id,
          nombre_completo: backendDriver.nombre_completo,
          rut: backendDriver.rut,
          telefono: backendDriver.telefono,
          correo: backendDriver.correo_electronico, // Mapear correo_electronico a correo
          porcentaje_pago: backendDriver.porcentaje_pago,
          fecha_venc_licencia: backendDriver.licencia.fecha_vencimiento,
          alerta_licencia: backendDriver.licencia.estado === 'danger' || backendDriver.licencia.estado === 'warning',
          estado: backendDriver.estado,
          maquina_actual: backendDriver.maquina_actual,
          nombre: nombre,
          segundo_nombre: segundoNombre,
          apellido: apellido,
          segundo_apellido: segundoApellido
        };
      }),
      catchError((error) => {
        console.error('Error obteniendo detalle de chofer:', error);
        return throwError(() => error);
      })
    );
  }


  // POST /api/drivers - Crear nuevo chofer
  createDriver(driver: Partial<Driver>): Observable<Driver> {
    return this.http.post<Driver>(`${this.apiUrl}/api/drivers`, driver);
  }

  // PUT /api/drivers/{id} - Actualizar chofer
  updateDriver(id: number, driver: Partial<Driver>): Observable<Driver> {
    return this.http.put<Driver>(`${this.apiUrl}/api/drivers/${id}`, driver);
  }

  // DELETE /api/drivers/{id} - Desactivar chofer (soft delete)
  deleteDriver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/drivers/${id}`);
  }
}

