from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# Conversation Schemas
class ConversationCreate(BaseModel):
    """Schema for creating conversations"""
    user_prompt: str = Field(..., min_length=1, max_length=2000)
    enhanced_prompt: Optional[str] = None
    user_id: Optional[int] = None
    session_id: Optional[str] = Field(None, max_length=100)
    conversation_context: Optional[Dict[str, Any]] = None

class ConversationUpdate(BaseModel):
    """Schema for updating conversations with generation results"""
    recipe_id: Optional[int] = None
    llm_model: Optional[str] = Field(None, max_length=100)
    llm_provider: Optional[str] = Field(None, max_length=50)
    generation_time_ms: Optional[int] = Field(None, ge=0)
    token_count: Optional[int] = Field(None, ge=0)
    generation_metadata: Optional[Dict[str, Any]] = None
    generation_status: str = Field("completed", pattern="^(pending|completed|failed)$")
    error_message: Optional[str] = None
    was_saved: bool = False

class ConversationResponse(BaseModel):
    """Schema for conversation responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_prompt: str
    enhanced_prompt: Optional[str] = None
    user_id: Optional[int] = None
    recipe_id: Optional[int] = None
    llm_model: Optional[str] = None
    llm_provider: Optional[str] = None
    generation_time_ms: Optional[int] = None
    token_count: Optional[int] = None
    generation_status: str
    error_message: Optional[str] = None
    user_rating: Optional[int] = None
    user_feedback: Optional[str] = None
    was_saved: bool
    session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ConversationAPI(BaseModel):
    """Schema matching mobile app conversation history expectations"""
    id: str
    userPrompt: str
    response: Optional[Dict[str, Any]] = None  # Recipe data if successful
    createdAt: str  # ISO timestamp
    status: str
    rating: Optional[int] = None
    wasSaved: bool
    generationTime: Optional[int] = None  # milliseconds
    model: Optional[str] = None

# Feedback Schemas
class ConversationFeedbackCreate(BaseModel):
    """Schema for creating conversation feedback"""
    conversation_id: int
    feedback_type: str = Field(..., pattern="^(thumbs_up|thumbs_down|report|suggestion)$")
    feedback_category: Optional[str] = Field(None, max_length=100)
    feedback_text: Optional[str] = Field(None, max_length=2000)
    user_agent: Optional[str] = Field(None, max_length=500)
    device_info: Optional[Dict[str, Any]] = None

class ConversationFeedbackResponse(BaseModel):
    """Schema for conversation feedback responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    conversation_id: int
    feedback_type: str
    feedback_category: Optional[str] = None
    feedback_text: Optional[str] = None
    is_reviewed: bool
    moderator_notes: Optional[str] = None
    created_at: datetime

class UserRatingUpdate(BaseModel):
    """Schema for updating conversation ratings"""
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=1000)

# Session and Analytics Schemas
class ConversationAnalytics(BaseModel):
    """Schema for conversation analytics"""
    total_conversations: int
    successful_generations: int
    failed_generations: int
    average_generation_time_ms: Optional[float] = None
    most_common_prompts: List[str]
    user_satisfaction_rating: Optional[float] = None
    popular_cuisines: List[str]
    popular_dietary_restrictions: List[str]

class ConversationSession(BaseModel):
    """Schema for conversation sessions"""
    session_id: str
    user_id: Optional[int] = None
    conversations: List[ConversationResponse]
    started_at: datetime
    last_activity_at: datetime
    total_conversations: int
    successful_generations: int