from fastapi import APIRouter, Depends, status
# from app.schemas.daily_record import DailyRecordCreate
from app.utils.auth import get_current_user
# from app.services import daily_record_service

router = APIRouter(prefix="/api/daily-records", tags=["Daily Records"])

# @router.post("", status_code=status.HTTP_201_CREATED)
# async def create_daily_record(payload: DailyRecordCreate, current_user=Depends(get_current_user)):
#     """
#     Crea un registro diario.
#     """
#     return await daily_record_service.create_record(payload, current_user)
