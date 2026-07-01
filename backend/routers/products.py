from fastapi import APIRouter, Depends, HTTPException, WebSocket, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from typing import Dict, Set
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
def get_products(db: Session = Depends(database.get_db)):
    products = db.query(models.Product).all()

    result = []

    for p in products:
        bid_count = db.query(models.Bid).filter(
            models.Bid.product_id == p.id
        ).count()

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
            "bid_count": bid_count
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

            now = datetime.utcnow()

            # auction ended
            if not product.end_time or now > product.end_time or product.status == "ended":
                product.status = "ended"
                db.commit()
                raise HTTPException(400, "Auction ended")

            # min bid check
            min_bid = product.current_price + product.step_price
            if bid_data.bid_amount < min_bid:
                raise HTTPException(400, f"Min bid is {min_bid}")

            # wallet
            wallet = db.query(models.Wallet).filter(
                models.Wallet.user_id == current_user.id
            ).first()

            if not wallet:
                wallet = models.Wallet(user_id=current_user.id, balance=0)
                db.add(wallet)
                db.commit()
                db.refresh(wallet)

            if wallet.balance < bid_data.bid_amount:
                raise HTTPException(400, "Not enough balance")

            # trừ tiền
            wallet.balance -= bid_data.bid_amount

            # anti-snipe
            remaining = (product.end_time - now).total_seconds()
            sniped = False

            if remaining < 30:
                product.end_time += timedelta(minutes=1)
                sniped = True

            # update price
            product.current_price = bid_data.bid_amount

            # create bid
            bid = models.Bid(
                product_id=product_id,
                user_id=current_user.id,
                bid_amount=bid_data.bid_amount
            )

            db.add(bid)
            db.commit()

        # broadcast realtime
        await auction_manager.broadcast(str(product_id), {
            "event": "new_bid_delta",
            "product_id": product_id,
            "current_price": product.current_price,
            "latest_bidder": current_user.username,
            "new_bid_history": {
                "user": current_user.username,
                "amount": bid_data.bid_amount,
                "time": now.isoformat()
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
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    filename = file.filename.replace(" ", "_")
    path = os.path.join(upload_dir, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/static/uploads/{filename}"

    product = models.Product(
        title=title,
        description=description,
        category_id=category_id,
        start_price=start_price,
        step_price=step_price,
        current_price=start_price,
        end_time=datetime.utcnow() + timedelta(hours=duration_hours),
        status="active",
        images=image_url,
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
    product_data: ProductUpdate,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Not found")

    if current_user.role == "seller" and product.seller_id != current_user.id:
        raise HTTPException(403, "Not owner")

    if current_user.role not in ["admin", "seller"]:
        raise HTTPException(403, "No permission")

    for k, v in product_data.model_dump(exclude_unset=True).items():
        setattr(product, k, v)

    db.commit()

    await auction_manager.broadcast(str(product_id), {
        "event": "product_updated",
        "product_id": product_id,
        "title": product.title,
        "current_price": product.current_price,
        "end_time": product.end_time.isoformat(),
        "status": product.status
    })

    return {"success": True}