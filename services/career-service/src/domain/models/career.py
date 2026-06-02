from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Career:
    id: Optional[int]
    nombre: str
    descripcion: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

