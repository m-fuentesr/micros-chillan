export function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();

  if (clean.length <= 1) return clean;

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);

  const cuerpoFormateado = cuerpo
    .replace(/^0+/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoFormateado}-${dv}`;
}

export function isValidRut(rut: string): boolean {
  const clean = rut.replace(/\./g, '').replace('-', '');
  if (clean.length < 8) return false;

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const res = 11 - (suma % 11);
  const dvCalc = res === 11 ? '0' : res === 10 ? 'K' : res.toString();

  return dv === dvCalc;
}
