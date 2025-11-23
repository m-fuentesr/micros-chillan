import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar-trabajador',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mobile-nav-bar bg-primary text-primary-content fixed bottom-0 left-0 right-0 z-50 shadow-lg">
      <div class="flex justify-around items-center h-16">
        <a routerLink="/trabajador/reportar" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-xs font-medium">Reportar</span>
        </a>
        
        <a routerLink="/trabajador/mi-historial" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span class="text-xs font-medium">Mi Historial</span>
        </a>
        
        <a routerLink="/trabajador/perfil" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-xs font-medium">Perfil</span>
        </a>
      </div>
    </nav>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarTrabajador {

}
