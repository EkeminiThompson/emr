import uvicorn
import logging
from fastapi.middleware.cors import CORSMiddleware
from app import app  # Import the FastAPI instance
from app.config import settings  # Import settings from config.py
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine

# Load environment variables from the .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://emr-5esm.vercel.app"],  # Allows React frontend on Vercel
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Set up the database connection
DATABASE_URL = os.getenv("DATABASE_URL")  # Get the connection string from the environment
if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL)
        logging.info("Database connection successful.")
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
else:
    logging.error("Database URL is not set in the environment variables.")

if __name__ == "__main__":
    logging.info("Starting the FastAPI application...")
    uvicorn.run(
        "app.main:app",  # Reference to the FastAPI app instance
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
