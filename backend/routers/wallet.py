from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import string
from datetime import datetime

import database, models
from schemas.wallet import WalletResponse, TransactionCreate, TransactionResponse
from routers.auth import get_current_user

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
    
    # Create transaction record
    transaction = models.Transaction(
        user_id=current_user.id,
        wallet_id=wallet.id,
        amount=transaction_data.amount,
        transaction_type="deposit",
        payment_method=transaction_data.payment_method,
        description=transaction_data.description or f"Nạp tiền qua {transaction_data.payment_method}",
        status="completed"  # In production, this would be "pending" until payment gateway confirms
    )
    db.add(transaction)
    
    # Update wallet balance
    wallet.balance += transaction_data.amount
    wallet.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(transaction)
    
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
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in transactions
    ]

@router.post("/payment/{product_id}")
def pay_for_auction(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check if user won the auction
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sản phẩm không tồn tại!")
    
    if product.status != "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phiên đấu giá chưa kết thúc!")
    
    # Get highest bid
    highest_bid = db.query(models.Bid).filter(
        models.Bid.product_id == product_id
    ).order_by(models.Bid.bid_amount.desc()).first()
    
    if not highest_bid or highest_bid.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Bạn không phải là người thắng cuộc của phiên đấu giá này!"
        )
    
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet or wallet.balance < product.current_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Số dư không đủ để thanh toán!"
        )
    
    # Create payment transaction
    transaction = models.Transaction(
        user_id=current_user.id,
        wallet_id=wallet.id,
        amount=product.current_price,
        transaction_type="payment",
        description=f"Thanh toán sản phẩm: {product.title}",
        status="completed"
    )
    db.add(transaction)
    
    # Deduct from wallet
    wallet.balance -= product.current_price
    wallet.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Thanh toán thành công!",
        "new_balance": wallet.balance
    }