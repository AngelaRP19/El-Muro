from fastapi import APIRouter, Depends, HTTPException, Query

from src.application.dtos import (
    CareerCreateDTO,
    CareerDetailResponseDTO,
    CareerResponseDTO,
    CareerUpdateDTO,
)
from src.application.usecases import CareerUseCase
from src.domain.exceptions import CareerNotFoundError, DuplicateCareerError
from src.infrastructure.adapters.http.dependencies import get_career_use_case
from src.infrastructure.config.security import require_admin, require_any_role
from src.infrastructure.config.hmac_validator import verify_hmac

router = APIRouter(
    prefix="/api/carreras",
    tags=["carreras"],
)


@router.post("/crear", response_model=CareerResponseDTO, status_code=201)
def crear_carrera(
    carrera_data: CareerCreateDTO,
    use_case: CareerUseCase = Depends(get_career_use_case),
    role: str = Depends(require_admin),
):
    try:
        return use_case.create_career(carrera_data)
    except DuplicateCareerError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/", response_model=list[CareerResponseDTO])
def obtener_carreras(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    use_case: CareerUseCase = Depends(get_career_use_case),
    role: str = Depends(require_any_role),
):
    return use_case.list_careers(skip, limit)


@router.get("/internal/{carrera_id}/exists")
def existe_carrera(
    carrera_id: int,
    use_case: CareerUseCase = Depends(get_career_use_case),
    _hmac: None = Depends(verify_hmac),
):
    return {"exists": use_case.career_exists(carrera_id)}


@router.get("/{carrera_id}", response_model=CareerDetailResponseDTO)
def obtener_carrera(
    carrera_id: int,
    use_case: CareerUseCase = Depends(get_career_use_case),
    role: str = Depends(require_any_role),
):
    try:
        return use_case.get_career_by_id(carrera_id)
    except CareerNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/{carrera_id}", response_model=CareerResponseDTO)
def actualizar_carrera(
    carrera_id: int,
    carrera_data: CareerUpdateDTO,
    use_case: CareerUseCase = Depends(get_career_use_case),
    role: str = Depends(require_admin),
):
    try:
        return use_case.update_career(carrera_id, carrera_data)
    except CareerNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DuplicateCareerError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{carrera_id}")
def eliminar_carrera(
    carrera_id: int,
    use_case: CareerUseCase = Depends(get_career_use_case),
    role: str = Depends(require_admin),
):
    try:
        return use_case.delete_career(carrera_id)
    except CareerNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

