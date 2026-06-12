from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductCreate(BaseModel):
    title: str
    description: str
    category_id: Optional[int] = None
    start_price: int
    step_price: int
    duration_hours: int
    images: Optional[list[str]] = None
    condition: Optional[str] = "new"

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    step_price: Optional[int] = None
    current_price: Optional[int] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    images: Optional[list[str]] = None
    condition: Optional[str] = None

class ProductResponse(BaseModel):
    id: int
    title: str
    description: str
    category_id: Optional[int] = None
    start_price: int
    step_price: int
    current_price: int
    end_time: datetime
    status: str
    images: Optional[list[str]] = None
    condition: Optional[str] = None
    seller_id: Optional[int] = None
    bid_count: int = 0

class BidCreate(BaseModel):
    bid_amount: int

class BidResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    bid_amount: int
    created_at: datetime