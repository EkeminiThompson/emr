from fastapi import APIRouter, HTTPException, Depends, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, Image, TableStyle
import requests
from app.routes.v1.admin import get_current_user 

from app.models import Billing, Patient, Doctor, Fee, PaymentHistory, User, AuditLog
from app.database import get_db
from app.schemas import (
    BillingCreate, BillingUpdate, BillingOut, PatientSearchResponse, 
    PaymentHistoryBase, PaymentHistoryCreate
)
from sqlalchemy import func

router = APIRouter()
logger = logging.getLogger(__name__)

# Helper Functions

def get_patient_or_404(db: Session, patient_id: str) -> Patient:
    """Helper function to fetch a patient or raise a 404 error."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        logger.error(f"Patient not found: {patient_id}")
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def get_billing_or_404(db: Session, billing_id: int, patient_id: str) -> Billing:
    """Helper function to fetch a billing or raise a 404 error."""
    billing = db.query(Billing).filter(
        Billing.billing_id == billing_id,
        Billing.patient_id == patient_id
    ).first()
    if not billing:
        logger.error(f"Billing not found: {billing_id}")
        raise HTTPException(status_code=404, detail="Billing record not found")
    return billing


def paginate(query, page: int, size: int):
    """Helper function to paginate query results."""
    return query.offset((page - 1) * size).limit(size).all()


def generate_receipt_pdf(billing, patient, doctor, logo_url="https://emr-5esm.vercel.app/renewal.png"):
    """Generate a PDF receipt for a billing."""
    buffer = BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    content = []

    # Try to fetch the logo
    try:
        response = requests.get(logo_url, timeout=10)
        response.raise_for_status()
        logo_img = Image(BytesIO(response.content), width=200, height=100)
        content.append(logo_img)
    except requests.exceptions.RequestException as e:
        logger.warning(f"Could not load logo image: {e}")
        content.append(Paragraph("Billing Receipt", styles['Title']))

    content.append(Spacer(1, 12))

    # Add a title
    title = Paragraph("Billing Receipt", styles['Title'])
    content.append(title)
    content.append(Spacer(1, 12))

    # Add billing details
    billing_details = [
        f"Patient: {patient.surname}, {patient.other_names}",
        f"Doctor: {doctor.full_name}",
        f"Invoice Number: {billing.invoice_number}",
        f"Invoice Date: {billing.invoice_date}",
        f"Total Bill: NGN{billing.total_bill:.2f}",
        f"Discount %: NGN{billing.discount_percentage:.2f}",
        f"Discount Amt: NGN{billing.discount_amount:.2f}",
        f"Amount Due: NGN{billing.amount_due:.2f}",
        f"Status: {billing.status}",
    ]
    for detail in billing_details:
        content.append(Paragraph(detail, styles['BodyText']))
        content.append(Spacer(1, 6))

    # Add a table for fees
    fees = [["Fee Type", "Amount"]]
    for fee in billing.fees:
        fees.append([fee.fee_type, f"NGN{fee.amount:.2f}"])

    table = Table(fees)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    content.append(Spacer(1, 12))
    content.append(table)

    # Add a footer
    footer = Paragraph("Thank you for choosing our service. For inquiries, contact support@example.com.", styles['Italic'])
    content.append(Spacer(1, 12))
    content.append(footer)

    # Build the PDF
    pdf.build(content)

    # Return the PDF as bytes
    buffer.seek(0)
    return buffer.getvalue()


# Endpoints

@router.get("/v1/patients/", response_model=PatientSearchResponse)
def search_patients(
    patient_id: Optional[str] = None,
    surname: Optional[str] = None,
    other_names: Optional[str] = None,
    hospital_reg_number: Optional[str] = None,
    page: int = 1,
    size: int = 50,
    db: Session = Depends(get_db)
):
    """Search for patients by filters."""
    query = db.query(Patient)

    # Apply filters
    if patient_id:
        query = query.filter(Patient.patient_id.ilike(f"%{patient_id}%"))
    if surname:
        query = query.filter(Patient.surname.ilike(f"%{surname}%"))
    if other_names:
        query = query.filter(Patient.other_names.ilike(f"%{other_names}%"))
    if hospital_reg_number:
        query = query.filter(Patient.hospital_reg_number.ilike(f"%{hospital_reg_number}%"))

    total = query.count()
    patients = paginate(query, page, size)

    if not patients:
        logger.warning("No patients found with the given filters")
        raise HTTPException(status_code=404, detail="No patients found")

    return {
        "total_records": total,
        "page": page,
        "size": size,
        "patients": patients,
    }


@router.get("/v1/billings/", response_model=List[BillingOut])
def search_billings(
    patient_id: Optional[str] = None,
    doctor_id: Optional[int] = None,
    invoice_number: Optional[str] = None,
    page: int = 1,
    size: int = 50,
    db: Session = Depends(get_db)
):
    """Search for billings by filters."""
    query = db.query(Billing)

    # Apply filters
    if patient_id:
        query = query.filter(Billing.patient_id.ilike(f"%{patient_id}%"))
    if doctor_id:
        query = query.filter(Billing.doctor_id == doctor_id)
    if invoice_number:
        query = query.filter(Billing.invoice_number.ilike(f"%{invoice_number}%"))

    total = query.count()
    billings = paginate(query, page, size)

    if not billings:
        logger.warning("No billings found with the given filters")
        raise HTTPException(status_code=404, detail="No billings found")

    return {
        "total_records": total,
        "page": page,
        "size": size,
        "billings": billings,
    }

# Create billing
@router.post("/v1/patients/{patient_id}/billings", response_model=BillingOut)
def create_billing(
    patient_id: str,
    billing: BillingCreate,
    request: Request,  # Added for audit logging
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Added to track who created the billing
):
    """Create a new billing for a patient."""
    try:
        patient = get_patient_or_404(db, patient_id)
        doctor = db.query(Doctor).filter(Doctor.id == billing.doctor_id).first()
        if not doctor:
            # Log failed attempt
            audit_log = AuditLog(
                action="billing_creation_failed",
                user_id=current_user.id,
                description=f"Doctor not found: {billing.doctor_id}",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
            db.add(audit_log)
            db.commit()
            
            logger.error(f"Doctor not found: {billing.doctor_id}")
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Create billing with default status as "Unpaid"
        new_billing = Billing(
            patient_id=patient_id,
            doctor_id=billing.doctor_id,
            invoice_number=None,
            total_bill=billing.total_bill,
            discount_percentage=billing.discount_percentage,
            discount_amount=billing.discount_amount,
            status="Unpaid",
        )
        db.add(new_billing)
        db.commit()
        db.refresh(new_billing)

        # Add fees
        for fee in billing.fees:
            fee_record = Fee(
                fee_type=fee.fee_type,
                amount=fee.amount,
                billing_id=new_billing.billing_id,
            )
            db.add(fee_record)

        db.commit()
        db.refresh(new_billing)

        # Recalculate total bill and generate invoice
        new_billing.calculate_total_bill()
        invoice_number = new_billing.generate_invoice()
        db.commit()
        db.refresh(new_billing)

        # Log successful creation
        audit_log = AuditLog(
            action="billing_created",
            user_id=current_user.id,
            description=f"Created billing {invoice_number} for patient {patient_id} (Amount: {new_billing.total_bill})",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return new_billing

    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="billing_creation_error",
            user_id=current_user.id,
            description=f"Database error while creating billing: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")
        
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="billing_creation_error",
            user_id=current_user.id,
            description=f"Unexpected error while creating billing: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/v1/patients/{patient_id}/billings", response_model=List[BillingOut])
def get_billing_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve billing history for a patient."""
    patient = get_patient_or_404(db, patient_id)
    records = db.query(Billing).filter(Billing.patient_id == patient_id).all()
    return records if records else []

# Update billing
@router.put("/v1/patients/{patient_id}/billings/{billing_id}", response_model=BillingOut)
def update_billing(
    patient_id: str,
    billing_id: int,
    billing: BillingUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing billing record only if it is not marked as 'Paid'."""
    try:
        # Fetch the patient and billing
        patient = get_patient_or_404(db, patient_id)
        existing_billing = get_billing_or_404(db, billing_id, patient_id)

        # Check if the billing is marked as "Paid"
        if existing_billing.status == "Paid":
            logger.warning(f"Cannot edit billing {billing_id} as it is already marked as Paid.")
            raise HTTPException(status_code=400, detail="Billing is already marked as Paid. Edits are not allowed.")

        # Update billing fields if not marked as 'Paid'
        for key, value in billing.dict(exclude_unset=True).items():
            if key != 'fees':  # We are not updating fees directly here
                setattr(existing_billing, key, value)

        # Update fees if provided (only if billing is not paid)
        if billing.fees is not None:
            # Delete existing fees first if any
            for existing_fee in existing_billing.fees:
                db.delete(existing_fee)
            # Add the new fees
            for fee in billing.fees:
                fee_record = Fee(
                    fee_type=fee.fee_type,
                    amount=fee.amount,
                    billing_id=existing_billing.billing_id,
                )
                db.add(fee_record)

        # Commit the changes to the database
        db.commit()
        # Recalculate the total bill and generate invoice
        existing_billing.calculate_total_bill()
        existing_billing.generate_invoice()
        db.commit()
        db.refresh(existing_billing)

        return existing_billing

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

#delete billing
@router.delete("/v1/patients/{patient_id}/billings/{billing_id}", status_code=204)
def delete_billing(
    patient_id: str,
    billing_id: int,
    request: Request,  # Added for audit logging
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Added to track who deleted the billing
):
    """Delete a billing record."""
    patient = get_patient_or_404(db, patient_id)
    billing = get_billing_or_404(db, billing_id, patient_id)

    try:
        # Capture details before deletion
        billing_details = {
            "invoice_number": billing.invoice_number,
            "amount": str(billing.total_bill),
            "patient_id": billing.patient_id
        }
        
        db.delete(billing)
        db.commit()
        
        # Log successful deletion
        audit_log = AuditLog(
            action="billing_deleted",
            user_id=current_user.id,
            description=f"Deleted billing {billing_details['invoice_number']} (Amount: {billing_details['amount']})",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        return {"message": "Billing record deleted successfully"}

    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="billing_deletion_error",
            user_id=current_user.id,
            description=f"Database error while deleting billing: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")
        
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="billing_deletion_error",
            user_id=current_user.id,
            description=f"Unexpected error while deleting billing: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post("/v1/billings/{billing_id}/payments", response_model=PaymentHistoryBase)
def create_payment(
    billing_id: int,
    payment: PaymentHistoryCreate,
    db: Session = Depends(get_db)
):
    """Create a payment for a billing."""
    try:
        billing = db.query(Billing).filter(Billing.billing_id == billing_id).first()
        if not billing:
            logger.error(f"Billing not found: {billing_id}")
            raise HTTPException(status_code=404, detail="Billing record not found")

        new_payment = PaymentHistory(
            billing_id=billing_id,
            amount_paid=payment.amount_paid,
            payment_method=payment.payment_method,
        )
        new_payment.generate_receipt_number(db)

        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

        billing.update_payment_status()
        db.commit()
        db.refresh(billing)

        return new_payment

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.patch("/v1/patients/{patient_id}/billings/{billing_id}/mark-as-paid", response_model=BillingOut)
def mark_billing_as_paid(
    patient_id: str,
    billing_id: int,
    db: Session = Depends(get_db)
):
    """Mark a billing as paid."""
    billing = get_billing_or_404(db, billing_id, patient_id)

    if billing.status == "Paid":
        logger.warning(f"Billing {billing_id} is already marked as paid")
        raise HTTPException(status_code=400, detail="Billing is already marked as paid")

    billing.status = "Paid"
    db.commit()
    db.refresh(billing)

    return billing


@router.get("/v1/patients/{patient_id}/billings/{billing_id}/download-receipt")
def download_receipt(
    patient_id: str,
    billing_id: int,
    db: Session = Depends(get_db)
):
    """Download a receipt for a paid billing."""
    billing = get_billing_or_404(db, billing_id, patient_id)

    if billing.status != "Paid":
        logger.warning(f"Billing {billing_id} is not paid. Cannot generate receipt.")
        raise HTTPException(status_code=400, detail="Billing is not paid. Cannot generate receipt.")

    patient = get_patient_or_404(db, patient_id)
    doctor = db.query(Doctor).filter(Doctor.id == billing.doctor_id).first()

    # Generate the PDF
    pdf_bytes = generate_receipt_pdf(billing, patient, doctor)

    # Prepare the response
    headers = {
        "Content-Disposition": f"attachment; filename=receipt_{billing.invoice_number}.pdf"
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

@router.get("/v1/billings/revenue-by-user")
def get_revenue_by_user(
    time_frame: str = "total",  # Can be 'day', 'week', 'month', 'year', or 'total'
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get revenue generated by each user (doctor) filtered by time period.
    
    Parameters:
    - time_frame: 'day', 'week', 'month', 'year', or 'total'
    - start_date: Optional start date (YYYY-MM-DD) for custom range
    - end_date: Optional end date (YYYY-MM-DD) for custom range
    - doctor_id: Optional filter for specific doctor
    
    Returns:
    - List of dictionaries containing doctor info and revenue
    """
    try:
        # Base query
        query = db.query(
            Doctor.id.label("doctor_id"),
            Doctor.full_name.label("doctor_name"),
            func.sum(Billing.total_bill).label("total_revenue"),
            func.count(Billing.billing_id).label("billing_count")
        ).join(
            Billing, Doctor.id == Billing.doctor_id
        ).filter(
            Billing.status == "Paid"  # Only count paid billings
        ).group_by(
            Doctor.id, Doctor.full_name
        )

        # Apply doctor filter if provided
        if doctor_id:
            query = query.filter(Doctor.id == doctor_id)

        # Handle time frame filtering
        if time_frame != "total":
            now = datetime.utcnow()
            
            if start_date and end_date:
                # Custom date range
                try:
                    start = datetime.strptime(start_date, "%Y-%m-%d")
                    end = datetime.strptime(end_date, "%Y-%m-%d")
                    query = query.filter(Billing.invoice_date.between(start, end))
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            else:
                # Predefined time frames
                if time_frame == "day":
                    today = now.date()
                    query = query.filter(func.date(Billing.invoice_date) == today)
                elif time_frame == "week":
                    start_of_week = now - timedelta(days=now.weekday())
                    query = query.filter(Billing.invoice_date >= start_of_week)
                elif time_frame == "month":
                    start_of_month = now.replace(day=1)
                    query = query.filter(Billing.invoice_date >= start_of_month)
                elif time_frame == "year":
                    start_of_year = now.replace(month=1, day=1)
                    query = query.filter(Billing.invoice_date >= start_of_year)
                else:
                    raise HTTPException(status_code=400, detail="Invalid time_frame. Use 'day', 'week', 'month', 'year', or 'total'")

        # Execute query
        results = query.all()

        # Format response
        response = []
        for doctor_id, doctor_name, total_revenue, billing_count in results:
            response.append({
                "doctor_id": doctor_id,
                "doctor_name": doctor_name,
                "total_revenue": float(total_revenue) if total_revenue else 0.0,
                "billing_count": billing_count,
                "time_frame": time_frame,
                "start_date": start_date,
                "end_date": end_date
            })

        return response

    except SQLAlchemyError as e:
        logger.error(f"Database error in revenue_by_user: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error in revenue_by_user: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")