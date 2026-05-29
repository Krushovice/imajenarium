from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)
    return _scheduler


async def _job_daily_mood_prompts() -> None:
    """Send daily mood prompt to all telegram-connected users."""
    from app.core.database import AsyncSessionFactory
    from app.telegram.bot import get_bot
    from app.telegram.notifications import NotificationService
    from sqlalchemy import select
    from app.models.users import User

    logger.info("Running daily mood prompts job")
    try:
        bot = get_bot()
        svc = NotificationService(bot)
        async with AsyncSessionFactory() as db:
            result = await db.execute(
                select(User.telegram_id, User.display_name, User.username)
                .where(User.telegram_id.is_not(None), User.is_active.is_(True))
            )
            users = result.all()

        sent = 0
        for tg_id, display_name, username in users:
            name = display_name or username
            ok = await svc.send_daily_mood_prompt(tg_id, name=name)
            if ok:
                sent += 1
        logger.info("Daily mood prompts sent: %d/%d", sent, len(users))
    except Exception:
        logger.exception("daily_mood_prompts job failed")


async def _job_reading_streak_reminders() -> None:
    """Send reading streak reminder to users with active streaks."""
    from datetime import date, timedelta, timezone
    from datetime import datetime as dt

    from sqlalchemy import func, select

    from app.core.database import AsyncSessionFactory
    from app.models.reading_diary import DiaryEntry
    from app.models.users import User
    from app.telegram.bot import get_bot
    from app.telegram.notifications import NotificationService

    logger.info("Running reading streak reminders job")
    try:
        bot = get_bot()
        svc = NotificationService(bot)

        async with AsyncSessionFactory() as db:
            result = await db.execute(
                select(User).where(User.telegram_id.is_not(None), User.is_active.is_(True))
            )
            users = list(result.scalars().all())

            today = date.today()
            yesterday = today - timedelta(days=1)
            start = dt.combine(yesterday, dt.min.time()).replace(tzinfo=timezone.utc)
            end = dt.combine(today, dt.min.time()).replace(tzinfo=timezone.utc)

            sent = 0
            for user in users:
                # check if user had activity yesterday
                cnt_result = await db.execute(
                    select(func.count()).where(
                        DiaryEntry.user_id == user.id,
                        DiaryEntry.created_at >= start,
                        DiaryEntry.created_at < end,
                    )
                )
                count = cnt_result.scalar_one()
                if count == 0:
                    continue

                # compute streak
                streak = 0
                check_date = yesterday
                for _ in range(365):
                    s = dt.combine(check_date, dt.min.time()).replace(tzinfo=timezone.utc)
                    e = dt.combine(check_date + timedelta(days=1), dt.min.time()).replace(tzinfo=timezone.utc)
                    r = await db.execute(
                        select(func.count()).where(
                            DiaryEntry.user_id == user.id,
                            DiaryEntry.created_at >= s,
                            DiaryEntry.created_at < e,
                        )
                    )
                    if r.scalar_one() == 0:
                        break
                    streak += 1
                    check_date -= timedelta(days=1)

                if streak >= 3:
                    name = user.display_name or user.username
                    ok = await svc.send_reading_streak(user.telegram_id, days=streak, name=name)
                    if ok:
                        sent += 1

        logger.info("Streak reminders sent: %d", sent)
    except Exception:
        logger.exception("reading_streak_reminders job failed")


def start_scheduler() -> AsyncIOScheduler:
    scheduler = get_scheduler()
    if scheduler.running:
        return scheduler

    # Daily mood prompt at 09:00 UTC
    scheduler.add_job(
        _job_daily_mood_prompts,
        trigger=CronTrigger(hour=9, minute=0),
        id="daily_mood_prompts",
        replace_existing=True,
        misfire_grace_time=600,
    )

    # Reading streak reminder at 20:00 UTC
    scheduler.add_job(
        _job_reading_streak_reminders,
        trigger=CronTrigger(hour=20, minute=0),
        id="reading_streak_reminders",
        replace_existing=True,
        misfire_grace_time=600,
    )

    scheduler.start()
    logger.info("APScheduler started with %d jobs", len(scheduler.get_jobs()))
    return scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    _scheduler = None
