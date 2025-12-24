from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import date
from app.core.pagination import PaginationParams


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

    estado: Literal["activo", "inactivo", "eliminado"] = Field(
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
    estado: Literal["activo", "inactivo", "eliminado"]

    maquina_actual: Optional[DriverMachine]
    licencia_estado: DriverLicenseState


class DriverDeletedListItem(BaseModel):
    id: int
    nombre_completo: str
    rut: str
    telefono: str


class DriverDetail(BaseModel):
    id: int
    nombre_completo: str
    rut: str
    estado: Literal["activo", "inactivo", "eliminado"]
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

    estado: Literal["activo", "inactivo", "eliminado"]
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


class DriverReintegrate(BaseModel):
    """
    Datos requeridos para reintegrar un chofer eliminado.
    """
    correo_electronico: EmailStr = Field(
        ..., description="Correo electrónico nuevo para el chofer"
    )
    maquina_asignada: Optional[int] = Field(
        None,
        description="ID de la máquina a asignar (opcional)"
    )


class DriverListFilters(PaginationParams):
    estado: Optional[Literal["todos", "activos", "inactivos"]] = None
    licencia_estado: Optional[Literal["vencidas", "por_vencer", "vigentes"]] = None
    search: Optional[str] = None


class DriverLicenseAlerts(BaseModel):
    vencidas: int
    por_vencer: int
    vigentes: int


class DriverLiquidationFilters(PaginationParams):
    mes_desde: Optional[int] = Field(None, ge=1, le=12, description="Mes inicial del filtro")
    anio_desde: Optional[int] = Field(None, ge=2020, description="Año inicial del filtro")
    mes_hasta: Optional[int] = Field(None, ge=1, le=12, description="Mes final del filtro")
    anio_hasta: Optional[int] = Field(None, ge=2020, description="Año final del filtro")
    estado_pago: Optional[Literal["pendiente", "pagado"]] = Field(None, description="Filtrar por estado de pago")


class DriverLiquidationItem(BaseModel):
    id: int  # chofer_id + mes + anio como identificador único
    fecha: str  # "MM/YYYY"
    mes: int
    anio: int
    total_ganado: int  # Suma de base_ganado de todas las semanas del mes
    minimo_garantizado: int  # 750000
    pago_final: int  # total_pagado de la última semana o suma de todas
    metodo_pago: Optional[str] = None
    codigo_transferencia: Optional[str] = None
    estado_pago: Literal["pendiente", "pagado"]

