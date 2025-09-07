from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# User Authentication Schemas
class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for user data in responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

# User Preferences Schemas
class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences"""
    units: Optional[str] = Field(None, pattern="^(metric|imperial)$")
    grocery_categories: Optional[List[str]] = None
    default_servings: Optional[int] = Field(None, ge=1, le=20)
    preferred_difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    max_cook_time: Optional[int] = Field(None, ge=1, le=480)  # Max 8 hours
    max_prep_time: Optional[int] = Field(None, ge=1, le=240)  # Max 4 hours
    dietary_restrictions: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    dislikes: Optional[List[str]] = None
    additional_preferences: Optional[str] = Field(None, max_length=2000)
    theme_preference: Optional[str] = Field(None, pattern="^(light|dark|system)$")

class UserPreferencesResponse(UserPreferencesUpdate):
    """Schema for user preferences in responses"""
    model_config = ConfigDict(from_attributes=True)
    
    # Override to make required in response
    units: str
    grocery_categories: List[str]
    default_servings: int
    dietary_restrictions: List[str]
    allergens: List[str] 
    dislikes: List[str]
    additional_preferences: str
    theme_preference: str

class UserProfile(BaseModel):
    """Complete user profile with preferences"""
    model_config = ConfigDict(from_attributes=True)
    
    # User info
    id: int
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    
    # Preferences
    units: str
    grocery_categories: List[str]
    default_servings: int
    preferred_difficulty: Optional[str] = None
    max_cook_time: Optional[int] = None
    max_prep_time: Optional[int] = None
    dietary_restrictions: List[str]
    allergens: List[str]
    dislikes: List[str]
    additional_preferences: str
    theme_preference: str
    
    created_at: datetime
    updated_at: datetime

# Authentication Token Schemas
class TokenUser(BaseModel):
    """User data included in token response"""
    id: int
    email: str
    username: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    isActive: bool

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: TokenUser

class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None