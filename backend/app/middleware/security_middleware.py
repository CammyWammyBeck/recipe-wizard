"""
Security middleware for Recipe Wizard API
"""
import time
import hashlib
import ipaddress
from typing import Dict, List, Optional, Set, Callable
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from ..utils.logging_config import get_logger
from ..middleware.logging_middleware import log_security_event


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = get_logger("security.headers")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        security_headers = self._get_security_headers(request)
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        # Log security header addition (debug level to avoid spam)
        self.logger.debug(
            "Security headers added",
            extra={
                "request_id": getattr(request.state, "request_id", "unknown"),
                "headers_added": list(security_headers.keys()),
                "path": request.url.path
            }
        )
        
        return response
    
    def _get_security_headers(self, request: Request) -> Dict[str, str]:
        """Get security headers based on request and environment"""
        import os
        environment = os.getenv("ENVIRONMENT", "development")
        
        # Base security headers
        headers = {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            
            # XSS Protection (legacy but still useful)
            "X-XSS-Protection": "1; mode=block",
            
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Feature policy / Permissions policy
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }
        
        # Production-specific headers
        if environment == "production":
            # Strict Transport Security (HTTPS only)
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
            # Content Security Policy
            headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.openai.com; "
                "frame-ancestors 'none';"
            )
        else:
            # More relaxed CSP for development
            headers["Content-Security-Policy"] = (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "connect-src 'self' http: https:; "
                "frame-ancestors 'none';"
            )
        
        return headers


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with multiple strategies
    """
    
    def __init__(
        self,
        app: ASGIApp,
        requests_per_minute: int = 60,
        burst_size: int = 10,
        redis_url: Optional[str] = None
    ):
        super().__init__(app)
        self.logger = get_logger("security.ratelimit")
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.redis_url = redis_url
        
        # In-memory rate limiting (fallback when Redis is not available)
        self._memory_store: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self._burst_store: Dict[str, int] = defaultdict(int)
        self._last_cleanup = time.time()
        
        # Redis setup (if available)
        self._redis = None
        if redis_url:
            try:
                import redis
                self._redis = redis.from_url(redis_url, decode_responses=True)
                self.logger.info("Rate limiting using Redis backend")
            except Exception as e:
                self.logger.warning(f"Redis not available for rate limiting: {e}")
                self.logger.info("Falling back to in-memory rate limiting")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/health/live", "/health/ready"]:
            return await call_next(request)
        
        client_id = self._get_client_identifier(request)
        
        # Check rate limits
        rate_limit_result = await self._check_rate_limit(client_id, request)
        
        if not rate_limit_result["allowed"]:
            # Log rate limit violation
            log_security_event(
                "rate_limit_exceeded",
                {
                    "client_id": client_id[:16] + "...",  # Truncate for privacy
                    "ip_address": self._get_client_ip(request),
                    "path": request.url.path,
                    "requests_per_minute": rate_limit_result["requests_per_minute"],
                    "burst_exceeded": rate_limit_result.get("burst_exceeded", False)
                },
                "WARNING"
            )
            
            # Return rate limit error
            retry_after = rate_limit_result.get("retry_after", 60)
            response = Response(
                content='{"error": "Rate limit exceeded", "retry_after": ' + str(retry_after) + '}',
                status_code=429,
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after),
                    "Content-Type": "application/json"
                }
            )
            return response
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers.update({
            "X-RateLimit-Limit": str(self.requests_per_minute),
            "X-RateLimit-Remaining": str(rate_limit_result.get("remaining", 0)),
            "X-RateLimit-Reset": str(rate_limit_result.get("reset_time", int(time.time()) + 60))
        })
        
        return response
    
    async def _check_rate_limit(self, client_id: str, request: Request) -> Dict:
        """Check if request is within rate limits"""
        current_time = time.time()
        
        if self._redis:
            return await self._check_rate_limit_redis(client_id, current_time)
        else:
            return self._check_rate_limit_memory(client_id, current_time)
    
    async def _check_rate_limit_redis(self, client_id: str, current_time: float) -> Dict:
        """Redis-based rate limiting"""
        try:
            # Sliding window rate limiting
            window_start = current_time - 60  # 1 minute window
            
            # Remove old entries
            await self._redis.zremrangebyscore(f"rl:{client_id}", 0, window_start)
            
            # Count requests in current window
            request_count = await self._redis.zcard(f"rl:{client_id}")
            
            if request_count >= self.requests_per_minute:
                # Get oldest request time to calculate retry_after
                oldest_requests = await self._redis.zrange(f"rl:{client_id}", 0, 0, withscores=True)
                if oldest_requests:
                    retry_after = max(1, int(oldest_requests[0][1] + 60 - current_time))
                else:
                    retry_after = 60
                
                return {
                    "allowed": False,
                    "requests_per_minute": request_count,
                    "retry_after": retry_after
                }
            
            # Add current request
            await self._redis.zadd(f"rl:{client_id}", {str(current_time): current_time})
            await self._redis.expire(f"rl:{client_id}", 120)  # Cleanup after 2 minutes
            
            return {
                "allowed": True,
                "remaining": self.requests_per_minute - request_count - 1,
                "reset_time": int(current_time + 60)
            }
            
        except Exception as e:
            self.logger.error(f"Redis rate limiting failed: {e}")
            # Fallback to memory-based rate limiting
            return self._check_rate_limit_memory(client_id, current_time)
    
    def _check_rate_limit_memory(self, client_id: str, current_time: float) -> Dict:
        """In-memory rate limiting (fallback)"""
        # Cleanup old entries periodically
        if current_time - self._last_cleanup > 60:
            self._cleanup_memory_store(current_time)
            self._last_cleanup = current_time
        
        client_requests = self._memory_store[client_id]
        window_start = current_time - 60  # 1 minute window
        
        # Remove requests outside the window
        while client_requests and client_requests[0] < window_start:
            client_requests.popleft()
        
        # Check if limit exceeded
        if len(client_requests) >= self.requests_per_minute:
            retry_after = max(1, int(client_requests[0] + 60 - current_time))
            return {
                "allowed": False,
                "requests_per_minute": len(client_requests),
                "retry_after": retry_after
            }
        
        # Add current request
        client_requests.append(current_time)
        
        return {
            "allowed": True,
            "remaining": self.requests_per_minute - len(client_requests),
            "reset_time": int(current_time + 60)
        }
    
    def _cleanup_memory_store(self, current_time: float):
        """Clean up old entries from memory store"""
        window_start = current_time - 120  # Keep 2 minutes of data
        clients_to_remove = []
        
        for client_id, requests in self._memory_store.items():
            # Remove old requests
            while requests and requests[0] < window_start:
                requests.popleft()
            
            # Remove empty clients
            if not requests:
                clients_to_remove.append(client_id)
        
        for client_id in clients_to_remove:
            del self._memory_store[client_id]
            self._burst_store.pop(client_id, None)
    
    def _get_client_identifier(self, request: Request) -> str:
        """Generate client identifier for rate limiting"""
        # Try to get authenticated user ID first
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP-based identification
        ip = self._get_client_ip(request)
        
        # Hash IP for privacy
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16]
        return f"ip:{ip_hash}"
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class SecurityMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Monitor and detect suspicious activity
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = get_logger("security.monitor")
        
        # Threat detection patterns
        self.suspicious_patterns = [
            # SQL Injection patterns
            r"(?i)(union|select|insert|update|delete|drop|create|alter)\s+",
            r"(?i)(or|and)\s+\d+\s*=\s*\d+",
            r"(?i)'.*?'.*?(or|and)",
            
            # XSS patterns  
            r"(?i)<script[^>]*>.*?</script>",
            r"(?i)javascript:",
            r"(?i)on(click|load|error|mouseover)\s*=",
            
            # Path traversal
            r"\.\.[\\/]",
            r"(?i)(etc/passwd|boot\.ini|web\.config)",
            
            # Command injection
            r"(?i);.*?(cat|ls|ps|wget|curl)",
            r"(?i)\$\(.*?\)",
            r"(?i)`.*?`",
        ]
        
        # Compile patterns for performance
        import re
        self.compiled_patterns = [re.compile(pattern) for pattern in self.suspicious_patterns]
        
        # Track suspicious activity
        self.suspicious_clients: Dict[str, List[float]] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Analyze request for threats
        threats = self._analyze_request(request)
        
        if threats:
            client_ip = self._get_client_ip(request)
            client_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
            
            # Log security threat
            log_security_event(
                "security_threat_detected",
                {
                    "client_hash": client_hash,
                    "ip_address": client_ip,
                    "path": request.url.path,
                    "method": request.method,
                    "threats": threats,
                    "user_agent": request.headers.get("user-agent", ""),
                    "severity": "HIGH" if len(threats) > 2 else "MEDIUM"
                },
                "ERROR"
            )
            
            # Track suspicious client
            current_time = time.time()
            self.suspicious_clients[client_hash].append(current_time)
            
            # Clean up old entries (keep last hour)
            self.suspicious_clients[client_hash] = [
                t for t in self.suspicious_clients[client_hash]
                if current_time - t < 3600
            ]
            
            # Block clients with multiple threats
            if len(self.suspicious_clients[client_hash]) >= 5:
                log_security_event(
                    "client_blocked",
                    {
                        "client_hash": client_hash,
                        "ip_address": client_ip,
                        "threat_count": len(self.suspicious_clients[client_hash]),
                        "time_window": "1 hour"
                    },
                    "CRITICAL"
                )
                
                raise HTTPException(
                    status_code=403,
                    detail="Access denied due to suspicious activity"
                )
        
        return await call_next(request)
    
    def _analyze_request(self, request: Request) -> List[str]:
        """Analyze request for security threats"""
        threats = []
        
        # Check URL path
        path_threats = self._check_patterns(str(request.url.path))
        threats.extend([f"path_{threat}" for threat in path_threats])
        
        # Check query parameters
        if request.query_params:
            for key, value in request.query_params.items():
                param_threats = self._check_patterns(f"{key}={value}")
                threats.extend([f"param_{threat}" for threat in param_threats])
        
        # Check headers for suspicious content
        suspicious_headers = ["user-agent", "referer", "x-forwarded-for"]
        for header in suspicious_headers:
            if header in request.headers:
                header_threats = self._check_patterns(request.headers[header])
                threats.extend([f"header_{threat}" for threat in header_threats])
        
        return threats
    
    def _check_patterns(self, text: str) -> List[str]:
        """Check text against threat patterns"""
        threats = []
        
        for i, pattern in enumerate(self.compiled_patterns):
            if pattern.search(text):
                if i < 3:
                    threats.append("sql_injection")
                elif i < 6:
                    threats.append("xss")
                elif i < 8:
                    threats.append("path_traversal")
                else:
                    threats.append("command_injection")
        
        return list(set(threats))  # Remove duplicates
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Optional IP whitelisting middleware for admin endpoints
    """
    
    def __init__(self, app: ASGIApp, whitelisted_ips: Optional[List[str]] = None):
        super().__init__(app)
        self.logger = get_logger("security.whitelist")
        
        # Admin endpoints that require IP whitelisting
        self.protected_paths = [
            "/api/migrations/run",
            "/admin/",
        ]
        
        # Parse whitelisted IPs and networks
        self.whitelisted_networks = []
        if whitelisted_ips:
            for ip_str in whitelisted_ips:
                try:
                    network = ipaddress.ip_network(ip_str, strict=False)
                    self.whitelisted_networks.append(network)
                except ValueError as e:
                    self.logger.error(f"Invalid whitelist IP/network: {ip_str} - {e}")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if path requires IP whitelisting
        if any(request.url.path.startswith(path) for path in self.protected_paths):
            if not self.whitelisted_networks:
                # No whitelist configured, allow all (with warning)
                self.logger.warning("Admin endpoint accessed without IP whitelist configured")
                return await call_next(request)
            
            client_ip = self._get_client_ip(request)
            
            try:
                client_addr = ipaddress.ip_address(client_ip)
                is_whitelisted = any(
                    client_addr in network for network in self.whitelisted_networks
                )
                
                if not is_whitelisted:
                    log_security_event(
                        "ip_whitelist_violation",
                        {
                            "client_ip": client_ip,
                            "path": request.url.path,
                            "method": request.method,
                            "user_agent": request.headers.get("user-agent", "")
                        },
                        "WARNING"
                    )
                    
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: IP not whitelisted"
                    )
                    
            except ValueError:
                # Invalid IP address
                self.logger.error(f"Invalid client IP address: {client_ip}")
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: Invalid IP address"
                )
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


# Security utilities
def get_security_middleware_config():
    """Get security middleware configuration from environment"""
    import os
    
    return {
        "rate_limit_per_minute": int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
        "rate_limit_burst": int(os.getenv("RATE_LIMIT_BURST", "10")),
        "redis_url": os.getenv("REDIS_URL"),
        "whitelist_ips": os.getenv("ADMIN_WHITELIST_IPS", "").split(",") if os.getenv("ADMIN_WHITELIST_IPS") else None,
        "security_headers_enabled": os.getenv("SECURITY_HEADERS_ENABLED", "true").lower() == "true",
        "threat_monitoring_enabled": os.getenv("THREAT_MONITORING_ENABLED", "true").lower() == "true"
    }