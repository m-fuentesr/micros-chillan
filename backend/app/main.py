from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.scheduler import start_scheduler
# Importar los routers
from app.api.auth import router as auth_router
from app.api.alerts import router as alerts_router
from app.api.accounting import router as accounting_router
from app.api.daily_records import router as daily_records_router
from app.api.dashboard import router as dashboard_router
from app.api.drivers import router as drivers_router
from app.api.machines import router as machines_router
from app.api.maintenances import router as maintenances_router
from app.api.reports import router as reports_router
from app.api.users import router as users_router
from app.api.test import router as test_router
from app.api.worker import router as worker_router
from app.api.settings import router as settings_router
from app.api.storage import router as storage_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- CÓDIGO DE INICIO ---
    print("🚀 Iniciando servicios de fondo (Scheduler)...")
    start_scheduler()
    
    yield  # La aplicación corre aquí
    
    # --- CÓDIGO DE CIERRE (Opcional) ---
    # Aquí podrías poner scheduler.shutdown() si fuera necesario
    print("🛑 Apagando servicios...")

app = FastAPI(title="MicrosChillán Backend", lifespan=lifespan)

import os

# CORS para permitir llamadas desde Angular (localhost:4200)
origins = [
    "http://localhost:4200",
    "https://micros-chillan.vercel.app",
    "https://micros-chillan-mfuentesrs-projects.vercel.app",
    "https://gestordeflotas.aiondevs.cl"
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir los routers
app.include_router(auth_router)
app.include_router(alerts_router)
app.include_router(accounting_router)
app.include_router(daily_records_router)
app.include_router(dashboard_router)
app.include_router(drivers_router)
app.include_router(machines_router)
app.include_router(maintenances_router)
app.include_router(reports_router)
app.include_router(worker_router)
app.include_router(users_router)
app.include_router(test_router)
app.include_router(settings_router)
app.include_router(storage_router)

# Ruta principal
@app.get("/")
def root():
    return {"message": "MicrosChillán backend running"}
