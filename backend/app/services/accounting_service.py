from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.settlement import WeeklyPaymentConfirmRequest
from app.services import alert_service
from datetime import date, timedelta, timezone
import calendar

# --------------------------------------------------------------------------
# CONFIGURACIÓN
# --------------------------------------------------------------------------
SUELDO_GARANTIZADO = 750000 
MESES_ES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
    7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}

# --------------------------------------------------------------------------
# 1. MÓDULO DE ESTADÍSTICAS Y RESUMEN (KPIs Generales)
# --------------------------------------------------------------------------

async def get_monthly_summary(mes: int, anio: int):
    """Calcula KPIs financieros del mes."""
    _, ultimo_dia = calendar.monthrange(anio, mes)
    fecha_inicio = date(anio, mes, 1).isoformat()
    fecha_fin = date(anio, mes, ultimo_dia).isoformat()

    res_registros = (
        supabase.table("registros_diarios")
        .select("monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .execute()
    )
    if getattr(res_registros, "error", None):
        raise HTTPException(status_code=400, detail=f"Error registros: {res_registros.error}")

    data_reg = res_registros.data
    total_recaudado = sum((r.get("monto_recaudado") or 0) for r in data_reg)
    total_diesel = sum((r.get("costo_total_diesel") or 0) for r in data_reg)
    total_choferes = sum((r.get("monto_porcentaje_chofer") or 0) for r in data_reg)

    res_mant = (
        supabase.table("compras_repuestos")
        .select("costo")
        .gte("fecha_compra", fecha_inicio)
        .lte("fecha_compra", fecha_fin)
        .execute()
    )
    if getattr(res_mant, "error", None):
        raise HTTPException(status_code=400, detail=f"Error repuestos: {res_mant.error}")

    total_mantenimiento = sum((m.get("costo") or 0) for m in res_mant.data)
    ganancia_liquida = total_recaudado - total_diesel - total_mantenimiento - total_choferes

    # Calcular si es el mes actual
    today = date.today()
    es_mes_actual = (mes == today.month and anio == today.year)

    return {
        "periodo": {"mes": mes, "anio": anio},
        "totales": {
            "total_recaudado": int(total_recaudado),
            "total_costo_diesel": int(total_diesel),
            "total_gastos_mantenimiento": int(total_mantenimiento),
            "total_pago_choferes": int(total_choferes),
            "ganancia_liquida": int(ganancia_liquida)
        },
        "es_mes_actual": es_mes_actual
    }

async def get_daily_profitability(mes: int, anio: int):
    """Calcula la evolución diaria de ingresos, egresos y ganancia del mes."""
    _, ultimo_dia = calendar.monthrange(anio, mes)
    fecha_inicio = date(anio, mes, 1).isoformat()
    fecha_fin = date(anio, mes, ultimo_dia).isoformat()

    # Obtener registros diarios del mes
    res_registros = (
        supabase.table("registros_diarios")
        .select("fecha, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .execute()
    )
    if getattr(res_registros, "error", None):
        raise HTTPException(status_code=400, detail=f"Error registros: {res_registros.error}")
    
    registros = res_registros.data

    # Obtener gastos de mantenimiento del mes
    res_mant = (
        supabase.table("compras_repuestos")
        .select("fecha_compra, costo")
        .gte("fecha_compra", fecha_inicio)
        .lte("fecha_compra", fecha_fin)
        .execute()
    )
    if getattr(res_mant, "error", None):
        raise HTTPException(status_code=400, detail=f"Error repuestos: {res_mant.error}")
    
    mantenimientos = res_mant.data

    # Agrupar por fecha
    datos_por_fecha = {}
    
    # Inicializar todos los días del mes con ceros
    for dia in range(1, ultimo_dia + 1):
        fecha_str = date(anio, mes, dia).isoformat()
        datos_por_fecha[fecha_str] = {
            "ingresos": 0,
            "egresos": 0,
            "ganancia": 0
        }
    
    # Procesar registros diarios
    for reg in registros:
        fecha_str = reg.get("fecha")
        if fecha_str in datos_por_fecha:
            ingresos = reg.get("monto_recaudado") or 0
            diesel = reg.get("costo_total_diesel") or 0
            choferes = reg.get("monto_porcentaje_chofer") or 0
            
            datos_por_fecha[fecha_str]["ingresos"] += ingresos
            datos_por_fecha[fecha_str]["egresos"] += diesel + choferes
    
    # Procesar mantenimientos
    for mant in mantenimientos:
        fecha_str = mant.get("fecha_compra")
        if fecha_str in datos_por_fecha:
            costo = mant.get("costo") or 0
            datos_por_fecha[fecha_str]["egresos"] += costo
    
    # Calcular ganancia para cada día
    resultado = []
    for fecha_str in sorted(datos_por_fecha.keys()):
        datos = datos_por_fecha[fecha_str]
        ganancia = datos["ingresos"] - datos["egresos"]
        datos["ganancia"] = ganancia
        
        resultado.append({
            "fecha": fecha_str,
            "ingresos": int(datos["ingresos"]),
            "egresos": int(datos["egresos"]),
            "ganancia": int(ganancia)
        })
    
    return resultado

async def get_weekly_summary(mes: int, anio: int):
    """Desglosa el mes en semanas para ver rendimiento operativo."""
    _, ultimo_dia_num = calendar.monthrange(anio, mes)
    fecha_inicio_mes = date(anio, mes, 1)
    fecha_fin_mes = date(anio, mes, ultimo_dia_num)

    raw_registros = (
        supabase.table("registros_diarios")
        .select("fecha, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio_mes.isoformat())
        .lte("fecha", fecha_fin_mes.isoformat())
        .execute()
    ).data

    raw_mant = (
        supabase.table("compras_repuestos")
        .select("fecha_compra, costo")
        .gte("fecha_compra", fecha_inicio_mes.isoformat())
        .lte("fecha_compra", fecha_fin_mes.isoformat())
        .execute()
    ).data

    weeks_data = []
    current_date = fecha_inicio_mes
    week_num = 1

    while current_date <= fecha_fin_mes:
        days_to_sunday = 6 - current_date.weekday()
        next_sunday = current_date + timedelta(days=days_to_sunday)
        week_end = min(next_sunday, fecha_fin_mes)

        rango_ini_str = current_date.isoformat()
        rango_fin_str = week_end.isoformat()

        regs_semana = [r for r in raw_registros if rango_ini_str <= r["fecha"] <= rango_fin_str]
        mant_semana = [m for m in raw_mant if rango_ini_str <= m["fecha_compra"] <= rango_fin_str]

        t_recaudado = sum((r.get("monto_recaudado") or 0) for r in regs_semana)
        t_diesel = sum((r.get("costo_total_diesel") or 0) for r in regs_semana)
        t_choferes = sum((r.get("monto_porcentaje_chofer") or 0) for r in regs_semana)
        t_mant = sum((m.get("costo") or 0) for m in mant_semana)
        utilidad = t_recaudado - t_diesel - t_mant - t_choferes

        weeks_data.append({
            "numero_semana": week_num,
            "rango_fechas_texto": f"{current_date.strftime('%d/%m')} - {week_end.strftime('%d/%m')}",
            "total_recaudado": int(t_recaudado),
            "total_diesel": int(t_diesel),
            "total_mantenimiento": int(t_mant),
            "total_pago_choferes": int(t_choferes),
            "ganancia_liquida": int(utilidad)
        })

        current_date = week_end + timedelta(days=1)
        week_num += 1

    return weeks_data

async def get_week_detail_by_week_number(mes: int, anio: int, semana: int):
    """
    Desglosa la actividad por chofer para una SEMANA específica.
    Calcula las fechas automáticamente.
    """
    # 1. OBTENER FECHAS AUTOMÁTICAMENTE (Reutilizamos la lógica)
    fecha_inicio, fecha_fin = get_date_range_for_week(mes, anio, semana)

    # 2. TRAER REGISTROS DIARIOS (Usando las fechas calculadas)
    res_regs = (
        supabase.table("registros_diarios")
        .select("chofer_id, maquina_id, fecha, monto_recaudado, costo_total_diesel, monto_porcentaje_chofer")
        .gte("fecha", fecha_inicio)
        .lte("fecha", fecha_fin)
        .execute()
    )
    registros = res_regs.data

    # 3. TRAER MANTENIMIENTOS
    res_mant = (
        supabase.table("compras_repuestos")
        .select("fecha_compra, maquina_id, costo")
        .gte("fecha_compra", fecha_inicio)
        .lte("fecha_compra", fecha_fin)
        .execute()
    )
    mantenimientos = res_mant.data

    # 4. TRAER NOMBRES DE CHOFERES
    chofer_ids = list(set(r["chofer_id"] for r in registros))
    
    if not chofer_ids:
        return [] 

    res_drivers = (
        supabase.table("choferes")
        .select("id, primer_nombre, apellido_paterno") 
        .in_("id", chofer_ids)
        .execute()
    )
    
    nombres_map = {}
    for item in res_drivers.data:
        nombre = item.get("primer_nombre") or ""
        apellido = item.get("apellido_paterno") or ""
        full_name = f"{nombre} {apellido}".strip()
        nombres_map[item["id"]] = full_name

    # 5. PROCESAMIENTO Y CRUCE
    reporte = {} 

    for r in registros:
        cid = r["chofer_id"]
        mid = r["maquina_id"]
        fecha_reg = r["fecha"]

        if cid not in reporte:
            reporte[cid] = {
                "chofer_id": cid,
                "nombre_chofer": nombres_map.get(cid, "Desconocido"),
                "dias_trabajados": 0,
                "total_recaudado": 0,
                "costo_diesel": 0,
                "gastos_mantenimiento": 0,
                "total_ganado_chofer": 0
            }

        reporte[cid]["dias_trabajados"] += 1
        reporte[cid]["total_recaudado"] += (r.get("monto_recaudado") or 0)
        reporte[cid]["costo_diesel"] += (r.get("costo_total_diesel") or 0)
        reporte[cid]["total_ganado_chofer"] += (r.get("monto_porcentaje_chofer") or 0)

        # Cruce de mantenimiento
        gastos_dia = sum(
            (m.get("costo") or 0) for m in mantenimientos 
            if m["maquina_id"] == mid and m["fecha_compra"] == fecha_reg
        )
        reporte[cid]["gastos_mantenimiento"] += gastos_dia

    return list(reporte.values())


# --------------------------------------------------------------------------
# 2. NUEVO MÓDULO: PAGOS SEMANALES
# --------------------------------------------------------------------------

async def get_weekly_payments_list(mes: int, anio: int, semana: int):
    """
    Lista los pagos.
    1. Calcula fechas automáticamente.
    2. Detecta si es última semana automáticamente.
    """
    # 1. CALCULAR FECHAS Y ESTADO DE CIERRE AUTOMÁTICAMENTE
    f_inicio, f_fin = get_date_range_for_week(mes, anio, semana)
    
    total_semanas = count_weeks_in_month(mes, anio)
    es_ultima_semana = (semana == total_semanas)

    # ... (EL RESTO DEL CÓDIGO ES IDÉNTICO AL ANTERIOR) ...
    
    # 2. Choferes Activos
    res_choferes = supabase.table("choferes").select("id, primer_nombre, apellido_paterno").eq("estado", "activo").execute()
    choferes = res_choferes.data

    # 3. Revisar pagos GUARDADOS
    res_pagos = (
        supabase.table("pagos_semanales")
        .select("*")
        .eq("mes", mes)
        .eq("anio", anio)
        .eq("semana", semana)
        .execute()
    )
    pagos_map = {p["chofer_id"]: p for p in res_pagos.data}

    # 4. Si es última semana, sumar historial previo
    acumulados_map = {}
    if es_ultima_semana:
        res_previos = (
            supabase.table("pagos_semanales")
            .select("chofer_id, total_pagado")
            .eq("mes", mes)
            .eq("anio", anio)
            .neq("semana", semana) 
            .execute()
        )
        for p in res_previos.data:
            acumulados_map[p["chofer_id"]] = acumulados_map.get(p["chofer_id"], 0) + p["total_pagado"]

    resultados = []
    
    for c in choferes:
        cid = c["id"]
        nombre = f"{c.get('primer_nombre','')} {c.get('apellido_paterno','')}".strip()

        # A) YA PAGADO
        if cid in pagos_map:
            p = pagos_map[cid]
            resultados.append({
                "chofer_id": cid,
                "nombre_chofer": nombre,
                "mes": mes, "anio": anio, "semana": semana, "es_ultima_semana": es_ultima_semana,
                "base_ganado": p["base_ganado"],
                "acumulado_mes_anterior": acumulados_map.get(cid, 0),
                "sueldo_minimo_mensual": SUELDO_GARANTIZADO,
                "ajuste_garantizado_calculado": p["ajuste_garantizado"],
                "total_a_pagar": p["total_pagado"],
                "estado_pago": p["estado_pago"],
                "id_pago": p["id"],
                "metodo_pago": p.get("metodo_pago"),
                "codigo_transferencia": p.get("codigo_transferencia"),
                "fecha_pago": p.get("fecha_pago")
            })

        # B) PENDIENTE
        else:
            # USAMOS LAS FECHAS CALCULADAS AUTOMÁTICAMENTE
            res_regs = (
                supabase.table("registros_diarios")
                .select("monto_porcentaje_chofer")
                .eq("chofer_id", cid)
                .gte("fecha", f_inicio) # <--- Aquí se usan
                .lte("fecha", f_fin)    # <--- Aquí se usan
                .execute()
            )
            base_semana = sum((r.get("monto_porcentaje_chofer") or 0) for r in res_regs.data)
            
            bono_sugerido = 0
            acumulado = 0
            
            if es_ultima_semana:
                acumulado = acumulados_map.get(cid, 0)
                total_proyectado = acumulado + base_semana
                if total_proyectado < SUELDO_GARANTIZADO:
                    bono_sugerido = SUELDO_GARANTIZADO - total_proyectado
            
            total_calc = base_semana + bono_sugerido

            resultados.append({
                "chofer_id": cid,
                "nombre_chofer": nombre,
                "mes": mes, "anio": anio, "semana": semana, "es_ultima_semana": es_ultima_semana,
                "base_ganado": int(base_semana),
                "acumulado_mes_anterior": int(acumulado),
                "sueldo_minimo_mensual": SUELDO_GARANTIZADO,
                "ajuste_garantizado_calculado": int(bono_sugerido),
                "total_a_pagar": int(total_calc),
                "estado_pago": "pendiente",
                "id_pago": None
            })

    return resultados


async def confirm_weekly_payment(chofer_id: int, mes: int, anio: int, semana: int, payload: WeeklyPaymentConfirmRequest):
    """
    Confirma el pago semanal y lo guarda en 'pagos_semanales'.
    Genera alerta asociada directamente al CHOFER (ID 12) para que la vea en su app.
    """
    # 1. Armamos el objeto para BD (Pagos)
    nuevo_pago = {
        "chofer_id": chofer_id,
        "mes": mes,
        "anio": anio,
        "semana": semana,
        
        "base_ganado": payload.monto_base_semana,
        "ajuste_garantizado": payload.monto_bono_final,
        "total_pagado": payload.total_a_pagar,
        
        "metodo_pago": payload.metodo_pago,
        "fecha_pago": payload.fecha_pago.isoformat(),
        "codigo_transferencia": payload.codigo_transferencia,
        "estado_pago": "pagado"
    }

    # Guardamos el pago en la BD
    res = supabase.table("pagos_semanales").upsert(nuevo_pago).execute()

    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error BD: {res.error.message}")

    # ✅ NUEVO: Lógica de Alerta de Pago (Corregida para el Chofer)
    # -------------------------------------------------------
    try:
        # Obtenemos nombre para el mensaje (opcional, solo estética)
        driver_res = (
            supabase.table("choferes")
            .select("primer_nombre, apellido_paterno")
            .eq("id", chofer_id)
            .single()
            .execute()
        )
        
        nombre_chofer = "Chofer"
        if driver_res.data:
            nombre_chofer = f"{driver_res.data['primer_nombre']} {driver_res.data['apellido_paterno']}"

        # Formateamos dinero
        monto_str = f"${payload.total_a_pagar:,.0f}".replace(",", ".")

        # --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
        alerta_pago = {
            "mensaje": f"Pago confirmado: {monto_str} (Semana {semana})",
            "severidad": "informativa",  # Usamos positiva (verde) ya que es dinero recibido
            "tipo": "confirmacion_pago",
            
            # Al poner "chofer" y el ID del chofer, la alerta aparece en SU buzón.
            # chofer_id viene de los argumentos de la función (ej: 12).
            "origen_tipo": "chofer", 
            "origen_id": chofer_id   
        }
        
        await alert_service.crear_alerta(**alerta_pago)

    except Exception as e:
        # El pago YA se guardó, si falla la alerta solo avisamos en consola
        print(f"⚠️ Error generando alerta de pago: {e}")
    # -------------------------------------------------------

    return {
        "message": "Pago semanal confirmado y chofer notificado.",
        "pago_id": res.data[0]["id"],
        "estado": "pagado"
    }


# --------------------------------------------------------------------------
# 3. MÓDULO: HISTORIAL DE CIERRES (Jerárquico: Mes -> Semanas)
# --------------------------------------------------------------------------

async def get_history_periods():
    """
    Obtiene la lista de meses.
    Lógica de Estado:
    - "Finalizado": Si se detecta un pago en la ÚLTIMA semana de ese mes.
    - "En Proceso": Si hay pagos, pero falta la última semana.
    """
    # 1. Traer todos los pagos (Agregamos 'semana' a la consulta)
    res = (
        supabase.table("pagos_semanales")
        .select("mes, anio, total_pagado, fecha_pago, semana") # <--- IMPORTANTE: traer 'semana'
        .order("anio", desc=True)
        .order("mes", desc=True)
        .execute()
    )
    
    # 2. Agrupar en memoria
    grupos = {}
    
    for item in res.data:
        clave = (item["mes"], item["anio"])
        
        if clave not in grupos:
            grupos[clave] = {
                "total": 0, 
                "fechas": [],
                "semanas_pagadas": set() # Guardamos qué semanas tienen pagos
            }
        
        grupos[clave]["total"] += item["total_pagado"]
        grupos[clave]["fechas"].append(item["fecha_pago"])
        grupos[clave]["semanas_pagadas"].add(item["semana"])

    # 3. Procesar estados y formatear
    resultado = []
    
    for (mes, anio), info in grupos.items():
        nombre_mes = MESES_ES.get(mes, str(mes))
        
        # Fecha cierre visual: La fecha más reciente de pago en ese mes
        # (Si la fecha te salía mal antes, revisa que en el JSON del POST hayas puesto la fecha correcta)
        fecha_cierre_visual = max(info["fechas"]) if info["fechas"] else date(anio, mes, 28)
        
        # --- LÓGICA DE ESTADO ---
        # Calculamos cuál es la última semana real de ese mes
        total_semanas_del_mes = count_weeks_in_month(mes, anio)
        
        # Si en la lista de semanas pagadas está la última, cerramos el mes
        # (Asumimos que si pagaste la última, cerraste el proceso)
        if total_semanas_del_mes in info["semanas_pagadas"]:
            estado_final = "Finalizado"
        else:
            estado_final = "En Proceso"

        resultado.append({
            "periodo_texto": f"{nombre_mes} {anio}",
            "mes": mes,
            "anio": anio,
            "total_pagado_mes": info["total"],
            "fecha_cierre": fecha_cierre_visual,
            "estado": estado_final
        })
    
    return resultado

async def get_history_month_detail(mes: int, anio: int):
    """
    Genera el reporte tipo 'Comprobante de Nómina'.
    Estructura: Mes -> Semanas -> Lista de Choferes.
    """
    # 1. Traer pagos del mes con nombre del chofer
    res = (
        supabase.table("pagos_semanales")
        .select("*, choferes(primer_nombre, apellido_paterno)")
        .eq("mes", mes)
        .eq("anio", anio)
        .order("semana", desc=False) # Semana 1, 2, 3...
        .execute()
    )
    pagos_raw = res.data

    if not pagos_raw:
        return {
            "total_liquidado": 0, "cantidad_choferes": 0, "promedio": 0,
            "estado": "Sin Datos", "desglose_semanas": []
        }

    # 2. Agrupar por Semana
    semanas_map = {} # Key: numero_semana
    choferes_unicos = set()
    total_mes = 0

    for p in pagos_raw:
        sem = p["semana"]
        total_mes += p["total_pagado"]
        choferes_unicos.add(p["chofer_id"])
        
        # Nombre chofer
        c_data = p.get("choferes") or {}
        nombre = f"{c_data.get('primer_nombre','')} {c_data.get('apellido_paterno','')}".strip()

        # Objeto detalle pago
        detalle = {
            "chofer_id": p["chofer_id"],
            "nombre_chofer": nombre,
            "base": p["base_ganado"],
            "ajuste": p["ajuste_garantizado"],
            "total": p["total_pagado"],
            "metodo": p["metodo_pago"].upper(), # "TRANSFERENCIA"
            "ref": p["codigo_transferencia"] or "-"
        }

        if sem not in semanas_map:
            # Truco visual para el rango de fechas
            semanas_map[sem] = {
                "numero_semana": sem,
                "rango_fechas_texto": f"Semana {sem}",
                "total_semana": 0,
                "pagos": []
            }
        
        semanas_map[sem]["pagos"].append(detalle)
        semanas_map[sem]["total_semana"] += p["total_pagado"]

    # 3. Convertir Map a Lista ordenada
    lista_semanas = sorted(semanas_map.values(), key=lambda x: x["numero_semana"])

    # 4. Estadísticas Generales
    cant_choferes = len(choferes_unicos)
    promedio = int(total_mes / cant_choferes) if cant_choferes > 0 else 0

    return {
        "total_liquidado": total_mes,
        "cantidad_choferes": cant_choferes,
        "promedio": promedio,
        "estado": "Finalizado",
        "desglose_semanas": lista_semanas
    }

# --- FUNCIÓN AUXILIAR NUEVA (CEREBRO DE FECHAS) ---
def get_date_range_for_week(mes: int, anio: int, semana_objetivo: int):
    """
    Recorre el calendario del mes y retorna (fecha_inicio, fecha_fin) 
    para el número de semana solicitado.
    """
    _, last_day = calendar.monthrange(anio, mes)
    fecha_actual = date(anio, mes, 1)
    fecha_fin_mes = date(anio, mes, last_day)
    
    contador_semana = 1
    
    while fecha_actual <= fecha_fin_mes:
        # Calcular fin de esta semana (Próximo Domingo o Fin de Mes)
        days_to_sunday = 6 - fecha_actual.weekday()
        proximo_domingo = fecha_actual + timedelta(days=days_to_sunday)
        fin_semana_actual = min(proximo_domingo, fecha_fin_mes)
        
        # ¿Es esta la semana que buscamos?
        if contador_semana == semana_objetivo:
            return fecha_actual.isoformat(), fin_semana_actual.isoformat()
        
        # Avanzar a la siguiente
        fecha_actual = fin_semana_actual + timedelta(days=1)
        contador_semana += 1
        
    # Si llegamos aquí, pidieron una semana que no existe (ej: Semana 8)
    raise HTTPException(status_code=400, detail=f"La semana {semana_objetivo} no existe en este mes.")

def count_weeks_in_month(mes: int, anio: int) -> int:
    """Cuenta el total de semanas para saber si es la última."""
    _, last_day = calendar.monthrange(anio, mes)
    fecha_actual = date(anio, mes, 1)
    fecha_fin_mes = date(anio, mes, last_day)
    semanas = 0
    while fecha_actual <= fecha_fin_mes:
        semanas += 1
        days_to_sunday = 6 - fecha_actual.weekday()
        next_sunday = fecha_actual + timedelta(days=days_to_sunday)
        fecha_actual = next_sunday + timedelta(days=1)
    return semanas