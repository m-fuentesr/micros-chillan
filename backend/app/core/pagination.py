from pydantic import BaseModel
from pydantic.generics import GenericModel
from typing import Generic, List, TypeVar

T = TypeVar("T")

class PaginationParams(BaseModel):
    page: int = 1           # Página inicial
    per_page: int = 10      # Cantidad de registros por página

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class PaginatedResponse(GenericModel, Generic[T]):
    total: int              # Total de registros (incluyendo sin paginar)
    page: int               # Página actual
    per_page: int           # Tamaño de página
    items: List[T]          # Registros paginados

