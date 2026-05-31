from enum import Enum
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException

from src.application.ports.output import AuthenticatedUser, AuthTokenVerifier
from src.infrastructure.adapters.security import JwtAuthTokenVerifier
from src.infrastructure.config import get_settings


class RoleEnum(str, Enum):
    ADMIN = "admin"
    ESTUDIANTE = "estudiante"


def get_auth_token_verifier() -> AuthTokenVerifier:
    return JwtAuthTokenVerifier(get_settings())


async def get_current_user(
    authorization: Optional[str] = Header(None),
    token_verifier: AuthTokenVerifier = Depends(get_auth_token_verifier),
) -> AuthenticatedUser:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Token no proporcionado",
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Formato de autorizacion invalido. Use: Authorization: Bearer <token>",
        )

    try:
        return token_verifier.verify(parts[1])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expirado") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Token invalido: {str(exc)}") from exc


async def get_current_role(current_user: AuthenticatedUser = Depends(get_current_user)) -> str:
    try:
        role = RoleEnum(current_user.role)
        return role.value
    except ValueError as exc:
        raise HTTPException(
            status_code=403,
            detail=f"Rol invalido en token: {current_user.role}",
        ) from exc


def require_admin(role: str = Depends(get_current_role)) -> str:
    if role != RoleEnum.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Permisos insuficientes. Requiere rol admin.",
        )
    return role


def require_any_role(role: str = Depends(get_current_role)) -> str:
    return role
