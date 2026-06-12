from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import threading

import database, models
from schemas.product import ProductCreate, ProductUpdate, ProductResponse, BidCreate, BidResponse
from routers.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/products", tags=["Products"])

db_lock = threading.Lock()

class AuctionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, product_id: str, websocket: WebSocket):
        await websocket.accept()
        if product_id not in self.active_connections:
            self.active_connections[product_id] = []
        self.active_connections[product_id].append(websocket)

    def disconnect(self, product_id: str, websocket: WebSocket):
        if product_id in self.active_connections:
            self.active_connections[product_id].remove(websocket)
            if not self.active_connections[product_id]:
                del self.active_connections[product_id]

    async def broadcast(self, product_id: str, data: dict):
        if product_id in self.active_connections:
            for connection in self.active_connections[product_id]:
                try:
                    await connection.send_json(data)
                except:
                    pass

auction_manager = AuctionManager()

@router.get("", response_model=List[ProductResponse])
def get_products(
    db: Session = Depends(database.get_db),
    category_id: Optional[int] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    status: Optional[str] = "active",
    sort_by: Optional[str] = "newest",
    search: Optional[str] = None
):
    query = db.query(models.Product)
    
    # Filters
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if min_price:
        query = query.filter(models.Product.current_price >= min_price)
    if max_price:
        query = query.filter(models.Product.current_price <= max_price)
    if status:
        query = query.filter(models.Product.status == status)
    if search:
        query = query.filter(
            or_(
                models.Product.title.ilike(f"%{search}%"),
                models.Product.description.ilike(f"%{search}%")
            )
        )
    
    # Sorting
    if sort_by == "newest":
        query = query.order_by(models.Product.created_at.desc() if hasattr(models.Product, 'created_at') else models.Product.id.desc())
    elif sort_by == "oldest":
        query = query.order_by(models.Product.created_at.asc() if hasattr(models.Product, 'created_at') else models.Product.id.asc())
    elif sort_by == "highest_price":
        query = query.order_by(models.Product.current_price.desc())
    elif sort_by == "lowest_price":
        query = query.order_by(models.Product.current_price.asc())
    elif sort_by == "ending_soon":
        query = query.order_by(models.Product.end_time.asc())
    
    products = query.all()
    
    # Add bid count
    result = []
    for p in products:
        bid_count = db.query(models.Bid).filter(models.Bid.product_id == p.id).count()
        product_dict = {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category_id": p.category_id,
            "start_price": p.start_price,
            "step_price": p.step_price,
            "current_price": p.current_price,
            "end_time": p.end_time,
            "status": p.status,
            "images": p.images,
            "condition": p.condition,
            "seller_id": p.seller_id,
            "bid_count": bid_count
        }
        result.append(product_dict)
    
    return result

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_detail(product_id: int, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm")
    
    bid_count = db.query(models.Bid).filter(models.Bid.product_id == product_id).count()
    
    return {
        "id": product.id,
        "title": product.title,
        "description": product.description,
        "category_id": product.category_id,
        "start_price": product.start_price,
        "step_price": product.step_price,
        "current_price": product.current_price,
        "end_time": product.end_time,
        "status": product.status,
        "images": product.images,
        "condition": product.condition,
        "seller_id": product.seller_id,
        "bid_count": bid_count
    }

@router.get("/{product_id}/bids", response_model=List[BidResponse])
def get_product_bids(product_id: int, db: Session = Depends(database.get_db)):
    bids = db.query(models.Bid).filter(models.Bid.product_id == product_id)\
             .order_by(models.Bid.created_at.desc()).all()
    
    return [
        {
            "id": bid.id,
            "product_id": bid.product_id,
            "user_id": bid.user_id,
            "username": bid.user.username,
            "bid_amount": bid.bid_amount,
            "created_at": bid.created_at
        }
        for bid in bids
    ]

@router.post("/{product_id}/bid")
async def place_bid(
    product_id: int,
    bid_data: BidCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    with db_lock:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sản phẩm không tồn tại")
        
        now = datetime.utcnow()
        if now > product.end_time or product.status == "ended":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phiên đấu giá này đã kết thúc!")
        
        min_required_bid = product.current_price + product.step_price
        if bid_data.bid_amount < min_required_bid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Giá đặt tối thiểu tiếp theo phải là {min_required_bid:,} VNĐ"
            )

        # Anti-snipe mechanism
        time_remaining = (product.end_time - now).total_seconds()
        sniped = False
        if 0 < time_remaining < 30:
            product.end_time = product.end_time + timedelta(minutes=1)
            sniped = True

        product.current_price = bid_data.bid_amount
        
        new_bid = models.Bid(
            product_id=product.id,
            user_id=current_user.id,
            bid_amount=bid_data.bid_amount
        )
        db.add(new_bid)
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Giao dịch thất bại!")

        # Notify previous bidder (outbid notification)
        previous_bids = db.query(models.Bid).filter(
            models.Bid.product_id == product_id,
            models.Bid.user_id != current_user.id
        ).order_by(models.Bid.bid_amount.desc()).first()
        
        if previous_bids:
            notification = models.Notification(
                user_id=previous_bids.user_id,
                title="Bạn đã bị vượt giá!",
                message=f"Ai đó vừa đặt giá cao hơn bạn cho sản phẩm '{product.title}'",
                notification_type="bid_outbid",
                product_id=product_id
            )
            db.add(notification)
            db.commit()

        # Broadcast real-time update
        await auction_manager.broadcast(str(product_id), {
            "event": "new_bid_delta",
            "current_price": product.current_price,
            "latest_bidder": current_user.username,
            "end_time": product.end_time.isoformat(),
            "new_bid_history": {
                "username": current_user.username,
                "amount": bid_data.bid_amount,
                "time": datetime.now().strftime("%H:%M:%S")
            }
        })
        
        return {"status": "success", "sniped": sniped}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check if user can create products (admin or seller)
    if current_user.role not in ["admin", "seller"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền đăng sản phẩm đấu giá!"
        )
    
    end_time_calc = datetime.now() + timedelta(hours=product_data.duration_hours)
    
    # Convert images list to JSON string
    images_json = str(product_data.images) if product_data.images else None
    
    new_product = models.Product(
        title=product_data.title,
        description=product_data.description,
        category_id=product_data.category_id,
        start_price=product_data.start_price,
        step_price=product_data.step_price,
        current_price=product_data.start_price,
        end_time=end_time_calc,
        status="active",
        images=images_json,
        condition=product_data.condition,
        seller_id=current_user.id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return {
        "status": "success", 
        "message": "Đăng sản phẩm đấu giá thành công!", 
        "product_id": new_product.id
    }

@router.put("/{product_id}")
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm")
    
    # Check permissions: admin can edit any, seller can only edit their own
    if current_user.role == "admin" or (current_user.role == "seller" and product.seller_id == current_user.id):
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền chỉnh sửa sản phẩm này!"
        )

    updates = product_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu để cập nhật")

    for field, value in updates.items():
        if hasattr(product, field):
            if field == "images" and value:
                setattr(product, field, str(value))
            else:
                setattr(product, field, value)

    db.commit()
    db.refresh(product)

    await auction_manager.broadcast(str(product_id), {
        "event": "product_updated",
        "product_id": product_id,
        "title": product.title,
        "current_price": product.current_price,
        "end_time": product.end_time.isoformat(),
        "status": product.status,
    })

    return {"status": "success", "message": f"Đã cập nhật sản phẩm #{product_id} thành công."}
