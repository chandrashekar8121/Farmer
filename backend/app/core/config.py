import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Krishi Saathi Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "krishi-saathi-production-super-secret-key-elderly-farmer-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./krishi_saathi.db")

    # Supabase (Optional direct integration if provided)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # Weather API (OpenWeather)
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    # Allowed CORS Origins (comma-separated string or list)
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://krishi-saathi.vercel.app"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # File upload configurations
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".pdf", ".png", ".jpg", ".jpeg"]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
