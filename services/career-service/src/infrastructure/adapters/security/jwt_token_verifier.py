import jwt

from src.application.ports.output import AuthenticatedUser, AuthTokenVerifier
from src.infrastructure.config import Settings


class JwtAuthTokenVerifier(AuthTokenVerifier):
    def __init__(self, settings: Settings):
        self.settings = settings

    def verify(self, token: str) -> AuthenticatedUser:
        payload = jwt.decode(
            token,
            self.settings.secret_key,
            algorithms=[self.settings.algorithm],
        )

        user_id = payload.get("userId")
        role = payload.get("rol")
        if not user_id or not role:
            raise jwt.InvalidTokenError("Token missing required auth claims")

        return AuthenticatedUser(user_id=str(user_id), role=str(role).lower())
