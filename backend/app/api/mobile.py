from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.db.supabase_client import supabase
import httpx
import json
import os

router = APIRouter(prefix="/api/mobile", tags=["mobile"])

BUCKET_NAME = "mobile-apk-releases"
VERSION_FILE_PATH = "version.json"
SIGNED_URL_TTL = 60 * 60 * 24  # 24 horas


@router.get("/apk")
async def download_apk():
    try:
        # 1. Leer version.json
        res = supabase.storage.from_(BUCKET_NAME).download(VERSION_FILE_PATH)
        if not res:
            raise HTTPException(404, "No se encontró version.json")

        data = json.loads(res.decode("utf-8"))
        apk_path = data.get("apkPath")
        if not apk_path:
            raise HTTPException(500, "version.json no contiene apkPath")

        # 2. Signed URL
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            apk_path,
            SIGNED_URL_TTL
        )
        signed_url = signed.get("signedURL") or signed.get("signed_url")
        if not signed_url:
            raise HTTPException(500, "No se pudo generar signed URL")

        filename = os.path.basename(apk_path)

        # 3. Stream desde Supabase
        async with httpx.AsyncClient() as client:
            upstream = await client.get(signed_url, stream=True)
            if upstream.status_code != 200:
                raise HTTPException(502, "No se pudo descargar el APK desde Supabase")

            headers = {
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff"
            }

            return StreamingResponse(
                upstream.aiter_bytes(),
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
