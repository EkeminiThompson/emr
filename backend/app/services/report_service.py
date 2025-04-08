from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from typing import Optional
from app.models import Patient, Appointment, Billing, PharmacyRecord, LaboratoryRecord, OccupationalTherapyRecord, PsychologyRecord, SocialWorkRecord

from datetime import datetime

from app.schemas import (
    PatientOut as PatientReportSchema, 
    AppointmentOut as AppointmentReportSchema, 
    BillingOut as BillingReportSchema, 
    ClinicalOut as ClinicalReportSchema, 
    MentalHealthOut as MentalHealthReportSchema, 
    PharmacyOut as PharmacyReportSchema, 
    LaboratoryOut as LaboratoryReportSchema, 
    OccupationalTherapyOut as OccupationalReportSchema, 
    PsychologyOut as PsychologyReportSchema, 
    SocialWorkOut as SocialWorkReportSchema
)

from datetime import datetime

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def model_to_dict(self, model_instance):
        return {key: value for key, value in model_instance.__dict__.items() if not key.startswith('_')}

    def generate_report(self, report_type: str, patient_id: Optional[int] = None, name: Optional[str] = None, gender: Optional[str] = None,
                        start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, age: Optional[int] = None) -> dict:
        # Define dynamic report selection
        if report_type == "full":
            return self.generate_full_report(patient_id, name, gender, age, start_date, end_date)
        elif report_type == "summary":
            return self.generate_summary_report(patient_id, name, gender, age)
        elif report_type == "optimized":
            return self.generate_optimized_report(patient_id, name, gender, age, start_date, end_date)
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")

    def generate_full_report(self, patient_id: Optional[int], name: Optional[str], gender: Optional[str], age: Optional[int],
                             start_date: Optional[datetime], end_date: Optional[datetime]) -> dict:
        # Start the query and apply filters dynamically based on the provided fields
        query = self.db.query(Patient).options(
            joinedload(Patient.appointments),
            joinedload(Patient.billing),
            joinedload(Patient.clinical),
            joinedload(Patient.mental_health),
            joinedload(Patient.pharmacy),
            joinedload(Patient.laboratory),
            joinedload(Patient.occupational),
            joinedload(Patient.psychology),
            joinedload(Patient.social_work)
        )

        if patient_id:
            query = query.filter(Patient.id == patient_id)
        if name:
            query = query.filter(Patient.name.ilike(f"%{name}%"))
        if gender:
            query = query.filter(Patient.gender == gender)
        if age:
            query = query.filter(Patient.age == age)

        patient = query.first()

        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient with provided filters not found")

        # Filter appointments by date range if provided
        appointments = self.db.query(Appointment).filter(Appointment.patient_id == patient.id)
        if start_date and end_date:
            appointments = appointments.filter(Appointment.date >= start_date, Appointment.date <= end_date)
        appointments = appointments.all()

        # Convert data into schema reports
        patient_report = PatientReportSchema(patient=patient)
        appointment_reports = [AppointmentReportSchema(**self.model_to_dict(appointment)) for appointment in appointments]
        billing_reports = [BillingReportSchema(**self.model_to_dict(bill)) for bill in patient.billing]
        clinical_reports = [ClinicalReportSchema(**self.model_to_dict(clinic)) for clinic in patient.clinical]
        mental_health_reports = [MentalHealthReportSchema(**self.model_to_dict(mh)) for mh in patient.mental_health]
        pharmacy_reports = [PharmacyReportSchema(**self.model_to_dict(pharmacy)) for pharmacy in patient.pharmacy]
        laboratory_reports = [LaboratoryReportSchema(**self.model_to_dict(lab)) for lab in patient.laboratory]
        occupational_reports = [OccupationalReportSchema(**self.model_to_dict(occ)) for occ in patient.occupational]
        psychology_reports = [PsychologyReportSchema(**self.model_to_dict(psy)) for psy in patient.psychology]
        social_work_reports = [SocialWorkReportSchema(**self.model_to_dict(sw)) for sw in patient.social_work]

        # Assemble full report
        full_report = {
            "patient_report": patient_report,
            "appointments": appointment_reports,
            "billing": billing_reports,
            "clinical": clinical_reports,
            "mental_health": mental_health_reports,
            "pharmacy": pharmacy_reports,
            "laboratory": laboratory_reports,
            "occupational": occupational_reports,
            "psychology": psychology_reports,
            "social_work": social_work_reports
        }

        return full_report

    def generate_summary_report(self, patient_id: Optional[int], name: Optional[str], gender: Optional[str], age: Optional[int]) -> dict:
        query = self.db.query(Patient)
        
        if patient_id:
            query = query.filter(Patient.id == patient_id)
        if name:
            query = query.filter(Patient.name.ilike(f"%{name}%"))
        if gender:
            query = query.filter(Patient.gender == gender)
        if age:
            query = query.filter(Patient.age == age)

        patient = query.first()

        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient with provided filters not found")

        appointments_count = self.db.query(Appointment).filter(Appointment.patient_id == patient.id).count()
        total_billing = sum([bill.amount for bill in self.db.query(Billing).filter(Billing.patient_id == patient.id).all() if bill.amount is not None])
        clinical_records_count = self.db.query(Clinical).filter(Clinical.patient_id == patient.id).count()

        summary_report = {
            "patient_name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "appointments_count": appointments_count,
            "total_billing": total_billing,
            "clinical_records_count": clinical_records_count,
        }

        return summary_report

    def generate_optimized_report(self, patient_id: Optional[int], name: Optional[str], gender: Optional[str], age: Optional[int],
                                  start_date: Optional[datetime], end_date: Optional[datetime]) -> dict:
        # Similar to generate_full_report, but with pagination and limited fields for large datasets
        query = self.db.query(Patient)

        if patient_id:
            query = query.filter(Patient.id == patient_id)
        if name:
            query = query.filter(Patient.name.ilike(f"%{name}%"))
        if gender:
            query = query.filter(Patient.gender == gender)
        if age:
            query = query.filter(Patient.age == age)

        patient = query.first()

        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient with provided filters not found")

        # For large datasets, limit the results (for example, for appointments)
        appointments_query = self.db.query(Appointment).filter(Appointment.patient_id == patient.id)
        if start_date and end_date:
            appointments_query = appointments_query.filter(Appointment.date >= start_date, Appointment.date <= end_date)

        appointments = appointments_query.limit(100).all()  # Limit results for optimization

        # Creating a report similar to full report but optimized
        patient_report = PatientReportSchema(patient=patient)
        appointment_reports = [AppointmentReportSchema(**self.model_to_dict(appointment)) for appointment in appointments]
        billing_reports = [BillingReportSchema(**self.model_to_dict(bill)) for bill in patient.billing]

        optimized_report = {
            "patient_report": patient_report,
            "appointments": appointment_reports,
            "billing": billing_reports
        }

        return optimized_report
