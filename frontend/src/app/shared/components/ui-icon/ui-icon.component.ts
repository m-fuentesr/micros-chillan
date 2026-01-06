import { Component, Input, computed, signal, PLATFORM_ID, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { LucideIconsModule } from '../../icons/lucide-icons.module';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconVariant = 'outline' | 'bold';

/**
 * UI Icon Component - Blueprint de Iconografía V2.0
 * 
 * Componente wrapper centralizado para Lucide Icons con:
 * - Grid: 24px (Hard Constraint)
 * - Stroke responsive: 1.5px desktop / 2px móvil
 * - LineCap/Join: Round (handled by Lucide)
 * - Tree-shakeable: Solo iconos registrados en icons.provider.ts
 * 
 * @example
 * ```html
 * <!-- Básico -->
 * <ui-icon name="BusFront" />
 * 
 * <!-- Con tamaño y clases -->
 * <ui-icon name="LayoutDashboard" size="lg" class="text-primary" />
 * 
 * <!-- Variante bold -->
 * <ui-icon name="CirclePlus" variant="bold" />
 * 
 * <!-- Con animación -->
 * <ui-icon name="Loader2" class="animate-spin" />
 * ```
 */
// Mapa de nombres de iconos (PascalCase -> kebab-case)
const ICON_NAME_MAP: Record<string, string> = {
  BusFront: 'bus-front',
  Bus: 'bus',
  IdCard: 'id-card',
  Route: 'route',
  LayoutDashboard: 'layout-dashboard',
  ClipboardList: 'clipboard-list',
  HandCoins: 'hand-coins',
  ChartNoAxesCombined: 'chart-no-axes-combined',
  Settings: 'settings',
  LifeBuoy: 'life-buoy',
  LogOut: 'log-out',
  Home: 'home',
  CirclePlus: 'circle-plus',
  UserRound: 'user-round',
  User: 'user',
  LockKeyhole: 'lock-keyhole',
  Eye: 'eye',
  EyeOff: 'eye-off',
  OctagonAlert: 'octagon-alert',
  Wallet: 'wallet',
  CalendarCheck: 'calendar-check',
  TrendingUp: 'trending-up',
  TrendingDown: 'trending-down',
  Siren: 'siren',
  TriangleAlert: 'triangle-alert',
  Pencil: 'pencil',
  Trash2: 'trash-2',
  Save: 'save',
  Filter: 'filter',
  ArrowUpDown: 'arrow-up-down',
  Download: 'download',
  CheckCircle2: 'check-circle-2',
  Clock: 'clock',
  AlertCircle: 'alert-circle',
  Ban: 'ban',
  Calendar: 'calendar',
  Menu: 'menu',
  X: 'x',
  ChevronLeft: 'chevron-left',
  ChevronRight: 'chevron-right',
  ChevronDown: 'chevron-down',
  Search: 'search',
  RefreshCw: 'refresh-cw',
  FileText: 'file-text',
  Info: 'info',
  Check: 'check',
  Loader2: 'loader-2',
  Users: 'users',
  Camera: 'camera',
  Upload: 'upload',
  Droplet: 'droplet',
  Phone: 'phone',
  Percent: 'percent',
  DollarSign: 'dollar-sign',
  RotateCcw: 'rotate-ccw',
  AlertTriangle: 'alert-triangle',
};

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  template: `
    <lucide-icon
      [name]="iconName()"
      [size]="sizeValue()"
      [strokeWidth]="strokeWidth()"
      [class]="class"
      [color]="'currentColor'"
    ></lucide-icon>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiIconComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private mediaQueryHandler?: (e: MediaQueryListEvent) => void;
  private mediaQuery?: MediaQueryList;
  
  /**
   * Nombre del icono Lucide (requerido)
   * Debe estar registrado en icons.provider.ts
   */
  @Input({ required: true }) name!: string;
  
  /**
   * Clases CSS adicionales
   */
  @Input() class: string = '';
  
  /**
   * Tamaño del icono
   * - xs: 14px (inline text)
   * - sm: 16px (small buttons)
   * - md: 20px (default, denso)
   * - lg: 24px (standard touch)
   * - xl: 32px (hero sections)
   */
  @Input() size: IconSize = 'md';
  
  /**
   * Variante de trazo
   * - outline: Normal (stroke responsive)
   * - bold: Trazo grueso (2.5px)
   */
  @Input() variant: IconVariant = 'outline';
  
  // Detección de dispositivo móvil
  private isMobile = signal<boolean>(false);
  
  /**
   * Convierte el nombre del icono de PascalCase a kebab-case para lucide-icon
   * Ejemplo: BusFront -> bus-front, LayoutDashboard -> layout-dashboard
   */
  protected iconName = computed(() => {
    return ICON_NAME_MAP[this.name] || this.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  });
  
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 768);
      
      // Listener para cambios de viewport (opcional, para apps responsive dinámicas)
      if (typeof window !== 'undefined' && window.matchMedia) {
        this.mediaQuery = window.matchMedia('(max-width: 767px)');
        this.mediaQueryHandler = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);
        this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
      }
    }
  }
  
  ngOnDestroy() {
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
    }
  }
  
  /**
   * Mapa de tamaños en píxeles
   * Cumple con el grid de 24px de Lucide
   */
  protected sizeValue = computed(() => {
    const sizeMap: Record<IconSize, number> = {
      xs: 14,  // Inline text
      sm: 16,  // Small buttons, badges
      md: 20,  // Estándar denso (default)
      lg: 24,  // Estándar touch (navegación, acciones principales)
      xl: 32   // Hero sections, headers
    };
    return sizeMap[this.size];
  });
  
  /**
   * Stroke responsive: 1.5px desktop / 2px móvil
   * 
   * Lógica:
   * - Bold variant: Siempre 2.5px (énfasis máximo)
   * - Tamaños pequeños (xs, sm): 2px (legibilidad)
   * - Móvil (< 768px): 2px (mejor visibilidad en campo)
   * - Desktop (>= 768px): 1.5px (elegancia SaaS B2B)
   */
  protected strokeWidth = computed(() => {
    if (this.variant === 'bold') return 2.5;
    if (this.size === 'xs' || this.size === 'sm') return 2;
    if (this.isMobile()) return 2;
    return 1.5;
  });
}

