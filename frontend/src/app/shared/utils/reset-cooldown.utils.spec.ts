import {
  RESET_COOLDOWN_MS,
  formatCooldown,
  getResetCooldownRemaining,
  recordResetSent,
} from './reset-cooldown.utils';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe('reset-cooldown.utils', () => {
  const t0 = 1_000_000;
  let storage: MemoryStorage;

  beforeEach(() => (storage = new MemoryStorage()));

  it('sin envíos previos se puede pedir', () => {
    expect(getResetCooldownRemaining('ruben@gmail.com', t0, storage)).toBe(0);
  });

  it('bloquea el mismo correo durante 5 minutos', () => {
    recordResetSent('ruben@gmail.com', t0, storage);
    expect(getResetCooldownRemaining('ruben@gmail.com', t0 + 1000, storage)).toBe(
      RESET_COOLDOWN_MS - 1000
    );
    expect(getResetCooldownRemaining('ruben@gmail.com', t0 + RESET_COOLDOWN_MS, storage)).toBe(0);
  });

  it('no distingue mayúsculas ni espacios', () => {
    recordResetSent(' Ruben@Gmail.com ', t0, storage);
    expect(getResetCooldownRemaining('ruben@gmail.com', t0, storage)).toBeGreaterThan(0);
  });

  it('otro correo (p. ej. corregido) no queda bloqueado', () => {
    recordResetSent('rubn@gmail.com', t0, storage);
    expect(getResetCooldownRemaining('ruben@gmail.com', t0, storage)).toBe(0);
  });

  it('tolera datos corruptos o sin almacenamiento', () => {
    storage.setItem('recuperar_clave_envios', 'no-es-json');
    expect(getResetCooldownRemaining('ruben@gmail.com', t0, storage)).toBe(0);
    expect(getResetCooldownRemaining('ruben@gmail.com', t0, undefined)).toBe(0);
    expect(() => recordResetSent('ruben@gmail.com', t0, undefined)).not.toThrow();
  });

  it('formatea la cuenta regresiva', () => {
    expect(formatCooldown(RESET_COOLDOWN_MS)).toBe('5:00');
    expect(formatCooldown(245_000)).toBe('4:05');
    expect(formatCooldown(400)).toBe('0:01');
  });
});
