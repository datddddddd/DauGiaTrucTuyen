import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime

import database, models
from routers.auth import get_current_user
from schemas.payment import PaymentCreate, PaymentResponse, PaymentURLResponse
from payment.vnpay import VNPay

router = APIRouter(prefix="/api/payment", tags=["Payment"])

# Load VNPAY settings from environment
VNP_TMN_CODE = os.getenv("VNP_TMN_CODE", "RWYGRHCA")
VNP_HASH_SECRET = os.getenv("VNP_HASH_SECRET", "11ZP25T3EE3HWAFYLL7PVEZ3B985CDQF")
VNP_URL = os.getenv("VNP_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Initialize VNPAY helper
vnpay_client = VNPay(tmn_code=VNP_TMN_CODE, hash_secret=VNP_HASH_SECRET, payment_url=VNP_URL)

@router.post("/create", response_model=PaymentURLResponse)
def create_payment(
    payment_data: PaymentCreate,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Verify logged-in user matches user_id in payload
    if payment_data.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản không trùng khớp với yêu cầu thanh toán!"
        )

    # Check if the product exists
    product = db.query(models.Product).filter(models.Product.id == payment_data.auction_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sản phẩm không tồn tại!"
        )

    # Check if product is in payable status
    if product.status not in ["ended", "pending_payment"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phiên đấu giá sản phẩm này không ở trạng thái cần thanh toán!"
        )

    # Check if the user is the winner
    highest_bid = db.query(models.Bid).filter(
        models.Bid.product_id == product.id
    ).order_by(models.Bid.bid_amount.desc()).first()

    if not highest_bid or highest_bid.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không phải là người thắng giải đấu giá sản phẩm này!"
        )

    # Ensure amount matches the final price
    if payment_data.amount != product.current_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số tiền thanh toán không khớp với giá trị trúng thầu!"
        )

    # Create Payment record
    payment = models.Payment(
        user_id=current_user.id,
        auction_id=product.id,
        amount=payment_data.amount,
        status="PENDING",
        payment_method="VNPAY"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Construct the Return URL dynamically
    vnp_ipn_url = os.getenv("VNP_IPN_URL")
    if vnp_ipn_url:
        backend_base = vnp_ipn_url.split("/api/")[0]
    else:
        backend_base = os.getenv("BACKEND_URL", str(request.base_url).rstrip("/"))
    return_url = f"{backend_base}/api/payment/vnpay-return"

    # Generate VNPAY url
    txn_ref = payment.id
    order_info = f"Thanh toan VNPAY don hang #{product.id} - {product.title}"
    ip_addr = request.client.host if request.client else "127.0.0.1"

    try:
        payment_url = vnpay_client.get_payment_url(
            return_url=return_url,
            txn_ref=txn_ref,
            amount=payment.amount,
            ip_addr=ip_addr,
            order_info=order_info
        )
        return {"payment_url": payment_url}
    except Exception as e:
        payment.status = "FAILED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khởi tạo cổng thanh toán VNPAY: {str(e)}"
        )


@router.get("/vnpay-return")
def vnpay_return(request: Request, db: Session = Depends(database.get_db)):
    # Parse query parameters to dict
    params = dict(request.query_params)
    
    # Verify VNPAY signature
    if not vnpay_client.verify_payment(params):
        return RedirectResponse(
            url=f"{FRONTEND_URL}/payment-result?status=FAILED&message=InvalidChecksum"
        )

    txn_ref = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")
    transaction_no = params.get("vnp_TransactionNo")
    amount = int(params.get("vnp_Amount", 0)) // 100

    if not txn_ref:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/payment-result?status=FAILED&message=MissingTransactionReference"
        )

    payment = db.query(models.Payment).filter(models.Payment.id == int(txn_ref)).first()
    if not payment:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/payment-result?status=FAILED&message=PaymentRecordNotFound"
        )

    # Save VNPAY transaction log (if not exists)
    vnp_tx = db.query(models.VNPTransaction).filter(models.VNPTransaction.payment_id == payment.id).first()
    if not vnp_tx:
        vnp_tx = models.VNPTransaction(
            payment_id=payment.id,
            vnp_transaction_no=transaction_no,
            bank_code=params.get("vnp_BankCode"),
            card_type=params.get("vnp_CardType"),
            response_code=response_code,
            transaction_date=params.get("vnp_PayDate")
        )
        db.add(vnp_tx)
        db.flush()

    # Check if payment is successful
    if response_code == "00":
        # Process transaction if it was pending
        if payment.status == "PENDING":
            payment.status = "SUCCESS"
            payment.transaction_id = transaction_no
            payment.updated_at = datetime.utcnow()

            # Update product status
            product = db.query(models.Product).filter(models.Product.id == payment.auction_id).first()
            if product:
                product.status = "confirmed"

            # Log standard wallet Transaction for wallet history
            wallet = db.query(models.Wallet).filter(models.Wallet.user_id == payment.user_id).first()
            if not wallet:
                wallet = models.Wallet(user_id=payment.user_id, balance=0)
                db.add(wallet)
                db.flush()

            transaction = models.Transaction(
                user_id=payment.user_id,
                wallet_id=wallet.id,
                amount=payment.amount,
                transaction_type="payment",
                payment_method="VNPAY",
                description=f"Thanh toán VNPAY cho sản phẩm: {product.title if product else 'Sản phẩm'}",
                status="completed",
                product_id=payment.auction_id
            )
            db.add(transaction)

            # Notifications
            if product:
                # To buyer (winner)
                winner_notif = models.Notification(
                    user_id=payment.user_id,
                    title="💳 Thanh toán VNPAY thành công!",
                    message=f"Đơn hàng của bạn cho sản phẩm '{product.title}' đã được thanh toán thành công qua VNPAY.",
                    notification_type="system",
                    product_id=product.id,
                    is_read=False
                )
                db.add(winner_notif)

                # To seller
                if product.seller_id:
                    seller_notif = models.Notification(
                        user_id=product.seller_id,
                        title="💰 Đơn hàng đã được thanh toán!",
                        message=f"Sản phẩm '{product.title}' của bạn đã được thanh toán bởi người mua qua VNPAY. Hãy chuẩn bị giao hàng.",
                        notification_type="system",
                        product_id=product.id,
                        is_read=False
                    )
                    db.add(seller_notif)

            db.commit()

        return RedirectResponse(
            url=f"{FRONTEND_URL}/payment-result?status=SUCCESS&amount={amount}&txn_ref={txn_ref}"
        )
    else:
        # Payment failed
        if payment.status == "PENDING":
            payment.status = "FAILED"
            payment.updated_at = datetime.utcnow()
            db.commit()

        return RedirectResponse(
            url=f"{FRONTEND_URL}/payment-result?status=FAILED&response_code={response_code}"
        )


@router.get("/vnpay-ipn")
def vnpay_ipn(request: Request, db: Session = Depends(database.get_db)):
    # Parse parameters
    params = dict(request.query_params)
    
    # Verify checksum
    if not vnpay_client.verify_payment(params):
        return {"RspCode": "97", "Message": "Invalid Signature"}

    txn_ref = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")
    transaction_no = params.get("vnp_TransactionNo")

    if not txn_ref:
        return {"RspCode": "01", "Message": "Order not found"}

    payment = db.query(models.Payment).filter(models.Payment.id == int(txn_ref)).first()
    if not payment:
        return {"RspCode": "01", "Message": "Order not found"}

    # Save VNPAY transaction log (if not exists)
    vnp_tx = db.query(models.VNPTransaction).filter(models.VNPTransaction.payment_id == payment.id).first()
    if not vnp_tx:
        vnp_tx = models.VNPTransaction(
            payment_id=payment.id,
            vnp_transaction_no=transaction_no,
            bank_code=params.get("vnp_BankCode"),
            card_type=params.get("vnp_CardType"),
            response_code=response_code,
            transaction_date=params.get("vnp_PayDate")
        )
        db.add(vnp_tx)
        db.flush()

    # If the payment was already processed
    if payment.status != "PENDING":
        return {"RspCode": "02", "Message": "Order already confirmed"}

    # Process status update
    if response_code == "00":
        payment.status = "SUCCESS"
        payment.transaction_id = transaction_no
        payment.updated_at = datetime.utcnow()

        # Update product status
        product = db.query(models.Product).filter(models.Product.id == payment.auction_id).first()
        if product:
            product.status = "confirmed"

        # Log standard wallet Transaction
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == payment.user_id).first()
        if not wallet:
            wallet = models.Wallet(user_id=payment.user_id, balance=0)
            db.add(wallet)
            db.flush()

        transaction = models.Transaction(
            user_id=payment.user_id,
            wallet_id=wallet.id,
            amount=payment.amount,
            transaction_type="payment",
            payment_method="VNPAY",
            description=f"Thanh toán VNPAY cho sản phẩm: {product.title if product else 'Sản phẩm'}",
            status="completed",
            product_id=payment.auction_id
        )
        db.add(transaction)

        # Notifications
        if product:
            winner_notif = models.Notification(
                user_id=payment.user_id,
                title="💳 Thanh toán VNPAY thành công!",
                message=f"Đơn hàng của bạn cho sản phẩm '{product.title}' đã được thanh toán thành công qua VNPAY (IPN).",
                notification_type="system",
                product_id=product.id,
                is_read=False
            )
            db.add(winner_notif)

            if product.seller_id:
                seller_notif = models.Notification(
                    user_id=product.seller_id,
                    title="💰 Đơn hàng đã được thanh toán!",
                    message=f"Sản phẩm '{product.title}' của bạn đã được thanh toán bởi người mua qua VNPAY (IPN). Hãy chuẩn bị giao hàng.",
                    notification_type="system",
                    product_id=product.id,
                    is_read=False
                )
                db.add(seller_notif)

        db.commit()
        return {"RspCode": "00", "Message": "Confirm Success"}
    else:
        payment.status = "FAILED"
        payment.updated_at = datetime.utcnow()
        db.commit()
        return {"RspCode": "00", "Message": "Confirm Success"}
