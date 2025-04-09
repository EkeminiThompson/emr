from fastapi import APIRouter, HTTPException, Depends, Query, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from decimal import Decimal
import json
import logging
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import requests
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
# Add to imports at the top
import random
import string
from app.routes.v1.admin import get_current_user 

from app.models import PharmacyRecord, Drug, Patient, Billing, Stock, User, AuditLog
from app.database import get_db
from app.schemas import (
    PharmacyRecordCreate, PharmacyRecordUpdate, PharmacyOut, 
    DrugOut, PatientSearchResponse, BillingOut, DrugOrder, ReceiptTemplate
)

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Dependency to get patient by ID
def get_patient(patient_id: str, db: Session):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        logger.error(f"Patient with ID {patient_id} not found")
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    return patient

# Dependency to get pharmacy record by ID
def get_pharmacy_record(record_id: int, patient_id: str, db: Session):
    record = db.query(PharmacyRecord).filter(
        PharmacyRecord.pharmacy_id == record_id,
        PharmacyRecord.patient_id == patient_id
    ).first()
    if not record:
        logger.error(f"Pharmacy record {record_id} not found for patient {patient_id}")
        raise HTTPException(status_code=404, detail=f"Pharmacy record {record_id} not found for patient {patient_id}")
    return record

# Dependency to get drug by ID
def get_drug(drug_id: int, db: Session):
    drug = db.query(Drug).filter(Drug.id == drug_id).first()
    if not drug:
        logger.error(f"Drug with ID {drug_id} not found")
        raise HTTPException(status_code=404, detail=f"Drug with ID {drug_id} not found")
    return drug

# Dependency to get stock by drug ID
def get_stock(drug_id: int, db: Session):
    stock = db.query(Stock).filter(Stock.drug_id == drug_id).first()
    if not stock:
        logger.error(f"Stock for drug ID {drug_id} not found")
        raise HTTPException(status_code=404, detail=f"Stock for drug ID {drug_id} not found")
    return stock

# Dependency to get billing by ID
def get_billing(billing_id: int, db: Session):
    billing = db.query(Billing).filter(Billing.billing_id == billing_id).first()
    if not billing:
        logger.error(f"Billing record {billing_id} not found")
        raise HTTPException(status_code=404, detail=f"Billing record {billing_id} not found")
    return billing

# 1. Search Patients
@router.get("/patients", response_model=PatientSearchResponse)
def search_patients(
    patient_id: Optional[str] = None,
    surname: Optional[str] = None,
    other_names: Optional[str] = None,
    hospital_reg_number: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort_by: Optional[str] = 'surname',
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

    if sort_by == "surname":
        query = query.order_by(Patient.surname)
    elif sort_by == "hospital_reg_number":
        query = query.order_by(Patient.hospital_reg_number)

    total = query.order_by(None).count()
    patients = query.offset((page - 1) * size).limit(size).all()

    if not patients:
        logger.warning("No patients found for the given search criteria")
        raise HTTPException(status_code=404, detail="No patients found")

    return {"total_records": total, "page": page, "size": size, "patients": patients}

# 2. Create Pharmacy Record
@router.post("/patients/{patient_id}/pharmacy", response_model=PharmacyOut)
def create_pharmacy_record(
    patient_id: str,
    pharmacy: PharmacyRecordCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new pharmacy record with audit logging"""
    try:
        # Retrieve patient
        patient = get_patient(patient_id, db)

        # Retrieve or create billing record
        billing = db.query(Billing).filter(Billing.patient_id == patient_id).first()
        if not billing:
            billing = Billing(patient_id=patient_id, amount=Decimal("0.00"), doctor_id=1, invoice_status='not_generated', status='Unpaid')
            db.add(billing)
            db.commit()
            db.refresh(billing)

        # Explicit check for billing ID
        if not billing or not billing.billing_id:
            audit_log = AuditLog(
                action="pharmacy_record_failed",
                user_id=current_user.id,
                description=f"Failed to create/get billing record for patient {patient_id}",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
            db.add(audit_log)
            db.commit()
            raise HTTPException(
                status_code=500,
                detail="Failed to process billing information"
            )

        # Rest of the existing code remains exactly the same...
        # Process drug orders
        drug_orders_list = []
        total_price = Decimal("0.00")
        drugs_processed = []

        for drug_order in pharmacy.drug_orders:
            drug = get_drug(drug_order.drug_id, db)
            stock = get_stock(drug_order.drug_id, db)

            if stock.quantity < drug_order.quantity:
                audit_log = AuditLog(
                    action="pharmacy_record_failed",
                    user_id=current_user.id,
                    description=f"Insufficient stock for drug {drug.name} (Available: {stock.quantity}, Requested: {drug_order.quantity})",
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent")
                )
                db.add(audit_log)
                db.commit()
                
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for drug {drug.name}. Available: {stock.quantity}, Requested: {drug_order.quantity}"
                )

            price = drug_order.price if drug_order.price is not None else drug.price
            total_price += round(Decimal(str(price)) * Decimal(str(drug_order.quantity)), 2)

            stock.quantity -= drug_order.quantity
            db.commit()

            drugs_processed.append({
                "name": drug.name,
                "quantity": drug_order.quantity,
                "price": str(price)
            })

            drug_orders_list.append({
                "drug_id": drug_order.drug_id,
                "drug_name": drug.name,
                "quantity": drug_order.quantity,
                "price": float(price)
            })

        # Create new pharmacy record
        new_record = PharmacyRecord(
            patient_id=patient_id,
            medication_name=pharmacy.medication_name,
            dosage_and_route=pharmacy.dosage_and_route,
            frequency=pharmacy.frequency,
            dispensation_date=pharmacy.dispensation_date,
            billing_id=billing.billing_id,
            drug_orders=drug_orders_list,
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # Update billing
        billing.amount = (billing.amount or Decimal("0.00")) + total_price
        db.commit()

        # Fixed f-string syntax for drug list
        drug_list = ", ".join([f"{d['name']} (x{d['quantity']})" for d in drugs_processed])
        audit_log = AuditLog(
            action="pharmacy_record_created",
            user_id=current_user.id,
            description=(
                f"Dispensed {len(drugs_processed)} medications for patient {patient_id}. "
                f"Total amount: {total_price}. Drugs: {drug_list}"
            ),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return new_record

    except SQLAlchemyError as e:
        db.rollback()
        audit_log = AuditLog(
            action="pharmacy_record_error",
            user_id=current_user.id,
            description=f"Database error while creating pharmacy record: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Database error while creating pharmacy record: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the request."
        )

    except Exception as e:
        db.rollback()
        audit_log = AuditLog(
            action="pharmacy_record_error",
            user_id=current_user.id,
            description=f"Unexpected error while creating pharmacy record: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

# 3. Get Pharmacy History for Patient
@router.get("/patients/{patient_id}/pharmacy", response_model=List[PharmacyOut])
def get_pharmacy_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    patient = get_patient(patient_id, db)
    records = db.query(PharmacyRecord).filter(PharmacyRecord.patient_id == patient_id).all()

    for record in records:
        if record.drug_orders is None:
            record.drug_orders = []  # Ensure drug_orders is always a list
        
        # Convert dispensation_date to date if it's a datetime
        if isinstance(record.dispensation_date, datetime):
            record.dispensation_date = record.dispensation_date.date()

    return records if records else []

# 4. Update Pharmacy Record
@router.put("/patients/{patient_id}/pharmacy/{record_id}", response_model=PharmacyOut)
def update_pharmacy_record(
    patient_id: str,
    record_id: int,
    pharmacy: PharmacyRecordUpdate,
    db: Session = Depends(get_db)
):
    patient = get_patient(patient_id, db)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")

    record = get_pharmacy_record(record_id, patient_id, db)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pharmacy record with ID {record_id} not found for this patient.")

    # Update pharmacy record fields
    for key, value in pharmacy.dict(exclude_unset=True).items():
        setattr(record, key, value)

    try:
        db.commit()
        db.refresh(record)
        return record
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while updating the pharmacy record.")

# 5. Delete Pharmacy Record
# 5. Delete Pharmacy Record
@router.delete("/patients/{patient_id}/pharmacy/{record_id}", status_code=204)
def delete_pharmacy_record(
    patient_id: str,
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a pharmacy record with audit logging"""
    try:
        # Retrieve patient and record
        patient = get_patient(patient_id, db)
        record = get_pharmacy_record(record_id, patient_id, db)

        # Log the record details before deletion
        drug_list = ", ".join([f"{d['drug_name']} (x{d['quantity']})" for d in record.drug_orders]) if record.drug_orders else "No drugs"
        
        # Delete the record
        db.delete(record)
        db.commit()

        # Create audit log
        audit_log = AuditLog(
            action="pharmacy_record_deleted",
            user_id=current_user.id,
            description=(
                f"Deleted pharmacy record {record_id} for patient {patient_id}. "
                f"Medication: {record.medication_name}. Drugs: {drug_list}"
            ),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except SQLAlchemyError as e:
        db.rollback()
        audit_log = AuditLog(
            action="pharmacy_record_delete_error",
            user_id=current_user.id,
            description=f"Database error while deleting pharmacy record {record_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Database error while deleting pharmacy record: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the request."
        )

    except Exception as e:
        db.rollback()
        audit_log = AuditLog(
            action="pharmacy_record_delete_error",
            user_id=current_user.id,
            description=f"Unexpected error while deleting pharmacy record {record_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.error(f"Unexpected error while deleting pharmacy record: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

# 6. Get All Drugs
@router.get("/drugs", response_model=List[DrugOut])
def get_all_drugs(db: Session = Depends(get_db)):
    drugs = db.query(Drug).all()
    if not drugs:
        logger.warning("No drugs found in the database")
        raise HTTPException(status_code=404, detail="No drugs found")
    return drugs

# 7. Mark Pharmacy Record as Paid (Cannot Be Undone)
@router.patch("/patients/{patient_id}/pharmacy/{record_id}/mark-as-paid", response_model=PharmacyOut)
def mark_pharmacy_record_as_paid(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    record = get_pharmacy_record(record_id, patient_id, db)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pharmacy record {record_id} not found")

    if record.is_paid:
        logger.warning(f"Pharmacy record {record_id} is already marked as paid")
        raise HTTPException(status_code=400, detail="Pharmacy record is already marked as paid and cannot be undone.")

    record.is_paid = True
    db.commit()
    db.refresh(record)

    return record

# 8. Download Receipt (Updated with better formatting and drug name)
def generate_receipt_pdf(record, patient, db: Session, logo_url="https://emr-5esm.vercel.app/renewal.png"):
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
        content.append(Paragraph("Pharmacy Receipt", styles['Title']))

    content.append(Spacer(1, 12))

    # Add a title
    title = Paragraph("Pharmacy Receipt", styles['Title'])
    content.append(title)
    content.append(Spacer(1, 12))

    # Add patient and record details
    patient_details = [
        f"Patient: {patient.surname}, {patient.other_names}",
        f"Medication: {record.medication_name}",
        f"Dosage and Route: {record.dosage_and_route}",
        f"Frequency: {record.frequency}",
        f"Dispensation Date: {record.dispensation_date}",
    ]
    for detail in patient_details:
        content.append(Paragraph(detail, styles['BodyText']))
        content.append(Spacer(1, 6))

    # Add a table for drug orders
    drug_orders = [["Drug Name", "Quantity", "Price"]]
    for order in record.drug_orders:
        # Ensure drug_name exists in the order
        if "drug_name" not in order:
            drug = get_drug(order["drug_id"], db)
            order["drug_name"] = drug.name  # Fetch drug name from the database

        drug_orders.append([order["drug_name"], order["quantity"], f"NGN{order['price']:.2f}"])

    table = Table(drug_orders)
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

    # Add total cost
    total_cost = sum(order["price"] * order["quantity"] for order in record.drug_orders)
    total_cost_paragraph = Paragraph(f"Total Cost: NGN{total_cost:.2f}", styles['BodyText'])
    content.append(Spacer(1, 12))
    content.append(total_cost_paragraph)

    # Add a footer
    footer = Paragraph("Thank you for choosing our pharmacy. For inquiries, contact support@example.com.", styles['Italic'])
    content.append(Spacer(1, 12))
    content.append(footer)

    # Build the PDF
    pdf.build(content)

    # Return the PDF as bytes
    buffer.seek(0)
    return buffer.getvalue()

@router.get("/patients/{patient_id}/pharmacy/{record_id}/download-receipt")
def download_receipt(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    record = get_pharmacy_record(record_id, patient_id, db)
    if not record.is_paid:
        logger.warning(f"Pharmacy record {record_id} is not paid. Cannot generate receipt.")
        raise HTTPException(status_code=400, detail="Pharmacy record is not paid. Cannot generate receipt.")

    patient = get_patient(patient_id, db)

    # Generate the PDF
    pdf_bytes = generate_receipt_pdf(record, patient, db)

    # Prepare the response
    headers = {
        "Content-Disposition": f"attachment; filename=receipt_{record.pharmacy_id}.pdf",
        "Content-Type": "application/pdf",
    }
    return Response(pdf_bytes, headers=headers)


# 9. Process Walk-in Sale
class WalkInOrder(BaseModel):
    drug_orders: List[DrugOrder]
    customer_name: Optional[str] = "Walk-in Customer"

@router.post("/walkin-sale", response_class=Response)
def process_walkin_sale(
    order: WalkInOrder,
    db: Session = Depends(get_db)
):
    # Generate temporary IDs
    pharmacy_id = f"WALKIN-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=8))}"

    # Process drug orders
    drug_orders_list = []
    total_price = Decimal("0.00")
    receipt_items = []

    try:
        for drug_order in order.drug_orders:
            drug = get_drug(drug_order.drug_id, db)
            stock = get_stock(drug_order.drug_id, db)

            # Check if sufficient stock is available
            if stock.quantity < drug_order.quantity:
                logger.error(f"Insufficient stock for drug {drug.name}. Available: {stock.quantity}, Requested: {drug_order.quantity}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for drug {drug.name}. Available: {stock.quantity}, Requested: {drug_order.quantity}"
                )

            # Use provided price or fetch from Drug model
            price = drug_order.price if drug_order.price is not None else drug.price

            # Calculate total price for this drug order
            item_total = round(Decimal(str(price)) * Decimal(str(drug_order.quantity)), 2)
            total_price += item_total

            # Reduce stock quantity (this will be committed if everything succeeds)
            stock.quantity -= drug_order.quantity

            # Add to receipt items
            receipt_items.append({
                "name": drug.name,
                "quantity": drug_order.quantity,
                "unit_price": float(price),
                "total": float(item_total)
            })

            # Add drug order to the list (for potential rollback)
            drug_orders_list.append({
                "drug_id": drug_order.drug_id,
                "drug_name": drug.name,
                "quantity": drug_order.quantity,
                "price": float(price)
            })

        # Commit all stock deductions at once
        db.commit()

        # Generate receipt PDF
        pdf_bytes = generate_walkin_receipt(
            pharmacy_id=pharmacy_id,
            invoice_number=invoice_number,
            customer_name=order.customer_name,
            items=receipt_items,
            total=float(total_price)
        )

        # Prepare the response
        headers = {
            "Content-Disposition": f"attachment; filename=receipt_{pharmacy_id}.pdf",
            "Content-Type": "application/pdf",
        }
        return Response(pdf_bytes, headers=headers)

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing walk-in sale: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_walkin_receipt(pharmacy_id: str, invoice_number: str, customer_name: str, items: list, total: float, logo_url="http://localhost:3000/renewal.png"):
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
        content.append(Paragraph("Pharmacy Receipt", styles['Title']))

    content.append(Spacer(1, 12))

    # Add receipt title and info
    title = Paragraph("PHARMACY RECEIPT (WALK-IN SALE)", styles['Title'])
    content.append(title)
    content.append(Spacer(1, 12))

    # Add receipt details
    details = [
        f"Receipt ID: {pharmacy_id}",
        f"Invoice Number: {invoice_number}",
        f"Customer: {customer_name}",
        f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    ]
    for detail in details:
        content.append(Paragraph(detail, styles['BodyText']))
        content.append(Spacer(1, 6))

    content.append(Spacer(1, 12))

    # Add items table
    table_data = [["Item", "Qty", "Unit Price", "Total"]]
    for item in items:
        table_data.append([
            item["name"],
            str(item["quantity"]),
            f"NGN{item['unit_price']:.2f}",
            f"NGN{item['total']:.2f}"
        ])

    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    content.append(table)
    content.append(Spacer(1, 12))

    # Add total
    total_paragraph = Paragraph(f"TOTAL: NGN{total:.2f}", styles['Heading2'])
    content.append(total_paragraph)
    content.append(Spacer(1, 24))

    # Add footer
    footer = Paragraph("Thank you for your purchase! This is a walk-in sale receipt.", styles['Italic'])
    content.append(footer)

    # Build PDF
    pdf.build(content)
    buffer.seek(0)
    return buffer.getvalue()

