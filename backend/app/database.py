from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from typing import Generator
import logging

from .models import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recipe_wizard.db")

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
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Validate connections before use
        pool_recycle=300,    # Recycle connections after 5 minutes
        pool_size=5,         # Connection pool size
        max_overflow=10,     # Maximum overflow connections
        echo=os.getenv("DEBUG", "false").lower() == "true"
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

def check_database_connection() -> bool:
    """
    Check if database connection is working.
    Returns True if connection is successful, False otherwise.
    """
    try:
        db = SessionLocal()
        # Try a simple query
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

def init_database():
    """
    Initialize the database by creating tables.
    This should be called when the application starts.
    """
    try:
        logger.info("Initializing database...")
        
        # Create tables if they don't exist
        create_tables()
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

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