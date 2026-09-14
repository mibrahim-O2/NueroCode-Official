from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_EXPIRE_MINUTES: int = 1440
    CHROMA_DB_PATH: str = "./chromadb"
    PISTON_API: str = "http://localhost:2000/api/v2"

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

    # --- Demo Mode -----------------------------------------------------------
    # OWNER_EMAIL is the ONE account allowed to see or use Demo Mode — the
    # project owner. NeuroCode is a solo FYP, so this is simply my own login
    # email. It deliberately has no usable default: an empty value means
    # nobody is the owner, and demo_routes refuses every /demo/* request
    # until it is set. The real value must only ever come from .env — it is
    # never written into code.
    OWNER_EMAIL: str = ""
    # DEMO_MODE_PASSCODE is the second gate, entered once per browser session
    # before Demo Mode can be switched on (same UX as PROVIDER_SWITCH_PASSCODE).
    # Also no usable default: demo_routes treats an empty passcode as "not
    # configured" and never verifies it, so an unconfigured install can't be
    # unlocked by submitting an empty string.
    DEMO_MODE_PASSCODE: str = ""

    INTERVIEW_DURATION_SECONDS: int = 1800
    REVIEW_DUE_DAYS: int = 7

    # Assessment scoring/timing overrides. Default to production values —
    # real thresholds, real 45-minute timer.
    INTEGRITY_PASS_THRESHOLD: float = 60
    ASSESSMENT_DURATION_SECONDS: int = 2700  # 45 minutes


settings = Settings()