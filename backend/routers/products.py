from fastapi import APIRouter, Depends, HTTPException, WebSocket, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from typing import Dict, Set, Optional
import threading
import database, models
from schemas.product import ProductUpdate, BidCreate
from routers.auth import get_current_user
import shutil, os

router = APIRouter(prefix="/api/products", tags=["Products"])

# =========================
# LOCK (SAFE FOR SQLITE / SMALL MYSQL)
# =========================
db_lock = threading.Lock()


# =========================
# WEBSOCKET MANAGER
# =========================
class AuctionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, product_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(product_id, set()).add(websocket)

    def disconnect(self, product_id: str, websocket: WebSocket):
        if product_id in self.active_connections:
            self.active_connections[product_id].discard(websocket)
            if not self.active_connections[product_id]:
                del self.active_connections[product_id]

    async def broadcast(self, product_id: str, data: dict):
        if product_id not in self.active_connections:
            return

        dead = []

        for ws in self.active_connections[product_id]:
            try:
                await ws.send_json(data)
            except:
                dead.append(ws)

        for ws in dead:
            try:
                await ws.close()
            except:
                pass
            self.disconnect(product_id, ws)


auction_manager = AuctionManager()


# =========================
# GET ALL PRODUCTS
# =========================
@router.get("")
def get_products(
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    seller_id: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Product)
    
    # 1. Status Filter
    if status is not None:
        query = query.filter(models.Product.status == status)
    else:
        # If no status filter, default to showing active and ended only (hide pending/rejected from general public)
        if seller_id is None:
            query = query.filter(models.Product.status.in_(["active", "ended", "confirmed", "shipping", "completed", "delivered"]))
            
    # 1b. Seller Filter
    if seller_id is not None:
        query = query.filter(models.Product.seller_id == seller_id)
        
    # 2. Category Filter (supporting subcategories)
    if category_id is not None:
        # Find all subcategory IDs under this category
        subcat_ids = db.query(models.Category.id).filter(models.Category.parent_id == category_id).all()
        subcat_ids = [s[0] for s in subcat_ids]
        cat_ids = [category_id] + subcat_ids
        query = query.filter(models.Product.category_id.in_(cat_ids))
        
    # 3. Price Range Filters
    if min_price is not None:
        query = query.filter(models.Product.current_price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.current_price <= max_price)
        
    # 4. Search Query (matching title or description, case-insensitive)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Product.title.like(search_filter)) |
            (models.Product.description.like(search_filter))
        )
        
    # 5. Sorting
    if sort == "newest":
        query = query.order_by(models.Product.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(models.Product.created_at.asc())
    elif sort == "highest_price":
        query = query.order_by(models.Product.current_price.desc())
    elif sort == "lowest_price":
        query = query.order_by(models.Product.current_price.asc())
    elif sort == "ending_soon":
        query = query.order_by(models.Product.end_time.asc())
    elif sort == "most_bids":
        from sqlalchemy import func
        query = query.outerjoin(models.Bid).group_by(models.Product.id).order_by(func.count(models.Bid.id).desc())
    else:
        query = query.order_by(models.Product.created_at.desc())

    products = query.all()

    result = []

    for p in products:
        bid_count = db.query(models.Bid).filter(
            models.Bid.product_id == p.id
        ).count()

        buyer_name = ""
        buyer_phone = ""
        buyer_address = ""
        
        if p.status in ["ended", "wait_confirm", "confirmed", "shipping", "completed", "delivered"] and bid_count > 0:
            highest_bid = db.query(models.Bid).filter(
                models.Bid.product_id == p.id
            ).order_by(models.Bid.bid_amount.desc()).first()
            if highest_bid and highest_bid.user:
                buyer_name = highest_bid.user.username
                buyer_phone = getattr(highest_bid.user, 'phone', '') or ""
                buyer_address = getattr(highest_bid.user, 'address', '') or ""

        result.append({
            "id": p.id,
            "title": p.title or "",
            "description": p.description or "",
            "category_id": p.category_id,
            "start_price": p.start_price or 0,
            "step_price": p.step_price or 0,
            "current_price": p.current_price or 0,
            "status": p.status or "active",
            "images": p.images or "",
            "seller_id": p.seller_id,
            "bid_count": bid_count,
            "end_time": p.end_time.isoformat() if p.end_time else None,
            "condition": p.condition or "new",
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "shipping_code": p.shipping_code or "",
            "buyer_name": buyer_name,
            "buyer_phone": buyer_phone,
            "buyer_address": buyer_address
        })

    return result


@router.get("/user/bids")
def get_my_bids(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    bids = db.query(models.Bid).filter(models.Bid.user_id == current_user.id).order_by(models.Bid.created_at.desc()).all()
    seen_products = set()
    result = []
    
    for bid in bids:
        if bid.product_id in seen_products:
            continue
        seen_products.add(bid.product_id)
        
        product = bid.product
        if not product:
            continue
            
        if product.status == "active":
            bid_status = "active"
        else:
            highest_bid = db.query(models.Bid).filter(
                models.Bid.product_id == product.id
            ).order_by(models.Bid.bid_amount.desc()).first()
            if highest_bid and highest_bid.user_id == current_user.id:
                bid_status = "won"
            else:
                bid_status = "lost"
                
        result.append({
            "product_id": product.id,
            "product_name": product.title,
            "amount": bid.bid_amount,
            "status": bid_status,
            "date": bid.created_at.strftime("%Y-%m-%d %H:%M:%S") if bid.created_at else None
        })
    return result


@router.get("/user/won-products")
def get_my_won_products(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    ended_products = db.query(models.Product).filter(
        models.Product.status.in_(["ended", "wait_confirm", "confirmed", "shipping", "completed", "delivered"])
    ).all()
    
    result = []
    for p in ended_products:
        highest_bid = db.query(models.Bid).filter(
            models.Bid.product_id == p.id
        ).order_by(models.Bid.bid_amount.desc()).first()
        
        if highest_bid and highest_bid.user_id == current_user.id:
            shipping_code = p.shipping_code or ""
            
            vnp_payment = db.query(models.Payment).filter(
                models.Payment.auction_id == p.id,
                models.Payment.status.in_(["SUCCESS", "WaitingForPayout", "Released"])
            ).first()
            
            if vnp_payment:
                payment_method = vnp_payment.payment_method or "VNPAY"
            else:
                payment_tx = db.query(models.Transaction).filter(
                    models.Transaction.user_id == current_user.id,
                    models.Transaction.product_id == p.id,
                    models.Transaction.transaction_type == "payment"
                ).first()
                payment_method = payment_tx.payment_method if payment_tx else ("VNPAY" if p.status != "ended" else "Chưa thanh toán")
            
            result.append({
                "id": p.id,
                "title": p.title,
                "price": p.current_price,
                "paymentMethod": payment_method,
                "status": p.status,
                "shipping_code": shipping_code,
                "date": p.end_time.strftime("%Y-%m-%d") if p.end_time else None
            })
    return result


# =========================
# GET DETAIL PRODUCT
# =========================
@router.get("/{product_id}")
def get_product_detail(product_id: int, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Product not found")

    bid_count = db.query(models.Bid).filter(
        models.Bid.product_id == product_id
    ).count()

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


# =========================
# PLACE BID (FIXED + SAFE)
# =========================
@router.post("/{product_id}/bid")
async def place_bid(
    product_id: int,
    bid_data: BidCreate,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    try:
        with db_lock:

            product = db.query(models.Product).filter(
                models.Product.id == product_id
            ).with_for_update().first()

            if not product:
                raise HTTPException(404, "Product not found")

            if product.seller_id == current_user.id:
                raise HTTPException(400, "Bạn không thể tự đấu giá sản phẩm của chính mình!")

            if current_user.role == "admin":
                raise HTTPException(400, "Quản trị viên không thể tham gia đấu giá!")

            now = datetime.utcnow()

            # auction ended
            if not product.end_time or now > product.end_time or product.status == "ended":
                product.status = "ended"
                db.commit()
                raise HTTPException(400, "Auction ended")

            # min bid check
            # min bid check
            min_bid = product.current_price + product.step_price
            if bid_data.bid_amount < min_bid:
                raise HTTPException(400, f"Min bid is {min_bid}")

            # anti-snipe
            remaining = (product.end_time - now).total_seconds()
            sniped = False

            if remaining < 30:
                product.end_time += timedelta(minutes=1)
                sniped = True

            # Find previous highest bid for notification
            previous_highest_bid = db.query(models.Bid).filter(
                models.Bid.product_id == product_id
            ).order_by(models.Bid.bid_amount.desc()).first()

            # update price
            product.current_price = bid_data.bid_amount

            # create bid
            bid = models.Bid(
                product_id=product_id,
                user_id=current_user.id,
                bid_amount=bid_data.bid_amount
            )

            db.add(bid)

            if previous_highest_bid and previous_highest_bid.user_id != current_user.id:
                outbid_notification = models.Notification(
                    user_id=previous_highest_bid.user_id,
                    title="🚨 Bạn đã bị vượt giá!",
                    message=f"Đã có người đặt giá cao hơn cho sản phẩm '{product.title}'. Giá hiện tại là {bid_data.bid_amount:,} VNĐ.",
                    notification_type="bid_outbid",
                    product_id=product.id,
                    is_read=False
                )
                db.add(outbid_notification)

            db.commit()

        # broadcast realtime
        await auction_manager.broadcast(str(product_id), {
            "event": "new_bid_delta",
            "product_id": product_id,
            "current_price": product.current_price,
            "latest_bidder": current_user.username,
            "new_bid_history": {
                "user": current_user.username,
                "username": current_user.username,
                "amount": bid_data.bid_amount,
                "bid_amount": bid_data.bid_amount,
                "time": now.strftime("%Y-%m-%d %H:%M:%S"),
                "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
            },
            "end_time": product.end_time.isoformat()
        })

        return {"success": True, "sniped": sniped}

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(500, "Database error")


# =========================
# CREATE PRODUCT
# =========================
@router.post("")
def create_product(
    title: str = Form(...),
    description: str = Form(...),
    category_id: int = Form(...),
    start_price: int = Form(...),
    step_price: int = Form(...),
    duration_hours: int = Form(...),
    condition: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    import json
    import uuid

    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    image_urls = []
    for file in files:
        safe_name = "".join([c if c.isalnum() or c in "._-" else "_" for c in file.filename])
        unique_filename = f"{uuid.uuid4()}_{safe_name}"
        path = os.path.join(upload_dir, unique_filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        image_urls.append(f"/static/uploads/{unique_filename}")

    product = models.Product(
        title=title,
        description=description,
        category_id=category_id,
        start_price=start_price,
        step_price=step_price,
        current_price=start_price,
        end_time=datetime.utcnow() + timedelta(hours=duration_hours),
        status="active" if current_user.role == "admin" else "pending",
        images=json.dumps(image_urls),
        condition=condition,
        seller_id=current_user.id
    )

    db.add(product)
    db.commit()

    return {"message": "Created successfully"}


# =========================
# UPDATE PRODUCT
# =========================
@router.put("/{product_id}")
async def update_product(
    product_id: int,
    title: str = Form(...),
    description: str = Form(...),
    category_id: Optional[int] = Form(None),
    step_price: Optional[int] = Form(None),
    condition: Optional[str] = Form(None),
    files: Optional[list[UploadFile]] = File(None),
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    import json
    import uuid

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Not found")

    if current_user.role == "seller" and product.seller_id != current_user.id:
        raise HTTPException(403, "Not owner")

    if current_user.role not in ["admin", "seller"]:
        raise HTTPException(403, "No permission")

    product.title = title
    product.description = description
    
    if category_id is not None:
        product.category_id = category_id
    if step_price is not None:
        product.step_price = step_price
    if condition is not None:
        product.condition = condition

    if files:
        upload_dir = "static/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        image_urls = []
        for file in files:
            safe_name = "".join([c if c.isalnum() or c in "._-" else "_" for c in file.filename])
            unique_filename = f"{uuid.uuid4()}_{safe_name}"
            path = os.path.join(upload_dir, unique_filename)
            with open(path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            image_urls.append(f"/static/uploads/{unique_filename}")
        product.images = json.dumps(image_urls)

    db.commit()

    # Robust datetime string formatting
    end_time_str = None
    if product.end_time:
        if hasattr(product.end_time, "isoformat"):
            end_time_str = product.end_time.isoformat()
        else:
            end_time_str = str(product.end_time)

    await auction_manager.broadcast(str(product_id), {
        "event": "product_updated",
        "product_id": product_id,
        "title": product.title,
        "current_price": product.current_price,
        "end_time": end_time_str,
        "status": product.status
    })

    return {"success": True}


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm!")
    if current_user.role != "admin" and product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa sản phẩm này!")
    
    bid_count = db.query(models.Bid).filter(models.Bid.product_id == product_id).count()
    if bid_count > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa sản phẩm đã có lượt đặt giá!")
        
    db.delete(product)
    db.commit()
    return {"success": True, "message": "Xóa sản phẩm thành công!"}


@router.post("/{product_id}/relist")
def relist_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm!")
    if current_user.role != "admin" and product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền đăng lại sản phẩm này!")
        
    product.status = "active" if current_user.role == "admin" else "pending"
    product.current_price = product.start_price
    product.end_time = datetime.utcnow() + timedelta(hours=24)
    
    db.query(models.Bid).filter(models.Bid.product_id == product_id).delete()
    db.commit()
    return {"success": True, "message": "Đăng lại sản phẩm thành công!"}


@router.patch("/{product_id}/status")
def update_product_order_status(
    product_id: int,
    status_data: dict,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm!")
        
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ!")
        
    if new_status == "preparing":
        if current_user.role != "admin" and product.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền chuẩn bị hàng cho đơn hàng này!")
            
    elif new_status == "delivered":
        if product.status not in ["shipping", "Đang vận chuyển"]:
            raise HTTPException(status_code=400, detail="Đơn hàng phải ở trạng thái đang giao mới có thể xác nhận đã nhận hàng!")
            
        highest_bid = db.query(models.Bid).filter(
            models.Bid.product_id == product_id
        ).order_by(models.Bid.bid_amount.desc()).first()
        if not highest_bid or highest_bid.user_id != current_user.id:
            if current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Bạn không có quyền xác nhận nhận hàng cho đơn hàng này!")
        
        # Cập nhật trạng thái Payment của sản phẩm này thành "WaitingForPayout"
        payment = db.query(models.Payment).filter(
            models.Payment.auction_id == product_id,
            models.Payment.status == "SUCCESS"
        ).first()
        if payment:
            payment.status = "WaitingForPayout"
            payment.updated_at = datetime.utcnow()
            
        # Thêm thông báo cho người bán và admin
        if product.seller_id:
            seller_notification = models.Notification(
                user_id=product.seller_id,
                title="📦 Khách hàng đã nhận được hàng!",
                message="Người mua đã xác nhận nhận hàng. Giao dịch đang chờ Admin giải ngân.",
                notification_type="system",
                product_id=product.id,
                is_read=False
            )
            db.add(seller_notification)
            
        admin_users = db.query(models.User).filter(models.User.role == "admin").all()
        for admin_user in admin_users:
            admin_notification = models.Notification(
                user_id=admin_user.id,
                title="🔔 Đơn hàng chờ giải ngân",
                message="Có giao dịch mới đang chờ giải ngân.",
                notification_type="system",
                product_id=product.id,
                is_read=False
            )
            db.add(admin_notification)
    else:
        if current_user.role != "admin" and product.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật trạng thái đơn hàng này!")
            
    product.status = new_status
    db.commit()
    return {"success": True, "message": f"Cập nhật trạng thái thành công sang {new_status}!"}


@router.post("/{product_id}/ship")
def ship_product(
    product_id: int,
    ship_data: dict,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm!")
    if current_user.role != "admin" and product.seller_id != current_user.id:
        raise HTTPException(403, "Bạn không có quyền cập nhật đơn hàng này!")
    
    shipping_code = ship_data.get("shipping_code")
    if not shipping_code:
        raise HTTPException(400, "Vui lòng nhập mã vận đơn!")
        
    product.shipping_code = shipping_code
    product.status = "shipping"
    
    # Gửi thông báo cho người mua
    highest_bid = db.query(models.Bid).filter(
        models.Bid.product_id == product_id
    ).order_by(models.Bid.bid_amount.desc()).first()
    
    if highest_bid:
        buyer_notification = models.Notification(
            user_id=highest_bid.user_id,
            title="🚚 Đơn hàng đang được giao!",
            message=f"Sản phẩm '{product.title}' đang được giao cho bạn. Mã vận đơn: {shipping_code}.",
            notification_type="system",
            product_id=product.id,
            is_read=False
        )
        db.add(buyer_notification)
        
    db.commit()
    return {"success": True, "message": "Xác nhận giao hàng thành công!"}


@router.post("/{product_id}/reviews")
def create_product_review(
    product_id: int,
    review_data: dict,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm!")
    
    highest_bid = db.query(models.Bid).filter(
        models.Bid.product_id == product_id
    ).order_by(models.Bid.bid_amount.desc()).first()
    
    if not highest_bid or highest_bid.user_id != current_user.id:
        raise HTTPException(403, "Bạn không phải người thắng phiên đấu giá này!")
        
    if product.status not in ["completed", "delivered"]:
        raise HTTPException(400, "Bạn chỉ có thể đánh giá sau khi đã nhận được hàng!")
        
    existing = db.query(models.Review).filter(
        models.Review.product_id == product_id,
        models.Review.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(400, "Bạn đã đánh giá sản phẩm này rồi!")
        
    new_review = models.Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.get("rating", 5),
        comment=review_data.get("comment", "")
    )
    db.add(new_review)
    db.commit()
    return {"success": True, "message": "Gửi đánh giá thành công!"}


@router.get("/{product_id}/bids")
def get_product_bids(
    product_id: int,
    db: Session = Depends(database.get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm!")
        
    bids = db.query(models.Bid).filter(
        models.Bid.product_id == product_id
    ).order_by(models.Bid.created_at.desc()).all()
    
    return [
        {
            "id": bid.id,
            "username": bid.user.username if bid.user else "Khách ẩn danh",
            "bid_amount": bid.bid_amount,
            "created_at": bid.created_at.strftime("%Y-%m-%d %H:%M:%S") if bid.created_at else None
        }
        for bid in bids
    ]


@router.get("/{product_id}/reviews")
def get_product_reviews(
    product_id: int,
    db: Session = Depends(database.get_db)
):
    reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "username": r.user.username if r.user else "Khách ẩn danh",
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else None
        }
        for r in reviews
    ]