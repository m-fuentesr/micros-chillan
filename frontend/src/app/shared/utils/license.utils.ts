import { DriverLicenseStatus } from '../models/driver.models';

export function formatLicenseWarningText(days?: number): string {
  if (days === undefined) {
    return 'Licencia por vencer';
  }

  if (days === 0) {
    return 'Vence hoy';
  }

  const suffix = days === 1 ? 'día' : 'días';
  return `Vence en ${days} ${suffix}`;
}

export function formatLicenseExpiredText(days?: number): string {
  if (days === undefined) {
    return 'Licencia vencida';
  }

  const absDays = Math.abs(days);
  const suffix = absDays === 1 ? 'día' : 'días';
  return `Vencida hace ${absDays} ${suffix}`;
}

export function calculateLicenseStatus(fecha: string | null | undefined, alertThreshold: number = 30): DriverLicenseStatus {
  if (!fecha) {
    return {
      fecha: null,
      estado: 'warning',
      texto: 'Sin fecha registrada'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const date = new Date(fecha);
  date.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (isNaN(diffDays)) {
    return {
      fecha,
      estado: 'error',
      texto: 'Fecha inválida'
    };
  }

  if (diffDays < 0) {
    return {
      fecha,
      estado: 'error',
      dias_restantes: Math.abs(diffDays),
      texto: formatLicenseExpiredText(diffDays)
    };
  }

  if (diffDays <= alertThreshold) {
    return {
      fecha,
      estado: 'warning',
      dias_restantes: diffDays,
      texto: formatLicenseWarningText(diffDays)
    };
  }

  return {
    fecha,
    estado: 'ok',
    dias_restantes: diffDays,
    texto: 'Al día'
  };
}

