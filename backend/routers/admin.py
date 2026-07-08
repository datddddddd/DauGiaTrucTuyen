from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import bcrypt
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
            "isBlocked": getattr(u, 'is_blocked', False),
            "isVerified": getattr(u, 'is_verified', False),
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
            "isApproved": p.status not in ["pending", "rejected"],
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
            
    elif transaction.transaction_type == "deposit":
        # Approve VietQR deposit
        wallet = db.query(models.Wallet).filter(models.Wallet.id == transaction.wallet_id).first()
        if wallet:
            wallet.balance += transaction.amount
            wallet.updated_at = datetime.utcnow()
            transaction.status = "completed"
            
            # Send notification to user
            deposit_notification = models.Notification(
                user_id=transaction.user_id,
                title="💳 Nạp tiền thành công!",
                message=f"Giao dịch nạp tiền qua {transaction.payment_method or 'VietQR'} trị giá {transaction.amount:,} VNĐ đã được duyệt thành công.",
                notification_type="system",
                is_read=False
            )
            db.add(deposit_notification)
            db.commit()
            
    elif transaction.transaction_type == "payment":
        # Approve direct product payment (VietQR)
        transaction.status = "completed"
        
        # Update product status to confirmed (Đang soạn hàng)
        product = None
        if transaction.product_id:
            product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
        else:
            # Fallback to parsing product ID from description if product_id is not set
            import re
            match = re.search(r"#(\d+)", transaction.description or "")
            if match:
                prod_id = int(match.group(1))
                product = db.query(models.Product).filter(models.Product.id == prod_id).first()
                
        if product:
            product.status = "confirmed"
            
            # Send notification to winner (buyer)
            buyer_notification = models.Notification(
                user_id=transaction.user_id,
                title="💳 Xác nhận thanh toán thành công",
                message=f"Thanh toán VietQR cho đơn hàng '{product.title}' đã được Ban quản trị xác nhận thành công.",
                notification_type="system",
                product_id=product.id,
                is_read=False
            )
            db.add(buyer_notification)
            
            # Send notification to seller
            if product.seller_id:
                seller_notification = models.Notification(
                    user_id=product.seller_id,
                    title="💰 Đơn hàng đã được thanh toán",
                    message=f"Người mua đã thanh toán cho sản phẩm '{product.title}'. Vui lòng soạn hàng và cập nhật mã vận đơn.",
                    notification_type="system",
                    product_id=product.id,
                    is_read=False
                )
                db.add(seller_notification)
                
        db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Approved transaction {transaction_id}")
    
    return {"status": "success", "message": "Đã duyệt giao dịch thành công!"}

@router.put("/users/{user_id}/toggle-block")
def toggle_user_block(
    user_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự khóa chính mình!")
    
    user.is_blocked = not getattr(user, 'is_blocked', False)
    db.commit()
    
    status_str = "khóa" if user.is_blocked else "mở khóa"
    create_log(db, current_admin.id, "admin_action", f"Toggled user {user.username} block status to {user.is_blocked}")
    return {"status": "success", "message": f"Đã {status_str} tài khoản {user.username} thành công!"}

@router.put("/users/{user_id}/verify-seller")
def verify_seller(
    user_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
    
    user.is_verified = True
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Verified seller {user.username}")
    return {"status": "success", "message": f"Đã phê duyệt xác minh tài khoản Seller {user.username}!"}

@router.put("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
        
    temp_pwd = "user123"
    hashed_pwd = bcrypt.hashpw(temp_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.hashed_password = hashed_pwd
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Reset password for user {user.username}")
    return {"status": "success", "message": f"Mật khẩu tạm thời mới của {user.username} là: {temp_pwd}"}

@router.put("/products/{product_id}/approve")
def approve_product_admin(
    product_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên đấu giá!")
        
    product.status = "active"
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Approved product {product.title}")
    return {"status": "success", "message": f"Đã duyệt sản phẩm {product.title} thành công!"}

@router.put("/products/{product_id}/reject")
def reject_product_admin(
    product_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên đấu giá!")
        
    product.status = "rejected"
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Rejected product {product.title}")
    return {"status": "success", "message": f"Đã từ chối duyệt sản phẩm {product.title}!"}


@router.post("/products/{product_id}/complete-escrow")
def complete_escrow(
    product_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm!")
    if product.status != "completed":
        raise HTTPException(status_code=400, detail="Đơn hàng phải ở trạng thái đã giao hàng (completed) mới giải ngân!")
        
    highest_bid = db.query(models.Bid).filter(
        models.Bid.product_id == product_id
    ).order_by(models.Bid.bid_amount.desc()).first()
    
    if not highest_bid:
        raise HTTPException(status_code=400, detail="Không tìm thấy lượt đấu giá thắng thầu!")
        
    seller_id = product.seller_id
    if not seller_id:
        raise HTTPException(status_code=400, detail="Sản phẩm không có thông tin người bán!")
        
    seller_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == seller_id).first()
    if not seller_wallet:
        seller_wallet = models.Wallet(user_id=seller_id, balance=0)
        db.add(seller_wallet)
        db.commit()
        db.refresh(seller_wallet)
        
    # Giải phóng tiền hàng từ ký quỹ chuyển vào ví seller
    seller_wallet.balance += highest_bid.bid_amount
    seller_wallet.updated_at = datetime.utcnow()
    
    # Tạo giao dịch giải ngân
    seller_tx = models.Transaction(
        user_id=seller_id,
        wallet_id=seller_wallet.id,
        amount=highest_bid.bid_amount,
        transaction_type="deposit",
        payment_method="Escrow Release",
        description=f"Nhận tiền giải ngân đấu giá sản phẩm #{product_id}: {product.title}",
        status="completed",
        product_id=product_id
    )
    db.add(seller_tx)
    
    # Cập nhật sản phẩm sang trạng thái giao dịch hoàn tất (delivered)
    product.status = "delivered"
    
    # Gửi thông báo cho Seller
    seller_notification = models.Notification(
        user_id=seller_id,
        title="💰 Tiền hàng đã được giải ngân!",
        message=f"Đơn hàng '{product.title}' đã được giải ngân. Số tiền {highest_bid.bid_amount:,} VNĐ đã được cộng vào ví của bạn.",
        notification_type="system",
        product_id=product.id,
        is_read=False
    )
    db.add(seller_notification)
    
    db.commit()
    create_log(db, current_admin.id, "admin_action", f"Completed escrow for product {product_id}, released {highest_bid.bid_amount} to seller {seller_id}")
    return {"status": "success", "message": "Giải ngân tiền thầu cho người bán thành công!"}