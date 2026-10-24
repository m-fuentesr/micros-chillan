# Script para ejecutar la app Android con JAVA_HOME y Android SDK configurados
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "JAVA_HOME configurado: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "ANDROID_HOME configurado: $env:ANDROID_HOME" -ForegroundColor Green

Write-Host "`nDispositivos conectados:" -ForegroundColor Cyan
adb devices

Write-Host "`nConfigurando túnel ADB reverse (puerto 8000)..." -ForegroundColor Yellow
adb reverse tcp:8000 tcp:8000
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Túnel ADB reverse configurado correctamente" -ForegroundColor Green
    Write-Host "  El dispositivo ahora puede acceder a localhost:8000 de tu PC" -ForegroundColor Gray
} else {
    Write-Host "✗ Error al configurar túnel ADB reverse" -ForegroundColor Red
    exit 1
}

Write-Host "`nEjecutando Capacitor..." -ForegroundColor Cyan
npx cap run android

