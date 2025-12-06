from fastapi import HTTPException
from app.db.supabase_client import supabase
from datetime import date
import calendar

async def get_monthly_summary(mes: int, anio: int):
    """
    Calcula los KPIs financieros del mes usando 'registros_diarios' y 'compras_repuestos'.
    """
    # 1. Definir rango de fechas (Día 1 al último día del mes)
    _, ultimo_dia = calendar.monthrange(anio, mes)
    fecha_inicio = date(anio, mes, 1).isoformat()
    fecha_fin = date(anio, mes, ultimo_dia).isoformat()

    # ---------------------------------------------------------
    # 2. CONSULTAR REGISTROS OPERATIVOS
    # ---------------------------------------------------------
    res_registros = (
        supabase.table("registros_diarios")
        .select("monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .execute()
    )

    if getattr(res_registros, "error", None):
        raise HTTPException(status_code=400, detail=f"Error en registros: {res_registros.error}")

    # Sumamos en Python (tratando nulos como 0)
    data_reg = res_registros.data
    
    total_recaudado = sum((r.get("monto_recaudado") or 0) for r in data_reg)
    total_diesel = sum((r.get("costo_total_diesel") or 0) for r in data_reg)
    total_choferes = sum((r.get("monto_porcentaje_chofer") or 0) for r in data_reg)

    # ---------------------------------------------------------
    # 3. CONSULTAR MANTENIMIENTOS (Tabla 'compras_repuestos')
    # ---------------------------------------------------------
    # Usamos la columna 'costo' y 'fecha_compra' según tu imagen
    res_mant = (
        supabase.table("compras_repuestos")
        .select("costo") 
        .gte("fecha_compra", fecha_inicio)
        .lte("fecha_compra", fecha_fin)
        .execute()
    )

    if getattr(res_mant, "error", None):
        raise HTTPException(status_code=400, detail=f"Error en repuestos: {res_mant.error}")

    total_mantenimiento = sum((m.get("costo") or 0) for m in res_mant.data)

    # ---------------------------------------------------------
    # 4. CÁLCULO FINAL (Ganancia Líquida)
    # ---------------------------------------------------------
    ganancia_liquida = total_recaudado - total_diesel - total_mantenimiento - total_choferes

    return {
        "periodo": {
            "mes": mes,
            "anio": anio
        },
        "totales": {
            "total_recaudado": int(total_recaudado),
            "total_costo_diesel": int(total_diesel),
            "total_gastos_mantenimiento": int(total_mantenimiento),
            "total_pago_choferes": int(total_choferes),
            "ganancia_liquida": int(ganancia_liquida)
        }
    }
