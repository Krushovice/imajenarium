# PROJECT_SPEC.md

# Book Imaginarium — AI-платформа персонального книжного мира

## Концепция проекта

Book Imaginarium — это AI-платформа нового поколения для любителей литературы, построенная вокруг эмоций, атмосферы и персонального литературного профиля пользователя.

Главная идея:

Пользователь не выбирает жанры.
Пользователь делится эмоциями, ощущениями и впечатлениями.

Система анализирует:
- прочитанные книги;
- оценки;
- рецензии;
- эмоциональные реакции;
- предпочтения;
- активность;
- взаимодействие с другими пользователями.

После чего формирует:
- Literary DNA Profile;
- персональные рекомендации;
- эмоциональные подборки;
- совместимость с другими читателями;
- AI-путешествия по литературе.

Проект должен выглядеть как:
- современная цифровая библиотека;
- футуристичный литературный клуб;
- уютный AI-сервис с атмосферой premium-продукта.

---

# Главные принципы проекта

## НЕ делать

- сухой каталог книг;
- клон Goodreads;
- перегруженную жанрами систему;
- устаревший форумный UX;
- тяжелый enterprise-интерфейс.

## Делать

- эмоциональный UX;
- персонализацию;
- атмосферу;
- ощущение «AI понимает меня»;
- красивую подачу рекомендаций;
- живой литературный профиль.

---

# Визуальный стиль

## Стиль

Neo Library.

Теплый футуризм + уют цифровой библиотеки.

## Основные ассоциации

- теплое дерево;
- мягкий янтарный свет;
- стеклянные панели;
- интерактивные карточки;
- плавные анимации;
- AI-библиотека будущего.

---

# Цветовая палитра

## Основные цвета

- warm amber
- coffee brown
- dark graphite
- cream beige
- muted gold
- soft orange highlights

## Атмосфера

- теплые тона;
- мягкие свечения;
- отсутствие кислотных цветов;
- высокая читаемость.

---

# Шрифты

## Заголовки

Cormorant Garamond

Fallback:
- Playfair Display

## Основной текст

Inter

Fallback:
- Manrope

---

# Основные разделы платформы

## 1. Landing Page

### Содержимое

- hero section;
- animated literary DNA preview;
- AI recommendations showcase;
- emotional onboarding;
- showcase of social features;
- animated statistics;
- CTA registration.

### Визуальные элементы

- floating particles;
- subtle gradients;
- animated cards;
- glowing effects;
- cinematic transitions.

---

## 2. Авторизация и регистрация

## Методы входа

- Telegram Login;
- Email + Password;
- OAuth providers;
- Guest mode.

## При регистрации

Система должна:

- задавать эмоциональные вопросы;
- спрашивать любимые книги;
- спрашивать любимые миры и вайб;
- узнавать настроение чтения;
- формировать initial Literary DNA.

---

# Literary DNA System

## Главная фишка проекта

Каждый пользователь получает живой литературный профиль.

## Параметры профиля

Примеры:

- melancholic;
- philosophical;
- dark;
- atmospheric;
- hopeful;
- chaotic;
- political;
- epic;
- cozy;
- slowburn;
- emotional;
- intellectual;
- mystical;
- realistic;
- tragic;
- romantic;
- brutal;
- introspective.

---

# Визуализация Literary DNA

## Требования

Не обычные progress bars.

Нужно:
- интерактивная анимированная визуализация;
- radial chart;
- particle animation;
- smooth transitions;
- hover interactions;
- live updates.

## Визуальный эффект

Профиль должен выглядеть как:
- цифровая карта личности;
- эмоциональный AI-анализ;
- sci-fi dashboard.

---

# Профиль пользователя

## Разделы

### 1. Literary DNA

Интерактивный профиль.

### 2. Прочитанные книги

Список:
- статус;
- оценка;
- дата;
- рецензия;
- favorite moments.

### 3. Читательский дневник

Возможности:
- записи;
- цитаты;
- мысли;
- заметки;
- эмоции после чтения.

### 4. AI рекомендации

Персональные подборки.

### 5. Друзья

- совместимость;
- рекомендации;
- shared books.

### 6. Reading Journey

AI строит путь чтения.

---

# Система рекомендаций

## Основа

Рекомендации строятся НЕ по жанрам.

Основа:
- эмоции;
- атмосфера;
- настроение;
- темп;
- вайб;
- эмоциональный след.

---

# Типы рекомендаций

## 1. По настроению

Примеры:
- melancholy;
- dark academia;
- existential;
- escapism;
- comfort reading;
- post-cyberpunk depression;
- emotional recovery.

---

## 2. По Literary DNA

AI анализирует профиль.

---

## 3. По похожим пользователям

Collaborative filtering.

---

## 4. По эмоциональным рецензиям

AI анализирует текст рецензий.

---

## 5. AI Prompt Recommendations

Пример:

"Хочу что-то как Ведьмак + Дюна, но более депрессивное"

Система должна:
- понять смысл;
- найти похожие книги;
- красиво объяснить рекомендации.

---

# AI Architecture

## Важнейшее требование

Backend НЕ должен зависеть от конкретного AI API.

Нельзя привязывать архитектуру:
- только к OpenAI;
- только к Claude;
- только к Gemini.

Смена AI provider должна происходить:
- через ENV;
- без изменения backend-кода.

---

# AI Provider Abstraction Layer

## Архитектура

```text
Frontend
    ↓
Recommendation Service
    ↓
AI Tasks Layer
    ↓
AI Provider Adapter
    ↓
(OpenAI / Claude / Gemini / Mistral / OpenRouter / Ollama)
```

---

# Base AI Interface

```python
class BaseAIProvider(ABC):
    async def chat(...)
    async def embeddings(...)
    async def summarize(...)
    async def analyze_emotions(...)
```

---

# Providers Structure

```text
providers/
├── openai_provider.py
├── anthropic_provider.py
├── mistral_provider.py
├── gemini_provider.py
├── openrouter_provider.py
└── ollama_provider.py
```

---

# ENV Configuration

```env
AI_PROVIDER=openrouter

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
GOOGLE_API_KEY=
OPENROUTER_API_KEY=

OLLAMA_URL=http://localhost:11434
```

---

# AI Tasks Layer

## Запрещено

Нельзя вызывать provider напрямую из бизнес-логики.

## Нужно

```python
class RecommendationAIService:
    async def generate_book_match_reason(...)

class LiteraryDNAService:
    async def analyze_user_profile(...)

class ReviewAnalysisService:
    async def extract_emotions(...)
```

---

# Failover System

## Требование

Если provider недоступен:

```text
OpenAI unavailable
↓
fallback to OpenRouter
↓
fallback to Ollama
```

---

# AI Modes

## MVP

### Embeddings

Локально:
- sentence-transformers;
- all-MiniLM-L6-v2.

### Semantic Search

- pgvector;
- cosine similarity.

### Text Generation

- OpenRouter.

### Local Development

- Ollama.

---

# Prompt Registry

## Требование

Промпты нельзя хранить по коду.

```text
prompts/
├── recommendation/
├── literary_dna/
├── review_analysis/
├── onboarding/
└── social_matching/
```

---

# Frontend Stack

## Основной стек

- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- Zustand
- TanStack Query
- Zod

---

# Backend Stack

## Основной стек

- FastAPI
- SQLAlchemy 2
- PostgreSQL
- Redis
- pgvector
- Alembic
- Pydantic v2
- Poetry

---

# Infrastructure

## Контейнеризация

- Docker
- Docker Compose

## Reverse Proxy

- Traefik или Nginx

## CI/CD

- GitHub Actions

## Monitoring

- Prometheus
- Grafana
- Sentry

---

# Database Structure

## Основные сущности

### users

- id
- username
- email
- avatar
- created_at

### literary_dna

- user_id
- metrics JSONB
- updated_at

### books

- id
- title
- author
- description
- metadata
- embeddings

### user_books

- user_id
- book_id
- status
- rating
- review
- favorite_quotes

### reading_diary

- user_id
- content
- mood
- created_at

### friendships

- sender_id
- receiver_id
- status

### recommendations

- user_id
- book_id
- reason
- confidence_score

---

# Telegram Mini App

## Возможности

- авторизация;
- быстрые рекомендации;
- отметка прочитанного;
- уведомления;
- AI suggestions;
- sharing cards.

---

# Telegram Bot

## Возможности

- push recommendations;
- reading reminders;
- daily mood suggestions;
- friend recommendations;
- literary news;
- reading streaks.

---

# Social Features

## Система друзей

### Возможности

- добавление друзей;
- shared recommendations;
- literary compatibility;
- recommendation exchange.

---

# Literary Compatibility

## AI вычисляет

- similarity score;
- shared emotional preferences;
- overlap in reading;
- emotional resonance.

---

# News System

## Раздел новостей

### Источники

- RSS feeds;
- издательства;
- literary blogs;
- bestseller reviews.

### Категории

- новости;
- статьи;
- рецензии;
- подборки.

---

# AI News Processing

## Возможности

- summarization;
- emotional tagging;
- recommendation relevance.

---

# Анимации

## Требования

Анимации должны быть:
- плавными;
- мягкими;
- дорогими визуально;
- cinematic-like.

## Использовать

- Framer Motion;
- stagger animations;
- parallax;
- glassmorphism;
- ambient particles.

---

# UI Requirements

## Структура

### Header

- logo;
- navigation;
- search;
- profile menu.

### Footer

- links;
- social;
- legal;
- newsletter.

---

# Mobile First

## Обязательное требование

Сайт должен:
- идеально работать на мобильных;
- быть адаптирован под Telegram Mini App;
- иметь touch-friendly UI.

---

# Performance Requirements

## Требования

- lazy loading;
- image optimization;
- caching;
- streaming responses;
- skeleton loaders.

---

# Security

## Реализовать

- JWT auth;
- refresh tokens;
- rate limiting;
- CSRF protection;
- XSS protection;
- secure cookies.

---

# Recommendation Engine

## Архитектура

Hybrid recommendation system:

- semantic similarity;
- collaborative filtering;
- AI explanation layer;
- emotional analysis.

---

# Book Cards

## Карточки книг должны содержать

- обложку;
- атмосферу;
- emotional tags;
- why recommended;
- similar feelings;
- quotes.

Карточки должны выглядеть как:
- музыкальные альбомы;
- cinematic posters.

---

# Gamification

## Реализовать

- reading streaks;
- evolving Literary DNA;
- milestones;
- emotional achievements.

---

# Roadmap

# MVP

## Включает

- auth;
- profiles;
- Literary DNA;
- AI recommendations;
- reading diary;
- Telegram Mini App;
- social system basic;
- news feed.

---

# Phase 2

## Добавить

- advanced AI;
- AI conversations;
- deeper analytics;
- subscriptions;
- AI reading journeys.

---

# Phase 3

## Масштабирование

- multilingual support;
- publisher integrations;
- mobile apps;
- AI reading companion;
- voice interactions.

---

# Архитектурные требования

## Backend должен быть:

- scalable;
- async-first;
- modular;
- provider-agnostic;
- production-ready.

---

# Coding Standards

## Backend

- strict typing;
- clean architecture;
- repository pattern;
- service layer;
- dependency injection.

## Frontend

- feature-based architecture;
- reusable UI;
- atomic principles.

---

# Testing

## Backend

- pytest;
- async tests;
- integration tests.

## Frontend

- Playwright;
- Vitest.

---

# Итоговое ощущение продукта

Пользователь должен ощущать:

- будто платформа понимает его литературную личность;
- будто рекомендации собраны специально под него;
- будто это персональный AI-библиотекарь;
- будто профиль живет и развивается.

Проект должен вызывать:
- уют;
- эмоциональную вовлеченность;
- желание возвращаться.

Главная цель:

Создать не каталог книг.

Создать персональный цифровой литературный мир пользователя.

