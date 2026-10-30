import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from database import db_manager
from routers import auth, upload, ml
from routers import github, compliance, collaboration, provenance

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("InsightX.Main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing InsightX Backend Services & Database Engine...")
    await db_manager.initialize()
    
    # Validate Groq API configuration at startup
    if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5:
        try:
            from groq import Groq
            from services.llm_service import _get_groq_model
            client = Groq(api_key=settings.GROQ_API_KEY.strip())
            
            # Validate both executive and lightweight models
            executive_model = _get_groq_model(use_case="executive")
            lightweight_model = _get_groq_model(use_case="lightweight")
            
            # Test API connectivity with executive model (primary)
            test_response = client.chat.completions.create(
                messages=[{"role": "user", "content": "test"}],
                model=executive_model,
                max_tokens=1,
                timeout=5.0
            )
            logger.info(f"Groq API validation successful. Executive model: {executive_model}, Lightweight model: {lightweight_model}")
        except Exception as e:
            logger.error(f"Groq API validation failed: {e}. Executive decisions will fail without valid Groq configuration.")
    else:
        logger.warning("Groq API key not configured. Executive decisions will fail without valid Groq API key.")
    
    yield
    logger.info("InsightX Backend shut down cleanly.")

app = FastAPI(
    title="InsightX ML Platform API",
    description="Full-Stack Machine Learning & Predictive Analytics Engine for Project Health Risk Management",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(ml.router)
# New feature routers
app.include_router(github.router)
app.include_router(compliance.router)
app.include_router(collaboration.router)
app.include_router(provenance.router)

@app.get("/")
async def root():
    return {
        "platform": "InsightX Production ML Engine",
        "status": "ONLINE",
        "version": "2.0.0",
        "database_connected": db_manager.is_connected,
        "database_mode": "MongoDB" if db_manager.is_connected else "Local Persistence Store",
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", settings.PORT))
    logger.info(f"Starting InsightX FastAPI Uvicorn Server on http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
