from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.db.supabase_client import supabase
import json
import requests

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

        apk_path = data.get("apkPath")

        if not apk_path:
            raise HTTPException(status_code=500, detail="version.json no contiene apkPath")
        
        # 2. Generar signed URL del APK
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            apk_path,
            SIGNED_URL_TTL
        )

        signed_url = signed.get("signedURL") or signed.get("signed_url")
        if not signed_url:
            raise HTTPException(status_code=500, detail="No se pudo generar la URL firmada")

        # 3. Descargar el APK desde Supabase (streaming)
        r = requests.get(signed_url, stream=True, timeout=60)
        r.raise_for_status()

        content_length = r.headers.get("Content-Length")

        headers = {
            "Content-Disposition": 'attachment; filename="GestorDeFlotas.apk"',
            "Cache-Control": "no-store",
        }

        if content_length:
            headers["Content-Length"] = content_length

        # 4. Enviar el APK al cliente
        return StreamingResponse(
            r.iter_content(chunk_size=1024 * 1024),
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