from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str  # "bid_outbid", "auction_won", "auction_ending", "system"

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool = False
    created_at: datetime
    product_id: Optional[int] = None