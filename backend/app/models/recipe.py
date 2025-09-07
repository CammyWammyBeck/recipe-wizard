from sqlalchemy import Column, String, Integer, Float, JSON, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class Recipe(BaseModel):
    """Recipe model for storing generated recipes"""
    
    __tablename__ = "recipes"
    
    # Basic recipe information
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Recipe metadata
    prep_time = Column(Integer, nullable=True)  # in minutes
    cook_time = Column(Integer, nullable=True)  # in minutes
    servings = Column(Integer, nullable=True)
    difficulty = Column(String(20), nullable=True)  # 'easy', 'medium', 'hard'
    
    # Recipe content
    instructions = Column(JSON, nullable=False)  # List of instruction steps
    tips = Column(JSON, nullable=True)  # List of cooking tips
    
    # Additional metadata
    cuisine_type = Column(String(100), nullable=True)  # e.g., 'Italian', 'Asian', 'Mexican'
    meal_type = Column(String(50), nullable=True)  # e.g., 'breakfast', 'lunch', 'dinner', 'snack'
    tags = Column(JSON, nullable=True)  # List of tags like ['quick', 'healthy', 'vegetarian']
    
    # Nutritional information (optional, could be added later)
    calories_per_serving = Column(Integer, nullable=True)
    
    # Generation metadata
    original_prompt = Column(Text, nullable=False)  # The user's original prompt
    llm_model = Column(String(100), nullable=True)  # Which LLM model was used
    generation_metadata = Column(JSON, nullable=True)  # Additional generation info
    
    # Relationships
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="recipe")
    saved_recipes = relationship("SavedRecipe", back_populates="recipe", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Recipe(id={self.id}, title='{self.title}', servings={self.servings})>"
    
    @property
    def total_time(self):
        """Calculate total cooking time"""
        total = 0
        if self.prep_time:
            total += self.prep_time
        if self.cook_time:
            total += self.cook_time
        return total if total > 0 else None
    
    def to_api_response(self):
        """Convert to API response format matching mobile app expectations"""
        return {
            "id": str(self.id),
            "recipe": {
                "title": self.title,
                "description": self.description,
                "instructions": self.instructions or [],
                "prepTime": self.prep_time,
                "cookTime": self.cook_time,
                "servings": self.servings,
                "difficulty": self.difficulty,
                "tips": self.tips or []
            },
            "ingredients": [ingredient.to_api_format() for ingredient in self.ingredients],
            "generatedAt": self.created_at.isoformat() if self.created_at else None,
            "userPrompt": self.original_prompt
        }

class RecipeIngredient(BaseModel):
    """Ingredients associated with recipes"""
    
    __tablename__ = "recipe_ingredients"
    
    # Ingredient details
    name = Column(String(255), nullable=False)
    amount = Column(String(100), nullable=False)  # e.g., "2", "1/2", "to taste"
    unit = Column(String(50), nullable=True)  # e.g., "cups", "kg", "tablespoons"
    category = Column(String(100), nullable=False)  # grocery store category
    
    # Optional details
    preparation = Column(String(200), nullable=True)  # e.g., "diced", "chopped fine"
    notes = Column(String(500), nullable=True)  # special instructions
    is_optional = Column(Boolean, default=False, nullable=False)
    
    # Nutritional information (optional)
    calories = Column(Float, nullable=True)
    
    # Foreign key to recipe
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False, index=True)
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    
    def __repr__(self):
        return f"<RecipeIngredient(id={self.id}, name='{self.name}', amount='{self.amount} {self.unit}')>"
    
    def to_api_format(self):
        """Convert to API format matching mobile app expectations"""
        return {
            "id": str(self.id),
            "name": self.name,
            "amount": self.amount,
            "unit": self.unit,
            "category": self.category
        }

class SavedRecipe(BaseModel):
    """User's saved/favorited recipes"""
    
    __tablename__ = "saved_recipes"
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False, index=True)
    
    # Save metadata
    is_favorite = Column(Boolean, default=False, nullable=False)
    personal_notes = Column(Text, nullable=True)  # User's personal notes about the recipe
    rating = Column(Integer, nullable=True)  # 1-5 star rating
    times_made = Column(Integer, default=0, nullable=False)  # How many times user made it
    
    # Custom modifications
    custom_modifications = Column(JSON, nullable=True)  # User's recipe modifications
    
    # Relationships
    user = relationship("User", back_populates="saved_recipes")
    recipe = relationship("Recipe", back_populates="saved_recipes")
    
    def __repr__(self):
        return f"<SavedRecipe(user_id={self.user_id}, recipe_id={self.recipe_id}, is_favorite={self.is_favorite})>"
    
    def to_api_format(self):
        """Convert to API format for mobile app"""
        recipe_data = self.recipe.to_api_response()
        recipe_data.update({
            "savedAt": self.created_at.isoformat(),
            "isFavorite": self.is_favorite,
            "personalNotes": self.personal_notes,
            "rating": self.rating,
            "timesMade": self.times_made
        })
        return recipe_data