from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from app.models import Notification, Patient, Appointment
from app.schemas import (
    NotificationRequestSchema,  # Used for creating new notifications
    NotificationResponseSchema,  # Used for fetching notifications
    UpdateNotificationStatusSchema
)
from app.utils import send_email, send_sms, send_in_app_notification
import logging

class NotificationService:

    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    def create_notification(self, notification_data: NotificationRequestSchema) -> NotificationResponseSchema:
        """
        Creates a new notification and logs it in the database.
        """
        try:
            new_notification = Notification(
                patient_id=notification_data.patient_id,
                message=notification_data.message,
                notification_type=notification_data.notification_type,
                recipient=notification_data.recipient,
                created_at=datetime.utcnow(),
                status="Pending"  # Status can be Pending, Sent, Failed
            )
            self.db.add(new_notification)
            self.db.commit()
            self.db.refresh(new_notification)
            return NotificationResponseSchema(
                id=new_notification.id,
                patient_id=new_notification.patient_id,
                message=new_notification.message,
                notification_type=new_notification.notification_type,
                recipient=new_notification.recipient,
                status=new_notification.status,
                sent_at=new_notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
            )
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating notification: {str(e)}")
            raise Exception("Error creating notification")

    def send_email_notification(self, patient_id: int, subject: str, body: str):
        """
        Sends an email notification to a patient.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            try:
                # Sending email (you can integrate with a real email service here)
                send_email(patient.email, subject, body)
                self.logger.info(f"Email sent to {patient.email} with subject: {subject}")
                return True
            except Exception as e:
                self.logger.error(f"Error sending email to {patient.email}: {str(e)}")
                return False
        else:
            self.logger.warning(f"Patient with ID {patient_id} not found for email notification")
            return False

    def send_sms_notification(self, patient_id: int, message: str):
        """
        Sends an SMS notification to a patient.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            try:
                # Sending SMS (you can integrate with a real SMS service here)
                send_sms(patient.phone_number, message)
                self.logger.info(f"SMS sent to {patient.phone_number}: {message}")
                return True
            except Exception as e:
                self.logger.error(f"Error sending SMS to {patient.phone_number}: {str(e)}")
                return False
        else:
            self.logger.warning(f"Patient with ID {patient_id} not found for SMS notification")
            return False

    def send_in_app_notification(self, patient_id: int, message: str):
        """
        Sends an in-app notification to a patient.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            try:
                # Sending in-app notification (you can integrate with a real in-app service here)
                send_in_app_notification(patient.id, message)
                self.logger.info(f"In-app notification sent to patient ID {patient.id}: {message}")
                return True
            except Exception as e:
                self.logger.error(f"Error sending in-app notification to patient ID {patient.id}: {str(e)}")
                return False
        else:
            self.logger.warning(f"Patient with ID {patient_id} not found for in-app notification")
            return False

    def send_appointment_reminder(self, appointment_id: int):
        """
        Sends an appointment reminder to the patient associated with the appointment.
        """
        appointment = self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if appointment:
            patient_id = appointment.patient_id
            message = f"Reminder: Your appointment is scheduled for {appointment.date.strftime('%Y-%m-%d %H:%M:%S')}."
            self.send_sms_notification(patient_id, message)
            self.send_email_notification(patient_id, "Appointment Reminder", message)
        else:
            self.logger.warning(f"Appointment with ID {appointment_id} not found")

    def get_notifications_for_patient(self, patient_id: int) -> List[NotificationResponseSchema]:
        """
        Fetch all notifications for a specific patient.
        """
        notifications = self.db.query(Notification).filter(Notification.patient_id == patient_id).all()
        return [NotificationResponseSchema(
                    id=notification.id,
                    patient_id=notification.patient_id,
                    message=notification.message,
                    notification_type=notification.notification_type,
                    recipient=notification.recipient,
                    status=notification.status,
                    sent_at=notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ) for notification in notifications]

    def get_all_notifications(self) -> List[NotificationResponseSchema]:
        """
        Fetch all notifications.
        """
        notifications = self.db.query(Notification).all()
        return [NotificationResponseSchema(
                    id=notification.id,
                    patient_id=notification.patient_id,
                    message=notification.message,
                    notification_type=notification.notification_type,
                    recipient=notification.recipient,
                    status=notification.status,
                    sent_at=notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ) for notification in notifications]

    def update_notification_status(self, notification_id: int, status: str):
        """
        Update the status of a notification (e.g., Sent, Failed, Pending).
        """
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if notification:
            notification.status = status
            self.db.commit()
            self.db.refresh(notification)
            self.logger.info(f"Notification {notification_id} status updated to {status}")
        else:
            self.logger.warning(f"Notification with ID {notification_id} not found")
