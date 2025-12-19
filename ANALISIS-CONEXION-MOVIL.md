# Análisis Extenso de Conexión Móvil - Problemas y Soluciones

## 🔍 Problemas Detectados

### 1. **Capacitor Config con HTTPS** ❌
- **Problema**: `capacitor.config.ts` tenía `androidScheme: 'https'` pero estamos usando HTTP
- **Impacto**: Android bloquea conexiones HTTP cuando el esquema está configurado como HTTPS
- **Solución**: ✅ Cambiado a `androidScheme: 'http'`

### 2. **CORS en Peticiones OPTIONS** ❌
- **Problema**: Las peticiones preflight OPTIONS estaban fallando con 400 Bad Request
- **Causa**: FastAPI necesita manejar explícitamente los métodos OPTIONS
- **Solución**: ✅ Agregado `OPTIONS` explícitamente en `allow_methods` y `expose_headers`

### 3. **Túnel ADB Reverse** ⚠️
- **Problema**: El túnel puede no estar activo al iniciar la app
- **Solución**: ✅ Script `run-android.ps1` ahora configura el túnel automáticamente

### 4. **Configuración de Environment** ✅
- **Estado**: Correctamente configurado para usar `localhost:8000` cuando está en Capacitor
- **Nota**: Funciona con `adb reverse` que mapea el puerto del dispositivo a tu PC

## ✅ Cambios Aplicados

### Frontend (`frontend/`)

1. **capacitor.config.ts**
   ```typescript
   server: {
     androidScheme: 'http' // Cambiado de 'https' a 'http'
   }
   ```

2. **environment.development.ts**
   - Ya estaba configurado correctamente para usar `localhost:8000` en Capacitor
   - Detecta automáticamente si está en Capacitor

3. **run-android.ps1**
   - Ahora configura automáticamente el túnel ADB reverse antes de ejecutar

### Backend (`backend/`)

1. **main.py - CORS Middleware**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # OPTIONS agregado
       allow_headers=["*"],
       expose_headers=["*"],  # Agregado
   )
   ```

## 📋 Checklist de Verificación

Antes de ejecutar la app, verifica:

- [ ] Backend corriendo en `localhost:8000`
- [ ] Dispositivo Android conectado por USB
- [ ] Depuración USB habilitada en el dispositivo
- [ ] Túnel ADB reverse activo: `adb reverse tcp:8000 tcp:8000`
- [ ] Build de Angular ejecutado: `npm run build -- --configuration=development`
- [ ] Capacitor sincronizado: `npx cap sync`

## 🚀 Cómo Ejecutar

### Opción 1: Script Automático (Recomendado)
```powershell
cd frontend
.\run-android.ps1
```

### Opción 2: Manual
```powershell
cd frontend

# Configurar variables de entorno
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:JAVA_HOME\bin;$env:PATH"

# Configurar túnel ADB
adb reverse tcp:8000 tcp:8000

# Ejecutar app
npx cap run android
```

## 🔧 Diagnóstico de Problemas

Si aún hay problemas de conexión:

1. **Verificar túnel ADB**:
   ```powershell
   adb reverse --list
   ```
   Debe mostrar: `tcp:8000 tcp:8000`

2. **Verificar backend**:
   ```powershell
   curl http://localhost:8000
   ```
   Debe responder con: `{"message": "MicrosChillán backend running"}`

3. **Verificar desde el dispositivo**:
   ```powershell
   adb shell
   curl http://localhost:8000
   ```
   Debe responder igual que desde tu PC

4. **Verificar logs del backend**:
   - Busca errores 400 en peticiones OPTIONS
   - Verifica que CORS esté respondiendo correctamente

## 📝 Notas Importantes

1. **Túnel ADB**: Se mantiene activo mientras el dispositivo esté conectado. Si desconectas y vuelves a conectar, ejecuta `adb reverse tcp:8000 tcp:8000` nuevamente.

2. **CORS**: El backend ahora permite todos los orígenes (`*`) solo para desarrollo. En producción, debes especificar los orígenes permitidos.

3. **HTTP vs HTTPS**: Para desarrollo local, HTTP está bien. En producción, necesitarás HTTPS y certificados SSL.

4. **AndroidManifest.xml**: Ya tiene `android:usesCleartextTraffic="true"` configurado, lo cual es necesario para HTTP.

## 🎯 Próximos Pasos

1. Reiniciar el backend para aplicar los cambios de CORS
2. Ejecutar la app usando `.\run-android.ps1`
3. Probar el login desde el dispositivo
4. Verificar los logs del backend para confirmar que las peticiones llegan correctamente

