# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sistema MicrosChillán (gestor de flotas de micros): Frontend Angular 20 + Backend FastAPI + Supabase (Auth, Postgres, Storage, Realtime). El sistema **ya está entregado y en producción**; los cambios son correcciones sobre código en uso. Código, tablas y comentarios están en español.

- Frontend prod: `https://gestordeflotas.autoescuelachillan.cl`
- Backend prod: Railway (`https://micros-chillan-production.up.railway.app`), vía `backend/DockerFile`
- App móvil (Capacitor, APK Android) usa el mismo frontend; por eso CORS incluye `capacitor://localhost`.

## Comandos

Backend (desde `backend/`, con el venv en `backend/.venv`):
```bash
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000, docs en /docs
python test_login.py                   # imprime un JWT de Supabase para probar endpoints
```
Requiere `backend/.env` con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_URL` (opcional `FRONTEND_URL`). `Settings()` en `app/core/config.py` falla al importar si falta alguna.

Frontend (desde `frontend/`):
```bash
npm start                              # ng serve, http://localhost:4200
npm run build
npm test                               # Karma/Jasmine
npx ng test --watch=false --browsers=ChromeHeadless --include src/app/pages/trabajador/reportar/reportar.spec.ts   # un solo spec
```

Deploy: backend en Railway (auto-deploy desde `main`, Dockerfile en `backend/`). Frontend web en cPanel (LiteSpeed), **manual**: `npm run build` y subir el contenido de `frontend/dist/frontend/browser/` (conservar el `.htaccess` del servidor). Push a `main` no actualiza la web.

`app.spec.ts` es el generado por Angular CLI y está desactualizado (espera un título "Hello, frontend"). No hay tests de backend ni linter configurado. Prettier está configurado en `package.json` (printWidth 100, singleQuote).

## Advertencias importantes

- **El frontend local apunta a producción.** Todos los servicios importan `environments/environment.development` (no hay `fileReplacements` en `angular.json`), y ambos environments tienen `apiBaseUrl` y Supabase de producción. Correr `ng serve` (`npm start`) lee/escribe datos reales; para probar cambios **solo de frontend** basta con eso (sin enviar formularios). Para probar contra backend local, cambiar `apiBaseUrl` a `http://localhost:8000` temporalmente y no commitearlo.
- El `backend/.env` local apunta a un proyecto Supabase antiguo que ya no existe (`whakzffihcapzrlqjdgp`): el backend local arranca pero falla al validar tokens (`getaddrinfo failed`). Para correrlo hay que copiar las variables de Railway, y entonces queda conectado a la BD de producción con service_role. No existe un entorno de staging.
- `backend/requirements.txt` está codificado en **UTF-16**; editarlo preservando la codificación.
- El scheduler (APScheduler) corre dentro del proceso de uvicorn: si se levanta el backend local con un `.env` de producción, los cron jobs también se ejecutan contra la BD real.

## Arquitectura

### Backend (`backend/app/`)
Capas: `api/` (routers FastAPI, prefijo `/api/...`) → `services/` (lógica de negocio, acceso a Supabase) → `schemas/` (Pydantic). Todos los routers se registran a mano en `main.py`.

- **Acceso a datos**: cliente único `app/db/supabase_client.py` creado con la **service_role key**, por lo que salta RLS. Toda la autorización se hace en código. Se usa el SDK de Supabase (PostgREST) con `.table(...).select/insert/...execute()`, no SQL directo. El cliente es síncrono aunque los handlers/servicios sean `async def`.
- **Auth** (`app/utils/auth.py`): `get_current_user` valida el JWT de Supabase localmente con JWKS (ES256) y si falla hace fallback a `supabase.auth.get_user`. Luego busca en la tabla `usuarios` por `supabase_uid` y exige `estado == "activo"`. `require_admin(user)` exige `rol_id == 1`; se llama **dentro** del handler (no como `Depends`). `core/dependencies.py` y `core/security.py` están vacíos.
- **Roles**: `rol_id 1` = admin; cualquier otro = trabajador (chofer). Un usuario chofer tiene `chofer_id` que lo vincula a la tabla `choferes`.
- **Cron** (`api/scheduler.py` + `services/cron_service.py`), zona `America/Santiago`, solo lunes a viernes:
  - 23:00: alerta al chofer que no ha enviado el registro diario de hoy.
  - 08:00: para los choferes con asignación activa sin registro de ayer, crea un `registros_diarios` automático con `estado = "no_trabajado"`, `motivo_no_trabajado = "registro_faltante"` y una alerta al admin con `origen_tipo = "registro_diario"`.
- **Alertas**: `services/alert_service.py` crea/resuelve filas en `alertas` (enums de tipo, severidad, origen y estado definidos en la migración). `dashboard_service` las combina con la información contable.
- **APK móvil**: `api/updates.py` (`/api/updates/check`) y `api/mobile.py` (`/api/mobile/apk`) leen `version.json` y el APK desde el bucket de Storage `mobile-apk-releases` y sirven el APK vía URL firmada. `backend/static/updates/version.json` es legado y no se usa.
- Servicios grandes donde vive la mayor parte de la lógica: `daily_record_service.py`, `driver_service.py`, `machine_service.py`, `accounting_service.py`.

### Base de datos (`supabase/migrations/0001_initial_schema.sql`)
Esquema completo en una sola migración (dump). Entidades centrales: `usuarios`/`roles`, `choferes`, `maquinas`, `asignaciones_chofer_maquina` (asignación activa = `fecha_termino IS NULL`), `registros_diarios` (+ `registros_diarios_auditoria`), `pagos_semanales`, `liquidaciones`, `cierres_mensuales`, `cuentas_corrientes` + `historial_movimientos`, `compras_repuestos`/`items_repuesto`, `documentos_maquina`, `alertas`, `configuracion_general`.
- El trigger `actualizar_saldo_cuenta` actualiza `cuentas_corrientes.saldo_actual` al insertar movimientos `CARGO` (resta) o `ABONO` (suma); no actualizar el saldo a mano.
- Las políticas RLS dan acceso total a `service_role` y solo SELECT a `authenticated` sobre `alertas`, `registros_diarios` y `registros_diarios_auditoria` (para Realtime).
- Los cambios de esquema hechos en el dashboard de Supabase pueden no estar reflejados en esta migración.

### Frontend (`frontend/src/app/`)
- Componentes standalone con templates inline (no hay archivos `.html` por componente), signals y rutas lazy (`loadComponent`) en `app.routes.ts`. Preloading con `core/strategies/smart-preloading.strategy.ts`.
- `pages/` = vistas de ruta; `pages/trabajador/*` es la interfaz del chofer (pensada para móvil). `shared/` = componentes por dominio (`machines/`, `accounting/`, `help/`, `components/`), `services/`, `models/`, `utils/` (RUT, licencias, fechas).
- **Flujo de auth**: `AuthService` hace login con `supabase.auth.signInWithPassword` directo contra Supabase, luego llama `GET /api/auth/me` para obtener `rol_id`/`chofer_id` y mapear el rol a `'admin' | 'worker'`. Usuario y token se guardan en sessionStorage (`auth_user`, `auth_token`). El logout navega por el router sin recargar la página, así que los cachés en memoria de los servicios `providedIn: 'root'` sobreviven al cambio de usuario; `clearSession()` limpia los del trabajador. `authGuard` usa `route.data.role`, espera `isInitializing()` y redirige al home del rol (`/dashboard` o `/trabajador`); en modo recuperación de clave solo permite `/restablecer-clave`.
- `authInterceptor` agrega el `Bearer` solo a URLs que contienen `/api/`; ante un 401 (excepto `/api/auth/me`) hace logout.
- **Formulario de reporte del chofer** (`pages/trabajador/reportar`): la máquina se preselecciona solo cuando llegaron la lista de máquinas **y** el perfil (`maquina_id` de `/api/worker/profile`); si no se conoce la asignada, queda vacía. Si el chofer elige otra máquina se pide confirmación. Antes se preseleccionaba la primera de la lista (la 18) cuando el perfil llegaba tarde, y eso bloqueaba al chofer real de esa máquina por el control de duplicado máquina+fecha del backend. Cubierto por `reportar.spec.ts`.
- `dashboard.service.ts` se suscribe a Supabase Realtime (`postgres_changes`) y vuelve a pedir los datos al backend cuando cambian.
- Modales globales implementados como servicios (`*-modal.service.ts`).

### Convenciones frontend (de `frontend/.cursorrules`)
- Angular 20: no poner `standalone: true`; usar `input()`/`output()`, `inject()`, `computed()`, `ChangeDetectionStrategy.OnPush`, control de flujo `@if/@for/@switch`, bindings de `class`/`style` en vez de `ngClass`/`ngStyle`, `host` en vez de `@HostBinding`/`@HostListener`.
- Estilos: Tailwind CSS 4 + DaisyUI 5. **Usar primero un componente DaisyUI** si existe; Tailwind crudo solo si no.
- Gráficos: `ng2-charts` con opciones de Chart.js v4 (no inventar propiedades).
- Layout: `h-dvh` en el contenedor raíz, scroll dentro de `main` (`overflow-y-auto`), tablas en `overflow-x-auto`, `truncate`/`line-clamp` en texto dinámico, container queries (`@container`) en componentes reutilizables.
- Íconos: `lucide-angular` (registrados en `shared/icons/`).
