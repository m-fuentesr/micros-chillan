from decimal import Decimal, InvalidOperation
import re


def normalize_value(value):
    if value is None:
        return None

    # Booleanos
    if isinstance(value, bool):
        return value

    # Números reales
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))

    # Strings
    if isinstance(value, str):
        value = value.strip()

        if value == "":
            return None

        # Intentar convertir a número si parece numérico
        try:
            return Decimal(value)
        except InvalidOperation:
            return value  # Texto normal

    # Fallback seguro
    return str(value)


RUT_REGEX = re.compile(r"^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$")

def normalize_rut(raw_rut: str) -> str:
    """
    Normaliza un RUT a formato XX.XXX.XXX-X
    Acepta entrada con o sin puntos/guión.
    """
    rut = raw_rut.strip().upper()

    # Quitar todo excepto números y K
    clean = re.sub(r"[^0-9K]", "", rut)

    if len(clean) < 8 or len(clean) > 9:
        raise ValueError("RUT inválido")

    cuerpo = clean[:-1]
    dv = clean[-1]

    cuerpo = cuerpo.zfill(8)

    return f"{cuerpo[:-6]}.{cuerpo[-6:-3]}.{cuerpo[-3:]}-{dv}"


def validate_rut(rut: str) -> bool:
    """
    Valida formato y dígito verificador
    """
    if not RUT_REGEX.match(rut):
        return False

    cuerpo, dv = rut.replace(".", "").split("-")
    dv = dv.upper()

    suma = 0
    multiplo = 2

    for c in reversed(cuerpo):
        suma += int(c) * multiplo
        multiplo = 2 if multiplo == 7 else multiplo + 1

    res = 11 - (suma % 11)
    dv_calc = "0" if res == 11 else "K" if res == 10 else str(res)

    return dv == dv_calc