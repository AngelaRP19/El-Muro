from fastapi import Depends
from sqlalchemy.orm import Session

from src.application.usecases import CareerUseCase
from src.infrastructure.adapters.clients import SubjectsHttpClient
from src.infrastructure.adapters.persistence import SqlAlchemyCareerRepository
from src.infrastructure.config.database import get_db


def get_career_use_case(db: Session = Depends(get_db)) -> CareerUseCase:
    return CareerUseCase(
        repository=SqlAlchemyCareerRepository(db),
        subject_client=SubjectsHttpClient(),
    )

