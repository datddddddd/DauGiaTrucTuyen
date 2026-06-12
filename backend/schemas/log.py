from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LogCreate(BaseModel):
    user_id: Optional[int] = None
    action: str  # "login", "logout", "bid", "admin_action", "payment", etc.
    details: Optional[str] = None
    ip_address: Optional[str] = None

class LogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime