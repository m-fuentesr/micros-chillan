from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import Optional


class MaintenanceRecord(BaseModel):
    id: int
    fecha: date
    item: Optional[str] = None
    categoria: Optional[str] = None
    costo: float
    numero_documento: Optional[str] = None


class MaintenanceCreate(BaseModel):
    item_repuesto_id: Optional[int] = Field(None, description="ID del ítem del catálogo")
    item_personalizado: Optional[str] = Field(None, description="Nombre escrito por el usuario")

    costo: float
    numero_documento: str
    categoria: Optional[str] = None  # preventivo / correctivo / null
    fecha_compra: date

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
        
        return v

