#!/usr/bin/env python3
"""
Simple script to create database tables using SQLAlchemy
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add app to path
sys.path.append(os.path.dirname(__file__))

from app.database import Base
from app import models  # This imports all model classes

def create_tables():
    """Create all database tables"""
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        # Fix Heroku URL format
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        print(f"Connecting to database...")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        
        # Create all tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # List created tables
        print("✅ Tables created successfully:")
        for table in Base.metadata.sorted_tables:
            print(f"  - {table.name}")
        
        print("🎉 Database setup complete!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)