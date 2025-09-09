"""
CORS utilities for mobile app and web client support
"""
import logging
import re
from typing import List, Dict, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class CORSOriginValidator:
    """Validate and manage CORS origins for different environments"""
    
    # Common mobile app schemes that should be allowed
    MOBILE_SCHEMES = [
        "exp://",          # Expo development
        "capacitor://",    # Capacitor apps
        "ionic://",        # Ionic apps
        "file://",         # Cordova/PhoneGap
    ]
    
    # Development localhost patterns
    LOCALHOST_PATTERNS = [
        r"^https?://localhost(:[0-9]+)?(/.*)?$",
        r"^https?://127\.0\.0\.1(:[0-9]+)?(/.*)?$",
        r"^https?://0\.0\.0\.0(:[0-9]+)?(/.*)?$",
        r"^https?://192\.168\.\d+\.\d+(:[0-9]+)?(/.*)?$",  # Local network
        r"^https?://10\.0\.2\.2(:[0-9]+)?(/.*)?$",         # Android emulator
    ]
    
    @classmethod
    def validate_origin(cls, origin: str, environment: str = "development") -> tuple[bool, str]:
        """
        Validate a CORS origin
        Returns (is_valid, reason)
        """
        if not origin:
            return False, "Empty origin"
        
        # Check mobile app schemes
        for scheme in cls.MOBILE_SCHEMES:
            if origin.startswith(scheme):
                if cls._validate_mobile_origin(origin, scheme):
                    return True, f"Valid mobile origin ({scheme})"
                else:
                    return False, f"Invalid mobile origin format"
        
        # Check HTTP/HTTPS origins
        if origin.startswith(("http://", "https://")):
            return cls._validate_web_origin(origin, environment)
        
        return False, f"Unknown origin scheme: {origin}"
    
    @classmethod
    def _validate_mobile_origin(cls, origin: str, scheme: str) -> bool:
        """Validate mobile app origins"""
        if scheme == "exp://":
            # Expo origins: exp://ip:port
            pattern = r"^exp://[\w.-]+(:[0-9]+)?$"
            return re.match(pattern, origin) is not None
        
        elif scheme in ["capacitor://", "ionic://"]:
            # Capacitor/Ionic: scheme://localhost
            return origin == f"{scheme}localhost"
        
        elif scheme == "file://":
            # File origins for Cordova
            return True  # Allow all file:// origins
        
        return False
    
    @classmethod
    def _validate_web_origin(cls, origin: str, environment: str) -> tuple[bool, str]:
        """Validate web origins (HTTP/HTTPS)"""
        try:
            parsed = urlparse(origin)
            
            # Basic URL structure validation
            if not parsed.netloc:
                return False, "Invalid URL structure"
            
            # Environment-specific validation
            if environment == "production":
                # Production should prefer HTTPS
                if parsed.scheme == "http":
                    # Allow HTTP for localhost in production (for testing)
                    if not any(re.match(pattern, origin) for pattern in cls.LOCALHOST_PATTERNS):
                        return False, "HTTP not allowed in production (use HTTPS)"
                
                # Validate production domains
                if cls._is_localhost(parsed.netloc):
                    return False, "Localhost not allowed in production"
                
            elif environment == "development":
                # Development allows localhost patterns
                if cls._is_localhost(parsed.netloc):
                    return True, "Valid localhost development origin"
            
            # Valid web origin
            return True, f"Valid {parsed.scheme.upper()} origin"
            
        except Exception as e:
            return False, f"URL parsing error: {str(e)}"
    
    @classmethod
    def _is_localhost(cls, netloc: str) -> bool:
        """Check if netloc is localhost"""
        localhost_hosts = ["localhost", "127.0.0.1", "0.0.0.0"]
        # Remove port if present
        host = netloc.split(':')[0]
        return host in localhost_hosts or host.startswith("192.168.") or host == "10.0.2.2"
    
    @classmethod
    def get_recommended_origins(cls, environment: str, 
                              custom_domains: Optional[List[str]] = None) -> Dict[str, List[str]]:
        """Get recommended origins for different use cases"""
        recommendations = {
            "mobile_development": [
                "exp://localhost:19000",
                "exp://127.0.0.1:19000", 
                "capacitor://localhost",
                "ionic://localhost"
            ],
            "web_development": [
                "http://localhost:3000",
                "http://localhost:8080",
                "http://localhost:8081",
                "http://127.0.0.1:3000"
            ],
            "expo_web": [
                "http://localhost:19006",
                "http://127.0.0.1:19006"
            ]
        }
        
        if environment == "production" and custom_domains:
            recommendations["production_web"] = [f"https://{domain}" for domain in custom_domains]
            recommendations["production_mobile"] = [
                f"exp://{domain}" for domain in custom_domains if not domain.startswith("http")
            ]
        
        return recommendations

def test_cors_origins(origins: List[str], environment: str = "development") -> Dict:
    """Test a list of CORS origins and return validation results"""
    validator = CORSOriginValidator()
    results = {
        "valid_origins": [],
        "invalid_origins": [],
        "warnings": [],
        "recommendations": []
    }
    
    for origin in origins:
        is_valid, reason = validator.validate_origin(origin, environment)
        
        if is_valid:
            results["valid_origins"].append({"origin": origin, "reason": reason})
        else:
            results["invalid_origins"].append({"origin": origin, "reason": reason})
    
    # Add recommendations if no valid origins
    if not results["valid_origins"] and environment == "development":
        results["recommendations"] = validator.get_recommended_origins(environment)
    
    return results

def generate_expo_cors_origins(base_ips: Optional[List[str]] = None) -> List[str]:
    """Generate common Expo CORS origins for development"""
    if not base_ips:
        base_ips = ["localhost", "127.0.0.1"]
    
    origins = []
    ports = [19000, 19006]  # Expo dev server, Expo web
    
    for ip in base_ips:
        for port in ports:
            origins.append(f"exp://{ip}:{port}")
            if port == 19006:  # Web also needs HTTP
                origins.extend([
                    f"http://{ip}:{port}",
                    f"https://{ip}:{port}"
                ])
    
    # Add mobile app schemes
    origins.extend([
        "capacitor://localhost",
        "ionic://localhost"
    ])
    
    return origins