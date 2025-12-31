from fastapi import HTTPException
from app.db.supabase_client import supabase
from typing import List
import calendar
from datetime import date

async def _calculate_machines_financials(mes: int, anio: int):
    """
    Obtiene los datos crudos y calcula los totales por máquina.
    No ordena, solo devuelve la lista procesada.
    """
    # 1. Fechas
    _, last_day = calendar.monthrange(anio, mes)
    fecha_inicio = date(anio, mes, 1).isoformat()
    fecha_fin = date(anio, mes, last_day).isoformat()

    # 2. Consultas BD
    res_maquinas = supabase.table("maquinas").select("id, numero_interno, marca, patente").execute()
    maquinas = res_maquinas.data

    res_regs = (
        supabase.table("registros_diarios")
        .select("maquina_id, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .eq("es_dia_no_trabajado", False)  # Excluir días no trabajados de reportes financieros
        .execute()
    )
    registros = res_regs.data

    res_mant = (
        supabase.table("compras_repuestos")
        .select("maquina_id, costo")
        .gte("fecha_compra", fecha_inicio)
        .lte("fecha_compra", fecha_fin)
        .execute()
    )
    mantenimientos = res_mant.data

    # 3. Procesamiento
    resultados = []
    for mq in maquinas:
        mid = mq["id"]
        
        # Identificador
        marca = mq.get("marca") or "Maq"
        num_raw = mq.get("numero_interno")
        # Convertir a string si es número, manejar None y strings vacíos
        if num_raw is None:
            num = None
        elif isinstance(num_raw, (int, float)):
            num = str(int(num_raw)) if num_raw else None
        elif isinstance(num_raw, str):
            num = num_raw.strip() if num_raw.strip() else None
        else:
            num = str(num_raw).strip() if str(num_raw).strip() else None
        
        patente_raw = mq.get("patente")
        patente = (patente_raw.strip() if isinstance(patente_raw, str) and patente_raw.strip() else None) if patente_raw else None
        if num:
            identificador = f"{marca} {num}".strip()
        else:
            identificador = f"{marca} ({patente})".strip() if patente else f"{marca}".strip()

        # Filtros y Sumas
        regs_mq = [r for r in registros if r["maquina_id"] == mid]
        mant_mq = [m for m in mantenimientos if m["maquina_id"] == mid]

        ingresos = sum((r.get("monto_recaudado") or 0) for r in regs_mq)
        diesel = sum((r.get("costo_total_diesel") or 0) for r in regs_mq)
        choferes = sum((r.get("monto_porcentaje_chofer") or 0) for r in regs_mq)
        gastos_mant = sum((m.get("costo") or 0) for m in mant_mq)
        neto = ingresos - diesel - choferes - gastos_mant

        resultados.append({
            "maquina_id": mid,
            "identificador": identificador,
            "numero_interno": str(num) if num is not None else None,  # Asegurar que siempre sea string o None
            "patente": patente,
            "ingresos_totales": int(ingresos),
            "costos_diesel": int(diesel),
            "pago_choferes": int(choferes),
            "gastos_mantenimiento": int(gastos_mant),
            "ganancia_neta": int(neto)
        })
    
    return resultados

# --- FUNCIONES PÚBLICAS (REPORTES) ---

async def get_machine_profitability(mes: int, anio: int):
    """
    Reporte 1: Ordenado por GANANCIA NETA (Eficiencia).
    """
    data = await _calculate_machines_financials(mes, anio)
    # Ordenar: Mayor Ganancia primero
    data.sort(key=lambda x: x["ganancia_neta"], reverse=True)
    return data

async def get_gross_income_ranking(mes: int, anio: int):
    """
    Reporte 2: Ordenado por INGRESO TOTAL (Ventas).
    Incluye columna 'ranking'.
    """
    data = await _calculate_machines_financials(mes, anio)
    
    # 1. Ordenar: Mayor Venta primero [cite: 221-222]
    data.sort(key=lambda x: x["ingresos_totales"], reverse=True)
    
    # 2. Agregar Ranking (1, 2, 3...)
    ranking_data = []
    for index, item in enumerate(data):
        ranking_data.append({
            "ranking": index + 1, # 
            "maquina_id": item["maquina_id"],
            "identificador": item["identificador"],
            "numero_interno": item.get("numero_interno"),
            "patente": item.get("patente"),
            "ingresos_totales": item["ingresos_totales"],
            "costos_diesel": item["costos_diesel"],
            "pago_choferes": item["pago_choferes"],
            "ganancia_neta": item["ganancia_neta"]
            # Nota: Excluimos 'gastos_mantenimiento' del JSON final para coincidir con tu PDF[cite: 226],
            # aunque internamente sí se usó para calcular la ganancia neta[cite: 223].
        })
        
    return ranking_data

async def get_driver_profitability(mes: int, anio: int):
    """
    Reporte 3: Rentabilidad por Chofer.
    Ordenado por GANANCIA NETA (Eficiencia).
    Fórmula: Ingreso - Diesel - Pago Chofer. (Sin Mantenimiento).
    """
    # 1. Fechas
    _, last_day = calendar.monthrange(anio, mes)
    fecha_inicio = date(anio, mes, 1).isoformat()
    fecha_fin = date(anio, mes, last_day).isoformat()

    # 2. Consultas BD
    # Traemos choferes (id, nombre, apellido)
    res_choferes = supabase.table("choferes").select("id, primer_nombre, apellido_paterno").execute()
    choferes = res_choferes.data

    # Traemos registros del mes
    res_regs = (
        supabase.table("registros_diarios")
        .select("chofer_id, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .execute()
    )
    registros = res_regs.data

    # 3. Procesamiento
    data_procesada = []

    for ch in choferes:
        cid = ch["id"]
        nombre = f"{ch.get('primer_nombre','') or ''} {ch.get('apellido_paterno','') or ''}".strip()

        # Filtrar registros de ESTE chofer
        regs_ch = [r for r in registros if r["chofer_id"] == cid]

        # Si no trabajó, decidimos si mostrarlo o no. 
        # Generalmente si todos los valores son 0, se puede omitir o dejar al final.
        if not regs_ch:
            continue

        # Cálculos
        dias = len(regs_ch)
        ingresos = sum((r.get("monto_recaudado") or 0) for r in regs_ch)
        diesel = sum((r.get("costo_total_diesel") or 0) for r in regs_ch)
        pago = sum((r.get("monto_porcentaje_chofer") or 0) for r in regs_ch)
        
        # Ganancia Neta para la empresa
        neto = ingresos - diesel - pago

        data_procesada.append({
            "chofer_id": cid,
            "nombre_chofer": nombre,
            "dias_trabajados": dias,
            "ingresos_totales": int(ingresos),
            "costos_diesel": int(diesel),
            "pago_chofer": int(pago),
            "ganancia_neta": int(neto)
        })

    # 4. Ordenar: Mayor Ganancia Neta primero
    data_procesada.sort(key=lambda x: x["ganancia_neta"], reverse=True)

    # 5. Asignar Ranking y Retornar
    resultado_final = []
    for index, item in enumerate(data_procesada):
        # Insertamos el ranking en el diccionario
        item["ranking"] = index + 1
        resultado_final.append(item)
        
    return resultado_final