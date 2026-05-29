from __future__ import annotations


def format_book_card(title: str, author: str, description: str | None = None, score: float | None = None) -> str:
    lines = [f"📖 <b>{title}</b>", f"✍️ {author}"]
    if score is not None:
        stars = round(score * 5)
        lines.append(f"{'⭐' * stars}{'☆' * (5 - stars)} ({score:.0%} совпадение)")
    if description:
        short = description[:200].rstrip()
        if len(description) > 200:
            short += "…"
        lines.append(f"\n{short}")
    return "\n".join(lines)


def format_share_card(title: str, author: str, rating: int | None = None) -> str:
    stars = "⭐" * (rating or 5)
    return (
        f"📚 <b>Book Imaginarium</b> — AI книжный мир\n\n"
        f"Я только что дочитал(а):\n"
        f"«{title}» — {author}\n\n"
        f"Моя оценка: {stars}\n\n"
        f"#BookImaginarium #reading"
    )


def format_reading_streak(days: int, name: str | None = None) -> str:
    greeting = f"Привет, {name}! " if name else ""
    return (
        f"🔥 {greeting}Читательская серия: <b>{days} {'день' if days == 1 else 'дней' if 2 <= days <= 4 else 'дней'}</b>!\n\n"
        "Не прерывайте серию — откройте книгу сегодня 📖"
    )


def format_daily_mood_prompt(name: str | None = None) -> str:
    greeting = f"Доброе утро, {name}!" if name else "Доброе утро!"
    return (
        f"☀️ {greeting}\n\n"
        "Как ваше настроение сегодня?\n"
        "Я подберу книгу специально для вас 📚"
    )


def format_recommendations_header(count: int) -> str:
    return f"🌟 <b>Рекомендации для вас</b> ({count} книг{'а' if count == 1 else 'и' if 2 <= count <= 4 else ''}):\n\n"


def format_no_account_warning() -> str:
    return (
        "⚠️ Для полных рекомендаций привяжите аккаунт Book Imaginarium.\n\n"
        "Используйте команду /link &lt;токен&gt;\n"
        "Токен получите в профиле на сайте."
    )
