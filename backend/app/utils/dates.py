"""
Utilidades para manejo de fechas con zona horaria de Chile
"""
from datetime import date, datetime
from zoneinfo import ZoneInfo

CHILE_TIMEZONE = ZoneInfo('America/Santiago')

def get_today_in_chile() -> date:
    """
    Obtiene la fecha de hoy en zona horaria de Chile.
    Útil para comparaciones correctas cuando el servidor puede estar en otra zona horaria.
    """
    chile_now = datetime.now(CHILE_TIMEZONE)
    return chile_now.date()

def get_date_in_chile_timezone(date_obj: date) -> date:
    """
    Convierte una fecha a la zona horaria de Chile.
    Para fechas sin hora, simplemente retorna la fecha ya que no hay conversión necesaria.
    Esta función existe para mantener consistencia con el frontend.
    """
    return date_obj
