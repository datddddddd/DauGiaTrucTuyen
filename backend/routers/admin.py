from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, Date
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phương thức thanh toán trực tiếp qua VietQR đã bị vô hiệu hóa. Vui lòng thanh toán trực tiếp qua VNPAY."
        )
    
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
    
    create_log(db, current_admin.id, "admin_action", f"Completed escrow for product {product_id}, released {highest_bid.bid_amount} to seller {seller_id}")
    return {"status": "success", "message": "Giải ngân tiền thầu cho người bán thành công!"}


@router.get("/payments")
def get_all_payments(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
    status: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    buyer_id: Optional[int] = None,
    seller_id: Optional[int] = None
):
    from sqlalchemy.orm import aliased
    Buyer = aliased(models.User, name="buyer")
    Seller = aliased(models.User, name="seller")
    
    query = db.query(
        models.Payment,
        models.Product,
        Buyer,
        Seller
    ).join(
        models.Product, models.Payment.auction_id == models.Product.id
    ).join(
        Buyer, models.Payment.user_id == Buyer.id
    ).outerjoin(
        Seller, models.Product.seller_id == Seller.id
    )
    
    if status:
        query = query.filter(models.Payment.status == status)
        
    if search:
        query = query.filter(
            or_(
                models.Product.title.ilike(f"%{search}%"),
                Buyer.username.ilike(f"%{search}%"),
                Seller.username.ilike(f"%{search}%")
            )
        )
        
    if buyer_id:
        query = query.filter(models.Payment.user_id == buyer_id)
        
    if seller_id:
        query = query.filter(models.Product.seller_id == seller_id)
        
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(models.Payment.created_at >= sd)
        except ValueError:
            pass
            
    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(models.Payment.created_at < ed)
        except ValueError:
            pass
            
    payments = query.order_by(models.Payment.created_at.desc()).all()
    
    result = []
    for pay, prod, buy, sell in payments:
        released_by_user = None
        if pay.released_by:
            released_by_user = db.query(models.User).filter(models.User.id == pay.released_by).first()
            
        result.append({
            "id": pay.id,
            "amount": pay.amount,
            "status": pay.status,
            "payment_method": pay.payment_method,
            "transaction_id": pay.transaction_id,
            "created_at": pay.created_at.isoformat() if pay.created_at else None,
            "released_by": (released_by_user.full_name or released_by_user.username) if released_by_user else None,
            "released_time": pay.released_time.isoformat() if pay.released_time else None,
            "buyer": {
                "id": buy.id,
                "username": buy.username,
                "email": buy.email,
                "full_name": getattr(buy, 'full_name', None),
                "phone": getattr(buy, 'phone', None),
                "address": getattr(buy, 'address', None),
            },
            "seller": {
                "id": sell.id if sell else None,
                "username": sell.username if sell else "N/A",
                "email": sell.email if sell else "N/A",
                "full_name": getattr(sell, 'full_name', None) if sell else None,
                "phone": getattr(sell, 'phone', None) if sell else None,
                "address": getattr(sell, 'address', None) if sell else None,
            },
            "product": {
                "id": prod.id,
                "title": prod.title,
                "status": prod.status
            }
        })
    return result


@router.get("/payments/stats")
def get_payment_stats(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    total_revenue = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "Released"
    ).scalar() or 0
    
    waiting_for_payout = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "WaitingForPayout"
    ).scalar() or 0
    
    released_count = db.query(models.Payment).filter(models.Payment.status == "Released").count()
    success_count = db.query(models.Payment).filter(models.Payment.status == "SUCCESS").count()
    failed_count = db.query(models.Payment).filter(models.Payment.status == "FAILED").count()
    pending_count = db.query(models.Payment).filter(models.Payment.status == "PENDING").count()
    waiting_count = db.query(models.Payment).filter(models.Payment.status == "WaitingForPayout").count()
    
    total_transactions = db.query(models.Payment).count()
    
    daily_revenue = []
    if db.bind.dialect.name == "sqlite":
        rows = db.query(
            func.strftime("%Y-%m-%d", models.Payment.released_time),
            func.sum(models.Payment.amount)
        ).filter(
            models.Payment.status == "Released",
            models.Payment.released_time != None
        ).group_by(
            func.strftime("%Y-%m-%d", models.Payment.released_time)
        ).order_by(
            func.strftime("%Y-%m-%d", models.Payment.released_time)
        ).all()
        for r_date, r_sum in rows:
            daily_revenue.append({"date": r_date, "amount": r_sum})
    else:
        rows = db.query(
            func.cast(models.Payment.released_time, Date),
            func.sum(models.Payment.amount)
        ).filter(
            models.Payment.status == "Released",
            models.Payment.released_time != None
        ).group_by(
            func.cast(models.Payment.released_time, Date)
        ).order_by(
            func.cast(models.Payment.released_time, Date)
        ).all()
        for r_date, r_sum in rows:
            daily_revenue.append({"date": r_date.isoformat(), "amount": r_sum})
            
    return {
        "total_revenue": total_revenue,
        "waiting_for_payout": waiting_for_payout,
        "released_payments_count": released_count,
        "success_payments_count": success_count,
        "failed_payments_count": failed_count,
        "pending_payments_count": pending_count,
        "waiting_payments_count": waiting_count,
        "total_transactions": total_transactions,
        "daily_revenue": daily_revenue
    }


@router.get("/payments/{payment_id}")
def get_payment_detail(
    payment_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin thanh toán!")
        
    prod = db.query(models.Product).filter(models.Product.id == payment.auction_id).first()
    buy = db.query(models.User).filter(models.User.id == payment.user_id).first()
    sell = db.query(models.User).filter(models.User.id == prod.seller_id).first() if prod else None
    vnp_tx = db.query(models.VNPTransaction).filter(models.VNPTransaction.payment_id == payment.id).first()
    
    released_by_user = None
    if payment.released_by:
        released_by_user = db.query(models.User).filter(models.User.id == payment.released_by).first()
        
    return {
        "id": payment.id,
        "amount": payment.amount,
        "status": payment.status,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "released_by": (released_by_user.full_name or released_by_user.username) if released_by_user else None,
        "released_time": payment.released_time.isoformat() if payment.released_time else None,
        "buyer": {
            "id": buy.id if buy else None,
            "username": buy.username if buy else "N/A",
            "email": buy.email if buy else "N/A",
            "full_name": getattr(buy, 'full_name', None) if buy else None,
            "phone": getattr(buy, 'phone', None) if buy else None,
            "address": getattr(buy, 'address', None) if buy else None,
        },
        "seller": {
            "id": sell.id if sell else None,
            "username": sell.username if sell else "N/A",
            "email": sell.email if sell else "N/A",
            "full_name": getattr(sell, 'full_name', None) if sell else None,
            "phone": getattr(sell, 'phone', None) if sell else None,
            "address": getattr(sell, 'address', None) if sell else None,
        },
        "product": {
            "id": prod.id if prod else None,
            "title": prod.title if prod else "N/A",
            "status": prod.status if prod else "N/A"
        },
        "vnpay_details": {
            "vnp_transaction_no": vnp_tx.vnp_transaction_no if vnp_tx else None,
            "bank_code": vnp_tx.bank_code if vnp_tx else None,
            "card_type": vnp_tx.card_type if vnp_tx else None,
            "response_code": vnp_tx.response_code if vnp_tx else None,
            "transaction_date": vnp_tx.transaction_date if vnp_tx else None,
        }
    }


@router.post("/payments/{payment_id}/release")
def release_payment(
    payment_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch thanh toán!")
        
    if payment.status == "Released":
        raise HTTPException(status_code=400, detail="Thanh toán này đã được giải ngân rồi!")
        
    if payment.status != "WaitingForPayout":
        raise HTTPException(status_code=400, detail="Chỉ cho phép giải ngân khi giao dịch ở trạng thái WaitingForPayout!")
        
    product = db.query(models.Product).filter(models.Product.id == payment.auction_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm liên quan!")
        
    seller_id = product.seller_id
    if not seller_id:
        raise HTTPException(status_code=400, detail="Sản phẩm không có thông tin người bán!")
        
    seller_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == seller_id).first()
    if not seller_wallet:
        seller_wallet = models.Wallet(user_id=seller_id, balance=0)
        db.add(seller_wallet)
        db.commit()
        db.refresh(seller_wallet)
        
    seller_wallet.balance += payment.amount
    seller_wallet.updated_at = datetime.utcnow()
    
    seller_tx = models.Transaction(
        user_id=seller_id,
        wallet_id=seller_wallet.id,
        amount=payment.amount,
        transaction_type="Auction Payout",
        payment_method="Escrow Release",
        description=f"Tiền từ phiên đấu giá #{product.id} đã được Admin giải ngân.",
        status="completed",
        product_id=product.id
    )
    db.add(seller_tx)
    
    payment.status = "Released"
    payment.released_by = current_admin.id
    payment.released_time = datetime.utcnow()
    payment.updated_at = datetime.utcnow()
    
    product.status = "completed"
    
    seller_notification = models.Notification(
        user_id=seller_id,
        title="💰 Tiền hàng đã được giải ngân!",
        message="Khoản thanh toán của phiên đấu giá đã được Admin giải ngân thành công. Số tiền đã được cộng vào Wallet của bạn.",
        notification_type="system",
        product_id=product.id,
        is_read=False
    )
    db.add(seller_notification)
    
    buyer_notification = models.Notification(
        user_id=payment.user_id,
        title="📦 Đơn hàng đã hoàn tất!",
        message="Đơn hàng của bạn đã hoàn tất. Khoản thanh toán đã được hệ thống giải ngân cho người bán. Cảm ơn bạn đã sử dụng hệ thống đấu giá.",
        notification_type="system",
        product_id=product.id,
        is_read=False
    )
    db.add(buyer_notification)
    
    db.commit()
    
    create_log(db, current_admin.id, "admin_action", f"Released payment {payment_id} for product {product.id} to seller {seller_id}")
    
    return {"status": "success", "message": "Giải ngân tiền hàng cho người bán thành công!"}