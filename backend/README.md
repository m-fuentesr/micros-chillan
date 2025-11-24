Estructura del backend

backend/
└── app/
    ├── api/
    │   ├── __init__.py
    │   ├── accounting.py           # Contabilidad general
    │   │                           # /api/accounting/summary, /weeks, /settlements…
    │   ├── auth.py                 # Endpoints de autenticación
    │   ├── daily_records.py        # Registros diarios + auditoría
    │   │                           # /api/daily-records, /{id}, /preview-payment…
    │   ├── dashboard.py            # Dashboard del administrador
    │   │                           # /api/dashboard/alerts (reutiliza accounting + alert_service)
    │   ├── drivers.py              # Gestión de Choferes
    │   │                           # /api/drivers, /summary, /license, /settlements…
    │   ├── machines.py             # Gestión de Máquinas
    │   │                           # /api/machines, /summary, /{id}/assignments, /{id}/maintenances…
    │   ├── reports.py              # Reportes analíticos
    │   │                           # /api/reports/profitability, /gross-income-ranking…
    │   ├── test.py                 # Pruebas temporales
    │   ├── users.py                # Usuarios básicos (si aplica, por ahora está sólo para testing)
    │   └── worker.py               # Módulo del trabajador (chofer)
    │                               # /api/worker/profile, /monthly-stats, /daily-records/my-history

    ├── core/
    │   ├── __init__.py
    │   ├── config.py               # Configuración general (env, Supabase URL/KEY, CORS…)
    │   ├── dependencies.py         # Depends comunes (current_user, current_admin…)
    │   ├── logging_config.py       # Configuración de logs/auditoría (opcional)
    │   ├── pagination.py           # Funciones comunes de paginación
    │   └── security.py             # Dependencias de seguridad (JWT, roles admin/worker)

    ├── db/
    │   ├── __init__.py
    │   └── supabase_client.py      # EXISTENTE — cliente único de Supabase para toda la app
    │                               # No hay SQLAlchemy ni modelos locales

    ├── schemas/
    │   ├── __init__.py
    │   ├── accounting.py           # Contabilidad: summary, weeks, history/periods…
    │   ├── auth.py                 # Tokens, credenciales de login
    │   ├── common.py               # Esquemas compartidos: paginación, filtros, enums, rangos de fechas
    │   ├── daily_record.py         # Registro diario: creación, detalle, edición, preview-payment, my-history
    │   ├── dashboard.py            # Alertas combinadas para el dashboard admin
    │   ├── driver.py               # Chofer: create/update, summary, license, settlements…
    │   ├── machine.py              # Máquina: create/update, summary, assignments, maintenances…
    │   ├── maintenance.py          # Repuestos/mantenimientos asociados a máquinas
    │   ├── report.py               # Reportes de rentabilidad, ranking bruto, agrupaciones
    │   ├── settlement.py           # Liquidaciones de choferes (confirm-payment, detalles…)
    │   ├── user.py                 # Usuario básico (si aplica, por ahora está sólo para testing)
    │   └── worker.py               # Perfil del chofer + estadísticas mensuales

    ├── services/                   # En estos archivos se maneja la lógica de negocio real para las funciones del sitio
    │   ├── __init__.py
    │   ├── accounting_service.py   # Cálculos de resumen, semanas, liquidaciones…
    │   ├── alert_service.py        # Generación y resolución de alertas (incidentes, registros faltantes…)
    │   ├── dashboard_service.py    # Construcción de lista total de alertas
    │   ├── daily_record_service.py # Crear/editar registro, preview de pago, auditoría…
    │   ├── driver_service.py       # Lógica de choferes (filtros, licencias, historiales…)
    │   ├── machine_service.py      # Lógica de máquinas (documentos, estados, mantenimientos…)
    │   ├── report_service.py       # Rentabilidad, ranking bruto, exportaciones
    │   ├── storage_service.py      # Manejo de imágenes (comprobantes, fotos)
    │   └── worker_service.py       # Perfil del chofer, monthly-stats, my-history

    ├── utils/
    │   ├── __init__.py
    │   ├── auth.py                 # Helpers de auth (validación JWT, hashing)
    │   ├── dates.py                # Helpers de fechas: rangos, cálculos de periodo, mes anterior…
    │   ├── files.py                # Validación, nombres y paths de archivos (imágenes)
    │   └── filters.py              # Construcción dinámica de filtros para listados

    └── main.py                     # Creación de FastAPI app + include_routers
