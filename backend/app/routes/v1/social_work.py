from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import SocialWorkRecord, Patient
from app.schemas import SocialWorkCreate, SocialWorkUpdate, SocialWorkOut, PatientSearchResponse
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

# 2. Add Social Work Record: When a healthcare provider wants to record new social work information for a patient
@router.post("/v1/patients/{patient_id}/socialwork", response_model=SocialWorkOut)
def create_social_work_record(
    patient_id: str,
    social_work: SocialWorkCreate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create a new social work record for the patient
    new_record = SocialWorkRecord(
        patient_id=patient_id,
        housing_status=social_work.housing_status,
        employment_status=social_work.employment_status,
        family_support_system=social_work.family_support_system,
        counseling_sessions=social_work.counseling_sessions,
        financial_assistance=social_work.financial_assistance,
        referrals_to_agencies=social_work.referrals_to_agencies,
        support_groups=social_work.support_groups
    )
    try:
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record  # This will be serialized to SocialWorkOut by the response model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 3. Get Social Work History: Retrieve all past social work records for a specific patient
@router.get("/v1/patients/{patient_id}/socialwork", response_model=List[SocialWorkOut])
def get_social_work_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Retrieve all social work records associated with the patient
    records = db.query(SocialWorkRecord).filter(SocialWorkRecord.patient_id == patient_id).all()

    if not records:
        return []  # Return empty list instead of 404 for no records found

    return records

# 4. Update Social Work Record: Modify an existing social work record
@router.put("/v1/patients/{patient_id}/socialwork/{record_id}", response_model=SocialWorkOut)
def update_social_work_record(
    patient_id: str,
    record_id: int,
    social_work: SocialWorkUpdate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the social work record exists
    record = db.query(SocialWorkRecord).filter(SocialWorkRecord.id == record_id, SocialWorkRecord.patient_id == patient_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Social work record not found")
    
    # Update the record with the new data
    for key, value in social_work.dict(exclude_unset=True).items():
        setattr(record, key, value)

    try:
        db.commit()
        db.refresh(record)
        return record  # This will be serialized to SocialWorkOut by the response model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 5. Delete Social Work Record: Remove a specific social work record
@router.delete("/v1/patients/{patient_id}/socialwork/{record_id}", status_code=204)
def delete_social_work_record(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the social work record exists
    record = db.query(SocialWorkRecord).filter(SocialWorkRecord.id == record_id, SocialWorkRecord.patient_id == patient_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Social work record not found")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Social work record deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
