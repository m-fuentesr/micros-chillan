import { Routes } from '@angular/router';
import { authGuard } from './shared/services/auth.guard';

export const routes: Routes = [
  // --- Auth ---
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'recuperar-clave',
    loadComponent: () =>
      import('./pages/recuperar-clave/recuperar-clave').then(m => m.RecuperarClave)
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // --- Admin ---
  {
    path: 'dashboard',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
    canActivate: [authGuard]
  },
  {
    path: 'about',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/about/about').then(m => m.About),
    canActivate: [authGuard]
  },
  {
    path: 'bitacora-operaciones',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/bitacora-operaciones/bitacora-operaciones').then(m => m.BitacoraOperaciones),
    canActivate: [authGuard]
  },
  {
    path: 'maquinas',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/maquinas/maquinas').then(m => m.Maquinas),
    canActivate: [authGuard]
  },
  {
    path: 'maquinas/nueva',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/maquinas/machine-create/machine-create').then(m => m.MachineCreate),
    canActivate: [authGuard]
  },
  {
    path: 'maquinas/:id',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/maquinas/machine-detail/machine-detail').then(m => m.MachineDetail),
    canActivate: [authGuard]
  },
  {
    path: 'choferes',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/choferes/drivers-list/drivers-list').then(m => m.DriversList),
    canActivate: [authGuard]
  },
  {
    path: 'choferes/nuevo',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/choferes/driver-create/driver-create').then(m => m.DriverCreate),
    canActivate: [authGuard]
  },
  {
    path: 'choferes/:id',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/choferes/driver-detail/driver-detail').then(m => m.DriverDetail),
    canActivate: [authGuard]
  },
  {
    path: 'contabilidad',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/contabilidad/contabilidad').then(m => m.Contabilidad),
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/reportes/reportes').then(m => m.Reportes),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/configuracion/configuracion').then(m => m.Configuracion),
    canActivate: [authGuard]
  },
  {
    path: 'centro-ayuda',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/centro-ayuda/centro-ayuda').then(m => m.CentroAyuda),
    canActivate: [authGuard]
  },

  // --- Worker ---
  {
    path: 'trabajador',
    data: { role: 'worker' },
    loadComponent: () =>
      import('./pages/trabajador/trabajador').then(m => m.Trabajador),
    canActivate: [authGuard]
  },
  {
    path: 'trabajador/reportar',
    data: { role: 'worker' },
    loadComponent: () =>
      import('./pages/trabajador/reportar/reportar').then(m => m.Reportar),
    canActivate: [authGuard]
  },
  {
    path: 'trabajador/reporte-exito',
    data: { role: 'worker' },
    loadComponent: () =>
      import('./pages/trabajador/reporte-exito/reporte-exito').then(m => m.ReporteExito),
    canActivate: [authGuard]
  },
  {
    path: 'trabajador/mi-historial',
    data: { role: 'worker' },
    loadComponent: () =>
      import('./pages/trabajador/mi-historial/mi-historial').then(m => m.MiHistorial),
    canActivate: [authGuard]
  },
  {
    path: 'trabajador/perfil',
    data: { role: 'worker' },
    loadComponent: () =>
      import('./pages/trabajador/perfil/perfil').then(m => m.Perfil),
    canActivate: [authGuard]
  },

  // --- Fallback 404 ---
  { path: '**', redirectTo: '/login' }
];
