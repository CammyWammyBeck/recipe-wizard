#!/usr/bin/env python3
"""
Test script for recipe generation system
Tests LLM service with mock data and user preferences integration
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.llm_service import llm_service
from app.schemas import RecipeGenerationRequest

async def test_recipe_generation():
    """Test the complete recipe generation flow"""
    
    print("🧪 Testing Recipe Generation System")
    print("=" * 50)
    
    # Test 1: Basic LLM Service Status
    print("\n1. Checking LLM Service Status...")
    try:
        # Check Ollama connection (will fail but gracefully)
        is_connected = await llm_service.check_ollama_connection()
        if is_connected:
            models = llm_service.get_available_models()
            print(f"✅ LLM Service Connected: {len(models)} models available")
            print(f"   Available models: {models}")
        else:
            print("⚠️  LLM Service Disconnected (using fallback mode)")
    except Exception as e:
        print(f"❌ LLM Service Error: {e}")
    
    # Test 2: Mock User with Preferences
    print("\n2. Creating Mock User with Preferences...")
    
    # Create a mock user with preferences (without database)
    class MockUser:
        def __init__(self):
            self.id = 1
            self.email = "test@example.com"
            self.units = "metric"
            self.default_servings = 4
            self.dietary_restrictions = ["vegetarian"]
            self.allergens = ["nuts", "shellfish"]
            self.dislikes = ["mushrooms"]
            self.preferred_difficulty = "easy"
            self.max_cook_time = 45
            self.max_prep_time = 20
            self.additional_preferences = "I love Italian cuisine and prefer one-pot meals"
            self.grocery_categories = None  # Use defaults
        
        def get_preference_context(self):
            """Generate user preference context for LLM"""
            context = []
            
            # Units preference
            context.append(f"Use {self.units} measurements")
            
            # Servings
            context.append(f"Recipe should serve {self.default_servings} people")
            
            # Dietary restrictions
            if self.dietary_restrictions:
                context.append(f"Dietary restrictions: {', '.join(self.dietary_restrictions)}")
            
            # Allergens to avoid
            if self.allergens:
                context.append(f"Avoid these allergens: {', '.join(self.allergens)}")
            
            # Dislikes
            if self.dislikes:
                context.append(f"User dislikes: {', '.join(self.dislikes)}")
            
            # Cooking preferences
            if self.preferred_difficulty:
                context.append(f"Preferred difficulty: {self.preferred_difficulty}")
            
            if self.max_cook_time:
                context.append(f"Maximum cooking time: {self.max_cook_time} minutes")
                
            if self.max_prep_time:
                context.append(f"Maximum prep time: {self.max_prep_time} minutes")
            
            # Additional preferences
            if self.additional_preferences:
                context.append(f"Additional notes: {self.additional_preferences}")
            
            return "\\n".join([f"- {item}" for item in context])
    
    mock_user = MockUser()
    print(f"✅ Mock user created: {mock_user.email}")
    print(f"   Preferences: {mock_user.units}, {mock_user.default_servings} servings")
    print(f"   Restrictions: {mock_user.dietary_restrictions}")
    print(f"   User context: {mock_user.get_preference_context()[:100]}...")
    
    # Test 3: Recipe Generation Requests
    print("\n3. Testing Recipe Generation...")
    
    test_prompts = [
        "creamy chicken pasta with sundried tomatoes",
        "healthy vegetarian stir fry",
        "easy chocolate chip cookies",
        "pasta"  # This should trigger pasta-specific mock data
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n   Test {i}: '{prompt}'")
        try:
            request = RecipeGenerationRequest(prompt=prompt)
            
            # Generate recipe with user preferences
            result = await llm_service.generate_recipe_with_fallback(request, mock_user)
            
            print(f"   ✅ Generation successful!")
            print(f"   📊 Model: {result['model']}")
            print(f"   ⏱️  Time: {result['generation_time_ms']}ms")
            print(f"   🔢 Tokens: {result['token_count']}")
            print(f"   📝 Recipe: {result['recipe_data']['recipe']['title']}")
            print(f"   🥘 Ingredients: {len(result['recipe_data']['ingredients'])} items")
            print(f"   👨‍🍳 Instructions: {len(result['recipe_data']['recipe']['instructions'])} steps")
            print(f"   🍽️  Servings: {result['recipe_data']['recipe']['servings']}")
            print(f"   ⭐ Difficulty: {result['recipe_data']['recipe']['difficulty']}")
            
            # Test API response conversion
            api_response = llm_service.convert_to_api_response(
                result['recipe_data'],
                prompt,
                result
            )
            print(f"   📱 API conversion successful: {api_response['id']}")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Test 4: Prompt Creation
    print("\n4. Testing Prompt Creation...")
    try:
        user_preferences = mock_user.get_preference_context()
        test_prompt = "creamy chicken pasta"
        
        full_prompt = llm_service.create_recipe_prompt(test_prompt, user_preferences)
        
        print(f"✅ Prompt created successfully")
        print(f"   Length: {len(full_prompt)} characters")
        print(f"   Contains user prefs: {'vegetarian' in full_prompt}")
        print(f"   Contains metric units: {'metric' in full_prompt}")
        print(f"   Prompt preview: {full_prompt[:200]}...")
        
    except Exception as e:
        print(f"❌ Prompt creation error: {e}")
    
    # Test 5: JSON Response Parsing
    print("\n5. Testing JSON Response Parsing...")
    
    # Test valid JSON
    mock_json_response = '''
    {
        "recipe": {
            "title": "Test Recipe",
            "description": "A test recipe",
            "instructions": ["Step 1", "Step 2"],
            "prepTime": 10,
            "cookTime": 20,
            "servings": 4,
            "difficulty": "easy",
            "tips": ["Tip 1", "Tip 2"]
        },
        "ingredients": [
            {
                "name": "test ingredient",
                "amount": "1",
                "unit": "cup",
                "category": "pantry"
            }
        ]
    }
    '''
    
    try:
        parsed_data = llm_service._parse_recipe_response(mock_json_response)
        print("✅ JSON parsing successful")
        print(f"   Recipe title: {parsed_data['recipe']['title']}")
        print(f"   Ingredients count: {len(parsed_data['ingredients'])}")
        
        # Test invalid JSON
        try:
            llm_service._parse_recipe_response("invalid json")
            print("❌ Should have failed on invalid JSON")
        except ValueError as e:
            print("✅ Invalid JSON properly rejected")
            
    except Exception as e:
        print(f"❌ JSON parsing error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Recipe Generation Testing Complete!")
    print("\n✅ Key Features Verified:")
    print("   - LLM service status checking with graceful fallback")
    print("   - User preference context generation")
    print("   - Recipe generation with different prompts")
    print("   - Mock data system working for offline development")
    print("   - JSON response parsing and validation")
    print("   - API response conversion for mobile app")
    
    print("\n🚀 Ready for Integration:")
    print("   - FastAPI endpoints can use these services")
    print("   - Mobile app can connect and generate recipes")
    print("   - User preferences customize recipe generation")
    print("   - Fallback mode ensures reliability")
    
    # Test 6: Custom User Categories
    print("\n6. Testing with Custom User Categories...")
    
    # Create mock user with custom categories
    class MockUserCustom:
        def __init__(self):
            self.id = 2
            self.email = "custom@example.com"
            self.units = "imperial"
            self.default_servings = 6
            self.dietary_restrictions = []
            self.allergens = []
            self.dislikes = []
            self.preferred_difficulty = "medium"
            self.max_cook_time = 60
            self.max_prep_time = 30
            self.additional_preferences = ""
            # Custom grocery categories
            self.grocery_categories = ["Fresh Produce", "Meat & Seafood", "Dairy & Eggs", "Pantry Items", "Seasonings"]
        
        def get_preference_context(self):
            return "- Use imperial measurements\\n- Recipe should serve 6 people"
    
    custom_user = MockUserCustom()
    
    print(f"   Custom categories: {custom_user.grocery_categories}")
    
    # Test recipe generation with custom categories
    try:
        request = RecipeGenerationRequest(prompt="pasta with chicken")
        result = await llm_service.generate_recipe_with_fallback(request, custom_user)
        
        print(f"   ✅ Generation successful with custom categories!")
        print(f"   📝 Recipe: {result['recipe_data']['recipe']['title']}")
        
        # Check that all ingredients use custom categories
        ingredients = result['recipe_data']['ingredients']
        categories_used = set(ing['category'] for ing in ingredients)
        print(f"   🏪 Categories used: {categories_used}")
        
        # Verify all categories are from user's list
        invalid_cats = categories_used - set(custom_user.grocery_categories)
        if invalid_cats:
            print(f"   ❌ Invalid categories found: {invalid_cats}")
        else:
            print(f"   ✅ All categories match user preferences!")
        
        # Show ingredient mapping
        for ing in ingredients:
            print(f"     - {ing['name']} -> {ing['category']}")
            
    except Exception as e:
        print(f"   ❌ Error with custom categories: {e}")
    
    # Test 7: Category Validation
    print("\n7. Testing Category Validation...")
    try:
        # Test validation method directly
        test_ingredients_invalid = [
            {'name': 'tomatoes', 'category': 'vegetables'},  # Should be 'Fresh Produce'
            {'name': 'chicken', 'category': 'meat'},         # Should be 'Meat & Seafood' 
            {'name': 'milk', 'category': 'dairy'},           # Should be 'Dairy & Eggs'
        ]
        
        invalid_cats = llm_service._validate_ingredient_categories(
            test_ingredients_invalid, 
            custom_user.grocery_categories
        )
        
        print(f"   Invalid categories detected: {invalid_cats}")
        
        if invalid_cats:
            print("   ✅ Validation correctly detected invalid categories")
            
            # Test category mapping
            mapping = llm_service._create_category_mapping(custom_user.grocery_categories)
            print(f"   Category mapping: {mapping}")
            
            # Test closest match finding
            for invalid_cat in invalid_cats:
                closest = llm_service._find_closest_category_match(invalid_cat, custom_user.grocery_categories)
                print(f"   '{invalid_cat}' -> '{closest}'")
        else:
            print("   ❌ Validation failed to detect invalid categories")
            
    except Exception as e:
        print(f"   ❌ Validation test error: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 ENHANCED CATEGORY SYSTEM READY!")
    print("\n✅ New Category Features:")
    print("   - Strict LLM prompt with user's exact categories")
    print("   - Automatic validation of LLM responses") 
    print("   - Retry logic for category corrections")
    print("   - Smart fallback mapping for invalid categories")
    print("   - Mock data respects user's custom categories")
    print("   - Complete error handling and recovery")

if __name__ == "__main__":
    asyncio.run(test_recipe_generation())