import uuid
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from ..models import RecipeJob, User, Recipe, RecipeIngredient
from ..schemas import RecipeGenerationRequest, RecipeModificationRequest
from ..database import get_db
from .llm_service import llm_service

logger = logging.getLogger(__name__)

class RecipeJobService:
    """Service for managing async recipe generation jobs"""
    
    def __init__(self):
        self.active_jobs: Dict[str, asyncio.Task] = {}
    
    async def create_generation_job(
        self, 
        user: User, 
        prompt: str, 
        preferences: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new recipe generation job"""
        job_id = str(uuid.uuid4())
        
        # Create database record
        with next(get_db()) as db:
            job = RecipeJob(
                id=job_id,
                user_id=user.id,
                status="pending",
                job_type="generate",
                prompt=prompt,
                preferences=preferences,
                progress=0
            )
            db.add(job)
            db.commit()
            
        # Start background task
        task = asyncio.create_task(self._process_generation_job(job_id))
        self.active_jobs[job_id] = task
        
        logger.info(f"Created recipe generation job {job_id} for user {user.email}")
        return job_id
    
    async def create_modification_job(
        self,
        user: User,
        original_recipe_id: int,
        modification_prompt: str,
        preferences: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new recipe modification job"""
        job_id = str(uuid.uuid4())
        
        # Create database record
        with next(get_db()) as db:
            job = RecipeJob(
                id=job_id,
                user_id=user.id,
                status="pending",
                job_type="modify",
                prompt="",  # Will be set to modification prompt
                modification_prompt=modification_prompt,
                original_recipe_id=original_recipe_id,
                preferences=preferences,
                progress=0
            )
            db.add(job)
            db.commit()
            
        # Start background task
        task = asyncio.create_task(self._process_modification_job(job_id))
        self.active_jobs[job_id] = task
        
        logger.info(f"Created recipe modification job {job_id} for user {user.email}")
        return job_id
    
    async def get_job_status(self, job_id: str) -> Optional[RecipeJob]:
        """Get current job status"""
        with next(get_db()) as db:
            return db.query(RecipeJob).filter(RecipeJob.id == job_id).first()
    
    async def _process_generation_job(self, job_id: str):
        """Process recipe generation in background"""
        try:
            with next(get_db()) as db:
                # Get job and user
                job = db.query(RecipeJob).filter(RecipeJob.id == job_id).first()
                if not job:
                    logger.error(f"Job {job_id} not found")
                    return
                
                user = db.query(User).filter(User.id == job.user_id).first()
                if not user:
                    logger.error(f"User {job.user_id} not found for job {job_id}")
                    return
                
                # Update status to processing
                job.status = "processing"
                job.started_at = func.now()
                job.progress = 10
                db.commit()
                
                logger.info(f"Starting recipe generation for job {job_id}")
                
                # Create request object
                request = RecipeGenerationRequest(
                    prompt=job.prompt,
                    preferences=job.preferences
                )
                
                # Update progress
                job.progress = 30
                db.commit()
                
                # Generate recipe using existing LLM service
                generation_result = await llm_service.generate_recipe_with_fallback(request, user)
                
                # Update progress
                job.progress = 70
                db.commit()
                
                # Save recipe to database
                recipe_id = await self._save_recipe_to_database(
                    db, user, generation_result['recipe_data'], job.prompt, generation_result
                )
                
                # Complete job
                job.status = "completed"
                job.completed_at = func.now()
                job.recipe_id = recipe_id
                job.progress = 100
                job.generation_metadata = {
                    'model': generation_result.get('model'),
                    'generation_time_ms': generation_result.get('generation_time_ms'),
                    'token_count': generation_result.get('token_count'),
                    'retry_count': generation_result.get('retry_count', 0)
                }
                db.commit()
                
                logger.info(f"Completed recipe generation job {job_id} -> recipe {recipe_id}")
                
        except Exception as e:
            logger.error(f"Recipe generation job {job_id} failed: {e}")
            with next(get_db()) as db:
                job = db.query(RecipeJob).filter(RecipeJob.id == job_id).first()
                if job:
                    job.status = "failed"
                    job.completed_at = func.now()
                    job.error_message = str(e)
                    job.progress = 100
                    db.commit()
        finally:
            # Clean up active job tracking
            if job_id in self.active_jobs:
                del self.active_jobs[job_id]
    
    async def _process_modification_job(self, job_id: str):
        """Process recipe modification in background"""
        try:
            with next(get_db()) as db:
                # Get job and user
                job = db.query(RecipeJob).filter(RecipeJob.id == job_id).first()
                if not job:
                    logger.error(f"Job {job_id} not found")
                    return
                
                user = db.query(User).filter(User.id == job.user_id).first()
                if not user:
                    logger.error(f"User {job.user_id} not found for job {job_id}")
                    return
                
                # Get original recipe
                original_recipe = db.query(Recipe).filter(Recipe.id == job.original_recipe_id).first()
                if not original_recipe:
                    raise ValueError(f"Original recipe {job.original_recipe_id} not found")
                
                original_ingredients = db.query(RecipeIngredient).filter(
                    RecipeIngredient.recipe_id == job.original_recipe_id
                ).all()
                
                # Update status to processing
                job.status = "processing"
                job.started_at = func.now()
                job.progress = 10
                db.commit()
                
                logger.info(f"Starting recipe modification for job {job_id}")
                
                # Update progress
                job.progress = 30
                db.commit()
                
                # Modify recipe using existing LLM service
                modification_result = await llm_service.modify_recipe_with_fallback(
                    original_recipe,
                    original_ingredients,
                    job.modification_prompt,
                    user,
                    job.preferences
                )
                
                # Update progress
                job.progress = 70
                db.commit()
                
                # Save modified recipe to database
                recipe_id = await self._save_recipe_to_database(
                    db, user, modification_result['recipe_data'], 
                    f"Modified: {job.modification_prompt}", modification_result
                )
                
                # Complete job
                job.status = "completed"
                job.completed_at = func.now()
                job.recipe_id = recipe_id
                job.progress = 100
                job.generation_metadata = {
                    'model': modification_result.get('model'),
                    'generation_time_ms': modification_result.get('generation_time_ms'),
                    'token_count': modification_result.get('token_count'),
                    'retry_count': modification_result.get('retry_count', 0),
                    'original_recipe_id': job.original_recipe_id
                }
                db.commit()
                
                logger.info(f"Completed recipe modification job {job_id} -> recipe {recipe_id}")
                
        except Exception as e:
            logger.error(f"Recipe modification job {job_id} failed: {e}")
            with next(get_db()) as db:
                job = db.query(RecipeJob).filter(RecipeJob.id == job_id).first()
                if job:
                    job.status = "failed"
                    job.completed_at = func.now()
                    job.error_message = str(e)
                    job.progress = 100
                    db.commit()
        finally:
            # Clean up active job tracking
            if job_id in self.active_jobs[job_id]:
                del self.active_jobs[job_id]
    
    async def _save_recipe_to_database(
        self, 
        db: Session, 
        user: User, 
        recipe_data: dict, 
        user_prompt: str,
        generation_metadata: dict
    ) -> int:
        """Save generated recipe to database (reused from existing router logic)"""
        try:
            # Create recipe record
            recipe = Recipe(
                title=recipe_data['recipe']['title'],
                description=recipe_data['recipe'].get('description', ''),
                instructions=recipe_data['recipe']['instructions'],
                prep_time=recipe_data['recipe'].get('prepTime'),
                cook_time=recipe_data['recipe'].get('cookTime'),
                servings=recipe_data['recipe'].get('servings', 4),
                difficulty=recipe_data['recipe'].get('difficulty', 'medium'),
                tips=recipe_data['recipe'].get('tips', []),
                original_prompt=user_prompt,
                created_by_id=user.id,
                generation_metadata={
                    'model': generation_metadata.get('model'),
                    'generation_time_ms': generation_metadata.get('generation_time_ms'),
                    'token_count': generation_metadata.get('token_count'),
                    'prompt_tokens': generation_metadata.get('prompt_tokens')
                }
            )
            
            db.add(recipe)
            db.flush()  # Get the ID without committing
            
            # Create ingredient records
            for ingredient_data in recipe_data['ingredients']:
                ingredient = RecipeIngredient(
                    recipe_id=recipe.id,
                    name=ingredient_data['name'],
                    amount=str(ingredient_data['amount']),
                    unit=ingredient_data.get('unit', ''),
                    category=ingredient_data.get('category', 'pantry')
                )
                db.add(ingredient)
            
            db.commit()
            
            logger.info(f"Recipe '{recipe.title}' saved to database with ID {recipe.id}")
            return recipe.id
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving recipe to database: {e}")
            raise ValueError(f"Failed to save recipe: {str(e)}")

# Global job service instance
job_service = RecipeJobService()