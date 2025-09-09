from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool, NullPool
import os
from typing import Generator
import logging
import time

from .models import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recipe_wizard.db")

# Fix Heroku PostgreSQL URL if needed (they use postgres:// but SQLAlchemy expects postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    logger.info("Fixed DATABASE_URL for SQLAlchemy compatibility")

# Environment settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# SQLite-specific configuration for development
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,  # Allow SQLite to be used across threads
            "timeout": 20,  # 20 seconds timeout for database operations
        },
        echo=os.getenv("DEBUG", "false").lower() == "true"  # Echo SQL queries in debug mode
    )
else:
    # PostgreSQL configuration for production
    # Heroku-specific optimizations
    if ENVIRONMENT == "production":
        # Production settings optimized for Heroku
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,     # Validate connections before use
            pool_recycle=1800,      # Recycle connections after 30 minutes (Heroku limit)
            pool_size=2,            # Conservative pool size for free tier
            max_overflow=3,         # Limited overflow for resource constraints
            pool_timeout=30,        # Connection timeout
            connect_args={
                "sslmode": "require",    # Require SSL in production
                "connect_timeout": 30    # Connection timeout
            },
            echo=DEBUG,
            echo_pool=DEBUG if DEBUG else False
        )
    else:
        # Development PostgreSQL settings
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,  # Validate connections before use
            pool_recycle=300,    # Recycle connections after 5 minutes
            pool_size=5,         # Connection pool size
            max_overflow=10,     # Maximum overflow connections
            echo=DEBUG
        )

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def create_tables():
    """Create all tables in the database"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

def drop_tables():
    """Drop all tables in the database (use with caution!)"""
    try:
        logger.warning("Dropping all database tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Failed to drop database tables: {e}")
        raise

def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    Used with FastAPI's Depends() for automatic session management.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def get_db_session() -> Session:
    """
    Get a database session for manual use.
    Remember to close it when done!
    """
    return SessionLocal()

def check_database_connection(max_retries: int = 3, retry_delay: float = 1.0) -> bool:
    """
    Check if database connection is working with retries.
    Returns True if connection is successful, False otherwise.
    """
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Try a simple query
            db.execute(text("SELECT 1"))
            db.close()
            logger.info(f"Database connection successful (attempt {attempt + 1})")
            return True
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                logger.error(f"Database connection failed after {max_retries} attempts")
    return False

def init_database():
    """
    Initialize the database by creating tables.
    This should be called when the application starts.
    """
    try:
        logger.info(f"Initializing database (Environment: {ENVIRONMENT})...")
        logger.info(f"Database URL (masked): {DATABASE_URL.split('@')[0] if '@' in DATABASE_URL else 'sqlite'}@***")
        
        # Check connection first
        if not check_database_connection():
            raise ConnectionError("Unable to connect to database")
        
        # Create tables if they don't exist
        create_tables()
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        if ENVIRONMENT == "production":
            # In production, we want to fail fast if database is not available
            raise
        else:
            # In development, log but continue (might be using mock data)
            logger.warning("Continuing despite database initialization failure in development mode")

def wait_for_database(max_wait: int = 60) -> bool:
    """
    Wait for database to become available (useful for Heroku startup).
    Returns True if database becomes available, False if timeout.
    """
    logger.info("Waiting for database to become available...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        if check_database_connection(max_retries=1, retry_delay=0):
            logger.info("Database is now available")
            return True
        
        logger.info("Database not ready, waiting...")
        time.sleep(2)
    
    logger.error(f"Database did not become available within {max_wait} seconds")
    return False

def get_database_info() -> dict:
    """
    Get information about the current database configuration.
    """
    db_type = "SQLite" if DATABASE_URL.startswith("sqlite") else "PostgreSQL"
    
    return {
        "database_type": db_type,
        "environment": ENVIRONMENT,
        "pool_size": getattr(engine.pool, 'size', None),
        "max_overflow": getattr(engine.pool, 'max_overflow', None),
        "pool_recycle": getattr(engine, 'pool_recycle', None),
        "echo": engine.echo,
        "url_masked": DATABASE_URL.split('@')[0] + "@***" if '@' in DATABASE_URL else "sqlite"
    }

# Database utilities for common operations
class DatabaseManager:
    """Utility class for database operations"""
    
    @staticmethod
    def create_user_with_defaults(email: str, hashed_password: str, **kwargs) -> 'User':
        """Create a new user with default preferences"""
        from .models import User
        
        # Default grocery categories
        default_categories = [
            'produce', 'butchery', 'dry-goods', 'chilled', 
            'frozen', 'pantry', 'bakery', 'deli', 'beverages', 'spices'
        ]
        
        user_data = {
            'email': email,
            'hashed_password': hashed_password,
            'grocery_categories': default_categories,
            'dietary_restrictions': [],
            'allergens': [],
            'dislikes': [],
            **kwargs
        }
        
        db = SessionLocal()
        try:
            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        finally:
            db.close()
    
    @staticmethod
    def get_user_by_email(email: str) -> 'User':
        """Get user by email address"""
        from .models import User
        
        db = SessionLocal()
        try:
            return db.query(User).filter(User.email == email).first()
        finally:
            db.close()
    
    @staticmethod
    def save_recipe_with_ingredients(recipe_data: dict, ingredients_data: list, user_id: int = None) -> 'Recipe':
        """Save a complete recipe with ingredients"""
        from .models import Recipe, RecipeIngredient, Conversation
        
        db = SessionLocal()
        try:
            # Create recipe
            recipe = Recipe(**recipe_data)
            db.add(recipe)
            db.flush()  # Get the recipe ID
            
            # Create ingredients
            for ingredient_data in ingredients_data:
                ingredient = RecipeIngredient(
                    recipe_id=recipe.id,
                    **ingredient_data
                )
                db.add(ingredient)
            
            db.commit()
            db.refresh(recipe)
            return recipe
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

# Export key components
__all__ = [
    "engine",
    "SessionLocal", 
    "get_db",
    "get_db_session",
    "create_tables",
    "drop_tables",
    "check_database_connection",
    "init_database",
    "DatabaseManager"
]