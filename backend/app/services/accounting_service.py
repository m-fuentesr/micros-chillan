from fastapi import HTTPException
from app.db.supabase_client import supabase
from app.schemas.settlement import WeeklyPaymentConfirmRequest
from app.services import alert_service
from datetime import date, timedelta, timezone, datetime
import calendar

# --------------------------------------------------------------------------
# CONFIGURACIÓN
# --------------------------------------------------------------------------
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
        .eq("es_dia_no_trabajado", False)  # Excluir días no trabajados de reportes financieros
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
        .eq("es_dia_no_trabajado", False)  # Excluir días no trabajados de reportes financieros
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
        .eq("es_dia_no_trabajado", False)  # Excluir días no trabajados de reportes financieros
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
        .eq("es_dia_no_trabajado", False)  # Excluir días no trabajados del conteo y cálculos
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

    cfg_res = (
        supabase.table("configuracion_general")
        .select("sueldo_minimo")
        .single()
        .execute()
    )
    if getattr(cfg_res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error obteniendo configuración: {cfg_res.error}")

    sueldo_minimo_vigente = cfg_res.data.get("sueldo_minimo") if cfg_res.data else None
    if sueldo_minimo_vigente is None:
        raise HTTPException(status_code=400, detail="Configuración general no tiene sueldo_minimo definido.")
    
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
        # Consultar todos los pagos del mes (excepto la semana actual) que tengan total_pagado > 0
        res_previos = (
            supabase.table("pagos_semanales")
            .select("chofer_id, total_pagado, semana")
            .eq("mes", mes)
            .eq("anio", anio)
            .neq("semana", semana)
            .gt("total_pagado", 0)  # Solo considerar pagos con monto > 0
            .execute()
        )
        # Debug: Log para verificar qué pagos se están encontrando
        if res_previos.data:
            print(f"🔍 Acumulados encontrados para mes {mes}/{anio} (excluyendo semana {semana}): {len(res_previos.data)} pagos")
            for p in res_previos.data:
                chofer_id = p["chofer_id"]
                total_pagado = p.get("total_pagado", 0) or 0
                semana_pago = p.get("semana", "?")
                acumulados_map[chofer_id] = acumulados_map.get(chofer_id, 0) + total_pagado
                print(f"  - Chofer {chofer_id}, Semana {semana_pago}: ${total_pagado:,} -> Acumulado: ${acumulados_map[chofer_id]:,}")
        else:
            print(f"⚠️ No se encontraron pagos previos para mes {mes}/{anio} (excluyendo semana {semana})")

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
                "sueldo_minimo_mensual": sueldo_minimo_vigente,
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
                if total_proyectado < sueldo_minimo_vigente:
                    bono_sugerido = sueldo_minimo_vigente - total_proyectado
            
            total_calc = base_semana + bono_sugerido

            resultados.append({
                "chofer_id": cid,
                "nombre_chofer": nombre,
                "mes": mes, "anio": anio, "semana": semana, "es_ultima_semana": es_ultima_semana,
                "base_ganado": int(base_semana),
                "acumulado_mes_anterior": int(acumulado),
                "sueldo_minimo_mensual": sueldo_minimo_vigente,
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
    # Verificar si ya existe un pago para este chofer, mes, año y semana
    res_existente = (
        supabase.table("pagos_semanales")
        .select("id")
        .eq("chofer_id", chofer_id)
        .eq("mes", mes)
        .eq("anio", anio)
        .eq("semana", semana)
        .execute()
    )

    if res_existente.data:
        # Actualizar registro existente
        res = (
            supabase.table("pagos_semanales")
            .update(nuevo_pago)
            .eq("chofer_id", chofer_id)
            .eq("mes", mes)
            .eq("anio", anio)
            .eq("semana", semana)
            .execute()
        )
    else:
        # Insertar nuevo registro
        res = supabase.table("pagos_semanales").insert(nuevo_pago).execute()

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

async def get_history_periods(filters=None):
    """
    Obtiene la lista de meses con paginación y filtros.
    Lógica de Estado:
    - "Finalizado": Si se detecta un pago en la ÚLTIMA semana de ese mes.
    - "En Proceso": Si hay pagos, pero falta la última semana.
    """
    from app.core.pagination import PaginatedResponse
    
    # Si no hay filtros, usar valores por defecto
    if filters is None:
        from app.schemas.settlement import HistoryPeriodFilters
        filters = HistoryPeriodFilters()
    
    # 1. Obtener total global (sin filtros) para el badge - hacer esto primero
    res_global = (
        supabase.table("pagos_semanales")
        .select("mes, anio")
        .execute()
    )
    grupos_global = set()
    for item in res_global.data:
        grupos_global.add((item["mes"], item["anio"]))
    total_global = len(grupos_global)
    
    # 2. Traer pagos con filtros aplicados en la consulta
    query = (
        supabase.table("pagos_semanales")
        .select("mes, anio, total_pagado, fecha_pago, semana")
    )
    
    # Aplicar filtros de mes directamente en la consulta
    if filters.mes_desde is not None:
        query = query.gte("mes", filters.mes_desde)
    if filters.mes_hasta is not None:
        query = query.lte("mes", filters.mes_hasta)
    
    res = query.order("anio", desc=True).order("mes", desc=True).execute()
    
    # 3. Agrupar en memoria
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

    # 4. Procesar estados y formatear
    resultado = []
    
    for (mes, anio), info in grupos.items():
        
        nombre_mes = MESES_ES.get(mes, str(mes))
        
        # Fecha cierre visual: La fecha más reciente de pago en ese mes
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
    
    # 5. Aplicar paginación
    total_filtrado = len(resultado)
    start = filters.offset
    end = start + filters.per_page
    items_paginados = resultado[start:end]
    
    # 6. Calcular total de páginas
    total_paginas = (total_filtrado + filters.per_page - 1) // filters.per_page if total_filtrado > 0 else 0
    
    # Retornar respuesta con total_global para el badge
    # Usar dict directamente ya que PaginatedResponse no tiene total_global
    return {
        "total": total_filtrado,
        "total_global": total_global,
        "page": filters.page,
        "per_page": filters.per_page,
        "items": items_paginados
    }

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
#Deshacer Pago
async def undo_weekly_payment(chofer_id: int, mes: int, anio: int, semana: int):
    """
    Elimina el registro de pago de la base de datos.
    Al hacerlo, el sistema volverá a calcular el monto como 'pendiente' automáticamente
    la próxima vez que se consulte la lista.
    """
    # 1. Ejecutar borrado en Supabase buscando por la clave compuesta única
    res = (
        supabase.table("pagos_semanales")
        .delete()
        .eq("chofer_id", chofer_id)
        .eq("mes", mes)
        .eq("anio", anio)
        .eq("semana", semana)
        .execute()
    )

    # 2. Manejo de errores de BD
    if getattr(res, "error", None):
        raise HTTPException(status_code=400, detail=f"Error al eliminar pago: {res.error.message}")

    # 3. Validar si realmente se borró algo (si data está vacío, no existía el pago)
    if not res.data:
        raise HTTPException(status_code=404, detail="No se encontró un pago realizado para este chofer en la semana indicada.")

    # NOTA: No borramos la alerta enviada (si existe) para no complicar la lógica buscando IDs de alertas.
    # El chofer tendrá la notificación antigua, pero en su saldo verá que está pendiente de nuevo.
    
    return {
        "message": "Pago deshecho correctamente. El estado ha vuelto a 'pendiente'.",
        "deleted_id": res.data[0]["id"]
    }

async def process_month_closure(mes: int, anio: int):
    """
    Cierra administrativamente el mes:
    1. Verifica que NO existan pagos pendientes en la última semana para choferes activos.
    2. Calcula el total pagado en todo el mes.
    3. Inserta el registro en la tabla 'cierres_mensuales'.
    """
    # 1. SEGURIDAD: Verificar si el mes ya está cerrado
    check_existente = (
        supabase.table("cierres_mensuales")
        .select("id")
        .eq("mes", mes)
        .eq("anio", anio)
        .execute()
    )
    if check_existente.data:
        raise HTTPException(status_code=400, detail="Este mes ya se encuentra cerrado.")

    # 2. VALIDACIÓN DE PAGOS PENDIENTES
    # Calculamos cuál es la última semana de ese mes
    total_semanas = count_weeks_in_month(mes, anio)
    
    # Obtenemos choferes activos
    res_choferes = supabase.table("choferes").select("id, primer_nombre, apellido_paterno").eq("estado", "activo").execute()
    choferes_activos = res_choferes.data or []
    ids_activos = [c["id"] for c in choferes_activos]

    if ids_activos:
        # Buscamos quiénes tienen pago registrado en esa ÚLTIMA semana
        res_pagos_check = (
            supabase.table("pagos_semanales")
            .select("chofer_id")
            .eq("mes", mes)
            .eq("anio", anio)
            .eq("semana", total_semanas)
            .in_("chofer_id", ids_activos)
            .execute()
        )
        pagados_ids = [p["chofer_id"] for p in res_pagos_check.data]
        
        # Identificamos a los morosos
        pendientes = [c for c in choferes_activos if c["id"] not in pagados_ids]
        

        if pendientes:
            nombres = ", ".join([f"{p['primer_nombre']} {p['apellido_paterno']}" for p in pendientes])
            raise HTTPException(
                status_code=400,
                detail=f"⚠️ No se puede cerrar el mes. Falta registrar el pago de la Semana {total_semanas} a: {nombres}"
            )
 

    # 3. CÁLCULO DEL TOTAL (Para el historial)
    res_total = (
        supabase.table("pagos_semanales")
        .select("total_pagado")
        .eq("mes", mes)
        .eq("anio", anio)
        .execute()
    )
    suma_total = sum((item.get('total_pagado') or 0) for item in res_total.data)

    # 4. GUARDAR EL CIERRE
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        datos_cierre = {
            "mes": mes,
            "anio": anio,
            "total_pagado": suma_total,
            "fecha_cierre": now_iso,
            'cerrado_por' : 1
        }

        res_insert = supabase.table("cierres_mensuales").insert(datos_cierre).execute()
        
        if getattr(res_insert, "error", None):
             raise Exception(res_insert.error.message)

    except Exception as e:
        # Manejo de error de duplicado por si ocurrencia simultánea
        if "23505" in str(e): 
             raise HTTPException(status_code=400, detail="El mes ya estaba cerrado.")
        raise HTTPException(status_code=500, detail=f"Error al guardar cierre: {e}")

    # Retornamos el estado 'Finalizado' para que el frontend actualice la UI inmediatamente
    return {
        "status": "success", 
        "message": f"Mes cerrado correctamente. Total auditado: ${suma_total:,.0f}",
        "estado": "Finalizado",
        "fecha_cierre": now_iso
    }