from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Configuration
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_NAME: str
    
    # Secret Key and SMTP Configuration
    SECRET_KEY: str
    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str

    # Supabase Settings
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Optional: To specify where the .env file is
    class Config:
        env_file = ".env"  # Ensure the .env file is loaded
        env_file_encoding = "utf-8"
        extra = "allow"  # Allow extra fields in the environment file (for future changes)

    # Construct PostgreSQL database URL dynamically
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    # Optional: Test database URL
    @property
    def DATABASE_TEST_URL(self) -> str:
        return f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}_test"

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
