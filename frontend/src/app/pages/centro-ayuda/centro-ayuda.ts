import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type IconName =
  | 'introduccion'
  | 'dashboard'
  | 'maquinas'
  | 'choferes'
  | 'registro-diario'
  | 'contabilidad'
  | 'reportes'
  | 'configuracion'
  | 'faq';

interface HelpNavItem {
  id: string;
  title: string;
  icon: IconName;
  description: string;
}

interface HelpModule {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  context?: string;
  highlights?: Array<{ title: string; body: string }>;
  list?: string[];
  steps?: Array<{ title: string }>;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-centro-ayuda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200 pb-16">
      <!-- Hero Section Premium -->
      <div class="hero-section bg-gradient-to-br from-primary/5 via-base-100 to-base-200/50 rounded-3xl p-6 md:p-8 lg:p-10 mb-6 animate-fade-in-down">
        <div class="max-w-4xl mx-auto space-y-6">
          <div class="page-entry-header border-l-4 border-l-primary pl-3 md:pl-4">
            <h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content tracking-tight mb-2">
              Centro de Ayuda
            </h1>
            <p class="text-base-content/70 text-xs md:text-sm mt-1 max-w-2xl">
              Explora documentación accionable para dashboard, contabilidad, reportes y flujos diarios.
            </p>
          </div>

          <div class="relative max-w-xl mx-auto group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              class="input input-lg w-full pl-12 pr-4 rounded-3xl shadow-xl border-base-200 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Buscar temas, ej: 'Liquidación', 'Exportar reporte'..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>

          @if (searchQuery().trim()) {
            <div class="max-w-xl mx-auto bg-base-100 border border-base-200 rounded-3xl p-4 text-left animate-card-enter shadow-md">
              <p class="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3">Resultados sugeridos</p>
              <ul class="space-y-2">
                @for (item of filteredNav(); track item.id) {
                  <li>
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-base-200 transition-colors text-sm"
                      (click)="scrollToSection(item.id, true)"
                    >
                      <svg
                        class="w-5 h-5 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        [innerHTML]="icons[item.icon]"
                      ></svg>
                      <div class="flex-1">
                        <p class="font-bold">{{ item.title }}</p>
                        <p class="text-xs text-base-content/50 truncate">{{ item.description }}</p>
                      </div>
                    </button>
                  </li>
                }
                @if (filteredNav().length === 0) {
                  <li class="text-sm text-base-content/60 italic">No encontramos resultados para "{{ searchQuery() }}".</li>
                }
              </ul>
            </div>
          }
        </div>
      </div>

      <!-- Layout principal -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Menú lateral -->
          <aside class="hidden lg:block lg:col-span-3">
            <nav class="sticky top-24 space-y-4 animate-card-enter">
              <p class="px-3 text-xs font-bold text-base-content/40 uppercase tracking-[0.35em]">Contenido</p>
              @for (item of navItems(); track item.id) {
                <button
                  type="button"
                  class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all duration-200 border border-transparent"
                  (click)="scrollToSection(item.id)"
                  [class.bg-primary]="activeSection() === item.id"
                  [class.text-primary-content]="activeSection() === item.id"
                  [class.shadow-lg]="activeSection() === item.id"
                  [class.hover:bg-base-300]="activeSection() !== item.id"
                  [class.bg-base-100]="activeSection() !== item.id"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      [innerHTML]="icons[item.icon]"
                    ></svg>
                    <span>{{ item.title }}</span>
                  </div>
                  @if (activeSection() === item.id) {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                    </svg>
                  }
                </button>
              }
            </nav>
          </aside>

          <!-- Contenido principal -->
          <section class="lg:col-span-9 space-y-12">
            @for (section of sections(); track section.id) {
              <article
                [id]="section.id"
                class="scroll-mt-28 animate-card-enter bg-base-100 border border-base-200 shadow-sm rounded-3xl"
              >
                <div class="card-body space-y-6">
                  <header class="flex flex-col gap-3">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                        <svg
                          class="w-7 h-7"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                          [innerHTML]="icons[section.icon]"
                        ></svg>
                      </div>
                      <div>
                        <h2 class="text-2xl font-bold">{{ section.title }}</h2>
                        <p class="text-base-content/60 text-sm">{{ section.description }}</p>
                      </div>
                    </div>
                    @if (section.context) {
                      <div class="alert alert-info bg-info/10 border-info/20 text-sm text-base-content">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div>{{ section.context }}</div>
                      </div>
                    }
                  </header>

                  @if (section.highlights?.length) {
                    <div class="grid sm:grid-cols-2 gap-4">
                      @for (item of section.highlights; track item.title) {
                        <div class="p-4 rounded-3xl border border-base-200 bg-base-200/40">
                          <h3 class="font-bold mb-1">{{ item.title }}</h3>
                          <p class="text-sm text-base-content/70">{{ item.body }}</p>
                        </div>
                      }
                    </div>
                  }

                  @if (section.list?.length) {
                    <div class="space-y-2">
                      <h3 class="text-sm uppercase tracking-widest text-base-content/50 font-bold">Elementos clave</h3>
                      <ul class="list-disc list-outside pl-6 text-sm text-base-content/80 space-y-2">
                        @for (item of section.list; track item) {
                          <li [innerHTML]="item"></li>
                        }
                      </ul>
                    </div>
                  }

                  @if (section.steps?.length) {
                    <div class="space-y-4">
                      <h3 class="text-sm uppercase tracking-widest text-base-content/50 font-bold">Flujo recomendado</h3>
                      <div class="steps steps-vertical lg:steps-horizontal w-full">
                        @for (step of section.steps; track step.title) {
                          <li class="step step-primary text-xs">{{ step.title }}</li>
                        }
                      </div>
                    </div>
                  }
                </div>
              </article>
            }

            <!-- FAQ -->
            <section id="faq" class="scroll-mt-28">
              <div class="card bg-base-100 border border-base-200 shadow-sm rounded-3xl">
                <div class="card-body space-y-6">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <svg
                        class="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        [innerHTML]="icons['faq']"
                      ></svg>
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold">Preguntas Frecuentes</h2>
                      <p class="text-sm text-base-content/60">Explora respuestas rápidas sin salir del flujo.</p>
                    </div>
                  </div>

                  <div class="space-y-2">
                    @for (faq of faqs(); track faq.question) {
                      <div class="collapse collapse-arrow bg-base-100 border border-base-200 shadow-sm">
                        <input type="radio" name="faq-accordion" /> 
                        <div class="collapse-title text-base font-bold">
                          {{ faq.question }}
                        </div>
                        <div class="collapse-content text-base-content/70 text-sm leading-relaxed">
                          <p>{{ faq.answer }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </section>

            <!-- CTA Soporte -->
            <section class="card bg-primary text-primary-content shadow-xl rounded-3xl animate-card-enter-delay-3">
              <div class="card-body flex flex-col md:flex-row md:items-center gap-6">
                <div class="w-16 h-16 bg-primary-content/10 rounded-full flex items-center justify-center text-primary-content">
                  <svg
                    class="w-10 h-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="7.5" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 4.5v2.25" />
                    <path d="M12 17.25V19.5" />
                    <path d="M4.5 12h2.25" />
                    <path d="M17.25 12h2.25" />
                  </svg>
                </div>
                <div class="space-y-2 flex-1">
                  <h2 class="text-2xl font-bold">¿Sigues con dudas?</h2>
                  <p class="text-primary-content/80">
                    Nuestro equipo puede revisar logs, datos contables o ayudarte a cerrar períodos complejos.
                  </p>
                </div>
                <button class="btn btn-white text-primary border-none hover:bg-base-100">Contactar soporte</button>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-down {
      animation: fadeInDown 600ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    
    .hero-section {
      position: relative;
      overflow: hidden;
    }
    
    .hero-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(var(--p) / 0.03) 0%, transparent 50%);
      pointer-events: none;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in-down {
        animation: none;
      }
    }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 20px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CentroAyuda implements OnInit, OnDestroy {
  searchQuery = signal('');
  activeSection = signal('introduccion');
  private observer?: IntersectionObserver;
  private readonly sanitizer = inject(DomSanitizer);

  readonly icons: Record<IconName, SafeHtml> = {
    introduccion: this.icon(`
      <circle cx="12" cy="12" r="7.5"></circle>
      <path d="M12 10.5v4.5"></path>
      <path d="M12 7.5h.01"></path>
    `),
    dashboard: this.icon(`
      <path d="M6 18.75V10.5"></path>
      <path d="M12 18.75V5.25"></path>
      <path d="M18 18.75v-6"></path>
      <path d="M3.75 18.75h16.5"></path>
    `),
    maquinas: this.icon(`
      <path d="M3.75 14.25h8.25V7.5A1.5 1.5 0 0 1 13.5 6h2.25l3 3v5.25H18"></path>
      <path d="M12 14.25h3.75"></path>
      <circle cx="7.5" cy="17.25" r="1.5"></circle>
      <circle cx="17.25" cy="17.25" r="1.5"></circle>
    `),
    choferes: this.icon(`
      <path d="M5.25 18.75v-1.5a4.5 4.5 0 0 1 4.5-4.5h4.5a4.5 4.5 0 0 1 4.5 4.5v1.5"></path>
      <circle cx="12" cy="9.75" r="3.25"></circle>
    `),
    'registro-diario': this.icon(`
      <path d="M9 5.25h6a1.5 1.5 0 0 1 1.5 1.5v11.25a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5V6.75A1.5 1.5 0 0 1 9 5.25z"></path>
      <path d="M9 8.25h6"></path>
      <path d="M9 11.25h6"></path>
      <path d="M9 14.25h4"></path>
    `),
    contabilidad: this.icon(`
      <rect x="5.25" y="8.25" width="13.5" height="9.75" rx="1"></rect>
      <circle cx="12" cy="13.125" r="2.25"></circle>
      <path d="M12 10.875v4.5"></path>
      <path d="M5.25 11.25h2.25"></path>
      <path d="M16.5 15h2.25"></path>
    `),
    reportes: this.icon(`
      <path d="M5.25 14.25l4.5-4.5 3 3 4.5-6"></path>
      <path d="M4.5 18.75h15"></path>
    `),
    configuracion: this.icon(`
      <circle cx="12" cy="12" r="5"></circle>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M12 4.5v1.5"></path>
      <path d="M12 18v1.5"></path>
      <path d="M6.6 6.6l1.05 1.05"></path>
      <path d="M16.35 16.35l1.05 1.05"></path>
      <path d="M4.5 12h1.5"></path>
      <path d="M18 12h1.5"></path>
    `),
    faq: this.icon(`
      <circle cx="12" cy="12" r="7.5"></circle>
      <path d="M9.75 10.125a2.25 2.25 0 1 1 4.5 0c0 1.5-2.25 2.25-2.25 3.375v.375"></path>
      <path d="M12 16.5h.01"></path>
    `)
  };

  readonly navItems = signal<HelpNavItem[]>([
    { id: 'introduccion', title: 'Introducción', icon: 'introduccion', description: 'Conceptos y roles' },
    { id: 'dashboard', title: 'Panel Principal', icon: 'dashboard', description: 'KPIs, alertas, registros' },
    { id: 'registro-diario', title: 'Registros Diarios', icon: 'registro-diario', description: 'Bitácora operativa' },
    { id: 'maquinas', title: 'Flota de Vehículos', icon: 'maquinas', description: 'Estados, documentos, filtros' },
    { id: 'choferes', title: 'Conductores', icon: 'choferes', description: 'Datos, licencias, desempeño' },
    { id: 'contabilidad', title: 'Finanzas y Nómina', icon: 'contabilidad', description: 'KPIs financieros, nómina' },
    { id: 'reportes', title: 'Análisis y Reportes', icon: 'reportes', description: 'Insights y exportaciones' },
    { id: 'configuracion', title: 'Configuración', icon: 'configuracion', description: 'Parámetros y alertas' },
    { id: 'faq', title: 'FAQ', icon: 'faq', description: 'Problemas comunes' }
  ]);

  readonly sections = signal<HelpModule[]>([
    {
      id: 'introduccion',
      title: 'Introducción',
      icon: 'introduccion',
      description: 'Conoce los roles y el recorrido general de la plataforma.',
      highlights: [
        { title: 'Perfil Administrador', body: 'Todo el control: registra máquinas, gestiona choferes, revisa finanzas y configura alertas.' },
        { title: 'Perfil Trabajador', body: 'Experiencia pensada para el día a día: reportar trabajos, adjuntar gastos y revisar tu historial personal desde el móvil.' }
      ],
      list: [
        '<strong>Barra lateral inteligente:</strong> Los accesos están organizados por áreas (Administración, Gestión de Flota, Finanzas). Usa el botón de colapsar si necesitas más espacio.',
        '<strong>Diseño responsivo:</strong> En escritorio tienes la vista completa; en tablets y móviles los tableros se transforman en tarjetas fáciles de leer.',
        '<strong>Flujo recomendado:</strong> Revisa el Panel Principal → atiende alertas → registra/valida operaciones → cierra el período contable.'
      ]
    },
    {
      id: 'dashboard',
      title: 'Panel Principal',
      icon: 'dashboard',
      description: 'Tu panel de control diario.',
      context: 'Ideal para comenzar la jornada: te muestra ingresos, gastos, alertas y registros recientes en segundos.',
      highlights: [
        { title: 'KPIs principales', body: 'Ganancia neta, ingreso total, horas trabajadas y estado documental en un solo vistazo.' },
        { title: 'Centro de alertas', body: 'Colores tipo semáforo: rojo = urgente, amarillo = revisa hoy, verde = todo al día.' }
      ],
      list: [
        'Los KPIs muestran información resumida del estado actual. Son informativos y te ayudan a tener una vista rápida de la operación.',
        'Usa las tarjetas de registros diarios para abrir rápidamente el detalle y corregir datos si hace falta.',
        'Tip operativo: revisa el Panel Principal a primera hora. Resolver alertas aquí evita sorpresas al cerrar el mes.'
      ]
    },
    {
      id: 'registro-diario',
      title: 'Registros Diarios',
      icon: 'registro-diario',
      description: 'Bitácora del día a día (combustible, horas y cobros).',
      context: 'Disponible para choferes y administradores. En móvil se abre en "modo enfoque" para escribir rápido.',
      steps: [
        { title: 'Seleccionar la máquina asignada' },
        { title: 'Seleccionar la fecha del reporte' },
        { title: 'Ingresar los datos operativos del día' },
        { title: 'Adjuntar la imagen del comprobante' },
        { title: 'Confirmar los montos registrados' }
      ],
      list: [
        'Si te equivocaste en un dato, vuelve a la tarjeta y edítalo; los administradores pueden revisar todas las jornadas.',
        'Los campos de dinero muestran el símbolo $ y están alineados para que comparar sea más fácil.',
        'El historial del trabajador se presenta como un panel con filtros por meses para que identifique rápidamente jornadas pendientes o en revisión.'
      ]
    },
    {
      id: 'maquinas',
      title: 'Flota de Vehículos',
      icon: 'maquinas',
      description: 'Estado de la flota, documentos y mantenimientos.',
      highlights: [
        { title: 'Tarjetas detalladas', body: 'Cada máquina muestra su chofer asignado, estado operativo y documentos próximos a vencer.' },
        { title: 'Filtros rápidos', body: 'Filtra por estado (operativa, en taller, inactiva) o por tipo de alerta documental.' }
      ],
      list: [
        'Al abrir una máquina verás su historial de trabajos y mantenimientos. Usa las acciones rápidas para crear un servicio o actualizar datos.',
        'Si un documento está por vencer, el sistema lo marca en ámbar y sugiere la acción necesaria.',
        'En móviles, desliza horizontalmente para acceder a todos los filtros sin perder el listado.'
      ]
    },
    {
      id: 'choferes',
      title: 'Gestión de Conductores',
      icon: 'choferes',
      description: 'Información personal y desempeño de cada operador.',
      highlights: [
        { title: 'Ficha resumida', body: 'Incluye datos de contacto, licencias, certificaciones y máquinas que puede operar.' },
        { title: 'Historial completo', body: 'Revisa todos los registros diarios y el historial de liquidaciones del conductor en un solo lugar.' }
      ],
      list: [
        'Para agregar un chofer necesitarás sus datos básicos, licencia y máquinas habilitadas. El sistema te guía paso a paso.',
        'Mantén actualizadas las licencias: el panel te avisará cuando estén por vencer.',
        'Desde aquí podrás asignar credenciales para que el chofer registre sus reportes diarios.'
      ]
    },
    {
      id: 'contabilidad',
      title: 'Finanzas y Nómina',
      icon: 'contabilidad',
      description: 'Todo lo relacionado con ingresos, gastos y liquidaciones.',
      context: 'Organizado en pestañas: Resumen general, Semanal, Liquidación de choferes e Historial.',
      highlights: [
        { title: 'Tabs intuitivas', body: 'Cada pestaña tiene un propósito claro y puedes alternar sin perder los filtros seleccionados.' },
        { title: 'Botón Confirmar', body: 'Cuando un chofer tiene pago pendiente verás el botón "Confirmar" en modo outline (ligero).' }
      ],
      list: [
        'Resumen general: revisa los KPIs y el gráfico de tendencia antes de tomar decisiones.',
        'Liquidación: edita montos faltantes y confirma pagos.',
        'Historial de cierres: cada período cerrado aparece como “recibo” con la información clave y acciones de exportación.'
      ]
    },
    {
      id: 'reportes',
      title: 'Análisis y Reportes',
      icon: 'reportes',
      description: 'Análisis visual para entender la rentabilidad.',
      context: 'Incluye rentabilidad por máquina, ranking de ingresos y rentabilidad por chofer.',
      highlights: [
        { title: 'Tablas legibles', body: 'Columnas importantes (ganancia neta) se resaltan con un fondo suave y números alineados a la derecha.' },
        { title: 'Rankings comparativos', body: 'Compara el rendimiento de máquinas e ingresos brutos, y analiza la rentabilidad por conductor para tomar decisiones estratégicas.' }
      ],
      list: [
        'Los gráficos se adaptan al ancho disponible y limitan la cantidad de etiquetas para que siempre puedas leerlos.',
        'En cada tabla encontrarás el ranking, el identificador (máquina o chofer) y los montos relevantes.',
        'Usa el botón “Exportar” para compartir la información en PDF o Excel con tu equipo financiero.'
      ]
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      icon: 'configuracion',
      description: 'Personaliza la plataforma según tu empresa.',
      highlights: [
        { title: 'Perfil de la compañía', body: 'Actualiza nombre, logo y datos de contacto que aparecerán en el encabezado y reportes.' },
        { title: 'Alertas y notificaciones', body: 'Enciende o apaga recordatorios de documentos, mantenimientos o avisos contables.' }
      ],
      list: [
        'Solo los administradores pueden modificar esta sección.',
        'Los cambios se aplican inmediatamente y afectan a todos los usuarios.',
        'Revisa esta sección al menos una vez al trimestre para asegurarte de que los datos estén actualizados.'
      ]
    }
  ]);

  readonly faqs = signal<FaqItem[]>([
    {
      question: '¿Cómo recupero mi contraseña?',
      answer: 'En la pantalla de login selecciona “¿Olvidaste tu contraseña?”. Ingresa tu correo registrado y recibirás un enlace seguro para restablecerla.'
    },
    {
      question: '¿Qué hago si un registro diario queda incompleto?',
      answer: 'Los administradores pueden editar cualquier jornada desde el módulo correspondiente. Para choferes, solicita la corrección a tu administrador.'
    },
    {
      question: '¿La información contable se puede exportar?',
      answer: 'Sí. Cada tab de contabilidad y reportes incluye botón “Exportar” con opciones CSV, XLSX o PDF siguiendo la configuración de Chart.js/Tablas.'
    },
    {
      question: '¿Puedo usar la app sin conexión?',
      answer: 'La sincronización es en tiempo real, por lo que se requiere conexión. Si pierdes señal, guarda un borrador local y envíalo cuando vuelvas a tener internet.'
    },
    {
      question: '¿Cómo contacto soporte?',
      answer: 'Utiliza el CTA “Contactar soporte” al final de esta página o escribe al correo corporativo con capturas y pasos para reproducir el problema.'
    }
  ]);

  readonly filteredNav = computed(() => {
    const term = this.searchQuery().trim().toLowerCase();
    if (!term) {
      return [];
    }

    return this.navItems()
      .filter(item => `${item.title} ${item.description}`.toLowerCase().includes(term))
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  scrollToSection(id: string, clearSearch = false): void {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection.set(id);

    if (clearSearch) {
      this.searchQuery.set('');
    }
  }

  private setupIntersectionObserver(): void {
    const targets = [...this.sections().map(section => section.id), 'faq'];

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) {
              this.activeSection.set(id);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      }
    );

    setTimeout(() => {
      targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          this.observer?.observe(el);
        }
      });
    }, 200);
  }

  private icon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}

