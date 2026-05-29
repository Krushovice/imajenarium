from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Book Imaginarium API"
    app_version: str = "0.1.0"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Database — optionally override full URL (e.g. docker-compose sets DATABASE_URL with container hostname)
    database_url: str | None = None
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "bookshelf"
    postgres_user: str = "bookshelf"
    postgres_password: str = "bookshelf"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    def get_database_url(self, sync: bool = False) -> str:
        if self.database_url:
            url = self.database_url
            if sync:
                return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
            if not url.startswith("postgresql+asyncpg://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://")
            return url
        driver = "psycopg2" if sync else "asyncpg"
        return (
            f"postgresql+{driver}://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # Redis — optionally override full URL
    redis_url: str | None = None
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    def get_redis_url(self) -> str:
        if self.redis_url:
            return self.redis_url
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    # JWT
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # AI Provider
    ai_provider: Literal["openai", "anthropic", "openrouter", "mistral", "gemini", "ollama"] = "openrouter"
    ai_fallback_chain: list[str] = ["openai", "openrouter", "ollama"]

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-6"

    openrouter_api_key: str | None = None
    openrouter_model: str = "openai/gpt-4o-mini"

    mistral_api_key: str | None = None
    mistral_model: str = "mistral-small-latest"

    google_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    # Google OAuth
    google_client_id: str | None = None
    google_client_secret: str | None = None

    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # Local embeddings
    embedding_model_name: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Telegram
    telegram_bot_token: str | None = None
    telegram_webhook_url: str | None = None
    telegram_secret_token: str = "change-me-telegram-secret"
    telegram_mini_app_url: str | None = None
    telegram_link_token_ttl: int = 600  # 10 min

    # Scheduler timezone
    scheduler_timezone: str = "UTC"

    # Sentry
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.1
    sentry_profiles_sample_rate: float = 0.1


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
