from sqlalchemy import func
from sqlalchemy.orm import Session

from src.application.ports.output import CareerRepository
from src.domain.models import Career
from src.infrastructure.adapters.persistence.sqlalchemy_models import CareerSqlAlchemyModel


class SqlAlchemyCareerRepository(CareerRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, career: Career) -> Career:
        db_career = CareerSqlAlchemyModel(
            nombre=career.nombre,
            descripcion=career.descripcion,
        )
        self.db.add(db_career)
        self.db.commit()
        self.db.refresh(db_career)
        return self._to_domain(db_career)

    def find_by_id(self, career_id: int) -> Career | None:
        db_career = (
            self.db.query(CareerSqlAlchemyModel)
            .filter(CareerSqlAlchemyModel.id == career_id)
            .first()
        )
        return self._to_domain(db_career) if db_career else None

    def find_by_name_case_insensitive(self, nombre: str) -> Career | None:
        db_career = (
            self.db.query(CareerSqlAlchemyModel)
            .filter(func.lower(CareerSqlAlchemyModel.nombre) == func.lower(nombre))
            .first()
        )
        return self._to_domain(db_career) if db_career else None

    def list(self, skip: int = 0, limit: int = 100) -> list[Career]:
        db_careers = self.db.query(CareerSqlAlchemyModel).offset(skip).limit(limit).all()
        return [self._to_domain(db_career) for db_career in db_careers]

    def update(self, career: Career) -> Career:
        db_career = (
            self.db.query(CareerSqlAlchemyModel)
            .filter(CareerSqlAlchemyModel.id == career.id)
            .first()
        )
        db_career.nombre = career.nombre
        db_career.descripcion = career.descripcion
        self.db.commit()
        self.db.refresh(db_career)
        return self._to_domain(db_career)

    def delete(self, career: Career) -> None:
        db_career = (
            self.db.query(CareerSqlAlchemyModel)
            .filter(CareerSqlAlchemyModel.id == career.id)
            .first()
        )
        self.db.delete(db_career)
        self.db.commit()

    def count(self) -> int:
        return self.db.query(func.count(CareerSqlAlchemyModel.id)).scalar()

    @staticmethod
    def _to_domain(db_career: CareerSqlAlchemyModel) -> Career:
        return Career(
            id=db_career.id,
            nombre=db_career.nombre,
            descripcion=db_career.descripcion,
            created_at=db_career.created_at,
            updated_at=db_career.updated_at,
        )
