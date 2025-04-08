# backend/run.py

import uvicorn
import logging
from app.config import settings  # Import settings from config.py
from app import app  # Import the FastAPI instance

# Set up logging configuration
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

def main():
    """
    Entry point to start the FastAPI application with Uvicorn.
    """
    logging.info("Starting the FastAPI application...")

    # Run the Uvicorn server
    uvicorn.run(
        "app:app",  # Reference to the FastAPI app instance
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )

if __name__ == "__main__":
    main()
