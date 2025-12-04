from fastapi import APIRouter, Depends

from app.utils.auth import get_current_user
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """
    Devuelve la información del usuario autenticado desde la tabla 'usuarios'.
    """
    return current_user
