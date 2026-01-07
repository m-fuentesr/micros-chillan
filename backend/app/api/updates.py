from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json

router = APIRouter(prefix="/updates", tags=["Updates"])

# Ruta local al archivo version.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPDATES_FOLDER = os.path.join(BASE_DIR, "static", "updates")

class UpdateInfo(BaseModel):
    version: str
    build: int
    url: str
    forceUpdate: bool
    releaseNotes: str

@router.get("/check", response_model=UpdateInfo)
async def check_update():
    """
    Retorna la información de la última versión disponible.
    La URL de descarga apuntará a Supabase Storage u otra fuente externa.
    """
    version_file = os.path.join(UPDATES_FOLDER, "version.json")
    if not os.path.exists(version_file):
        # Valor por defecto si no existe configuración
        return {
            "version": "0.0.0",
            "build": 0,
            "url": "",
            "forceUpdate": False,
            "releaseNotes": "No hay información de actualización disponible."
        }
    
    try:
        with open(version_file, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading version file: {str(e)}")
