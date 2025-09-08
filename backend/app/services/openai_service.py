import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import time

from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletion

from ..models import User
from ..schemas import RecipeGenerationRequest

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for interacting with OpenAI API for recipe generation"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.default_model = os.getenv("DEFAULT_MODEL", "gpt-4o-mini")
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
            
        self.client = OpenAI(api_key=self.api_key)
        
    async def check_openai_connection(self) -> bool:
        """Check if OpenAI API is available"""
        try:
            # Simple test call to list models
            self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI connection failed: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from OpenAI"""
        try:
            models = self.client.models.list()
            return [model.id for model in models.data if model.id.startswith('gpt')]
        except Exception as e:
            logger.error(f"Failed to get available models: {e}")
            return []
    
    def create_recipe_system_prompt(self, user_categories: Optional[List[str]] = None) -> str:
        """Create the system prompt for recipe generation"""
        
        if user_categories and len(user_categories) > 0:
            categories_list = ", ".join(user_categories)
        else:
            raise ValueError("No grocery categories provided. User preferences must include grocery categories for recipe generation.")
        
        return f"""You are RecipeWizard, an expert chef and recipe creator. Generate creative, practical recipes based on user requests.

CRITICAL INSTRUCTIONS:
1. Always respond with ONLY valid JSON in the exact format specified below
2. Do not include any text before or after the JSON
3. All ingredient amounts must be practical and realistic
4. Instructions should be clear and detailed
5. Include helpful cooking tips
6. IMPORTANT: Follow all user preferences provided, but if there are conflicts between different preferences, always prioritize "Additional preferences" over all other settings
7. INGREDIENT CATEGORIES: Every ingredient MUST use one of these exact categories: {categories_list}
8. INGREDIENT-USAGE CONSISTENCY: Every food item referenced anywhere in the recipe (title, description, instructions, tips, or serving suggestions like "serve with X") MUST also appear in the "ingredients" array. Do not mention items that are not represented in "ingredients".
9. OPTIONAL/SERVE-WITH ITEMS: If suggesting a side or garnish (e.g., crusty bread, rice, salad), include it in "ingredients" with an appropriate category from the list above and use an amount like "to serve", "to garnish" or "as needed" and set unit to "N/A".

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
      "category": "MUST_BE_FROM_THIS_LIST: {categories_list}"
    }}
  ]

INGREDIENT MEASUREMENT RULES:
- For measurable quantities, use specific amounts and units (e.g., "2", "cups")
- For taste-based ingredients (salt, pepper, spices), use descriptive amounts like "to taste", "pinch", "dash" and set unit to "N/A"
- For garnishes or optional additions, use amounts like "to garnish", "as needed" and set unit to "N/A"
- NEVER use "N/A" as the amount - always provide a descriptive amount
}}

DIFFICULTY LEVELS: easy, medium, hard"""

    def create_recipe_messages(
        self, 
        user_prompt: str, 
        user_preferences: Optional[str] = None, 
        user_categories: Optional[List[str]] = None
    ) -> List[Dict[str, str]]:
        """Create OpenAI messages for recipe generation"""
        
        system_prompt = self.create_recipe_system_prompt(user_categories)
        
        # Build user message
        user_message = f"Generate a recipe for: {user_prompt}"
        
        if user_preferences:
            user_message += user_preferences
        
        user_message += "\n\nGenerate a recipe that matches the request with ONLY valid JSON response:"
        
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    
    def _get_retry_message(self, attempt: int, error_type: str) -> str:
        """Get thematic retry message for user feedback"""
        messages = {
            'format': [
                'Adjusting the recipe format...',
                'Fine-tuning the ingredients...',
                'Perfecting the recipe structure...'
            ],
            'categories': [
                'Organizing the grocery list...',
                'Sorting ingredients by aisle...',
                'Categorizing items for shopping...'
            ],
            'validation': [
                'Adding final touches...',
                'Checking recipe details...',
                'Ensuring everything is perfect...'
            ]
        }
        
        message_list = messages.get(error_type, messages['validation'])
        return message_list[min(attempt - 1, len(message_list) - 1)]
    
    def _simple_json_fix(self, response_text: str) -> str:
        """Simple JSON cleanup - remove common issues"""
        # Remove markdown code blocks
        if response_text.strip().startswith('```'):
            lines = response_text.strip().split('\n')
            # Remove first and last line if they contain ```
            if lines[0].startswith('```'):
                lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            response_text = '\n'.join(lines)
        
        # Find JSON object bounds
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            return response_text[json_start:json_end]
        
        return response_text
    
    def _validate_recipe_data(self, data: Dict) -> tuple[bool, str]:
        """Basic validation - return (is_valid, error_type)"""
        try:
            # Check required top-level keys
            if 'recipe' not in data or 'ingredients' not in data:
                return False, 'format'
            
            recipe = data['recipe']
            ingredients = data['ingredients']
            
            # Check recipe has required fields
            if not isinstance(recipe, dict) or 'title' not in recipe or 'instructions' not in recipe:
                return False, 'format'
            
            # Check ingredients format
            if not isinstance(ingredients, list) or len(ingredients) == 0:
                return False, 'format'
            
            for ing in ingredients:
                if not isinstance(ing, dict) or 'name' not in ing or 'amount' not in ing or 'category' not in ing:
                    return False, 'format'
            
            # Basic cross-check: avoid references to items not in ingredients for common phrases
            if not self._ingredients_cover_common_references(recipe, ingredients):
                return False, 'validation'

            return True, ''
            
        except Exception:
            return False, 'format'

    def _ingredients_cover_common_references(self, recipe: Dict[str, Any], ingredients: List[Dict[str, Any]]) -> bool:
        """Best-effort check to ensure common instruction references are represented in ingredients.

        Looks for phrases like "serve with X", "garnish with X", "top with X" and checks that X is present
        in the ingredient names. This is a heuristic to reduce inconsistencies like suggesting bread without
        listing it in the grocery list.
        """
        try:
            import re

            # Aggregate text fields to scan
            texts: List[str] = []
            if isinstance(recipe.get('description'), str):
                texts.append(recipe['description'])
            if isinstance(recipe.get('tips'), list):
                texts.extend([t for t in recipe['tips'] if isinstance(t, str)])
            # instructions guaranteed to be list of str by this point
            texts.extend([t for t in recipe.get('instructions', []) if isinstance(t, str)])

            full_text = "\n".join(texts).lower()
            ing_names = [str(ing.get('name', '')).lower() for ing in ingredients]

            # Patterns to catch common serving/garnish references
            patterns = [
                r"serve(?:\s+with)?\s+([^\.;\n]+)",
                r"serve\s+over\s+([^\.;\n]+)",
                r"garnish(?:\s+with)?\s+([^\.;\n]+)",
                r"top\s+with\s+([^\.;\n]+)",
                r"alongside\s+([^\.;\n]+)",
            ]

            referenced_items: List[str] = []
            for pat in patterns:
                for m in re.finditer(pat, full_text):
                    phrase = m.group(1).strip()
                    # Split on common separators to get individual items
                    parts = re.split(r",| and | or |/|\\+", phrase)
                    referenced_items.extend([p.strip() for p in parts if p.strip()])

            # If nothing found, pass
            if not referenced_items:
                return True

            # If any referenced item has no fuzzy match in ingredient names, flag validation failure
            def has_match(ref: str) -> bool:
                tokens = [t for t in re.split(r"\s+", ref) if t]
                # Try simple containment against ingredient names
                for name in ing_names:
                    # require any non-trivial token to appear
                    if any(tok in name for tok in tokens if len(tok) > 2):
                        return True
                return False

            for ref in referenced_items:
                if not has_match(ref):
                    return False

            return True
        except Exception:
            # On any parsing error, don't block generation
            return True

    def _find_missing_references(self, recipe: Dict[str, Any], ingredients: List[Dict[str, Any]]) -> List[str]:
        """Return a list of referenced items (serve/garnish/top with) that are not covered by ingredients."""
        try:
            import re
            texts: List[str] = []
            if isinstance(recipe.get('description'), str):
                texts.append(recipe['description'])
            if isinstance(recipe.get('tips'), list):
                texts.extend([t for t in recipe['tips'] if isinstance(t, str)])
            texts.extend([t for t in recipe.get('instructions', []) if isinstance(t, str)])

            full_text = "\n".join(texts).lower()
            ing_names = [str(ing.get('name', '')).lower() for ing in ingredients]

            patterns = [
                r"serve(?:\s+with)?\s+([^\.;\n]+)",
                r"serve\s+over\s+([^\.;\n]+)",
                r"garnish(?:\s+with)?\s+([^\.;\n]+)",
                r"top\s+with\s+([^\.;\n]+)",
                r"alongside\s+([^\.;\n]+)",
            ]
            referenced_items: List[str] = []
            for pat in patterns:
                for m in re.finditer(pat, full_text):
                    phrase = m.group(1).strip()
                    parts = re.split(r",| and | or |/|\\+", phrase)
                    referenced_items.extend([p.strip() for p in parts if p.strip()])

            def has_match(ref: str) -> bool:
                tokens = [t for t in re.split(r"\s+", ref) if t]
                for name in ing_names:
                    if any(tok in name for tok in tokens if len(tok) > 2):
                        return True
                return False

            missing = []
            for ref in referenced_items:
                if not has_match(ref):
                    missing.append(ref)
            return missing
        except Exception:
            return []
    
    async def generate_recipe(
        self, 
        request: RecipeGenerationRequest, 
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Generate a recipe using OpenAI API with simple retry logic"""
        start_time = time.time()
        max_retries = 3
        
        try:
            # Get user preferences - prioritize request preferences over database
            user_preferences = None
            user_categories = None
            
            if request.preferences:
                logger.info("Using preferences from API request (mobile app)")
                user_categories = request.preferences.get('groceryCategories', [])
                user_preferences = self._generate_preference_context_from_request(request.preferences)
                logger.info(f"Request categories: {user_categories}")
                
            elif user:
                logger.info(f"Using database preferences for user {user.email}")
                user_preferences = user.get_preference_context()
                user_categories = user.grocery_categories
                logger.info(f"Database categories: {user_categories}")
                
            else:
                logger.info("No user or preferences provided")
            
            # Create the messages
            messages = self.create_recipe_messages(
                request.prompt, 
                user_preferences,
                user_categories
            )
            
            logger.info(f"Generating recipe for prompt: {request.prompt[:100]}...")
            
            for attempt in range(1, max_retries + 1):
                try:
                    # Call OpenAI API
                    response: ChatCompletion = self.client.chat.completions.create(
                        model=self.default_model,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=2000,
                        response_format={"type": "json_object"}
                    )
                    
                    generation_time = int((time.time() - start_time) * 1000)
                    
                    # Extract and clean the generated text
                    generated_text = response.choices[0].message.content.strip()
                    cleaned_text = self._simple_json_fix(generated_text)
                    
                    logger.info(f"OpenAI generated {len(generated_text)} characters in {generation_time}ms (attempt {attempt})")
                    
                    # Parse and validate JSON
                    recipe_data = json.loads(cleaned_text)
                    is_valid, error_type = self._validate_recipe_data(recipe_data)
                    
                    if is_valid:
                        # Add default values for optional fields
                        recipe = recipe_data['recipe']
                        recipe.setdefault('description', '')
                        recipe.setdefault('prepTime', None)
                        recipe.setdefault('cookTime', None)
                        recipe.setdefault('servings', 4)
                        recipe.setdefault('difficulty', 'medium')
                        recipe.setdefault('tips', [])
                        
                        # Ensure instructions is a list
                        if isinstance(recipe['instructions'], str):
                            recipe['instructions'] = [recipe['instructions']]
                        
                        # Add default unit for ingredients
                        for ing in recipe_data['ingredients']:
                            ing.setdefault('unit', '')
                        
                        return {
                            'recipe_data': recipe_data,
                            'generation_time_ms': generation_time,
                            'model': self.default_model,
                            'raw_response': generated_text,
                            'token_count': response.usage.completion_tokens if response.usage else 0,
                            'prompt_tokens': response.usage.prompt_tokens if response.usage else 0,
                            'retry_count': attempt - 1,
                            'retry_message': self._get_retry_message(attempt, error_type) if attempt > 1 else None
                        }
                    else:
                        # Invalid format or validation - let it retry with helpful guidance
                        if attempt < max_retries:
                            logger.warning(f"Attempt {attempt} failed validation ({error_type}), retrying...")
                            detailed_retry = f"Previous response had {error_type} issues. Please fix and provide only valid JSON."
                            if error_type == 'validation':
                                missing = self._find_missing_references(recipe_data.get('recipe', {}), recipe_data.get('ingredients', []))
                                if missing:
                                    missing_list = ", ".join(sorted(set(missing)))
                                    detailed_retry += (
                                        f" Ensure every item referenced in instructions/tips is present in the 'ingredients' array. "
                                        f"Missing items detected: {missing_list}. If these are sides or garnishes, include them as ingredients with amount 'to serve' and unit 'N/A' and choose an appropriate category from the provided list."
                                    )
                            messages.append({"role": "assistant", "content": cleaned_text})
                            messages.append({"role": "user", "content": detailed_retry})
                            continue
                        else:
                            raise ValueError(f"Recipe validation failed after {max_retries} attempts: {error_type}")
                
                except json.JSONDecodeError as e:
                    if attempt < max_retries:
                        logger.warning(f"JSON parsing failed on attempt {attempt}, retrying...")
                        retry_message = "Previous response was not valid JSON. Please provide only valid JSON format."
                        messages.append({"role": "user", "content": retry_message})
                        continue
                    else:
                        raise ValueError(f"JSON parsing failed after {max_retries} attempts: {str(e)}")
                
                except Exception as e:
                    if attempt < max_retries:
                        logger.warning(f"Generation failed on attempt {attempt}: {e}")
                        continue
                    else:
                        raise
            
            # Should never reach here
            raise ValueError("Recipe generation failed after all retries")
            
        except Exception as e:
            logger.error(f"Recipe generation failed: {e}")
            raise RuntimeError(f"Recipe generation failed: {str(e)}")
    
    def _generate_preference_context_from_request(self, preferences: Dict) -> str:
        """Generate comprehensive preference context for LLM - let LLM handle all processing"""
        context = []
        
        # Basic preferences
        if preferences.get('units'):
            unit_desc = 'kg, g, ml, l, °C' if preferences['units'] == 'metric' else 'lbs, oz, cups, tablespoons, °F'
            context.append(f"Units: {preferences['units']} measurements ({unit_desc})")
        
        if preferences.get('defaultServings'):
            context.append(f"Servings: {preferences['defaultServings']} people")
        
        if preferences.get('preferredDifficulty'):
            context.append(f"Difficulty: {preferences['preferredDifficulty']}")
        
        # Time constraints
        if preferences.get('maxCookTime'):
            context.append(f"Max cooking time: {preferences['maxCookTime']} minutes")
        if preferences.get('maxPrepTime'):
            context.append(f"Max prep time: {preferences['maxPrepTime']} minutes")
        
        # Dietary restrictions
        if preferences.get('dietaryRestrictions') and len(preferences['dietaryRestrictions']) > 0:
            context.append(f"Dietary requirements: {', '.join(preferences['dietaryRestrictions'])}")
        
        # Allergens (high priority)
        if preferences.get('allergens') and len(preferences['allergens']) > 0:
            context.append(f"AVOID ALLERGENS: {', '.join(preferences['allergens'])}")
        
        # Dislikes
        if preferences.get('dislikes') and len(preferences['dislikes']) > 0:
            context.append(f"Avoid ingredients: {', '.join(preferences['dislikes'])}")
        
        # Additional preferences (HIGHEST PRIORITY - placed at end)
        if preferences.get('additionalPreferences') and preferences['additionalPreferences'].strip():
            context.append(f"ADDITIONAL PREFERENCES (override other settings if needed): {preferences['additionalPreferences'].strip()}")
        
        return f"\n\nUser Preferences:\n" + "\n".join(f"• {item}" for item in context) if context else ""

# Global OpenAI service instance
openai_service = OpenAIService()
