"""
Comprehensive health monitoring system for production deployment
"""
import logging
import time
import psutil
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..database import check_database_connection, get_database_info
from ..services.llm_service import check_llm_service_status
from .database_health import get_database_health

logger = logging.getLogger(__name__)

# Global startup time for uptime calculation
STARTUP_TIME = time.time()

class HealthMonitor:
    """Comprehensive health monitoring for the Recipe Wizard API"""
    
    def __init__(self):
        self.last_full_check: Optional[datetime] = None
        self.cached_results: Dict[str, Any] = {}
        self.cache_duration = timedelta(seconds=30)  # Cache results for 30 seconds
    
    async def quick_health_check(self) -> Dict[str, Any]:
        """
        Quick health check for basic liveness probe
        Should complete in <1 second
        """
        start_time = time.time()
        
        try:
            # Basic checks that must pass
            uptime = time.time() - STARTUP_TIME
            
            # Quick database ping (with short timeout)
            db_alive = check_database_connection(max_retries=1, retry_delay=0)
            
            # Basic system metrics
            memory_percent = psutil.virtual_memory().percent
            disk_percent = psutil.disk_usage('/').percent
            
            status = "healthy"
            checks = {
                "api": "running",
                "database": "connected" if db_alive else "disconnected",
                "memory_usage": f"{memory_percent:.1f}%",
                "disk_usage": f"{disk_percent:.1f}%",
                "response_time_ms": round((time.time() - start_time) * 1000, 2)
            }
            
            # Determine overall status
            if not db_alive:
                status = "unhealthy"
            elif memory_percent > 90 or disk_percent > 90:
                status = "degraded"
            
            return {
                "status": status,
                "service": "Recipe Wizard API",
                "version": "1.0.0",
                "environment": os.getenv("ENVIRONMENT", "development"),
                "uptime_seconds": round(uptime, 2),
                "timestamp": datetime.utcnow().isoformat(),
                "checks": checks
            }
            
        except Exception as e:
            logger.error(f"Quick health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "Recipe Wizard API",
                "version": "1.0.0", 
                "environment": os.getenv("ENVIRONMENT", "development"),
                "uptime_seconds": round(time.time() - STARTUP_TIME, 2),
                "timestamp": datetime.utcnow().isoformat(),
                "checks": {
                    "error": str(e),
                    "response_time_ms": round((time.time() - start_time) * 1000, 2)
                }
            }
    
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check with all service dependencies
        May take 2-5 seconds to complete
        """
        # Use cache if recent
        if (self.last_full_check and 
            datetime.utcnow() - self.last_full_check < self.cache_duration):
            logger.debug("Using cached comprehensive health check results")
            return self.cached_results
        
        start_time = time.time()
        uptime = time.time() - STARTUP_TIME
        
        try:
            # Detailed service checks
            services = await self._check_all_services()
            
            # System resource checks
            system_health = self._check_system_resources()
            
            # Connectivity checks
            connectivity = await self._check_connectivity()
            
            # Determine overall status
            critical_services = ["database", "api"]
            service_statuses = [
                services.get(svc, {}).get("status", "unknown") 
                for svc in critical_services
            ]
            
            if any(status == "disconnected" for status in service_statuses):
                overall_status = "unhealthy"
            elif (any(status == "degraded" for status in service_statuses) or 
                  system_health.get("memory_critical", False) or
                  system_health.get("disk_critical", False)):
                overall_status = "degraded"
            else:
                overall_status = "operational"
            
            # Build comprehensive response
            result = {
                "status": overall_status,
                "uptime_seconds": round(uptime, 2),
                "environment": os.getenv("ENVIRONMENT", "development"),
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat(),
                "response_time_ms": round((time.time() - start_time) * 1000, 2),
                "services": services,
                "system": system_health,
                "connectivity": connectivity,
                "message": self._get_status_message(overall_status, services)
            }
            
            # Cache results
            self.cached_results = result
            self.last_full_check = datetime.utcnow()
            
            return result
            
        except Exception as e:
            logger.error(f"Comprehensive health check failed: {e}")
            return {
                "status": "unhealthy",
                "uptime_seconds": round(uptime, 2),
                "environment": os.getenv("ENVIRONMENT", "development"),
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat(),
                "response_time_ms": round((time.time() - start_time) * 1000, 2),
                "error": str(e)
            }
    
    async def _check_all_services(self) -> Dict[str, Any]:
        """Check all service dependencies"""
        services = {}
        
        # API service (always running if we get here)
        services["api"] = {
            "status": "running",
            "uptime_seconds": round(time.time() - STARTUP_TIME, 2)
        }
        
        # Database service
        try:
            db_health = get_database_health()
            db_info = get_database_info()
            services["database"] = {
                "status": db_health.get("status", "unknown"),
                "connection_time_ms": db_health.get("connection_time_ms", 0),
                "consecutive_failures": db_health.get("consecutive_failures", 0),
                "database_type": db_info.get("database_type", "unknown"),
                "pool_size": db_info.get("pool_size"),
                "pool_recycle": db_info.get("pool_recycle")
            }
        except Exception as e:
            services["database"] = {
                "status": "disconnected",
                "error": str(e)
            }
        
        # LLM service (OpenAI)
        try:
            llm_status = await check_llm_service_status()
            services["llm_service"] = {
                "status": llm_status.get("status", "unknown"),
                "service": llm_status.get("service", "unknown"),
                "default_model": llm_status.get("default_model"),
                "available_models": llm_status.get("available_models", [])
            }
        except Exception as e:
            services["llm_service"] = {
                "status": "disconnected",
                "error": str(e)
            }
        
        return services
    
    def _check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        try:
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_mb = memory.available // (1024 * 1024)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free_gb = disk.free // (1024 * 1024 * 1024)
            
            # CPU usage (quick sample)
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            # Load average (Linux/Mac only)
            try:
                load_avg = os.getloadavg()
                load_1min = load_avg[0]
            except:
                load_1min = None
            
            return {
                "memory": {
                    "percent": round(memory_percent, 1),
                    "available_mb": memory_available_mb,
                    "critical": memory_percent > 90
                },
                "disk": {
                    "percent": round(disk_percent, 1),
                    "free_gb": disk_free_gb,
                    "critical": disk_percent > 90
                },
                "cpu": {
                    "percent": round(cpu_percent, 1),
                    "load_1min": round(load_1min, 2) if load_1min else None
                },
                "memory_critical": memory_percent > 90,
                "disk_critical": disk_percent > 90
            }
            
        except Exception as e:
            logger.error(f"System resource check failed: {e}")
            return {"error": str(e)}
    
    async def _check_connectivity(self) -> Dict[str, Any]:
        """Check external connectivity"""
        connectivity = {}
        
        # Check if we can resolve DNS
        try:
            import socket
            socket.gethostbyname("google.com")
            connectivity["dns"] = "working"
        except:
            connectivity["dns"] = "failed"
        
        # Check internet connectivity (optional)
        try:
            import requests
            response = requests.get("https://api.openai.com/v1/models", timeout=5)
            connectivity["openai_api"] = "accessible" if response.status_code == 401 else "unknown"
        except requests.exceptions.Timeout:
            connectivity["openai_api"] = "timeout"
        except:
            connectivity["openai_api"] = "unreachable"
        
        return connectivity
    
    def _get_status_message(self, status: str, services: Dict[str, Any]) -> str:
        """Generate human-readable status message"""
        if status == "unhealthy":
            failed_services = [
                name for name, info in services.items() 
                if info.get("status") in ["disconnected", "failed"]
            ]
            return f"Service unhealthy - issues with: {', '.join(failed_services)}"
        
        elif status == "degraded":
            return "Service operational but with performance issues"
        
        else:
            return "All systems operational"
    
    async def readiness_check(self) -> Dict[str, Any]:
        """
        Readiness check - determines if app is ready to serve traffic
        Used by Kubernetes/container orchestrators
        """
        # Must have working database connection
        db_ready = check_database_connection(max_retries=1)
        
        # Must have basic system resources available
        memory = psutil.virtual_memory()
        memory_ok = memory.percent < 95
        
        disk = psutil.disk_usage('/')
        disk_ok = disk.percent < 95
        
        ready = db_ready and memory_ok and disk_ok
        
        return {
            "ready": ready,
            "checks": {
                "database": "ready" if db_ready else "not_ready",
                "memory": "ok" if memory_ok else "critical",
                "disk": "ok" if disk_ok else "critical"
            },
            "timestamp": datetime.utcnow().isoformat()
        }

# Global instance
health_monitor = HealthMonitor()

# Convenience functions
async def get_quick_health() -> Dict[str, Any]:
    """Get quick health status"""
    return await health_monitor.quick_health_check()

async def get_comprehensive_health() -> Dict[str, Any]:
    """Get comprehensive health status"""
    return await health_monitor.comprehensive_health_check()

async def get_readiness_status() -> Dict[str, Any]:
    """Get readiness status"""
    return await health_monitor.readiness_check()