import { DocumentStatus } from '../models/machine.models';

export function calculateDocumentStatus(fecha: string | null | undefined, alertThreshold: number = 10): DocumentStatus {
  if (!fecha) {
    return {
      fecha: null,
      estado: 'error',
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
      texto: `Vencido hace ${Math.abs(diffDays)} días`
    };
  }

  if (diffDays <= alertThreshold) {
    return {
      fecha,
      estado: 'warning',
      dias_restantes: diffDays,
      texto: `Vence en ${diffDays} días`
    };
  }

  return {
    fecha,
    estado: 'ok',
    dias_restantes: diffDays,
    texto: 'Al día'
  };
}

export function calculateMachineDocumentStatus(machine: {
  documentos?: {
    revision_tecnica?: string | null;
    permiso_circulacion?: string | null;
    seguro_obligatorio?: string | null;
  };
}, alertThreshold: number = 10): {
  revision_tecnica?: DocumentStatus;
  permiso_circulacion?: DocumentStatus;
  seguro_obligatorio?: DocumentStatus;
} {
  const docs = machine.documentos || {};
  return {
    revision_tecnica: docs.revision_tecnica ? calculateDocumentStatus(docs.revision_tecnica, alertThreshold) : undefined,
    permiso_circulacion: docs.permiso_circulacion ? calculateDocumentStatus(docs.permiso_circulacion, alertThreshold) : undefined,
    seguro_obligatorio: docs.seguro_obligatorio ? calculateDocumentStatus(docs.seguro_obligatorio, alertThreshold) : undefined
  };
}

