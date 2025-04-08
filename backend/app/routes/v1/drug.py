from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel, validator
import logging
from .admin import get_current_user 

# Import models and schemas
from app.models import Drug, Stock, User, AuditLog
from app.schemas import DrugCreate, DrugUpdate, DrugOut, StockUpdate, StockResponse
from app.database import get_db

# Initialize logging
logger = logging.getLogger(__name__)

router = APIRouter()

# ------------------------------
# Helper Functions
# ------------------------------

def is_drug_expired(expiration_date: datetime) -> bool:
    """Check if a drug is expired."""
    return expiration_date < datetime.now()

def validate_expiration_date(expiration_date: datetime):
    """Validate that the expiration date is not in the past."""
    if expiration_date < datetime.now():
        raise HTTPException(status_code=400, detail="Expiration date cannot be in the past.")

def handle_database_error(error: Exception, operation: str, resource_id: Optional[int] = None):
    """Handle database errors and log them."""
    logger.error(f"Database error occurred during {operation} for drug {resource_id}: {str(error)}")
    raise HTTPException(status_code=500, detail="Database error occurred")

def get_drug_by_id(db: Session, drug_id: int) -> Drug:
    """Retrieve a drug by its ID or raise a 404 error if not found."""
    db_drug = db.query(Drug).filter(Drug.id == drug_id).first()
    if not db_drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return db_drug

def get_stock_by_drug_id(db: Session, drug_id: int) -> Stock:
    """Retrieve stock for a drug by its ID or raise a 404 error if not found."""
    db_stock = db.query(Stock).filter(Stock.drug_id == drug_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock not found for given drug")
    return db_stock

# ------------------------------
# Drug Management Endpoints
# ------------------------------

# Create a Drug and its Stock with Audit Logging
@router.post("/v1/admin/drugs/", response_model=DrugOut)
def create_drug(
    drug: DrugCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new drug and its stock with audit logging"""
    try:
        # Validate expiration date
        validate_expiration_date(drug.expiration_date)

        # Convert is_active from boolean to int (if needed)
        drug_data = drug.dict()
        if 'is_active' in drug_data:
            drug_data['is_active'] = 1 if drug_data['is_active'] else 0

        # Create the drug
        db_drug = Drug(**drug_data)
        db.add(db_drug)
        db.commit()
        db.refresh(db_drug)

        # Initialize stock for the drug
        db_stock = Stock(
            drug_id=db_drug.id,
            quantity=0,  # Default initial stock quantity
            last_updated=datetime.utcnow()
        )
        db.add(db_stock)
        db.commit()

        # Log successful creation
        audit_log = AuditLog(
            action="drug_created",
            user_id=current_user.id,
            description=f"Created drug {db_drug.name} (ID: {db_drug.id})",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return DrugOut.from_orm(db_drug)
    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="drug_creation_error",
            user_id=current_user.id,
            description=f"Database error while creating drug: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        handle_database_error(e, "create")
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="drug_creation_error",
            user_id=current_user.id,
            description=f"Unexpected error while creating drug: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        logger.error(f"Unexpected error while creating drug: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error creating drug: {str(e)}")

# Update Drug with Audit Logging
@router.put("/drugs/{drug_id}", response_model=DrugOut)
def update_drug(
    drug_id: int, 
    drug: DrugUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a drug with audit logging"""
    try:
        db_drug = get_drug_by_id(db, drug_id)
        
        # Capture original values for audit log
        original_values = {
            "name": db_drug.name,
            "is_active": db_drug.is_active,
            "expiration_date": db_drug.expiration_date
        }
        
        # Update only the fields that are passed in the request
        update_data = drug.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_drug, key, value)

        # Check expiration date after update
        if is_drug_expired(db_drug.expiration_date):
            db_drug.is_active = False
            logger.info(f"Drug {db_drug.name} (ID: {drug_id}) is expired and marked as inactive.")

        db.commit()
        db.refresh(db_drug)

        # Prepare changes description for audit log
        changes = []
        for field, original_value in original_values.items():
            if field in update_data and original_value != getattr(db_drug, field):
                changes.append(f"{field}: {original_value} → {getattr(db_drug, field)}")

        # Log successful update
        audit_log = AuditLog(
            action="drug_updated",
            user_id=current_user.id,
            description=f"Updated drug {db_drug.name} (ID: {drug_id}). Changes: {', '.join(changes)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return DrugOut.from_orm(db_drug)
    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="drug_update_error",
            user_id=current_user.id,
            description=f"Database error while updating drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        handle_database_error(e, "update", drug_id)
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="drug_update_error",
            user_id=current_user.id,
            description=f"Unexpected error while updating drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        logger.error(f"Unexpected error while updating drug {drug_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error updating drug: {str(e)}")

# Delete a Drug with Audit Logging
@router.delete("/drugs/{drug_id}", status_code=204)
def delete_drug(
    drug_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a drug with audit logging"""
    try:
        db_drug = get_drug_by_id(db, drug_id)
        drug_name = db_drug.name
        
        db.delete(db_drug)
        db.commit()

        # Log successful deletion
        audit_log = AuditLog(
            action="drug_deleted",
            user_id=current_user.id,
            description=f"Deleted drug {drug_name} (ID: {drug_id})",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        logger.info(f"Drug {drug_name} (ID: {drug_id}) deleted successfully.")
    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="drug_deletion_error",
            user_id=current_user.id,
            description=f"Database error while deleting drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        handle_database_error(e, "delete", drug_id)
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="drug_deletion_error",
            user_id=current_user.id,
            description=f"Unexpected error while deleting drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        logger.error(f"Unexpected error while deleting drug {drug_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error deleting drug: {str(e)}")

# Update Stock Levels with Audit Logging
@router.patch("/drugs/{drug_id}/stock", response_model=StockResponse)
def update_stock(
    drug_id: int,
    stock_update: StockUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update stock levels with audit logging"""
    try:
        db_stock = get_stock_by_drug_id(db, drug_id)
        drug = db.query(Drug).filter(Drug.id == drug_id).first()
        
        original_quantity = db_stock.quantity

        # Ensure stock quantity does not go below zero
        if stock_update.quantity and (db_stock.quantity + stock_update.quantity < 0):
            raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")

        # Update the stock quantity
        if stock_update.quantity:
            db_stock.quantity += stock_update.quantity

        # Update the last_updated field
        db_stock.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(db_stock)

        # Log stock update
        audit_log = AuditLog(
            action="stock_updated",
            user_id=current_user.id,
            description=f"Updated stock for {drug.name} (ID: {drug_id}). Quantity: {original_quantity} → {db_stock.quantity}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return db_stock
    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="stock_update_error",
            user_id=current_user.id,
            description=f"Database error while updating stock for drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        handle_database_error(e, "update stock", drug_id)
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="stock_update_error",
            user_id=current_user.id,
            description=f"Unexpected error while updating stock for drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        logger.error(f"Unexpected error while updating stock for drug {drug_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error updating stock: {str(e)}")

# Sell Drug with Audit Logging
@router.patch("/drugs/{drug_id}/sell", response_model=StockResponse)
def sell_drug(
    drug_id: int,
    stock_update: StockUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sell a drug with audit logging"""
    try:
        db_stock = get_stock_by_drug_id(db, drug_id)
        drug = db.query(Drug).filter(Drug.id == drug_id).first()
        original_quantity = db_stock.quantity

        # Check if there is enough stock to sell
        if db_stock.quantity < stock_update.quantity:
            # Log failed sale attempt
            audit_log = AuditLog(
                action="drug_sale_failed",
                user_id=current_user.id,
                description=f"Insufficient stock to sell {stock_update.quantity} of {drug.name} (ID: {drug_id}). Current stock: {db_stock.quantity}",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
            db.add(audit_log)
            db.commit()
            raise HTTPException(status_code=400, detail="Not enough stock to sell")

        # Decrease the stock quantity
        db_stock.quantity -= stock_update.quantity
        db_stock.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(db_stock)

        # Log successful sale
        audit_log = AuditLog(
            action="drug_sold",
            user_id=current_user.id,
            description=f"Sold {stock_update.quantity} of {drug.name} (ID: {drug_id}). Remaining stock: {db_stock.quantity}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        return db_stock
    except SQLAlchemyError as e:
        db.rollback()
        # Log database error
        audit_log = AuditLog(
            action="drug_sale_error",
            user_id=current_user.id,
            description=f"Database error while selling drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        handle_database_error(e, "sell drug", drug_id)
    except Exception as e:
        db.rollback()
        # Log unexpected error
        audit_log = AuditLog(
            action="drug_sale_error",
            user_id=current_user.id,
            description=f"Unexpected error while selling drug {drug_id}: {str(e)}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        logger.error(f"Unexpected error while selling drug {drug_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error selling drug: {str(e)}")