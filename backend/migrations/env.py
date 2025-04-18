from logging.config import fileConfig
from sqlalchemy import engine_from_config, create_engine
from sqlalchemy import pool
from alembic import context
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Import the Base object and metadata from your models file
from app.models import Base

# Get the database URL from environment variables
def get_database_url():
    # Check if we're using the test database (when running tests)
    if os.environ.get('TESTING'):
        return os.environ.get('DATABASE_TEST_URL', '')
    
    # Default to the production database URL
    return os.environ.get('DATABASE_URL', '')

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target_metadata to your Base's metadata
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_database_url() or config.get_main_option("sqlalchemy.url")
    
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # Enable type comparison
        compare_server_default=True  # Enable server default comparison
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    db_url = get_database_url()
    
    if db_url:
        # Use the URL from environment variables
        connectable = create_engine(
            db_url,
            poolclass=pool.NullPool,
            connect_args={
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5
            }
        )
    else:
        # Fall back to alembic.ini configuration
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
