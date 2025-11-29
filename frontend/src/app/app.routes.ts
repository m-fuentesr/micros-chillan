import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Maquinas } from './pages/maquinas/maquinas';
import { MachineCreate } from './pages/maquinas/machine-create/machine-create';
import { MachineDetail } from './pages/maquinas/machine-detail/machine-detail';
import { DriversList } from './pages/choferes/drivers-list/drivers-list';
import { DriverDetail } from './pages/choferes/driver-detail/driver-detail';
import { DriverCreate } from './pages/choferes/driver-create/driver-create';
import { Contabilidad } from './pages/contabilidad/contabilidad';
import { Reportes } from './pages/reportes/reportes';
import { Configuracion } from './pages/configuracion/configuracion';
import { CentroAyuda } from './pages/centro-ayuda/centro-ayuda';
import { Login } from './pages/login/login';
import { Trabajador } from './pages/trabajador/trabajador';
import { Reportar } from './pages/trabajador/reportar/reportar';
import { MiHistorial } from './pages/trabajador/mi-historial/mi-historial';
import { Perfil } from './pages/trabajador/perfil/perfil';
import { ReporteExito } from './pages/trabajador/reporte-exito/reporte-exito';
import { RecuperarClave } from './pages/recuperar-clave/recuperar-clave';

import { authGuard } from './shared/guards/auth.guard';
import { adminGuard } from './shared/guards/admin.guard';
import { workerGuard } from './shared/guards/worker.guard';

export const routes: Routes = [
  { path: 'login', component: Login }, // Ruta: /login
  { path: 'recuperar-clave', component: RecuperarClave }, // Recuperar contraseña
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a login por defecto

  { path: 'dashboard', component: Home, canActivate: [authGuard, adminGuard] }, // Dashboard de administrador
  { path: 'about', component: About, canActivate: [authGuard, adminGuard] }, // Ruta: /about
  { path: 'maquinas', component: Maquinas, canActivate: [authGuard, adminGuard] }, // Ruta: /maquinas
  { path: 'maquinas/nueva', component: MachineCreate, canActivate: [authGuard, adminGuard] }, // Ruta: /maquinas/nueva
  { path: 'maquinas/:id', component: MachineDetail, canActivate: [authGuard, adminGuard] }, // Ruta: /maquinas/:id
  { path: 'choferes', component: DriversList, canActivate: [authGuard, adminGuard] }, // Ruta: /choferes
  { path: 'choferes/nuevo', component: DriverCreate, canActivate: [authGuard, adminGuard] }, // Ruta: /choferes/nuevo
  { path: 'choferes/:id', component: DriverDetail, canActivate: [authGuard, adminGuard] }, // Ruta: /choferes/:id
  { path: 'contabilidad', component: Contabilidad, canActivate: [authGuard, adminGuard] }, // Ruta: /contabilidad
  { path: 'reportes', component: Reportes, canActivate: [authGuard, adminGuard] }, // Ruta: /reportes
  { path: 'configuracion', component: Configuracion, canActivate: [authGuard, adminGuard] }, // Ruta: /configuracion
  { path: 'centro-ayuda', component: CentroAyuda, canActivate: [authGuard, adminGuard] }, // Ruta: /centro-ayuda

  { path: 'trabajador', component: Trabajador, canActivate: [authGuard, workerGuard] }, // Página principal de trabajador
  { path: 'trabajador/reportar', component: Reportar, canActivate: [authGuard, workerGuard] }, // Página de reportar
  { path: 'trabajador/reporte-exito', component: ReporteExito, canActivate: [authGuard, workerGuard] }, // Página de éxito del reporte
  { path: 'trabajador/mi-historial', component: MiHistorial, canActivate: [authGuard, workerGuard] }, // Página de mi historial
  { path: 'trabajador/perfil', component: Perfil, canActivate: [authGuard, workerGuard] }, // Página de perfil

  { path: '**', redirectTo: '/login' } // Ruta para 404, redirige a login
];
