import logging

import httpx

from src.application.dtos import SubjectResponseDTO
from src.application.ports.output import SubjectClient
from src.infrastructure.config import get_settings

logger = logging.getLogger(__name__)


class SubjectsHttpClient(SubjectClient):
    @staticmethod
    def _base_url() -> str:
        return get_settings().materias_service_url.rstrip("/")

    def get_subjects_by_career(self, career_id: int) -> list[SubjectResponseDTO]:
        try:
            url = f"{self._base_url()}/api/materias/carrera/{career_id}"
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url)
                response.raise_for_status()
                return [SubjectResponseDTO.model_validate(item) for item in response.json()]
        except Exception as exc:
            logger.warning(
                "No fue posible consultar materias para carrera %s: %s",
                career_id,
                str(exc),
            )
            return []

    def delete_subjects_by_career(self, career_id: int) -> bool:
        try:
            url = f"{self._base_url()}/api/materias/carrera/{career_id}/all"
            with httpx.Client(timeout=5.0) as client:
                response = client.delete(url)
                if response.status_code == 200:
                    logger.info("Materias de carrera %s eliminadas en materias-service", career_id)
                    return True
                logger.warning("Error al eliminar materias: %s", response.status_code)
                return False
        except Exception as exc:
            logger.error("Error eliminando materias en materias-service: %s", str(exc))
            return False
