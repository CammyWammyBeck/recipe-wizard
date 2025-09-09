#!/usr/bin/env python3
"""
Generate a secure secret key for JWT authentication
Run: python scripts/generate_secret.py
"""
import secrets

def generate_secret_key():
    """Generate a cryptographically secure secret key"""
    # Generate 32 bytes (256 bits) of random data
    key = secrets.token_hex(32)
    return key

if __name__ == "__main__":
    secret = generate_secret_key()
    print("=== SECURE SECRET KEY FOR JWT ===")
    print(f"SECRET_KEY={secret}")
    print("\n⚠️  IMPORTANT:")
    print("1. Copy this secret key to your .env.production file")
    print("2. Set it as SECRET_KEY environment variable in Heroku")
    print("3. Never commit this key to version control")
    print("4. Keep this key secure and rotate it periodically")