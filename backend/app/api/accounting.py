from fastapi import APIRouter, Depends, status
from app.utils.auth import get_current_user
from app.services import accounting_service

router = APIRouter(prefix="/api/accounting", tags=["Accounting"])

@router.get("/summary")
async def get_accounting_summary(current_user=Depends(get_current_user)):
    """
    Resumen contable general.
    """
    return await accounting_service.get_summary(current_user)
