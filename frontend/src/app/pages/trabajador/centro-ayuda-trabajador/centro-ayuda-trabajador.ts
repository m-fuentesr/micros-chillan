import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type IconName =
  | 'introduccion'
  | 'reporte-diario'
  | 'mi-historial'
  | 'perfil'
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
  selector: 'app-centro-ayuda-trabajador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 pb-16">
      <!-- Hero -->
      <div class="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-0 pb-12 px-6 mb-10 shadow-lg rounded-3xl overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full opacity-10 rounded-3xl overflow-hidden pointer-events-none" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;"></div>
        <div class="relative max-w-4xl mx-auto text-left page-entry-header space-y-6 pl-4 border-l-4 border-l-white/30" [style.padding-top]="'calc(48px + env(safe-area-inset-top, 0px))'">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.4em] text-blue-200 mb-3">Centro de Ayuda</p>
            <h1 class="text-3xl lg:text-4xl font-black tracking-tight">
              ¿Cómo podemos ayudarte?
            </h1>
            <p class="text-blue-100 text-base italic mt-3">
              Guías y respuestas para usar la aplicación de reportes diarios.
            </p>
          </div>

          <div class="relative max-w-xl mx-auto group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white/60 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              class="input input-lg w-full pl-12 pr-4 rounded-2xl bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Buscar temas, ej: 'Crear reporte', 'Subir imagen', 'Historial'..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>

          @if (searchQuery().trim()) {
            <div class="max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left animate-card-enter">
              <p class="text-xs font-bold text-white/80 uppercase tracking-widest mb-3">Resultados sugeridos</p>
              <ul class="space-y-2">
                @for (item of filteredNav(); track item.id) {
                  <li>
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-sm text-white"
                      (click)="scrollToSection(item.id, true)"
                    >
                      <svg
                        class="w-5 h-5 text-white"
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
                        <p class="text-xs text-white/70 truncate">{{ item.description }}</p>
                      </div>
                    </button>
                  </li>
                }
                @if (filteredNav().length === 0) {
                  <li class="text-sm text-white/80 italic">No encontramos resultados para "{{ searchQuery() }}".</li>
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
              <p class="px-3 text-xs font-bold text-slate-400 uppercase tracking-[0.35em]">Contenido</p>
              @for (item of navItems(); track item.id) {
                <button
                  type="button"
                  class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all duration-200 border border-transparent"
                  (click)="scrollToSection(item.id)"
                  [class.bg-primary]="activeSection() === item.id"
                  [class.text-primary-content]="activeSection() === item.id"
                  [class.shadow-lg]="activeSection() === item.id"
                  [class.hover:bg-slate-200]="activeSection() !== item.id"
                  [class.bg-white]="activeSection() !== item.id"
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
                class="scroll-mt-28 animate-card-enter bg-white border border-slate-200 shadow-sm rounded-3xl"
              >
                <div class="card-body space-y-6">
                  <header class="flex flex-col gap-3">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
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
                        <p class="text-slate-600 text-sm">{{ section.description }}</p>
                      </div>
                    </div>
                    @if (section.context) {
                      <div class="alert alert-info bg-blue-50 border-blue-200 text-sm text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-blue-600 shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div>{{ section.context }}</div>
                      </div>
                    }
                  </header>

                  @if (section.highlights?.length) {
                    <div class="grid sm:grid-cols-2 gap-4">
                      @for (item of section.highlights; track item.title) {
                        <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                          <h3 class="font-bold mb-1">{{ item.title }}</h3>
                          <p class="text-sm text-slate-600">{{ item.body }}</p>
                        </div>
                      }
                    </div>
                  }

                  @if (section.list?.length) {
                    <div class="space-y-2">
                      <h3 class="text-sm uppercase tracking-widest text-slate-500 font-bold">Elementos clave</h3>
                      <ul class="list-disc list-outside pl-6 text-sm text-slate-700 space-y-2">
                        @for (item of section.list; track item) {
                          <li [innerHTML]="item"></li>
                        }
                      </ul>
                    </div>
                  }

                  @if (section.steps?.length) {
                    <div class="space-y-4">
                      <h3 class="text-sm uppercase tracking-widest text-slate-500 font-bold">Pasos a seguir</h3>
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
              <div class="card bg-white border border-slate-200 shadow-sm rounded-3xl">
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
                      <p class="text-sm text-slate-600">Respuestas rápidas a dudas comunes.</p>
                    </div>
                  </div>

                  <div class="space-y-2">
                    @for (faq of faqs(); track faq.question) {
                      <div class="collapse collapse-arrow bg-white border border-slate-200 shadow-sm">
                        <input type="radio" name="faq-accordion" /> 
                        <div class="collapse-title text-base font-bold">
                          {{ faq.question }}
                        </div>
                        <div class="collapse-content text-slate-600 text-sm leading-relaxed">
                          <p>{{ faq.answer }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </section>

            <!-- CTA Soporte -->
            <section class="card bg-primary text-white shadow-xl rounded-3xl animate-card-enter-delay-3">
              <div class="card-body flex flex-col md:flex-row md:items-center gap-6">
                <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white">
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
                  <p class="text-white/80">
                    Si necesitas ayuda adicional, contacta a tu supervisor o al equipo de soporte.
                  </p>
                </div>
                <a routerLink="/trabajador" class="btn bg-white text-primary border-none hover:bg-slate-100">Volver al inicio</a>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 20px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CentroAyudaTrabajador implements OnInit, OnDestroy {
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
    'reporte-diario': this.icon(`
      <path d="M9 5.25h6a1.5 1.5 0 0 1 1.5 1.5v11.25a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5V6.75A1.5 1.5 0 0 1 9 5.25z"></path>
      <path d="M9 8.25h6"></path>
      <path d="M9 11.25h6"></path>
      <path d="M9 14.25h4"></path>
    `),
    'mi-historial': this.icon(`
      <path d="M3.75 5.25h16.5M3.75 9h16.5m-16.5 3.75h16.5M3.75 16.5h16.5"></path>
    `),
    perfil: this.icon(`
      <path d="M5.25 18.75v-1.5a4.5 4.5 0 0 1 4.5-4.5h4.5a4.5 4.5 0 0 1 4.5 4.5v1.5"></path>
      <circle cx="12" cy="9.75" r="3.25"></circle>
    `),
    faq: this.icon(`
      <circle cx="12" cy="12" r="7.5"></circle>
      <path d="M9.75 10.125a2.25 2.25 0 1 1 4.5 0c0 1.5-2.25 2.25-2.25 3.375v.375"></path>
      <path d="M12 16.5h.01"></path>
    `)
  };

  readonly navItems = signal<HelpNavItem[]>([
    { id: 'introduccion', title: 'Introducción', icon: 'introduccion', description: 'Bienvenida y conceptos básicos' },
    { id: 'reporte-diario', title: 'Crear Reporte Diario', icon: 'reporte-diario', description: 'Cómo enviar tu reporte del día' },
    { id: 'mi-historial', title: 'Mi Historial', icon: 'mi-historial', description: 'Revisar reportes anteriores' },
    { id: 'perfil', title: 'Mi Perfil', icon: 'perfil', description: 'Información personal y estadísticas' },
    { id: 'faq', title: 'Preguntas Frecuentes', icon: 'faq', description: 'Respuestas rápidas' }
  ]);

  readonly sections = signal<HelpModule[]>([
    {
      id: 'introduccion',
      title: 'Bienvenido a la Aplicación',
      icon: 'introduccion',
      description: 'Aprende a usar la aplicación para reportar tu trabajo diario.',
      highlights: [
        { 
          title: 'Reporte Diario', 
          body: 'Registra tu trabajo del día: monto recaudado, combustible y observaciones importantes.' 
        },
        { 
          title: 'Historial Personal', 
          body: 'Revisa todos tus reportes anteriores y verifica su estado de validación.' 
        }
      ],
      list: [
        '<strong>Panel Principal:</strong> Al iniciar sesión verás si debes crear un reporte del día o si ya lo enviaste.',
        '<strong>Diseño Móvil:</strong> La aplicación está optimizada para usar desde tu teléfono, perfecta para reportar al final del día.',
        '<strong>Flujo Recomendado:</strong> Revisa tu panel → Crea reporte diario → Sube comprobantes → Envía y confirma.'
      ]
    },
    {
      id: 'reporte-diario',
      title: 'Crear Reporte Diario',
      icon: 'reporte-diario',
      description: 'Guía paso a paso para enviar tu reporte del día.',
      context: 'Debes crear un reporte cada día que trabajes. Solo puedes crear uno por día.',
      steps: [
        { title: 'Selecciona tu máquina asignada' },
        { title: 'Ingresa el monto total recaudado' },
        { title: 'Registra combustible (opcional)' },
        { title: 'Toma foto del comprobante' },
        { title: 'Agrega observaciones si es necesario' },
        { title: 'Marca como incidente si hay problema crítico' },
        { title: 'Envía el reporte' }
      ],
      highlights: [
        { 
          title: 'Monto Recaudado', 
          body: 'Ingresa el total del día en pesos chilenos. Este campo es obligatorio.' 
        },
        { 
          title: 'Combustible (Opcional)', 
          body: 'Si cargaste combustible, registra los litros y el costo total. También puedes subir foto del comprobante.' 
        },
        { 
          title: 'Foto del Comprobante', 
          body: 'Es obligatorio subir una foto del comprobante del día. Asegúrate de que se vea claro y completo.' 
        }
      ],
      list: [
        '<strong>Un reporte por día:</strong> Solo puedes crear un reporte por día. Si ya enviaste uno, verás un mensaje de confirmación.',
        '<strong>Horario:</strong> Puedes crear el reporte durante el día o al finalizar tu jornada. Después de las 12:00 AM podrás crear uno nuevo.',
        '<strong>Editar reporte:</strong> Una vez enviado, no puedes editarlo. Si necesitas corregir algo, contacta a tu supervisor.',
        '<strong>Incidentes críticos:</strong> Si ocurrió algo importante (accidente, avería, etc.), marca la casilla "Incidente crítico" y describe en observaciones.',
        '<strong>Imágenes:</strong> Las fotos deben ser claras y mostrar toda la información del comprobante. Formatos aceptados: JPG, PNG.'
      ]
    },
    {
      id: 'mi-historial',
      title: 'Mi Historial de Reportes',
      icon: 'mi-historial',
      description: 'Revisa todos los reportes que has enviado.',
      context: 'Puedes filtrar por mes o rango de fechas para encontrar reportes específicos.',
      highlights: [
        { 
          title: 'Vista de Línea de Tiempo', 
          body: 'Tus reportes se muestran ordenados por fecha, con el más reciente primero.' 
        },
        { 
          title: 'Estados de Reporte', 
          body: 'Cada reporte muestra su estado: Completo, Pendiente de validación, o Con incidente.' 
        }
      ],
      list: [
        '<strong>Filtros:</strong> Usa los filtros para ver reportes de un mes específico o un rango de fechas.',
        '<strong>Detalle:</strong> Haz clic en cualquier reporte para ver todos sus detalles: montos, combustible, observaciones e imágenes.',
        '<strong>Estadísticas:</strong> En tu perfil verás un resumen de días trabajados y total recaudado del mes actual.'
      ]
    },
    {
      id: 'perfil',
      title: 'Mi Perfil',
      icon: 'perfil',
      description: 'Información personal y estadísticas de tu trabajo.',
      highlights: [
        { 
          title: 'Datos Personales', 
          body: 'Revisa tu RUT, email y máquina asignada. Esta información es proporcionada por tu supervisor.' 
        },
        { 
          title: 'Estadísticas Mensuales', 
          body: 'Ve cuántos días trabajaste y cuánto recaudaste en el mes actual. Estos datos se actualizan automáticamente.' 
        }
      ],
      list: [
        '<strong>Información de Contacto:</strong> Tu email y teléfono están registrados para que tu supervisor pueda contactarte si es necesario.',
        '<strong>Máquina Asignada:</strong> Aquí verás qué máquina tienes asignada actualmente. Si cambia, se actualizará automáticamente.',
        '<strong>Estadísticas:</strong> Las estadísticas muestran solo el mes actual. Para ver datos de meses anteriores, revisa tu historial.'
      ]
    }
  ]);

  readonly faqs = signal<FaqItem[]>([
    {
      question: '¿Puedo crear más de un reporte por día?',
      answer: 'No, solo puedes crear un reporte por día. Si ya enviaste uno, verás un mensaje de confirmación en tu panel principal. Después de las 12:00 AM podrás crear uno nuevo para el siguiente día.'
    },
    {
      question: '¿Qué pasa si olvido subir la imagen del comprobante?',
      answer: 'La imagen del comprobante es obligatoria. Si no la subes, no podrás enviar el reporte. Asegúrate de tener una foto clara del comprobante antes de comenzar.'
    },
    {
      question: '¿Puedo editar un reporte después de enviarlo?',
      answer: 'No, una vez enviado el reporte no puedes editarlo. Si necesitas corregir algún dato, contacta a tu supervisor para que lo ajuste.'
    },
    {
      question: '¿Qué debo hacer si hay un incidente crítico?',
      answer: 'Marca la casilla "Incidente crítico" en el formulario de reporte y describe detalladamente qué ocurrió en el campo de observaciones. Esto alertará inmediatamente a tu supervisor.'
    },
    {
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Si olvidaste tu contraseña, en la pantalla de login selecciona "¿Olvidaste tu clave?" e ingresa tu correo. Recibirás un enlace para restablecerla. Para cambiar tu contraseña actual, contacta a tu supervisor.'
    },
    {
      question: '¿Qué formatos de imagen acepta la aplicación?',
      answer: 'La aplicación acepta imágenes en formato JPG y PNG. Asegúrate de que la foto sea clara y muestre toda la información del comprobante.'
    },
    {
      question: '¿Puedo usar la aplicación sin conexión a internet?',
      answer: 'No, necesitas conexión a internet para enviar reportes. Si pierdes la conexión, completa el formulario y envíalo cuando vuelvas a tener internet.'
    },
    {
      question: '¿Dónde veo mis estadísticas mensuales?',
      answer: 'En la sección "Mi Perfil" verás un resumen con los días trabajados y el total recaudado del mes actual. Para ver detalles de meses anteriores, revisa tu historial.'
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


