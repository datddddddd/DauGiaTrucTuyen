from pydantic import BaseModel
from typing import Optional

class BannerCreate(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = None
    is_active: bool = True
    order: int = 0

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class BannerResponse(BaseModel):
    id: int
    title: str
    image_url: str
    link_url: Optional[str] = None
    is_active: bool
    order: int
    created_at: str