from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class Conversation(BaseModel):
    """Conversation model for tracking recipe generation history"""
    
    __tablename__ = "conversations"
    
    # User's input
    user_prompt = Column(Text, nullable=False)  # The original user request
    enhanced_prompt = Column(Text, nullable=True)  # Prompt with user preferences added
    
    # LLM generation details
    llm_model = Column(String(100), nullable=True)  # Which model was used (e.g., 'llama2', 'gpt-4')
    llm_provider = Column(String(50), nullable=True)  # Provider (e.g., 'openai')
    generation_time_ms = Column(Integer, nullable=True)  # Time taken to generate
    token_count = Column(Integer, nullable=True)  # Number of tokens used
    
    # Generation metadata
    generation_metadata = Column(JSON, nullable=True)  # Additional metadata like temperature, etc.
    generation_status = Column(String(50), default='completed', nullable=False)  # 'pending', 'completed', 'failed'
    error_message = Column(Text, nullable=True)  # If generation failed
    
    # User feedback
    user_rating = Column(Integer, nullable=True)  # 1-5 star rating
    user_feedback = Column(Text, nullable=True)  # Optional user feedback
    was_saved = Column(Boolean, default=False, nullable=False)  # Did user save the recipe
    
    # Session information
    session_id = Column(String(100), nullable=True, index=True)  # For grouping related conversations
    conversation_context = Column(JSON, nullable=True)  # Previous conversation context if any
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Nullable for anonymous users
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True, index=True)  # Nullable if generation failed
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    recipe = relationship("Recipe", back_populates="conversations")
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, user_id={self.user_id}, status='{self.generation_status}')>"
    
    def to_api_format(self):
        """Convert to API format for conversation history"""
        return {
            "id": str(self.id),
            "userPrompt": self.user_prompt,
            "response": self.recipe.to_api_response() if self.recipe else None,
            "createdAt": self.created_at.isoformat(),
            "status": self.generation_status,
            "rating": self.user_rating,
            "wasSaved": self.was_saved,
            "generationTime": self.generation_time_ms,
            "model": self.llm_model
        }
    
    @property
    def is_successful(self):
        """Check if conversation resulted in successful recipe generation"""
        return self.generation_status == 'completed' and self.recipe is not None
    
    @property
    def generation_time_seconds(self):
        """Get generation time in seconds"""
        return self.generation_time_ms / 1000 if self.generation_time_ms else None

class ConversationFeedback(BaseModel):
    """Additional feedback and analytics for conversations"""
    
    __tablename__ = "conversation_feedback"
    
    # Foreign key
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    
    # Feedback types
    feedback_type = Column(String(50), nullable=False)  # 'thumbs_up', 'thumbs_down', 'report', 'suggestion'
    feedback_category = Column(String(100), nullable=True)  # 'accuracy', 'clarity', 'creativity', 'safety'
    feedback_text = Column(Text, nullable=True)  # Detailed feedback
    
    # Analytics data
    user_agent = Column(String(500), nullable=True)  # Browser/app info
    ip_address = Column(String(45), nullable=True)  # For analytics (anonymized)
    device_info = Column(JSON, nullable=True)  # Device/platform information
    
    # Moderation
    is_reviewed = Column(Boolean, default=False, nullable=False)
    moderator_notes = Column(Text, nullable=True)
    
    # Relationships
    conversation = relationship("Conversation")
    
    def __repr__(self):
        return f"<ConversationFeedback(id={self.id}, type='{self.feedback_type}', conversation_id={self.conversation_id})>"