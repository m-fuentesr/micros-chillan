import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { adminGuard } from './shared/guards/admin.guard';
import { workerGuard } from './shared/guards/worker.guard';

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
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about').then(m => m.About),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'bitacora-operaciones',
    loadComponent: () =>
      import('./pages/bitacora-operaciones/bitacora-operaciones').then(m => m.BitacoraOperaciones),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'maquinas',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/maquinas/maquinas').then(m => m.Maquinas),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'maquinas/nueva',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/maquinas/machine-create/machine-create').then(m => m.MachineCreate),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'maquinas/:id',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/maquinas/machine-detail/machine-detail').then(m => m.MachineDetail),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'choferes',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/choferes/drivers-list/drivers-list').then(m => m.DriversList),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'choferes/nuevo',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/choferes/driver-create/driver-create').then(m => m.DriverCreate),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'choferes/:id',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/choferes/driver-detail/driver-detail').then(m => m.DriverDetail),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'contabilidad',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/contabilidad/contabilidad').then(m => m.Contabilidad),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'reportes',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/reportes/reportes').then(m => m.Reportes),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'configuracion',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/configuracion/configuracion').then(m => m.Configuracion),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'centro-ayuda',
    data: { role: 'admin' },
    loadComponent: () =>
      import('./pages/centro-ayuda/centro-ayuda').then(m => m.CentroAyuda),
    canActivate: [authGuard, adminGuard]
  },

  // --- Worker ---
  {
    path: 'trabajador',
    loadComponent: () =>
      import('./pages/trabajador/trabajador').then(m => m.Trabajador),
    canActivate: [authGuard, workerGuard]
  },
  {
    path: 'trabajador/reportar',
    loadComponent: () =>
      import('./pages/trabajador/reportar/reportar').then(m => m.Reportar),
    canActivate: [authGuard, workerGuard]
  },
  {
    path: 'trabajador/reporte-exito',
    loadComponent: () =>
      import('./pages/trabajador/reporte-exito/reporte-exito').then(m => m.ReporteExito),
    canActivate: [authGuard, workerGuard]
  },
  {
    path: 'trabajador/mi-historial',
    loadComponent: () =>
      import('./pages/trabajador/mi-historial/mi-historial').then(m => m.MiHistorial),
    canActivate: [authGuard, workerGuard]
  },
  {
    path: 'trabajador/perfil',
    loadComponent: () =>
      import('./pages/trabajador/perfil/perfil').then(m => m.Perfil),
    canActivate: [authGuard, workerGuard]
  },

  // --- Fallback 404 ---
  { path: '**', redirectTo: '/login' }
];
