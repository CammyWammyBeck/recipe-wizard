from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# Ingredient Schemas
class IngredientBase(BaseModel):
    """Base schema for recipe ingredients"""
    name: str = Field(..., min_length=1, max_length=255)
    amount: str = Field(..., min_length=1, max_length=100) 
    unit: Optional[str] = Field(None, max_length=50)
    category: str = Field(..., max_length=100)
    preparation: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)
    is_optional: bool = False

class IngredientCreate(IngredientBase):
    """Schema for creating ingredients"""
    pass

class IngredientResponse(IngredientBase):
    """Schema for ingredient responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    recipe_id: int
    calories: Optional[float] = None
    created_at: datetime

class IngredientAPI(BaseModel):
    """Schema matching mobile app API expectations"""
    id: str
    name: str
    amount: str
    unit: Optional[str] = None
    category: str

# Recipe Schemas
class RecipeBase(BaseModel):
    """Base schema for recipes"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    prep_time: Optional[int] = Field(None, ge=0, le=480)  # 0-8 hours
    cook_time: Optional[int] = Field(None, ge=0, le=480)  # 0-8 hours
    servings: Optional[int] = Field(None, ge=1, le=50)
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    instructions: List[str] = Field(..., min_items=1)
    tips: Optional[List[str]] = None
    cuisine_type: Optional[str] = Field(None, max_length=100)
    meal_type: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None

class RecipeCreate(RecipeBase):
    """Schema for creating recipes"""
    original_prompt: str = Field(..., min_length=1)
    llm_model: Optional[str] = None
    generation_metadata: Optional[Dict[str, Any]] = None
    ingredients: List[IngredientCreate] = Field(..., min_items=1)

class RecipeUpdate(BaseModel):
    """Schema for updating recipes"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    prep_time: Optional[int] = Field(None, ge=0, le=480)
    cook_time: Optional[int] = Field(None, ge=0, le=480)
    servings: Optional[int] = Field(None, ge=1, le=50)
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    instructions: Optional[List[str]] = None
    tips: Optional[List[str]] = None
    cuisine_type: Optional[str] = Field(None, max_length=100)
    meal_type: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None

class RecipeResponse(RecipeBase):
    """Schema for recipe responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    original_prompt: str
    llm_model: Optional[str] = None
    calories_per_serving: Optional[int] = None
    ingredients: List[IngredientResponse] = []
    created_at: datetime
    updated_at: datetime

# Recipe API Schema (must come before RecipeGenerationResponse)
class RecipeAPI(BaseModel):
    """Recipe data matching mobile app expectations"""
    title: str
    description: Optional[str] = None
    instructions: List[str]
    prepTime: Optional[int] = None
    cookTime: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    tips: Optional[List[str]] = None

# Recipe Generation Schemas
class RecipeGenerationRequest(BaseModel):
    """Schema for recipe generation requests"""
    prompt: str = Field(..., min_length=3, max_length=1000)
    user_id: Optional[int] = None
    preferences: Optional[Dict[str, Any]] = None  # User preferences from mobile app

class RecipeGenerationResponse(BaseModel):
    """Schema matching mobile app expectations exactly"""
    id: str
    recipe: RecipeAPI
    ingredients: List[IngredientAPI]
    generatedAt: str  # ISO timestamp
    userPrompt: str

# Saved Recipe Schemas
class SavedRecipeCreate(BaseModel):
    """Schema for saving recipes"""
    recipe_id: int
    is_favorite: bool = False
    personal_notes: Optional[str] = Field(None, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)

class SavedRecipeUpdate(BaseModel):
    """Schema for updating saved recipes"""
    is_favorite: Optional[bool] = None
    personal_notes: Optional[str] = Field(None, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)
    times_made: Optional[int] = Field(None, ge=0)
    custom_modifications: Optional[Dict[str, Any]] = None

class SavedRecipeResponse(BaseModel):
    """Schema for saved recipe responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    recipe_id: int
    is_favorite: bool
    personal_notes: Optional[str] = None
    rating: Optional[int] = None
    times_made: int
    custom_modifications: Optional[Dict[str, Any]] = None
    recipe: RecipeResponse
    created_at: datetime
    updated_at: datetime