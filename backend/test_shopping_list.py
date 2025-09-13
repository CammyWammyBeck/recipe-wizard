#!/usr/bin/env python3
"""
Test script for shopping list functionality
"""

import sys
import os
import requests
import json
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
SHOPPING_LIST_URL = f"{BASE_URL}/api/shopping-list"

def test_get_empty_shopping_list():
    """Test getting an empty shopping list"""
    print("Testing empty shopping list...")

    try:
        response = requests.get(f"{SHOPPING_LIST_URL}/")
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Items: {len(data.get('items', []))}")
            print("✅ Empty shopping list test passed")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the server running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_add_recipe_to_shopping_list():
    """Test adding a recipe to shopping list"""
    print("\nTesting add recipe to shopping list...")

    try:
        # Try to add recipe with ID 1
        payload = {
            "recipe_id": "1"
        }

        response = requests.post(
            f"{SHOPPING_LIST_URL}/add-recipe",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Items after adding recipe: {len(data.get('items', []))}")
            print("✅ Add recipe test passed")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_clear_shopping_list():
    """Test clearing shopping list"""
    print("\nTesting clear shopping list...")

    try:
        response = requests.delete(f"{SHOPPING_LIST_URL}/clear")
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success')}")
            print("✅ Clear shopping list test passed")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("=== Shopping List API Tests ===")

    tests = [
        test_get_empty_shopping_list,
        test_add_recipe_to_shopping_list,
        test_clear_shopping_list
    ]

    results = []
    for test in tests:
        results.append(test())

    print(f"\n=== Results: {sum(results)}/{len(results)} tests passed ===")

    if all(results):
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())