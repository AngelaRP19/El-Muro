from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from src.infrastructure.config.settings import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)


def _decode_token(token: str, settings: Settings) -> dict[str, Any]:
    kwargs: dict[str, Any] = {
        "algorithms": [settings.JWT_ALGORITHM],
    }
    options: dict[str, Any] = {}
    if settings.JWT_AUDIENCE:
        kwargs["audience"] = settings.JWT_AUDIENCE
    else:
        options["verify_aud"] = False
    if settings.JWT_ISSUER:
        kwargs["issuer"] = settings.JWT_ISSUER
    if options:
        kwargs["options"] = options

    return jwt.decode(token, settings.JWT_SECRET_KEY, **kwargs)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = _decode_token(credentials.credentials, settings)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
