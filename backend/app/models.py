from sqlalchemy import Column, JSON, Integer, String, Date, DateTime, Float, ForeignKey, Text, DECIMAL, Numeric, Table, event, Enum, Boolean

from .enums import FeeTypeEnum, PaymentStatusEnum # Use relative import
from sqlalchemy.dialects.postgresql import ARRAY

from sqlalchemy.sql import func  # Import func for timestamps
from sqlalchemy.orm import relationship
from sqlalchemy.orm import validates
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from decimal import Decimal
from passlib.context import CryptContext
from app.database import Base  # This should be a single import point for the Base class
from sqlalchemy.dialects.postgresql import UUID
import uuid
import random
import string
import json

# Many-to-Many Association Table for User and Roles (Allowing multiple roles for each user)
user_role_association = Table(
    'user_role_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=True)

    # Many-to-many relationship with roles
    roles = relationship("Role", secondary=user_role_association, back_populates="users")

    # Relationships to other entities
    patient = relationship("Patient", back_populates="user", uselist=False)
    staff = relationship("Staff", back_populates="user", uselist=False)
    doctor = relationship("Doctor", back_populates="user", uselist=False)

    def set_password(self, password: str):
        """Hash the password before saving it."""
        self.password_hash = pwd_context.hash(password)

    def verify_password(self, password: str):
        """Verify the given password against the stored hash."""
        return pwd_context.verify(password, self.password_hash)

    def __repr__(self):
        return f"User(username={self.username}, full_name={self.full_name})"

# Many-to-Many Association Table for Patient and Drug
patient_drug_association = Table(
    'patient_drug_association', Base.metadata,
    Column('patient_id', Integer, ForeignKey('patients.id', ondelete="CASCADE"), primary_key=True),
    Column('drug_id', Integer, ForeignKey('drugs.id', ondelete="CASCADE"), primary_key=True)  # Fixed 'drug_id' to 'id'
)

class Nurse(Base):
    __tablename__ = 'nurses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), unique=True, nullable=True)
    # Relationship to Patients (One nurse can have many Patients)

    patients = relationship("Patient", back_populates="nurse")

# Define the Patient class
class Patient(Base):
    __tablename__ = 'patients'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Patient ID will be generated based on the id (auto-incremented)
    patient_id = Column(String, unique=True, nullable=False)
    
    # Hospital Registration Number will be generated based on id
    hospital_reg_number = Column(String, unique=True, nullable=True)
    
    # New column for consultation fee
    #consultation_fee = Column(Numeric(10, 2), default=Decimal('0.00'), nullable=True)

    source_of_info = Column(String, nullable=False)
    relationship_to_patient = Column(String, nullable=False)
    additional_info = Column(Text, nullable=True)
    surname = Column(String, nullable=False)
    other_names = Column(String, nullable=False)
    residential_address = Column(String, nullable=False)
    residential_phone = Column(String, nullable=False)
    business_address = Column(String, nullable=True)
    business_phone = Column(String, nullable=True)
    next_of_kin = Column(String, nullable=False)
    next_of_kin_address = Column(String, nullable=False)
    next_of_kin_residential_phone = Column(String, nullable=False)
    next_of_kin_business_phone = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=False)
    sex = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    marital_status = Column(String, nullable=False)
    legal_status = Column(String, nullable=False)
    present_occupation = Column(String, nullable=True)
    previous_occupation = Column(String, nullable=True)
    religion = Column(String, nullable=False)
    denomination = Column(String, nullable=True)
    contact_person_address = Column(String, nullable=True)
    contact_person_phone = Column(String, nullable=True)
    family_doctor_address = Column(String, nullable=True)
    family_doctor_phone = Column(String, nullable=True)

    # Foreign Key to User
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    user = relationship("User", back_populates="patient", uselist=False)

    # Foreign Key to Doctor
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=True)
    doctor = relationship("Doctor", back_populates="patients")

# Foreign Key to Nurse
    nurse_id = Column(Integer, ForeignKey('nurses.id'), nullable=True)
    nurse = relationship("Nurse", back_populates="patients")

    # Relationships to other records
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    bills = relationship("Billing", back_populates="patient", cascade="all, delete-orphan")
    mental_health_records = relationship("MentalHealthNote", back_populates="patient", cascade="all, delete-orphan")
    clinical_notes = relationship("ClinicalNote", back_populates="patient", cascade="all, delete-orphan")
    laboratory_records = relationship("LaboratoryRecord", back_populates="patient", cascade="all, delete-orphan")
    occupational_therapy_records = relationship("OccupationalTherapyRecord", back_populates="patient", cascade="all, delete-orphan")
    psychology_records = relationship("PsychologyRecord", back_populates="patient", cascade="all, delete-orphan")
    social_work_records = relationship("SocialWorkRecord", back_populates="patient", cascade="all, delete-orphan")
    #notifications = relationship("Notification", back_populates="patient", cascade="all, delete-orphan")

    pharmacy_records = relationship(
        "PharmacyRecord", 
        back_populates="patient", 
        foreign_keys="[PharmacyRecord.patient_id]",  
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"Patient(name={self.surname} {self.other_names}, doctor={self.doctor.user.full_name if self.doctor else 'None'})"

@event.listens_for(Patient, 'before_insert')
def generate_ids(mapper, connection, target):
    # Ensure patient_id and hospital_reg_number are set before the insert
    if not target.patient_id:  # If patient_id is not already set
        target.patient_id = generate_patient_id(target.id)
    
    if not target.hospital_reg_number:  # If hospital_reg_number is not set
        target.hospital_reg_number = generate_hospital_reg_number(target.id)

# Function to generate patient_id (Example)
def generate_patient_id(patient_id):
    # We can't use the patient_id during 'before_insert' as it's None. So we can use a fallback.
    # Example: Concatenate a random string with a prefix
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"PAT-{random_str}"  # Format without using target.id

# Function to generate hospital_reg_number (Example)
def generate_hospital_reg_number(patient_id):
    # Example: Generate a hospital registration number with a fallback logic.
    return f"REG-{random.randint(10000, 99999)}"  # Use a random number instead of patient_id


# Drug Model
class Drug(Base):
    __tablename__ = 'drugs'

    id = Column(Integer, primary_key=True, autoincrement=True)  
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)  
    dosage = Column(String, nullable=True)  
    instructions = Column(Text, nullable=True)  
    prescribed_date = Column(Date, nullable=True)  
    price = Column(Float, nullable=True)  
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive
    expiration_date = Column(Date, nullable=True)  

    # Relationship with Stock
    stock = relationship("Stock", back_populates="drug", uselist=False)

    def __repr__(self):
        return f"<Drug(name={self.name}, dosage={self.dosage}, prescribed_date={self.prescribed_date})>"

# Stock Model
class Stock(Base):
    __tablename__ = 'stock'

    id = Column(Integer, primary_key=True, autoincrement=True)
    drug_id = Column(Integer, ForeignKey('drugs.id', ondelete="CASCADE"), nullable=True)
    quantity = Column(Integer, nullable=False, default=0)  # Amount of this drug in stock
    last_updated = Column(DateTime, nullable=False)

    # Relationship with Drug
    drug = relationship("Drug", back_populates="stock")

    def is_available(self, requested_quantity):
        return self.quantity >= requested_quantity

class PharmacyRecord(Base):
    __tablename__ = 'pharmacy_records'

    pharmacy_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id', ondelete="CASCADE"), nullable=False)
    drug_id = Column(Integer, ForeignKey('drugs.id'), nullable=True)
    dosage_and_route = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    medication_name = Column(String, nullable=True)
    dispensation_date = Column(DateTime, nullable=True)
    screening_for_interactions = Column(Text, nullable=True)
    monitoring_for_adverse_effects = Column(Text, nullable=True)
    medications_reviewed_on_admission = Column(Text, nullable=True)
    medications_reviewed_on_discharge = Column(Text, nullable=True)
    drug_orders = Column(JSON, nullable=True, default=[])  # Ensure it's a JSON column
    prescriptions = Column(Text, nullable=True)
    is_paid = Column(Boolean, nullable=True, default=False)  # Optional with default

    drug = relationship("Drug")
    billing_id = Column(Integer, ForeignKey('billings.billing_id'), nullable=False)
    billing = relationship("Billing", back_populates="pharmacy_records", uselist=False)
    patient = relationship("Patient", back_populates="pharmacy_records", foreign_keys=[patient_id])

    @property
    def total_fee(self):
        """Calculate the total fee based on the billing record."""
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')

    def get_drug_orders(self):
        """Return drug_orders as a Python list."""
        return self.drug_orders or []

    @property
    def total_cost(self):
        """Calculate the total cost based on the drug_orders."""
        if not self.drug_orders:
            return Decimal('0.00')

        total = Decimal('0.00')
        for order in self.drug_orders:
            price = Decimal(str(order.get('price', '0.00')))
            quantity = Decimal(str(order.get('quantity', '0')))
            total += price * quantity

        return total

    def set_drug_orders(self, drug_orders):
        """Ensure drug_orders is stored as a JSON-compatible list of dicts."""
        if isinstance(drug_orders, list) and all(isinstance(order, dict) for order in drug_orders):
            self.drug_orders = drug_orders  # Store as a Python list of dictionaries
        else:
            raise ValueError("drug_orders must be a list of dictionaries")

# Appointment model
class Appointment(Base):
    __tablename__ = 'appointments'

    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    reason_for_visit = Column(String, nullable=True)
    diagnosis = Column(String, nullable=True)
    treatment_plan = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="appointments")

# 3. Doctor Model
class Doctor(Base):
    __tablename__ = 'doctors'

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), unique=True, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    specialty = Column(String(100), nullable=True)

    # Relationship to User (Doctor belongs to one User)
    user = relationship("User", back_populates="doctor")
    
    # Relationship to Patients (One Doctor can have many Patients)
    patients = relationship("Patient", back_populates="doctor")

    # Relationship to Billing (One Doctor can have many Billing records)
    billings = relationship("Billing", back_populates="doctor")

    def assign_admin_role(self):
        """Assign the doctor and admin role to the user associated with the doctor."""
        doctor_role = Role(name="Doctor", description="Special role for doctors.")
        admin_role = Role(name="Admin", description="Admin role with higher privileges.")
        self.user.roles = [doctor_role, admin_role]  # Assign both roles to the user

    def __repr__(self):
        return f"Doctor(name={self.full_name}, specialty={self.specialty})"


# Fee model for different fee types
class Fee(Base):
    __tablename__ = 'fees'

    fee_id = Column(Integer, primary_key=True, autoincrement=True)
    fee_type = Column(Enum(FeeTypeEnum), nullable=False)  # Using the FeeTypeEnum for validation
    amount = Column(Numeric(10, 2), default=Decimal('0.00'))

    billing_id = Column(Integer, ForeignKey('billings.billing_id'), nullable=False)
    billing = relationship("Billing", back_populates="fees")


class Billing(Base):
    __tablename__ = 'billings'

    billing_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)

    # Relationships
    fees = relationship("Fee", back_populates="billing", cascade="all, delete-orphan")
    patient = relationship("Patient", back_populates="bills")
    payments = relationship("PaymentHistory", back_populates="billing")
    doctor = relationship("Doctor", back_populates="billings")

    pharmacy_records = relationship("PharmacyRecord", back_populates="billing")
    mental_health_records = relationship("MentalHealthNote", back_populates="billing")
    clinical_notes = relationship("ClinicalNote", back_populates="billing")
    laboratory_record = relationship("LaboratoryRecord", back_populates="billing")
    occupational_therapy_record = relationship("OccupationalTherapyRecord", back_populates="billing")
    psychology_record = relationship("PsychologyRecord", back_populates="billing")
    social_work_record = relationship("SocialWorkRecord", back_populates="billing")

    # Invoice fields
    invoice_number = Column(String(100), unique=True, nullable=True)
    invoice_status = Column(String, default='not_generated')  # 'not_generated', 'generated', 'sent'
    invoice_date = Column(DateTime, nullable=True)

    # Financial fields
    amount = Column(Numeric(10, 2), default=Decimal('0.00'))
    amount_due = Column(Numeric(10, 2), default=Decimal('0.00'))
    status = Column(String, default="Unpaid", nullable=True)  # Default to 'Unpaid'
    total_bill = Column(Numeric(10, 2), default=Decimal('0.00'))

    # Discount fields
    discount_percentage = Column(Numeric(5, 2), nullable=True, default=None)
    discount_amount = Column(Numeric(10, 2), nullable=True, default=None)

    def calculate_total_bill(self):
        """Calculate total bill with either a percentage discount or a fixed amount discount."""
        total_before_discount = sum(fee.amount for fee in self.fees)

        # Ensure only one discount type is applied: either percentage or fixed amount.
        if (self.discount_percentage and self.discount_percentage > 0) and (self.discount_amount and self.discount_amount > 0):
            raise ValueError("Provide either a percentage discount or a fixed amount discount, not both.")

        # Apply discount
        discount_value = Decimal('0.00')
        if self.discount_percentage and self.discount_percentage > 0:
            discount_value = (total_before_discount * self.discount_percentage) / 100
        elif self.discount_amount and self.discount_amount > 0:
            discount_value = self.discount_amount

        # Calculate the total bill after discount
        self.total_bill = max(total_before_discount - discount_value, Decimal('0.00'))
        return self.total_bill


    def generate_invoice(self):
        """Generate invoice number and update invoice status."""
        if not self.invoice_number:
            self.invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            self.invoice_date = datetime.utcnow()
            self.invoice_status = 'generated'
        return self.invoice_number

    def send_invoice(self):
        """Send the generated invoice to the patient."""
        if self.invoice_status == 'generated':
            self.invoice_status = 'sent'


class PaymentHistory(Base):
    __tablename__ = 'payment_histories'

    payment_id = Column(Integer, primary_key=True, autoincrement=True)
    billing_id = Column(Integer, ForeignKey('billings.billing_id'), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    amount_paid = Column(Numeric(10, 2), default=Decimal('0.00'))
    payment_method = Column(String, nullable=True)  # 'credit_card', 'cash', etc.
    receipt_number = Column(String, unique=True, nullable=True)

    # Relationship to Billing
    billing = relationship("Billing", back_populates="payments")

    def generate_receipt_number(self, db):
        """Generate a unique receipt number."""
        if not self.receipt_number:
            base_receipt_number = f"REC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            receipt_number = base_receipt_number
            existing_receipt = db.query(PaymentHistory).filter_by(receipt_number=receipt_number).first()

            if existing_receipt:
                receipt_number = f"{base_receipt_number}-{random.randint(1000, 9999)}"

            self.receipt_number = receipt_number
        return self.receipt_number

    def __repr__(self):
        return f"<PaymentHistory(billing_id={self.billing_id}, amount_paid={self.amount_paid}, payment_date={self.payment_date})>"

# Mental Health model
class MentalHealthNote(Base):
    __tablename__ = 'mental_health'

    mental_health_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    present_complaints = Column(Text, nullable=False)
    history_of_present_illness = Column(Text, nullable=False)
    past_psychiatric_history = Column(Text, nullable=False)
    past_medical_history = Column(Text, nullable=False)
    drug_history = Column(Text, nullable=False)
    family_history = Column(Text, nullable=False)
    prenatal = Column(Text, nullable=False)
    delivery_and_postnatal = Column(Text, nullable=False)
    childhood_history = Column(Text, nullable=False)
    late_childhood_and_adolescence = Column(Text, nullable=False)
    educational_history = Column(Text, nullable=False)
    psychosexual_history = Column(Text, nullable=False)
    emotional_and_physical_postures = Column(Text, nullable=False)
    marital_history = Column(Text, nullable=False)
    occupational_history = Column(Text, nullable=False)
    military_service = Column(Text, nullable=False)
    forensic_history = Column(Text, nullable=False)
    premorbid_personality = Column(Text, nullable=False)
    mental_state_examination = Column(Text, nullable=False)
    physical_examination = Column(Text, nullable=False)
    pan_score = Column(String, nullable=True)
    bprs_score = Column(String, nullable=True)
    zung_depression_score = Column(String, nullable=True)
    zung_anxiety_score = Column(String, nullable=True)
    diagnostic_formulation = Column(Text, nullable=False)
    summary_of_problems = Column(Text, nullable=False)

    patient = relationship("Patient", back_populates="mental_health_records")

    billing = relationship("Billing", back_populates="mental_health_records", uselist=False)
    billing_id = Column(Integer, ForeignKey('billings.billing_id', ondelete="CASCADE"), nullable=True)

    @property
    def total_fee(self):
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')


# Clinical Notes model
class ClinicalNote(Base):
    __tablename__ = 'clinical_notes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    temperature = Column(Float, default=0.0)
    blood_pressure = Column(String, default="0/0")
    pulse_rate = Column(Integer, default=0)
    respiratory_rate = Column(Integer, default=0)
    present_psychological_concerns = Column(Text, default="")
    history_of_mental_illness = Column(Text, default="")
    risk_assessment_suicide_self_harm = Column(Text, default="")
    tests_administered = Column(Text, default="")
    scores_and_interpretation = Column(Text, default="")
    type_of_therapy = Column(Text, default="")
    progress_notes = Column(Text, default="")
    interventions_during_acute_episodes = Column(Text, default="")
    source_of_referral = Column(Text, default="")
    reasons_for_referral = Column(Text, default="")
    special_features_of_the_case = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    

    # Relationship to Patient model
    patient = relationship("Patient", back_populates="clinical_notes")

    # Foreign key to Billing table
    billing_id = Column(Integer, ForeignKey('billings.billing_id', ondelete="CASCADE"), nullable=True)

    # Relationship to Billing model
    billing = relationship("Billing", back_populates="clinical_notes", foreign_keys=[billing_id], uselist=False)

    @property
    def total_fee(self):
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')

#NursesNote

class NursesNote(Base):
    __tablename__ = 'nurses_notes'

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    source_of_referral = Column(String)
    reasons_for_referral = Column(String)
    special_features_of_case = Column(String, nullable=True)
    temperature = Column(Numeric(5, 2), nullable=True)
    blood_pressure = Column(String, nullable=True)
    pulse_rate = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    height_cm = Column(Numeric(5, 2), nullable=True)
    weight_kg = Column(Numeric(5, 2), nullable=True)
    nurse_note = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"NursesNote(patient_id={self.patient_id})"

# Notification model
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))  # Who sent the notification
    receiver_departments = Column(ARRAY(String), nullable=False)  # Multiple departments
    message = Column(String, nullable=False)
    responses = Column(JSON, default=[])  # Stores responses as JSON list
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

# Laboratory Record model
class LaboratoryRecord(Base):
    __tablename__ = 'laboratory_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    tests_requested_by_physicians = Column(String, nullable=True, default="")
    urgency = Column(String, nullable=True, default="Routine")  # Routine or Emergency
    test_results = Column(Text, nullable=True, default="")
    reference_ranges = Column(Text, nullable=True, default="")
    pathologist_comments = Column(Text, nullable=True, default="")
    specimen_type = Column(String, nullable=True, default="")
    date_time_of_collection = Column(DateTime, nullable=True, default=None)
    chain_of_custody = Column(String, nullable=True, default="")

    patient = relationship("Patient", back_populates="laboratory_records")
    billing = relationship("Billing", back_populates="laboratory_record", uselist=False)
    billing_id = Column(Integer, ForeignKey('billings.billing_id', ondelete="CASCADE"), nullable=True)

    @property
    def total_fee(self):
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')

# Occupational Therapy Record model
class OccupationalTherapyRecord(Base):
    __tablename__ = 'occupational_therapy_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    long_term_goals = Column(Text, nullable=True, default="")
    short_term_goals = Column(Text, nullable=True, default="")
    adls_performance = Column(Text, nullable=True, default="")
    cognitive_motor_skills = Column(Text, nullable=True, default="")
    therapy_sessions = Column(Text, nullable=True, default="")
    assistive_devices = Column(Text, nullable=True, default="")
    improvements_observed = Column(Text, nullable=True, default="")
    barriers_to_progress = Column(Text, nullable=True, default="")


    patient = relationship("Patient", back_populates="occupational_therapy_records")
    billing = relationship("Billing", back_populates="occupational_therapy_record", uselist=False)
    billing_id = Column(Integer, ForeignKey('billings.billing_id', ondelete="CASCADE"), nullable=True)

    @property
    def total_fee(self):
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')


# Psychology Record model
class PsychologyRecord(Base):
    __tablename__ = 'psychology_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    patient_category = Column(String, nullable=True, default="Outpatient")
    organization_name = Column(String, nullable=True, default="")
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    marital_status = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    folder_number = Column(String, nullable=False)
    card_number = Column(String, nullable=False)
    clinic = Column(String, nullable=False)
    specialty_unit = Column(String, nullable=False)

    patient = relationship("Patient", back_populates="psychology_records")
    billing = relationship("Billing", back_populates="psychology_record", uselist=False)
    billing_id = Column(Integer, ForeignKey('billings.billing_id', ondelete="CASCADE"), nullable=True)

    @property
    def total_fee(self):
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')


class SocialWorkRecord(Base):
    __tablename__ = 'social_work_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey('patients.patient_id'), nullable=False)
    housing_status = Column(String, nullable=True, default="Not provided")
    employment_status = Column(String, nullable=True, default="Not provided")
    family_support_system = Column(String, nullable=True, default="Not provided")
    counseling_sessions = Column(String, nullable=True, default="None")
    financial_assistance = Column(String, nullable=True, default="None")
    referrals_to_agencies = Column(String, nullable=True, default="None")
    support_groups = Column(String, nullable=True, default="None")

    patient = relationship("Patient", back_populates="social_work_records")
    billing = relationship("Billing", back_populates="social_work_record", uselist=False)
    billing_id = Column(Integer, ForeignKey('billings.billing_id', ondelete="CASCADE"), nullable=True)


    @property
    def total_fee(self):
        return self.billing.calculate_total_bill() if self.billing else Decimal('0.00')


# Define the password context for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



# 2. Role Model
class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    users = relationship("User", secondary=user_role_association, back_populates="roles")

    def __repr__(self):
        return f"Role(name={self.name})"

# 4. Staff Model
class Staff(Base):
    __tablename__ = 'staff'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # user_id is nullable here
    department = Column(String(100), nullable=True)

    # Relationship to User (Staff belongs to one User)
    user = relationship("User", back_populates="staff")

    def __repr__(self):
        return f"Staff(name={self.user.full_name if self.user else 'No User'}, department={self.department})"

# 6. Audit Log Model
class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(255), nullable=False)  # e.g., "login", "patient_create"
    entity_type = Column(String(50), nullable=True)  # e.g., "Patient", "Billing", "Drug"
    entity_id = Column(String(50), nullable=True)  # ID of the affected record
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    description = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)  # Track origin of action
    user_agent = Column(String(255), nullable=True)  # Browser/device info

    user = relationship("User")

    def __repr__(self):
        return f"AuditLog(action={self.action}, entity={self.entity_type}:{self.entity_id})"

# 7. Password Reset Token Model
class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    token = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, default=datetime.utcnow() + timedelta(hours=1), nullable=False)

    user = relationship("User")

    def __repr__(self):
        return f"PasswordResetToken(user_id={self.user_id}, token={self.token})"

# Function to auto-create roles
def create_default_roles(session):
    """
    Creates default roles in the database if they don't already exist.
    """
    default_roles = [
        {"name": "Admin", "description": "System administrator with full access."},
        {"name": "Doctor", "description": "Role for mental health department staff."},
        {"name": "Pharmacy", "description": "Role for pharmacy department staff."},
        {"name": "Laboratory", "description": "Role for laboratory department staff."},
        {"name": "Occupational Therapy", "description": "Role for occupational therapy staff."},
        {"name": "Clinical Psychology", "description": "Role for clinical psychology staff."},
        {"name": "Nursing", "description": "Role for nursing staff."},
        {"name": "Social Work", "description": "Role for social work staff."},
        {"name": "Account", "description": "Role for billing and finance staff."},
    ]

    for role_data in default_roles:
        # Check if the role already exists
        role = session.query(Role).filter_by(name=role_data["name"]).first()
        if not role:
            # Create the role if it doesn't exist
            new_role = Role(name=role_data["name"], description=role_data["description"])
            session.add(new_role)
            print(f"Created role: {role_data['name']}")

    # Commit the changes to the database
    session.commit()
