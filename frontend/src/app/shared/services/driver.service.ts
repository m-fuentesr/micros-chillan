import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Driver } from '../models/driver.models';
import { environment } from '../../../environments/environment.development';
import { calculateLicenseStatus } from '../utils/license.utils';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // GET /api/drivers - Listar choferes
  getDrivers(filters?: {
    search?: string;
    estado?: 'activo' | 'inactivo';
  }): Observable<Driver[]> {
    let params = new HttpParams();
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.estado) {
      // Backend espera "activos" / "inactivos"
      const estadoMap: Record<string, string> = { activo: 'activos', inactivo: 'inactivos' };
      const mapped = estadoMap[filters.estado] || filters.estado;
      params = params.set('estado', mapped);
    }
    
    // El backend retorna {items: BackendDriver[]}, necesitamos mapear a Driver[]
    interface BackendDriver {
      id: number;
      rut: string;
      primer_nombre: string;
      segundo_nombre?: string | null;
      apellido_paterno: string;
      apellido_materno: string;
      telefono: string;
      correo_electronico: string;
      fecha_venc_licencia: string; // ISO date string
      estado: 'activo' | 'inactivo';
      porcentaje_pago: number;
      created_at?: string;
      updated_at?: string;
      // El backend no retorna maquina_actual en el listado, se obtiene de otra consulta
    }
    
    return this.http.get<any>(`${this.apiUrl}/api/drivers`, { params }).pipe(
      map((response) => {
        // El backend responde con un array o con { items: [] } según el endpoint
        const backendItems: BackendDriver[] = Array.isArray(response)
          ? response
          : (response?.items || []);

        // Transformar los datos del backend al formato del frontend
        let drivers: Driver[] = backendItems.map((backendDriver): Driver => {
          // Construir nombre_completo
          const nombreCompleto = [
            backendDriver.primer_nombre,
            backendDriver.segundo_nombre,
            backendDriver.apellido_paterno,
            backendDriver.apellido_materno
          ]
            .filter(Boolean)
            .join(' ');
          
          // Calcular alerta de licencia
          const licenseStatus = calculateLicenseStatus(backendDriver.fecha_venc_licencia, 30);
          const alertaLicencia = licenseStatus.estado === 'error' || licenseStatus.estado === 'warning';
          
          return {
            id: backendDriver.id,
            nombre_completo: nombreCompleto,
            rut: backendDriver.rut,
            telefono: backendDriver.telefono,
            correo: backendDriver.correo_electronico,
            porcentaje_pago: backendDriver.porcentaje_pago,
            fecha_venc_licencia: backendDriver.fecha_venc_licencia,
            alerta_licencia: alertaLicencia,
            estado: backendDriver.estado,
            maquina_actual: null, // El backend no retorna esto en el listado, se puede obtener de otra consulta si es necesario
            nombre: backendDriver.primer_nombre,
            segundo_nombre: backendDriver.segundo_nombre || undefined,
            apellido: backendDriver.apellido_paterno,
            segundo_apellido: backendDriver.apellido_materno,
            created_at: backendDriver.created_at,
            updated_at: backendDriver.updated_at
          };
        });
        
        // Aplicar filtros en el frontend si el backend no los soporta
        if (filters?.estado) {
          drivers = drivers.filter(d => d.estado === filters.estado);
        }
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          drivers = drivers.filter(d => 
            d.nombre_completo?.toLowerCase().includes(search) ||
            d.rut?.includes(search)
          );
        }
        
        return drivers;
      }),
      catchError(() => {
        // Mock data para desarrollo
        let drivers = this.getMockDrivers();
        if (filters?.estado) {
          drivers = drivers.filter(d => d.estado === filters.estado);
        }
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          drivers = drivers.filter(d => 
            d.nombre_completo.toLowerCase().includes(search) ||
            d.rut.includes(search)
          );
        }
        return of(drivers);
      })
    );
  }

  // GET /api/drivers/active - Lista choferes activos para selects
  getActiveDrivers(): Observable<Array<{ id: number; nombre_completo: string }>> {
    return this.http.get<Array<{ id: number; nombre_completo: string }>>(
      `${this.apiUrl}/api/drivers/active`
    ).pipe(
      catchError(() => of([]))
    );
  }

  // GET /api/drivers/{id} - Obtener detalle de chofer
  getDriverById(id: number): Observable<Driver> {
    return this.http.get<Driver>(`${this.apiUrl}/api/drivers/${id}`).pipe(
      catchError(() => {
        // Mock data para desarrollo
        const mockDriver = this.getMockDriverById(id);
        return mockDriver ? of(mockDriver) : of(null as any);
      })
    );
  }

  private getMockDriverById(id: number): Driver | null {
    const mockDrivers = this.getMockDrivers();
    return mockDrivers.find(d => d.id === id) || null;
  }

  private getMockDrivers(): Driver[] {
    return [
      {
        id: 1,
        nombre_completo: 'Juan Pérez González',
        rut: '12.345.678-9',
        telefono: '+56 9 1234 5678',
        correo: 'juan.perez@ejemplo.cl',
        porcentaje_pago: 16.5,
        fecha_venc_licencia: '2024-12-15',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: {
          id: 1,
          identificador: 'MÁQUINA 01'
        },
        nombre: 'Juan',
        segundo_nombre: 'Carlos',
        apellido: 'Pérez',
        segundo_apellido: 'González'
      },
      {
        id: 2,
        nombre_completo: 'María López Silva',
        rut: '18.765.432-1',
        telefono: '+56 9 8765 4321',
        correo: 'maria.lopez@ejemplo.cl',
        porcentaje_pago: 15.0,
        fecha_venc_licencia: '2025-06-20',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: {
          id: 3,
          identificador: 'MÁQUINA 03'
        },
        nombre: 'María',
        apellido: 'López',
        segundo_apellido: 'Silva'
      },
      {
        id: 3,
        nombre_completo: 'Pedro Ramírez Torres',
        rut: '15.987.654-3',
        telefono: '+56 9 5987 6543',
        correo: 'pedro.ramirez@ejemplo.cl',
        porcentaje_pago: 16.0,
        fecha_venc_licencia: '2024-11-25',
        alerta_licencia: true,
        estado: 'inactivo',
        maquina_actual: null,
        nombre: 'Pedro',
        segundo_nombre: 'Antonio',
        apellido: 'Ramírez',
        segundo_apellido: 'Torres'
      },
      {
        id: 4,
        nombre_completo: 'Ana Fernández Muñoz',
        rut: '14.258.963-7',
        telefono: '+56 9 4258 9637',
        correo: 'ana.fernandez@ejemplo.cl',
        porcentaje_pago: 15.5,
        fecha_venc_licencia: '2025-03-10',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: {
          id: 5,
          identificador: 'MÁQUINA 05'
        },
        nombre: 'Ana',
        segundo_nombre: 'María',
        apellido: 'Fernández',
        segundo_apellido: 'Muñoz'
      },
      {
        id: 5,
        nombre_completo: 'Carlos Soto Bravo',
        rut: '16.357.159-2',
        telefono: '+56 9 6357 1592',
        correo: 'carlos.soto@ejemplo.cl',
        porcentaje_pago: 16.0,
        fecha_venc_licencia: '2025-08-15',
        alerta_licencia: false,
        estado: 'activo',
        maquina_actual: null,
        nombre: 'Carlos',
        apellido: 'Soto',
        segundo_apellido: 'Bravo'
      }
    ];
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

