from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models import Patient, ClinicalNote
from app.schemas import PatientSearchResponse, ClinicalCreate, ClinicalOut
from app.database import get_db
from typing import List, Optional

router = APIRouter()

# 1. GET: Search for patients (including by patient_id, surname, other_names, hospital_reg_number)
@router.get("/", response_model=PatientSearchResponse)
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

# 2. POST: Add a clinical record to a selected patient
@router.post("/{patient_id}/clinical", response_model=ClinicalOut)
def add_clinical_record_to_patient(
    patient_id: str,
    clinical: ClinicalCreate,
    db: Session = Depends(get_db)
):
    # First, check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Create a new clinical note and associate it with the patient
    try:
        new_clinical_note = ClinicalNote(
            patient_id=patient_id,
            temperature=clinical.temperature,
            blood_pressure=clinical.blood_pressure,
            pulse_rate=clinical.pulse_rate,
            respiratory_rate=clinical.respiratory_rate,
            present_psychological_concerns=clinical.present_psychological_concerns,
            history_of_mental_illness=clinical.history_of_mental_illness,
            risk_assessment_suicide_self_harm=clinical.risk_assessment_suicide_self_harm,
            tests_administered=clinical.tests_administered,
            scores_and_interpretation=clinical.scores_and_interpretation,
            type_of_therapy=clinical.type_of_therapy,
            progress_notes=clinical.progress_notes,
            interventions_during_acute_episodes=clinical.interventions_during_acute_episodes,
            source_of_referral=clinical.source_of_referral,
            reasons_for_referral=clinical.reasons_for_referral,
            special_features_of_the_case=clinical.special_features_of_the_case
        )
        db.add(new_clinical_note)
        db.commit()
        db.refresh(new_clinical_note)
        return new_clinical_note  # This will be serialized to ClinicalOut by the response model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error while adding clinical record: {str(e)}")

# 3. GET: Fetch clinical history for a patient by patient_id
@router.get("/{patient_id}/clinical", response_model=List[ClinicalOut])
def get_clinical_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Retrieve all clinical notes associated with the patient
    clinical_notes = db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient_id).all()
    
    if not clinical_notes:
        return []  # Return empty list instead of 404 error for no records found

    return clinical_notes

# 4. PUT: Update an existing clinical record
@router.put("/{patient_id}/clinical/{record_id}", response_model=ClinicalOut)
def update_clinical_record(
    patient_id: str,
    record_id: int,
    clinical: ClinicalCreate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the clinical record exists
    clinical_note = db.query(ClinicalNote).filter(ClinicalNote.id == record_id, ClinicalNote.patient_id == patient_id).first()
    if not clinical_note:
        raise HTTPException(status_code=404, detail="Clinical record not found")

    # Update clinical record fields
    clinical_note.temperature = clinical.temperature
    clinical_note.blood_pressure = clinical.blood_pressure
    clinical_note.pulse_rate = clinical.pulse_rate
    clinical_note.respiratory_rate = clinical.respiratory_rate
    clinical_note.present_psychological_concerns = clinical.present_psychological_concerns
    clinical_note.history_of_mental_illness = clinical.history_of_mental_illness
    clinical_note.risk_assessment_suicide_self_harm = clinical.risk_assessment_suicide_self_harm
    clinical_note.tests_administered = clinical.tests_administered
    clinical_note.scores_and_interpretation = clinical.scores_and_interpretation
    clinical_note.type_of_therapy = clinical.type_of_therapy
    clinical_note.progress_notes = clinical.progress_notes
    clinical_note.interventions_during_acute_episodes = clinical.interventions_during_acute_episodes
    clinical_note.source_of_referral = clinical.source_of_referral
    clinical_note.reasons_for_referral = clinical.reasons_for_referral
    clinical_note.special_features_of_the_case = clinical.special_features_of_the_case
    
    try:
        db.commit()
        db.refresh(clinical_note)
        return clinical_note  # This will be serialized to ClinicalOut by the response model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error while updating clinical record: {str(e)}")

# 5. DELETE: Delete a clinical record
@router.delete("/{patient_id}/clinical/{record_id}", response_model=dict)
def delete_clinical_record(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the clinical record exists
    clinical_note = db.query(ClinicalNote).filter(ClinicalNote.id == record_id, ClinicalNote.patient_id == patient_id).first()
    if not clinical_note:
        raise HTTPException(status_code=404, detail="Clinical record not found")

    try:
        db.delete(clinical_note)
        db.commit()
        return {"detail": "Clinical record deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error while deleting clinical record: {str(e)}")
