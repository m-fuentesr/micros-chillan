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

@router.get("/download", response_class=HTMLResponse)
def download_page():
    return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descargar Gestor de Flotas</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Barlow', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f3f4f6;
            color: #1e293b;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        .page {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            min-height: 100vh;
        }

        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
            background-size: 40px 40px;
            opacity: .5;
        }

        .logo {
            position: relative;
            z-index: 1;
            width: 56px;
            height: 56px;
            line-height: 56px;
            margin: 0 auto 12px;
            background: #ffffff;
            color: #3b82f6;
            border-radius: 12px;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,.15);
        }

        .company {
            position: relative;
            z-index: 1;
            color: #ffffff;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 17px;
        }

        .content {
            padding: 40px 30px;
            text-align: center;
        }

        h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 16px;
        }

        p {
            color: #64748b;
            margin-bottom: 24px;
            font-size: 16px;
        }

        .info {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            text-align: left;
            margin-bottom: 30px;
        }

        .info strong {
            color: #1e3a8a;
        }

        .cta {
            display: block;
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #ffffff;
            font-weight: 700;
            font-size: 16px;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(59,130,246,.35);
        }

        .cta:active {
            transform: scale(.98);
        }

        .note {
            margin-top: 20px;
            font-size: 14px;
            color: #64748b;
        }

        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
            font-size: 13px;
            color: #64748b;
        }
    </style>
</head>

<body>
    <div class="page">
        <div class="header">
            <div class="logo">GF</div>
            <div class="company">Gestor de Flotas</div>
        </div>

        <div class="content">
            <h1>Descargar aplicación</h1>
            <p>
                Para instalar la aplicación en tu teléfono, toca el botón.
                El archivo se abrirá en tu navegador.
            </p>

            <div class="info">
                <strong>Importante:</strong><br>
                Si tu teléfono pregunta con qué app abrir, elige <strong>Chrome</strong>.
            </div>

            <a class="cta" href="/api/mobile/apk">
                Descargar APK
            </a>

            <p class="note">
                Si la descarga no comienza automáticamente, asegúrate de permitir descargas en tu navegador.
            </p>
        </div>

        <div class="footer">
            <strong>Gestor de Flotas</strong><br>
            © 2025 Empresa de Transportes
        </div>
    </div>
</body>
</html>
"""
