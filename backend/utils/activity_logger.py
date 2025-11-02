from typing import Optional, Dict
from sqlalchemy.orm import Session
from backend.models import ActivityLog


def log_activity(
    db: Session,
    current_user: Optional[Dict],
    action: str,
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """Create an ActivityLog record (fire-and-forget, caller handles tx)."""
    try:
        user_id = None
        username = None
        role = None
        if current_user:
            user_id = current_user.get("user_id") or current_user.get("MaTK")
            username = current_user.get("username")
            role = current_user.get("role")

        log = ActivityLog(
            UserId=user_id,
            Username=username,
            Role=role,
            Action=action,
            Entity=entity,
            EntityId=str(entity_id) if entity_id is not None else None,
            Details=details,
            IP=ip,
            UserAgent=user_agent,
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
        # swallow logging exceptions
        return


