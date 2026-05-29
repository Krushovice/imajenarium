from fastapi import APIRouter

from app.api.v1.endpoints import auth, books, health, literary_dna, news_feed, reading_diary, recommendations, social, telegram

router = APIRouter(prefix="/api/v1")

router.include_router(health.router, tags=["health"])
router.include_router(auth.router)
router.include_router(literary_dna.router)
router.include_router(books.router)
router.include_router(recommendations.router)
router.include_router(reading_diary.router)
router.include_router(social.router)
router.include_router(news_feed.router)
router.include_router(telegram.router)
