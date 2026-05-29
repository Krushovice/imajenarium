from __future__ import annotations

from aiogram import Router

from app.telegram.handlers.auth import router as auth_router
from app.telegram.handlers.books import router as books_router
from app.telegram.handlers.start import router as start_router
from app.telegram.handlers.streaks import router as streaks_router

main_router = Router(name="main")
main_router.include_router(start_router)
main_router.include_router(auth_router)
main_router.include_router(books_router)
main_router.include_router(streaks_router)
