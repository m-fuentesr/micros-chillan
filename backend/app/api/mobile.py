from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
from app.db.supabase_client import supabase
import json
import requests
import os

router = APIRouter(prefix="/api/mobile", tags=["mobile"])

BUCKET_NAME = "mobile-apk-releases"
VERSION_FILE_PATH = "version.json"
SIGNED_URL_TTL = 60 * 60 * 24  # 24 horas


def _get_signed_url() -> tuple[str, str]:
    res = supabase.storage.from_(BUCKET_NAME).download(VERSION_FILE_PATH)
    if not res:
        raise HTTPException(status_code=404, detail="No se encontró version.json")

    data = json.loads(res.decode("utf-8"))
    apk_path = data.get("apkPath")
    if not apk_path:
        raise HTTPException(status_code=500, detail="version.json no contiene apkPath")

    signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(apk_path, SIGNED_URL_TTL)
    signed_url = (signed or {}).get("signedURL") or (signed or {}).get("signed_url")
    if not signed_url:
        raise HTTPException(status_code=500, detail="No se pudo generar la URL firmada del APK")

    filename = os.path.basename(apk_path) or "app.apk"
    return signed_url, filename


@router.head("/apk")
def head_apk():
    """
    HEAD para que Gmail/DownloadManager pueda inspeccionar tamaño/rangos.
    """
    signed_url, filename = _get_signed_url()

    r = requests.head(signed_url, timeout=30, allow_redirects=True)
    r.raise_for_status()

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/vnd.android.package-archive",
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
    }

    # Pasar Content-Length si viene
    if r.headers.get("Content-Length"):
        headers["Content-Length"] = r.headers["Content-Length"]

    # Importante: algunos clientes “cierran” mejor con esto
    headers["Connection"] = "close"

    return Response(status_code=200, headers=headers)


@router.get("/apk")
def download_apk(request: Request):
    """
    GET con soporte de Range (crítico para Gmail/Android DownloadManager).
    """
    signed_url, filename = _get_signed_url()

    range_header = request.headers.get("range")  # ej: "bytes=0-"
    upstream_headers = {}
    if range_header:
        upstream_headers["Range"] = range_header

    r = requests.get(
        signed_url,
        headers=upstream_headers,
        stream=True,
        timeout=120,
        allow_redirects=True,
    )
    r.raise_for_status()

    # Preparar headers de respuesta (passthrough de lo importante)
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/vnd.android.package-archive",
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
        "Connection": "close",
    }

    # Si el upstream responde 206, normalmente trae Content-Range
    if r.headers.get("Content-Range"):
        headers["Content-Range"] = r.headers["Content-Range"]

    # Content-Length del fragmento o total (según 200/206)
    if r.headers.get("Content-Length"):
        headers["Content-Length"] = r.headers["Content-Length"]

    status_code = r.status_code  # 200 o 206

    return StreamingResponse(
        r.iter_content(chunk_size=1024 * 1024),
        status_code=status_code,
        media_type="application/vnd.android.package-archive",
        headers=headers,
    )
