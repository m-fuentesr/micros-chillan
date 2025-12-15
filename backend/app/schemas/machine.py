from typing import Literal, Optional
from pydantic import BaseModel, Field
from datetime import date


class MachineSelect(BaseModel): # Para vista de choferes (selector)
    id: int
    numero_interno: str
    marca: str
    modelo: str         
    anio: int           
    patente: str
    display_name: str  # Campo extra útil para mostrar "105 - Volvo" en el dropdown


class DocumentoMaquina(BaseModel): 
    fecha_vencimiento: date
    estado: Literal["vencido", "por_vencer", "ok"]


class MachineDriver(BaseModel):
    id: int
    nombre_completo: str


class MachineListItem(BaseModel):
    id: int
    numero_interno: int
    marca: str
    patente: str
    estado_operativo: str

    chofer_asignado: Optional[MachineDriver]

    documentos: dict  # revision_tecnica, permiso_circulacion, seguro_obligatorio
    

class MachineCreateDocuments(BaseModel):
    fecha_venc_revision_tecnica: date
    fecha_venc_permiso_circulacion: date
    fecha_venc_seguro_obligatorio: date


class MachineCreate(BaseModel):
    numero_interno: int = Field(..., description="Número interno único")
    patente: str
    marca: str
    anio_fabricacion: int
    estado_operativo: str

    chofer_id: Optional[int] = None

    documentos: MachineCreateDocuments
    

class MachineDetailDocuments(BaseModel):
    fecha_venc_revision_tecnica: date
    fecha_venc_permiso_circulacion: date
    fecha_venc_seguro_obligatorio: date


class MachineDetail(BaseModel):
    id: int
    numero_interno: int
    patente: str
    marca: str
    anio_fabricacion: int
    estado_operativo: str

    chofer_actual_id: Optional[int]

    documentos: MachineDetailDocuments


class MachineUpdateDocuments(BaseModel):
    fecha_venc_revision_tecnica: date
    fecha_venc_permiso_circulacion: date
    fecha_venc_seguro_obligatorio: date


class MachineUpdate(BaseModel):
    numero_interno: int
    patente: str
    marca: str
    anio_fabricacion: int
    estado_operativo: str
    chofer_id: Optional[int] = None
    documentos: MachineUpdateDocuments


class MachineAssignmentItem(BaseModel):
    id: int
    chofer_id: int
    chofer_nombre: str
    fecha_inicio: str  # ISO date string
    fecha_fin: Optional[str]  # ISO date string o None
    estado: str  # "Activa" o "Cerrada"
    dias_asignado: int