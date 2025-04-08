from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.models import Appointment, Patient
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut, PatientOut
from app.database import get_db
from sqlalchemy import String

router = APIRouter()

# Helper function to generate unique appointment ID (as an integer)
def generate_appointment_id(db: Session):
    last_appointment = db.query(Appointment).order_by(Appointment.appointment_id.desc()).first()
    if last_appointment:
        return last_appointment.appointment_id + 1  # Increment from the last appointment ID
    return 1  # Start from 1 if no appointments exist

# POST: Add an appointment for a specific patient
@router.post("/v1/patients/{patient_id}/appointments", response_model=AppointmentOut)
def add_appointment_for_patient(patient_id: str, appointment: AppointmentCreate, db: Session = Depends(get_db)):
    try:
        # Ensure that patient exists
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Create the appointment and link it to the patient
        new_appointment = Appointment(
            appointment_id=generate_appointment_id(db),  # Generate unique appointment ID
            patient_id=patient_id,  # Link to the patient using the patient_id from URL
            appointment_date=appointment.appointment_date,
            reason_for_visit=appointment.reason_for_visit,
            diagnosis=appointment.diagnosis,
            treatment_plan=appointment.treatment_plan,
            notes=appointment.notes
        )

        # Add the new appointment to the session and commit
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
        return new_appointment

    except HTTPException as http_exc:
        raise http_exc  # Re-raise HTTP exceptions for client errors
    except Exception as e:
        db.rollback()  # Rollback in case of an error
        raise HTTPException(status_code=500, detail=f"An error occurred while adding the appointment: {str(e)}")

# GET: Retrieve all appointments for a specific patient
@router.get("/v1/patients/{patient_id}/appointments", response_model=List[AppointmentOut])
def get_appointments_for_patient(patient_id: str, db: Session = Depends(get_db)):
    try:
        # Ensure that patient exists
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Retrieve all appointments linked to the patient
        appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).all()

        if not appointments:
            raise HTTPException(status_code=404, detail="No appointments found for this patient")

        return appointments

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving appointments for patient: {str(e)}")

# GET: Retrieve an appointment by appointment_id
@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment  # Return the found appointment

# GET: Retrieve all appointments with filter type (upcoming/past)
@router.get("/", response_model=List[AppointmentOut])
def get_all_appointments(filter_type: str = 'all', db: Session = Depends(get_db)):
    query = db.query(Appointment)

    if filter_type == 'past':
        query = query.filter(Appointment.appointment_date < datetime.now())
    elif filter_type == 'upcoming':
        query = query.filter(Appointment.appointment_date >= datetime.now())

    appointments = query.all()
    return appointments  # Return a list of all appointments

# PUT: Update an existing appointment for a specific patient
@router.put("/{patient_id}/appointments/{appointment_id}")
def update_appointment(patient_id: str, appointment_id: int, updated_appointment: AppointmentUpdate, db: Session = Depends(get_db)):
    # Fetch the appointment from the database
    db_appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    
    # Check if the appointment exists
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Optionally, check that the patient_id matches
    if db_appointment.patient_id != patient_id:
        raise HTTPException(status_code=400, detail="Appointment does not belong to the provided patient")

    # Update the fields with the new data
    db_appointment.appointment_date = updated_appointment.appointment_date
    db_appointment.reason_for_visit = updated_appointment.reason_for_visit
    db_appointment.diagnosis = updated_appointment.diagnosis
    db_appointment.treatment_plan = updated_appointment.treatment_plan
    db_appointment.notes = updated_appointment.notes

    # Commit the changes
    db.commit()
    
    # Return success message
    return {"message": "Appointment updated successfully!"}


# DELETE: Delete an appointment by appointment_id
@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(db_appointment)
    db.commit()
    return {"message": "Appointment deleted successfully"}

# GET: Search for patients by various criteria (ID, name, hospital number)
@router.get("/v1/patients/search", response_model=List[PatientOut])
def search_patients(query: str, db: Session = Depends(get_db)):
    patients = db.query(Patient).filter(
        (Patient.patient_id.cast(String).like(f"%{query}%")) |  # Search by patient ID (cast to string)
        (Patient.surname.like(f"%{query}%")) |  # Search by patient name
        (Patient.hospital_reg_number.like(f"%{query}%"))  # Search by hospital number
    ).all()

    if not patients:
        raise HTTPException(status_code=404, detail="No patients found matching the search criteria")

    return patients  # Return a list of patients that match the search query
