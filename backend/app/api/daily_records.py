from fastapi import APIRouter, Depends, status
from app.utils.auth import get_current_user
from app.services import daily_record_service
from app.schemas.daily_record import DailyRecordCreate

router = APIRouter(prefix="/api/daily-records", tags=["Daily Records"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_daily_record(
    payload: DailyRecordCreate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint usado por la App del Trabajador para enviar su cierre de día.
    """
    return await daily_record_service.create_daily_record(payload, current_user)