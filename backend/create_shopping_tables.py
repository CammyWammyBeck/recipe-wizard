#!/usr/bin/env python3
"""
Script to create shopping list tables directly in the database
This bypasses Alembic migration issues for now
"""

import os
import sys
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Add the app directory to path so we can import models
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.models import Base
from app.models.shopping_list import ShoppingList, ShoppingListItem, ShoppingListRecipeBreakdown, ShoppingListRecipeAssociation

def main():
    # Load environment variables
    load_dotenv()

    # Get database URL
    database_url = os.getenv("DATABASE_URL", "sqlite:///./recipe_wizard.db")

    # Create engine
    engine = create_engine(database_url)

    # Create all tables
    print("Creating shopping list tables...")
    try:
        # Create only the shopping list tables
        ShoppingList.__table__.create(engine, checkfirst=True)
        ShoppingListItem.__table__.create(engine, checkfirst=True)
        ShoppingListRecipeBreakdown.__table__.create(engine, checkfirst=True)
        ShoppingListRecipeAssociation.__table__.create(engine, checkfirst=True)

        print("Shopping list tables created successfully!")

    except Exception as e:
        print(f"Error creating tables: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())