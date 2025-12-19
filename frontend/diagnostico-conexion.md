# Diagnóstico de Conexión Móvil

## Problemas Detectados

1. **Capacitor Config con HTTPS**: `capacitor.config.ts` tiene `androidScheme: 'https'` pero estamos usando HTTP
2. **CORS en OPTIONS**: Las peticiones OPTIONS están fallando con 400 Bad Request
3. **Túnel ADB**: Necesita estar activo antes de ejecutar la app

## Soluciones Aplicadas

1. Cambiar `androidScheme` a `http` en `capacitor.config.ts`
2. Verificar que el backend maneje correctamente las peticiones OPTIONS
3. Asegurar que el túnel ADB reverse esté activo

