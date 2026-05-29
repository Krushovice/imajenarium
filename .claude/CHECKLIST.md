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

- [x] **10.1** Next.js 15 setup: TypeScript, TailwindCSS, shadcn/ui, ESLint
- [x] **10.2** Framer Motion setup, базовые анимационные утилиты
- [x] **10.3** Zustand stores, TanStack Query setup, Zod schemas
- [x] **10.4** Дизайн-система: цвета (amber/brown/graphite), шрифты (Cormorant + Inter), компоненты
- [x] **10.5** Layout: Header, Footer, базовая навигация

---

## 11. Frontend — страницы

- [ ] **11.0** Созвездие-книга (BookConstellation) — интегрировать в hero section главной страницы
  - **Референс**: `ChatGPT Image 16 мая 2026 г., 16_07_11.png` в корне проекта
  - **Геометрия LOCKED**: не переосмыслять силуэт. Результат должен моментально читаться как "раскрытая книга из звёзд обложкой от пользователя"
  - НЕ должно выглядеть как: корона, кристалл, лотос, щит, ромб, цветок, руна, геометрический логотип
  - Обязательные элементы: вертикальный центральный корешок; две симметричные полустраницы; горизонтальное направление разворота; узнаваемый силуэт книги без эффектов
  - Реализация: SVG с hardcoded координатами, линии ТОЛЬКО между predef-узлами, координаты вручную
  - Можно менять: цвета, свечение, анимации, стиль рендера, толщину линий, прозрачность
  - **Диагноз текущей проблемы**: внешние линии (контур книги) и внутренние (fold-линии) рендерятся с одинаковой яркостью → форма читается как корона. Решение: outer edges = 75%+ opacity, inner fold edges = 20-25% opacity чтобы контур книги доминировал
  - Файл компонента: `frontend/src/components/design-system/book-constellation.tsx`
- [x] **11.1** Landing Page: hero, DNA preview, AI showcase, onboarding, stats, CTA
- [x] **11.2** Auth страницы: login, register + эмоциональный onboarding wizard
- [x] **11.3** Profile: Literary DNA визуализация (radial chart + particles)
- [x] **11.4** Profile: библиотека книг, reading diary, recommendations
- [x] **11.5** Книжные карточки: обложка, emotional tags, why recommended, цитаты
- [x] **11.6** Social: друзья, compatibility, shared books
- [x] **11.7** News Feed страница
- [x] **11.8** Search с AI Prompt ("хочу как...")

---

## 12. Telegram

- [x] **12.1** Telegram Bot setup (aiogram/python-telegram-bot)
- [x] **12.2** Mini App: авторизация, быстрые рекомендации, отметка прочитанного
- [x] **12.3** Bot: push уведомления, daily mood suggestions, reading streaks, sharing cards

---

## 13. Infrastructure & DevOps

- [x] **13.1** Docker Compose production: все сервисы + Nginx
- [x] **13.2** GitHub Actions CI/CD pipeline
- [x] **13.3** Prometheus + Grafana мониторинг
- [x] **13.4** Sentry error tracking (backend + frontend)

---

## 14. Тесты

- [x] **14.1** Backend: pytest setup, async тесты, фикстуры
- [x] **14.2** Backend: integration тесты (реальная БД, не моки) — 49/49 passed
- [x] **14.3** Frontend: Vitest unit тесты — 116/116 passed (utils, animations, 3 schemas, 3 stores, 3 components)
- [x] **14.4** Frontend: Playwright e2e тесты (golden path) — 47/47 passed (landing, auth, onboarding, discover, navigation)

---

---

## 15. Ручное QA — бизнес-логика от А до Я

Цель: пройти весь пользовательский путь руками, убедиться что каждая фича работает end-to-end в связке backend + frontend + AI + DB.

### 15.1 Подготовка стенда
- [ ] Запустить `docker compose up` (postgres, pgvector, redis, backend, frontend, nginx)
- [ ] Убедиться что все контейнеры `healthy`: `docker compose ps`
- [ ] Выполнить миграции: `alembic upgrade head`
- [ ] Загрузить seed данные (книги + embeddings)
- [ ] Проверить `.env` — все ключи присутствуют (AI, Telegram, OAuth, Sentry)
- [ ] Открыть Grafana + Prometheus — убедиться что метрики собираются

### 15.2 Auth

> **Перед тестированием** (пункты помечены ⚠️ заблокированы без этого):
> - ⚠️ **Telegram**: задать `NEXT_PUBLIC_TELEGRAM_BOT_NAME=<bot_username>` в `.env`, добавить в `docker-compose.yml` build args и `frontend/Dockerfile` ARG/ENV
> - ⚠️ **Google OAuth**: задать `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в `.env`
> - Остальные пункты готовы к тестированию прямо сейчас

- [ ] **Email регистрация**: создать аккаунт → получить JWT → сессия работает
- [ ] **Email вход**: повторный логин → токены обновляются
- [ ] **Refresh token**: дождаться expiry access token → автоматический refresh без logout
- [ ] **Telegram Login Widget**: авторизация через Telegram → профиль создан ⚠️ *требует `NEXT_PUBLIC_TELEGRAM_BOT_NAME` в .env + docker-compose + Dockerfile*
- [ ] **Google OAuth**: авторизация через Google → профиль создан/связан ⚠️ *требует `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` в .env*
- [ ] **Guest mode**: анонимная сессия → DNA сохраняется в localStorage/cookie
- [ ] **Rate limiting**: 6 неверных паролей подряд → 429 Too Many Requests
- [ ] **Logout**: токены инвалидированы → повторный запрос с тем же токеном → 401

### 15.3 Эмоциональный онбординг → Literary DNA
- [ ] Пройти онбординг-визард (5–7 вопросов по настроению/атмосфере)
- [ ] Убедиться что `literary_dna` запись создана в БД с заполненными metrics JSONB
- [ ] Профиль отображает radial chart с начальными DNA-метриками
- [ ] DNA меняется после добавления первой книги с оценкой

### 15.4 Каталог книг
- [ ] Отобразить список книг → карточки с обложкой, emotional tags, рейтингом
- [ ] **Semantic search**: запрос "меланхоличный Петербург" → релевантные книги (не keyword match)
- [ ] **AI Prompt search**: "хочу как Достоевский, но в космосе" → осмысленные результаты
- [ ] Открыть книгу → страница с описанием, why recommended, цитаты друзей
- [ ] Добавить книгу в статус "reading" → появляется в библиотеке профиля
- [ ] Сменить статус → "read" → добавить оценку + рецензию → DNA обновилась

### 15.5 Рекомендации
- [ ] **По Literary DNA**: `/recommendations/for-me` → книги соответствуют профилю
- [ ] **По настроению**: выбрать эмоцию "тревожно" → рекомендации изменились
- [ ] **Collaborative filtering**: два аккаунта с похожими книгами → пересечение в рекомендациях
- [ ] **AI объяснение**: у каждой рекомендации есть "почему эта книга" — осмысленный текст от AI
- [ ] **AI Prompt**: отправить произвольный запрос → AI возвращает 3–5 книг с объяснением

### 15.6 Читательский дневник
- [ ] Создать запись дневника (текст + настроение + цитата)
- [ ] Убедиться что AI проанализировал запись → DNA обновилась (emotion weights изменились)
- [ ] Редактировать запись → сохраняется
- [ ] Удалить запись → исчезает из списка, DNA пересчитывается

### 15.7 Social
- [ ] **Запрос в друзья**: аккаунт A отправляет запрос аккаунту B
- [ ] **Принятие**: аккаунт B принимает → дружба активна в обе стороны
- [ ] **Literary Compatibility**: открыть страницу друга → AI вычислил score (0–100) с объяснением
- [ ] **Shared recommendations**: книги которые нравятся другу + подходят мне → отдельный список
- [ ] **Reading Journey**: AI строит персональный путь чтения (3–5 книг с обоснованием порядка)
- [ ] Отклонить запрос / удалить друга → из списка исчез

### 15.8 News Feed
- [ ] RSS парсер подтянул новости (проверить в БД таблицу news)
- [ ] AI summarization: у каждой новости есть краткое резюме + emotional tags
- [ ] Лента персонализирована: пользователь с "классика" DNA видит иные новости чем "sci-fi" DNA
- [ ] Отметить новость как прочитанную → пропадает из feed / перемещается в архив

### 15.9 Telegram
- [ ] **Bot**: `/start` → бот отвечает, присылает кнопку открыть Mini App
- [ ] **Mini App**: открывается в Telegram → авторизация через Telegram Login → профиль отображается
- [ ] **Быстрые рекомендации**: кнопка в Mini App → список книг приходит
- [ ] **Отметить прочитанное**: через Mini App → статус книги обновился в основном сервисе
- [ ] **Push уведомления**: триггер (новая рекомендация) → бот прислал сообщение пользователю
- [ ] **Daily mood suggestion**: бот присылает утреннее предложение
- [ ] **Reading streaks**: streak счётчик инкрементируется при ежедневной активности
- [ ] **Sharing card**: поделиться книгой → бот генерирует красивую карточку в чат

### 15.10 Мониторинг и ошибки
- [ ] Открыть Grafana → дашборды показывают: latency, RPS, error rate, DB connections
- [ ] Умышленно вызвать ошибку 500 (неверный запрос) → Sentry поймал, событие видно
- [ ] AI провайдер недоступен → failover срабатывает → запрос дошёл через резервный провайдер
- [ ] Перезапустить Redis → backend не падает, деградирует gracefully (кэш miss, но работает)

### 15.11 Edge cases
- [ ] Пустая библиотека → рекомендации показывают "default" набор, не пустой экран
- [ ] Пользователь без друзей → social страница с призывом добавить, не ломается
- [ ] Очень длинная рецензия (5000+ символов) → сохраняется, AI анализирует без таймаута
- [ ] Параллельные запросы (5 вкладок) → нет race conditions в DNA update
- [ ] Невалидный JWT → все защищённые endpoints возвращают 401, не 500

---

## **⚠️ КРИТИЧНО: Правильная логика AI-онбординга и Literary DNA**

> **Текущее состояние**: профиль и онбординг — захардкоженный mock, никакого AI-вызова нет. Это нужно переделать с нуля.

### Как должно работать:

**Онбординг (после регистрации):**
- [x] AI ведёт диалог: задаёт уточняющие вопросы по настроению/атмосфере/книгам — НЕ статичная форма
- [x] Минимум 5–7 вопросов, каждый следующий зависит от предыдущего ответа (conversational AI)
- [x] AI анализирует ответы → формирует начальный Literary DNA (metrics JSONB в БД)
- [x] Настроение "прямо сейчас" влияет **только** на текущую рекомендацию, **НЕ** на DNA-профиль (mood → localStorage, не в answers payload)
- [x] После онбординга → реальный POST `/api/v1/literary-dna/onboarding` → запись в БД

**Literary DNA — принципы:**
- [x] DNA строится из: книг пользователя + рецензий + дневника — НЕ из текущего настроения
- [x] DNA — живой профиль: обновляется после каждой добавленной книги/рецензии/записи дневника
- [x] Профиль показывает РЕАЛЬНЫЕ данные из БД, нулевые значения при старте — ок

**Рекомендации:**
- [x] AI рекомендует книги на основе DNA-профиля из БД + текущего настроения (отдельный параметр)
- [x] Книги НЕ добавляются автоматически в библиотеку пользователя — только рекомендуются

**Username при регистрации:**
- [x] Добавить поле `username` в форму регистрации (уникальное, латиница)
- [x] Валидация пароля: только латиница (a-z, A-Z), цифры и спецсимволы — кириллица запрещена

---

## 16. Production Build

Цель: собрать проект для реального деплоя. Всё должно работать без `NODE_ENV=development`, с оптимизированными образами, правильными секретами и работающими health checks.

### 16.1 Окружение и секреты
- [ ] Создать `.env.production` на основе `.env.example` — заполнить ВСЕ переменные
- [ ] Убедиться что `SECRET_KEY` (JWT) — сильный рандомный ключ (не дефолтный)
- [ ] `DATABASE_URL` указывает на production БД (не localhost)
- [ ] `REDIS_URL` указывает на production Redis
- [ ] `SENTRY_DSN` заполнен для backend и frontend
- [ ] `TELEGRAM_BOT_TOKEN` — production бот (не тестовый)
- [ ] AI ключи присутствуют (`OPENROUTER_API_KEY` минимум)
- [ ] `CORS_ORIGINS` содержит только реальные домены, не `*`
- [ ] `DEBUG=false`, `LOG_LEVEL=WARNING` для backend

### 16.2 Backend Docker образ
- [ ] Собрать образ: `docker build -t bookshelf-backend:prod ./backend`
- [ ] Убедиться что образ не содержит dev-зависимостей (`--no-dev` в Poetry)
- [ ] Размер образа разумный (< 500MB) — проверить `docker image ls`
- [ ] Проверить что образ запускается: `docker run --env-file .env.production bookshelf-backend:prod`
- [ ] Health endpoint отвечает: `GET /health` → `{"status": "ok"}`
- [ ] Gunicorn/Uvicorn workers настроены (не 1 worker)

### 16.3 Frontend production build
- [ ] `npm run build` в `frontend/` — завершается без ошибок
- [ ] `npm run build` — нет TypeScript ошибок, нет ESLint errors
- [ ] Bundle size проверить: `next build` output показывает размеры страниц
- [ ] Крупные chunks (> 500KB) — проанализировать, split если нужно
- [ ] `NEXT_PUBLIC_API_URL` указывает на production backend URL
- [ ] Собрать Docker образ frontend: `docker build -t bookshelf-frontend:prod ./frontend`
- [ ] Запустить production образ локально → `http://localhost:3000` открывается

### 16.4 Docker Compose production stack
- [ ] Использовать `docker-compose.yml` (production конфиг, не dev)
- [ ] Все сервисы запущены: `docker compose up -d --build`
- [ ] `docker compose ps` — все контейнеры `Up (healthy)` 
- [ ] Nginx проксирует корректно: `/api/*` → backend, `/` → frontend
- [ ] SSL сертификат настроен (Let's Encrypt / self-signed для стейджинга)
- [ ] HTTP → HTTPS редирект работает

### 16.5 БД в production
- [ ] Миграции применены: `docker compose exec backend alembic upgrade head`
- [ ] Убедиться что `alembic history` показывает все миграции applied
- [ ] Seed данные загружены (книги + базовые embeddings)
- [ ] pgvector extension создан в production БД: `CREATE EXTENSION IF NOT EXISTS vector`
- [ ] Backup strategy настроена: pg_dump cron job или managed backup

### 16.6 Smoke test production стека
- [ ] `GET /health` → 200 OK
- [ ] `POST /api/v1/auth/register` → 201 Created
- [ ] `POST /api/v1/auth/login` → 200 + JWT
- [ ] `GET /api/v1/books` (с JWT) → 200 + список книг
- [ ] `GET /api/v1/recommendations/for-me` → 200 + список
- [ ] Frontend главная страница загружается < 3 секунд (LCP)
- [ ] Нет CORS ошибок в browser console
- [ ] Нет 500 ошибок в Sentry за первые 10 минут работы

### 16.7 Performance и безопасность
- [ ] Запустить `lighthouse` на главной странице → Performance ≥ 80
- [ ] Заголовки безопасности: `X-Frame-Options`, `Content-Security-Policy`, `HSTS` присутствуют
- [ ] `docker scout` или `trivy` — нет критических CVE в образах
- [ ] Проверить что `.env` файл НЕ попал в Docker образ: `docker run --rm bookshelf-backend:prod ls /app/.env` → не найден
- [ ] Rate limiting работает в production (не только в dev)
- [ ] DB connection pool не исчерпывается под нагрузкой (проверить Grafana)

### 16.8 CI/CD финальная проверка
- [ ] GitHub Actions pipeline прошёл зелёным на main ветке
- [ ] Pipeline включает: lint → type-check → unit tests → integration tests → build → push image
- [ ] Docker образы запушены в registry (GHCR или DockerHub)
- [ ] Deploy job деплоит на staging автоматически после merge в main
- [ ] Rollback процедура задокументирована (предыдущий image tag известен)

---

## Статус

Текущий пункт: **14.4** (Playwright e2e тесты)
