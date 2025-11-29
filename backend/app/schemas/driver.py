from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import date

# -------------------------
# Esquemas base
# -------------------------

class DriverBase(BaseModel):
    rut: str = Field(..., description="RUT del chofer")
    primer_nombre: str = Field(..., description="Primer nombre del chofer")
    segundo_nombre: Optional[str] = Field(None, description="Segundo nombre (opcional)")
    apellido_paterno: str = Field(..., description="Apellido paterno")
    apellido_materno: str = Field(..., description="Apellido materno")
    telefono: str = Field(..., description="Teléfono del chofer")

    correo_electronico: EmailStr = Field(
        ..., description="Correo electrónico (se creará un usuario asociado)"
    )

    fecha_venc_licencia: date = Field(
        ..., description="Fecha de vencimiento de licencia del chofer"
    )

    estado: Literal["activo", "inactivo"] = Field(
        "activo", description="Estado del chofer"
    )



# -------------------------
# Crear chofer (entrada)
# -------------------------

class DriverCreate(DriverBase):
    """
    Datos requeridos para crear un chofer.
    Es el schema que el frontend envía en POST /api/drivers.
    """
    maquina_asignada: Optional[int] = Field(
        None,
        description="ID de la máquina a asignar"
    )



# -------------------------
# Leer chofer (salida)
# -------------------------

class DriverRead(DriverBase):
    """
    Esquema usado para devolver un chofer desde la BD.
    """
    id: int = Field(..., description="ID del chofer en la base de datos")
    porcentaje_pago: float = Field(..., description="Porcentaje asignado al chofer")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# -------------------------
# Respuesta en listados
# -------------------------

class DriverListItem(DriverRead):
    """
    Representación simple para listados de choferes.
    """
    pass


# -------------------------
# Respuesta de lista
# -------------------------

class DriverListResponse(BaseModel):
    """
    Respuesta estándar para list_drivers.
    """
    items: list[DriverListItem]



class WorkerProfileResponse(BaseModel):
    # Cabecera
    nombre_completo: str
    
    # Información Personal
    rut: str
    telefono: str
    email: str
    
    # Información Laboral
    maquina_detalle: Optional[str] # Ej: "MÁQUINA 01 - Mercedes Benz"
    fecha_ingreso: str             # Ej: "20-11-2024"
    
