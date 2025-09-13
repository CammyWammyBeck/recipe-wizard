from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ShoppingListRecipeBreakdownSchema(BaseModel):
    """Schema for recipe breakdown in shopping list items"""
    recipe_id: str = Field(..., description="ID of the recipe", alias="recipeId")
    recipe_title: str = Field(..., description="Title of the recipe", alias="recipeTitle")
    quantity: str = Field(..., description="Quantity needed for this recipe")

    class Config:
        from_attributes = True
        populate_by_name = True  # Accept both snake_case and camelCase

class ShoppingListItemSchema(BaseModel):
    """Schema for shopping list items"""
    id: str = Field(..., description="Unique identifier for the item")
    ingredient_name: str = Field(..., description="Name of the ingredient", alias="ingredientName")
    category: str = Field(..., description="Grocery store category")
    consolidated_display: str = Field(..., description="Consolidated quantity display", alias="consolidatedDisplay")
    recipe_breakdown: List[ShoppingListRecipeBreakdownSchema] = Field(
        default_factory=list,
        description="Breakdown by recipe",
        alias="recipeBreakdown"
    )
    is_checked: bool = Field(default=False, description="Whether item is checked off", alias="isChecked")

    class Config:
        from_attributes = True
        populate_by_name = True  # Accept both snake_case and camelCase

class ShoppingListResponseSchema(BaseModel):
    """Schema for shopping list API response"""
    items: List[ShoppingListItemSchema] = Field(
        default_factory=list,
        description="List of shopping list items"
    )
    last_updated: Optional[datetime] = Field(
        None,
        description="When the shopping list was last updated",
        alias="lastUpdated"
    )

    class Config:
        from_attributes = True
        populate_by_name = True  # Accept both snake_case and camelCase

class AddRecipeToShoppingListRequest(BaseModel):
    """Schema for adding a recipe to shopping list"""
    recipe_id: str = Field(..., description="ID of the recipe to add", alias="recipeId")
    user_id: Optional[str] = Field(None, description="User ID (optional for authenticated users)", alias="userId")

    class Config:
        populate_by_name = True  # Allows both snake_case and camelCase

class UpdateShoppingListItemRequest(BaseModel):
    """Schema for updating shopping list item"""
    item_id: str = Field(..., description="ID of the item to update", alias="itemId")
    is_checked: bool = Field(..., description="New checked status", alias="isChecked")

    class Config:
        populate_by_name = True  # Allows both snake_case and camelCase

class ShoppingListItemUpdateResponse(BaseModel):
    """Schema for shopping list item update response"""
    success: bool = Field(..., description="Whether the update was successful")
    item: Optional[ShoppingListItemSchema] = Field(None, description="Updated item data")

class ClearShoppingListRequest(BaseModel):
    """Schema for clearing shopping list"""
    user_id: Optional[str] = Field(None, description="User ID (optional for authenticated users)")

class ClearShoppingListResponse(BaseModel):
    """Schema for clear shopping list response"""
    success: bool = Field(..., description="Whether the clear operation was successful")
    message: str = Field(..., description="Response message")
