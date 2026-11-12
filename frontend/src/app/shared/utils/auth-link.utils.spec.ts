import { isAuthLinkError } from './auth-link.utils';

describe('isAuthLinkError', () => {
  it('detecta el enlace vencido o ya usado que devuelve Supabase en el #', () => {
    expect(
      isAuthLinkError(
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
        ''
      )
    ).toBeTrue();
  });

  it('detecta el error cuando viene como query param', () => {
    expect(isAuthLinkError('', '?error=access_denied&error_description=Invalid')).toBeTrue();
  });

  it('no se activa con un enlace de recuperación válido', () => {
    expect(
      isAuthLinkError('#access_token=abc&refresh_token=def&type=recovery&expires_in=3600', '')
    ).toBeFalse();
  });

  it('no se activa en URLs normales de la app', () => {
    expect(isAuthLinkError('', '')).toBeFalse();
    expect(isAuthLinkError('', '?redirectTo=%2Ftrabajador')).toBeFalse();
  });
});
