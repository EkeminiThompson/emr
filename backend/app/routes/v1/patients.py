from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List
from app.models import Patient, AuditLog, User
from app.schemas import PatientCreate, PatientUpdate, PatientOut
from app.database import get_db
from app.services.dashboard_service import DashboardService  # Import the DashboardService
import logging
from pydantic import ValidationError
from fastapi import HTTPException  # Import HTTPException
from app.routes.v1.admin import get_current_user 

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

# Custom Response for successful patient creation
class PatientCreationResponse(PatientOut):
    success_message: str
    patient_id: str
    hospital_reg_number: str

# PatientCreation
@router.post("/", response_model=PatientCreationResponse)
def create_patient(
    patient: PatientCreate, 
    request: Request,  # Moved request before default arguments
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Add current user dependency
):
    try:
        logger.info(f"Creating new patient entry. User: {current_user.username}")
        
        # Attempt to create a new patient from the provided data
        new_patient = Patient(**patient.dict())
        
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        # Generate audit log for successful creation
        audit_log = AuditLog(
            action="patient_created",
            user_id=current_user.id,
            description=f"Created patient {new_patient.surname} {new_patient.other_names} (ID: {new_patient.patient_id})",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        patient_id = new_patient.patient_id
        hospital_reg_number = new_patient.hospital_reg_number
        
        logger.info(f"Patient created successfully with ID: {new_patient.id} by user {current_user.username}")
        
        success_message = (
            f"Patient created successfully! Your Patient ID is {patient_id}, "
            f"and your Hospital Registration Number is {hospital_reg_number}."
        )

        patient_dict = {key: value for key, value in vars(new_patient).items() if not key.startswith('_')}
        
        return PatientCreationResponse(
            success_message=success_message,
            patient_id=patient_id,
            hospital_reg_number=hospital_reg_number,
            **{key: value for key, value in patient_dict.items() if key not in ['patient_id', 'hospital_reg_number']}
        )

    except ValidationError as e:
        # Log failed attempt with validation error
        audit_log = AuditLog(
            action="patient_creation_failed",
            user_id=current_user.id if current_user else None,
            description=f"Validation error while creating patient: {str(e.errors())}",
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Validation error while creating patient: {e.errors()}")
        raise HTTPException(
            status_code=422,
            detail=f"Validation error: {e.errors()}"
        )

    except Exception as e:
        db.rollback()
        
        # Log system error during creation
        audit_log = AuditLog(
            action="patient_creation_error",
            user_id=current_user.id if current_user else None,
            description=f"System error while creating patient: {str(e)}",
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Error registering patient: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while registering the patient: {str(e)}"
        )

# GET: Retrieve a patient by patient_id
@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching the patient.")

# GET: Retrieve all patients
@router.get("/", response_model=List[PatientOut])
def get_all_patients(db: Session = Depends(get_db)):
    try:
        patients = db.query(Patient).all()
        return patients
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching patients.")

# PUT: Update an existing patient's details
@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: str, patient: PatientUpdate, db: Session = Depends(get_db)):
    try:
        db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not db_patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        for key, value in patient.dict(exclude_unset=True).items():
            setattr(db_patient, key, value)

        db.commit()
        db.refresh(db_patient)
        return db_patient
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while updating the patient.")

# DELETE: Delete a patient by patient_id
@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    try:
        db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not db_patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        db.delete(db_patient)
        db.commit()
        return {"message": "Patient deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while deleting the patient.")

# GET: Retrieve a patient's dashboard data
@router.get("/{patient_id}/dashboard")
def get_patient_dashboard(patient_id: str, db: Session = Depends(get_db)):
    try:
        # Initialize DashboardService and fetch the data
        dashboard_service = DashboardService(db)
        patient_dashboard_data = dashboard_service.get_patient_dashboard_data(patient_id)

        # Check if there's an error in the data and raise HTTPException if needed
        if "error" in patient_dashboard_data:
            raise HTTPException(status_code=404, detail=patient_dashboard_data["error"])
        
        # Return the dashboard data if everything is fine
        return patient_dashboard_data

    except Exception as e:
        # Log the exception with more details
        logger.error(f"Error while fetching dashboard data for patient {patient_id}: {e}", exc_info=True)
        
        # Raise HTTPException with a more specific message
        raise HTTPException(status_code=500, detail="An error occurred while fetching the patient dashboard data.")
