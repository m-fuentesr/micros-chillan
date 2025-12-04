from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal


class UserBase(BaseModel):
    """
    Modelo base para usuarios con campos comunes.
    """
    id: int = Field(..., description="ID único del usuario en la base de datos")
    supabase_uid: str = Field(..., description="UUID del usuario en Supabase Auth")
    rol_id: int = Field(..., description="ID del rol: 1=administrador, 2=chofer")
    correo: EmailStr = Field(..., description="Correo electrónico del usuario")
    estado: Literal["activo", "inactivo"] = Field(..., description="Estado del usuario")
    chofer_id: Optional[int] = Field(None, description="ID del chofer asociado (si aplica)")


class UserResponse(UserBase):
    """
    Modelo para respuestas de API.
    Expone solo los campos necesarios para el cliente.
    """
    pass


class UserInDB(UserBase):
    """
    Modelo completo con todos los campos de la base de datos.
    Usado internamente en el backend para representar usuarios autenticados.
    """
    pass
