# app/routes/v2/appointments.py

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import Appointment  # Assuming Appointment model exists
from app.schemas import AppointmentCreate, AppointmentOut  # Assuming Appointment schemas exist

router = APIRouter()

# Mocking a list of appointments for demonstration purposes
appointments_db = []

@router.get("/", response_model=List[AppointmentOut])
def get_appointments(patient_id: Optional[int] = None):
    """
    Retrieve a list of appointments. Optionally filter by patient_id.
    """
    if patient_id:
        # Filter appointments for a specific patient
        filtered_appointments = [appt for appt in appointments_db if appt.patient_id == patient_id]
        return filtered_appointments
    return appointments_db

@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int):
    """
    Retrieve details of a single appointment by ID.
    """
    appointment = next((appt for appt in appointments_db if appt.appointment_id == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.post("/", response_model=AppointmentOut)
def create_appointment(appointment_data: AppointmentCreate):
    """
    Create a new appointment.
    """
    appointment = Appointment(**appointment_data.dict())  # Assuming you have an Appointment model
    appointments_db.append(appointment)  # Mock database insertion
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(appointment_id: int, appointment_data: AppointmentCreate):
    """
    Update an existing appointment by ID.
    """
    appointment = next((appt for appt in appointments_db if appt.appointment_id == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Update the appointment (this is a mock; normally you'd update in DB)
    appointment_data = appointment_data.dict()
    for key, value in appointment_data.items():
        setattr(appointment, key, value)
    return appointment

@router.delete("/{appointment_id}", response_model=AppointmentOut)
def delete_appointment(appointment_id: int):
    """
    Delete an appointment by ID.
    """
    appointment = next((appt for appt in appointments_db if appt.appointment_id == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointments_db.remove(appointment)
    return appointment
