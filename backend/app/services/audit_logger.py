# services/audit_logger.py
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog, User
from fastapi import Request

class AuditLogger:
    @staticmethod
    def log(
        db: Session,
        user_id: int,
        action: str,
        description: str = None,
        entity_type: str = None,
        entity_id: str = None,
        request: Request = None
    ):
        """
        Create an audit log entry
        
        Args:
            db: Database session
            user_id: ID of user performing action
            action: Type of action (e.g., "login", "patient_create")
            description: Detailed description of action
            entity_type: Type of entity affected (e.g., "Patient")
            entity_id: ID of entity affected
            request: FastAPI Request object for IP/user agent
        """
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.client.host
            user_agent = request.headers.get("user-agent")
        
        log_entry = AuditLog(
            action=action,
            user_id=user_id,
            description=description,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(log_entry)
        db.commit()