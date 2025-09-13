from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from collections import defaultdict
import logging

from ..models import (
    User, Recipe, RecipeIngredient, ShoppingList, ShoppingListItem,
    ShoppingListRecipeBreakdown, ShoppingListRecipeAssociation
)
from ..schemas.shopping_list import (
    ShoppingListResponseSchema, AddRecipeToShoppingListRequest,
    UpdateShoppingListItemRequest, ClearShoppingListRequest
)

logger = logging.getLogger(__name__)

class ShoppingListService:
    """Service for managing shopping lists and ingredient consolidation"""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_shopping_list(self, user_id: int) -> ShoppingList:
        """Get user's active shopping list or create a new one"""
        shopping_list = self.db.query(ShoppingList).filter(
            and_(
                ShoppingList.user_id == user_id,
                ShoppingList.is_active == True
            )
        ).first()

        if not shopping_list:
            shopping_list = ShoppingList(
                user_id=user_id,
                name="My Shopping List",
                is_active=True
            )
            self.db.add(shopping_list)
            self.db.commit()
            self.db.refresh(shopping_list)

        return shopping_list

    def add_recipe_to_shopping_list(
        self,
        user_id: int,
        recipe_id: int
    ) -> ShoppingListResponseSchema:
        """Add a recipe's ingredients to the shopping list"""

        # Get the recipe
        recipe = self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
        if not recipe:
            raise ValueError(f"Recipe with ID {recipe_id} not found")

        # Get or create shopping list
        shopping_list = self.get_or_create_shopping_list(user_id)

        # Allow adding the same recipe multiple times; do not block duplicates

        # Track that this recipe was added (duplicates allowed)
        recipe_association = ShoppingListRecipeAssociation(
            shopping_list_id=shopping_list.id,
            recipe_id=recipe_id
        )
        self.db.add(recipe_association)

        # Add ingredients to shopping list
        for ingredient in recipe.ingredients:
            self._add_ingredient_to_shopping_list(
                shopping_list, recipe, ingredient
            )

        self.db.commit()
        return self._get_shopping_list_response(shopping_list)

    def _add_ingredient_to_shopping_list(
        self,
        shopping_list: ShoppingList,
        recipe: Recipe,
        ingredient: RecipeIngredient
    ):
        """Add or update an ingredient in the shopping list"""

        # Check if ingredient already exists in shopping list
        existing_item = self.db.query(ShoppingListItem).filter(
            and_(
                ShoppingListItem.shopping_list_id == shopping_list.id,
                ShoppingListItem.ingredient_name == ingredient.name,
                ShoppingListItem.category == ingredient.category
            )
        ).first()

        if existing_item:
            # Add to existing item
            self._add_to_existing_item(existing_item, recipe, ingredient)
        else:
            # Create new item
            self._create_new_shopping_item(shopping_list, recipe, ingredient)

    def _add_to_existing_item(
        self,
        existing_item: ShoppingListItem,
        recipe: Recipe,
        ingredient: RecipeIngredient
    ):
        """Add ingredient quantity to existing shopping list item"""

        # Create recipe breakdown entry
        breakdown = ShoppingListRecipeBreakdown(
            shopping_item_id=existing_item.id,
            recipe_id=recipe.id,
            original_ingredient_id=ingredient.id,
            recipe_title=recipe.title,
            quantity=f"{ingredient.amount} {ingredient.unit or ''}".strip()
        )
        self.db.add(breakdown)

        # Recalculate consolidated display
        existing_item.consolidated_display = self._calculate_consolidated_display(existing_item)

    def _create_new_shopping_item(
        self,
        shopping_list: ShoppingList,
        recipe: Recipe,
        ingredient: RecipeIngredient
    ):
        """Create a new shopping list item"""

        # Create shopping list item with proper unit handling
        consolidated_display = self._format_ingredient_display(ingredient.amount, ingredient.unit)
        item = ShoppingListItem(
            shopping_list_id=shopping_list.id,
            ingredient_name=ingredient.name,
            category=ingredient.category,
            consolidated_display=consolidated_display,
            is_checked=False
        )
        self.db.add(item)
        self.db.flush()  # Get the item ID

        # Create recipe breakdown with proper formatting
        quantity_display = self._format_ingredient_display(ingredient.amount, ingredient.unit)
        breakdown = ShoppingListRecipeBreakdown(
            shopping_item_id=item.id,
            recipe_id=recipe.id,
            original_ingredient_id=ingredient.id,
            recipe_title=recipe.title,
            quantity=quantity_display
        )
        self.db.add(breakdown)

    def _format_ingredient_display(self, amount: str, unit: str) -> str:
        """Format ingredient display, handling N/A units properly"""
        if not unit or unit.lower() == 'n/a':
            # For non-measurement ingredients like "pinch" or "to taste"
            # Check if amount is already descriptive (like "to taste", "pinch", etc.)
            amount_lower = amount.lower() if amount else ""
            if any(word in amount_lower for word in ['pinch', 'to taste', 'handful', 'dash', 'splash', 'squeeze']):
                return amount  # e.g., "pinch", "to taste"
            else:
                return amount  # e.g., "1", "2" (for items like eggs, onions)
        else:
            return f"{amount} {unit}".strip()

    def _calculate_consolidated_display(self, item: ShoppingListItem) -> str:
        """Calculate consolidated display for an item with multiple recipe sources"""
        # This is a simplified version - you might want more sophisticated consolidation
        breakdowns = item.recipe_breakdowns
        if len(breakdowns) == 1:
            return breakdowns[0].quantity

        # For multiple sources, show total if possible, otherwise list all
        quantities = []
        total_numeric = 0
        has_numeric = True
        common_unit = None

        for breakdown in breakdowns:
            quantities.append(breakdown.quantity)

            # Try to sum numeric quantities with same units
            try:
                # Skip N/A quantities and descriptive amounts
                if not breakdown.quantity or any(word in breakdown.quantity.lower() for word in ['pinch', 'to taste', 'handful', 'dash', 'splash']):
                    has_numeric = False
                    continue

                parts = breakdown.quantity.split()
                if len(parts) >= 1:
                    num_part = parts[0]
                    unit_part = ' '.join(parts[1:]) if len(parts) > 1 else ''

                    if common_unit is None:
                        common_unit = unit_part
                    elif common_unit != unit_part:
                        has_numeric = False
                        continue

                    if '/' in num_part:
                        # Handle simple fractions like "1/2", "3/4"
                        parts = num_part.split('/')
                        if len(parts) == 2:
                            num = float(parts[0]) / float(parts[1])
                        else:
                            has_numeric = False
                            continue
                    else:
                        num = float(num_part)
                    total_numeric += num
            except (ValueError, ZeroDivisionError):
                has_numeric = False

        if has_numeric and len(breakdowns) > 1:
            # Show consolidated total
            if total_numeric == int(total_numeric):
                return f"{int(total_numeric)} {common_unit}".strip()
            else:
                return f"{total_numeric:.2f} {common_unit}".strip().rstrip('0').rstrip('.')
        else:
            # Show breakdown
            return " + ".join(quantities)

    def get_shopping_list(self, user_id: int) -> ShoppingListResponseSchema:
        """Get user's shopping list"""
        shopping_list = self.get_or_create_shopping_list(user_id)
        return self._get_shopping_list_response(shopping_list)

    def _get_shopping_list_response(self, shopping_list: ShoppingList) -> ShoppingListResponseSchema:
        """Convert shopping list to API response format"""
        return ShoppingListResponseSchema(
            items=[item.to_api_format() for item in shopping_list.items],
            last_updated=shopping_list.updated_at
        )

    def update_item_status(
        self,
        user_id: int,
        item_id: int,
        is_checked: bool
    ) -> ShoppingListItem:
        """Update the checked status of a shopping list item"""

        # Verify item belongs to user
        item = self.db.query(ShoppingListItem).join(ShoppingList).filter(
            and_(
                ShoppingListItem.id == item_id,
                ShoppingList.user_id == user_id
            )
        ).first()

        if not item:
            raise ValueError(f"Shopping list item {item_id} not found for user {user_id}")

        item.is_checked = is_checked
        self.db.commit()
        self.db.refresh(item)

        return item

    def clear_shopping_list(self, user_id: int) -> bool:
        """Clear all items from user's shopping list"""
        try:
            shopping_list = self.get_or_create_shopping_list(user_id)

            # Delete all recipe breakdowns first
            self.db.query(ShoppingListRecipeBreakdown).join(ShoppingListItem).filter(
                ShoppingListItem.shopping_list_id == shopping_list.id
            ).delete(synchronize_session=False)

            # Delete all items
            self.db.query(ShoppingListItem).filter(
                ShoppingListItem.shopping_list_id == shopping_list.id
            ).delete(synchronize_session=False)

            # Delete all recipe associations
            self.db.query(ShoppingListRecipeAssociation).filter(
                ShoppingListRecipeAssociation.shopping_list_id == shopping_list.id
            ).delete(synchronize_session=False)

            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise e

    def remove_recipe_from_shopping_list(
        self,
        user_id: int,
        recipe_id: int
    ) -> ShoppingListResponseSchema:
        """Remove a specific recipe's ingredients from the shopping list"""

        shopping_list = self.get_or_create_shopping_list(user_id)

        # Find recipe association
        recipe_association = self.db.query(ShoppingListRecipeAssociation).filter(
            and_(
                ShoppingListRecipeAssociation.shopping_list_id == shopping_list.id,
                ShoppingListRecipeAssociation.recipe_id == recipe_id
            )
        ).first()

        if not recipe_association:
            raise ValueError(f"Recipe {recipe_id} not found in shopping list")

        # Find all breakdowns for this recipe
        recipe_breakdowns = self.db.query(ShoppingListRecipeBreakdown).join(
            ShoppingListItem
        ).filter(
            and_(
                ShoppingListItem.shopping_list_id == shopping_list.id,
                ShoppingListRecipeBreakdown.recipe_id == recipe_id
            )
        ).all()

        # For each breakdown, either remove it or update the item
        for breakdown in recipe_breakdowns:
            item = breakdown.shopping_item

            # Remove this breakdown
            self.db.delete(breakdown)

            # Check if item has other breakdowns
            remaining_breakdowns = [b for b in item.recipe_breakdowns if b.id != breakdown.id]

            if not remaining_breakdowns:
                # No other recipes use this ingredient, delete the item
                self.db.delete(item)
            else:
                # Recalculate consolidated display
                item.consolidated_display = self._calculate_consolidated_display(item)

        # Remove recipe association
        self.db.delete(recipe_association)
        self.db.commit()

        return self._get_shopping_list_response(shopping_list)
