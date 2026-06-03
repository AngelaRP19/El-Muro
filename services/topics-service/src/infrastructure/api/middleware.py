from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class CorrelationMiddleware(BaseHTTPMiddleware):
    """Propagates X-Request-ID and X-Correlation-ID; adds X-Response-Time."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        correlation_id = request.headers.get("X-Correlation-ID") or request_id

        request.state.request_id = request_id
        request.state.correlation_id = correlation_id

        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
        return response
