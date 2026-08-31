"""
Custom exception handler for consistent error responses.

Without this:
{
  "username": ["This field is required."],
  "password": ["This field is required."]
}

With this:
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation error",
    "details": {
      "username": ["This field is required."],
      "password": ["This field is required."]
    }
  }
}
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Replace DRF's default exception handler.
    
    Called whenever a view raises an exception.
    """
    # First, let DRF handle it (converts exception to response)
    response = exception_handler(exc, context)
    
    if response is not None:
        # DRF recognized this error - wrap in our format
        custom_data = {
            "success": False,
            "error": {
                "code": response.status_code,
                "message": _get_error_message(exc),
                "details": response.data,
            }
        }
        response.data = custom_data
    else:
        # DRF didn't recognize this error - unexpected error!
        logger.error(
            f"Unexpected error: {exc}",
            exc_info=True,  # Include full traceback in logs
            extra={"context": context}  # Which view/URL caused it
        )
        response = Response(
            {
                "success": False,
                "error": {
                    "code": 500,
                    "message": "An unexpected error occurred.",
                    # Only show details in DEBUG mode (never in production!)
                    "details": str(exc) if settings.DEBUG else None,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    
    return response


def _get_error_message(exc):
    """Convert exception class to user-friendly message."""
    from rest_framework.exceptions import APIException
    
    if isinstance(exc, APIException):
        # DRF exception - get the detail message
        detail = exc.detail
        return detail if isinstance(detail, str) else "Validation error"
    
    # Map common exceptions to friendly messages
    messages = {
        "AuthenticationFailed": "Invalid credentials",
        "NotAuthenticated": "Authentication required",
        "PermissionDenied": "You don't have permission",
        "NotFound": "Resource not found",
        "ValidationError": "Validation error",
        "Throttled": "Too many requests, try again later",
    }
    
    return messages.get(exc.__class__.__name__, "An error occurred")
