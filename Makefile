COMPOSE_BASE = docker compose -f docker-compose.yml
COMPOSE_DEV  = $(COMPOSE_BASE) -f docker-compose.dev.yml

.PHONY: dev dev-build dev-down dev-restart setup migrate seed seed-embed \
        logs logs-backend logs-frontend shell-backend shell-db status clean

# ── Dev lifecycle ─────────────────────────────────────────────────────────────

dev:
	$(COMPOSE_DEV) up

dev-build:
	$(COMPOSE_DEV) up --build

dev-down:
	$(COMPOSE_DEV) down

dev-restart:
	$(COMPOSE_DEV) restart backend frontend

# ── First-time setup (migrations + seed) ─────────────────────────────────────

setup: migrate seed
	@echo "Dev environment ready. Open http://localhost:3000"

migrate:
	$(COMPOSE_DEV) exec backend alembic upgrade head

seed:
	$(COMPOSE_DEV) exec backend python -m scripts.seed_books

seed-embed:
	$(COMPOSE_DEV) exec backend python -m scripts.seed_books --embed

# ── Logs ─────────────────────────────────────────────────────────────────────

logs:
	$(COMPOSE_DEV) logs -f backend frontend

logs-backend:
	$(COMPOSE_DEV) logs -f backend

logs-frontend:
	$(COMPOSE_DEV) logs -f frontend

# ── Shells ───────────────────────────────────────────────────────────────────

shell-backend:
	$(COMPOSE_DEV) exec backend bash

shell-db:
	$(COMPOSE_DEV) exec postgres psql -U $${POSTGRES_USER:-bookshelf} -d $${POSTGRES_DB:-bookshelf}

# ── Status ───────────────────────────────────────────────────────────────────

status:
	$(COMPOSE_DEV) ps

# ── Production ────────────────────────────────────────────────────────────────

prod-build:
	docker compose build

prod-up:
	docker compose up -d

prod-down:
	docker compose down

prod-migrate:
	docker compose exec backend alembic upgrade head

# ── Cleanup ──────────────────────────────────────────────────────────────────

clean:
	$(COMPOSE_DEV) down -v --remove-orphans
