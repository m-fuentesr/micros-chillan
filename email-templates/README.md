# Plantillas de Correo - Gestor de Flotas

Plantillas HTML profesionales para los correos del sistema, diseñadas para mantener consistencia con el diseño de la aplicación.

## 📧 Plantillas Incluidas

### 1. Bienvenida (Magic Link) - `1-bienvenida-magic-link.html`
**Uso:** Correo que se envía cuando se crea un nuevo conductor.

**Configuración en Supabase:**
1. Dashboard → Authentication → Email Templates
2. Seleccionar: **"Magic Link"**
3. Pegar el contenido de `1-bienvenida-magic-link.html`

**Variables de Supabase:**
- `{{ .ConfirmationURL }}` - URL del Magic Link para configurar cuenta

**Características:**
- Badge de bienvenida en verde
- Información de credenciales iniciales (RUT)
- Botón CTA principal: "Configurar Mi Cuenta"
- Instrucciones paso a paso
- Alternativa manual con RUT

---

### 2. Recuperación de Contraseña - `2-recuperacion-password.html`
**Uso:** Correo que se envía cuando el usuario solicita "Olvidé mi contraseña".

**Configuración en Supabase:**
1. Dashboard → Authentication → Email Templates
2. Seleccionar: **"Reset Password"** o **"Change Email"**
3. Pegar el contenido de `2-recuperacion-password.html`

**Variables de Supabase:**
- `{{ .ConfirmationURL }}` - URL de recuperación de contraseña

**Características:**
- Badge de alerta en naranja
- Advertencia de validez (1 hora)
- Botón CTA principal: "Restablecer Mi Contraseña"
- Consejos de seguridad
- Advertencia si no solicitó el cambio

---

## 🎨 Diseño

Las plantillas están inspiradas en el diseño de Gestor de Flotas:

- **Logo:** "GF" con fondo blanco y texto azul
- **Tipografía:** Barlow (800 para logo, 700 para títulos, 400-600 para contenido)
- **Colores principales:**
  - Primary: `#3b82f6` → `#2563eb` (gradiente azul)
  - Success: `#22c55e` → `#16a34a` (gradiente verde)
  - Warning: `#f59e0b` → `#d97706` (gradiente naranja)
  - Error: `#ef4444` → `#dc2626` (gradiente rojo)
- **Efectos:**
  - Patrón de grilla en header
  - Gradientes suaves
  - Sombras sutiles
  - Animación de pulso en indicador de estado
  - Responsive para móviles

---

## 📝 Instrucciones de Uso

### Paso 1: Copiar el contenido
1. Abre el archivo HTML correspondiente
2. Copia **todo el contenido** (Ctrl+A, Ctrl+C)

### Paso 2: Configurar en Supabase
1. Accede a tu Dashboard de Supabase
2. Ve a: **Authentication** → **Email Templates**
3. Selecciona la plantilla correspondiente:
   - Para bienvenida: **"Magic Link"**
   - Para recuperación: **"Reset Password"**
4. Pega el contenido completo en el editor
5. Haz clic en **"Save"** o **"Update"**

### Paso 3: Probar
1. Crea un nuevo conductor (para probar bienvenida)
2. O solicita recuperación de contraseña (para probar recuperación)
3. Verifica que el correo se vea correctamente

---

## ⚙️ Personalización

Si necesitas personalizar las plantillas, estos son los elementos principales:

### Información de Contacto
Busca y reemplaza:
```
techsolutions@soporte.cl
```
Por tu correo de soporte real.

### Nombre de la Empresa
Busca y reemplaza:
```
Empresa de Transportes
```
Por el nombre real de tu empresa.

### Logo
Si quieres cambiar "GF", busca:
```html
<div class="logo">GF</div>
```
Y reemplaza por las iniciales que prefieras.

### Colores
Los colores principales están definidos en varios lugares:
- Header: `background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);`
- Botones: Igual que el header
- Badge bienvenida: `linear-gradient(135deg, #22c55e 0%, #16a34a 100%)`
- Badge alerta: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`

---

## 🧪 Testing

### Probar en Navegador
1. Abre el archivo HTML directamente en tu navegador
2. Verifica que se vea correctamente
3. Prueba el responsive (Ctrl+Shift+M en Chrome/Firefox)

### Probar en Cliente de Correo
1. Envíate un correo de prueba desde Supabase
2. Verifica en diferentes clientes:
   - Gmail (web y móvil)
   - Outlook
   - Apple Mail
   - Otros que uses

---

## 📱 Soporte Responsive

Las plantillas son responsive y se adaptan a:
- Desktop (600px+)
- Tablet (480px - 600px)
- Móvil (< 480px)

Los elementos se ajustan automáticamente:
- Padding reducido en móvil
- Títulos más pequeños
- Botones a ancho completo
- Texto y espaciado optimizado

---

## 🔒 Seguridad

Las plantillas incluyen:
- ✅ Variables seguras de Supabase (`{{ .ConfirmationURL }}`)
- ✅ Enlaces con HTTPS
- ✅ Sin JavaScript (mejor compatibilidad)
- ✅ Sin recursos externos (excepto Google Fonts)
- ✅ Advertencias de seguridad claras

---

## 📞 Soporte

Si tienes problemas con las plantillas:
1. Verifica que copiaste todo el contenido (incluyendo `<!DOCTYPE html>`)
2. Asegúrate de estar en la plantilla correcta en Supabase
3. Prueba primero en navegador antes de enviar correos
4. Revisa los logs de Supabase para errores de envío

---

## 🎯 Checklist de Configuración

- [ ] Correo de bienvenida configurado en "Magic Link"
- [ ] Correo de recuperación configurado en "Reset Password"
- [ ] Email de soporte actualizado en ambas plantillas
- [ ] Nombre de empresa actualizado
- [ ] URL de redirección configurada en Supabase (`FRONTEND_URL`)
- [ ] URLs de redirección agregadas en Supabase (Authentication → URL Configuration)
- [ ] Correo de prueba enviado y verificado
- [ ] Responsive probado en móvil

---

## 📄 Licencia

Plantillas creadas para Gestor de Flotas - Uso interno del proyecto.

© 2025 Empresa de Transportes

