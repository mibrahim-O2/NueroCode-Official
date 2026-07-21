from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ANTHROPIC_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_EXPIRE_MINUTES: int = 1440
    CHROMA_DB_PATH: str = "./chromadb"
    PISTON_API: str = "https://emkc.org/api/v2/piston"
    MODEL_NAME: str = "claude-sonnet-4-6"

    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    FIREBASE_SERVICE_ACCOUNT_PATH: str = "./firebase-service-account.json"
    ADMIN_EMAIL: str = "mibrahimkhalid306@gmail.com"

    # AI provider abstraction — "openai" for now, "anthropic" is a future drop-in
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"


settings = Settings()