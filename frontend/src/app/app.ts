import { Component, ViewEncapsulation, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { NavbarTrabajador } from './shared/navbar-trabajador/navbar-trabajador';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, NavbarTrabajador, CommonModule],
  template: `
    @if (showAdminSidebar()) {
      <!-- Layout con Sidebar (Administrador) -->
      <div class="h-dvh">
        <app-navbar (collapsedChange)="onSidebarCollapseChange($event)"></app-navbar>
        <main 
          class="bg-base-100 h-dvh overflow-y-auto main-content-transition pt-16 lg:pt-0 ml-0"
          [class.lg:ml-64]="!sidebarCollapsed()"
          [class.lg:ml-16]="sidebarCollapsed()">
          <div class="p-4 sm:p-6">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    } @else if (showWorkerNavbar()) {
      <!-- Layout con Navbar Móvil (Trabajador) -->
      <div class="flex flex-col min-h-screen bg-base-200">
        <main class="flex-1 bg-base-200 p-4 pb-24">
          <router-outlet></router-outlet>
        </main>
        <app-navbar-trabajador></app-navbar-trabajador>
      </div>
    } @else {
      <!-- Sin navbar/sidebar (Login) -->
      <router-outlet></router-outlet>
    }
  `,
  styles: [
    `.main-content-transition {
      transition: margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1);
    }`
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private router = inject(Router);
  
  showAdminSidebar = signal(false);
  showWorkerNavbar = signal(false);
  sidebarCollapsed = signal(false);

  // Convertir eventos del router a signal
  private navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );

  constructor() {
    // Verificar la ruta inicial
    this.updateLayout(this.router.url);

    // Efecto para actualizar el layout cuando cambia la navegación
    effect(() => {
      const event = this.navigationEnd();
      if (event) {
        this.updateLayout(event.url);
      }
    });
  }

  private updateLayout(url: string) {
    // Si es login, no mostrar ningún navbar/sidebar
    if (url === '/login' || url.startsWith('/login')) {
      this.showAdminSidebar.set(false);
      this.showWorkerNavbar.set(false);
      return;
    }

    // Si es trabajador, mostrar navbar de trabajador
    if (url === '/trabajador' || url.startsWith('/trabajador')) {
      this.showAdminSidebar.set(false);
      this.showWorkerNavbar.set(true);
      return;
    }

    // Para todas las demás rutas (dashboard, máquinas, etc.), mostrar sidebar de admin
    this.showAdminSidebar.set(true);
    this.showWorkerNavbar.set(false);
  }

  onSidebarCollapseChange(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
