from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import logging

from app.models import Base, create_default_roles
from app.create_admin import create_admin_user

# Import all v1 routes
from .routes.v1 import (
    patients, appointments, billing, clinical, mental_health, pharmacy, drug,
    laboratory, occupational, nurses, social_work, notifications, export, doctors, admin, audit_logs
)

# Import all v2 routes
from .routes.v2 import (
    patients as patients_v2, appointments as appointments_v2, billing as billing_v2
)

# Import all services
from .services.dashboard_service import DashboardService
from .services.report_service import ReportService
from .services.notification_service import NotificationService
from .services.audit_logger import AuditLogger

# Setup logger
logger = logging.getLogger("uvicorn.error")

# Define the database URL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres.zphcvrojjhwfulflnbig:postgres20206@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Create the engine with production-ready settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"sslmode": "disable"},
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize the FastAPI app
app = FastAPI(title="Renewal Ridge EMR API", version="1.0.0")

# Dependency to get the database session
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize Services with database session injection
def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db=db)

def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(db=db)

def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db=db)

# Include the v1 routers
app.include_router(patients.router, prefix="/v1/patients", tags=["patients"])
app.include_router(appointments.router, prefix="/v1/appointments", tags=["appointments"])
app.include_router(billing.router, prefix="/v1/billing", tags=["billing"])
app.include_router(clinical.router, prefix="/v1/clinical", tags=["clinical"])
app.include_router(mental_health.router, prefix="/v1/mental-health", tags=["mental_health"])
app.include_router(pharmacy.router, prefix="/v1/pharmacy", tags=["pharmacy"])
app.include_router(laboratory.router, prefix="/v1/laboratory", tags=["laboratory"])
app.include_router(occupational.router, prefix="/v1/occupational", tags=["occupational"])
app.include_router(nurses.router, prefix="/v1/nurses", tags=["nurses"])
app.include_router(social_work.router, prefix="/v1/social-work", tags=["social_work"])
app.include_router(notifications.router, prefix="/v1/notifications", tags=["notifications"])
app.include_router(export.router, prefix="/v1/export", tags=["export"])
app.include_router(doctors.router, prefix="/v1/doctors", tags=["doctors"])
app.include_router(admin.router, prefix="/v1/admin", tags=["admin"])
app.include_router(drug.router, prefix="/v1/drug", tags=["drug"])
app.include_router(audit_logs.router, prefix="/v1/audit", tags=["audit"])

# Include the v2 routers
app.include_router(patients_v2.router, prefix="/v2/patients", tags=["patients"])
app.include_router(appointments_v2.router, prefix="/v2/appointments", tags=["appointments"])
app.include_router(billing_v2.router, prefix="/v2/billing", tags=["billing"])

# Ensure that all tables are created on startup
Base.metadata.create_all(bind=engine)

# Startup event to create default roles and admin user
@app.on_event("startup")
async def startup():
    db = SessionLocal()
    try:
        # Create default roles
        create_default_roles(db)

        # Create admin user, now passing db
        create_admin_user(db)

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize default roles or admin user")
    finally:
        db.close()

# Shutdown event for cleanup
@app.on_event("shutdown")
async def shutdown():
    # Future shutdown logic can go here
    pass
