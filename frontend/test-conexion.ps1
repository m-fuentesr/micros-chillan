# Script de diagnostico de conexion
Write-Host "=== DIAGNOSTICO DE CONEXION MOVIL ===" -ForegroundColor Cyan
Write-Host ""

# Configurar variables de entorno
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$javaBin = "$env:JAVA_HOME\bin"
$androidTools = "$env:ANDROID_HOME\platform-tools"
$env:PATH = "$androidTools;$javaBin;$env:PATH"

Write-Host "1. Verificando dispositivo conectado..." -ForegroundColor Yellow
$devices = adb devices
Write-Host $devices
Write-Host ""

Write-Host "2. Verificando túnel ADB reverse..." -ForegroundColor Yellow
$reverse = adb reverse --list
if ($reverse) {
    Write-Host "✓ Túnel activo:" -ForegroundColor Green
    Write-Host $reverse
} else {
    Write-Host "✗ Túnel NO activo. Configurando..." -ForegroundColor Red
    adb reverse tcp:8000 tcp:8000
    Write-Host "✓ Túnel configurado" -ForegroundColor Green
}
Write-Host ""

Write-Host "3. Verificando backend en localhost:8000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend respondiendo:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Backend NO responde en localhost:8000" -ForegroundColor Red
    Write-Host "  Asegúrate de que el backend esté corriendo" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "4. Verificando petición OPTIONS (CORS preflight)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "authorization"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/me" -Method OPTIONS -Headers $headers -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ OPTIONS respondiendo correctamente:" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)"
    Write-Host "  Headers:"
    $response.Headers | Format-Table
} catch {
    Write-Host "✗ OPTIONS fallando:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "5. Verificando configuración de Capacitor..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.ts") {
    $config = Get-Content "capacitor.config.ts" -Raw
    if ($config -match "androidScheme.*https") {
        Write-Host "⚠ ADVERTENCIA: androidScheme está en 'https' pero usas HTTP" -ForegroundColor Yellow
        Write-Host "  Debería ser 'http' para desarrollo local" -ForegroundColor Yellow
    } elseif ($config -match "androidScheme.*http") {
        Write-Host "✓ androidScheme configurado como 'http'" -ForegroundColor Green
    }
} else {
    Write-Host "✗ No se encontró capacitor.config.ts" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== FIN DEL DIAGNOSTICO ===" -ForegroundColor Cyan

