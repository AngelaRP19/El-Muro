from src.application.dtos import CareerCreateDTO, CareerUpdateDTO
from src.application.ports import CareerRepository, SubjectClient
from src.domain.exceptions import CareerNotFoundError, DuplicateCareerError
from src.domain.models import Career


class CareerUseCase:
    def __init__(self, repository: CareerRepository, subject_client: SubjectClient):
        self.repository = repository
        self.subject_client = subject_client

    def create_career(self, career_data: CareerCreateDTO) -> Career:
        existing = self.repository.find_by_name_case_insensitive(career_data.nombre)
        if existing:
            raise DuplicateCareerError(f"Carrera con nombre '{career_data.nombre}' ya existe")

        career = Career(
            id=None,
            nombre=career_data.nombre.strip(),
            descripcion=career_data.descripcion,
        )
        return self.repository.create(career)

    def get_career_by_id(self, career_id: int) -> dict:
        career = self._get_career(career_id)
        subjects = self.subject_client.get_subjects_by_career(career_id)
        return {
            "id": career.id,
            "nombre": career.nombre,
            "descripcion": career.descripcion,
            "created_at": career.created_at,
            "updated_at": career.updated_at,
            "materias": subjects,
        }

    def list_careers(self, skip: int = 0, limit: int = 100) -> list[Career]:
        return self.repository.list(skip=skip, limit=limit)

    def update_career(self, career_id: int, career_data: CareerUpdateDTO) -> Career:
        career = self._get_career(career_id)

        if career_data.nombre:
            existing = self.repository.find_by_name_case_insensitive(career_data.nombre)
            if existing and existing.id != career_id:
                raise DuplicateCareerError(
                    f"Ya existe una carrera con el nombre '{career_data.nombre}'"
                )

        update_data = career_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(career, field, value)

        return self.repository.update(career)

    def delete_career(self, career_id: int) -> dict:
        career = self._get_career(career_id)
        career_name = career.nombre

        self.subject_client.delete_subjects_by_career(career_id)
        self.repository.delete(career)

        return {
            "message": f"Carrera '{career_name}' eliminada exitosamente (incluyendo todas sus materias)",
            "deleted_carrera_id": career_id,
        }

    def career_exists(self, career_id: int) -> bool:
        return self.repository.find_by_id(career_id) is not None

    def get_career_count(self) -> int:
        return self.repository.count()

    def _get_career(self, career_id: int) -> Career:
        career = self.repository.find_by_id(career_id)
        if not career:
            raise CareerNotFoundError("Carrera no encontrada")
        return career
