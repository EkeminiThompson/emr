from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.models import AuditLog, User
from app.schemas import AuditLogSchema, UserAuditLogSchema
from app.database import get_db
from .admin import get_current_user

router = APIRouter(tags=["Audit Logs"])

@router.get("/audit-logs/", response_model=List[UserAuditLogSchema])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    time_frame: Optional[str] = Query(None, description="Time frame filter (day, week, month, year, total)"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD)"),
    action: Optional[str] = Query(None, description="Filter by action type (e.g., 'login', 'patient_create')"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g., 'Patient', 'Billing')"),
    entity_id: Optional[str] = Query(None, description="Filter by specific entity ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID who performed the action"),
    limit: Optional[int] = Query(100, description="Maximum number of logs to return (default: 100)"),
    include_user: Optional[bool] = Query(True, description="Include detailed user information")
):
    """
    Retrieve audit logs with various filtering options.
    Requires admin privileges.
    """
    # Verify admin access
    if not any(role.name == "Admin" for role in current_user.roles):
        raise HTTPException(
            status_code=403,
            detail="Only admin users can access audit logs"
        )

    query = db.query(AuditLog)
    
    # Join with user table if we need user details
    if include_user:
        query = query.outerjoin(User, AuditLog.user_id == User.id)
    
    # Apply filters
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == str(entity_id))
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    # Apply time filters
    now = datetime.utcnow()
    if time_frame:
        if time_frame == "day":
            cutoff_date = now - timedelta(days=1)
        elif time_frame == "week":
            cutoff_date = now - timedelta(weeks=1)
        elif time_frame == "month":
            cutoff_date = now - timedelta(days=30)
        elif time_frame == "year":
            cutoff_date = now - timedelta(days=365)
        elif time_frame == "total":
            pass  # No time filter
        else:
            raise HTTPException(status_code=400, detail="Invalid time_frame value")
        
        if time_frame != "total":
            query = query.filter(AuditLog.timestamp >= cutoff_date)
    
    # Handle custom date range
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(AuditLog.timestamp >= start, AuditLog.timestamp <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Apply ordering and limit
    query = query.order_by(AuditLog.timestamp.desc())
    if limit:
        query = query.limit(limit)
    
    # Execute query
    logs = query.all()
    
    return logs