"""Structured business exceptions for consistent API error responses."""
from rest_framework.exceptions import APIException
from rest_framework import status


class BusinessError(APIException):
    """General business-logic error with optional error code."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A business rule violation occurred.'
    default_code = 'business_error'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = detail
        if code is not None:
            self.default_code = code


class ValidationError(APIException):
    """Structured validation error."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Validation failed.'
    default_code = 'validation_error'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = detail
        if code is not None:
            self.default_code = code


class ConflictError(APIException):
    """409 Conflict -- data modified by another user since last fetch."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource has been modified. Please refresh and try again.'
    default_code = 'conflict'

    def __init__(self, detail=None, code=None):
        if detail is not None:
            self.detail = detail
        if code is not None:
            self.default_code = code
