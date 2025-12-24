from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import get_current_user, require_admin
from app.schemas.settings import GeneralSettingsResponse, UpdateSettingsRequest, UpdateSettingsResponse
from app.services import settings_service


router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get(
    "",
    response_model=GeneralSettingsResponse,
    summary="Obtiene la configuración general actual",
)
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Retorna la configuración general. Solo accesible para administradores."""
    require_admin(current_user)
    return await settings_service.get_settings()


@router.put(
    "",
    response_model=UpdateSettingsResponse,
    summary="Actualiza configuración general y propaga cambios necesarios",
)
async def update_settings(
    payload: UpdateSettingsRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Actualiza uno o más campos de configuracion_general.
    """
    require_admin(current_user)

    if payload.model_dump(exclude_none=True) == {}:
        raise HTTPException(
            status_code=400,
            detail="Debe indicar al menos un campo a actualizar.",
        )

    return await settings_service.update_settings(payload)
