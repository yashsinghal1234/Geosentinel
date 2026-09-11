from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    # MongoDB
    MONGODB_URI: str
    DATABASE_NAME: str = "geosentinel"

    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GATEWAY_API_KEY: str = "geosentinel_gw_secret_key"
    ALLOW_ANONYMOUS_INGEST: bool = True

    # Third-party APIs
    SMS_API_KEY: str = ""
    WEATHER_API_KEY: str = ""

    # Risk Thresholds
    RISK_THRESHOLD_ADVISORY: int = 40
    RISK_THRESHOLD_WARNING: int = 60
    RISK_THRESHOLD_CRITICAL: int = 80

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
