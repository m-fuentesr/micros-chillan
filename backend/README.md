```text
Estructura del backend

backend/
└── app/
    ├── api/
    │   ├── __init__.py
    │   ├── accounting.py           # Contabilidad general
    │   │                           # /api/accounting/summary, /weeks, /settlements…
    │   ├── auth.py                 # Endpoints de autenticación (actualmente /auth/me).
    │   │                           # Podría ampliarse a login/logout si se maneja también desde backend.
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
    │   ├── users.py                # Usuarios básicos (si aplica, usado por ahora para testing)
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
    │   └── supabase_client.py      # Cliente único de Supabase para toda la app

    ├── schemas/
    │   ├── __init__.py
    │   ├── accounting.py           # Contabilidad: summary, weeks, history/periods…
    │   ├── auth.py                 # Tokens, credenciales de login
    │   ├── common.py               # Paginación, filtros, enums, rangos de fechas
    │   ├── daily_record.py         # Registro diario: creación, edición, preview-payment, my-history
    │   ├── dashboard.py            # Alertas combinadas para el dashboard
    │   ├── driver.py               # Chofer: create/update, summary, license, settlements…
    │   ├── machine.py              # Máquina: create/update, assignments, maintenances…
    │   ├── maintenance.py          # Repuestos/mantenimientos por máquina
    │   ├── report.py               # Rentabilidad, ranking bruto, agrupaciones
    │   ├── settlement.py           # Liquidaciones de choferes (confirm-payment)
    │   ├── user.py                 # Usuario básico (testing)
    │   └── worker.py               # Perfil del chofer + monthly stats

    ├── services/                   # Lógica de negocio del sistema
    │   ├── __init__.py
    │   ├── accounting_service.py   # Cálculos de resumen, semanas, liquidaciones…
    │   ├── alert_service.py        # Generación y resolución de alertas
    │   ├── dashboard_service.py    # Construcción de todas las alertas para dashboard
    │   ├── daily_record_service.py # Crear/editar registro, preview de pago, auditoría…
    │   ├── driver_service.py       # Lógica de choferes (filtros, estados de licencia…)
    │   ├── machine_service.py      # Lógica de máquinas (documentos, mantenimientos…)
    │   ├── report_service.py       # Agrupaciones, rentabilidad, ranking
    │   ├── storage_service.py      # Manejo de archivos e imágenes
    │   └── worker_service.py       # Perfil del chofer, my-history, monthly-stats

    ├── utils/
    │   ├── __init__.py
    │   ├── auth.py                 # Validación JWT con Supabase. get_current_user() + require_admin()
    │   ├── dates.py                # Rangos de fechas, períodos, fechas útiles
    │   ├── files.py                # Validación de imágenes, paths, extensiones, nombres
    │   └── filters.py              # Construcción dinámica de filtros para listados

    └── main.py                     # Creación de la app FastAPI + include_routers