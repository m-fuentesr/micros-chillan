from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, StreamingResponse, Response
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

    return Response(status_code=204, headers=headers)


@router.get("/apk")
def download_apk(request: Request):
    """
    Descarga del APK actual.
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

@router.get("/download", response_class=HTMLResponse)
def download_page():
    return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Descargar aplicación – Gestor de Flotas</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&display=swap" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f3f4f6;
            color: #1e293b;
            line-height: 1.6;
        }

        .page {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            min-height: 100vh;
        }

        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 20px 16px;
            text-align: center;
        }

        .logo {
            width: 44px;
            height: 44px;
            line-height: 44px;
            background-color: #ffffff;
            color: #2563eb;
            border-radius: 10px;
            font-weight: 800;
            font-size: 22px;
            margin: 0 auto 6px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        .company {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #ffffff;
        }

        .content {
            padding: 24px 20px 32px;
        }

        h1 {
            font-size: 26px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 16px;
        }

        .intro {
            text-align: center;
            font-size: 16px;
            color: #475569;
            margin-bottom: 20px;
        }

        .cta-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #ffffff;
            text-decoration: none;
            text-align: center;
            padding: 16px;
            border-radius: 14px;
            font-size: 17px;
            font-weight: 700;
            box-shadow: 0 10px 25px rgba(59,130,246,0.35);
            margin-bottom: 10px;
        }

        .helper {
            text-align: center;
            font-size: 14px;
            color: #64748b;
            margin-bottom: 28px;
        }

        .info {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            border-radius: 10px;
            padding: 18px 16px;
            font-size: 15px;
        }

        .info strong {
            color: #1e40af;
        }

        .note {
            margin-top: 18px;
            font-size: 14px;
            color: #475569;
            text-align: center;
        }

        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
            font-size: 13px;
            color: #64748b;
        }

        @media (min-width: 600px) {
            .cta-button {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="page">
 
        <div class="header">
            <div class="logo">GF</div>
            <div class="company">GESTOR DE FLOTAS</div>
        </div>

        <div class="content">
            <h1>Descargar aplicación</h1>

            <p class="intro">
                Toca el botón para comenzar la descarga de la aplicación en tu teléfono.
            </p>

            <a href="https://micros-chillan-production.up.railway.app/api/mobile/apk" class="cta-button">
                Descargar
            </a>

            <p class="helper">
                Durante la instalación, el teléfono mostrará algunos mensajes.
                Sigue los pasos que verás más abajo.
            </p>

            <div class="info">
                <strong>Cómo instalar la aplicación:</strong><br><br>
                1. Cuando aparezca el mensaje <strong>“Archivo descargado”</strong>,
                toca <strong>“Abrir”</strong>.<br><br>
                2. Aparecerá una pantalla que dice
                <strong>“¿Deseas instalar esta app?”</strong>.
                Toca <strong>“Instalar”</strong>.<br><br> 
                3. En algunos teléfonos, aparecerá un mensaje de seguridad del sistema.
                <strong>Continúa con la instalación</strong> siguiendo los pasos que muestre el teléfono.
            </div>

            <p class="note">
                Cuando la instalación termine, podrás usar la app normalmente.
            </p>
        </div>

        <div class="footer">
            <strong>Gestor de Flotas</strong><br>
            © 2026 Empresa de Transportes
        </div>
    </div>
</body>
</html>
"""
