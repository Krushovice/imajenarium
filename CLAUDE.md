# Book Imaginarium — AI-платформа персонального книжного мира
## Язык общения - русский

## Суть проекта

Эмоционально-атмосферная AI-платформа для читателей. Не каталог книг — персональный цифровой литературный мир.
Рекомендации строятся по эмоциям/атмосфере/настроению, НЕ по жанрам.
Ключевая фича — **Literary DNA Profile**: живой интерактивный профиль читателя.

## Стек

### Frontend
- Next.js 15 + TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion (анимации обязательны: плавные, cinematic)
- Zustand (state), TanStack Query (data fetching), Zod (validation)

### Backend
- FastAPI + SQLAlchemy 2 + Pydantic v2
- PostgreSQL + pgvector (semantic search) + Redis
- Alembic (migrations), Poetry (deps)

### AI Architecture
**КРИТИЧНО**: Backend НЕ привязан к конкретному AI провайдеру.
Смена провайдера — только через ENV переменные, без изменения кода.

```
AI Tasks Layer → AI Provider Adapter → (OpenAI / Claude / Gemini / Mistral / OpenRouter / Ollama)
```

Абстракция через `BaseAIProvider(ABC)`: `chat`, `embeddings`, `summarize`, `analyze_emotions`.
Промпты хранятся в `prompts/` директории, НЕ в коде.
Failover: OpenAI → OpenRouter → Ollama.

MVP embeddings: sentence-transformers (all-MiniLM-L6-v2) локально.

### Infrastructure
- Docker + Docker Compose
- Traefik или Nginx
- GitHub Actions CI/CD
- Prometheus + Grafana + Sentry

### Telegram
- Mini App (авторизация, рекомендации, отметки, sharing)
- Bot (push уведомления, daily mood suggestions, reading streaks)

## ENV
```
AI_PROVIDER=openrouter
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
GOOGLE_API_KEY=
OPENROUTER_API_KEY=
OLLAMA_URL=http://localhost:11434
```

## БД (ключевые сущности)
`users`, `literary_dna` (metrics JSONB), `books` (с embeddings), `user_books` (status/rating/review/quotes), `reading_diary`, `friendships`, `recommendations`

## Визуальный стиль
**Neo Library** — теплый футуризм + уют цифровой библиотеки.
Цвета: warm amber, coffee brown, dark graphite, cream beige, muted gold.
Шрифты: Cormorant Garamond (заголовки), Inter (текст).
Анимации обязательны: glassmorphism, ambient particles, parallax, stagger animations.

## Архитектурные правила

### Backend
- Strict typing, clean architecture, repository pattern, service layer, dependency injection
- AI провайдеры вызываются ТОЛЬКО через Tasks Layer, не из бизнес-логики напрямую
- Async-first везде
- Тесты: pytest + async tests + integration tests

### Frontend
- Feature-based architecture, atomic UI components
- Mobile-first, touch-friendly (Telegram Mini App совместимость)
- Lazy loading, image optimization, skeleton loaders, streaming responses
- Тесты: Playwright + Vitest

## Чего НЕ делать
- Сухой каталог книг / клон Goodreads
- Жанровая система как основа рекомендаций
- Форумный / enterprise UX
- Привязка AI к одному провайдеру в коде
- Хранить промпты в коде

## Roadmap
- **MVP**: auth, profiles, Literary DNA, AI рекомендации, reading diary, Telegram Mini App, базовый social, news feed
- **Phase 2**: advanced AI, AI conversations, аналитика, подписки, AI reading journeys
- **Phase 3**: multilingual, publisher integrations, mobile apps, voice interactions
