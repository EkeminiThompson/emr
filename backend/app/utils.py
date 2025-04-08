import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from twilio.rest import Client  # For sending SMS via Twilio

# Calculate age from birthdate
def calculate_age(birthdate: datetime) -> int:
    """Calculate age from the given birthdate."""
    today = datetime.today()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))

# Format date into a readable string format (e.g., 'YYYY-MM-DD')
def format_date(date: datetime) -> str:
    """Format a datetime object into a string in 'YYYY-MM-DD' format."""
    return date.strftime('%Y-%m-%d')

# Example of a utility function to convert strings to title case
def to_title_case(text: str) -> str:
    """Convert a string to title case."""
    return text.title()

# Utility function to calculate the difference in days between two dates
def days_between_dates(start_date: datetime, end_date: datetime) -> int:
    """Return the difference in days between two dates."""
    delta = end_date - start_date
    return delta.days

# Utility function to get the current timestamp as a string
def get_current_timestamp() -> str:
    """Return the current timestamp in 'YYYY-MM-DD HH:MM:SS' format."""
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# app/utils.py

from app.models import Billing

def calculate_total_fee(billing: Billing) -> float:
    """
    This function calculates the total fees for a patient from various sources.
    It sums all the individual fee fields to get the total amount.
    """
    # List all the fee fields to sum
    fee_fields = [
        "consultation_fee",
        "assessment_fee",
        "medical_report_fee",
        "laboratory_fee",
        "occupation_therapy_fee",
        "social_welfare_fee",
        "utility_fee",
        "other_fees",
        "e_wallet_tracker",
        "pharmacy_billing",
        "drug_orders",
        "card_fee",
        "admission_fee",
        "forensic_fee",
        "nursing_services_fee",
        "doctors_fee",
        "psychology_fee",
        "family_therapy_fee",
        "surgical_fee",
        "consumables_fee",
        "ward_fees",
        "medical_request_fee",
        "psychological_assessment_fee",
        "others_medical_report_fee",
        "drugs",
        "drf",
        "lrf",
        "prescriptions"
    ]
    
    # Calculate the total sum of the fees
    total = sum(getattr(billing, fee, 0) for fee in fee_fields)
    
    return total

# Send an email using SMTP
def send_email(subject: str, body: str, to_email: str, from_email: str, smtp_server: str, smtp_port: int, smtp_user: str, smtp_password: str):
    """
    Sends an email using the provided SMTP server settings.

    Args:
        subject (str): The subject of the email.
        body (str): The body of the email.
        to_email (str): The recipient's email address.
        from_email (str): The sender's email address.
        smtp_server (str): The SMTP server address (e.g., 'smtp.gmail.com').
        smtp_port (int): The SMTP server port (usually 587 for TLS).
        smtp_user (str): The SMTP server username (usually the sender's email).
        smtp_password (str): The SMTP server password or app password.
    
    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    try:
        # Set up the MIMEText object to handle the email content
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add the body to the email
        msg.attach(MIMEText(body, 'plain'))
        
        # Set up the SMTP server and send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Secure the connection
            server.login(smtp_user, smtp_password)  # Log in to the server
            server.sendmail(from_email, to_email, msg.as_string())  # Send the email
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

# Send SMS using Twilio
def send_sms(to_phone: str, body: str, twilio_sid: str, twilio_auth_token: str, twilio_phone_number: str):
    """
    Sends an SMS using Twilio.

    Args:
        to_phone (str): The recipient's phone number (in E.164 format, e.g., '+1234567890').
        body (str): The body of the SMS.
        twilio_sid (str): Your Twilio Account SID.
        twilio_auth_token (str): Your Twilio Auth Token.
        twilio_phone_number (str): Your Twilio phone number.
    
    Returns:
        bool: True if the SMS was sent successfully, False otherwise.
    """
    try:
        client = Client(twilio_sid, twilio_auth_token)
        message = client.messages.create(
            body=body,
            from_=twilio_phone_number,
            to=to_phone
        )
        return True
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False

# Send an in-app notification
def send_in_app_notification(user_id: int, message: str):
    """
    Sends an in-app notification.

    Args:
        user_id (int): The user ID to whom the notification is sent.
        message (str): The message content for the notification.

    Returns:
        bool: True if the notification was sent successfully, False otherwise.
    """
    try:
        # Logic to store/send the in-app notification in your database
        # For example, let's assume you're saving it to a `notifications` table
        print(f"Sending in-app notification to user {user_id}: {message}")
        # Example: save to database (you would replace this with your actual database logic)
        # Notification.objects.create(user_id=user_id, message=message, timestamp=datetime.now())

        return True
    except Exception as e:
        print(f"Failed to send in-app notification: {e}")
        return False



