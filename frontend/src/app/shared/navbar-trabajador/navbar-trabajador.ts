import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar-trabajador',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-200 shadow-lg shadow-base-300/40" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0.35rem);">
      <div class="flex justify-around items-end h-20 px-3">
        <a
          routerLink="/trabajador"
          routerLinkActive="text-primary font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center w-full h-full text-base-content/60 transition-colors active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 mb-1">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="M12 5.432 2.15 15.28a.75.75 0 0 1-.53.22h1.5a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25v-6a.75.75 0 0 1 1.5 0v6a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25v-6a2.25 2.25 0 0 1 2.25-2.25h1.5a.75.75 0 0 1-.53-.22L12 5.432Z" />
          </svg>
          <span class="text-[10px]">Inicio</span>
        </a>

        <a
          routerLink="/trabajador/reportar"
          routerLinkActive="text-primary"
          class="flex flex-col items-center justify-center w-full h-full -mt-6"
        >
          <div class="w-14 h-14 bg-primary text-primary-content rounded-full shadow-xl border-4 border-base-100 flex items-center justify-center transition-transform active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="text-[10px] font-semibold mt-1 text-primary">Nuevo</span>
        </a>

        <a
          routerLink="/trabajador/perfil"
          routerLinkActive="text-primary font-bold"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex flex-col items-center justify-center w-full h-full text-base-content/60 transition-colors active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 mb-1">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
          <span class="text-[10px]">Perfil</span>
        </a>
      </div>
    </nav>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarTrabajador {}
