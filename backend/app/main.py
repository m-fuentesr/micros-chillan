from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.users import router as usuarios_router
from app.api.test import router as test_router

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
app.include_router(test_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "MicrosChillán backend running"}
