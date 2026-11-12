/**
 * Espera entre solicitudes de enlace de recuperación ("¿Olvidaste tu clave?").
 *
 * Cada correo nuevo anula los anteriores; si un chofer pide varios seguidos se
 * confunde con cuál sirve. Se bloquea pedir otro para el MISMO correo durante
 * RESET_COOLDOWN_MS en este navegador. Es por correo porque Supabase no avisa si
 * un correo no existe: quien lo escribió mal debe poder corregirlo de inmediato.
 * No es un control de seguridad (para eso está el límite propio de Supabase).
 */
export const RESET_COOLDOWN_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'recuperar_clave_envios';

type SendLog = Record<string, number>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readLog(storage: Storage | undefined): SendLog {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Milisegundos que faltan para poder pedir otro enlace a este correo (0 = puede). */
export function getResetCooldownRemaining(
  email: string,
  now: number,
  storage: Storage | undefined = safeLocalStorage()
): number {
  const sentAt = readLog(storage)[normalizeEmail(email)];
  if (typeof sentAt !== 'number') return 0;
  return Math.max(0, sentAt + RESET_COOLDOWN_MS - now);
}

/** Registra un envío exitoso. Descarta entradas ya vencidas. */
export function recordResetSent(
  email: string,
  now: number,
  storage: Storage | undefined = safeLocalStorage()
): void {
  const log = readLog(storage);
  for (const key of Object.keys(log)) {
    if (typeof log[key] !== 'number' || log[key] + RESET_COOLDOWN_MS <= now) delete log[key];
  }
  log[normalizeEmail(email)] = now;
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): simplemente no hay espera.
  }
}

/** "4:05" */
export function formatCooldown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}
