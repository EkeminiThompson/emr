from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models import Patient, NursesNote  # Updated to use NursesNote instead of ClinicalNote
from app.schemas import PatientSearchResponse, NursesNoteCreate, NursesNoteOut  # Updated schemas
from app.database import get_db
from typing import List, Optional

router = APIRouter()

# 1. GET: Search for patients (including by patient_id, surname, other_names, hospital_reg_number)
@router.get("/v1/patients/", response_model=PatientSearchResponse)
def search_patients(
    patient_id: Optional[str] = None,  # Optional patient_id search filter
    surname: Optional[str] = None,
    other_names: Optional[str] = None,
    hospital_reg_number: Optional[str] = None,
    page: int = 1, size: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    
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

# 2. POST: Add a nurses note to a selected patient
@router.post("/v1/patients/{patient_id}/nurses_note", response_model=NursesNoteOut)
def add_nurses_note_to_patient(
    patient_id: str,
    nurses_note: NursesNoteCreate,
    db: Session = Depends(get_db)
):
    # First, check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Create a new nurses note and associate it with the patient
    try:
        new_nurses_note = NursesNote(
            patient_id=patient_id,
            source_of_referral=nurses_note.source_of_referral,
            reasons_for_referral=nurses_note.reasons_for_referral,
            special_features_of_case=nurses_note.special_features_of_case,
            temperature=nurses_note.temperature,
            blood_pressure=nurses_note.blood_pressure,
            pulse_rate=nurses_note.pulse_rate,
            respiratory_rate=nurses_note.respiratory_rate,
            height_cm=nurses_note.height_cm,
            weight_kg=nurses_note.weight_kg,
            nurse_note=nurses_note.nurse_note
        )
        db.add(new_nurses_note)
        db.commit()
        db.refresh(new_nurses_note)
        return new_nurses_note  # This will be serialized to NursesNoteOut by the response model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error while adding nurses note: {str(e)}")

# 3. GET: Fetch nursing history for a patient by patient_id
@router.get("/v1/patients/{patient_id}/nurses_note", response_model=List[NursesNoteOut])
def get_nurses_note_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Retrieve all nurses notes associated with the patient
    nurses_notes = db.query(NursesNote).filter(NursesNote.patient_id == patient_id).all()
    
    if not nurses_notes:
        return []  # Return empty list instead of 404 error for no records found

    return nurses_notes

# 4. PUT: Update an existing nurses note
@router.put("/v1/patients/{patient_id}/nurses_note/{note_id}", response_model=NursesNoteOut)
def update_nurses_note(
    patient_id: str,
    note_id: int,
    nurses_note: NursesNoteCreate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the nurses note exists
    existing_note = db.query(NursesNote).filter(NursesNote.id == note_id, NursesNote.patient_id == patient_id).first()
    if not existing_note:
        raise HTTPException(status_code=404, detail="Nurses note not found")

    # Update nurses note fields
    existing_note.source_of_referral = nurses_note.source_of_referral
    existing_note.reasons_for_referral = nurses_note.reasons_for_referral
    existing_note.special_features_of_case = nurses_note.special_features_of_case
    existing_note.temperature = nurses_note.temperature
    existing_note.blood_pressure = nurses_note.blood_pressure
    existing_note.pulse_rate = nurses_note.pulse_rate
    existing_note.respiratory_rate = nurses_note.respiratory_rate
    existing_note.height_cm = nurses_note.height_cm
    existing_note.weight_kg = nurses_note.weight_kg
    existing_note.nurse_note = nurses_note.nurse_note
    
    try:
        db.commit()
        db.refresh(existing_note)
        return existing_note  # This will be serialized to NursesNoteOut by the response model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error while updating nurses note: {str(e)}")

# 5. DELETE: Delete a nurses note
@router.delete("/v1/patients/{patient_id}/nurses_note/{note_id}", response_model=dict)
def delete_nurses_note(
    patient_id: str,
    note_id: int,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the nurses note exists
    nurses_note = db.query(NursesNote).filter(NursesNote.id == note_id, NursesNote.patient_id == patient_id).first()
    if not nurses_note:
        raise HTTPException(status_code=404, detail="Nurses note not found")

    try:
        db.delete(nurses_note)
        db.commit()
        return {"detail": "Nurses note deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error while deleting nurses note: {str(e)}")
