import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
import time

import ollama
from ollama import Client

from ..models import User, Recipe, RecipeIngredient
from ..schemas import RecipeGenerationRequest, RecipeGenerationResponse, RecipeAPI, IngredientAPI

# Configure logging
logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with Ollama LLM for recipe generation"""
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.default_model = os.getenv("DEFAULT_MODEL", "llama3.1")
        self.client = Client(host=self.base_url)
        
    async def check_ollama_connection(self) -> bool:
        """Check if Ollama service is available"""
        try:
            # Try to list models to check connectivity
            models = self.client.list()
            return True
        except Exception as e:
            logger.error(f"Ollama connection failed: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama"""
        try:
            models = self.client.list()
            return [model['name'] for model in models.get('models', [])]
        except Exception as e:
            logger.error(f"Failed to get available models: {e}")
            return []
    
    def create_recipe_prompt(self, user_prompt: str, user_preferences: Optional[str] = None, user_categories: Optional[List[str]] = None) -> str:
        """Create a structured prompt for recipe generation"""
        
        # Use user's custom categories or fall back to defaults
        if user_categories and len(user_categories) > 0:
            categories_list = ", ".join(user_categories)
        else:
            categories_list = "produce, butchery, dry-goods, chilled, frozen, pantry, bakery, deli, beverages, spices"
        
        system_prompt = f"""You are RecipeWizard, an expert chef and recipe creator. Generate creative, practical recipes based on user requests.

CRITICAL INSTRUCTIONS:
1. Always respond with ONLY valid JSON in the exact format specified below
2. Do not include any text before or after the JSON
3. All ingredient amounts must be practical and realistic
4. Instructions should be clear and detailed
5. Include helpful cooking tips

INGREDIENT CATEGORIZATION - EXTREMELY IMPORTANT:
- Every ingredient MUST be assigned to one of these categories: {categories_list}
- You MUST use the exact category names provided above
- Do NOT create new categories or use variations
- Do NOT use categories like "dairy", "meat", "vegetables" - use only the provided list
- If unsure, choose the closest matching category from the provided list

REQUIRED JSON FORMAT:
{{
  "recipe": {{
    "title": "Recipe Name",
    "description": "Brief description",
    "instructions": ["Step 1", "Step 2", "..."],
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "difficulty": "easy",
    "tips": ["Tip 1", "Tip 2"]
  }},
  "ingredients": [
    {{
      "name": "ingredient name",
      "amount": "1",
      "unit": "cup",
      "category": "MUST_BE_FROM_PROVIDED_LIST"
    }}
  ]
}}

VALID INGREDIENT CATEGORIES (use EXACTLY these): {categories_list}

DIFFICULTY LEVELS: easy, medium, hard"""

        # Build the full prompt
        full_prompt = f"{system_prompt}\n\nUser Request: {user_prompt}"
        
        # Add user preferences if available
        if user_preferences:
            full_prompt += f"\n\nUser Preferences:{user_preferences}"
        
        full_prompt += "\n\nGenerate a recipe that matches the request with ONLY valid JSON response:"
        
        return full_prompt
    
    async def generate_recipe(
        self, 
        request: RecipeGenerationRequest, 
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Generate a recipe using the LLM.
        Returns the raw response data for further processing.
        """
        start_time = time.time()
        
        try:
            # Get user preferences context if user is provided
            user_preferences = None
            user_categories = None
            if user:
                user_preferences = user.get_preference_context()
                user_categories = user.grocery_categories
            
            # Create the prompt with user's categories
            prompt = self.create_recipe_prompt(
                request.prompt, 
                user_preferences,
                user_categories
            )
            
            logger.info(f"Generating recipe for prompt: {request.prompt[:100]}...")
            
            # Call Ollama
            response = self.client.generate(
                model=self.default_model,
                prompt=prompt,
                options={
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'num_predict': 2000,  # Max tokens
                }
            )
            
            generation_time = int((time.time() - start_time) * 1000)  # milliseconds
            
            # Extract the generated text
            generated_text = response['response'].strip()
            
            logger.info(f"LLM generated {len(generated_text)} characters in {generation_time}ms")
            
            # Parse JSON response with category validation
            try:
                recipe_data = self._parse_recipe_response(generated_text, user_categories)
            except ValueError as e:
                # Check if this is a category validation error
                if user_categories and "Invalid ingredient categories found" in str(e):
                    logger.warning(f"Category validation failed, attempting correction: {e}")
                    
                    # Extract invalid categories from error message
                    invalid_categories = self._extract_invalid_categories_from_error(str(e))
                    
                    # Try to correct using LLM
                    recipe_data = await self._retry_generation_with_category_correction(
                        request.prompt,
                        user_preferences, 
                        user_categories,
                        invalid_categories,
                        generated_text
                    )
                else:
                    # Re-raise other validation errors
                    raise
            
            return {
                'recipe_data': recipe_data,
                'generation_time_ms': generation_time,
                'model': self.default_model,
                'raw_response': generated_text,
                'token_count': response.get('eval_count', 0),
                'prompt_tokens': response.get('prompt_eval_count', 0)
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            raise ValueError(f"LLM returned invalid JSON: {str(e)}")
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise RuntimeError(f"Recipe generation failed: {str(e)}")
    
    def _parse_recipe_response(self, response_text: str, valid_categories: Optional[List[str]] = None) -> Dict[str, Any]:
        """Parse and validate the LLM's JSON response"""
        try:
            # Try to find JSON in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON found in response")
            
            json_text = response_text[json_start:json_end]
            data = json.loads(json_text)
            
            # Validate required fields
            if 'recipe' not in data or 'ingredients' not in data:
                raise ValueError("Missing required 'recipe' or 'ingredients' fields")
            
            recipe = data['recipe']
            ingredients = data['ingredients']
            
            # Validate recipe fields
            required_recipe_fields = ['title', 'instructions']
            for field in required_recipe_fields:
                if field not in recipe:
                    raise ValueError(f"Missing required recipe field: {field}")
            
            # Validate ingredients
            if not isinstance(ingredients, list) or len(ingredients) == 0:
                raise ValueError("Ingredients must be a non-empty list")
            
            for ing in ingredients:
                if not isinstance(ing, dict) or 'name' not in ing or 'amount' not in ing:
                    raise ValueError("Invalid ingredient format")
            
            # Add default values for missing optional fields
            recipe.setdefault('description', '')
            recipe.setdefault('prepTime', None)
            recipe.setdefault('cookTime', None)
            recipe.setdefault('servings', 4)
            recipe.setdefault('difficulty', 'medium')
            recipe.setdefault('tips', [])
            
            # Ensure instructions is a list
            if isinstance(recipe['instructions'], str):
                recipe['instructions'] = [recipe['instructions']]
            
            # Add default values for ingredients
            for ing in ingredients:
                ing.setdefault('unit', '')
                ing.setdefault('category', 'pantry')
            
            # Validate ingredient categories if user categories provided
            if valid_categories:
                invalid_categories = self._validate_ingredient_categories(ingredients, valid_categories)
                if invalid_categories:
                    raise ValueError(f"Invalid ingredient categories found: {invalid_categories}. Must use only: {', '.join(valid_categories)}")
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Response text: {response_text[:500]}...")
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            logger.error(f"Response validation error: {e}")
            raise ValueError(f"Invalid response format: {str(e)}")
    
    def _validate_ingredient_categories(self, ingredients: List[Dict], valid_categories: List[str]) -> List[str]:
        """
        Validate that all ingredient categories are from the allowed list
        
        Args:
            ingredients: List of ingredient dictionaries
            valid_categories: List of allowed category names
            
        Returns:
            List of invalid category names found
        """
        invalid_categories = []
        valid_categories_lower = [cat.lower() for cat in valid_categories]
        
        for ing in ingredients:
            category = ing.get('category', '').strip()
            if category and category.lower() not in valid_categories_lower:
                if category not in invalid_categories:
                    invalid_categories.append(category)
        
        return invalid_categories
    
    def _create_category_correction_prompt(self, original_prompt: str, invalid_categories: List[str], valid_categories: List[str], previous_response: str) -> str:
        """Create a correction prompt for fixing invalid categories"""
        
        correction_prompt = f"""CATEGORY CORRECTION REQUIRED

Your previous response contained invalid ingredient categories: {', '.join(invalid_categories)}

VALID CATEGORIES (use EXACTLY these): {', '.join(valid_categories)}

Please fix your previous JSON response by changing ONLY the invalid categories to valid ones from the list above.

Original request: {original_prompt}

Previous response with errors:
{previous_response}

Provide the corrected JSON with all ingredient categories fixed to use ONLY the valid categories listed above:"""
        
        return correction_prompt
    
    async def _retry_generation_with_category_correction(
        self, 
        original_prompt: str, 
        user_preferences: Optional[str],
        user_categories: List[str],
        invalid_categories: List[str],
        previous_response: str,
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """Retry generation with category correction"""
        
        for retry_attempt in range(max_retries):
            try:
                logger.info(f"Attempting category correction (attempt {retry_attempt + 1}/{max_retries})")
                
                # Create correction prompt
                correction_prompt = self._create_category_correction_prompt(
                    original_prompt, invalid_categories, user_categories, previous_response
                )
                
                # Try LLM correction
                response = self.client.generate(
                    model=self.default_model,
                    prompt=correction_prompt,
                    options={
                        'temperature': 0.3,  # Lower temperature for correction
                        'top_p': 0.8,
                        'num_predict': 2000,
                    }
                )
                
                corrected_text = response['response'].strip()
                
                # Validate the correction
                recipe_data = self._parse_recipe_response(corrected_text, user_categories)
                
                logger.info(f"Category correction successful on attempt {retry_attempt + 1}")
                return recipe_data
                
            except ValueError as e:
                logger.warning(f"Category correction attempt {retry_attempt + 1} failed: {e}")
                if retry_attempt < max_retries - 1:
                    continue
                else:
                    # Final fallback: manually fix categories
                    logger.warning("All correction attempts failed, applying manual category fixes")
                    return self._apply_manual_category_fixes(previous_response, user_categories)
            except Exception as e:
                logger.error(f"Unexpected error during category correction: {e}")
                if retry_attempt == max_retries - 1:
                    raise
        
        # Should not reach here
        raise RuntimeError("Category correction failed after all retries")
    
    def _apply_manual_category_fixes(self, response_text: str, valid_categories: List[str]) -> Dict[str, Any]:
        """Manually fix categories as last resort fallback"""
        try:
            # Parse the response ignoring category validation
            data = self._parse_recipe_response(response_text, valid_categories=None)
            
            # Map invalid categories to closest valid ones
            category_mapping = self._create_category_mapping(valid_categories)
            
            # Fix all ingredient categories
            for ing in data['ingredients']:
                current_category = ing.get('category', '').strip()
                if current_category:
                    # Try to find a close match
                    best_match = self._find_closest_category_match(current_category, valid_categories)
                    ing['category'] = best_match
                else:
                    ing['category'] = valid_categories[0] if valid_categories else 'pantry'
            
            logger.info("Applied manual category fixes as fallback")
            return data
            
        except Exception as e:
            logger.error(f"Manual category fix failed: {e}")
            raise ValueError(f"Could not fix ingredient categories: {str(e)}")
    
    def _create_category_mapping(self, valid_categories: List[str]) -> Dict[str, str]:
        """Create mapping from common invalid categories to valid ones"""
        mapping = {}
        valid_lower = [cat.lower() for cat in valid_categories]
        
        # Common mappings
        common_invalid = {
            'dairy': 'chilled',
            'meat': 'butchery', 
            'vegetables': 'produce',
            'fruits': 'produce',
            'grains': 'dry-goods',
            'seafood': 'butchery',
            'herbs': 'spices',
            'condiments': 'pantry'
        }
        
        for invalid, preferred in common_invalid.items():
            if preferred in valid_lower:
                idx = valid_lower.index(preferred)
                mapping[invalid] = valid_categories[idx]
        
        return mapping
    
    def _find_closest_category_match(self, invalid_category: str, valid_categories: List[str]) -> str:
        """Find the closest matching valid category"""
        invalid_lower = invalid_category.lower()
        
        # Direct mapping first
        mapping = self._create_category_mapping(valid_categories)
        if invalid_lower in mapping:
            return mapping[invalid_lower]
        
        # Fuzzy matching
        from difflib import SequenceMatcher
        best_ratio = 0.0
        best_match = valid_categories[0]  # Default fallback
        
        for valid_cat in valid_categories:
            ratio = SequenceMatcher(None, invalid_lower, valid_cat.lower()).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = valid_cat
        
        return best_match
    
    def _extract_invalid_categories_from_error(self, error_message: str) -> List[str]:
        """Extract invalid category names from error message"""
        # Parse error message: "Invalid ingredient categories found: ['dairy', 'meat']. Must use only: ..."
        try:
            start = error_message.find('[') + 1
            end = error_message.find(']')
            if start > 0 and end > start:
                categories_str = error_message[start:end]
                # Remove quotes and split
                invalid_cats = [cat.strip().strip("'\"") for cat in categories_str.split(',')]
                return [cat for cat in invalid_cats if cat]
        except Exception:
            pass
        
        return []
    
    def convert_to_api_response(
        self, 
        recipe_data: Dict[str, Any], 
        original_prompt: str,
        generation_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert LLM response to API format expected by mobile app"""
        try:
            recipe = recipe_data['recipe']
            ingredients = recipe_data['ingredients']
            
            # Convert to API format
            recipe_api = RecipeAPI(
                title=recipe['title'],
                description=recipe.get('description'),
                instructions=recipe['instructions'],
                prepTime=recipe.get('prepTime'),
                cookTime=recipe.get('cookTime'),
                servings=recipe.get('servings', 4),
                difficulty=recipe.get('difficulty'),
                tips=recipe.get('tips', [])
            )
            
            ingredients_api = [
                IngredientAPI(
                    id=str(i),  # Temporary ID for frontend
                    name=ing['name'],
                    amount=str(ing['amount']),
                    unit=ing.get('unit'),
                    category=ing.get('category', 'pantry')
                )
                for i, ing in enumerate(ingredients)
            ]
            
            return {
                "id": f"temp_{int(time.time())}",  # Temporary ID before saving
                "recipe": recipe_api.model_dump(),
                "ingredients": [ing.model_dump() for ing in ingredients_api],
                "generatedAt": datetime.utcnow().isoformat(),
                "userPrompt": original_prompt
            }
            
        except Exception as e:
            logger.error(f"Failed to convert to API response: {e}")
            raise ValueError(f"Response conversion failed: {str(e)}")
    
    async def generate_recipe_with_fallback(
        self, 
        request: RecipeGenerationRequest, 
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Generate recipe using LLM - no fallback, proper error handling
        """
        # Check if Ollama is available
        if not await self.check_ollama_connection():
            logger.error("Ollama service is not available")
            raise ConnectionError("Unable to connect to recipe generation service. Please try again later.")
        
        # Try LLM generation
        return await self.generate_recipe(request, user)
    

# Global LLM service instance
llm_service = LLMService()

# Utility functions for easy access
async def generate_recipe_from_prompt(
    prompt: str, 
    user: Optional[User] = None
) -> Dict[str, Any]:
    """Convenience function to generate recipe from prompt"""
    request = RecipeGenerationRequest(prompt=prompt)
    return await llm_service.generate_recipe_with_fallback(request, user)

async def check_llm_service_status() -> Dict[str, Any]:
    """Check LLM service status for health checks"""
    try:
        is_connected = await llm_service.check_ollama_connection()
        available_models = llm_service.get_available_models() if is_connected else []
        
        return {
            "status": "connected" if is_connected else "disconnected",
            "base_url": llm_service.base_url,
            "default_model": llm_service.default_model,
            "available_models": available_models,
            "service": "ollama"
        }
    except Exception as e:
        logger.error(f"LLM service status check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "service": "ollama"
        }