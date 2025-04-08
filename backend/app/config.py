# backend/app/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_NAME: str
    SECRET_KEY: str
    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str

    # Optional: To specify where the .env file is
    class Config:
        env_file = ".env"  # Make sure the .env file is loaded
        env_file_encoding = "utf-8"
        extra = "allow"  

    # Construct PostgreSQL database URL
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    # Test database URL (Optional)
    #TEST_DATABASE_NAME: str = "test_db"

    @property
    def DATABASE_TEST_URL(self) -> str:
        return f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.TEST_DATABASE_NAME}"

    # JWT Authentication settings
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Server Configuration
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000

    # Logging Configuration
    LOG_LEVEL: str = "INFO"

# Instantiate the settings class
settings = Settings()
