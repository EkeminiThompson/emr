from sqlalchemy.orm import Session
from app.models import Patient, Billing, Appointment, MentalHealthNote, ClinicalNote, PharmacyRecord, LaboratoryRecord, OccupationalTherapyRecord, PsychologyRecord, SocialWorkRecord, Notification
from app.utils import calculate_total_fee
from fastapi import HTTPException  # Import HTTPException

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_patient_dashboard_data(self, patient_id: str):
        """
        Retrieves a comprehensive set of patient data for the dashboard, including appointments, billing details,
        mental health records, clinical notes, and more.
        """
        patient = self.db.query(Patient).filter(Patient.patient_id == patient_id).first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient_data = {
            "patient_info": self._get_patient_info(patient),
            "appointments": self._get_appointments(patient),
            "billing": self._get_billing(patient),
            "mental_health": self._get_mental_health(patient),
            "clinical_notes": self._get_clinical_notes(patient),
            "pharmacy": self._get_pharmacy(patient),
            "laboratory": self._get_laboratory(patient),
            "occupational_therapy": self._get_occupational_therapy(patient),
            "psychology": self._get_psychology(patient),
            "social_work": self._get_social_work(patient),
            "notifications": self._get_notifications(patient),
            "total_fee": self._calculate_total_fee(patient)  # Calculate total fee based on all records
        }

        return patient_data

    def _get_patient_info(self, patient: Patient):
        """Returns basic patient details."""
        return {
            "patient_id": patient.patient_id,
            "name": f"{patient.surname} {patient.other_names}",
            "age": patient.age,
            "gender": patient.sex,
            "date_of_birth": patient.date_of_birth,
            "marital_status": patient.marital_status,
            "contact_info": {
                "residential_address": patient.residential_address,
                "residential_phone": patient.residential_phone,
                "business_address": patient.business_address,
                "business_phone": patient.business_phone,
                "next_of_kin": {
                    "name": patient.next_of_kin,
                    "address": patient.next_of_kin_address,
                    "phone": patient.next_of_kin_residential_phone
                },
            }
        }

    def _get_appointments(self, patient: Patient):
        """Returns a list of the patient's appointments."""
        appointments = self.db.query(Appointment).filter(Appointment.patient_id == patient.patient_id).all()
        return [{"appointment_id": appointment.appointment_id, 
                 "appointment_date": appointment.appointment_date, 
                 "reason_for_visit": appointment.reason_for_visit} for appointment in appointments]

    def _get_billing(self, patient: Patient):
        """Returns the patient's billing details and total fee."""
        billing = self.db.query(Billing).filter(Billing.patient_id == patient.patient_id).first()
        if billing:
        # Check if there are any payments, and consider the bill as paid if there's a payment history
            is_paid = len(billing.payments) > 0

            return {
                "total_bill": billing.total_bill,
                "is_paid": is_paid,  # Derived from payment history
                "discount": billing.discount_percentage or billing.discount_amount,  # Show discount applied
                "fees": {
                    "consultation_fee": billing.total_bill,  # You can use specific fields if available, such as a breakdown
                    "other_fees": sum(fee.amount for fee in billing.fees),  # Sum of all fee records
                }
            }
        raise HTTPException(status_code=404, detail="Billing record not found")

    def _get_mental_health(self, patient: Patient):
        """Returns mental health records, if available."""
        mental_health_notes = self.db.query(MentalHealthNote).filter(MentalHealthNote.patient_id == patient.patient_id).first()
        if mental_health_notes:
            return {
                "present_complaints": mental_health_notes.present_complaints,
                "past_psychiatric_history": mental_health_notes.past_psychiatric_history,
                "psychological_assessment_fee": mental_health_notes.psychological_assessment_fee,
                "total_fee": mental_health_notes.total_fee
            }
        return {"error": "Mental health record not found"}

    def _get_clinical_notes(self, patient: Patient):
        """Returns clinical notes, if available."""
        clinical_notes = self.db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient.patient_id).all()
        return [{"temperature": note.temperature,
                 "blood_pressure": note.blood_pressure,
                 "pulse_rate": note.pulse_rate,
                 "notes": note.progress_notes,
                 "total_fee": note.total_fee} for note in clinical_notes]

    def _get_pharmacy(self, patient: Patient):
        """Returns pharmacy records and total fee."""
        pharmacy_records = self.db.query(PharmacyRecord).filter(PharmacyRecord.patient_id == patient.patient_id).all()
        return [{"medication_name": record.medication_name,
                 "dosage_and_route": record.dosage_and_route,
                 "total_fee": record.total_fee} for record in pharmacy_records]

    def _get_laboratory(self, patient: Patient):
        """Returns laboratory records and total fee."""
        laboratory_records = self.db.query(LaboratoryRecord).filter(LaboratoryRecord.patient_id == patient.patient_id).all()
        return [{"test_results": record.test_results,
                 "laboratory_fee": record.laboratory_fee,
                 "total_fee": record.total_fee} for record in laboratory_records]

    def _get_occupational_therapy(self, patient: Patient):
        """Returns occupational therapy records and total fee."""
        occupational_therapy_records = self.db.query(OccupationalTherapyRecord).filter(OccupationalTherapyRecord.patient_id == patient.patient_id).all()
        return [{"long_term_goals": record.long_term_goals,
                 "improvements_observed": record.improvements_observed,
                 "total_fee": record.total_fee} for record in occupational_therapy_records]

    def _get_psychology(self, patient: Patient):
        """Returns psychology records and fee details."""
        psychology_records = self.db.query(PsychologyRecord).filter(PsychologyRecord.patient_id == patient.patient_id).all()
        return [{"psychology_fee": record.psychology_fee,
                 "total_fee": record.total_fee} for record in psychology_records]

    def _get_social_work(self, patient: Patient):
        """Returns social work records and total fee."""
        social_work_records = self.db.query(SocialWorkRecord).filter(SocialWorkRecord.patient_id == patient.patient_id).all()
        return [{"housing_status": record.housing_status,
                 "employment_status": record.employment_status,
                 "social_welfare_fee": record.social_welfare_fee,
                 "total_fee": record.total_fee} for record in social_work_records]

    def _get_notifications(self, patient: Patient):
        """Returns the list of notifications for the patient."""
        notifications = self.db.query(Notification).filter(Notification.patient_id == patient.patient_id).all()
        return [{"message": notification.message,
                 "status": notification.status,
                 "sent_at": notification.sent_at} for notification in notifications]

    def _calculate_total_fee(self, patient: Patient):
        """Calculates total fee from all records"""
        total_fees = 0
        total_fees += self._get_billing(patient).get("total_bill", 0)
        total_fees += sum(note['total_fee'] for note in self._get_clinical_notes(patient))
        total_fees += sum(record['total_fee'] for record in self._get_pharmacy(patient))
        total_fees += sum(record['total_fee'] for record in self._get_laboratory(patient))
        total_fees += sum(record['total_fee'] for record in self._get_occupational_therapy(patient))
        total_fees += sum(record['total_fee'] for record in self._get_psychology(patient))
        total_fees += sum(record['total_fee'] for record in self._get_social_work(patient))

        return total_fees
