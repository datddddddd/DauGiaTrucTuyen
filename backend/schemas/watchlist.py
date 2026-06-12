from pydantic import BaseModel

class WatchlistCreate(BaseModel):
    product_id: int

class WatchlistResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_title: str
    current_price: int
    end_time: str