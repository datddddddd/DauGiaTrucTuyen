from pydantic import BaseModel
from typing import Optional

class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: int
    created_at: str
    updated_at: str

class TransactionCreate(BaseModel):
    amount: int
    transaction_type: str  # "deposit", "withdraw", "payment"
    payment_method: Optional[str] = None  # "VNPay", "MoMo", "Stripe"
    description: Optional[str] = None
    product_id: Optional[int] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: int
    transaction_type: str
    payment_method: Optional[str] = None
    description: Optional[str] = None
    status: str  # "pending", "completed", "failed"
    product_id: Optional[int] = None
    created_at: str