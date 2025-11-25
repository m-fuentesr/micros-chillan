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

export const routes: Routes = [
  { path: 'login', component: Login }, // Ruta: /login
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a login por defecto
  { path: 'dashboard', component: Home }, // Dashboard de administrador
  { path: 'trabajador', component: Trabajador }, // Página principal de trabajador
  { path: 'trabajador/reportar', component: Reportar }, // Página de reportar
  { path: 'trabajador/reporte-exito', component: ReporteExito }, // Página de éxito del reporte
  { path: 'trabajador/mi-historial', component: MiHistorial }, // Página de mi historial
  { path: 'trabajador/perfil', component: Perfil }, // Página de perfil
  { path: 'recuperar-clave', component: RecuperarClave }, // Recuperar contraseña
  { path: 'about', component: About }, // Ruta: /about
  { path: 'maquinas', component: Maquinas }, // Ruta: /maquinas
  { path: 'maquinas/nueva', component: MachineCreate }, // Ruta: /maquinas/nueva
  { path: 'maquinas/:id', component: MachineDetail }, // Ruta: /maquinas/:id
  { path: 'choferes', component: DriversList }, // Ruta: /choferes
  { path: 'choferes/nuevo', component: DriverCreate }, // Ruta: /choferes/nuevo
  { path: 'choferes/:id', component: DriverDetail }, // Ruta: /choferes/:id
  { path: 'contabilidad', component: Contabilidad }, // Ruta: /contabilidad
  { path: 'reportes', component: Reportes }, // Ruta: /reportes
  { path: 'configuracion', component: Configuracion }, // Ruta: /configuracion
  { path: 'centro-ayuda', component: CentroAyuda }, // Ruta: /centro-ayuda
  { path: '**', redirectTo: '/login' } // Ruta para 404, redirige a login
];
