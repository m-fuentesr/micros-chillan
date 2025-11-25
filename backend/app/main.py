from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar los routers
from app.api.auth import router as auth_router
from app.api.accounting import router as accounting_router
from app.api.daily_records import router as daily_records_router
from app.api.dashboard import router as dashboard_router
from app.api.drivers import router as drivers_router
from app.api.machines import router as machines_router
from app.api.reports import router as reports_router
from app.api.users import router as users_router
from app.api.test import router as test_router
from app.api.worker import router as worker_router

app = FastAPI(title="MicrosChillán Backend")

# CORS para permitir llamadas desde Angular (localhost:4200)
origins = [
    "http://localhost:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir los routers
app.include_router(auth_router)
app.include_router(accounting_router)
app.include_router(daily_records_router)
app.include_router(dashboard_router)
app.include_router(drivers_router)
app.include_router(machines_router)
app.include_router(reports_router)
app.include_router(worker_router)
app.include_router(users_router)
app.include_router(test_router)

# Ruta principal
@app.get("/")
def root():
    return {"message": "MicrosChillán backend running"}
