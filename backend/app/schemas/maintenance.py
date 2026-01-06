from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import List, Optional
from app.core.pagination import PaginatedResponse
import html


class MaintenanceRecord(BaseModel):
    id: int
    fecha: date
    item: Optional[str] = None
    categoria: Optional[str] = None
    costo: float
    numero_documento: Optional[str] = None


class MaintenanceListResponse(BaseModel):
    total_registros: int  # Total filtrado (para paginación)
    total_registros_global: int  # Total sin filtros (para badge)
    gasto_mes_actual: float
    items: List[MaintenanceRecord]
    # Campos de paginación
    pagina: int
    por_pagina: int
    total_paginas: int


class MaintenanceCreate(BaseModel):
    item_repuesto_id: Optional[int] = Field(None, description="ID del ítem del catálogo")
    item_personalizado: Optional[str] = Field(None, description="Nombre escrito por el usuario")

    costo: float
    numero_documento: str
    categoria: Optional[str] = None  # preventivo / correctivo / null
    fecha_compra: date

    @field_validator('numero_documento')
    @classmethod
    def sanitize_numero_documento(cls, v: str) -> str:
        """Sanitiza el número de documento para prevenir XSS"""
        if not v:
            return v
        return html.escape(v, quote=True)

    @field_validator("categoria")
    def normalize_categoria(cls, v):
        if v is None:
            return None
        
        v_norm = (
            v.lower()
             .strip()
             .replace("á", "a")
             .replace("é", "e")
             .replace("í", "i")
             .replace("ó", "o")
             .replace("ú", "u")
        )

        if v_norm not in ("preventivo", "correctivo"):
            raise ValueError("Categoría no válida: use preventivo o correctivo.")
        return v_norm

    @field_validator("item_personalizado")
    def validate_item_fields(cls, v, info):
        rep_id = info.data.get("item_repuesto_id")

        # Validación cruzada, debe venir alguno de los dos
        if rep_id is None and not v:
            raise ValueError("Debe seleccionar un ítem o escribir uno personalizado.")
        
        # Sanitizar el texto ingresado por el usuario para prevenir XSS
        if v is None:
            return None
        return html.escape(v, quote=True)

