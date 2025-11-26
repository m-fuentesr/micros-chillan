from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user
# from app.services import worker_service

router = APIRouter(prefix="/api/worker", tags=["Worker"])

# @router.get("/profile")
# async def worker_profile(current_user=Depends(get_current_user)):
#     """
#     Obtiene el perfil del trabajador.
#     """
#     return await worker_service.get_profile(current_user)
