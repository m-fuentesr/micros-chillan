from decimal import Decimal, InvalidOperation

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
