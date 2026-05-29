FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.8.3 \
    && poetry config virtualenvs.create false \
    && poetry config warnings.export false

COPY pyproject.toml poetry.lock* ./

# Sync lock with pyproject.toml without upgrading existing packages
RUN poetry lock --no-update --no-interaction

# ── production ────────────────────────────────────────────────────────────────
FROM base AS production

RUN poetry install --only main --no-interaction --no-ansi --no-root

COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

# ── development ───────────────────────────────────────────────────────────────
FROM base AS development

RUN poetry install --no-interaction --no-ansi --no-root

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
