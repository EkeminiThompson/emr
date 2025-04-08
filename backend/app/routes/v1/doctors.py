from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import random  
import logging
from passlib.context import CryptContext  # ✅ Import password hashing

from app.models import Doctor, User
from app.schemas import DoctorCreate, DoctorUpdate, DoctorOut
from app.database import get_db

# FastAPI Router
router = APIRouter()

# Logger setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# **POST: Create a new doctor**
@router.post("/", response_model=DoctorOut)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    try:
        logger.info("Creating a new doctor.")

        # Auto-create a user
        new_user = User(
            username=f"doctor_{doctor.specialty.lower()}_{random.randint(1000,9999)}",
            full_name=f"Doctor {doctor.specialty}",
            password_hash=hash_password("defaultpassword"),  # ✅ Hash the password here
            email=None,  # Can be updated later
            role_id=2  # Assume 2 is for doctors
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create doctor linked to new user
        new_doctor = Doctor(
            user_id=new_user.id,
            specialty=doctor.specialty
        )
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)

        logger.info(f"Doctor created successfully with ID: {new_doctor.id}")
        return new_doctor

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating doctor: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# **GET: Retrieve a doctor by ID**
@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    try:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return doctor
    except Exception as e:
        logger.error(f"Error fetching doctor: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the doctor")


# **GET: Retrieve all doctors**
@router.get("/", response_model=List[DoctorOut])
def get_all_doctors(db: Session = Depends(get_db)):
    try:
        doctors = db.query(Doctor).all()
        return doctors
    except Exception as e:
        logger.error(f"Error fetching doctors: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching doctors")


# **PUT: Update doctor details**
@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, doctor: DoctorUpdate, db: Session = Depends(get_db)):
    try:
        db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not db_doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Update fields dynamically
        for key, value in doctor.dict(exclude_unset=True).items():
            setattr(db_doctor, key, value)

        db.commit()
        db.refresh(db_doctor)
        return db_doctor

    except Exception as e:
        db.rollback()
        logger.error(f"Error updating doctor: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while updating the doctor")


# **DELETE: Remove a doctor**
@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    try:
        db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not db_doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        db.delete(db_doctor)
        db.commit()
        return {"message": "Doctor deleted successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting doctor: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while deleting the doctor")
