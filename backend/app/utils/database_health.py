"""
Database health monitoring utilities for production deployment
"""
import logging
import time
from typing import Dict, Optional
from datetime import datetime, timedelta

from ..database import check_database_connection, get_database_info, SessionLocal
from sqlalchemy import text

logger = logging.getLogger(__name__)

class DatabaseHealthMonitor:
    """Monitor database health and performance metrics"""
    
    def __init__(self):
        self.last_check: Optional[datetime] = None
        self.consecutive_failures = 0
        self.max_failures_before_alert = 3
    
    def health_check(self) -> Dict:
        """
        Comprehensive database health check
        Returns detailed health information
        """
        start_time = time.time()
        health_data = {
            "status": "unknown",
            "connection_time_ms": 0,
            "last_check": datetime.utcnow().isoformat(),
            "consecutive_failures": self.consecutive_failures,
            "database_info": get_database_info(),
            "error": None
        }
        
        try:
            # Test connection
            if check_database_connection():
                connection_time = (time.time() - start_time) * 1000
                health_data.update({
                    "status": "healthy",
                    "connection_time_ms": round(connection_time, 2)
                })
                
                # Test query performance
                query_metrics = self._test_query_performance()
                health_data["query_performance"] = query_metrics
                
                # Reset failure counter on success
                self.consecutive_failures = 0
                
            else:
                self.consecutive_failures += 1
                health_data.update({
                    "status": "unhealthy",
                    "error": "Connection failed"
                })
                
        except Exception as e:
            self.consecutive_failures += 1
            health_data.update({
                "status": "unhealthy",
                "error": str(e),
                "connection_time_ms": (time.time() - start_time) * 1000
            })
            logger.error(f"Database health check failed: {e}")
        
        self.last_check = datetime.utcnow()
        
        # Alert if too many consecutive failures
        if self.consecutive_failures >= self.max_failures_before_alert:
            logger.error(f"Database has failed {self.consecutive_failures} consecutive health checks!")
        
        return health_data
    
    def _test_query_performance(self) -> Dict:
        """Test basic query performance"""
        db = SessionLocal()
        metrics = {}
        
        try:
            # Test simple SELECT
            start = time.time()
            db.execute(text("SELECT 1 as test"))
            metrics["simple_query_ms"] = round((time.time() - start) * 1000, 2)
            
            # Test table existence (if any tables exist)
            try:
                start = time.time()
                result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1") 
                                  if get_database_info()["database_type"] == "SQLite" 
                                  else text("SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 1"))
                metrics["table_query_ms"] = round((time.time() - start) * 1000, 2)
                metrics["has_tables"] = result.fetchone() is not None
            except:
                metrics["has_tables"] = False
                
        except Exception as e:
            logger.warning(f"Query performance test failed: {e}")
            metrics["error"] = str(e)
        finally:
            db.close()
        
        return metrics
    
    def is_healthy(self) -> bool:
        """Quick health status check"""
        if not self.last_check or datetime.utcnow() - self.last_check > timedelta(minutes=5):
            # Refresh if stale
            health_data = self.health_check()
            return health_data["status"] == "healthy"
        
        return self.consecutive_failures == 0

# Global instance
db_monitor = DatabaseHealthMonitor()

def get_database_health() -> Dict:
    """Get current database health status"""
    return db_monitor.health_check()

def is_database_healthy() -> bool:
    """Quick database health check"""
    return db_monitor.is_healthy()

# Database migration helpers for Heroku
def run_migrations_if_needed():
    """
    Check if migrations need to be run and run them if in production
    This is useful for Heroku's release phase
    """
    try:
        from alembic.config import Config
        from alembic import command
        import os
        
        # Only run in production
        if os.getenv("ENVIRONMENT") != "production":
            logger.info("Skipping migrations - not in production environment")
            return
        
        logger.info("Checking for pending migrations...")
        
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")
        
        # Run migrations
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
        
    except ImportError:
        logger.warning("Alembic not available, skipping migration check")
    except Exception as e:
        logger.error(f"Migration check failed: {e}")
        raise

def ensure_database_ready(max_wait: int = 120) -> bool:
    """
    Ensure database is ready for production use
    This includes connection validation and migration checks
    """
    logger.info("Ensuring database is ready for production...")
    
    # Wait for database to be available
    from ..database import wait_for_database
    if not wait_for_database(max_wait):
        logger.error("Database did not become available in time")
        return False
    
    # Run migrations if needed
    try:
        run_migrations_if_needed()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False
    
    # Final health check
    health = get_database_health()
    if health["status"] != "healthy":
        logger.error(f"Database health check failed: {health.get('error', 'Unknown error')}")
        return False
    
    logger.info("Database is ready for production use")
    return True