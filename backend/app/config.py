from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./aromi.db"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_MODEL: str = "anthropic/claude-3-haiku"
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    TTS_MODEL: str = "piper"                     # piper or indic
    WHISPER_MODEL: str = "base"                  # tiny / base / small
    ENVIRONMENT: str = "development"

    # ── Twilio (WhatsApp + Voice Alerts) ──────────────────────────────
    # Leave blank to disable alerts (app won't crash, just logs a warning)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    # Twilio WhatsApp sandbox number — keep the "whatsapp:" prefix
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    # Twilio verified caller number for voice calls (plain E.164 format)
    TWILIO_CALLER_NUMBER: str = ""
    # Alert target numbers (override in .env with real numbers)
    ALERT_PARENT_NUMBER: str = "+919876543210"
    ALERT_SUPERVISOR_NUMBER: str = "+919999999999"

    class Config:
        env_file = ".env"


settings = Settings()
