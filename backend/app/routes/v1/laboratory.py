from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models import LaboratoryRecord, Patient
from app.schemas import LaboratoryCreate, LaboratoryUpdate, LaboratoryOut, PatientSearchResponse
from app.database import get_db
from typing import List, Optional

from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
import json
import os
from datetime import datetime
from reportlab.pdfgen import canvas
from io import BytesIO

router = APIRouter()

# 1. Search Patients: Search for patients by patient_id, surname, other_names, and hospital_reg_number
@router.get("/", response_model=PatientSearchResponse)
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

# 2. Create Laboratory Record: When a healthcare provider wants to record a laboratory test
@router.post("/{patient_id}/laboratory", response_model=LaboratoryOut)
def create_laboratory_record(
    patient_id: str,
    laboratory: LaboratoryCreate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create a new laboratory record
    new_record = LaboratoryRecord(
        patient_id=patient_id,
        tests_requested_by_physicians=laboratory.tests_requested_by_physicians,
        urgency=laboratory.urgency,
        test_results=laboratory.test_results,
        reference_ranges=laboratory.reference_ranges,
        pathologist_comments=laboratory.pathologist_comments,
        specimen_type=laboratory.specimen_type,
        date_time_of_collection=laboratory.date_time_of_collection,
        chain_of_custody=laboratory.chain_of_custody,
    )
    try:
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record  # This will be serialized to LaboratoryOut by the response model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An error occurred while processing the laboratory record.")

# 3. Get Laboratory History: Retrieve all laboratory records for a specific patient
@router.get("/{patient_id}/laboratory", response_model=List[LaboratoryOut])
def get_laboratory_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Retrieve all laboratory records associated with the patient
    records = db.query(LaboratoryRecord).filter(LaboratoryRecord.patient_id == patient_id).all()

    if not records:
        return []  # Return empty list instead of 404 for no records found

    return records

# 4. Update Laboratory Record: Modify an existing laboratory record
@router.put("/{patient_id}/laboratory/{record_id}", response_model=LaboratoryUpdate)
def update_laboratory_record(
    patient_id: str,
    record_id: int,
    laboratory: LaboratoryUpdate,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the laboratory record exists
    record = db.query(LaboratoryRecord).filter(LaboratoryRecord.id == record_id, LaboratoryRecord.patient_id == patient_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Laboratory record not found")
    
    # Update the record with the new data
    for key, value in laboratory.dict(exclude_unset=True).items():
        setattr(record, key, value)

    try:
        db.commit()
        db.refresh(record)
        return record  # This will be serialized to LaboratoryOut by the response model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 5. Delete Laboratory Record: Remove a specific laboratory record
@router.delete("/{patient_id}/laboratory/{record_id}", status_code=204)
def delete_laboratory_record(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the laboratory record exists
    record = db.query(LaboratoryRecord).filter(LaboratoryRecord.id == record_id, LaboratoryRecord.patient_id == patient_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Laboratory record not found")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Laboratory record deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# 6. Download Laboratory Result: Download a copy of a specific laboratory record
@router.get("/{patient_id}/laboratory/{record_id}/download")
async def download_laboratory_result(
    patient_id: str,
    record_id: int,
    format: str = "pdf",  # Default to PDF
    db: Session = Depends(get_db)
):
    # Check if the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if the laboratory record exists
    record = db.query(LaboratoryRecord).filter(
        LaboratoryRecord.id == record_id,
        LaboratoryRecord.patient_id == patient_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Laboratory record not found")

    if format == "pdf":
        # Create a PDF version of the report
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        
        # Add content to PDF
        p.drawString(100, 800, f"Laboratory Report for {patient.surname}, {patient.other_names}")
        p.drawString(100, 780, f"Patient ID: {patient.patient_id}")
        p.drawString(100, 760, f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        p.drawString(100, 740, "----------------------------------------")
        
        p.drawString(100, 720, "Tests Requested:")
        p.drawString(120, 700, record.tests_requested_by_physicians)
        
        p.drawString(100, 680, "Test Results:")
        p.drawString(120, 660, record.test_results)
        
        p.drawString(100, 640, "Reference Ranges:")
        p.drawString(120, 620, record.reference_ranges)
        
        p.drawString(100, 600, "Pathologist Comments:")
        p.drawString(120, 580, record.pathologist_comments)
        
        p.drawString(100, 560, "Specimen Type:")
        p.drawString(120, 540, record.specimen_type)
        
        p.drawString(100, 520, "Collection Date:")
        p.drawString(120, 500, str(record.date_time_of_collection))
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        
        # Create a filename with patient and record info
        filename = f"lab_result_{patient.surname}_{record_id}_{datetime.now().date()}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    elif format == "json":
        # Create JSON data
        record_data = {
            "patient_id": record.patient_id,
            "patient_name": f"{patient.surname}, {patient.other_names}",
            "tests_requested": record.tests_requested_by_physicians,
            "test_results": record.test_results,
            "reference_ranges": record.reference_ranges,
            "comments": record.pathologist_comments,
            "specimen_type": record.specimen_type,
            "collection_date": str(record.date_time_of_collection),
            "report_date": str(record.created_at),
        }
        
        # Create a filename with patient and record info
        filename = f"lab_result_{patient.surname}_{record_id}_{datetime.now().date()}.json"
        
        return StreamingResponse(
            BytesIO(json.dumps(record_data).encode('utf-8')),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Please use 'pdf' or 'json'")
