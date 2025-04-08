from pydantic import BaseModel, condecimal, EmailStr, Field, validator, ConfigDict
from datetime import date
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Union
from pydantic_settings import BaseSettings

from .enums import FeeTypeEnum  # Use relative import

# Patient Base Schema
class PatientBase(BaseModel):
    source_of_info: str
    relationship_to_patient: str
    surname: str
    other_names: str
    residential_address: str
    residential_phone: str
    business_address: Optional[str] = None  # Optional field
    business_phone: Optional[str] = None  # Optional field
    next_of_kin: str
    next_of_kin_address: str
    next_of_kin_residential_phone: str
    next_of_kin_business_phone: Optional[str] = None  # Optional field
    date_of_birth: date
    sex: str
    age: int
    marital_status: str
    legal_status: str
    religion: str
    denomination: Optional[str] = None  # Optional field
    contact_person_address: Optional[str] = None  # Optional field
    contact_person_phone: Optional[str] = None  # Optional field
    family_doctor_address: Optional[str] = None  # Optional field
    family_doctor_phone: Optional[str] = None  # Optional field

    # New consultation fee field
    #consultation_fee: Optional[Decimal] = Decimal('0.00')  # Default value

    # Foreign key fields (optional, to be included when creating/updating patient)
    user_id: Optional[int] = None  # User ID for foreign key reference
    doctor_id: Optional[int] = None  # Doctor ID for foreign key reference
    nurse_id: Optional[int] = None  # Doctor ID for foreign key reference

    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models

# Schema for creating a new patient
class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    pass

# Schema for updating an existing patient's details
class PatientUpdate(PatientBase):
    """Schema for updating an existing patient's details"""
    pass

# Schema for outputting patient data, including the patient ID
class PatientOut(PatientBase):
    """Schema for outputting patient data, including the patient ID"""
    id: int  # Include the patient's ID for the response
    patient_id: str  # Include the patient's unique patient_id
    hospital_reg_number: Optional[str] = None  # Output the generated hospital_reg_number

class PatientList(PatientOut):
    # If you need extra fields, you can add them here
    pass

class PatientSearchResponse(BaseModel):
    total_records: int
    page: int
    size: int
    patients: List[PatientList]

    class Config:
        from_attributes = True  # To serialize SQLAlchemy models as Pydantic models
        from_attributes = True  # Enable from_orm


# ------------------------------
# Role Schemas
# ------------------------------

# 1. Role Schema
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True  # Ensures attributes can be mapped if needed

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):  # Add this class to handle updates for roles
    pass

class Role(RoleBase):
    id: int

class RoleOut(RoleBase):
    id: int

    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy models

        # Drug Schema
class DrugBase(BaseModel):
    name: str = Field(..., example="Paracetamol")
    description: Optional[str] = None
    dosage: Optional[str] = None
    instructions: Optional[str] = None
    prescribed_date: date
    price: Optional[float] = None
    is_active: Optional[bool] = Field(default=True)  
    expiration_date: Optional[date] = None

class DrugCreate(DrugBase):
    pass

class DrugUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dosage: Optional[str] = None
    instructions: Optional[str] = None
    prescribed_date: Optional[date] = None
    price: Optional[float] = None
    is_active: Optional[bool] = Field(default=True)  
    expiration_date: Optional[date] = None

class DrugResponse(DrugBase):
    id: int
    class Config:
        from_attributes = True

# Stock Schema
class StockBase(BaseModel):
    drug_id: int
    quantity: int
    last_updated: datetime

class StockCreate(StockBase):
    pass

class StockUpdate(BaseModel):
    quantity: Optional[int] = None
    last_updated: Optional[datetime] = None

class StockResponse(StockBase):
    id: int
    class Config:
        from_attributes = True

class DrugOrder(BaseModel):
    drug_id: int  # ID of the drug being ordered
    quantity: int  # Quantity of the drug being ordered
    price: Optional[float] = Field(None, ge=0, description="Optional price of the drug")
    name: Optional[str] = None

    class Config:
        from_attributes = True

# Pharmacy Record Schema
class PharmacyRecordBase(BaseModel):
    patient_id: str
    #drug_id: int
    dosage_and_route: Optional[str] = None
    frequency: Optional[str] = None
    dispensation_date: Optional[date] = None
    screening_for_interactions: Optional[str] = None
    medication_name: Optional[str] = None
    monitoring_for_adverse_effects: Optional[str] = None
    medications_reviewed_on_admission: Optional[str] = None
    medications_reviewed_on_discharge: Optional[str] = None
    drug_orders: List[DrugOrder]  # List of drug orders
    prescriptions: Optional[str] = None
    is_paid: Optional[bool] = False  # Optional with default value

class PharmacyRecordCreate(PharmacyRecordBase):
    pass

class PharmacyRecordUpdate(BaseModel):
    patient_id: Optional[str] = None
    drug_id: Optional[int] = None
    dosage_and_route: Optional[str] = None
    frequency: Optional[str] = None
    medication_name: Optional[str] = Field(None, example="Paracetamol")
    dispensation_date: Optional[datetime] = None
    screening_for_interactions: Optional[str] = None
    monitoring_for_adverse_effects: Optional[str] = None
    medications_reviewed_on_admission: Optional[str] = None
    medications_reviewed_on_discharge: Optional[str] = None
    drug_orders: Optional[List[DrugOrder]] = None  # Optional list of drug orders
    prescriptions: Optional[str] = None
    is_paid: Optional[bool] = None  # Add this line

class PharmacyRecordResponse(PharmacyRecordBase):
    pharmacy_id: int
    total_fee: Decimal
    class Config:
        from_attributes = True


class PharmacyOut(BaseModel):
    pharmacy_id: Union[int, str]  # Can be integer for DB records or string for walk-ins
    patient_id: Optional[str] = None  # Make patient_id optional
    medication_name: Optional[str] = None
    dosage_and_route: Optional[str] = None
    frequency: Optional[str] = None
    dispensation_date: Optional[date] = None
    drug_orders: List[DrugOrder]  # List of drug orders
    is_paid: Optional[bool] = None  # Add this line
    total_cost: Decimal

    class Config:
        from_attributes = True



# Additional Pydantic Models for handling lists

class PatientList(BaseModel):
    patients: List[PatientOut]

    class Config:
        from_attributes = True


class DrugList(BaseModel):
    drugs: List[DrugResponse]

    class Config:
        from_attributes = True

class DrugOut(BaseModel):
    id: int
    name: str = Field(..., example="Paracetamol")
    description: Optional[str] = None
    dosage: Optional[str] = None
    instructions: Optional[str] = None
    prescribed_date: Optional[date] = None
    price: Optional[float] = None
    is_active: bool = True
    expiration_date: Optional[date] = None
    total_stock: Optional[int] = 0  # <-- NEW: Computed field

    class Config:
        from_attributes = True  # Enables ORM mode for SQLAlchemy

# Appointment Create Model
class AppointmentCreate(BaseModel):
    patient_id: str
    appointment_date: datetime
    reason_for_visit: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models

# Appointment Update Model
class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    reason_for_visit: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models

# Appointment Output Model
class AppointmentOut(AppointmentCreate):
    appointment_id: int

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models

# Patient Search Query Model
class PatientSearchQuery(BaseModel):
    query: str

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models

# Appointment List Response (when returning multiple appointments)
class AppointmentListResponse(BaseModel):
    appointments: list[AppointmentOut]

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models

# Response when creating or updating an appointment
class AppointmentCreateUpdateResponse(BaseModel):
    appointment: AppointmentOut
    message: str

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models

# Error Response Model (when an error occurs)
class ErrorResponse(BaseModel):
    error: str
    message: str

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy


# ---------------------- FEE SCHEMA ---------------------- #
class FeeBase(BaseModel):
    fee_type: FeeTypeEnum  # Ensure only valid fee types are used
    amount: condecimal(max_digits=10, decimal_places=2) = Decimal("0.00")

    class Config:
        from_attributes = True


class FeeCreate(FeeBase):
    billing_id: int


class FeeResponse(FeeBase):
    fee_id: int
    billing_id: int

    class Config:
        from_attributes = True

class FeeOut(BaseModel):
    fee_id: int
    fee_type: str
    amount: Decimal

# ---------------------- BILLING SCHEMA ---------------------- #
class BillingBase(BaseModel):
    patient_id: str
    invoice_status: str = "not_generated"  # 'not_generated', 'generated', 'sent'
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    total_bill: condecimal(max_digits=10, decimal_places=2) = Decimal("0.00")
    discount_percentage: Optional[condecimal(max_digits=5, decimal_places=2)] = Decimal("0.00")
    discount_amount: Optional[condecimal(max_digits=10, decimal_places=2)] = Decimal("0.00")
    amount: Decimal = Field(default=Decimal("0.00"), example="0.00")
    amount_due: Optional[int] = None
    status: Optional[str] = "Unpaid"  # Optional, allows None, default is "Unpaid"

    class Config:
        from_attributes = True


class BillingCreate(BillingBase):
    doctor_id: int
    discount_percentage: Optional[float] = 0  
    fees: Optional[List[FeeCreate]] = Field(default_factory=list)


class BillingResponse(BillingBase):
    billing_id: int
    fees: Optional[List[FeeResponse]]  # Include related Fee objects
    payments: List["PaymentHistoryResponse"]  # Add payments relation

class BillingUpdate(BillingBase):
    doctor_id: int
    #discount_percentage: Optional[float] = 0  
    fees: Optional[List[FeeCreate]] = Field(default_factory=list)


class BillingOut(BillingBase):
    billing_id: int
    invoice_number: Optional[str] = None
    total_bill: condecimal(max_digits=10, decimal_places=2) = Decimal("0.00")
    fees: Optional[List[FeeOut]]  # Include fees when fetching billing info
    doctor_id: int

    class Config:
        from_attributes = True


# ---------------------- PAYMENT HISTORY SCHEMA ---------------------- #
class PaymentHistoryBase(BaseModel):
    amount_paid: condecimal(max_digits=10, decimal_places=2) = Decimal("0.00")
    payment_method: str  # 'cash', 'credit_card', etc.
    payment_date: datetime
    receipt_number: Optional[str]

    class Config:
        from_attributes = True


class PaymentHistoryCreate(PaymentHistoryBase):
    billing_id: int


class PaymentHistoryResponse(PaymentHistoryBase):
    payment_id: int
    billing_id: int

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount_paid: Decimal
    payment_method: str
    receipt_number: str
    patient_id: str

class PaymentCreate(PaymentBase):
    pass

class PaymentOut(PaymentBase):
    id: int
    payment_date: datetime

    class Config:
        from_attributes = True

        
class PaymentHistoryOut(BaseModel):
    id: int
    billing_id: int
    amount: Decimal
    payment_date: datetime

class PaymentReceiptResponse(BaseModel):
    receipt_number: str
    amount_paid: Decimal
    payment_date: datetime


#Mental Health
class MentalHealthCreate(BaseModel):
    patient_id: str
    present_complaints: str
    history_of_present_illness: str
    past_psychiatric_history: str
    past_medical_history: str
    drug_history: str
    family_history: str
    prenatal: str
    delivery_and_postnatal: str
    childhood_history: str
    late_childhood_and_adolescence: str
    educational_history: str
    psychosexual_history: str
    emotional_and_physical_postures: str
    marital_history: str
    occupational_history: str
    military_service: str
    forensic_history: str
    premorbid_personality: str
    mental_state_examination: str
    physical_examination: str
    pan_score: Optional[str] = None
    bprs_score: Optional[str] = None
    zung_depression_score: Optional[str] = None
    zung_anxiety_score: Optional[str] = None
    diagnostic_formulation: str
    summary_of_problems: str


class MentalHealthUpdate(BaseModel):
    present_complaints: Optional[str]
    history_of_present_illness: Optional[str]
    past_psychiatric_history: Optional[str]
    past_medical_history: Optional[str]
    drug_history: Optional[str]
    family_history: Optional[str]
    prenatal: Optional[str]
    delivery_and_postnatal: Optional[str]
    childhood_history: Optional[str]
    late_childhood_and_adolescence: Optional[str]
    educational_history: Optional[str]
    psychosexual_history: Optional[str]
    emotional_and_physical_postures: Optional[str]
    marital_history: Optional[str]
    occupational_history: Optional[str]
    military_service: Optional[str]
    forensic_history: Optional[str]
    premorbid_personality: Optional[str]
    mental_state_examination: Optional[str]
    physical_examination: Optional[str]
    pan_score: Optional[str]
    bprs_score: Optional[str]
    zung_depression_score: Optional[str]
    zung_anxiety_score: Optional[str]
    diagnostic_formulation: Optional[str]
    summary_of_problems: Optional[str]
 
class MentalHealthOut(MentalHealthCreate):
    mental_health_id: int
    patient_id: str
    
    class Config:
        from_attributes = True  # This makes FastAPI use the SQLAlchemy model instance

# Clinical Notes schema
class ClinicalBase(BaseModel):
    temperature: Optional[float] = 0.0
    blood_pressure: Optional[str] = "0/0"
    pulse_rate: Optional[int] = 0
    respiratory_rate: Optional[int] = 0
    present_psychological_concerns: Optional[str] = ""
    history_of_mental_illness: Optional[str] = ""
    risk_assessment_suicide_self_harm: Optional[str] = ""
    tests_administered: Optional[str] = ""
    scores_and_interpretation: Optional[str] = ""
    type_of_therapy: Optional[str] = ""
    progress_notes: Optional[str] = ""
    interventions_during_acute_episodes: Optional[str] = ""
    source_of_referral: Optional[str] = ""
    reasons_for_referral: Optional[str] = ""
    special_features_of_the_case: Optional[str] = ""

class ClinicalCreate(ClinicalBase):
    patient_id: str  # patient_id is now a string, as required

class ClinicalUpdate(ClinicalBase):
    pass  # All fields are optional for updating

class ClinicalOut(ClinicalBase):
    id: int
    patient_id: str
    created_at: datetime
    updated_at: datetime

class ClinicalSearchResponse(BaseModel):
    total_records: int
    page: int
    size: int
    notes: List[ClinicalOut]

    class Config:
        from_attributes = True  # Allow SQLAlchemy model to be used as a Pydantic model


class NursesNoteBase(BaseModel):
    patient_id: str
    source_of_referral: Optional[str] = None
    reasons_for_referral: Optional[str] = None
    special_features_of_case: Optional[str] = None
    temperature: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    height_cm: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    weight_kg: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    nurse_note: Optional[str] = None


class NursesNoteCreate(NursesNoteBase):
    pass


class NursesNoteOut(NursesNoteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


#laboratory
class LaboratoryBase(BaseModel):
    tests_requested_by_physicians: Optional[str] = ""
    urgency: Optional[str] = "Routine"  # Routine or Emergency
    test_results: Optional[str] = ""
    reference_ranges: Optional[str] = ""
    pathologist_comments: Optional[str] = ""
    specimen_type: Optional[str] = ""
    date_time_of_collection: Optional[datetime] = None
    chain_of_custody: Optional[str] = ""

    class Config:
        from_attributes = True

class LaboratoryCreate(LaboratoryBase):
    patient_id: str

class LaboratoryUpdate(LaboratoryBase):
    pass

class LaboratoryOut(LaboratoryBase):
    id: int
    patient_id: str
    total_fee: float  # Adding the total fee to the output schema

    class Config:
        from_attributes = True

#occupational
class OccupationalTherapyBase(BaseModel):
    long_term_goals: Optional[str] = ""
    short_term_goals: Optional[str] = ""
    adls_performance: Optional[str] = ""
    cognitive_motor_skills: Optional[str] = ""
    therapy_sessions: Optional[str] = ""
    assistive_devices: Optional[str] = ""
    improvements_observed: Optional[str] = ""
    barriers_to_progress: Optional[str] = ""

class OccupationalTherapyCreate(OccupationalTherapyBase):
    patient_id: str

class OccupationalTherapyUpdate(OccupationalTherapyBase):
    pass

class OccupationalTherapyOut(OccupationalTherapyBase):
    id: int
    patient_id: str

    class Config:
        from_attributes = True

#psychology
class PsychologyBase(BaseModel):
    patient_category: Optional[str] = "Outpatient"
    organization_name: Optional[str] = ""
    age: int
    gender: str
    marital_status: str
    phone_number: str
    folder_number: str
    card_number: str
    clinic: str
    specialty_unit: str
    psychology_fee: Optional[float] = 0.0

class PsychologyCreate(PsychologyBase):
    hospital_reg_number: str
    visit_id: str

class PsychologyUpdate(PsychologyBase):
    pass

class PsychologyOut(PsychologyBase):
    id: int
    hospital_reg_number: str
    visit_id: str
    total_fee: float  # Include the total_fee here, which will be automatically computed

    class Config:
        from_attributes = True  # Ensures that SQLAlchemy models are correctly

#SocialWorkBase
class SocialWorkBase(BaseModel):
    housing_status: Optional[str] = "Not provided"
    employment_status: Optional[str] = "Not provided"
    family_support_system: Optional[str] = "Not provided"
    counseling_sessions: Optional[str] = "None"
    financial_assistance: Optional[str] = "None"
    referrals_to_agencies: Optional[str] = "None"
    support_groups: Optional[str] = "None"

class SocialWorkCreate(SocialWorkBase):
    patient_id: str

class SocialWorkUpdate(SocialWorkBase):
    pass

class SocialWorkOut(SocialWorkBase):
    id: int
    patient_id: str

    class Config:
        from_attributes = True

#notifications
# Request schema for notification creation
class NotificationRequestSchema(BaseModel):
    patient_id: str
    message: str
    notification_type: str  # e.g., 'email', 'sms', 'push'
    recipient: str  # Email, phone number, or device token

    class Config:
        from_attributes = True

# Response schema for notifications
class NotificationResponseSchema(BaseModel):
    id: int
    patient_id: str
    message: str
    notification_type: str
    recipient: str
    status: str  # 'sent', 'pending', 'failed'
    sent_at: str

    class Config:
        from_attributes = True

# Schema to mark notification status as sent or failed
class UpdateNotificationStatusSchema(BaseModel):
    status: str  # 'sent', 'failed'

    class Config:
        from_attributes = True

#dashboard service
from pydantic import BaseModel

class PatientCountResponse(BaseModel):
    count: int

class AppointmentCountResponse(BaseModel):
    count: int

class BillingStatsResponse(BaseModel):
    total_amount: float

# 3. Doctor Schema
class DoctorBase(BaseModel):
    full_name: str
    specialty: Optional[str] = None

    class Config:
        from_attributes = True  # Ensures attributes can be mapped if needed

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(DoctorBase):
    pass

class Doctor(DoctorBase):
    id: int
    user_id: int

class DoctorOut(DoctorBase):
    id: int
    specialty: Optional[str]

    class Config:
        from_attributes = True

class NurseBase(BaseModel):
    id: Optional[int] = None
    full_name: Optional[str]

class NurseCreate(NurseBase):
    pass

class NurseUpdate(NurseBase):
    pass

class NurseOut(NurseBase):
    id: int

    class Config:
        from_attributes = True

class BillingSearchResponse(BaseModel):
    total_records: int
    page: int
    size: int
    billings: List[BillingOut]

    class Config:
        from_attributes = True
# ------------------------------
# User Schemas
# ------------------------------

# 2. User Schema
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        from_attributes = True  # Ensures attributes can be mapped if needed

class UserCreate(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str
    role_ids: List[int] = []  # Add a list of role IDs to assign to the user

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    roles: List[Role] = []

class UserOut(UserBase):
    id: int
    username: str
    roles: List[Role] = []

class UserLogin(BaseModel):
    username: str
    password: str


    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy models


# ------------------------------
# Staff Schemas
# ------------------------------

# 4. Staff Schema
class StaffBase(BaseModel):
    department: Optional[str] = None

    class Config:
        from_attributes = True  # Ensures attributes can be mapped if needed

class StaffCreate(StaffBase):
    pass

class StaffUpdate(StaffBase):
    pass

class Staff(StaffBase):
    id: int
    user_id: int

class StaffOut(StaffBase):
    id: int

    class Config:
        from_attributes = True


class DrugOrderTemplate(BaseModel):
    drug_id: int
    quantity: int
    price: float

class ReceiptTemplate(BaseModel):
    pharmacy_id: int
    patient_name: str
    medication_name: str
    dosage_and_route: str
    total_cost: float
    dispensation_date: date
    drug_orders: List[DrugOrderTemplate]

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @validator("new_password")
    def validate_password_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

class AuditLogSchema(BaseModel):
    id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    timestamp: datetime
    user_id: int
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: lambda v: v.isoformat()})

class UserAuditLogSchema(AuditLogSchema):
    user: Optional[UserOut] = None  # Optional to handle cases where user might be None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: lambda v: v.isoformat()})

