import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./aromi.db"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_MODEL: str = "anthropic/claude-3-haiku"
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-small"
    RAG_RELEVANCE_THRESHOLD: float = 0.78
    CHROMA_PERSIST_DIR: Optional[str] = "./chroma_db"
    TTS_MODEL: str = "piper"                     # piper or indic
    WHISPER_MODEL: str = "base"                  # tiny / base / small
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "*"

    # ── Twilio (WhatsApp + Voice Alerts) ──────────────────────────────
    # Leave blank to disable alerts (app won't crash, just logs a warning)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    # Twilio WhatsApp sandbox number — keep the "whatsapp:" prefix
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    # Twilio verified caller number for voice calls (plain E.164 format)
    TWILIO_CALLER_NUMBER: str = "+19085944857 "
    # Alert target numbers (override in .env with real numbers)
    ALERT_PARENT_NUMBER: str = "+919999999999"
    ALERT_SUPERVISOR_NUMBER: str = "+919999999999"


settings = Settings()
