from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import os
import httpx
import json

from app.db.supabase_client import supabase


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

        filename = os.path.basename(apk_path)

        response = httpx.get(signed_url)
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="No se pudo descargar el APK desde Supabase"
            )

        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"'
        }

        # 3. Descargar y servir el APK
        return Response(
            content=response.content,
            media_type="application/vnd.android.package-archive",
            headers=headers
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando descarga APK: {str(e)}"
        )
