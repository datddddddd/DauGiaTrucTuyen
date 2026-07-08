from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportCreate(BaseModel):
    product_id: Optional[int] = None
    reported_user_id: Optional[int] = None
    report_type: str  # scam, fake_item, inappropriate, other
    description: str

class ReportResponse(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int]
    reported_user_id: Optional[int]
    report_type: str
    description: str
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None

    class Config:
        from_attributes = True
