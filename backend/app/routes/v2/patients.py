from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import (
    Patient,
    ClinicalNote,
    MentalHealthNote,
    PharmacyRecord,
    LaboratoryRecord,
    OccupationalTherapyRecord,
    NursesNote,
    SocialWorkRecord
)

router = APIRouter()

# Utility function to search for a patient by multiple fields
def search_patient(query: str, db: Session) -> Patient:
    patient = db.query(Patient).filter(
        or_(
            Patient.surname.ilike(f"%{query}%"),
            Patient.other_names.ilike(f"%{query}%"),
            Patient.patient_id.ilike(f"%{query}%"),
            Patient.residential_phone.ilike(f"%{query}%")
        )
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient

# Endpoint to get a specific patient or all patients with optional pagination
@router.get("/patients")
def get_patients(patient_id: str = None, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    if patient_id:
        # Fetch a single patient by patient_id
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return patient
    else:
        # Fetch all patients with pagination if no patient_id is provided
        patients = db.query(Patient).offset(skip).limit(limit).all()
        return patients

# Endpoint to get pharmacy records for a patient
@router.get("/patients/{patient_id}/pharmacy")
def get_pharmacy_records(patient_id: str, db: Session = Depends(get_db)):
    pharmacy_records = db.query(PharmacyRecord).filter(PharmacyRecord.patient_id == patient_id).all()
    if not pharmacy_records:
        raise HTTPException(status_code=404, detail="No pharmacy records found for this patient")
    return pharmacy_records

# Endpoint to get laboratory records for a patient
@router.get("/patients/{patient_id}/laboratory")
def get_laboratory_records(patient_id: str, db: Session = Depends(get_db)):
    laboratory_records = db.query(LaboratoryRecord).filter(LaboratoryRecord.patient_id == patient_id).all()
    if not laboratory_records:
        raise HTTPException(status_code=404, detail="No laboratory records found for this patient")
    return laboratory_records

# Endpoint to get occupational therapy records for a patient
@router.get("/patients/{patient_id}/occupational-therapy")
def get_occupational_therapy_records(patient_id: str, db: Session = Depends(get_db)):
    occupational_records = db.query(OccupationalTherapyRecord).filter(OccupationalTherapyRecord.patient_id == patient_id).all()
    if not occupational_records:
        raise HTTPException(status_code=404, detail="No occupational therapy records found for this patient")
    return occupational_records

# Endpoint to get nurses' notes for a patient
@router.get("/patients/{patient_id}/nurses-notes")
def get_nurses_notes(patient_id: str, db: Session = Depends(get_db)):
    nurses_notes = db.query(NursesNote).filter(NursesNote.patient_id == patient_id).all()
    if not nurses_notes:
        raise HTTPException(status_code=404, detail="No nurses' notes found for this patient")
    return nurses_notes

# Endpoint to get social work records for a patient
@router.get("/patients/{patient_id}/social-work")
def get_social_work_records(patient_id: str, db: Session = Depends(get_db)):
    social_work_records = db.query(SocialWorkRecord).filter(SocialWorkRecord.patient_id == patient_id).all()
    if not social_work_records:
        raise HTTPException(status_code=404, detail="No social work records found for this patient")
    return social_work_records

# Endpoint to get clinical notes for a patient
@router.get("/patients/{patient_id}/clinical-notes")
def get_clinical_notes(patient_id: str, db: Session = Depends(get_db)):
    clinical_notes = db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient_id).all()
    if not clinical_notes:
        raise HTTPException(status_code=404, detail="No clinical notes found for this patient")
    return clinical_notes

# Endpoint to get mental health notes for a patient
@router.get("/patients/{patient_id}/mental-health")
def get_mental_health_notes(patient_id: str, db: Session = Depends(get_db)):
    mental_health_notes = db.query(MentalHealthNote).filter(MentalHealthNote.patient_id == patient_id).all()
    if not mental_health_notes:
        raise HTTPException(status_code=404, detail="No mental health notes found for this patient")
    return mental_health_notes