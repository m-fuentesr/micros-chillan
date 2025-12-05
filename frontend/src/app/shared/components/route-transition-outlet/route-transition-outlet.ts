import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { RouteTransitionService } from '../../services/route-transition.service';

@Component({
  selector: 'app-route-transition-outlet',
  imports: [RouterOutlet],
  template: `
    @if (isAdminRoute()) {
      <div 
        [class]="containerClasses()"
        class="route-transition-container">
        <router-outlet></router-outlet>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [
    `
    .route-transition-container {
      position: relative;
      width: 100%;
      min-height: 100%;
      will-change: transform, opacity;
      transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }

    /* Accesibilidad - Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .route-transition-container {
        will-change: auto;
        animation: none !important;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteTransitionOutlet implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private routeTransitionService = inject(RouteTransitionService);
  private navigationSubscription?: Subscription;

  transitionState = signal<string>('void');
  currentUrl = signal<string>('');
  isMobile = signal<boolean>(false);

  isAdminRoute = computed(() => {
    const url = this.currentUrl();
    return this.routeTransitionService.isAdminRoute(url);
  });

  containerClasses = computed(() => {
    const base = 'route-transition-container';
    const state = this.transitionState();
    const mobile = this.isMobile() ? 'route-transition-mobile' : '';
    
    // Agregar clase según el estado de transición
    let stateClass = '';
    if (state && state !== 'void') {
      stateClass = `route-transition-${state}`;
    }
    
    return `${base} ${mobile} ${stateClass}`.trim();
  });

  constructor() {
    // Detectar viewport móvil/desktop
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(max-width: 1023px)');
      this.isMobile.set(mediaQuery.matches);
      
      const handleMediaChange = (e: MediaQueryListEvent) => {
        this.isMobile.set(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleMediaChange);
    }
  }

  ngOnInit(): void {
    // Inicializar con estado void (primera carga)
    this.transitionState.set('void');
    this.currentUrl.set(this.router.url);

    // Escuchar cambios de navegación
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const previousUrl = this.routeTransitionService.getPreviousUrl();
        const currentUrl = event.urlAfterRedirects;
        this.currentUrl.set(currentUrl);
        
        // Resetear el estado para forzar la re-animación de CSS
        this.transitionState.set('void');
        
        // Usar setTimeout para permitir que el DOM se actualice a 'void' antes de aplicar la nueva animación
        setTimeout(() => {
          // Solo aplicar transición si ambas rutas son admin
          if (previousUrl && previousUrl !== currentUrl) {
            const isPreviousAdmin = this.routeTransitionService.isAdminRoute(previousUrl);
            const isCurrentAdmin = this.routeTransitionService.isAdminRoute(currentUrl);
            
            if (isPreviousAdmin && isCurrentAdmin) {
              const navigationType = this.routeTransitionService.getNavigationType(previousUrl, currentUrl);
              if (navigationType) {
                this.transitionState.set(navigationType);
              } else {
                this.transitionState.set('void');
              }
            } else {
              // Si alguna ruta no es admin, no hay transición
              this.transitionState.set('void');
            }
          } else {
            // Primera carga o misma URL, no hay transición
            this.transitionState.set('void');
          }
        }, 0);
      });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }
}

