from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.db.supabase_client import supabase
import json

router = APIRouter(prefix="/api/mobile", tags=["mobile"])

BUCKET_NAME = "mobile-apk-releases"
VERSION_FILE_PATH = "version.json"
SIGNED_URL_TTL = 60 * 60 * 24  # 24 horas


@router.get("/apk")
def download_apk():
    """
    Descarga del APK actual.
    La versión y ruta se obtienen desde version.json.
    """
    try:
        # 1. Leer version.json desde Supabase Storage
        res = supabase.storage.from_(BUCKET_NAME).download(VERSION_FILE_PATH)

        if not res:
            raise HTTPException(
                status_code=404,
                detail="No se encontró version.json"
            )

        data = json.loads(res.decode("utf-8"))

        if "apkPath" not in data:
            raise HTTPException(
                status_code=500,
                detail="version.json no contiene apkPath"
            )

        apk_path = data["apkPath"]

        # 2. Generar signed URL del APK
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            apk_path,
            SIGNED_URL_TTL
        )

        signed_url = None
        if signed:
            signed_url = signed.get("signedURL") or signed.get("signed_url")

        if not signed_url:
            raise HTTPException(
                status_code=500,
                detail="No se pudo generar la URL firmada del APK"
            )

        # 3. Redirigir a la descarga
        return RedirectResponse(
            url=signed_url,
            status_code=307
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando descarga APK: {str(e)}"
        )