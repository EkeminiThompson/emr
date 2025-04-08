# app/routes/v2/billing.py

from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Billing  # Assuming Billing model exists
from app.schemas import BillingCreate, BillingOut  # Assuming Billing schemas exist

router = APIRouter()

# Mocking a list of billings for demonstration purposes
billings_db = []

@router.get("/", response_model=List[BillingOut])
def get_billings(patient_id: int):
    """
    Retrieve a list of billings for a specific patient.
    """
    patient_billings = [billing for billing in billings_db if billing.patient_id == patient_id]
    if not patient_billings:
        raise HTTPException(status_code=404, detail="No billings found for this patient")
    return patient_billings

@router.get("/{billing_id}", response_model=BillingOut)
def get_billing(billing_id: int):
    """
    Retrieve a single billing record by ID.
    """
    billing = next((bill for bill in billings_db if bill.billing_id == billing_id), None)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    return billing

@router.post("/", response_model=BillingOut)
def create_billing(billing_data: BillingCreate):
    """
    Create a new billing record for a patient.
    """
    billing = Billing(**billing_data.dict())  # Assuming you have a Billing model
    billings_db.append(billing)  # Mock database insertion
    return billing

@router.put("/{billing_id}", response_model=BillingOut)
def update_billing(billing_id: int, billing_data: BillingCreate):
    """
    Update an existing billing record by ID.
    """
    billing = next((bill for bill in billings_db if bill.billing_id == billing_id), None)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    # Update the billing (this is a mock; normally you'd update in DB)
    billing_data = billing_data.dict()
    for key, value in billing_data.items():
        setattr(billing, key, value)
    return billing

@router.delete("/{billing_id}", response_model=BillingOut)
def delete_billing(billing_id: int):
    """
    Delete a billing record by ID.
    """
    billing = next((bill for bill in billings_db if bill.billing_id == billing_id), None)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    billings_db.remove(billing)
    return billing
