#!/usr/bin/env python3
"""
Production-safe migration runner for Heroku release phase
"""
import os
import sys
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.utils.migration_utils import heroku_release_migrations

# Configure logging for release phase
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == "__main__":
    heroku_release_migrations()