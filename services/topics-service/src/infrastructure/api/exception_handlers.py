from __future__ import annotations

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from src.domain.exceptions.topic_exceptions import (
    DuplicateTopicNameError,
    DuplicateTopicSlugError,
    InvalidTopicNameError,
    TopicAlreadyDeletedError,
    TopicDomainError,
    TopicNotFoundBySlugError,
    TopicNotFoundError,
)

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def _error_response(
    request: Request,
    status_code: int,
    error: str,
    detail: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": error, "detail": detail, "request_id": _request_id(request)},
    )


async def topic_not_found_handler(request: Request, exc: TopicNotFoundError) -> JSONResponse:
    return _error_response(request, 404, "topic_not_found", str(exc))


async def topic_not_found_by_slug_handler(
    request: Request, exc: TopicNotFoundBySlugError
) -> JSONResponse:
    return _error_response(request, 404, "topic_not_found", str(exc))


async def duplicate_topic_handler(
    request: Request,
    exc: DuplicateTopicNameError | DuplicateTopicSlugError,
) -> JSONResponse:
    return _error_response(request, 409, "conflict", str(exc))


async def domain_error_handler(request: Request, exc: TopicDomainError) -> JSONResponse:
    return _error_response(request, 422, "domain_error", str(exc))


async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return _error_response(
        request,
        500,
        "internal_server_error",
        "An unexpected error occurred",
    )


def register_exception_handlers(app) -> None:
    app.add_exception_handler(TopicNotFoundError, topic_not_found_handler)
    app.add_exception_handler(TopicNotFoundBySlugError, topic_not_found_by_slug_handler)
    app.add_exception_handler(DuplicateTopicNameError, duplicate_topic_handler)
    app.add_exception_handler(DuplicateTopicSlugError, duplicate_topic_handler)
    app.add_exception_handler(TopicAlreadyDeletedError, domain_error_handler)
    app.add_exception_handler(InvalidTopicNameError, domain_error_handler)
    app.add_exception_handler(Exception, internal_error_handler)
