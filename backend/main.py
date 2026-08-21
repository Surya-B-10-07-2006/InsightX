import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from database import db_manager
from routers import auth, upload, ml, alerts
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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(ml.router)
app.include_router(alerts.router)

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
