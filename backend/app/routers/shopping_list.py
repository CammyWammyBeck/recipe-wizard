from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..database import get_db
from ..models import User
from ..schemas.shopping_list import (
    ShoppingListResponseSchema,
    AddRecipeToShoppingListRequest,
    UpdateShoppingListItemRequest,
    ShoppingListItemUpdateResponse,
    ClearShoppingListRequest,
    ClearShoppingListResponse
)
from ..services.shopping_list_service import ShoppingListService
from ..utils.auth import get_current_user_optional, get_current_user
from ..schemas.base import ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/shopping-list", tags=["shopping-list"])

@router.get("/", response_model=ShoppingListResponseSchema)
async def get_shopping_list(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get the user's shopping list with all items and recipe breakdowns.

    Returns consolidated ingredients from all added recipes, organized by category.
    Each item shows the total needed amount and breaks down by recipe.
    """
    try:
        # For now, use a default user ID if no authentication
        # In production, you'd require authentication
        user_id = current_user.id if current_user else 1

        service = ShoppingListService(db)
        shopping_list = service.get_shopping_list(user_id)

        logger.info(f"Retrieved shopping list for user {user_id} with {len(shopping_list.items)} items")
        return shopping_list

    except Exception as e:
        logger.error(f"Error retrieving shopping list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve shopping list"
        )

@router.post("/add-recipe", response_model=ShoppingListResponseSchema)
async def add_recipe_to_shopping_list(
    request: AddRecipeToShoppingListRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Add a recipe's ingredients to the shopping list.

    Ingredients are consolidated with existing items of the same name and category.
    The consolidated display shows the total amount needed, and the breakdown
    shows how much comes from each recipe.
    """
    try:
        # For now, use a default user ID if no authentication
        user_id = current_user.id if current_user else 1
        recipe_id = int(request.recipe_id)

        service = ShoppingListService(db)
        shopping_list = service.add_recipe_to_shopping_list(
            user_id=user_id,
            recipe_id=recipe_id
        )

        logger.info(f"Added recipe {recipe_id} to shopping list for user {user_id}")
        return shopping_list

    except ValueError as e:
        logger.warning(f"Invalid request to add recipe to shopping list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Support no-trailing-slash variant to avoid redirects dropping auth headers on some clients
@router.get("", response_model=ShoppingListResponseSchema, include_in_schema=False)
async def get_shopping_list_no_slash(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        user_id = current_user.id if current_user else 1
        service = ShoppingListService(db)
        shopping_list = service.get_shopping_list(user_id)
        logger.info(f"Retrieved shopping list (no-slash) for user {user_id} with {len(shopping_list.items)} items")
        return shopping_list
    except Exception as e:
        logger.error(f"Error retrieving shopping list (no-slash): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve shopping list"
        )
    except Exception as e:
        logger.error(f"Error adding recipe to shopping list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add recipe to shopping list"
        )

@router.put("/items/{item_id}", response_model=ShoppingListItemUpdateResponse)
async def update_shopping_list_item(
    item_id: str,
    request: UpdateShoppingListItemRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Update a shopping list item's status (checked/unchecked).

    This endpoint is used when users check off items while shopping.
    """
    try:
        # For now, use a default user ID if no authentication
        user_id = current_user.id if current_user else 1
        item_id_int = int(item_id)

        service = ShoppingListService(db)
        updated_item = service.update_item_status(
            user_id=user_id,
            item_id=item_id_int,
            is_checked=request.is_checked
        )

        logger.info(f"Updated item {item_id} status to {request.is_checked} for user {user_id}")

        return ShoppingListItemUpdateResponse(
            success=True,
            item=updated_item.to_api_format()
        )

    except ValueError as e:
        logger.warning(f"Invalid request to update shopping list item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating shopping list item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update shopping list item"
        )

@router.delete("/clear", response_model=ClearShoppingListResponse)
async def clear_shopping_list(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Clear all items from the shopping list.

    This removes all items and recipe associations from the user's shopping list.
    This action cannot be undone.
    """
    try:
        # For now, use a default user ID if no authentication
        user_id = current_user.id if current_user else 1

        service = ShoppingListService(db)
        success = service.clear_shopping_list(user_id)

        logger.info(f"Cleared shopping list for user {user_id}")

        return ClearShoppingListResponse(
            success=success,
            message="Shopping list cleared successfully"
        )

    except Exception as e:
        logger.error(f"Error clearing shopping list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear shopping list"
        )

@router.delete("/recipes/{recipe_id}", response_model=ShoppingListResponseSchema)
async def remove_recipe_from_shopping_list(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Remove a specific recipe's ingredients from the shopping list.

    This removes only the ingredients that came from the specified recipe.
    If an ingredient is used by multiple recipes, only this recipe's contribution
    is removed and the consolidated amount is recalculated.
    """
    try:
        # For now, use a default user ID if no authentication
        user_id = current_user.id if current_user else 1
        recipe_id_int = int(recipe_id)

        service = ShoppingListService(db)
        shopping_list = service.remove_recipe_from_shopping_list(
            user_id=user_id,
            recipe_id=recipe_id_int
        )

        logger.info(f"Removed recipe {recipe_id} from shopping list for user {user_id}")
        return shopping_list

    except ValueError as e:
        logger.warning(f"Invalid request to remove recipe from shopping list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error removing recipe from shopping list: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove recipe from shopping list"
        )
