from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user
# from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# @router.get("/profitability")
# async def report_profitability(current_user=Depends(get_current_user)):
#     """
#     Reporte de rentabilidad.
#     """
#     return await report_service.get_profitability(current_user)
