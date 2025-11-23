import { Component, ChangeDetectionStrategy, signal, OnInit, inject, effect } from '@angular/core';
import { HelpMenu, HelpMenuItem } from '../../shared/help/help-menu/help-menu';
import { HelpSection } from '../../shared/help/help-section/help-section';

@Component({
  selector: 'app-centro-ayuda',
  imports: [HelpMenu, HelpSection],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold mb-2">Centro de Ayuda</h1>
        <p class="text-base-content/70">
          Manual completo de uso de la plataforma de gestión de flotas
        </p>
      </div>

      <!-- Layout: Menú y Contenido -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Menú Lateral (1 columna) -->
        <div class="lg:col-span-1">
          <app-help-menu
            [items]="menuItems()"
            [activeSection]="activeSection()"
            (itemClick)="onMenuClick($event)" />
        </div>

        <!-- Contenido (3 columnas) -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <!-- Introducción -->
              <app-help-section
                id="introduccion"
                title="Introducción"
                [text]="'Bienvenido al sistema de gestión de flotas. Esta plataforma ha sido diseñada para facilitar el control integral de tu flota, desde el registro diario de operaciones hasta el análisis financiero detallado.'"
                [listItems]="[
                  '<strong>Administrador:</strong> Acceso completo a todas las funcionalidades, incluyendo gestión de máquinas, choferes, contabilidad y reportes.',
                  '<strong>Trabajador:</strong> Acceso limitado para registrar reportes diarios de trabajo y consultar su historial.'
                ]"
                [tip]="{ title: 'Consejo', text: 'Familiarízate con el menú lateral de navegación. Puedes acceder rápidamente a cualquier módulo desde cualquier pantalla.' }" />

              <!-- Dashboard -->
              <app-help-section
                id="dashboard"
                title="Dashboard"
                [text]="'El Dashboard es tu centro de control principal. Aquí encontrarás un resumen en tiempo real del estado de tu flota.'"
                subtitle="Elementos del Dashboard"
                [listItems]="[
                  '<strong>KPIs Principales:</strong> Ingresos mensuales, ganancias netas, alertas activas y horas trabajadas.',
                  '<strong>Gráfico de Ingresos:</strong> Visualización mensual con filtros por período y tipo de visualización.',
                  '<strong>Estado de Máquinas:</strong> Resumen rápido del estado operativo de cada máquina.',
                  '<strong>Alertas y Notificaciones:</strong> Avisos importantes sobre mantenimientos, documentos vencidos o problemas operativos.'
                ]"
                [tip]="{ title: 'Tip de Productividad', text: 'Revisa el Dashboard cada mañana para detectar rápidamente cualquier anomalía o tarea pendiente urgente.' }" />

              <!-- Máquinas -->
              <app-help-section
                id="maquinas"
                title="Gestión de Máquinas"
                [text]="'El módulo de máquinas te permite administrar toda la información de tu flota de maquinaria pesada.'"
                [subtitle]="'Registrar una Nueva Máquina'"
                [steps]="[
                  { number: 1, title: 'Accede al Listado de Máquinas', text: 'Haz clic en Máquinas en el menú lateral y luego en el botón Agregar Máquina.' },
                  { number: 2, title: 'Completa la Información Básica', text: 'Ingresa el número de máquina, tipo (camión, grúa, excavadora, etc.), marca, modelo y año de fabricación.' },
                  { number: 3, title: 'Configura la Información Técnica', text: 'Define la capacidad de carga, consumo promedio de combustible y otras especificaciones técnicas relevantes.' },
                  { number: 4, title: 'Registra Documentación', text: 'Ingresa fechas de vencimiento para revisión técnica, seguro, permisos de circulación y otros documentos requeridos.' },
                  { number: 5, title: 'Guarda y Confirma', text: 'Revisa toda la información y haz clic en Guardar Máquina para completar el registro.' }
                ]"
                [subtitle2]="'Ver Detalles de una Máquina'"
                [listItems]="[
                  '<strong>Información General:</strong> Datos técnicos y documentación.',
                  '<strong>Historial de Trabajo:</strong> Registro completo de operaciones realizadas.',
                  '<strong>Choferes Asignados:</strong> Listado de operadores habilitados.',
                  '<strong>Estadísticas:</strong> Rendimiento, consumo de combustible y rentabilidad.'
                ]"
                [warning]="{ title: 'Importante', text: 'El sistema generará alertas automáticas cuando los documentos estén próximos a vencer. Mantén siempre actualizada la información de vencimientos.' }" />

              <!-- Choferes -->
              <app-help-section
                id="choferes"
                title="Gestión de Choferes"
                [text]="'Administra la información de todos los operadores de tu flota, incluyendo sus credenciales, asignaciones y desempeño.'"
                [subtitle]="'Registrar un Nuevo Chofer'"
                [steps]="[
                  { number: 1, title: 'Ir al Módulo de Choferes', text: 'Accede desde el menú lateral y selecciona Agregar Chofer.' },
                  { number: 2, title: 'Datos Personales', text: 'Completa nombre completo, RUT, fecha de nacimiento y datos de contacto (teléfono, email, dirección).' },
                  { number: 3, title: 'Información Profesional', text: 'Registra tipo de licencia de conducir, número de licencia y fecha de vencimiento. Indica las especialidades o certificaciones adicionales.' },
                  { number: 4, title: 'Asignación de Máquinas', text: 'Selecciona las máquinas que el chofer está autorizado a operar.' },
                  { number: 5, title: 'Configuración de Acceso', text: 'Crea credenciales de acceso al sistema para que el chofer pueda registrar sus reportes diarios.' }
                ]"
                [subtitle2]="'Gestionar Desempeño'"
                [listItems]="[
                  'Historial completo de trabajos realizados',
                  'Estadísticas de horas trabajadas y rentabilidad generada',
                  'Evaluaciones y observaciones de desempeño',
                  'Estado de documentación (licencias, certificados)'
                ]"
                [warning]="{ title: 'Importante', text: 'Verifica regularmente el vencimiento de licencias de conducir. El sistema bloqueará la asignación de trabajos a choferes con documentación vencida.' }" />

              <!-- Registro Diario -->
              <app-help-section
                id="registro-diario"
                title="Registro Diario de Operaciones"
                [text]="'El registro diario es fundamental para el control operativo y contable. Permite documentar cada jornada de trabajo de manera detallada.'"
                [subtitle]="'Cómo Registrar un Día de Trabajo'"
                [steps]="[
                  { number: 1, title: 'Seleccionar Fecha y Máquina', text: 'Elige la fecha del trabajo (por defecto aparece el día actual) y selecciona la máquina utilizada.' },
                  { number: 2, title: 'Datos del Trabajo', text: 'Ingresa el lugar de trabajo, cliente, tipo de labor realizada y descripción detallada de las actividades.' },
                  { number: 3, title: 'Horarios', text: 'Registra hora de inicio y hora de término. El sistema calculará automáticamente las horas trabajadas.' },
                  { number: 4, title: 'Combustible', text: 'Anota la cantidad de litros de combustible consumidos y el costo total. Opcionalmente adjunta el comprobante de carga.' },
                  { number: 5, title: 'Información Financiera', text: 'Indica el monto cobrado al cliente y el pago correspondiente al chofer (si aplica).' },
                  { number: 6, title: 'Observaciones y Guardar', text: 'Añade cualquier comentario relevante (incidentes, mantenimientos necesarios, etc.) y guarda el registro.' }
                ]"
                [tip]="{ title: 'Buena Práctica', text: 'Registra cada jornada el mismo día del trabajo. Esto garantiza la precisión de los datos y facilita la gestión contable posterior.' }" />

              <!-- Contabilidad -->
              <app-help-section
                id="contabilidad"
                title="Contabilidad"
                [text]="'El módulo de contabilidad centraliza toda la información financiera de tu operación, permitiéndote tomar decisiones basadas en datos reales.'"
                [subtitle]="'Funcionalidades Principales'"
                [listItems]="[
                  '<strong>Registro de Ingresos:</strong> Control detallado de todas las facturaciones por trabajos realizados.',
                  '<strong>Control de Gastos:</strong> Combustible, mantenimientos, salarios, seguros y otros gastos operativos.',
                  '<strong>Flujo de Caja:</strong> Visualización del movimiento de efectivo en tiempo real.',
                  '<strong>Balance por Período:</strong> Resúmenes mensuales, trimestrales o anuales de ingresos vs. gastos.',
                  '<strong>Exportación de Datos:</strong> Descarga información contable en formato Excel o PDF para tu contador.'
                ]"
                [subtitle2]="'Categorías de Gastos'"
                [listItems2]="[
                  'Combustible',
                  'Mantenimientos y reparaciones',
                  'Salarios y pagos a choferes',
                  'Seguros y permisos',
                  'Gastos administrativos',
                  'Otros gastos operacionales'
                ]"
                [warning]="{ title: 'Importante', text: 'Los registros contables son acumulativos. Verifica siempre la fecha correcta antes de ingresar movimientos para evitar inconsistencias en los reportes.' }" />

              <!-- Reportes -->
              <app-help-section
                id="reportes"
                title="Centro de Reportes y Análisis"
                [text]="'El Centro de Reportes te proporciona análisis visuales y numéricos del desempeño de tu flota, facilitando la toma de decisiones estratégicas.'"
                [subtitle]="'Reportes Disponibles'"
                [steps]="[
                  { number: 1, title: 'Rentabilidad por Máquina', text: 'Analiza qué máquinas generan mayor ganancia neta considerando ingresos totales menos gastos de operación (combustible, pagos a choferes, etc.). Este reporte incluye gráfico de barras horizontales y tabla detallada con ranking.' },
                  { number: 2, title: 'Ranking de Ingresos (Bruto)', text: 'Visualiza qué máquinas generan mayores ingresos brutos, sin considerar gastos. Útil para identificar las unidades más demandadas por los clientes.' },
                  { number: 3, title: 'Rentabilidad por Chofer', text: 'Evalúa el desempeño financiero de cada operador, comparando los ingresos que genera versus los costos asociados (pago al chofer, combustible consumido).' }
                ]"
                [subtitle2]="'Exportar Reportes'"
                [listItems]="[
                  '<strong>XLSX (Excel):</strong> Ideal para análisis posterior o integración con otras herramientas.',
                  '<strong>CSV:</strong> Formato simple compatible con cualquier hoja de cálculo.',
                  '<strong>PDF:</strong> Perfecto para imprimir o compartir presentaciones.'
                ]"
                [text2]="'Para exportar, haz clic en el botón Exportar y selecciona el formato deseado del menú desplegable.'"
                [tip]="{ title: 'Análisis Estratégico', text: 'Revisa los reportes mensualmente para identificar tendencias. Una máquina con alto ingreso pero baja rentabilidad puede indicar costos operativos excesivos que requieren atención.' }" />

              <!-- Configuración -->
              <app-help-section
                id="configuracion"
                title="Configuración del Sistema"
                [text]="'En el módulo de configuración puedes personalizar diversos aspectos de la plataforma según las necesidades de tu negocio.'"
                [subtitle]="'Opciones de Configuración'"
                [listItems]="[
                  '<strong>Perfil de Empresa:</strong> Nombre, logo, datos de contacto y configuración regional (moneda, formato de fecha).',
                  '<strong>Usuarios y Permisos:</strong> Administrar cuentas de acceso, roles y niveles de autorización.',
                  '<strong>Notificaciones:</strong> Configura alertas automáticas por email o SMS para vencimientos, mantenimientos programados, etc.',
                  '<strong>Parámetros Contables:</strong> Categorías de gastos personalizadas, centros de costo, tasas de impuestos.',
                  '<strong>Integraciones:</strong> Conexión con sistemas externos de facturación, contabilidad o GPS.'
                ]"
                [warning]="{ title: 'Solo Administradores', text: 'Las opciones de configuración solo están disponibles para usuarios con rol de Administrador. Los cambios afectan a todo el sistema.' }" />

              <!-- FAQ -->
              <app-help-section
                id="faq"
                title="Preguntas Frecuentes (FAQ)"
                [steps]="[
                  { number: 1, title: '¿Cómo recupero mi contraseña?', text: 'En la pantalla de login, haz clic en ¿Olvidaste tu contraseña?. Ingresa tu email registrado y recibirás instrucciones para crear una nueva contraseña.' },
                  { number: 2, title: '¿Puedo editar un registro después de guardarlo?', text: 'Sí, los usuarios administradores pueden editar cualquier registro. Accede al detalle del elemento (máquina, chofer, registro diario) y haz clic en el botón Editar.' },
                  { number: 3, title: '¿Los datos se respaldan automáticamente?', text: 'Sí, el sistema realiza respaldos automáticos diarios. Adicionalmente, puedes exportar manualmente toda tu información desde el módulo de Configuración.' },
                  { number: 4, title: '¿Puedo usar el sistema desde mi celular?', text: 'Sí, la plataforma está optimizada para dispositivos móviles. Los choferes pueden registrar sus reportes diarios directamente desde sus smartphones.' },
                  { number: 5, title: '¿Cuántos usuarios puedo crear?', text: 'No hay límite. Puedes crear cuentas para todos tus choferes y personal administrativo que requiera acceso al sistema.' },
                  { number: 6, title: '¿Qué hago si detecto un error en los datos?', text: 'Contacta inmediatamente al soporte técnico a través del email de contacto o el formulario disponible en esta sección. Incluye capturas de pantalla y descripción detallada del problema.' },
                  { number: 7, title: '¿Puedo eliminar registros?', text: 'Los administradores pueden eliminar registros, pero esta acción es irreversible. El sistema solicitará confirmación antes de proceder. Recomendamos editar en lugar de eliminar siempre que sea posible.' }
                ]"
                [tip]="{ title: '¿Necesitas más ayuda?', text: 'Si tienes dudas que no están cubiertas en este manual, no dudes en contactar a nuestro equipo de soporte. Estamos aquí para ayudarte a aprovechar al máximo la plataforma.' }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CentroAyuda implements OnInit {
  activeSection = signal<string>('introduccion');

  menuItems = signal<HelpMenuItem[]>([
    { id: 'introduccion', label: 'Introducción' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'maquinas', label: 'Gestión de Máquinas' },
    { id: 'choferes', label: 'Gestión de Choferes' },
    { id: 'registro-diario', label: 'Registro Diario' },
    { id: 'contabilidad', label: 'Contabilidad' },
    { id: 'reportes', label: 'Centro de Reportes' },
    { id: 'configuracion', label: 'Configuración' },
    { id: 'faq', label: 'Preguntas Frecuentes' }
  ]);

  ngOnInit(): void {
    // Configurar Intersection Observer para detectar sección visible
    this.setupIntersectionObserver();
  }

  onMenuClick(id: string): void {
    this.activeSection.set(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -20;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  private setupIntersectionObserver(): void {
    const sections = document.querySelectorAll('[id^="introduccion"], [id^="dashboard"], [id^="maquinas"], [id^="choferes"], [id^="registro-diario"], [id^="contabilidad"], [id^="reportes"], [id^="configuracion"], [id^="faq"]');
    
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) {
            this.activeSection.set(id);
          }
        }
      });
    }, observerOptions);

    // Esperar a que el DOM esté listo
    setTimeout(() => {
      sections.forEach(section => observer.observe(section));
    }, 100);
  }
}
