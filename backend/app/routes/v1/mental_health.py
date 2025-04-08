from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import MentalHealthNote, Patient
from app.schemas import MentalHealthCreate, MentalHealthUpdate, MentalHealthOut, PatientSearchResponse
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

# 2. Add Mental Health Record: When a healthcare provider wants to record new mental health information for a patient
@router.post("/v1/patients/{patient_id}/mentalhealth", response_model=MentalHealthOut)
def create_mental_health_note(
    patient_id: str,
    mental_health: MentalHealthCreate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create a new mental health record for the patient
    new_note = MentalHealthNote(
        patient_id=patient_id,
        present_complaints=mental_health.present_complaints,
        history_of_present_illness=mental_health.history_of_present_illness,
        past_psychiatric_history=mental_health.past_psychiatric_history,
        past_medical_history=mental_health.past_medical_history,
        drug_history=mental_health.drug_history,
        family_history=mental_health.family_history,
        prenatal=mental_health.prenatal,
        delivery_and_postnatal=mental_health.delivery_and_postnatal,
        childhood_history=mental_health.childhood_history,
        late_childhood_and_adolescence=mental_health.late_childhood_and_adolescence,
        educational_history=mental_health.educational_history,
        psychosexual_history=mental_health.psychosexual_history,
        emotional_and_physical_postures=mental_health.emotional_and_physical_postures,
        marital_history=mental_health.marital_history,
        occupational_history=mental_health.occupational_history,
        military_service=mental_health.military_service,
        forensic_history=mental_health.forensic_history,
        premorbid_personality=mental_health.premorbid_personality,
        mental_state_examination=mental_health.mental_state_examination,
        physical_examination=mental_health.physical_examination,
        pan_score=mental_health.pan_score,
        bprs_score=mental_health.bprs_score,
        zung_depression_score=mental_health.zung_depression_score,
        zung_anxiety_score=mental_health.zung_anxiety_score,
        diagnostic_formulation=mental_health.diagnostic_formulation,
        summary_of_problems=mental_health.summary_of_problems
    )
    try:
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        return new_note
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 3. Get Mental Health History: Retrieve all past mental health records for a specific patient
@router.get("/v1/patients/{patient_id}/mentalhealth", response_model=List[MentalHealthOut])
def get_mental_health_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Retrieve all mental health records associated with the patient
    records = db.query(MentalHealthNote).filter(MentalHealthNote.patient_id == patient_id).all()

    if not records:
        return []  # Return empty list instead of 404 for no records found

    return records

# 4. Update Mental Health Record: Modify an existing mental health record
@router.put("/v1/patients/{patient_id}/mentalhealth/{record_id}", response_model=MentalHealthOut)
def update_mental_health_note(
    patient_id: str,
    record_id: int,
    mental_health: MentalHealthUpdate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Check if the mental health record exists
    note = db.query(MentalHealthNote).filter(MentalHealthNote.mental_health_id == record_id, MentalHealthNote.patient_id == patient_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Mental health record not found")
    
    # Update the record with the new data
    for key, value in mental_health.dict(exclude_unset=True).items():
        setattr(note, key, value)

    try:
        db.commit()
        db.refresh(note)
        return note
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error occurred: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 5. Delete Mental Health Record: Remove a specific mental health record
@router.delete("/v1/patients/{patient_id}/mentalhealth/{record_id}")
def delete_mental_health_note(patient_id: str, record_id: int, db: Session = Depends(get_db)):
    # Query the record to ensure it exists and belongs to the specified patient
    note = db.query(MentalHealthNote).filter(
        MentalHealthNote.mental_health_id == record_id,
        MentalHealthNote.patient_id == patient_id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Mental health record not found.")

    try:
        # Delete the record
        db.delete(note)
        db.commit()
        return {"message": "Mental health record deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting mental health record: {str(e)}")

