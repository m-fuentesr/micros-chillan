from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.settlement import PaymentConfirmRequest
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

async def get_week_detail_by_date(fecha_inicio: str, fecha_fin: str):
    """
    Desglosa la actividad por chofer en un rango de fechas específico.
    Cruza registros operativos con mantenimientos de la máquina usada ese día.
    """
    # 1. TRAER REGISTROS DIARIOS
    res_regs = (
        supabase.table("registros_diarios")
        .select("chofer_id, maquina_id, fecha, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .execute()
    )
    registros = res_regs.data

    # 2. TRAER MANTENIMIENTOS (Repuestos)
    res_mant = (
        supabase.table("compras_repuestos")
        .select("fecha_compra, maquina_id, costo")
        .gte("fecha_compra", fecha_inicio)
        .lte("fecha_compra", fecha_fin)
        .execute()
    )
    mantenimientos = res_mant.data

    # 3. TRAER NOMBRES DE CHOFERES (Corrección: Directo de tabla choferes)
    chofer_ids = list(set(r["chofer_id"] for r in registros))
    
    if not chofer_ids:
        return [] 

    # Consultamos directo las columnas de nombre y apellido
    res_drivers = (
        supabase.table("choferes")
        .select("id, primer_nombre, apellido_paterno") 
        .in_("id", chofer_ids)
        .execute()
    )
    
    nombres_map = {}
    for item in res_drivers.data:
        # Construimos el nombre completo: "Juan Perez"
        nombre = item.get("primer_nombre") or ""
        apellido = item.get("apellido_paterno") or ""
        full_name = f"{nombre} {apellido}".strip()
        
        nombres_map[item["id"]] = full_name

    # 4. PROCESAMIENTO Y CRUCE DE DATOS
    reporte = {} 

    for r in registros:
        cid = r["chofer_id"]
        mid = r["maquina_id"]
        fecha_reg = r["fecha"]

        # Inicializar chofer si no existe en el reporte
        if cid not in reporte:
            reporte[cid] = {
                "chofer_id": cid,
                "nombre_chofer": nombres_map.get(cid, "Desconocido"), # Aquí usará el nombre correcto
                "dias_trabajados": 0,
                "total_recaudado": 0,
                "costo_diesel": 0,
                "gastos_mantenimiento": 0,
                "total_ganado_chofer": 0
            }

        # Sumar operativos
        reporte[cid]["dias_trabajados"] += 1
        reporte[cid]["total_recaudado"] += (r.get("monto_recaudado") or 0)
        reporte[cid]["costo_diesel"] += (r.get("costo_total_diesel") or 0)
        reporte[cid]["total_ganado_chofer"] += (r.get("monto_porcentaje_chofer") or 0)

        # CRUCE CON MANTENIMIENTO
        # Calculamos el gasto de ese día para esa máquina
        gastos_dia = sum(
            (m.get("costo") or 0) for m in mantenimientos 
            if m["maquina_id"] == mid and m["fecha_compra"] == fecha_reg
        )
        
        reporte[cid]["gastos_mantenimiento"] += gastos_dia

    # 5. CONVERTIR A LISTA
    return list(reporte.values())

SUELDO_GARANTIZADO = 750000

async def get_settlements_list(mes: int, anio: int):
    """
    Lista liquidaciones. Si ya existe en BD la trae. Si no, la calcula en vivo.
    """
    # 1. Traer Choferes Activos
    res_choferes = supabase.table("choferes").select("id, primer_nombre, apellido_paterno").eq("estado", "activo").execute()
    choferes = res_choferes.data

    # 2. Traer Liquidaciones YA creadas en este mes
    res_liqs = (
        supabase.table("liquidaciones")
        .select("*")
        .eq("mes", mes)
        .eq("anio", anio)
        .execute()
    )
    # Convertimos a diccionario para búsqueda rápida por chofer_id
    liquidaciones_map = {l["chofer_id"]: l for l in res_liqs.data}

    resultados = []
    
    # 3. Calcular rango de fechas del mes (para los pendientes)
    _, last_day = calendar.monthrange(anio, mes)
    f_inicio = date(anio, mes, 1).isoformat()
    f_fin = date(anio, mes, last_day).isoformat()

    # 4. Iterar por cada chofer
    for c in choferes:
        cid = c["id"]
        # Construir nombre completo
        nombre = c.get('primer_nombre') or ""
        apellido = c.get('apellido_paterno') or ""
        nombre_completo = f"{nombre} {apellido}".strip()

        # CASO A: YA PAGADO/GUARDADO
        if cid in liquidaciones_map:
            liq = liquidaciones_map[cid]
            resultados.append({
                "chofer_id": cid,
                "nombre_chofer": nombre_completo,
                "mes": mes,
                "anio": anio,
                "porcentaje_ganado": liq["porcentaje_ganado"],
                "sueldo_minimo": liq["sueldo_minimo"],
                "monto_faltante": liq["monto_faltante"],
                "total_final": liq["total_final"],
                "estado_pago": liq["estado_pago"],
                "id_liquidacion": liq["id"]
            })
        
        # CASO B: PENDIENTE (Calculamos al vuelo)
        else:
            # Sumar lo ganado en registros_diarios
            res_regs = (
                supabase.table("registros_diarios")
                .select("monto_porcentaje_chofer")
                .eq("chofer_id", cid)
                .gte("fecha", f_inicio)
                .lte("fecha", f_fin)
                .execute()
            )
            
            suma_ganado = sum((r.get("monto_porcentaje_chofer") or 0) for r in res_regs.data)
            
            # Calcular Bono Garantía
            bono = 0
            monto_final = int(suma_ganado)
            
            if suma_ganado < SUELDO_GARANTIZADO:
                bono = SUELDO_GARANTIZADO - suma_ganado
                monto_final = int(SUELDO_GARANTIZADO)

            resultados.append({
                "chofer_id": cid,
                "nombre_chofer": nombre_completo,
                "mes": mes,
                "anio": anio,
                "porcentaje_ganado": int(suma_ganado),
                "sueldo_minimo": SUELDO_GARANTIZADO,
                "monto_faltante": int(bono),
                "total_final": monto_final,
                "estado_pago": "pendiente", # Esto no viene de BD, es visual
                "id_liquidacion": None
            })

    return resultados

async def confirm_payment(chofer_id: int, mes: int, anio: int, payload: PaymentConfirmRequest):
    """
    Guarda la liquidación en la tabla con estado 'Pagado'.
    """
    # 1. Recalcular montos por seguridad
    _, last_day = calendar.monthrange(anio, mes)
    f_inicio = date(anio, mes, 1).isoformat()
    f_fin = date(anio, mes, last_day).isoformat()

    res_regs = (
        supabase.table("registros_diarios")
        .select("monto_porcentaje_chofer")
        .eq("chofer_id", chofer_id)
        .gte("fecha", f_inicio)
        .lte("fecha", f_fin)
        .execute()
    )
    base_ganado = sum((r.get("monto_porcentaje_chofer") or 0) for r in res_regs.data)
    
    bono = 0
    if base_ganado < SUELDO_GARANTIZADO:
        bono = SUELDO_GARANTIZADO - base_ganado

    # 2. Preparar Objeto para BD (Nombres exactos de tu imagen)
    nuevo_pago = {
        "chofer_id": chofer_id,
        "mes": mes,
        "anio": anio,
        "sueldo_minimo": SUELDO_GARANTIZADO,
        "porcentaje_ganado": base_ganado,
        "monto_faltante": bono,
        "total_final": payload.monto_final_pagado,
        
        "estado_pago": "pagado", # Debe coincidir con tu ENUM
        "metodo_pago": payload.metodo_pago, # Debe coincidir con tu ENUM
        "fecha_pago": payload.fecha_pago.isoformat(),
        "codigo_transferencia": payload.codigo_transferencia
        # 'observaciones' no lo vi en tu imagen de liquidaciones, si existe agrégalo
    }

    # Upsert: Inserta o actualiza si ya existía
    res = supabase.table("liquidaciones").upsert(nuevo_pago).execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error BD: {res.error.message}")
        
    data = res.data[0]
    
    return {
        "message": "Pago confirmado exitosamente.",
        "liquidacion_id": data["id"],
        "estado_pago": "Pagado"
    }

async def get_settlements_summary_banner(mes: int, anio: int):
    """
    Calcula los totales para el banner superior de liquidaciones.
    """
    # 1. Obtenemos la lista completa
    lista_completa = await get_settlements_list(mes, anio)

    count_pend = 0
    total_monto_pend = 0

    # 2. Iteramos y filtramos en memoria
    for item in lista_completa:
        # CORRECCIÓN AQUÍ: Usamos .lower() para comparar
        # Así "Pendiente" y "pendiente" cuentan igual.
        if item["estado_pago"].lower() == "pendiente":
            count_pend += 1
            total_monto_pend += item["total_final"]

    return {
        "periodo": {"mes": mes, "anio": anio},
        "count_pendientes": count_pend,
        "total_nomina_pendiente": total_monto_pend
    }