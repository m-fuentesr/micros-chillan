from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UsuarioEstado(str):
    ACTIVO = "activo"
    INACTIVO = "inactivo"


class UsuarioBase(BaseModel):
    supabase_uid: str
    rol_id: int
    correo: EmailStr
    estado: str  # "activo" | "inactivo"
    nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    chofer_id: Optional[int] = None


class UsuarioCreate(UsuarioBase):
    pass


class UsuarioUpdate(BaseModel):
    rol_id: Optional[int] = None
    correo: Optional[EmailStr] = None
    estado: Optional[str] = None
    nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    chofer_id: Optional[int] = None


class UsuarioInDB(UsuarioBase):
    id: int
    created_at: datetime
    updated_at: datetime
