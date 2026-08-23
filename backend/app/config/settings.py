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

    # AI provider abstraction. "gemini" is now the default — free, and the
    # provider being actively evaluated. OpenAI remains fully wired and
    # reachable per-request via provider_override (admin-only, see
    # provider_access.py); Claude is UI-visible only until a future phase
    # adds a working claude_provider.py.
    AI_PROVIDER: str = "gemini"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Gates the admin-only real-provider-switch UI flow. Change this from
    # the placeholder before any real evaluation/demo.
    PROVIDER_SWITCH_PASSCODE: str = "neurocode-dev-passcode"

    # Development/testing-only overrides. All default to production values —
    # TEST_MODE=false, real thresholds, real 45-minute timer — so the app
    # behaves identically to before unless these are explicitly set.
    TEST_MODE: bool = False
    INTEGRITY_PASS_THRESHOLD: float = 60
    ASSESSMENT_DURATION_SECONDS: int = 2700  # 45 minutes


settings = Settings()