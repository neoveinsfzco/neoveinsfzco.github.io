from __future__ import annotations

from typing import Callable

from django.http import HttpRequest, HttpResponse


class CspFrameAncestorsMiddleware:
    """
    Set CSP frame-ancestors for dev iframe embedding.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response.headers['Content-Security-Policy'] = (
            "frame-ancestors 'self' http://127.0.0.1:5173 http://localhost:5173"
        )
        return response
