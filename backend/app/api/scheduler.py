from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.cron_service import check_missing_daily_records
from zoneinfo import ZoneInfo

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Definimos la zona horaria Chile
    chile_tz = ZoneInfo("America/Santiago")

    # --- JOB 1: Alerta al Chofer (23:00 Hoy) ---
    scheduler.add_job(
        check_missing_daily_records,
        trigger=CronTrigger(hour=23, minute=0, timezone=chile_tz),
        args=['chofer'],
        id="alerta_chofer_faltante",
        name="Revisar registros faltantes para avisar al chofer",
        replace_existing=True
    )

    # --- JOB 2: Alerta al Admin (08:00 Mañana) ---
    # Nota: La función internamente sabe que si recibe 'admin', debe revisar 'ayer'.
    scheduler.add_job(
        check_missing_daily_records,
        trigger=CronTrigger(hour=8, minute=0, timezone=chile_tz),
        args=['admin'],
        id="alerta_admin_faltante",
        name="Avisar al admin sobre registros faltantes de ayer",
        replace_existing=True
    )

    scheduler.start()
    print("Planificador de tareas (Cron) iniciado correctamente [Zona: Chile].")