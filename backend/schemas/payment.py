from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    auction_id: int
    user_id: int
    amount: int

class PaymentResponse(BaseModel):
    id: int
    user_id: int
    auction_id: int
    transaction_id: Optional[str] = None
    amount: int
    status: str
    payment_method: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentURLResponse(BaseModel):
    payment_url: str
