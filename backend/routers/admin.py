from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, timedelta

import database, models
from routers.auth import get_current_admin, get_current_user
from utils.system_logger import get_all_logs, get_admin_logs, create_log

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
def get_admin_stats(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    
    return {
        "total_users": db.query(models.User).count(),
        "total_admins": db.query(models.User).filter(models.User.role == "admin").count(),
        "total_sellers": db.query(models.User).filter(models.User.role == "seller").count(),
        "total_buyers": db.query(models.User).filter(models.User.role == "buyer").count(),
        "active_auctions": db.query(models.Product).filter(models.Product.status == "active").count(),
        "ended_auctions": db.query(models.Product).filter(models.Product.status == "ended").count(),
        "total_bids": db.query(models.Bid).count(),
        "total_revenue": db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.transaction_type == "payment",
            models.Transaction.status == "completed"
        ).scalar() or 0,
        "today_bids": db.query(models.Bid).filter(models.Bid.created_at >= yesterday).count(),
        "today_users": db.query(models.User).filter(models.User.id >= 1).count()  # Simplified for demo
    }

@router.get("/users")
def get_all_users(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
    search: Optional[str] = None,
    role_filter: Optional[str] = None
):
    query = db.query(models.User)
    
    if search:
        query = query.filter(
            or_(
                models.User.username.ilike(f"%{search}%"),
                models.User.email.ilike(f"%{search}%")
            )
        )
    
    if role_filter:
        query = query.filter(models.User.role == role_filter)
    
    users = query.order_by(models.User.id.desc()).all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "full_name": getattr(u, 'full_name', None),
            "bid_count": db.query(models.Bid).filter(models.Bid.user_id == u.id).count(),
            "created_at": getattr(u, 'created_at', None) if hasattr(u, 'created_at') else None
        }
        for u in users
    ]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: dict,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng!")
    
    if user_id == current_admin.id and role_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn không thể tự hạ quyền của mình!")
    
    new_role = role_data.get("role")
    if new_role not in ["admin", "buyer", "seller"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vai trò không hợp lệ!")
    
    user.role = new_role
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Changed user {user.username} role to {new_role}")
    
    return {"status": "success", "message": f"Đã cập nhật vai trò của {user.username} thành {new_role}!"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng!")
    
    if user_id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn không thể xóa tài khoản của mình!")
    
    username = user.username
    db.delete(user)
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Deleted user {username}")
    
    return {"status": "success", "message": f"Đã xóa người dùng {username}!"}

@router.get("/products")
def get_all_products_admin(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
    status_filter: Optional[str] = None
):
    query = db.query(models.Product)
    
    if status_filter:
        query = query.filter(models.Product.status == status_filter)
    
    products = query.order_by(models.Product.id.desc()).all()
    
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category_id": p.category_id,
            "start_price": p.start_price,
            "step_price": p.step_price,
            "current_price": p.current_price,
            "end_time": p.end_time.isoformat() if p.end_time else None,
            "status": p.status,
            "seller_id": p.seller_id,
            "bid_count": db.query(models.Bid).filter(models.Bid.product_id == p.id).count(),
        }
        for p in products
    ]

@router.put("/products/{product_id}/close")
async def force_close_auction(
    product_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    # Import auction_manager when needed to avoid circular import
    from routers.products import auction_manager
    
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm!")
    
    product.status = "ended"
    product.end_time = datetime.utcnow()
    db.commit()
    
    # Try to broadcast via WebSocket, but don't fail if it's not available
    try:
        await auction_manager.broadcast(str(product_id), {
            "event": "auction_ended_by_admin",
            "product_id": product_id,
            "status": "ended",
            "message": "Phiên đấu giá này đã bị Quản trị viên đóng lại."
        })
    except:
        pass  # WebSocket broadcast is optional
    
    create_log(db, current_admin.id, "admin_action", f"Force closed auction {product_id}")
    
    return {"status": "success", "message": f"Đã đóng phiên đấu giá #{product_id}!"}

@router.get("/logs")
def get_system_logs(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
    action_filter: Optional[str] = None,
    limit: int = 100
):
    logs = get_all_logs(db, action_filter, limit)
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else None,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

@router.get("/transactions")
def get_all_transactions(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
    status_filter: Optional[str] = None,
    limit: int = 50
):
    query = db.query(models.Transaction)
    
    if status_filter:
        query = query.filter(models.Transaction.status == status_filter)
    
    transactions = query.order_by(models.Transaction.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "username": t.user.username if t.user else None,
            "amount": t.amount,
            "transaction_type": t.transaction_type,
            "payment_method": t.payment_method,
            "description": t.description,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in transactions
    ]

@router.put("/transactions/{transaction_id}/approve")
def approve_transaction(
    transaction_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy giao dịch!")
    
    if transaction.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Giao dịch này không ở trạng thái chờ xử lý!")
    
    if transaction.transaction_type == "withdraw":
        wallet = db.query(models.Wallet).filter(models.Wallet.id == transaction.wallet_id).first()
        if wallet and wallet.balance >= transaction.amount:
            wallet.balance -= transaction.amount
            wallet.updated_at = datetime.utcnow()
            transaction.status = "completed"
            db.commit()
        else:
            transaction.status = "failed"
            db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Số dư không đủ để duyệt rút tiền!")
    
    create_log(db, current_admin.id, "admin_action", f"Approved transaction {transaction_id}")
    
    return {"status": "success", "message": "Đã duyệt giao dịch thành công!"}