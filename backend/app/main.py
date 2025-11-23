from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.test import router as test_router

from app.api.auth import router as auth_router
from app.api.usuarios import router as usuarios_router
from app.api.roles import router as roles_router
from app.api.choferes import router as choferes_router
from app.api.maquinas import router as maquinas_router
from app.api.asignaciones import router as asignaciones_router
from app.api.registros_diarios import router as registros_router
from app.api.liquidaciones import router as liquidaciones_router
from app.api.cierres_mensuales import router as cierres_router
from app.api.alertas import router as alertas_router
from app.api.configuracion_general import router as configuracion_general_router

app = FastAPI()

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

app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(choferes_router, prefix="/api")
app.include_router(maquinas_router, prefix="/api")
app.include_router(asignaciones_router, prefix="/api")
app.include_router(registros_router, prefix="/api")
app.include_router(liquidaciones_router, prefix="/api")
app.include_router(cierres_router, prefix="/api")
app.include_router(alertas_router, prefix="/api")
app.include_router(configuracion_general_router, prefix="/api")
app.include_router(test_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "MicrosChillán backend running"}
