# Book Imaginarium — Checklist

Правило: 1 чат = 1 пункт. Выполнен — ставь [x].

---

## 0. Фундамент

- [ 
    
] **0.1** Структура директорий проекта (monorepo: `backend/`, `frontend/`, `prompts/`, `docker/`, `docs/`)
- [ ] **0.2** Git init, `.gitignore`, `.env.example`
- [ ] **0.3** Docker Compose: PostgreSQL + pgvector + Redis + базовый backend

---

## 1. Backend — основа

- [x] **1.1** FastAPI app skeleton: структура пакетов, config из ENV, Pydantic settings
- [x] **1.2** SQLAlchemy 2 base: async engine, session factory, base model
- [x] **1.3** Alembic setup: init, первая миграция (create tables)
- [x] **1.4** Модели БД: `users`, `literary_dna`, `books`, `user_books`, `reading_diary`, `friendships`, `recommendations`
- [x] **1.5** Repository layer: базовый CRUD репозиторий + репозитории под каждую сущность
- [x] **1.6** Dependency injection: DB session, current user, service locator

---

## 2. Auth

- [x] **2.1** JWT auth: access + refresh tokens, secure cookies
- [x] **2.2** Email + Password регистрация/вход
- [x] **2.3** Telegram Login Widget интеграция
- [x] **2.4** OAuth providers (Google минимум)
- [x] **2.5** Guest mode (анонимная сессия)
- [x] **2.6** Rate limiting + CSRF + XSS защита

---

## 3. AI Abstraction Layer

- [x] **3.1** `BaseAIProvider(ABC)`: интерфейс `chat`, `embeddings`, `summarize`, `analyze_emotions`
- [x] **3.2** Провайдеры: `OpenAIProvider`, `AnthropicProvider`, `OpenRouterProvider`, `OllamaProvider`
- [x] **3.3** Провайдеры: `MistralProvider`, `GeminiProvider`
- [x] **3.4** Failover система: OpenAI → OpenRouter → Ollama
- [x] **3.5** ENV-based провайдер selection (`AI_PROVIDER=`)
- [x] **3.6** Prompt Registry: загрузка промптов из `prompts/` директории
- [x] **3.7** AI Tasks Layer: `RecommendationAIService`, `LiteraryDNAService`, `ReviewAnalysisService`
- [x] **3.8** Local embeddings: sentence-transformers (all-MiniLM-L6-v2) + pgvector интеграция

---

## 4. Literary DNA

- [x] **4.1** Алгоритм формирования Literary DNA из данных пользователя
- [x] **4.2** API: получение, обновление DNA профиля
- [x] **4.3** AI-анализ рецензий → обновление DNA
- [x] **4.4** Эмоциональный onboarding: вопросы при регистрации → initial DNA

---

## 5. Книги

- [x] **5.1** Модель книги, seed данных (базовый каталог)
- [x] **5.2** Генерация embeddings для книг
- [x] **5.3** Semantic search через pgvector (cosine similarity)
- [x] **5.4** API: CRUD user_books (статус, оценка, рецензия, цитаты)

---

## 6. Система рекомендаций

- [x] **6.1** Рекомендации по Literary DNA (semantic similarity)
- [x] **6.2** Рекомендации по настроению/эмоциям
- [x] **6.3** Collaborative filtering (по похожим пользователям)
- [x] **6.4** AI анализ эмоциональных рецензий → рекомендации
- [x] **6.5** AI Prompt Recommendations ("хочу как X + Y, но депрессивнее")
- [x] **6.6** AI explanation: почему рекомендована книга

---

## 7. Читательский дневник

- [x] **7.1** API: CRUD записей дневника (текст, настроение, цитаты, эмоции)
- [x] **7.2** AI-анализ записей дневника → обновление DNA

---

## 8. Social

- [x] **8.1** Система друзей: запрос, подтверждение, список
- [x] **8.2** Literary Compatibility: AI вычисляет similarity score между пользователями
- [x] **8.3** Shared recommendations между друзьями
- [x] **8.4** Reading Journey: AI строит персональный путь чтения

---

## 9. News Feed

- [x] **9.1** RSS парсер: источники (издательства, литблоги, бестселлеры)
- [x] **9.2** AI summarization + emotional tagging новостей
- [x] **9.3** Персонализация ленты по Literary DNA

---

## 10. Frontend — основа

- [ ] **10.1** Next.js 15 setup: TypeScript, TailwindCSS, shadcn/ui, ESLint
- [ ] **10.2** Framer Motion setup, базовые анимационные утилиты
- [ ] **10.3** Zustand stores, TanStack Query setup, Zod schemas
- [ ] **10.4** Дизайн-система: цвета (amber/brown/graphite), шрифты (Cormorant + Inter), компоненты
- [ ] **10.5** Layout: Header, Footer, базовая навигация

---

## 11. Frontend — страницы

- [ ] **11.1** Landing Page: hero, DNA preview, AI showcase, onboarding, stats, CTA
- [ ] **11.2** Auth страницы: login, register + эмоциональный onboarding wizard
- [ ] **11.3** Profile: Literary DNA визуализация (radial chart + particles)
- [ ] **11.4** Profile: библиотека книг, reading diary, recommendations
- [ ] **11.5** Книжные карточки: обложка, emotional tags, why recommended, цитаты
- [ ] **11.6** Social: друзья, compatibility, shared books
- [ ] **11.7** News Feed страница
- [ ] **11.8** Search с AI Prompt ("хочу как...")

---

## 12. Telegram

- [ ] **12.1** Telegram Bot setup (aiogram/python-telegram-bot)
- [ ] **12.2** Mini App: авторизация, быстрые рекомендации, отметка прочитанного
- [ ] **12.3** Bot: push уведомления, daily mood suggestions, reading streaks, sharing cards

---

## 13. Infrastructure & DevOps

- [ ] **13.1** Docker Compose production: все сервисы + Traefik/Nginx
- [ ] **13.2** GitHub Actions CI/CD pipeline
- [ ] **13.3** Prometheus + Grafana мониторинг
- [ ] **13.4** Sentry error tracking (backend + frontend)

---

## 14. Тесты

- [ ] **14.1** Backend: pytest setup, async тесты, фикстуры
- [ ] **14.2** Backend: integration тесты (реальная БД, не моки)
- [ ] **14.3** Frontend: Vitest unit тесты
- [ ] **14.4** Frontend: Playwright e2e тесты (golden path)

---

## Статус

Текущий пункт: **10.1**
