from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
import json

router = APIRouter(prefix="/api/updates", tags=["updates"])

BUCKET_NAME = "mobile-apk-releases"
VERSION_FILE_PATH = "version.json"


@router.get("/check")
def check_update():
    """
    Retorna la información de la última versión disponible.
    """
    try:
        res = supabase.storage.from_(BUCKET_NAME).download(VERSION_FILE_PATH)

        if not res:
            raise HTTPException(
                status_code=404,
                detail="No se encontró información de versión"
            )

        data = json.loads(res.decode("utf-8"))

        required_fields = {"version", "build", "apkPath", "forceUpdate", "releaseNotes"}
        if not required_fields.issubset(data.keys()):
            raise HTTPException(
                status_code=500,
                detail="version.json incompleto o mal formado"
            )

        return {
            "version": data["version"],
            "build": data["build"],
            "forceUpdate": data["forceUpdate"],
            "releaseNotes": data["releaseNotes"],
            # Nunca exponer Supabase directo
            "downloadUrl": "/api/mobile/apk"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error consultando versión: {str(e)}"
        )
