/**
 * Enlaces de correo de Supabase (recuperación de clave, bienvenida) rechazados.
 *
 * Cada enlace sirve una sola vez y el último enviado anula los anteriores. Si el
 * chofer abre uno usado, anulado o vencido, Supabase redirige con el error en la
 * URL (p. ej. `#error=access_denied&error_code=otp_expired&error_description=...`).
 * La raíz redirige a /login y el router descarta el `#`, así que el chofer caía en
 * el login sin ninguna explicación.
 */
export const INVALID_LINK_URL = '/restablecer-clave?enlace=invalido';

export function isAuthLinkError(hash: string, search: string): boolean {
  for (const raw of [hash, search]) {
    const params = new URLSearchParams(raw.replace(/^[#?]/, ''));
    if (params.has('error_code') || (params.has('error') && params.has('error_description'))) {
      return true;
    }
  }
  return false;
}

/**
 * Se llama antes de iniciar Angular: si la URL trae el error de un enlace de
 * correo, la reemplaza por la pantalla "Enlace inválido o expirado".
 */
export function redirectInvalidAuthLink(): void {
  if (typeof window === 'undefined') return;
  const { hash, search } = window.location;
  if (isAuthLinkError(hash, search)) {
    window.history.replaceState(null, '', INVALID_LINK_URL);
  }
}
