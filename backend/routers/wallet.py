import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import random
import string
from datetime import datetime

import database, models
from schemas.wallet import WalletResponse, TransactionCreate, TransactionResponse
from routers.auth import get_current_user
from routers.payment import vnpay_client

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])

def generate_transaction_code():
    """Generate unique transaction code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

@router.get("", response_model=WalletResponse)
def get_wallet(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        # Create wallet if doesn't exist
        wallet = models.Wallet(user_id=current_user.id, balance=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return {
        "id": wallet.id,
        "user_id": wallet.user_id,
        "balance": wallet.balance,
        "created_at": wallet.created_at.isoformat() if wallet.created_at else None,
        "updated_at": wallet.updated_at.isoformat() if wallet.updated_at else None
    }

@router.post("/deposit", status_code=status.HTTP_201_CREATED)
def deposit_money(
    transaction_data: TransactionCreate,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if transaction_data.transaction_type != "deposit":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Loại giao dịch không hợp lệ!"
        )
    
    if transaction_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Số tiền phải lớn hơn 0!"
        )
    
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = models.Wallet(user_id=current_user.id, balance=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    # Vô hiệu hóa VietQR
    if transaction_data.payment_method == "VietQR":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phương thức VietQR không còn được hỗ trợ. Vui lòng chọn VNPay!"
        )
        
    is_vnpay = transaction_data.payment_method == "VNPay"
    
    # Tạo bản ghi giao dịch nạp tiền
    transaction = models.Transaction(
        user_id=current_user.id,
        wallet_id=wallet.id,
        amount=transaction_data.amount,
        transaction_type="deposit",
        payment_method=transaction_data.payment_method,
        description=transaction_data.description or f"Nạp tiền qua {transaction_data.payment_method}",
        status="pending" if is_vnpay else "completed",
        product_id=transaction_data.product_id
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    if is_vnpay:
        # Lấy base URL cho Return URL
        vnp_ipn_url = os.getenv("VNP_IPN_URL")
        if vnp_ipn_url:
            backend_base = vnp_ipn_url.split("/api/")[0]
        else:
            backend_base = os.getenv("BACKEND_URL", str(request.base_url).rstrip("/"))
        return_url = f"{backend_base}/api/payment/vnpay-return"
        
        # Tạo thông tin thanh toán VNPAY
        txn_ref = f"DEP{transaction.id}"
        order_info = f"Nap tien vao vi tai khoan {current_user.username}"
        ip_addr = request.client.host if request.client else "127.0.0.1"
        
        try:
            payment_url = vnpay_client.get_payment_url(
                return_url=return_url,
                txn_ref=txn_ref,
                amount=transaction.amount,
                ip_addr=ip_addr,
                order_info=order_info
            )
            return {
                "status": "success",
                "message": "Tạo cổng thanh toán VNPAY thành công!",
                "payment_url": payment_url,
                "transaction_id": transaction.id,
                "new_balance": wallet.balance
            }
        except Exception as e:
            transaction.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi khởi tạo cổng thanh toán VNPAY: {str(e)}"
            )
    else:
        # Cập nhật số dư nếu không dùng VNPay (các cổng instant khác)
        wallet.balance += transaction_data.amount
        wallet.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "status": "success",
            "message": "Nạp tiền thành công!",
            "transaction_id": transaction.id,
            "new_balance": wallet.balance
        }

@router.post("/withdraw", status_code=status.HTTP_201_CREATED)
def withdraw_money(
    transaction_data: TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if transaction_data.transaction_type != "withdraw":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Loại giao dịch không hợp lệ!"
        )
    
    if transaction_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Số tiền phải lớn hơn 0!"
        )
    
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet or wallet.balance < transaction_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Số dư không đủ!"
        )
    
    # Create transaction record
    transaction = models.Transaction(
        user_id=current_user.id,
        wallet_id=wallet.id,
        amount=transaction_data.amount,
        transaction_type="withdraw",
        payment_method=transaction_data.payment_method,
        description=transaction_data.description or f"Rút tiền qua {transaction_data.payment_method}",
        status="pending"  # Withdrawals need admin approval
    )
    db.add(transaction)
    
    # Hold the amount (don't deduct yet until approved)
    wallet.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "status": "success",
        "message": "Yêu cầu rút tiền đã được gửi và đang chờ xử lý!",
        "transaction_id": transaction.id
    }

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
    limit: int = 50
):
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "amount": t.amount,
            "transaction_type": t.transaction_type,
            "payment_method": t.payment_method,
            "description": t.description,
            "status": t.status,
            "product_id": t.product_id,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in transactions
    ]

@router.post("/payment/{product_id}")
def pay_for_auction(
    product_id: int,
    payment_method: str = "wallet",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Phương thức thanh toán trực tiếp qua Ví/VietQR đã bị vô hiệu hóa. Vui lòng thanh toán trực tiếp qua VNPAY."
    )