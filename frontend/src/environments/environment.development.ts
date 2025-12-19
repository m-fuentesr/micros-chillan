// Configuración para desarrollo móvil
// Detectar si estamos en Capacitor (móvil)
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

// Determinar la URL del backend:
// - Web (navegador): localhost
// - Emulador Android: 10.0.2.2 (IP especial del emulador)
// - Dispositivo físico Android con USB: localhost (usa adb reverse tcp:8000 tcp:8000)
// - Dispositivo físico Android con WiFi: IP local de tu PC
let apiBaseUrl: string;
if (!isCapacitor) {
  // Navegador web
  apiBaseUrl = 'http://localhost:8000';
} else {
  // Dispositivo móvil - usar localhost porque adb reverse crea un túnel
  // IMPORTANTE: Ejecuta 'adb reverse tcp:8000 tcp:8000' antes de ejecutar la app
  // Esto mapea el puerto 8000 del dispositivo hacia localhost:8000 de tu PC
  apiBaseUrl = 'http://localhost:8000';
}

export const environment = {
  production: false,
  apiBaseUrl,
  supabaseUrl: 'https://whakzffihcapzrlqjdgp.supabase.co',
  supabaseAnonKey: 'sb_publishable_wx0hxbnkkUgw_BETDIQX-Q_7LUIAFKA',
};
