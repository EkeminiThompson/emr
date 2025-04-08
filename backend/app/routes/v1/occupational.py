from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import OccupationalTherapyRecord, Patient
from app.schemas import OccupationalTherapyCreate, OccupationalTherapyUpdate, OccupationalTherapyOut, PatientSearchResponse
from app.database import get_db
from typing import List, Optional

router = APIRouter()

# 1. Search Patients: Search for patients by patient_id, surname, other_names, and hospital_reg_number
@router.get("/v1/patients/", response_model=PatientSearchResponse)
def search_patients(
    patient_id: Optional[str] = None,  # Optional patient_id search filter
    surname: Optional[str] = None,  # Optional surname search filter
    other_names: Optional[str] = None,  # Optional other_names search filter
    hospital_reg_number: Optional[str] = None,  # Optional hospital registration number filter
    page: int = 1, size: int = 50,  # Pagination parameters
    db: Session = Depends(get_db)
):
    query = db.query(Patient)

    # Filter the query based on the search parameters provided
    if patient_id:
        query = query.filter(Patient.patient_id.ilike(f"%{patient_id}%"))
    if surname:
        query = query.filter(Patient.surname.ilike(f"%{surname}%"))
    if other_names:
        query = query.filter(Patient.other_names.ilike(f"%{other_names}%"))
    if hospital_reg_number:
        query = query.filter(Patient.hospital_reg_number.ilike(f"%{hospital_reg_number}%"))

    total = query.count()
    patients = query.offset((page - 1) * size).limit(size).all()

    if not patients:
        raise HTTPException(status_code=404, detail="No patients found")

    return {
        "total_records": total,
        "page": page,
        "size": size,
        "patients": patients,
    }

# 2. Add Occupational Therapy Record: Create a new occupational therapy record for a patient
@router.post("/v1/patients/{patient_id}/occupationaltherapy", response_model=OccupationalTherapyOut)
def create_occupational_record(
    patient_id: str,
    occupational: OccupationalTherapyCreate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create a new occupational therapy record for the patient
    new_record = OccupationalTherapyRecord(
        patient_id=patient_id,
        long_term_goals=occupational.long_term_goals,
        short_term_goals=occupational.short_term_goals,
        adls_performance=occupational.adls_performance,
        cognitive_motor_skills=occupational.cognitive_motor_skills,
        therapy_sessions=occupational.therapy_sessions,
        assistive_devices=occupational.assistive_devices,
        improvements_observed=occupational.improvements_observed,
        barriers_to_progress=occupational.barriers_to_progress
    )
    try:
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record  # This will be serialized to OccupationalTherapyOut by the response model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 3. Get Occupational Therapy History: Retrieve all past occupational therapy records for a specific patient
@router.get("/v1/patients/{patient_id}/occupationaltherapy", response_model=List[OccupationalTherapyOut])
def get_occupational_therapy_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Retrieve all occupational therapy records associated with the patient
    records = db.query(OccupationalTherapyRecord).filter(OccupationalTherapyRecord.patient_id == patient_id).all()

    if not records:
        return []  # Return empty list instead of 404 for no records found

    return records

# 4. Update Occupational Therapy Record: Modify an existing occupational therapy record
@router.put("/v1/patients/{patient_id}/occupationaltherapy/{record_id}", response_model=OccupationalTherapyOut)
def update_occupational_record(
    patient_id: str,
    record_id: int,
    occupational: OccupationalTherapyUpdate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the occupational therapy record exists
    record = db.query(OccupationalTherapyRecord).filter(OccupationalTherapyRecord.id == record_id, OccupationalTherapyRecord.patient_id == patient_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Occupational therapy record not found")
    
    # Update the record with the new data
    for key, value in occupational.dict(exclude_unset=True).items():
        setattr(record, key, value)

    try:
        db.commit()
        db.refresh(record)
        return record  # This will be serialized to OccupationalTherapyOut by the response model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 5. Delete Occupational Therapy Record: Remove a specific occupational therapy record
@router.delete("/v1/patients/{patient_id}/occupationaltherapy/{record_id}", status_code=204)
def delete_occupational_record(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the occupational therapy record exists
    record = db.query(OccupationalTherapyRecord).filter(OccupationalTherapyRecord.id == record_id, OccupationalTherapyRecord.patient_id == patient_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Occupational therapy record not found")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Occupational therapy record deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
