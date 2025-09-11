from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_limiter.depends import RateLimiter
import os
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..database import get_db
from ..models import User, Recipe, RecipeIngredient, RecipeJob
from ..schemas.job import (
    RecipeJobCreate, RecipeModificationJobCreate, RecipeJobCreateResponse,
    RecipeJobStatus, RecipeJobResult, RecipeJobError
)
from ..schemas.recipe import RecipeAPI, IngredientAPI
from ..utils.auth import get_current_user
from ..services.job_service import job_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/jobs", tags=["async-jobs"])

# Rate limiting configuration (less restrictive for job creation)
_ENABLE_RATE_LIMIT = os.getenv("ENABLE_RATE_LIMIT", "true").lower() == "true" and bool(os.getenv("REDIS_URL"))
_RATE_LIMIT_TIMES = int(os.getenv("RATE_LIMIT_TIMES", "10"))  # More generous for async jobs
_RATE_LIMIT_SECONDS = int(os.getenv("RATE_LIMIT_SECONDS", "60"))
_job_deps = [Depends(RateLimiter(times=_RATE_LIMIT_TIMES, seconds=_RATE_LIMIT_SECONDS))] if _ENABLE_RATE_LIMIT else None

@router.post("/recipes/generate", response_model=RecipeJobCreateResponse, dependencies=_job_deps)
async def create_recipe_generation_job(
    request: RecipeJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create an async recipe generation job.
    
    Returns immediately with job ID and status URL for polling.
    Client should poll the status endpoint until completion.
    """
    try:
        logger.info(f"Creating recipe generation job for user {current_user.email} with prompt: {request.prompt[:100]}...")
        
        # Create background job
        job_id = await job_service.create_generation_job(
            user=current_user,
            prompt=request.prompt,
            preferences=request.preferences
        )
        
        return RecipeJobCreateResponse(
            job_id=job_id,
            status="pending",
            message="Recipe generation started. Use the status URL to check progress.",
            estimated_completion="2-3 minutes",
            status_url=f"/api/jobs/recipes/{job_id}/status",
            polling_interval=3
        )
        
    except Exception as e:
        logger.error(f"Failed to create recipe generation job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start recipe generation: {str(e)}"
        )

@router.post("/recipes/modify", response_model=RecipeJobCreateResponse, dependencies=_job_deps)
async def create_recipe_modification_job(
    request: RecipeModificationJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create an async recipe modification job.
    
    Returns immediately with job ID and status URL for polling.
    """
    try:
        # Convert recipeId from string to int for database lookup
        try:
            recipe_id = int(request.recipe_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recipe ID format"
            )
        
        logger.info(f"Creating recipe modification job for user {current_user.email}, recipe {recipe_id}")
        
        # Verify recipe exists and user owns it
        original_recipe = db.query(Recipe).filter(
            Recipe.id == recipe_id,
            Recipe.created_by_id == current_user.id
        ).first()
        
        if not original_recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found or you don't have permission to modify it"
            )
        
        # Create background job
        job_id = await job_service.create_modification_job(
            user=current_user,
            original_recipe_id=recipe_id,
            modification_prompt=request.modification_prompt,
            preferences=request.preferences
        )
        
        return RecipeJobCreateResponse(
            job_id=job_id,
            status="pending",
            message="Recipe modification started. Use the status URL to check progress.",
            estimated_completion="2-3 minutes",
            status_url=f"/api/jobs/recipes/{job_id}/status",
            polling_interval=3
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create recipe modification job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start recipe modification: {str(e)}"
        )

@router.get("/recipes/{job_id}/status", response_model=RecipeJobStatus)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current status of a recipe generation or modification job.
    
    Clients should poll this endpoint every 3-5 seconds until status is 'completed' or 'failed'.
    """
    try:
        # Get job from database
        job = db.query(RecipeJob).filter(
            RecipeJob.id == job_id,
            RecipeJob.user_id == current_user.id  # Ensure user owns the job
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or you don't have permission to view it"
            )
        
        return RecipeJobStatus(
            id=job.id,
            status=job.status,
            job_type=job.job_type,
            prompt=job.prompt if job.job_type == "generate" else job.modification_prompt,
            progress=job.progress,
            recipe_id=str(job.recipe_id) if job.recipe_id else None,
            error_message=job.error_message,
            created_at=job.created_at.isoformat() if job.created_at else None,
            started_at=job.started_at.isoformat() if job.started_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            estimated_completion=job._estimate_completion()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status for {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job status"
        )

@router.get("/recipes/{job_id}/result", response_model=RecipeJobResult)
async def get_job_result(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the complete result of a completed recipe generation or modification job.
    
    Only call this endpoint after the job status is 'completed'.
    Returns the full recipe data in the same format as the original sync endpoints.
    """
    try:
        # Get job from database
        job = db.query(RecipeJob).filter(
            RecipeJob.id == job_id,
            RecipeJob.user_id == current_user.id  # Ensure user owns the job
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or you don't have permission to view it"
            )
        
        if job.status != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job is not completed yet. Current status: {job.status}"
            )
        
        if not job.recipe_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Job completed but no recipe was created"
            )
        
        # Get the generated recipe
        recipe = db.query(Recipe).filter(Recipe.id == job.recipe_id).first()
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Generated recipe not found in database"
            )
        
        # Get ingredients
        ingredients = db.query(RecipeIngredient).filter(
            RecipeIngredient.recipe_id == job.recipe_id
        ).all()
        
        # Format response
        recipe_api = RecipeAPI(
            title=recipe.title,
            description=recipe.description,
            instructions=recipe.instructions,
            prepTime=recipe.prep_time,
            cookTime=recipe.cook_time,
            servings=recipe.servings,
            difficulty=recipe.difficulty,
            tips=recipe.tips
        )
        
        ingredients_api = [
            IngredientAPI(
                id=str(ing.id),
                name=ing.name,
                amount=ing.amount,
                unit=ing.unit,
                category=ing.category
            )
            for ing in ingredients
        ]
        
        return RecipeJobResult(
            job_id=job.id,
            status=job.status,
            recipe_id=str(job.recipe_id),
            recipe=recipe_api.model_dump(),
            ingredients=[ing.model_dump() for ing in ingredients_api],
            generated_at=job.completed_at.isoformat() if job.completed_at else job.created_at.isoformat(),
            user_prompt=job.prompt if job.job_type == "generate" else job.modification_prompt,
            generation_metadata=job.generation_metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job result for {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job result"
        )

@router.delete("/recipes/{job_id}")
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a pending or processing job.
    
    Note: Jobs that are already processing may not be cancelled immediately.
    """
    try:
        # Get job from database
        job = db.query(RecipeJob).filter(
            RecipeJob.id == job_id,
            RecipeJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or you don't have permission to cancel it"
            )
        
        if job.status in ["completed", "failed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel job with status: {job.status}"
            )
        
        # Cancel the background task if it exists
        if job_id in job_service.active_jobs:
            task = job_service.active_jobs[job_id]
            task.cancel()
            del job_service.active_jobs[job_id]
        
        # Update job status
        job.status = "cancelled"
        job.completed_at = job.func.now()
        job.error_message = "Job cancelled by user"
        db.commit()
        
        logger.info(f"Cancelled job {job_id} for user {current_user.email}")
        
        return {
            "success": True,
            "message": "Job cancelled successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel job"
        )