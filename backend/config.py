import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 8000
    MONGODB_URL: str = "mongodb://localhost:27017/insightx"
    JWT_SECRET: str = "insightx_production_super_secret_jwt_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    GROQ_API_KEY: str = ""
    GROQ_MODEL_EXECUTIVE: str = "openai/gpt-oss-120b"
    GROQ_MODEL_LIGHTWEIGHT: str = "openai/gpt-oss-20b"
    GROQ_MAX_TOKENS: int = 4096

    # GitHub integration
    GITHUB_TOKEN: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    PBKDF2_SALT: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
