from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..database import get_db
from ..models import User
from ..schemas import (
    UserResponse, UserProfile, UserPreferencesUpdate, 
    UserPreferencesResponse, ErrorResponse
)
from ..utils.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's complete profile including preferences.
    
    This matches what the mobile app expects for user settings.
    """
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    username: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's basic profile information.
    """
    try:
        # Check username uniqueness if provided
        if username and username != current_user.username:
            existing_user = db.query(User).filter(
                User.username == username, 
                User.id != current_user.id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            current_user.username = username
        
        # Update profile fields
        if first_name is not None:
            current_user.first_name = first_name
        if last_name is not None:
            current_user.last_name = last_name
        
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Profile updated for user: {current_user.email}")
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )

@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: User = Depends(get_current_user)
):
    """
    Get user's recipe and UI preferences.
    
    Returns preferences in the format expected by the mobile app.
    """
    return UserPreferencesResponse(
        units=current_user.units,
        grocery_categories=current_user.grocery_categories or [],
        default_servings=current_user.default_servings,
        preferred_difficulty=current_user.preferred_difficulty,
        max_cook_time=current_user.max_cook_time,
        max_prep_time=current_user.max_prep_time,
        dietary_restrictions=current_user.dietary_restrictions or [],
        allergens=current_user.allergens or [],
        dislikes=current_user.dislikes or [],
        additional_preferences=current_user.additional_preferences or "",
        theme_preference=current_user.theme_preference
    )

@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's recipe and UI preferences.
    
    This endpoint is used by the mobile app's Profile/Settings screen.
    """
    try:
        # Update only the fields that are provided
        update_data = preferences.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Preferences updated for user: {current_user.email}")
        
        # Return updated preferences
        return UserPreferencesResponse(
            units=current_user.units,
            grocery_categories=current_user.grocery_categories or [],
            default_servings=current_user.default_servings,
            preferred_difficulty=current_user.preferred_difficulty,
            max_cook_time=current_user.max_cook_time,
            max_prep_time=current_user.max_prep_time,
            dietary_restrictions=current_user.dietary_restrictions or [],
            allergens=current_user.allergens or [],
            dislikes=current_user.dislikes or [],
            additional_preferences=current_user.additional_preferences or "",
            theme_preference=current_user.theme_preference
        )
        
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Preferences update failed"
        )

@router.delete("/account")
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user account and all associated data.
    
    This is a destructive operation and cannot be undone.
    """
    try:
        # In a production system, you might want to soft delete or archive the account
        user_email = current_user.email
        
        # Delete user (cascade will handle related records)
        db.delete(current_user)
        db.commit()
        
        logger.info(f"Account deleted: {user_email}")
        
        return {
            "message": "Account successfully deleted",
            "detail": "All user data has been permanently removed"
        }
        
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account deletion failed"
        )

@router.get("/settings", response_model=UserProfile)
async def get_user_settings(
    current_user: User = Depends(get_current_user)
):
    """
    Get complete user settings for the mobile app settings screen.
    
    This is an alias for the profile endpoint, optimized for the settings UI.
    """
    return current_user