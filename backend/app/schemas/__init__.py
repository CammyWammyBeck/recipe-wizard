# Pydantic schemas package
from .base import BaseResponse, ErrorResponse, PaginatedResponse, HealthResponse, StatusResponse
from .user import (
    UserCreate, UserLogin, UserResponse, UserPreferencesUpdate, 
    UserPreferencesResponse, UserProfile, Token, TokenData
)
from .recipe import (
    IngredientCreate, IngredientResponse, IngredientAPI,
    RecipeCreate, RecipeUpdate, RecipeResponse, RecipeAPI,
    RecipeGenerationRequest, RecipeGenerationResponse, RecipeModificationRequest,
    RecipeIdeaGenerationRequest, RecipeIdea, RecipeIdeasResponse,
    SavedRecipeCreate, SavedRecipeUpdate, SavedRecipeResponse, SaveRecipeSuccessResponse
)
from .conversation import (
    ConversationCreate, ConversationUpdate, ConversationResponse, ConversationAPI,
    ConversationFeedbackCreate, ConversationFeedbackResponse, UserRatingUpdate,
    ConversationAnalytics, ConversationSession
)
from .shopping_list import (
    ShoppingListItemSchema, ShoppingListResponseSchema, ShoppingListRecipeBreakdownSchema,
    AddRecipeToShoppingListRequest, UpdateShoppingListItemRequest, ShoppingListItemUpdateResponse,
    ClearShoppingListRequest, ClearShoppingListResponse
)

__all__ = [
    # Base schemas
    "BaseResponse", "ErrorResponse", "PaginatedResponse", "HealthResponse", "StatusResponse",
    
    # User schemas
    "UserCreate", "UserLogin", "UserResponse", "UserPreferencesUpdate", 
    "UserPreferencesResponse", "UserProfile", "Token", "TokenData",
    
    # Recipe schemas
    "IngredientCreate", "IngredientResponse", "IngredientAPI",
    "RecipeCreate", "RecipeUpdate", "RecipeResponse", "RecipeAPI",
    "RecipeGenerationRequest", "RecipeGenerationResponse", "RecipeModificationRequest",
    "RecipeIdeaGenerationRequest", "RecipeIdea", "RecipeIdeasResponse",
    "SavedRecipeCreate", "SavedRecipeUpdate", "SavedRecipeResponse", "SaveRecipeSuccessResponse",
    
    # Conversation schemas
    "ConversationCreate", "ConversationUpdate", "ConversationResponse", "ConversationAPI",
    "ConversationFeedbackCreate", "ConversationFeedbackResponse", "UserRatingUpdate",
    "ConversationAnalytics", "ConversationSession",

    # Shopping list schemas
    "ShoppingListItemSchema", "ShoppingListResponseSchema", "ShoppingListRecipeBreakdownSchema",
    "AddRecipeToShoppingListRequest", "UpdateShoppingListItemRequest", "ShoppingListItemUpdateResponse",
    "ClearShoppingListRequest", "ClearShoppingListResponse"
]