"""
Logging middleware for request/response tracking
"""
import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from ..utils.logging_config import get_logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log HTTP requests and responses with timing information
    """
    
    def __init__(self, app: ASGIApp, logger_name: str = "requests"):
        super().__init__(app)
        self.logger = get_logger(logger_name)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())[:8]
        
        # Add request ID to request state for access in route handlers
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Log incoming request
        self._log_request(request, request_id)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
            
            # Log successful response
            self._log_response(request, response, process_time, request_id)
            
            return response
            
        except Exception as e:
            # Calculate response time for error case
            process_time = time.time() - start_time
            
            # Log error
            self.logger.error(
                "Request failed with exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "client_ip": self._get_client_ip(request),
                    "user_agent": request.headers.get("user-agent", ""),
                    "process_time_ms": round(process_time * 1000, 2),
                    "error": str(e),
                    "error_type": type(e).__name__
                },
                exc_info=True
            )
            
            # Re-raise the exception
            raise
    
    def _log_request(self, request: Request, request_id: str):
        """Log incoming request details"""
        # Don't log health check requests at INFO level to reduce noise
        if request.url.path in ["/health", "/health/live"]:
            log_level = logging.DEBUG
        else:
            log_level = logging.INFO
        
        self.logger.log(
            log_level,
            "Incoming request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "query_params": dict(request.query_params) if request.query_params else None,
                "client_ip": self._get_client_ip(request),
                "user_agent": request.headers.get("user-agent", ""),
                "content_type": request.headers.get("content-type"),
                "content_length": request.headers.get("content-length"),
                "origin": request.headers.get("origin"),
                "referer": request.headers.get("referer"),
            }
        )
    
    def _log_response(self, request: Request, response: Response, 
                     process_time: float, request_id: str):
        """Log response details"""
        # Determine log level based on status code
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        elif request.url.path in ["/health", "/health/live"]:
            log_level = logging.DEBUG  # Reduce noise from health checks
        else:
            log_level = logging.INFO
        
        # Determine response category
        if response.status_code < 300:
            status_category = "success"
        elif response.status_code < 400:
            status_category = "redirect"
        elif response.status_code < 500:
            status_category = "client_error"
        else:
            status_category = "server_error"
        
        self.logger.log(
            log_level,
            f"Request {status_category}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "status_code": response.status_code,
                "status_category": status_category,
                "process_time_ms": round(process_time * 1000, 2),
                "response_size": response.headers.get("content-length"),
                "content_type": response.headers.get("content-type"),
                "client_ip": self._get_client_ip(request),
            }
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address, considering proxy headers"""
        # Check for forwarded headers (common in production deployments)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, first is the original client
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"


class DatabaseLoggingMixin:
    """Mixin to add database operation logging to database classes"""
    
    def __init__(self):
        self.db_logger = get_logger("database")
    
    def log_query(self, operation: str, table: str, duration_ms: float = None, 
                  record_count: int = None, error: str = None):
        """Log database query operations"""
        extra_data = {
            "operation": operation,
            "table": table,
        }
        
        if duration_ms is not None:
            extra_data["duration_ms"] = round(duration_ms, 2)
        
        if record_count is not None:
            extra_data["record_count"] = record_count
        
        if error:
            extra_data["error"] = error
            self.db_logger.error(f"Database {operation} failed on {table}", extra=extra_data)
        else:
            # Log slow queries as warnings
            if duration_ms and duration_ms > 1000:  # > 1 second
                log_level = logging.WARNING
                message = f"Slow database {operation} on {table}"
            else:
                log_level = logging.DEBUG
                message = f"Database {operation} on {table}"
            
            self.db_logger.log(log_level, message, extra=extra_data)


class ExternalAPILoggingMixin:
    """Mixin to add external API call logging"""
    
    def __init__(self):
        self.api_logger = get_logger("external_api")
    
    def log_api_call(self, service: str, endpoint: str, method: str = "GET",
                    status_code: int = None, duration_ms: float = None,
                    request_size: int = None, response_size: int = None,
                    error: str = None):
        """Log external API calls"""
        extra_data = {
            "service": service,
            "endpoint": endpoint,
            "method": method,
        }
        
        if status_code is not None:
            extra_data["status_code"] = status_code
        
        if duration_ms is not None:
            extra_data["duration_ms"] = round(duration_ms, 2)
        
        if request_size is not None:
            extra_data["request_size"] = request_size
        
        if response_size is not None:
            extra_data["response_size"] = response_size
        
        if error:
            extra_data["error"] = error
            self.api_logger.error(f"External API call failed: {service}", extra=extra_data)
        else:
            # Determine log level based on status code and duration
            if status_code and status_code >= 400:
                log_level = logging.WARNING
            elif duration_ms and duration_ms > 5000:  # > 5 seconds
                log_level = logging.WARNING
            else:
                log_level = logging.INFO
            
            self.api_logger.log(
                log_level,
                f"External API call: {service}",
                extra=extra_data
            )


# Security logging functions
def log_security_event(event_type: str, details: dict, severity: str = "INFO"):
    """Log security-related events"""
    security_logger = get_logger("security")
    
    log_data = {
        "event_type": event_type,
        "severity": severity,
        **details
    }
    
    level = getattr(logging, severity.upper(), logging.INFO)
    security_logger.log(level, f"Security event: {event_type}", extra=log_data)


def log_authentication_event(user_id: str = None, email: str = None, 
                           event: str = "login", success: bool = True,
                           ip_address: str = None, user_agent: str = None):
    """Log authentication events"""
    details = {
        "user_id": user_id,
        "email": email,
        "event": event,
        "success": success,
        "ip_address": ip_address,
        "user_agent": user_agent,
    }
    
    severity = "INFO" if success else "WARNING"
    log_security_event("authentication", details, severity)


def log_authorization_failure(user_id: str = None, email: str = None,
                            resource: str = None, action: str = None,
                            ip_address: str = None):
    """Log authorization failures"""
    details = {
        "user_id": user_id,
        "email": email,
        "resource": resource,
        "action": action,
        "ip_address": ip_address,
    }
    
    log_security_event("authorization_failure", details, "WARNING")