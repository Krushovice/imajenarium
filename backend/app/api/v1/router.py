from fastapi import APIRouter

from app.api.v1.endpoints import auth, books, health, literary_dna, recommendations

router = APIRouter(prefix="/api/v1")

router.include_router(health.router, tags=["health"])
router.include_router(auth.router)
router.include_router(literary_dna.router)
router.include_router(books.router)
router.include_router(recommendations.router)
