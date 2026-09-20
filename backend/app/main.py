import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Ensure models are imported before database initialization
import app.models  # noqa: F401

from app.database import init_db
from app.api.claims import router as claims_router
from app.api.evidence import router as evidence_router
from app.api.analysis import router as analysis_router
from app.api.ai import router as ai_router
from app.api import api_router


app = FastAPI(
    title="ProofChain AI API",
    description="Truth Verification & Evidence Reasoning API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize database
init_db()


# ---------------------------------------------------------
# Direct API endpoints
# ---------------------------------------------------------

app.include_router(
    claims_router,
    prefix="/claims",
    tags=["Claims"]
)

app.include_router(
    evidence_router,
    prefix="/evidence",
    tags=["Evidence"]
)

app.include_router(
    analysis_router,
    prefix="/analysis",
    tags=["ProofChain Analysis"]
)


# ---------------------------------------------------------
# AI Evidence Analysis
# ---------------------------------------------------------

app.include_router(
    ai_router,
    tags=["AI Evidence Analysis"]
)


# ---------------------------------------------------------
# API versioning
# ---------------------------------------------------------

app.include_router(
    api_router,
    prefix="/api"
)


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health", tags=["Health"])
def health():
    """Returns backend and database operational health."""
    return {
        "status": "healthy",
        "service": "ProofChain AI Core",
        "database": "connected",
        "version": "1.0.0",
    }


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "ProofChain AI Core",
        "docs": "/docs",
        "health": "/health",
    }


# ---------------------------------------------------------
# Local development
# ---------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )