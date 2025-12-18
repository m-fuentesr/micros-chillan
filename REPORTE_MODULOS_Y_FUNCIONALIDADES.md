# Reporte de Módulos y Funcionalidades
## Sistema de Gestión de Flota - Micros Chillán

**Versión:** 1.0  
**Fecha:** 2025  
**Propósito:** Documentación completa para la Fase 2 - Centro de Ayuda

---

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [Módulos del Backend](#módulos-del-backend)
3. [Módulos del Frontend](#módulos-del-frontend)
4. [Páginas y Funcionalidades Detalladas](#páginas-y-funcionalidades-detalladas)
5. [Casos de Uso por Rol](#casos-de-uso-por-rol)
6. [Flujos de Usuario](#flujos-de-usuario)

---

## Arquitectura General

### Stack Tecnológico
- **Frontend:** Angular 18+ (Standalone Components)
- **Backend:** FastAPI (Python)
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** JWT con Supabase Auth
- **Almacenamiento:** Supabase Storage

### Roles del Sistema
1. **Admin:** Administrador completo del sistema
2. **Worker:** Trabajador/Chofer con acceso limitado

---

## Módulos del Backend

### 1. Módulo de Autenticación (`auth.py`)
**Propósito:** Gestión de autenticación y autorización de usuarios.

**Endpoints:**
- `GET /api/auth/me` - Obtener información del usuario autenticado

**Funcionalidad:**
- Validación de tokens JWT
- Verificación de roles (admin/worker)
- Obtención de perfil de usuario

**Servicios relacionados:**
- `utils/auth.py` - Validación JWT y gestión de roles

---

### 2. Módulo de Contabilidad (`accounting.py`)
**Propósito:** Gestión financiera, liquidaciones y pagos a choferes.

**Endpoints principales:**
- `GET /api/accounting/summary` - Resumen financiero mensual
- `GET /api/accounting/daily-profitability` - Rentabilidad diaria
- `GET /api/accounting/weeks` - Resumen semanal
- `GET /api/accounting/settlements` - Liquidaciones semanales
- `POST /api/accounting/settlements/{chofer_id}/confirm-payment` - Confirmar pago
- `GET /api/accounting/settlements/history` - Historial de liquidaciones
- `POST /api/accounting/periods/close` - Cerrar período contable

**Funcionalidad:**
- Cálculo de ingresos y gastos mensuales
- Generación de liquidaciones semanales
- Gestión de pagos a choferes (transferencia/efectivo)
- Cálculo de mínimos garantizados
- Historial de liquidaciones cerradas

**Servicios relacionados:**
- `services/accounting_service.py` - Lógica de negocio contable

---

### 3. Módulo de Registros Diarios (`daily_records.py`)
**Propósito:** Gestión de reportes diarios de operación.

**Endpoints principales:**
- `GET /api/daily-records/summary` - KPIs de registros (admin)
- `GET /api/daily-records/my-history` - Historial del trabajador
- `GET /api/daily-records` - Lista paginada de registros (admin)
- `POST /api/daily-records` - Crear registro (trabajador)
- `POST /api/daily-records/admin` - Crear registro como admin
- `GET /api/daily-records/{id}` - Detalle de registro
- `PATCH /api/daily-records/{id}` - Editar registro
- `POST /api/daily-records/preview-payment` - Vista previa de pago
- `PATCH /api/daily-records/{id}/resolve` - Resolver incidente

**Funcionalidad:**
- Creación de registros diarios por trabajadores
- Edición y auditoría de registros por admin
- Gestión de incidentes críticos
- Vista previa de cálculos de pago
- Historial de cambios (auditoría)

**Servicios relacionados:**
- `services/daily_record_service.py` - Lógica de registros diarios
- `services/alert_service.py` - Generación de alertas

---

### 4. Módulo de Dashboard (`dashboard.py`)
**Propósito:** Panel principal del administrador con resumen operativo.

**Endpoints:**
- `GET /api/dashboard/alerts` - Alertas combinadas del sistema

**Funcionalidad:**
- Consolidación de alertas de múltiples fuentes
- Alertas de documentos vencidos
- Alertas de mantenimientos pendientes
- Alertas de registros faltantes

**Servicios relacionados:**
- `services/dashboard_service.py` - Construcción de alertas
- `services/alert_service.py` - Generación de alertas

---

### 5. Módulo de Choferes (`drivers.py`)
**Propósito:** Gestión completa de conductores.

**Endpoints principales:**
- `GET /api/drivers` - Lista de choferes
- `GET /api/drivers/summary` - KPIs de choferes
- `POST /api/drivers` - Crear chofer
- `GET /api/drivers/{id}` - Detalle de chofer
- `PATCH /api/drivers/{id}` - Actualizar chofer
- `GET /api/drivers/{id}/license` - Estado de licencia
- `GET /api/drivers/{id}/settlements` - Liquidaciones del chofer
- `GET /api/drivers/{id}/assignments` - Historial de asignaciones

**Funcionalidad:**
- CRUD completo de choferes
- Gestión de licencias y certificaciones
- Control de estado de licencias (vigente/vencida)
- Historial de asignaciones a máquinas
- Liquidaciones históricas por chofer

**Servicios relacionados:**
- `services/driver_service.py` - Lógica de choferes

---

### 6. Módulo de Máquinas (`machines.py`)
**Propósito:** Gestión de la flota de vehículos.

**Endpoints principales:**
- `GET /api/machines` - Lista de máquinas
- `GET /api/machines/summary` - KPIs de máquinas
- `POST /api/machines` - Crear máquina
- `GET /api/machines/{id}` - Detalle de máquina
- `PATCH /api/machines/{id}` - Actualizar máquina
- `GET /api/machines/{id}/assignments` - Historial de asignaciones
- `GET /api/machines/{id}/maintenances` - Mantenimientos de la máquina
- `POST /api/machines/{id}/assign` - Asignar chofer
- `DELETE /api/machines/{id}/assign` - Desasignar chofer

**Funcionalidad:**
- CRUD completo de máquinas
- Gestión de documentos (revisión técnica, permiso de circulación, seguro)
- Control de estado operativo (Operativa/En Taller/Inactiva)
- Asignación/desasignación de choferes
- Historial de mantenimientos
- Alertas de documentos por vencer

**Servicios relacionados:**
- `services/machine_service.py` - Lógica de máquinas

---

### 7. Módulo de Mantenimientos (`maintenances.py`)
**Propósito:** Gestión de mantenimientos y repuestos.

**Endpoints principales:**
- `POST /api/maintenances` - Crear mantenimiento
- `GET /api/maintenances/{id}` - Detalle de mantenimiento
- `PATCH /api/maintenances/{id}` - Actualizar mantenimiento
- `DELETE /api/maintenances/{id}` - Eliminar mantenimiento

**Funcionalidad:**
- Registro de mantenimientos preventivos y correctivos
- Gestión de repuestos utilizados
- Costos de mantenimiento
- Historial por máquina

---

### 8. Módulo de Reportes (`reports.py`)
**Propósito:** Reportes analíticos y estadísticas.

**Endpoints principales:**
- `GET /api/reports/profitability` - Rentabilidad por período
- `GET /api/reports/gross-income-ranking` - Ranking de ingresos brutos
- `GET /api/reports/driver-performance` - Rendimiento de choferes

**Funcionalidad:**
- Análisis de rentabilidad
- Rankings y comparativas
- Reportes por período personalizable

**Servicios relacionados:**
- `services/report_service.py` - Lógica de reportes

---

### 9. Módulo del Trabajador (`worker.py`)
**Propósito:** Funcionalidades específicas para trabajadores/choferes.

**Endpoints principales:**
- `GET /api/worker/profile` - Perfil del trabajador
- `GET /api/worker/monthly-stats` - Estadísticas mensuales
- `GET /api/worker/daily-records/my-history` - Historial de registros

**Funcionalidad:**
- Visualización de perfil personal
- Estadísticas de rendimiento mensual
- Historial de reportes enviados

**Servicios relacionados:**
- `services/worker_service.py` - Lógica del trabajador

---

### 10. Módulo de Almacenamiento (`storage.py`)
**Propósito:** Gestión de archivos e imágenes.

**Endpoints principales:**
- `POST /api/storage/upload-daily-record-image` - Subir imagen de comprobante (trabajador)
- `POST /api/storage/upload-daily-record-image-admin` - Subir imagen como admin

**Funcionalidad:**
- Subida de imágenes de comprobantes
- Validación de tipos de archivo
- Organización por chofer y fecha
- Retorno de URLs públicas

**Servicios relacionados:**
- `services/storage_service.py` - Lógica de almacenamiento

---

## Módulos del Frontend

### Estructura de Páginas

#### **Área de Autenticación**

##### 1. Login (`/login`)
**Componente:** `login.ts`

**Funcionalidad:**
- Autenticación de usuarios (admin y worker)
- Validación de credenciales
- Recuperación de contraseña (enlace)
- Transiciones animadas según rol
- Manejo de errores específicos (email no encontrado, contraseña incorrecta, etc.)

**Casos de Uso:**
- Usuario ingresa con email y contraseña
- Sistema valida credenciales contra Supabase
- Redirección automática según rol (admin → dashboard, worker → trabajador)
- Opción de recuperar contraseña si se olvida

**Flujo:**
1. Usuario ingresa email y contraseña
2. Sistema valida formato
3. Autenticación con Supabase
4. Obtención de perfil de usuario
5. Redirección según rol con animación

---

##### 2. Recuperar Clave (`/recuperar-clave`)
**Componente:** `recuperar-clave.ts`

**Funcionalidad:**
- Solicitud de recuperación de contraseña
- Envío de email de recuperación

**Casos de Uso:**
- Usuario olvida su contraseña
- Ingresa su email
- Recibe enlace de recuperación

---

##### 3. Restablecer Clave (`/restablecer-clave`)
**Componente:** `restablecer-clave.ts`

**Funcionalidad:**
- Restablecimiento de contraseña con token
- Validación de token de recuperación

**Casos de Uso:**
- Usuario hace clic en enlace de email
- Ingresa nueva contraseña
- Sistema actualiza credenciales

---

#### **Área de Administrador**

##### 4. Dashboard / Home (`/dashboard`)
**Componente:** `home.ts`

**Funcionalidad:**
- Panel principal con KPIs financieros
- Resumen de alertas críticas
- Gráfico de tendencias financieras
- Tabla de registros diarios recientes
- Filtro de registros pendientes

**KPIs mostrados:**
1. **Ganancia Neta:** Total neto después de descuentos
2. **Recaudación Total:** Ingresos brutos del día
3. **Flota en Ruta:** Máquinas activas y reportes completados
4. **Resumen de Salud:** Alertas críticas, advertencias e informativas

**Componentes utilizados:**
- `AlertList` - Lista de alertas
- `FinancialSummary` - Resumen financiero con gráfico
- `DailyRecordsTable` - Tabla de registros diarios

**Casos de Uso:**
- Admin accede al sistema y ve estado general
- Revisa alertas críticas que requieren atención
- Monitorea ganancias del día
- Verifica qué registros están pendientes
- Analiza tendencias financieras en gráfico

**Flujo:**
1. Carga de datos financieros del día
2. Carga de alertas del sistema
3. Carga de registros diarios recientes
4. Visualización de KPIs y gráficos
5. Interacción con alertas (eliminar, resolver)

---

##### 5. Bitácora de Operaciones (`/bitacora-operaciones`)
**Componente:** `bitacora-operaciones.ts`

**Funcionalidad:**
- Gestión centralizada de todos los registros diarios
- Filtros avanzados (chofer, fecha, estado)
- Creación de registros como admin
- Visualización en tabla (desktop) y cards (móvil)
- Paginación del lado del servidor

**KPIs mostrados:**
- Recaudación del período
- Registros faltantes
- Registros con incidentes

**Filtros disponibles:**
- Chofer (select con lista de choferes activos)
- Fecha desde/hasta (date picker)
- Orden (más reciente / más antiguo)

**Vistas:**
- **Desktop (≥1024px):** Tabla completa con todas las columnas
- **Tablet (768-1023px):** Tabla simplificada
- **Móvil (<768px):** Cards con información resumida

**Casos de Uso:**
- Admin busca registros de un chofer específico
- Filtra registros por rango de fechas
- Crea registro diario manualmente (si un chofer no lo hizo)
- Revisa registros con incidentes
- Navega a detalle de registro para editar

**Flujo:**
1. Carga de registros con paginación
2. Aplicación de filtros
3. Visualización según dispositivo
4. Navegación a detalle o creación de nuevo registro

---

##### 6. Detalle de Registro Diario (`/registro-diario/:id`)
**Componente:** `registro-diario-detail.ts`

**Funcionalidad:**
- Visualización completa de un registro diario
- Edición de campos (solo admin)
- Resolución de incidentes
- Vista previa de cálculo de pago
- Historial de auditoría (cambios realizados)
- Visualización de imágenes de comprobantes

**Casos de Uso:**
- Admin revisa un registro específico
- Edita monto recaudado si hay error
- Resuelve incidente reportado
- Ve imágenes de comprobantes subidas
- Revisa historial de cambios realizados

**Flujo:**
1. Carga de datos del registro
2. Visualización de información completa
3. Edición (si es admin)
4. Guardado de cambios
5. Actualización de auditoría

---

##### 7. Gestión de Choferes (`/choferes`)
**Componente:** `choferes.ts` (wrapper) → `drivers-list.ts`

**Funcionalidad:**
- Lista completa de choferes
- Creación de nuevos choferes
- Visualización de detalle por chofer
- Filtros por estado de licencia
- KPIs de choferes

**Subpáginas:**
- `/choferes/nuevo` - Formulario de creación
- `/choferes/:id` - Detalle y edición de chofer

**KPIs mostrados:**
- Total de choferes
- Choferes con licencia vigente
- Choferes con licencia vencida
- Choferes activos

**Casos de Uso:**
- Admin visualiza todos los choferes
- Crea nuevo chofer con datos personales
- Edita información de chofer existente
- Revisa estado de licencia
- Ve historial de asignaciones
- Revisa liquidaciones del chofer

**Flujo:**
1. Carga de lista de choferes
2. Visualización de KPIs
3. Navegación a detalle o creación
4. Gestión de datos del chofer

---

##### 8. Gestión de Máquinas (`/maquinas`)
**Componente:** `maquinas.ts`

**Funcionalidad:**
- Lista completa de máquinas de la flota
- Creación de nuevas máquinas
- Visualización de detalle por máquina
- Filtros por estado operativo y documentos
- KPIs de máquinas

**Subpáginas:**
- `/maquinas/nueva` - Formulario de creación
- `/maquinas/:id` - Detalle y edición de máquina

**KPIs mostrados:**
- Máquinas operativas
- Máquinas en taller
- Máquinas inactivas
- Documentos por vencer

**Vistas:**
- Modo cards (tarjetas visuales)
- Modo tabla (lista compacta)

**Filtros:**
- Estado operativo (Operativa/En Taller/Inactiva/Todas)
- Documentos (Al día/Por vencer/Vencidos/Todos)

**Casos de Uso:**
- Admin visualiza toda la flota
- Crea nueva máquina con datos y documentos
- Edita información de máquina
- Asigna/desasigna chofer a máquina
- Revisa estado de documentos (revisión técnica, permiso, seguro)
- Gestiona mantenimientos de la máquina
- Ve historial de asignaciones

**Flujo:**
1. Carga de lista de máquinas
2. Visualización de KPIs
3. Aplicación de filtros
4. Navegación a detalle o creación
5. Gestión de máquina (asignaciones, mantenimientos, documentos)

---

##### 9. Contabilidad (`/contabilidad`)
**Componente:** `contabilidad.ts`

**Funcionalidad:**
- Gestión financiera completa
- Liquidaciones semanales
- Confirmación de pagos
- Historial de liquidaciones

**Tabs disponibles:**
1. **Resumen:** KPIs financieros y gráfico de tendencias
2. **Semanal:** Resumen por semanas del mes
3. **Liquidación:** Tabla de liquidación semanal con pagos
4. **Historial:** Liquidaciones cerradas anteriormente

**Filtros:**
- Mes y año (selectores)
- Semana (para liquidación)
- Período (mes actual / mes anterior)

**KPIs del Resumen:**
- Ingresos totales
- Gastos totales
- Ganancia neta
- Margen de ganancia

**Funcionalidad de Liquidación:**
- Visualización de choferes con sus cálculos
- Aplicación de mínimo garantizado (última semana)
- Monto a completar manual
- Confirmación de pago (transferencia/efectivo)
- Cierre de período mensual

**Casos de Uso:**
- Admin revisa resumen financiero del mes
- Analiza tendencias en gráfico
- Revisa resumen semanal
- Procesa liquidación semanal
- Confirma pagos a choferes
- Cierra período contable al final del mes
- Consulta historial de liquidaciones pasadas

**Flujo:**
1. Selección de mes y año
2. Visualización de resumen y KPIs
3. Navegación a tab de liquidación
4. Selección de semana
5. Revisión de cálculos por chofer
6. Confirmación de pagos
7. Cierre de período (final de mes)

---

##### 10. Reportes (`/reportes`)
**Componente:** `reportes.ts`

**Funcionalidad:**
- Reportes analíticos avanzados
- Rentabilidad por período
- Rankings de rendimiento
- Comparativas entre choferes/máquinas

**Casos de Uso:**
- Admin genera reporte de rentabilidad
- Compara rendimiento entre choferes
- Analiza rendimiento por máquina
- Exporta datos para análisis externo

---

##### 11. Configuración (`/configuracion`)
**Componente:** `configuracion.ts`

**Funcionalidad:**
- Configuración general de la aplicación
- Configuración de notificaciones
- Parámetros globales

**Casos de Uso:**
- Admin configura nombre de la aplicación
- Activa/desactiva notificaciones por email
- Configura correo de soporte

---

##### 12. About (`/about`)
**Componente:** `about.ts`

**Funcionalidad:**
- Información sobre la aplicación
- Stack tecnológico utilizado

---

##### 13. Centro de Ayuda (`/centro-ayuda`)
**Componente:** `centro-ayuda.ts`

**Funcionalidad:**
- **FASE 2:** Centro de ayuda y documentación
- Guías de uso por módulo
- Preguntas frecuentes
- Tutoriales interactivos

---

#### **Área de Trabajador**

##### 14. Panel del Trabajador (`/trabajador`)
**Componente:** `trabajador.ts`

**Funcionalidad:**
- Panel principal del trabajador/chofer
- Estado del reporte del día
- Actividad reciente
- Información de máquina asignada

**Estados del reporte:**
- **Ya reportó hoy:** Muestra confirmación, no puede crear otro hasta mañana
- **Acción requerida:** Botón para crear reporte diario

**Información mostrada:**
- Nombre del trabajador
- Máquina asignada
- Fecha actual
- Últimos 3 registros enviados

**Casos de Uso:**
- Trabajador accede y ve si debe reportar
- Revisa su actividad reciente
- Ve información de su máquina asignada
- Navega a crear reporte si es necesario

**Flujo:**
1. Carga de perfil del trabajador
2. Verificación de estado del reporte del día
3. Carga de actividad reciente
4. Visualización de información
5. Navegación a crear reporte si aplica

---

##### 15. Crear Reporte (`/trabajador/reportar`)
**Componente:** `reportar.ts`

**Funcionalidad:**
- Formulario para crear registro diario
- Captura de monto recaudado
- Registro de carga de combustible (opcional)
- Subida de imágenes de comprobantes
- Reporte de incidentes críticos

**Campos del formulario:**
- Máquina asignada (select)
- Total recaudado (número)
- Litros de combustible (opcional)
- Costo total de combustible (opcional)
- Foto del comprobante (requerida)
- Foto del comprobante de combustible (opcional)
- Observaciones (opcional)
- Marcar como incidente crítico (checkbox)

**Validaciones:**
- Máquina requerida
- Monto recaudado requerido y mayor a 0
- Imagen de comprobante requerida
- Validación de formato de imágenes

**Casos de Uso:**
- Trabajador finaliza su día
- Ingresa monto recaudado
- Registra carga de combustible si aplica
- Toma foto del comprobante
- Agrega observaciones si hay algo relevante
- Marca como incidente si hay problema crítico
- Envía reporte

**Flujo:**
1. Selección de máquina asignada
2. Ingreso de monto recaudado
3. Registro opcional de combustible
4. Subida de imágenes
5. Agregar observaciones
6. Envío del reporte
7. Redirección a página de éxito

---

##### 16. Reporte Exitoso (`/trabajador/reporte-exito`)
**Componente:** `reporte-exito.ts`

**Funcionalidad:**
- Confirmación visual de reporte enviado
- Resumen del reporte creado
- Opciones de navegación

**Casos de Uso:**
- Trabajador ve confirmación de su reporte
- Revisa resumen de lo enviado
- Navega a su historial o vuelve al panel

---

##### 17. Mi Historial (`/trabajador/mi-historial`)
**Componente:** `mi-historial.ts`

**Funcionalidad:**
- Historial completo de reportes enviados
- Filtros por rango de tiempo
- Visualización de estado de cada reporte
- Detalle de cada registro

**Casos de Uso:**
- Trabajador revisa todos sus reportes
- Filtra por mes o rango personalizado
- Ve detalles de reportes pasados
- Verifica estado de validación

---

##### 18. Perfil (`/trabajador/perfil`)
**Componente:** `perfil.ts`

**Funcionalidad:**
- Visualización de perfil personal
- Información de máquina asignada
- Estadísticas mensuales
- Datos personales

**Casos de Uso:**
- Trabajador revisa su información
- Ve estadísticas de su rendimiento
- Consulta datos de contacto

---

## Casos de Uso por Rol

### Administrador

#### 1. Gestión Diaria de Operaciones
**Flujo completo:**
1. Login en el sistema
2. Revisa dashboard con alertas críticas
3. Verifica registros pendientes
4. Revisa bitácora de operaciones
5. Edita registros si hay errores
6. Resuelve incidentes reportados

#### 2. Gestión de Flota
**Flujo completo:**
1. Accede a módulo de máquinas
2. Revisa estado de documentos
3. Asigna choferes a máquinas
4. Registra mantenimientos
5. Actualiza documentos vencidos

#### 3. Gestión de Choferes
**Flujo completo:**
1. Accede a módulo de choferes
2. Crea nuevo chofer si es necesario
3. Revisa estado de licencias
4. Asigna choferes a máquinas
5. Revisa historial de asignaciones

#### 4. Procesamiento de Liquidaciones
**Flujo completo:**
1. Accede a módulo de contabilidad
2. Revisa resumen financiero del mes
3. Navega a tab de liquidación
4. Selecciona semana a liquidar
5. Revisa cálculos por chofer
6. Aplica mínimo garantizado si aplica
7. Confirma pagos (transferencia/efectivo)
8. Cierra período al final del mes

#### 5. Análisis y Reportes
**Flujo completo:**
1. Accede a módulo de reportes
2. Genera reporte de rentabilidad
3. Analiza rankings de rendimiento
4. Exporta datos si es necesario

### Trabajador/Chofer

#### 1. Reporte Diario
**Flujo completo:**
1. Login en el sistema
2. Accede a panel del trabajador
3. Verifica si debe crear reporte
4. Navega a crear reporte
5. Completa formulario con datos del día
6. Sube imágenes de comprobantes
7. Envía reporte
8. Ve confirmación de éxito

#### 2. Consulta de Historial
**Flujo completo:**
1. Accede a "Mi Historial"
2. Filtra por período deseado
3. Revisa reportes enviados
4. Ve detalles de reportes pasados

#### 3. Consulta de Perfil
**Flujo completo:**
1. Accede a "Perfil"
2. Revisa información personal
3. Ve estadísticas mensuales
4. Consulta máquina asignada

---

## Flujos de Usuario Detallados

### Flujo 1: Trabajador Envía Reporte Diario

1. **Acceso al sistema**
   - Trabajador ingresa con email y contraseña
   - Sistema valida credenciales
   - Redirección a `/trabajador`

2. **Verificación de estado**
   - Sistema verifica si ya tiene reporte del día
   - Si ya reportó: muestra mensaje de confirmación
   - Si no ha reportado: muestra botón "Ingresar reporte"

3. **Creación del reporte**
   - Trabajador hace clic en "Ingresar reporte"
   - Navegación a `/trabajador/reportar`
   - Sistema carga máquinas asignadas

4. **Completar formulario**
   - Selecciona máquina asignada
   - Ingresa monto recaudado
   - Opcionalmente registra combustible
   - Toma/selecciona foto del comprobante
   - Opcionalmente toma foto de comprobante de combustible
   - Agrega observaciones si aplica
   - Marca como incidente si hay problema crítico

5. **Envío del reporte**
   - Trabajador hace clic en "Enviar reporte"
   - Sistema valida datos
   - Sube imágenes a Supabase Storage
   - Crea registro en base de datos
   - Genera alertas si hay incidente crítico

6. **Confirmación**
   - Redirección a `/trabajador/reporte-exito`
   - Muestra resumen del reporte enviado
   - Opciones para volver al panel o ver historial

### Flujo 2: Admin Procesa Liquidación Semanal

1. **Acceso al módulo**
   - Admin navega a `/contabilidad`
   - Selecciona tab "Liquidación"

2. **Selección de período**
   - Selecciona mes y año
   - Selecciona semana (1-4 o más según el mes)
   - Opción de mes actual o anterior

3. **Revisión de cálculos**
   - Sistema carga liquidación de la semana
   - Muestra tabla con todos los choferes
   - Columnas: nombre, días trabajados, recaudado, gastos, ganado, etc.
   - Si es última semana: opción de aplicar mínimo garantizado

4. **Ajustes manuales**
   - Admin puede agregar "monto a completar" si aplica
   - Marca/desmarca "aplicar garantizado" para cada chofer
   - Sistema recalcula pago final automáticamente

5. **Confirmación de pagos**
   - Admin hace clic en "Confirmar pago" para cada chofer
   - Modal de confirmación aparece
   - Selecciona método de pago (transferencia/efectivo)
   - Si es transferencia: ingresa código
   - Ingresa fecha de pago
   - Opcionalmente agrega observaciones
   - Confirma el pago

6. **Cierre de período**
   - Al final del mes, admin cierra el período
   - Sistema marca todas las liquidaciones como cerradas
   - No se pueden hacer más cambios al período cerrado

### Flujo 3: Admin Gestiona Máquina

1. **Acceso al módulo**
   - Admin navega a `/maquinas`
   - Ve lista de todas las máquinas

2. **Creación/Edición**
   - Crea nueva máquina o edita existente
   - Ingresa datos: número, marca, patente
   - Sube/actualiza documentos (revisión técnica, permiso, seguro)
   - Establece estado operativo

3. **Asignación de chofer**
   - En detalle de máquina, asigna chofer
   - Sistema registra fecha de asignación
   - Historial de asignaciones se actualiza

4. **Gestión de mantenimientos**
   - Registra mantenimiento preventivo o correctivo
   - Ingresa repuestos utilizados
   - Registra costos
   - Historial se guarda en la máquina

5. **Monitoreo de documentos**
   - Sistema alerta cuando documentos están por vencer
   - Admin actualiza documentos vencidos
   - Alertas se resuelven automáticamente

### Flujo 4: Admin Resuelve Incidente

1. **Detección del incidente**
   - Trabajador marca reporte como "incidente crítico"
   - Sistema genera alerta en dashboard
   - Alerta aparece en bitácora de operaciones

2. **Revisión del incidente**
   - Admin navega a bitácora
   - Filtra por "con incidentes" o busca específico
   - Abre detalle del registro

3. **Resolución**
   - Admin revisa observaciones del trabajador
   - Ve imágenes si aplica
   - Edita registro si es necesario
   - Hace clic en "Resolver incidente"
   - Sistema marca incidente como resuelto
   - Alerta se elimina del dashboard

---

## Componentes Compartidos

### Componentes de UI
- `LoadingSkeleton` - Esqueletos de carga
- `LoadingSpinner` - Spinner de carga
- `LoadingOverlay` - Overlay de carga
- `AlertModal` - Modal de alertas
- `ConfirmModal` - Modal de confirmación
- `ImageModal` - Modal para ver imágenes
- `DatePicker` - Selector de fechas
- `SearchFilters` - Filtros de búsqueda avanzados

### Componentes de Negocio
- `MachineKPIs` - KPIs de máquinas
- `MachineList` - Lista de máquinas
- `MachineCard` - Tarjeta de máquina
- `DriverTable` - Tabla de choferes
- `DriverCard` - Tarjeta de chofer
- `AccountingKPIs` - KPIs contables
- `AccountingChart` - Gráfico financiero
- `LiquidationTable` - Tabla de liquidación
- `DailyRecordsTable` - Tabla de registros diarios

---

## Servicios del Frontend

### Servicios Principales
- `AuthService` - Autenticación y gestión de sesión
- `MachineService` - Gestión de máquinas
- `DriverService` - Gestión de choferes
- `DailyRecordService` - Gestión de registros diarios
- `AccountingService` - Gestión contable
- `ReportsService` - Generación de reportes
- `WorkerService` - Funcionalidades del trabajador
- `StorageService` - Subida de archivos
- `AlertService` - Gestión de alertas
- `DashboardService` - Datos del dashboard

### Servicios de UI
- `AlertModalService` - Control de modales de alerta
- `ConfirmModalService` - Control de modales de confirmación
- `PaymentConfirmModalService` - Modal de confirmación de pago
- `NewRecordModalService` - Modal de nuevo registro
- `MaintenanceFormModalService` - Modal de mantenimiento
- `ImageModalService` - Modal de imágenes
- `LoadingStateService` - Gestión de estados de carga
- `TransitionService` - Transiciones de página

---

## Consideraciones para el Centro de Ayuda

### Información Necesaria por Módulo

1. **Autenticación**
   - Cómo iniciar sesión
   - Qué hacer si olvida la contraseña
   - Diferencia entre roles

2. **Dashboard**
   - Qué significan los KPIs
   - Cómo interpretar las alertas
   - Cómo usar los filtros

3. **Bitácora de Operaciones**
   - Cómo crear un registro manualmente
   - Cómo filtrar registros
   - Cómo editar un registro
   - Qué hacer con incidentes

4. **Máquinas**
   - Cómo crear una máquina
   - Cómo subir documentos
   - Cómo asignar un chofer
   - Cómo registrar un mantenimiento
   - Qué significan los estados

5. **Choferes**
   - Cómo crear un chofer
   - Cómo actualizar licencia
   - Cómo revisar historial

6. **Contabilidad**
   - Cómo leer el resumen financiero
   - Cómo procesar una liquidación
   - Cómo confirmar un pago
   - Cuándo cerrar un período

7. **Trabajador**
   - Cómo crear un reporte diario
   - Qué hacer si hay un incidente
   - Cómo revisar historial
   - Cómo subir imágenes

### Preguntas Frecuentes Sugeridas

1. ¿Puedo crear más de un reporte por día?
2. ¿Qué pasa si olvido subir la imagen del comprobante?
3. ¿Cómo cambio mi contraseña?
4. ¿Qué es el mínimo garantizado?
5. ¿Cuándo debo cerrar el período contable?
6. ¿Cómo resuelvo una alerta?
7. ¿Puedo editar un registro después de enviarlo?
8. ¿Qué documentos necesita una máquina?

---

## Conclusión

Este documento proporciona una visión completa de todos los módulos, páginas y funcionalidades del sistema. Esta información será fundamental para la creación del Centro de Ayuda en la Fase 2, permitiendo generar guías contextuales, tutoriales y documentación específica para cada funcionalidad.

Cada módulo tiene casos de uso claros y flujos de usuario definidos que pueden ser documentados en el Centro de Ayuda para facilitar el uso del sistema tanto para administradores como para trabajadores.

