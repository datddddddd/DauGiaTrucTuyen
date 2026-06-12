from sqlalchemy.orm import Session
from models import Log, User
from datetime import datetime
from typing import Optional

def create_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Log:
    """Create a system log entry"""
    log = Log(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_user_logs(db: Session, user_id: int, limit: int = 100):
    """Get logs for a specific user"""
    return db.query(Log).filter(Log.user_id == user_id)\
             .order_by(Log.created_at.desc())\
             .limit(limit)\
             .all()

def get_all_logs(db: Session, action_filter: Optional[str] = None, limit: int = 100):
    """Get all logs, optionally filtered by action type"""
    query = db.query(Log)
    if action_filter:
        query = query.filter(Log.action == action_filter)
    return query.order_by(Log.created_at.desc()).limit(limit).all()

def get_login_logs(db: Session, limit: int = 50):
    """Get login/logout logs specifically"""
    return db.query(Log).filter(Log.action.in_(["login", "logout"]))\
             .order_by(Log.created_at.desc())\
             .limit(limit)\
             .all()

def get_admin_logs(db: Session, limit: int = 100):
    """Get admin action logs"""
    return db.query(Log).filter(Log.action == "admin_action")\
             .order_by(Log.created_at.desc())\
             .limit(limit)\
             .all()