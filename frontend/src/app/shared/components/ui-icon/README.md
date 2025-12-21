# UiIcon Component - Guía de Uso

## Sistema de Iconografía V2.0 (Lucide Icons)

Componente wrapper centralizado para Lucide Icons con control completo de stroke, tamaño y accesibilidad.

## Sintaxis Básica

```html
<ui-icon name="BusFront" />
```

## Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `name` | `string` | **requerido** | Nombre del icono Lucide (debe estar registrado en `icons.provider.ts`) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Tamaño del icono |
| `variant` | `'outline' \| 'bold'` | `'outline'` | Variante de trazo |
| `class` | `string` | `''` | Clases CSS adicionales (Tailwind, etc.) |

## Tamaños Disponibles

| Size | Píxeles | Uso Recomendado |
|------|---------|-----------------|
| `xs` | 14px | Texto inline, badges pequeños |
| `sm` | 16px | Botones pequeños, inputs |
| `md` | 20px | **Default** - Estándar denso, tablas |
| `lg` | 24px | Navegación, acciones principales, touch targets |
| `xl` | 32px | Hero sections, headers grandes |

## Variantes de Stroke

### Outline (Default)
- **Desktop (>= 768px)**: 1.5px (elegancia SaaS B2B)
- **Mobile (< 768px)**: 2px (legibilidad en campo)
- **Tamaños xs/sm**: Siempre 2px

### Bold
- **Todas las pantallas**: 2.5px (énfasis máximo)

## Ejemplos de Uso

### Navegación

```html
<!-- Sidebar admin -->
<ui-icon name="LayoutDashboard" size="lg" class="text-primary" />

<!-- Navbar móvil -->
<ui-icon name="Home" size="lg" />
```

### Botones y Acciones

```html
<!-- Botón primario -->
<button class="btn btn-primary">
  <ui-icon name="CirclePlus" size="md" />
  Nuevo Registro
</button>

<!-- Botón de eliminación -->
<button class="btn btn-error">
  <ui-icon name="Trash2" size="sm" class="text-error" />
</button>

<!-- Botón FAB (móvil) -->
<button class="fab">
  <ui-icon name="CirclePlus" variant="bold" size="lg" />
</button>
```

### Estados y Badges

```html
<!-- Estado exitoso -->
<ui-icon name="CheckCircle2" size="sm" class="text-success" />

<!-- Estado pendiente -->
<ui-icon name="Clock" size="sm" class="text-warning" />

<!-- Alerta crítica -->
<ui-icon name="Siren" size="md" class="text-error" />
```

### KPI Cards

```html
<!-- Indicador financiero -->
<div class="kpi-card">
  <ui-icon name="Wallet" size="xl" class="text-primary" />
  <span>$1,234,567</span>
</div>

<!-- Tendencia -->
<ui-icon name="TrendingUp" size="lg" class="text-success" />
```

### Loading y Animaciones

```html
<!-- Spinner -->
<ui-icon name="Loader2" size="lg" class="animate-spin text-primary" />

<!-- Loading en botón -->
<button disabled>
  <ui-icon name="Loader2" size="sm" class="animate-spin" />
  Cargando...
</button>
```

### Inputs de Formulario

```html
<!-- Input con icono -->
<div class="input-group">
  <ui-icon name="User" size="md" class="text-gray-400" />
  <input type="text" placeholder="Usuario" />
</div>

<!-- Toggle de password -->
<button (click)="togglePassword()">
  <ui-icon [name]="showPassword ? 'Eye' : 'EyeOff'" size="md" />
</button>
```

### Tabs y Navegación

```html
<!-- Tabs con iconos -->
<div class="tabs">
  <button [class.active]="tab === 'summary'">
    <ui-icon name="ChartNoAxesCombined" size="md" />
    <span>Resumen</span>
  </button>
  <button [class.active]="tab === 'weekly'">
    <ui-icon name="Calendar" size="md" />
    <span>Semanal</span>
  </button>
</div>
```

### Transporte y Flota (Iconos Custom Reemplazados)

```html
<!-- Antes: <app-bus-icon class="w-5 h-5 text-white"></app-bus-icon> -->
<!-- Después: -->
<ui-icon name="BusFront" size="lg" class="text-white" />

<!-- Antes: <app-driver-icon class="w-5 h-5"></app-driver-icon> -->
<!-- Después: -->
<ui-icon name="IdCard" size="lg" />

<!-- Vista de lista -->
<ui-icon name="Bus" size="md" class="text-gray-600" />

<!-- Rutas -->
<ui-icon name="Route" size="md" class="text-blue-500" />
```

## Accesibilidad

El componente maneja automáticamente los atributos SVG, pero debes agregar:

```html
<!-- Iconos decorativos (con texto) -->
<button aria-label="Eliminar registro">
  <ui-icon name="Trash2" />
  Eliminar
</button>

<!-- Iconos sin texto (necesitan label) -->
<button aria-label="Cerrar" (click)="close()">
  <ui-icon name="X" />
</button>
```

## Catálogo de Iconos Disponibles

Todos los iconos están registrados en `frontend/src/app/shared/icons/icons.provider.ts`:

### Transporte & Flota
- `BusFront` - Vista frontal de bus/microbús
- `Bus` - Vista lateral de vehículo
- `IdCard` - Licencia/Identificación de conductor
- `Route` - Rutas y recorridos

### Navegación
- `LayoutDashboard` - Dashboard principal
- `ClipboardList` - Registros y listas
- `HandCoins` - Finanzas y pagos
- `ChartNoAxesCombined` - Análisis y reportes
- `Settings` - Configuración
- `LifeBuoy` - Centro de ayuda
- `LogOut` - Cerrar sesión
- `Home` - Inicio
- `Menu` - Menú hamburguesa
- `X` - Cerrar/Cancelar

### Autenticación
- `User` - Usuario
- `LockKeyhole` - Contraseña/Seguridad
- `Eye` / `EyeOff` - Mostrar/Ocultar password

### KPIs y Métricas
- `Wallet` - Billetera/Recaudación
- `CalendarCheck` - Calendario con confirmación
- `TrendingUp` / `TrendingDown` - Tendencias
- `Siren` - Alerta crítica
- `TriangleAlert` - Advertencia

### Acciones CRUD
- `Pencil` - Editar
- `Trash2` - Eliminar
- `Save` - Guardar
- `Filter` - Filtrar
- `ArrowUpDown` - Ordenar
- `Download` - Descargar
- `Eye` - Ver/Visualizar
- `RefreshCw` - Actualizar/Refrescar

### Estados
- `CheckCircle2` - Completado/Éxito
- `Clock` - Pendiente/En progreso
- `AlertCircle` - Alerta/Advertencia
- `Ban` - Prohibido/No trabajó
- `OctagonAlert` - Error crítico
- `Info` - Información

### Otros
- `Calendar` - Calendario
- `ChevronLeft` / `ChevronRight` / `ChevronDown` - Navegación
- `Search` - Búsqueda
- `FileText` - Documento
- `CirclePlus` - Agregar/Nuevo
- `UserRound` - Perfil de usuario
- `Check` - Marca de verificación
- `Loader2` - Loading spinner

## Mejores Prácticas

### ✅ Hacer

1. **Usar tamaños semánticos**
   ```html
   <ui-icon name="Pencil" size="sm" /> <!-- En tabla -->
   <ui-icon name="Home" size="lg" /> <!-- En navegación -->
   ```

2. **Agregar clases de color con Tailwind**
   ```html
   <ui-icon name="CheckCircle2" class="text-success" />
   <ui-icon name="TriangleAlert" class="text-warning" />
   ```

3. **Usar variant="bold" para FABs y acciones principales**
   ```html
   <ui-icon name="CirclePlus" variant="bold" size="lg" />
   ```

### ❌ Evitar

1. **No usar tamaños fijos en clases**
   ```html
   <!-- Mal -->
   <ui-icon name="User" class="w-6 h-6" />
   
   <!-- Bien -->
   <ui-icon name="User" size="lg" />
   ```

2. **No duplicar iconos no registrados**
   Si necesitas un icono nuevo, agrégalo a `icons.provider.ts` primero.

3. **No usar SVG inline directamente**
   Usa siempre `<ui-icon>` para mantener consistencia.

## Migración desde Hero Icons

| Hero Icons (Anterior) | Lucide (Nuevo) |
|----------------------|----------------|
| `<svg>...</svg>` inline | `<ui-icon name="..." />` |
| `<app-bus-icon>` | `<ui-icon name="BusFront" />` |
| `<app-driver-icon>` | `<ui-icon name="IdCard" />` |
| `class="w-6 h-6"` | `size="lg"` |
| `class="w-5 h-5"` | `size="md"` |
| `class="w-4 h-4"` | `size="sm"` |

## Soporte y Documentación

- **Lucide Icons**: https://lucide.dev/icons
- **Grid System**: 24px Hard Constraint
- **Stroke**: 1.5px desktop / 2px móvil (responsive)
- **Tree-shaking**: Automático vía `icons.provider.ts`

---

**Versión**: 2.0  
**Blueprint**: Icon-System-Lead Approved  
**Última actualización**: 20 de diciembre de 2025

