import { Component, ViewEncapsulation, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { NavbarTrabajador } from './shared/navbar-trabajador/navbar-trabajador';
import { CommonModule } from '@angular/common';
import { AuthService } from './shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, NavbarTrabajador, CommonModule],
  template: `
    @if (isAdmin()) {
      <!-- Layout con Sidebar (Administrador) -->
      <div class="h-dvh">
        <app-navbar (collapsedChange)="onSidebarCollapseChange($event)"></app-navbar>
        <main 
          [attr.class]="adminMainClasses()">
          <div class="p-4 sm:p-6">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    } @else if (isWorker()) {
      <!-- Layout con Navbar Móvil (Trabajador) -->
      <div class="flex flex-col min-h-screen bg-base-200">
        <main class="flex-1 bg-base-200 p-4 pb-24">
          <router-outlet></router-outlet>
        </main>
        @if (!hideWorkerNav()) {
          <app-navbar-trabajador></app-navbar-trabajador>
        }
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
  private auth = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');
  isWorker = computed(() => this.auth.currentUser()?.role === 'worker');
  adminMainClasses = computed(() => {
    const base = 'bg-base-100 h-dvh overflow-y-auto main-content-transition pt-16 lg:pt-0 ml-0';
    return `${base} ${this.sidebarCollapsed() ? 'lg:ml-16' : 'lg:ml-72'}`;
  });

  private navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  hideWorkerNav = computed(() => {
    if (!this.isWorker()) {
      return false;
    }
    const url = this.navigationEnd()?.urlAfterRedirects ?? this.router.url;
    return url.startsWith('/trabajador/reportar');
  });

  onSidebarCollapseChange(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
