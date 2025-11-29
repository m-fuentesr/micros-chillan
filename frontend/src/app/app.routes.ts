import { Routes } from '@angular/router';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: 'login', component: Login }, // Ruta: /login
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a login por defecto
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home)
  }, // Dashboard de administrador (lazy)
  {
    path: 'bitacora-operaciones',
    loadComponent: () =>
      import('./pages/bitacora-operaciones/bitacora-operaciones').then(m => m.BitacoraOperaciones)
  }, // Ruta: /bitacora-operaciones (lazy)
  {
    path: 'registro-diario/:id',
    loadComponent: () =>
      import('./pages/registro-diario-detail/registro-diario-detail').then(m => m.RegistroDiarioDetail)
  }, // Ruta: /registro-diario/:id (lazy)
  {
    path: 'trabajador',
    loadComponent: () =>
      import('./pages/trabajador/trabajador').then(m => m.Trabajador)
  }, // Página principal de trabajador (lazy)
  {
    path: 'trabajador/reportar',
    loadComponent: () =>
      import('./pages/trabajador/reportar/reportar').then(m => m.Reportar)
  }, // Página de reportar (lazy)
  {
    path: 'trabajador/reporte-exito',
    loadComponent: () =>
      import('./pages/trabajador/reporte-exito/reporte-exito').then(m => m.ReporteExito)
  }, // Página de éxito del reporte (lazy)
  {
    path: 'trabajador/mi-historial',
    loadComponent: () =>
      import('./pages/trabajador/mi-historial/mi-historial').then(m => m.MiHistorial)
  }, // Página de mi historial (lazy)
  {
    path: 'trabajador/perfil',
    loadComponent: () =>
      import('./pages/trabajador/perfil/perfil').then(m => m.Perfil)
  }, // Página de perfil (lazy)
  {
    path: 'recuperar-clave',
    loadComponent: () =>
      import('./pages/recuperar-clave/recuperar-clave').then(m => m.RecuperarClave)
  }, // Recuperar contraseña (lazy, pequeño impacto)
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about').then(m => m.About)
  }, // Ruta: /about (lazy)
  {
    path: 'maquinas',
    loadComponent: () =>
      import('./pages/maquinas/maquinas').then(m => m.Maquinas)
  }, // Ruta: /maquinas (lazy)
  {
    path: 'maquinas/nueva',
    loadComponent: () =>
      import('./pages/maquinas/machine-create/machine-create').then(m => m.MachineCreate)
  }, // Ruta: /maquinas/nueva (lazy)
  {
    path: 'maquinas/:id',
    loadComponent: () =>
      import('./pages/maquinas/machine-detail/machine-detail').then(m => m.MachineDetail)
  }, // Ruta: /maquinas/:id (lazy)
  {
    path: 'choferes',
    loadComponent: () =>
      import('./pages/choferes/drivers-list/drivers-list').then(m => m.DriversList)
  }, // Ruta: /choferes (lazy)
  {
    path: 'choferes/nuevo',
    loadComponent: () =>
      import('./pages/choferes/driver-create/driver-create').then(m => m.DriverCreate)
  }, // Ruta: /choferes/nuevo (lazy)
  {
    path: 'choferes/:id',
    loadComponent: () =>
      import('./pages/choferes/driver-detail/driver-detail').then(m => m.DriverDetail)
  }, // Ruta: /choferes/:id (lazy)
  {
    path: 'contabilidad',
    loadComponent: () =>
      import('./pages/contabilidad/contabilidad').then(m => m.Contabilidad)
  }, // Ruta: /contabilidad (lazy)
  {
    path: 'reportes',
    loadComponent: () =>
      import('./pages/reportes/reportes').then(m => m.Reportes)
  }, // Ruta: /reportes (lazy)
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./pages/configuracion/configuracion').then(m => m.Configuracion)
  }, // Ruta: /configuracion (lazy)
  {
    path: 'centro-ayuda',
    loadComponent: () =>
      import('./pages/centro-ayuda/centro-ayuda').then(m => m.CentroAyuda)
  }, // Ruta: /centro-ayuda (lazy)
  { path: '**', redirectTo: '/login' } // Ruta para 404, redirige a login
];
