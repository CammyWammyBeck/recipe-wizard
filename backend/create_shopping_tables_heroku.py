#!/usr/bin/env python3
"""
Script to create shopping list tables on Heroku (PostgreSQL)
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.database import init_database
from app.models import *
from app.models.shopping_list import *

def main():
    print("Creating shopping list tables on Heroku...")
    try:
        # Initialize database - this will create all tables
        init_database()
        print("✅ Shopping list tables created successfully!")
        return 0
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())