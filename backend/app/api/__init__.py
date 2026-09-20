from fastapi import APIRouter
from app.api.claims import router as claims_router
from app.api.evidence import router as evidence_router
from app.api.analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(claims_router, prefix="/claims", tags=["Claims"])
api_router.include_router(evidence_router, prefix="/evidence", tags=["Evidence"])
api_router.include_router(analysis_router, prefix="/analysis", tags=["ProofChain Analysis"])
