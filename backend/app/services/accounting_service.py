from fastapi import HTTPException
from app.db.supabase_client import supabase
from datetime import date, timedelta
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

async def get_weekly_summary(mes: int, anio: int):
    """
    Divide el mes en semanas y calcula los totales por cada rango.
    Estrategia: Traer todo el mes y filtrar en memoria (Más rápido).
    """
    # 1. Definir inicio y fin del mes
    _, ultimo_dia_num = calendar.monthrange(anio, mes)
    fecha_inicio_mes = date(anio, mes, 1)
    fecha_fin_mes = date(anio, mes, ultimo_dia_num)

    # 2. TRAER TODA LA DATA DEL MES DE UNA VEZ
    # Registros Diarios
    raw_registros = (
        supabase.table("registros_diarios")
        .select("fecha, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio_mes.isoformat())
        .lte("fecha", fecha_fin_mes.isoformat())
        .execute()
    ).data

    # Mantenimientos (Compras Repuestos)
    raw_mant = (
        supabase.table("compras_repuestos")
        .select("fecha_compra, costo")
        .gte("fecha_compra", fecha_inicio_mes.isoformat())
        .lte("fecha_compra", fecha_fin_mes.isoformat())
        .execute()
    ).data

    # 3. ALGORITMO DE GENERACIÓN DE SEMANAS
    weeks_data = []
    current_date = fecha_inicio_mes
    week_num = 1

    while current_date <= fecha_fin_mes:
        # Calcular fin de esta semana (El próximo domingo)
        # weekday(): Lunes=0 ... Domingo=6.
        # Días que faltan para el domingo = 6 - current_date.weekday()
        days_to_sunday = 6 - current_date.weekday()
        next_sunday = current_date + timedelta(days=days_to_sunday)

        # Si el domingo se pasa del mes, cortamos en el fin de mes
        week_end = min(next_sunday, fecha_fin_mes)

        # 4. FILTRAR Y SUMAR DATOS PARA ESTE RANGO
        # Convertimos a string ISO para comparar fácil
        rango_ini_str = current_date.isoformat()
        rango_fin_str = week_end.isoformat()

        # Filtramos registros que caigan en este rango (Python list comprehension)
        regs_semana = [
            r for r in raw_registros 
            if rango_ini_str <= r["fecha"] <= rango_fin_str
        ]
        
        # Filtramos mantenimientos
        mant_semana = [
            m for m in raw_mant 
            if rango_ini_str <= m["fecha_compra"] <= rango_fin_str
        ]

        # 5. CÁLCULOS
        t_recaudado = sum((r.get("monto_recaudado") or 0) for r in regs_semana)
        t_diesel = sum((r.get("costo_total_diesel") or 0) for r in regs_semana)
        t_choferes = sum((r.get("monto_porcentaje_chofer") or 0) for r in regs_semana)
        t_mant = sum((m.get("costo") or 0) for m in mant_semana)
        
        utilidad = t_recaudado - t_diesel - t_mant - t_choferes

        # Formato de texto "DD/MM - DD/MM"
        lbl_inicio = current_date.strftime("%d/%m")
        lbl_fin = week_end.strftime("%d/%m")

        weeks_data.append({
            "numero_semana": week_num,
            "rango_fechas_texto": f"{lbl_inicio} - {lbl_fin}",
            "total_recaudado": int(t_recaudado),
            "total_diesel": int(t_diesel),
            "total_mantenimiento": int(t_mant),
            "total_pago_choferes": int(t_choferes),
            "ganancia_liquida": int(utilidad)
        })

        # Preparar siguiente ciclo
        current_date = week_end + timedelta(days=1)
        week_num += 1

    return weeks_data