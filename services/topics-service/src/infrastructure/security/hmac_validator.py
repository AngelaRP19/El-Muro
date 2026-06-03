import base64
import hashlib
import hmac
import time
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import APIKeyHeader

from src.infrastructure.config.settings import get_settings

service_id_header = APIKeyHeader(name="x-service-id", auto_error=False)
timestamp_header = APIKeyHeader(name="x-service-timestamp", auto_error=False)
signature_header = APIKeyHeader(name="x-service-signature", auto_error=False)


async def verify_hmac(
    request: Request,
    service_id: str = Depends(service_id_header),
    timestamp: str = Depends(timestamp_header),
    signature: str = Depends(signature_header),
) -> None:
    if not service_id or not timestamp or not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing HMAC headers",
        )

    # Replay attack prevention (5 minutes)
    try:
        request_time = int(timestamp)
        now = int(time.time() * 1000)
        if abs(now - request_time) > 5 * 60 * 1000:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="HMAC timestamp expired",
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp format",
        )

    settings = get_settings()
    secret = settings.HMAC_SECRET

    # The original path, ignoring the /api/v1/topics prefix for signing
    # e.g., if full path is /api/v1/topics/internal/123/exists, the sign_path would be /internal/123/exists
    # We must match exactly what the caller signed. Let's assume the caller signs the relative path.
    # The caller (posts-service) is configured to sign `/internal/{topicId}/exists`.
    # Let's extract that exactly.
    full_path = request.url.path
    # This replaces the known prefix to match the signature.
    sign_path = full_path.replace("/api/v1/topics", "")
    method = request.method

    payload_to_sign = f"{service_id}:{timestamp}:{method}:{sign_path}"

    expected_signature_bytes = hmac.new(
        secret.encode("utf-8"),
        payload_to_sign.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    
    expected_signature = base64.b64encode(expected_signature_bytes).decode("utf-8")
    
    # Remove padding as Java HmacSigner uses Base64.getEncoder().withoutPadding()
    expected_signature_no_padding = expected_signature.rstrip("=")
    signature_no_padding = signature.rstrip("=")

    if not hmac.compare_digest(expected_signature_no_padding, signature_no_padding):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid HMAC signature",
        )
