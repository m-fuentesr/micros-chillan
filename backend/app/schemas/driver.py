from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import date


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


class DriverLicenseState(BaseModel):
    fecha_vencimiento: date
    estado: Literal["ok", "warning", "danger"]
    dias_restantes: int


class DriverMachine(BaseModel):
    id: int
    identificador: str


class DriverListItem(BaseModel):
    id: int
    nombre_completo: str
    rut: str
    telefono: str
    correo_electronico: str
    estado: Literal["activo", "inactivo"]

    maquina_actual: Optional[DriverMachine]
    licencia_estado: DriverLicenseState


class DriverDetail(BaseModel):
    id: int
    nombre_completo: str
    rut: str
    estado: Literal["activo", "inactivo"]
    telefono: str
    correo_electronico: str
    porcentaje_pago: float

    maquina_actual: Optional[DriverMachine]
    licencia: DriverLicenseState


class DriverSelect(BaseModel):
    id: int
    nombre_completo: str


class DriverUpdate(BaseModel):
    primer_nombre: str
    segundo_nombre: Optional[str]
    apellido_paterno: str
    apellido_materno: str
    rut: str

    telefono: str
    correo_electronico: EmailStr

    estado: Literal["activo", "inactivo"]
    porcentaje_pago: float

    # Máquina asignada (dropdown). Puede ser None = "Sin asignar"
    maquina_id: Optional[int] = None

    fecha_venc_licencia: date


class DriverCreate(DriverBase):
    """
    Datos requeridos para crear un chofer.
    Es el schema que el frontend envía en POST /api/drivers.
    """
    maquina_asignada: Optional[int] = Field(
        None,
        description="ID de la máquina a asignar"
    )

