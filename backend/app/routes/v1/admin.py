import logging
from fastapi import APIRouter, HTTPException, Depends, Query, status, Request
from pydantic import ValidationError

from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.exc import SQLAlchemyError
from app.models import User, Role, Doctor, Staff, Nurse, Drug, Stock, AuditLog
from app.schemas import (
    UserCreate, UserUpdate, UserOut, PasswordChange,
    RoleCreate, RoleUpdate, RoleOut,
    DoctorCreate, DoctorUpdate, DoctorOut,
    StaffCreate, StaffUpdate, StaffOut,
    NurseCreate, NurseUpdate, NurseOut, UserLogin,
    DrugOut, DrugCreate, DrugUpdate, StockResponse, StockUpdate
)
from app.database import get_db
from typing import List, Optional
from passlib.context import CryptContext
import jwt

# Setup Logger
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

SECRET_KEY = "c32e9134f171b28da8a664ba9fb46d23fdb5bc21f4b6ff040c24db71bd5777d7"
ALGORITHM = "HS256"

router = APIRouter()

# Initialize the password hashing context
# Initialize the password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/admin/v1/auth/login")

# Function to hash a password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Helper function to handle database errors
def handle_db_error(e: Exception, action: str):
    logger.error(f"Database error during {action}: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Helper function to handle generic errors
def handle_generic_error(e: Exception, action: str):
    logger.error(f"Error during {action}: {str(e)}")
    raise HTTPException(status_code=400, detail=f"Error during {action}: {str(e)}")

# Function to create JWT token
def create_access_token(data: dict):
    to_encode = data.copy()
    # Set expiration time (e.g., 1 hour)
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp": expire})
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Function to decode JWT token
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Dependency to get the current user from the JWT token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Login Endpoint
@router.post("/v1/auth/login")
def login(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    # Fetch the user from the database
    db_user = db.query(User).filter(User.username == user.username).first()

    # Check if the user exists and the password is correct
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        # Log failed login attempt
        audit_log = AuditLog(
            action="login_failed",
            user_id=db_user.id if db_user else None,
            description=f"Failed login attempt for username: {user.username}",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Extract role names properly
    roles = [role.name for role in db_user.roles]

    # Generate JWT token
    user_data = {
        "sub": db_user.username,
        "roles": roles,
        "id": db_user.id,
    }
    access_token = create_access_token(data=user_data)

    # Log successful login
    audit_log = AuditLog(
        action="login_success",
        user_id=db_user.id,
        description=f"User logged in successfully",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    db.commit()

    # Return response with token
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "full_name": db_user.full_name,
            "roles": roles,
        },
    }

# Password Change Endpoint
@router.put("/users/change-password")
def change_password(
    password_data: PasswordChange,
    request: Request,  # Move this up
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        logger.info(f"Attempting to change password for user: {current_user.username}")
        
        # Verify the current password
        if not current_user.verify_password(password_data.current_password):
            # Log failed password change attempt
            audit_log = AuditLog(
                action="password_change_failed",
                user_id=current_user.id,
                description="Incorrect current password provided",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
            db.add(audit_log)
            db.commit()
            
            logger.warning(f"Failed password change attempt for user: {current_user.username}")
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Validate the new password
        if len(password_data.new_password) < 8:
            # Log invalid new password attempt
            audit_log = AuditLog(
                action="password_change_rejected",
                user_id=current_user.id,
                description="New password too short (less than 8 characters)",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
            db.add(audit_log)
            db.commit()
            
            logger.warning(f"New password too short for user: {current_user.username}")
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")

        # Update the password
        current_user.set_password(password_data.new_password)
        
        # Log successful password change
        audit_log = AuditLog(
            action="password_changed",
            user_id=current_user.id,
            description="Password changed successfully",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        logger.info(f"Password successfully changed for user: {current_user.username}")

        return {"message": "Password changed successfully"}
    except ValidationError as e:
        logger.error(f"Validation error: {e.errors()}")
        raise HTTPException(status_code=422, detail=e.errors())
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# USERS
@router.post("/users/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if the user already exists
        existing_user = db.query(User).filter(User.username == user.username).first()
        if existing_user:
            logger.warning(f"User with username {user.username} already exists")
            raise HTTPException(status_code=400, detail="Username already exists")

        # Create a new User instance
        db_user = User(
            username=user.username,
            full_name=user.full_name,
            email=user.email,
        )

        # Hash the password
        db_user.set_password(user.password)

        # Fetch roles by their IDs and assign them to the user
        roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
        if not roles:
            logger.warning(f"Roles with IDs {user.role_ids} not found")
            raise HTTPException(status_code=404, detail="Roles not found")

        db_user.roles = roles

        # Add user to the database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"User {user.username} created successfully")
        return UserOut.from_orm(db_user)
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/users/", response_model=List[UserOut])
def get_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        return [UserOut.from_orm(user) for user in users]
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Get Current User Details
@router.get("/users/me", response_model=UserOut)
def get_current_user_details(current_user: User = Depends(get_current_user)):
    logger.info(f"Fetching details for user: {current_user.username} (ID: {current_user.id})")
    return current_user

@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User with ID {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")
        return UserOut.from_orm(user)
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            logger.warning(f"User with ID {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")

        # Update user fields
        for key, value in user.dict(exclude_unset=True).items():
            setattr(db_user, key, value)

        # Update the roles if provided
        if user.role_ids:
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
            if not roles:
                logger.warning(f"Roles with IDs {user.role_ids} not found")
                raise HTTPException(status_code=404, detail="Roles not found")
            db_user.roles = roles

        db.commit()
        db.refresh(db_user)
        return UserOut.from_orm(db_user)
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            logger.warning(f"User with ID {user_id} not found for deletion")
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(db_user)
        db.commit()
        logger.info(f"User with ID {user_id} deleted successfully")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ------------------------------
# Drug Management
# ------------------------------

# Create a Drug and its Stock
@router.post("/v1/admin/drugs/", response_model=DrugOut)
def create_drug(drug: DrugCreate, db: Session = Depends(get_db)):
    try:
        # Convert is_active from boolean to int before creating the Drug
        drug_data = drug.dict()
        if 'is_active' in drug_data:
            drug_data['is_active'] = 1 if drug_data['is_active'] else 0

        db_drug = Drug(**drug_data)
        db.add(db_drug)
        db.commit()
        db.refresh(db_drug)

        # Initialize stock for the drug (if needed)
        db_stock = Stock(
            drug_id=db_drug.id,
            quantity=0,  # default initial stock quantity
            last_updated=datetime.utcnow()
        )
        db.add(db_stock)
        db.commit()

        return DrugOut.from_orm(db_drug)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating drug: {str(e)}")


# Get all Drugs with Total Stock Information
@router.get("/v1/admin/drugs/", response_model=List[DrugOut])
def get_drugs(db: Session = Depends(get_db)):
    try:
        # Fetch drugs and their total stock in one optimized query
        drugs = (
            db.query(
                Drug,
                func.coalesce(func.sum(Stock.quantity), 0).label("total_stock")  # Calculate total stock
            )
            .outerjoin(Stock, Drug.id == Stock.drug_id)  # Join with Stock table
            .group_by(Drug.id)
            .all()
        )

        # Format results properly
        drugs_with_stock = [
            DrugOut(
                id=drug.id,
                name=drug.name,
                description=drug.description,
                dosage=drug.dosage,
                instructions=drug.instructions,
                prescribed_date=drug.prescribed_date,
                price=drug.price,
                is_active=bool(drug.is_active),
                expiration_date=drug.expiration_date,
                total_stock=total_stock  # Computed dynamically
            )
            for drug, total_stock in drugs
        ]

        return drugs_with_stock

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Update Drug and Stock
@router.put("/v1/admin/drugs/{drug_id}", response_model=DrugOut)
def update_drug(drug_id: int, drug: DrugUpdate, db: Session = Depends(get_db)):
    try:
        db_drug = db.query(Drug).filter(Drug.id == drug_id).first()
        if not db_drug:
            raise HTTPException(status_code=404, detail="Drug not found")
        for key, value in drug.dict(exclude_unset=True).items():
            setattr(db_drug, key, value)
        db.commit()
        db.refresh(db_drug)
        return DrugOut.from_orm(db_drug)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating drug: {str(e)}")


# Delete a Drug (Stock is automatically deleted due to CASCADE)
@router.delete("/v1/admin/drugs/{drug_id}", status_code=204)
def delete_drug(drug_id: int, db: Session = Depends(get_db)):
    try:
        db_drug = db.query(Drug).filter(Drug.id == drug_id).first()
        if not db_drug:
            raise HTTPException(status_code=404, detail="Drug not found")
        db.delete(db_drug)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting drug: {str(e)}")


# New Endpoint: Update Stock Levels for a Drug
@router.patch("/v1/admin/drugs/{drug_id}/stock", response_model=StockResponse)
def update_stock(drug_id: int, stock_update: StockUpdate, db: Session = Depends(get_db)):
    try:
        # Retrieve the existing stock record for the given drug
        db_stock = db.query(Stock).filter(Stock.drug_id == drug_id).first()
        
        if not db_stock:
            raise HTTPException(status_code=404, detail="Stock not found for given drug")

        # If the stock_update contains a quantity, increment the current stock quantity by the new quantity
        if stock_update.quantity:
            db_stock.quantity += stock_update.quantity  # Increment the stock

        # Update the last_updated field to current time
        db_stock.last_updated = datetime.utcnow()

        # Commit changes to the database
        db.commit()
        db.refresh(db_stock)

        return db_stock  # StockResponse will use orm_mode to serialize the object
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating stock: {str(e)}")


# Sell Drug
@router.patch("/v1/admin/drugs/{drug_id}/sell", response_model=StockResponse)
def sell_drug(drug_id: int, stock_update: StockUpdate, db: Session = Depends(get_db)):
    try:
        # Retrieve the existing stock record for the given drug
        db_stock = db.query(Stock).filter(Stock.drug_id == drug_id).first()
        
        if not db_stock:
            raise HTTPException(status_code=404, detail="Stock not found for given drug")
        
        # Check if there is enough stock to sell
        if db_stock.quantity < stock_update.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock to sell")
        
        # Decrease the stock by the quantity sold
        db_stock.quantity -= stock_update.quantity

        # Update the last_updated field to current time
        db_stock.last_updated = datetime.utcnow()

        # Commit changes to the database
        db.commit()
        db.refresh(db_stock)

        return db_stock  # Return the updated stock

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error selling drug: {str(e)}")

# ROLES
@router.post("/roles/", response_model=RoleOut)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    try:
        db_role = Role(**role.dict())
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return RoleOut.from_orm(db_role)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "creating role")
    except Exception as e:
        handle_generic_error(e, "creating role")

@router.get("/roles/", response_model=List[RoleOut])
def get_roles(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    try:
        roles = db.query(Role).offset(skip).limit(limit).all()
        return [RoleOut.from_orm(role) for role in roles]
    except SQLAlchemyError as e:
        handle_db_error(e, "fetching roles")
    except Exception as e:
        handle_generic_error(e, "fetching roles")

@router.get("/roles/{role_id}", response_model=RoleOut)
def get_role(role_id: int, db: Session = Depends(get_db)):
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            logger.warning(f"Role with ID {role_id} not found")
            raise HTTPException(status_code=404, detail="Role not found")
        return RoleOut.from_orm(role)
    except SQLAlchemyError as e:
        handle_db_error(e, f"fetching role by ID {role_id}")
    except Exception as e:
        handle_generic_error(e, f"fetching role by ID {role_id}")

@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(role_id: int, role: RoleUpdate, db: Session = Depends(get_db)):
    try:
        db_role = db.query(Role).filter(Role.id == role_id).first()
        if not db_role:
            logger.warning(f"Role with ID {role_id} not found")
            raise HTTPException(status_code=404, detail="Role not found")
        for key, value in role.dict(exclude_unset=True).items():
            setattr(db_role, key, value)
        db.commit()
        db.refresh(db_role)
        return RoleOut.from_orm(db_role)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "updating role")
    except Exception as e:
        handle_generic_error(e, "updating role")

@router.delete("/roles/{role_id}", status_code=204)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    try:
        db_role = db.query(Role).filter(Role.id == role_id).first()
        if not db_role:
            logger.warning(f"Role with ID {role_id} not found")
            raise HTTPException(status_code=404, detail="Role not found")
        db.delete(db_role)
        db.commit()
        logger.info(f"Role with ID {role_id} deleted successfully")
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "deleting role")
    except Exception as e:
        handle_generic_error(e, "deleting role")


# DOCTORS
@router.post("/doctors/", response_model=DoctorOut)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    try:
        db_doctor = Doctor(**doctor.dict())
        db.add(db_doctor)
        db.commit()
        db.refresh(db_doctor)
        return DoctorOut.from_orm(db_doctor)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "creating doctor")
    except Exception as e:
        handle_generic_error(e, "creating doctor")

@router.get("/doctors/", response_model=List[DoctorOut])
def get_doctors(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    try:
        doctors = db.query(Doctor).offset(skip).limit(limit).all()
        return [DoctorOut.from_orm(doctor) for doctor in doctors]
    except SQLAlchemyError as e:
        handle_db_error(e, "fetching doctors")
    except Exception as e:
        handle_generic_error(e, "fetching doctors")

@router.get("/doctors/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    try:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            logger.warning(f"Doctor with ID {doctor_id} not found")
            raise HTTPException(status_code=404, detail="Doctor not found")
        return DoctorOut.from_orm(doctor)
    except SQLAlchemyError as e:
        handle_db_error(e, f"fetching doctor by ID {doctor_id}")
    except Exception as e:
        handle_generic_error(e, f"fetching doctor by ID {doctor_id}")

@router.put("/doctors/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, doctor: DoctorUpdate, db: Session = Depends(get_db)):
    try:
        db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not db_doctor:
            logger.warning(f"Doctor with ID {doctor_id} not found")
            raise HTTPException(status_code=404, detail="Doctor not found")
        for key, value in doctor.dict(exclude_unset=True).items():
            setattr(db_doctor, key, value)
        db.commit()
        db.refresh(db_doctor)
        return DoctorOut.from_orm(db_doctor)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "updating doctor")
    except Exception as e:
        handle_generic_error(e, "updating doctor")

@router.delete("/doctors/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    try:
        db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not db_doctor:
            logger.warning(f"Doctor with ID {doctor_id} not found")
            raise HTTPException(status_code=404, detail="Doctor not found")
        db.delete(db_doctor)
        db.commit()
        logger.info(f"Doctor with ID {doctor_id} deleted successfully")
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "deleting doctor")
    except Exception as e:
        handle_generic_error(e, "deleting doctor")


# STAFF
@router.post("/staff/", response_model=StaffOut)
def create_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    try:
        db_staff = Staff(**staff.dict())
        db.add(db_staff)
        db.commit()
        db.refresh(db_staff)
        return StaffOut.from_orm(db_staff)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "creating staff")
    except Exception as e:
        handle_generic_error(e, "creating staff")

@router.get("/staff/", response_model=List[StaffOut])
def get_staff(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    try:
        staff = db.query(Staff).offset(skip).limit(limit).all()
        return [StaffOut.from_orm(staff_member) for staff_member in staff]
    except SQLAlchemyError as e:
        handle_db_error(e, "fetching staff")
    except Exception as e:
        handle_generic_error(e, "fetching staff")

@router.get("/staff/{staff_id}", response_model=StaffOut)
def get_staff_member(staff_id: int, db: Session = Depends(get_db)):
    try:
        staff_member = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff_member:
            logger.warning(f"Staff with ID {staff_id} not found")
            raise HTTPException(status_code=404, detail="Staff not found")
        return StaffOut.from_orm(staff_member)
    except SQLAlchemyError as e:
        handle_db_error(e, f"fetching staff by ID {staff_id}")
    except Exception as e:
        handle_generic_error(e, f"fetching staff by ID {staff_id}")

@router.put("/staff/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: int, staff: StaffUpdate, db: Session = Depends(get_db)):
    try:
        db_staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not db_staff:
            logger.warning(f"Staff with ID {staff_id} not found")
            raise HTTPException(status_code=404, detail="Staff not found")
        for key, value in staff.dict(exclude_unset=True).items():
            setattr(db_staff, key, value)
        db.commit()
        db.refresh(db_staff)
        return StaffOut.from_orm(db_staff)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "updating staff")
    except Exception as e:
        handle_generic_error(e, "updating staff")

@router.delete("/staff/{staff_id}", status_code=204)
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    try:
        db_staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not db_staff:
            logger.warning(f"Staff with ID {staff_id} not found")
            raise HTTPException(status_code=404, detail="Staff not found")
        db.delete(db_staff)
        db.commit()
        logger.info(f"Staff with ID {staff_id} deleted successfully")
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "deleting staff")
    except Exception as e:
        handle_generic_error(e, "deleting staff")

# NURSES
@router.post("/nurses/", response_model=NurseOut)
def create_nurse(nurse: NurseCreate, db: Session = Depends(get_db)):
    try:
        db_nurse = Nurse(**nurse.dict())
        db.add(db_nurse)
        db.commit()
        db.refresh(db_nurse)
        return NurseOut.from_orm(db_nurse)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "creating nurse")
    except Exception as e:
        handle_generic_error(e, "creating nurse")

@router.get("/nurses/", response_model=List[NurseOut])
def get_nurses(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    try:
        nurses = db.query(Nurse).offset(skip).limit(limit).all()
        return [NurseOut.from_orm(nurse) for nurse in nurses]
    except SQLAlchemyError as e:
        handle_db_error(e, "fetching nurses")
    except Exception as e:
        handle_generic_error(e, "fetching nurses")

@router.get("/nurses/{nurse_id}", response_model=NurseOut)
def get_nurse(nurse_id: int, db: Session = Depends(get_db)):
    try:
        nurse = db.query(Nurse).filter(Nurse.id == nurse_id).first()
        if not nurse:
            logger.warning(f"Nurse with ID {nurse_id} not found")
            raise HTTPException(status_code=404, detail="Nurse not found")
        return NurseOut.from_orm(nurse)
    except SQLAlchemyError as e:
        handle_db_error(e, f"fetching nurse by ID {nurse_id}")
    except Exception as e:
        handle_generic_error(e, f"fetching nurse by ID {nurse_id}")

@router.put("/nurses/{nurse_id}", response_model=NurseOut)
def update_nurse(nurse_id: int, nurse: NurseUpdate, db: Session = Depends(get_db)):
    try:
        db_nurse = db.query(Nurse).filter(Nurse.id == nurse_id).first()
        if not db_nurse:
            logger.warning(f"Nurse with ID {nurse_id} not found")
            raise HTTPException(status_code=404, detail="Nurse not found")
        for key, value in nurse.dict(exclude_unset=True).items():
            setattr(db_nurse, key, value)
        db.commit()
        db.refresh(db_nurse)
        return NurseOut.from_orm(db_nurse)
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "updating nurse")
    except Exception as e:
        handle_generic_error(e, "updating nurse")

@router.delete("/nurses/{nurse_id}", status_code=204)
def delete_nurse(nurse_id: int, db: Session = Depends(get_db)):
    try:
        db_nurse = db.query(Nurse).filter(Nurse.id == nurse_id).first()
        if not db_nurse:
            logger.warning(f"Nurse with ID {nurse_id} not found")
            raise HTTPException(status_code=404, detail="Nurse not found")
        db.delete(db_nurse)
        db.commit()
        logger.info(f"Nurse with ID {nurse_id} deleted successfully")
    except SQLAlchemyError as e:
        db.rollback()
        handle_db_error(e, "deleting nurse")
    except Exception as e:
        handle_generic_error(e, "deleting nurse")

