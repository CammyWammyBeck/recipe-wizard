from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

from .schemas.base import HealthResponse, StatusResponse, ErrorResponse
import json
from .database import init_database, check_database_connection
from .routers import auth, users, recipes
from .services.llm_service import check_llm_service_status

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Recipe Wizard API",
    description="A powerful API for generating personalized recipes and grocery lists using local LLM",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for mobile app
origins = [
    "http://localhost:3000",  # React web development
    "http://127.0.0.1:3000",
    "exp://localhost:19000",  # Expo development
    "exp://127.0.0.1:19000",
    "http://localhost:19006",  # Expo web
    "capacitor://localhost",   # Capacitor apps
    "ionic://localhost",       # Ionic apps
    "http://localhost",        # General localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(recipes.router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    error_response = ErrorResponse(
        error="Internal Server Error",
        detail=str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An unexpected error occurred",
        error_code="INTERNAL_ERROR"
    )
    # Use custom encoder to handle datetime serialization
    content = json.loads(json.dumps(error_response.model_dump(), cls=DateTimeEncoder))
    return JSONResponse(
        status_code=500,
        content=content
    )

# Custom JSON encoder for datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP exception on {request.url}: {exc.status_code} - {exc.detail}")
    error_response = ErrorResponse(
        error=f"HTTP {exc.status_code}",
        detail=exc.detail,
        error_code=f"HTTP_{exc.status_code}"
    )
    # Use custom encoder to handle datetime serialization
    content = json.loads(json.dumps(error_response.model_dump(), cls=DateTimeEncoder))
    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify API is running"""
    return HealthResponse(
        status="healthy",
        service="Recipe Wizard API",
        version="1.0.0",
        environment=os.getenv("DEBUG", "false")
    )

# Status endpoint with more detailed information
@app.get("/api/status", response_model=StatusResponse)
async def api_status():
    """Detailed API status including service dependencies"""
    # Check database connection
    db_status = "connected" if check_database_connection() else "disconnected"
    
    # Check LLM service status
    llm_status = await check_llm_service_status()
    
    services = {
        "api": "running",
        "database": db_status,
        "llm_service": llm_status["status"],
        "llm_details": {
            "service": llm_status["service"],
            "base_url": llm_status.get("base_url"),
            "default_model": llm_status.get("default_model"),
            "available_models": llm_status.get("available_models", [])
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Determine overall status
    critical_services = [db_status]
    overall_status = "operational" if all(s == "connected" for s in critical_services) else "degraded"
    
    # Add warning if LLM is down but continue operating with fallback
    if llm_status["status"] != "connected":
        overall_status = "degraded"
    
    try:
        return StatusResponse(
            status=overall_status,
            services=services,
            message="Recipe Wizard API is running" + (" (LLM fallback mode)" if llm_status["status"] != "connected" else ""),
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Recipe Wizard API",
        "docs": "/docs",
        "health": "/health",
        "status": "/api/status"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Recipe Wizard API starting up...")
    logger.info(f"Environment: {os.getenv('DEBUG', 'production')}")
    
    # Initialize database
    try:
        init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Don't fail startup, but log the error
    
    logger.info("API is ready to serve requests")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Recipe Wizard API shutting down...")