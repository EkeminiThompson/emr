# backend/main.py

import uvicorn
import logging
from fastapi.middleware.cors import CORSMiddleware
from app import app  # Import the FastAPI instance
from app.config import settings  # Import settings from config.py

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows React frontend at this URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

if __name__ == "__main__":
    logging.info("Starting the FastAPI application...")
    uvicorn.run(
        "app.main:app",  # Reference to the FastAPI app instance (fixed the path)
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
