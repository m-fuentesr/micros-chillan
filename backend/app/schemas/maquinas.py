from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class EstadoOperativo(str):
    OPERATIVA = "operativa"
    INACTIVA = "inactiva"
    EN_TALLER = "en_taller"


class MaquinaBase(BaseModel):
    numero_interno: int
    marca: str
    anio_fabricacion: int
    patente: Optional[str] = None
    descripcion: Optional[str] = None
    estado_operativo: str = EstadoOperativo.OPERATIVA
    kilometraje_inicial: int
    fecha_venc_revision_tecnica: date
    fecha_venc_permiso_circulacion: date
    fecha_venc_seguro: date


class MaquinaCreate(MaquinaBase):
    pass


class MaquinaUpdate(BaseModel):
    numero_interno: Optional[int] = None
    marca: Optional[str] = None
    anio_fabricacion: Optional[int] = None
    patente: Optional[str] = None
    descripcion: Optional[str] = None
    estado_operativo: Optional[str] = None
    kilometraje_inicial: Optional[int] = None
    fecha_venc_revision_tecnica: Optional[date] = None
    fecha_venc_permiso_circulacion: Optional[date] = None
    fecha_venc_seguro: Optional[date] = None


class MaquinaInDB(MaquinaBase):
    id: int
    created_at: datetime
    updated_at: datetime
