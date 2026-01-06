from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.utils.auth import get_current_user, require_admin
from app.services import report_service
from app.services.export_service import ExportService # Asegúrate de que este archivo exista
from app.schemas.report import MachineProfitabilityResponse, MachineGrossRankingResponse, DriverProfitabilityResponse

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# =================================================================
# REPORTE 1: RENTABILIDAD POR MÁQUINA
# =================================================================

@router.get("/profitability", response_model=List[MachineProfitabilityResponse])
async def get_machine_profitability_report(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    """
    Vista JSON para el Frontend (Gráficos y Tablas).
    """
    require_admin(current_user)
    return await report_service.get_machine_profitability(mes, anio)

@router.get("/profitability/export")
async def export_machine_profitability(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    data = await report_service.get_machine_profitability(mes, anio)
    
    datos_planos = []
    for item in data:
        # Mapeo exacto según tu Schema MachineProfitabilityResponse
        # Usamos .get() porque 'data' es una lista de diccionarios
        datos_planos.append({
            "maquina": f"{item.get('identificador', 'Máquina')} ({item.get('patente', 'S/P')})",
            "ingresos": f"${item.get('ingresos_totales', 0):,.0f}".replace(",", "."),
            "diesel": f"${item.get('costos_diesel', 0):,.0f}".replace(",", "."),
            "choferes": f"${item.get('pago_choferes', 0):,.0f}".replace(",", "."),
            "mantencion": f"${item.get('gastos_mantenimiento', 0):,.0f}".replace(",", "."),
            "utilidad": f"${item.get('ganancia_neta', 0):,.0f}".replace(",", ".")
        })

    columnas = {
        "maquina": "Máquina / Patente",
        "ingresos": "Ingresos (+)",
        "diesel": "Diésel (-)",
        "choferes": "Choferes (-)",
        "mantencion": "Mantención (-)",
        "utilidad": "Utilidad Neta"
    }

    titulo = f"Reporte Rentabilidad Máquinas - {mes}/{anio}"
    filename = f"rentabilidad_maquinas_{mes}_{anio}"

    return _generar_response(format, titulo, columnas, datos_planos, filename, current_user)

# =================================================================
# REPORTE 2: RANKING INGRESO BRUTO
# =================================================================

@router.get("/gross-income-ranking", response_model=List[MachineGrossRankingResponse])
async def get_gross_income_ranking_report(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    return await report_service.get_gross_income_ranking(mes, anio)

@router.get("/gross-income-ranking/export")
async def export_gross_income_ranking(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    data = await report_service.get_gross_income_ranking(mes, anio)

    datos_planos = []
    # Usamos enumerate para generar el # de ranking (1, 2, 3...)
    for i, item in enumerate(data, 1):
        # Según tu Schema MachineGrossRankingResponse
        # NOTA: 'cantidad_viajes' no existe en tu schema, lo quitamos para que no falle.
        datos_planos.append({
            "ranking": i,
            "maquina": item.get('identificador', 'Máquina'),
            "patente": item.get('patente', 'S/P'),
            "total": f"${item.get('ingresos_totales', 0):,.0f}".replace(",", ".")
        })

    columnas = {
        "ranking": "#",
        "maquina": "Máquina",
        "patente": "Patente",
        "total": "Ingreso Bruto"
    }

    return _generar_response(format, f"Ranking Ingresos - {mes}/{anio}", columnas, datos_planos, f"ranking_ingresos_{mes}_{anio}", current_user)


# =================================================================
# REPORTE 3: RENTABILIDAD POR CHOFER
# =================================================================

@router.get("/driver-profitability", response_model=List[DriverProfitabilityResponse])
async def get_driver_profitability_report(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    return await report_service.get_driver_profitability(mes, anio)

@router.get("/driver-profitability/export")
async def export_driver_profitability(
    mes: int = Query(..., ge=1, le=12),
    anio: int = Query(..., ge=2020),
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    current_user: dict = Depends(get_current_user)
):
    require_admin(current_user)
    data = await report_service.get_driver_profitability(mes, anio)

    datos_planos = []
    for item in data:
        # Según tu Schema DriverProfitabilityResponse
        # Calculamos el margen % al vuelo porque no viene en el schema
        ingreso = item.get('ingresos_totales', 0)
        ganancia = item.get('ganancia_neta', 0)
        
        margen_pct = 0
        if ingreso > 0:
            margen_pct = (ganancia / ingreso) * 100

        datos_planos.append({
            "chofer": item.get('nombre_chofer', 'Chofer'),
            # 'maquina_asignada' no existe en el schema, ponemos "-"
            "dias": item.get('dias_trabajados', 0),
            "produccion": f"${ingreso:,.0f}".replace(",", "."),
            "pago": f"${item.get('pago_chofer', 0):,.0f}".replace(",", "."),
            "margen": f"{margen_pct:.1f}%"
        })

    columnas = {
        "chofer": "Conductor",
        "dias": "Días Trab.",
        "produccion": "Producción Generada",
        "pago": "Sueldo/Pago",
        "margen": "Margen %"
    }

    return _generar_response(format, f"Rentabilidad Choferes - {mes}/{anio}", columnas, datos_planos, f"rentabilidad_choferes_{mes}_{anio}", current_user)

# =================================================================
# HELPER INTERNO PARA NO REPETIR CÓDIGO
# =================================================================
def _generar_response(format, titulo, columnas, datos, filename_base, user):
    # CORRECCIÓN: Detectamos si 'user' es dict o objeto para sacar el email sin error
    if isinstance(user, dict):
        user_email = user.get("email", "Admin")
    else:
        # Si es un objeto Pydantic (UserInDB), usamos getattr
        user_email = getattr(user, "email", "Admin")
    
    if format == "excel":
        file_stream = ExportService.to_excel(columnas, datos)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{filename_base}.xlsx"
    else:
        file_stream = ExportService.to_pdf(titulo, columnas, datos, user_email)
        media_type = "application/pdf"
        filename = f"{filename_base}.pdf"

    return StreamingResponse(
        file_stream,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )