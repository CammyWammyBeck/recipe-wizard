from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class BaseResponse(BaseModel):
    """Base response model for all API responses"""
    success: bool = True
    message: str = "Request processed successfully"
    timestamp: datetime = datetime.utcnow()

class ErrorResponse(BaseModel):
    """Standard error response model"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

class PaginatedResponse(BaseResponse):
    """Base model for paginated responses"""
    page: int
    per_page: int
    total: int
    pages: int
    data: list

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = "healthy"  # healthy, unhealthy, degraded
    service: str = "Recipe Wizard API"
    version: str = "1.0.0"
    environment: str
    uptime_seconds: Optional[float] = None
    timestamp: datetime = datetime.utcnow()
    checks: Optional[Dict[str, Any]] = None

class StatusResponse(BaseModel):
    """Detailed status response model"""
    status: str
    services: Dict[str, Any]
    message: str
    timestamp: datetime
    uptime_seconds: Optional[float] = None
    version: str = "1.0.0"
    environment: str = "development"