"""
Production-ready database migration utilities for Recipe Wizard API
"""
import os
import logging
import subprocess
import sys
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path

from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)

class MigrationManager:
    """Manage database migrations for production deployment"""
    
    def __init__(self):
        self.alembic_cfg = self._get_alembic_config()
        self.environment = os.getenv("ENVIRONMENT", "development")
    
    def _get_alembic_config(self) -> Config:
        """Get Alembic configuration"""
        # Find alembic.ini file
        config_path = Path(__file__).parent.parent.parent / "alembic.ini"
        if not config_path.exists():
            raise FileNotFoundError(f"alembic.ini not found at {config_path}")
        
        alembic_cfg = Config(str(config_path))
        
        # Set database URL from environment
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        # Fix Heroku URL format
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        return alembic_cfg
    
    def get_migration_status(self) -> Dict:
        """Get current migration status"""
        try:
            # Get script directory
            script = ScriptDirectory.from_config(self.alembic_cfg)
            
            # Get current revision from database
            engine = create_engine(self.alembic_cfg.get_main_option("sqlalchemy.url"))
            
            with engine.connect() as conn:
                context = MigrationContext.configure(conn)
                current_rev = context.get_current_revision()
            
            # Get head revision from scripts
            head_rev = script.get_current_head()
            
            # Get all revisions
            all_revisions = list(script.walk_revisions())
            
            # Check if migrations are pending
            pending_revisions = []
            if current_rev != head_rev:
                for rev in script.walk_revisions(head_rev, current_rev):
                    if rev.revision != current_rev:
                        pending_revisions.append({
                            "revision": rev.revision,
                            "message": rev.doc,
                            "created": rev.create_date.isoformat() if rev.create_date else None
                        })
            
            return {
                "current_revision": current_rev,
                "head_revision": head_rev,
                "is_up_to_date": current_rev == head_rev,
                "pending_revisions": pending_revisions,
                "total_revisions": len(all_revisions),
                "database_url_masked": self._mask_database_url(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get migration status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def run_migrations(self, target_revision: str = "head", dry_run: bool = False) -> Dict:
        """
        Run database migrations
        
        Args:
            target_revision: Target revision (default: "head")
            dry_run: If True, show what would be done without executing
        """
        try:
            logger.info(f"Running migrations to {target_revision} (dry_run={dry_run})")
            
            if dry_run:
                # Show what would be migrated
                status = self.get_migration_status()
                return {
                    "dry_run": True,
                    "would_apply": status.get("pending_revisions", []),
                    "current_revision": status.get("current_revision"),
                    "target_revision": target_revision,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            # Get status before migration
            pre_status = self.get_migration_status()
            
            # Run migration
            command.upgrade(self.alembic_cfg, target_revision)
            
            # Get status after migration
            post_status = self.get_migration_status()
            
            logger.info("Migration completed successfully")
            
            return {
                "success": True,
                "pre_migration": {
                    "revision": pre_status.get("current_revision"),
                    "pending_count": len(pre_status.get("pending_revisions", []))
                },
                "post_migration": {
                    "revision": post_status.get("current_revision"),
                    "is_up_to_date": post_status.get("is_up_to_date", False)
                },
                "applied_revisions": pre_status.get("pending_revisions", []),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def create_migration(self, message: str, auto_generate: bool = True) -> Dict:
        """
        Create a new migration
        
        Args:
            message: Migration description
            auto_generate: Whether to auto-generate based on model changes
        """
        if self.environment == "production":
            return {
                "error": "Cannot create migrations in production environment",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        try:
            logger.info(f"Creating new migration: {message}")
            
            if auto_generate:
                command.revision(self.alembic_cfg, message=message, autogenerate=True)
            else:
                command.revision(self.alembic_cfg, message=message)
            
            # Get the newly created revision
            script = ScriptDirectory.from_config(self.alembic_cfg)
            head_rev = script.get_current_head()
            
            return {
                "success": True,
                "revision": head_rev,
                "message": message,
                "auto_generate": auto_generate,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to create migration: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def rollback_migration(self, target_revision: str) -> Dict:
        """
        Rollback to a specific revision
        
        Args:
            target_revision: Target revision to rollback to
        """
        try:
            logger.warning(f"Rolling back to revision: {target_revision}")
            
            # Get current status
            pre_status = self.get_migration_status()
            
            # Perform rollback
            command.downgrade(self.alembic_cfg, target_revision)
            
            # Get status after rollback
            post_status = self.get_migration_status()
            
            logger.info("Rollback completed successfully")
            
            return {
                "success": True,
                "pre_rollback_revision": pre_status.get("current_revision"),
                "post_rollback_revision": post_status.get("current_revision"),
                "target_revision": target_revision,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def validate_database_schema(self) -> Dict:
        """Validate that database schema matches current models"""
        try:
            # This would require comparing current database schema with models
            # For now, we'll do a basic connectivity and table existence check
            engine = create_engine(self.alembic_cfg.get_main_option("sqlalchemy.url"))
            
            with engine.connect() as conn:
                # Check if alembic version table exists
                alembic_version_exists = conn.execute(
                    text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'alembic_version')")
                ).scalar()
                
                if not alembic_version_exists:
                    return {
                        "valid": False,
                        "error": "Alembic version table not found - database not initialized",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                
                # Check core tables exist
                core_tables = ["users", "recipes", "recipe_ingredients", "conversations"]
                existing_tables = []
                missing_tables = []
                
                for table in core_tables:
                    exists = conn.execute(
                        text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")
                    ).scalar()
                    
                    if exists:
                        existing_tables.append(table)
                    else:
                        missing_tables.append(table)
                
                return {
                    "valid": len(missing_tables) == 0,
                    "existing_tables": existing_tables,
                    "missing_tables": missing_tables,
                    "alembic_initialized": alembic_version_exists,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Schema validation failed: {e}")
            return {
                "valid": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _mask_database_url(self) -> str:
        """Mask sensitive information in database URL"""
        url = self.alembic_cfg.get_main_option("sqlalchemy.url")
        if "@" in url:
            return url.split("@")[0] + "@***"
        return "sqlite" if url.startswith("sqlite") else "***"
    
    def get_migration_history(self, limit: int = 10) -> List[Dict]:
        """Get migration history"""
        try:
            script = ScriptDirectory.from_config(self.alembic_cfg)
            revisions = []
            
            for rev in script.walk_revisions():
                revisions.append({
                    "revision": rev.revision,
                    "message": rev.doc,
                    "created": rev.create_date.isoformat() if rev.create_date else None,
                    "author": getattr(rev.module, "author", None),
                    "branch_labels": rev.branch_labels,
                    "depends_on": rev.depends_on,
                })
                
                if len(revisions) >= limit:
                    break
            
            return revisions
            
        except Exception as e:
            logger.error(f"Failed to get migration history: {e}")
            return []

# Global instance
migration_manager = MigrationManager()

# Convenience functions for API endpoints
def get_migration_status() -> Dict:
    """Get current migration status"""
    return migration_manager.get_migration_status()

def run_production_migrations() -> Dict:
    """Run migrations in production"""
    return migration_manager.run_migrations()

def validate_schema() -> Dict:
    """Validate database schema"""
    return migration_manager.validate_database_schema()

def get_migration_history(limit: int = 10) -> List[Dict]:
    """Get migration history"""
    return migration_manager.get_migration_history(limit)

# Heroku release phase function
def heroku_release_migrations():
    """
    Run migrations during Heroku release phase
    This function is called by the Procfile release command
    """
    try:
        logger.info("Starting Heroku release phase migrations")
        
        # Validate environment
        if not os.getenv("DATABASE_URL"):
            logger.error("DATABASE_URL not set")
            sys.exit(1)
        
        # Run migrations
        result = run_production_migrations()
        
        if result.get("success", False):
            logger.info("Release phase migrations completed successfully")
            sys.exit(0)
        else:
            logger.error(f"Release phase migrations failed: {result.get('error')}")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Release phase failed: {e}")
        sys.exit(1)