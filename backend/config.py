import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_FILE_PATH = os.path.join(BASE_DIR, 'expense_tracker.db').replace('\\', '/')

class Config:
    """Base configuration with sensible defaults."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-cloud-expense-tracker-secret-2025")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-cloud-expense-2025")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get("JWT_EXPIRY_HOURS", 24)))

    # Database configuration: defaults to local SQLite, or PostgreSQL/MySQL for AWS RDS
    database_url = os.environ.get("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = database_url or f"sqlite:///{DB_FILE_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    } if database_url and not database_url.startswith("sqlite") else {}

    # CORS configuration
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

class DevelopmentConfig(Config):
    DEBUG = True

from sqlalchemy.pool import StaticPool

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }

class ProductionConfig(Config):
    DEBUG = False
    # In production, require secure secrets
    SECRET_KEY = os.environ.get("SECRET_KEY", "prod-fallback-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "prod-jwt-fallback-change-me")

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}
