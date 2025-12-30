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

  private splitNombreCompleto(nombreCompleto: string | null | undefined) {
    const fallback = {
      primerNombreFallback: '',
      segundoNombreFallback: undefined as string | undefined,
      apellidoPaternoFallback: '',
      apellidoMaternoFallback: ''
    };

    if (!nombreCompleto) {
      return fallback;
    }

    const parts = nombreCompleto
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return fallback;
    }

    const [primerNombre, ...resto] = parts;
    let segundoNombreFallback = fallback.segundoNombreFallback;
    let apellidoPaternoFallback = fallback.apellidoPaternoFallback;
    let apellidoMaternoFallback = fallback.apellidoMaternoFallback;

    if (resto.length === 1) {
      apellidoPaternoFallback = resto[0];
    } else if (resto.length >= 2) {
      apellidoMaternoFallback = resto.pop() ?? '';
      apellidoPaternoFallback = resto.pop() ?? '';
      if (resto.length) {
        segundoNombreFallback = resto.join(' ');
      }
    }

    return {
      primerNombreFallback: primerNombre,
      segundoNombreFallback,
      apellidoPaternoFallback,
      apellidoMaternoFallback
    };
  }

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
            licencia_estado: {
              estado: backendDriver.licencia_estado.estado,
              dias_restantes: backendDriver.licencia_estado.dias_restantes,
              fecha_vencimiento: backendDriver.licencia_estado.fecha_vencimiento,
            },
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

  // GET /api/drivers/active/without-machine - Lista choferes activos sin máquina asignada
  getActiveDriversWithoutMachine(): Observable<Array<{ id: number; nombre_completo: string }>> {
    return this.http.get<Array<{ id: number; nombre_completo: string }>>(
      `${this.apiUrl}/api/drivers/active/without-machine`
    ).pipe(
      map((response) => {
        // Asegurar que la respuesta sea un array
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error obteniendo choferes activos sin máquina:', error);
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
      fecha_contrato?: string | null;
    }

    return this.http.get<BackendDriverDetail>(`${this.apiUrl}/api/drivers/${id}`).pipe(
      map((backendDriver): Driver => {
        // Usar los campos individuales si están disponibles; si no, derivarlos desde nombre_completo
        const {
          primerNombreFallback,
          segundoNombreFallback,
          apellidoPaternoFallback,
          apellidoMaternoFallback
        } = this.splitNombreCompleto(backendDriver.nombre_completo);

        const nombre = backendDriver.primer_nombre || primerNombreFallback;
        const segundoNombre = backendDriver.segundo_nombre ?? segundoNombreFallback;
        const apellido = backendDriver.apellido_paterno || apellidoPaternoFallback;
        const segundoApellido = backendDriver.apellido_materno || apellidoMaternoFallback;

        const nombreCompleto = [
          nombre,
          segundoNombre,
          apellido,
          segundoApellido
        ]
          .filter(Boolean)
          .join(' ');

        return {
          id: backendDriver.id,
          nombre_completo: nombreCompleto,
          rut: backendDriver.rut,
          telefono: backendDriver.telefono,
          correo: backendDriver.correo_electronico, // Mapear correo_electronico a correo
          porcentaje_pago: backendDriver.porcentaje_pago,
          fecha_venc_licencia: backendDriver.licencia.fecha_vencimiento,
          alerta_licencia: backendDriver.licencia.estado === 'danger' || backendDriver.licencia.estado === 'warning',
          licencia_estado: {
            estado: backendDriver.licencia.estado,
            dias_restantes: backendDriver.licencia.dias_restantes,
            fecha_vencimiento: backendDriver.licencia.fecha_vencimiento,
          },
          estado: backendDriver.estado,
          maquina_actual: backendDriver.maquina_actual,
          nombre: nombre,
          segundo_nombre: segundoNombre,
          apellido: apellido,
          segundo_apellido: segundoApellido,
          fecha_contrato: backendDriver.fecha_contrato || undefined
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

  // GET /api/drivers/{id}/liquidations - Obtener liquidaciones de un chofer
  getDriverLiquidations(
    driverId: number,
    filters?: {
      mes_desde?: number;
      anio_desde?: number;
      mes_hasta?: number;
      anio_hasta?: number;
      estado_pago?: 'pendiente' | 'pagado';
      page?: number;
      per_page?: number;
    }
  ): Observable<{
    items: any[];
    total: number;
    total_global: number;
    page: number;
    per_page: number;
  }> {
    let params = new HttpParams();
    
    if (filters?.mes_desde) {
      params = params.set('mes_desde', filters.mes_desde.toString());
    }
    if (filters?.anio_desde) {
      params = params.set('anio_desde', filters.anio_desde.toString());
    }
    if (filters?.mes_hasta) {
      params = params.set('mes_hasta', filters.mes_hasta.toString());
    }
    if (filters?.anio_hasta) {
      params = params.set('anio_hasta', filters.anio_hasta.toString());
    }
    if (filters?.estado_pago) {
      params = params.set('estado_pago', filters.estado_pago);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params = params.set('per_page', filters.per_page.toString());
    }

    interface BackendLiquidationResponse {
      total: number;
      total_global: number;
      page: number;
      per_page: number;
      items: Array<{
        id: number;
        fecha: string;
        mes: number;
        anio: number;
        total_ganado: number;
        minimo_garantizado: number;
        pago_final: number;
        metodo_pago?: string | null;
        codigo_transferencia?: string | null;
        estado_pago: 'pendiente' | 'pagado';
      }>;
    }

    return this.http.get<BackendLiquidationResponse>(`${this.apiUrl}/api/drivers/${driverId}/liquidations`, { params }).pipe(
      map((response) => ({
        items: response.items.map((item) => ({
          id: item.id,
          fecha: item.fecha,
          total_ganado: item.total_ganado,
          minimo_garantizado: item.minimo_garantizado,
          pago_final: item.pago_final,
          metodo_pago: item.metodo_pago || 'transferencia',
          codigo_transferencia: item.codigo_transferencia || null,
          estado_pago: item.estado_pago
        })),
        total: response.total,
        total_global: response.total_global,
        page: response.page,
        per_page: response.per_page
      })),
      catchError((error) => {
        console.error('Error obteniendo liquidaciones:', error);
        return throwError(() => error);
      })
    );
  }
}

