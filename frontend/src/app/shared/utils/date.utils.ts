/**
 * Utilidades para manejo de fechas con zona horaria de Chile
 */

const CHILE_TIMEZONE = 'America/Santiago';

/**
 * Obtiene solo la parte de la fecha (aÃ±o, mes, dÃ­a) en zona horaria de Chile
 * Retorna un objeto con { year, month, day } para comparaciones precisas
 */
export function getDatePartsInChile(dateInput: string | Date): { year: number; month: number; day: number } {
  let date: Date;
  
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    if (!dateInput) {
      date = new Date();
    } else {
      let dateStr = dateInput.trim();
      
      // Si la fecha viene solo como "YYYY-MM-DD" (sin hora), interpretarla directamente
      // como fecha en Chile, retornando directamente esos valores
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Es una fecha sin hora del backend, retornar directamente
        const [year, month, day] = dateStr.split('-').map(Number);
        return { year, month, day };
      }
      
      // Es una fecha con hora, agregar 'Z' si no tiene timezone
      if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        dateStr = dateStr + 'Z';
      }
      date = new Date(dateStr);
    }
  }
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    return { year: 0, month: 0, day: 0 };
  }
  
  // Obtener la fecha en zona horaria de Chile usando toLocaleDateString
  const chileDateString = date.toLocaleDateString('en-CA', {
    timeZone: CHILE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parsear formato YYYY-MM-DD
  const [year, month, day] = chileDateString.split('-').map(Number);
  
  return { year, month, day };
}

/**
 * Obtiene la fecha de hoy en zona horaria de Chile (solo fecha, sin hora)
 */
export function getTodayInChile(): { year: number; month: number; day: number } {
  return getDatePartsInChile(new Date());
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD en zona horaria de Chile
 * Ãštil para inputs de tipo date que necesitan la fecha local sin conversiÃ³n UTC
 */
export function getTodayStringInChile(): string {
  const today = getTodayInChile();
  const year = today.year;
  const month = String(today.month).padStart(2, '0');
  const day = String(today.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de ayer en zona horaria de Chile (solo fecha, sin hora)
 */
export function getYesterdayInChile(): { year: number; month: number; day: number } {
  const today = getTodayInChile();
  const todayDate = new Date(today.year, today.month - 1, today.day);
  todayDate.setDate(todayDate.getDate() - 1);
  return {
    year: todayDate.getFullYear(),
    month: todayDate.getMonth() + 1,
    day: todayDate.getDate()
  };
}

/**
 * Calcula la diferencia en dÃ­as entre dos fechas en zona horaria de Chile
 * Compara solo las fechas (sin horas)
 */
export function getDaysDifferenceInChile(dateString1: string | Date, dateString2: string | Date = new Date()): number {
  const date1 = getDatePartsInChile(dateString1);
  const date2 = getDatePartsInChile(dateString2);
  
  // Crear fechas en UTC para comparar solo la parte de la fecha
  const d1 = new Date(Date.UTC(date1.year, date1.month - 1, date1.day));
  const d2 = new Date(Date.UTC(date2.year, date2.month - 1, date2.day));
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Convierte una fecha a la zona horaria de Chile (America/Santiago)
 * para comparaciones correctas de fechas relativas
 */
export function getDateInChileTime(dateString: string | Date): Date {
  const parts = getDatePartsInChile(dateString);
  // Crear una fecha en UTC con los valores de Chile para evitar problemas de zona horaria
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

/**
 * Formatea una fecha relativa (Hoy, Ayer, Hace X dÃ­as) considerando zona horaria de Chile
 */
export function formatRelativeDate(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }
  
  const diffDays = getDaysDifferenceInChile(dateString);
  
  if (diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays > 1 && diffDays < 7) {
    return `Hace ${diffDays} dÃ­as`;
  } else {
    // Para fechas mÃ¡s antiguas, mostrar la fecha formateada
    let date: Date;
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      let dateStr = dateString.trim();
      if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        dateStr = dateStr + 'Z';
      }
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString('es-CL', {
      timeZone: CHILE_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}


/**
 * Formatea una fecha en formato corto DD-MM-YYYY considerando zona horaria de Chile
 * Ãštil para mostrar fechas en tablas y listas
 */
export function formatDateShort(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }
  
  const parts = getDatePartsInChile(dateString);
  
  if (parts.year === 0 && parts.month === 0 && parts.day === 0) {
    return '';
  }
  
  const day = String(parts.day).padStart(2, '0');
  const month = String(parts.month).padStart(2, '0');
  const year = parts.year;
  return `${day}-${month}-${year}`;
}

/**
 * Formatea una fecha con hora en formato completo considerando zona horaria de Chile
 * Ãštil para mostrar fechas con hora en modales y detalles
 */
export function formatDateWithTime(dateString: string | Date): string {
  if (!dateString) {
    return '';
  }
  
  let date: Date;
  if (dateString instanceof Date) {
    date = dateString;
  } else {
    let dateStr = dateString.trim();
    if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      dateStr = dateStr + 'Z';
    }
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleString('es-CL', {
    timeZone: CHILE_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
